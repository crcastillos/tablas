using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Reports;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IDashboardService { Task<DashboardDto> GetDashboardAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default); }
public interface IReportService
{
    Task<BudgetVsActualReportDto> GetBudgetVsActualAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<CategoryReportDto> GetByCategoryAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<CashFlowReportDto> GetCashFlowAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<MonthlyComparisonReportDto> GetMonthlyComparisonAsync(Guid householdId, string userId, int months = 6, CancellationToken ct = default);
}

public sealed class DashboardService(ApplicationDbContext db, IHouseholdAccessService access, IBudgetService budgetService) : IDashboardService
{
    public async Task<DashboardDto> GetDashboardAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var period = await access.RequirePeriodAsync(householdId, periodId, ct);
        var summary = await budgetService.GetAsync(householdId, periodId, userId, ct);
        var expenses = await db.Expenses.AsNoTracking().Where(e => e.PeriodId == periodId && e.Status != ExpenseStatus.Cancelled).ToListAsync(ct);
        var top = summary.Lines.Where(l => l.SpentAmount > 0).OrderByDescending(l => l.SpentAmount).Take(5)
            .Select(l => new CategorySpendingDto(l.CategoryId, l.CategoryName, l.Color, l.BudgetedAmount, l.SpentAmount, l.ConsumedPercentage)).ToList();
        var exceeded = summary.Lines.Where(l => l.BudgetedAmount > 0 && l.SpentAmount > l.BudgetedAmount)
            .Select(l => new CategorySpendingDto(l.CategoryId, l.CategoryName, l.Color, l.BudgetedAmount, l.SpentAmount, l.ConsumedPercentage)).ToList();
        var upcoming = await db.RecurringExpenses.AsNoTracking().Where(r => r.HouseholdId == householdId && r.IsActive).Include(r => r.Category).Take(5)
            .Select(r => new UpcomingPaymentDto(r.Id, r.Name, r.EstimatedAmount, r.ExpectedPaymentDay, r.Category.Name)).ToListAsync(ct);
        var weekly = expenses.Where(e => e.Status == ExpenseStatus.Confirmed).GroupBy(e => (e.MovementDate.Day - 1) / 7 + 1)
            .Select(g => new WeeklySpendingDto(g.Key, g.Sum(x => x.Amount))).OrderBy(w => w.WeekNumber).ToList();
        var recent = expenses.OrderByDescending(e => e.MovementDate).Take(10)
            .Select(e => new RecentMovementDto(e.Id, e.Description, e.Amount, e.MovementDate, e.Status.ToString(), e.MovementType.ToString())).ToList();
        var utilization = summary.TotalBudgeted <= 0 ? 0 : Math.Round(summary.TotalSpent / summary.TotalBudgeted * 100, 2);
        return new DashboardDto(periodId, period.Year, period.Month, period.Status.ToString(), summary.TotalEstimatedIncome,
            summary.TotalReceivedIncome, summary.TotalBudgeted, summary.TotalSpent, summary.TotalPending,
            summary.EstimatedCashBalance, summary.RealCashBalance, utilization, top, exceeded, upcoming, weekly, recent, null);
    }
}

public sealed class ReportService(ApplicationDbContext db, IHouseholdAccessService access, IBudgetService budgetService) : IReportService
{
    public async Task<BudgetVsActualReportDto> GetBudgetVsActualAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var summary = await budgetService.GetAsync(householdId, periodId, userId, ct);
        var lines = summary.Lines.Where(l => l.HasBudget || l.SpentAmount > 0)
            .Select(l => new BudgetLineReportDto(l.CategoryName, l.BudgetedAmount, l.SpentAmount, l.BudgetedAmount - l.SpentAmount, l.ConsumedPercentage)).ToList();
        return new BudgetVsActualReportDto(lines, summary.TotalBudgeted, summary.TotalSpent, summary.TotalBudgeted - summary.TotalSpent);
    }

    public async Task<CategoryReportDto> GetByCategoryAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var summary = await budgetService.GetAsync(householdId, periodId, userId, ct);
        var categories = summary.Lines.Where(l => l.SpentAmount > 0)
            .Select(l => new CategorySpendingDto(l.CategoryId, l.CategoryName, l.Color, l.BudgetedAmount, l.SpentAmount, l.ConsumedPercentage)).ToList();
        return new CategoryReportDto(categories, categories.Sum(c => c.Spent));
    }

    public async Task<CashFlowReportDto> GetCashFlowAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var incomes = await db.Incomes.AsNoTracking().Where(i => i.PeriodId == periodId && i.Status == IncomeStatus.Received).ToListAsync(ct);
        var expenses = await db.Expenses.AsNoTracking().Where(e => e.PeriodId == periodId && e.Status == ExpenseStatus.Confirmed).ToListAsync(ct);
        var totalIncome = incomes.Sum(i => i.ReceivedAmount);
        var totalExpenses = expenses.Sum(e => e.Amount);
        return new CashFlowReportDto(0, totalIncome, totalExpenses, totalIncome - totalExpenses, []);
    }

    public async Task<MonthlyComparisonReportDto> GetMonthlyComparisonAsync(Guid householdId, string userId, int months = 6, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var periods = await db.FinancialPeriods.AsNoTracking().Where(p => p.HouseholdId == householdId)
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month).Take(months).ToListAsync(ct);
        var result = new List<MonthlyComparisonItemDto>();
        foreach (var period in periods.OrderBy(p => p.Year).ThenBy(p => p.Month))
        {
            var summary = await budgetService.GetAsync(householdId, period.Id, userId, ct);
            result.Add(new MonthlyComparisonItemDto(period.Year, period.Month, summary.TotalEstimatedIncome, summary.TotalReceivedIncome, summary.TotalBudgeted, summary.TotalSpent));
        }
        return new MonthlyComparisonReportDto(result);
    }
}
