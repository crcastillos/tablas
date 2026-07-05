using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Budgets;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IBudgetService
{
    Task<BudgetSummaryDto> GetAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<BudgetSummaryDto> UpsertAsync(Guid householdId, Guid periodId, string userId, UpsertBudgetRequest request, CancellationToken ct = default);
    Task<BudgetSummaryDto> GenerateFromRecurringAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
}

public sealed class BudgetService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit, ICategoryService categoryService) : IBudgetService
{
    public async Task<BudgetSummaryDto> GetAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        await access.RequirePeriodAsync(householdId, periodId, ct);
        await categoryService.SeedDefaultCategoriesAsync(householdId, ct);
        return await BuildSummaryAsync(householdId, periodId, ct);
    }

    public async Task<BudgetSummaryDto> UpsertAsync(Guid householdId, Guid periodId, string userId, UpsertBudgetRequest request, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        await access.RequireOpenPeriodAsync(householdId, periodId, ct);
        if (request.Lines.Any(l => l.BudgetedAmount < 0)) throw new BusinessException("No se permiten montos negativos.");

        var incomes = await db.Incomes.AsNoTracking().Where(i => i.PeriodId == periodId).ToListAsync(ct);
        var totalEstimated = FinancialCalculator.TotalEstimatedIncome(incomes);
        var totalBudgeted = request.Lines.Sum(l => l.BudgetedAmount);
        var exceeds = totalBudgeted > totalEstimated;
        if (exceeds && !request.ConfirmExceedsIncome) throw new ConflictException("El presupuesto supera el ingreso estimado.");

        var budget = await db.MonthlyBudgets.Include(b => b.Lines).FirstOrDefaultAsync(b => b.PeriodId == periodId, ct);
        if (budget is null)
        {
            budget = new MonthlyBudget { Id = Guid.NewGuid(), PeriodId = periodId, CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow, ExceedsIncomeConfirmed = exceeds && request.ConfirmExceedsIncome };
            db.MonthlyBudgets.Add(budget);
        }
        else
        {
            if (request.RowVersion is not null && !budget.RowVersion.SequenceEqual(request.RowVersion))
                throw new ConflictException("Conflicto de concurrencia en el presupuesto.");
            db.BudgetLines.RemoveRange(budget.Lines);
            budget.UpdatedAtUtc = DateTime.UtcNow;
            budget.ExceedsIncomeConfirmed = exceeds && request.ConfirmExceedsIncome;
        }

        foreach (var input in request.Lines.Where(l => l.BudgetedAmount > 0))
        {
            budget.Lines.Add(new BudgetLine { Id = Guid.NewGuid(), MonthlyBudgetId = budget.Id, CategoryId = input.CategoryId, BudgetedAmount = input.BudgetedAmount, Notes = input.Notes?.Trim() });
        }
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Upsert", nameof(MonthlyBudget), budget.Id.ToString());
        return await BuildSummaryAsync(householdId, periodId, ct);
    }

    public async Task<BudgetSummaryDto> GenerateFromRecurringAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        await access.RequireOpenPeriodAsync(householdId, periodId, ct);
        var recurring = await db.RecurringExpenses.Where(r => r.HouseholdId == householdId && r.IsActive && r.AutoGenerateInBudget).ToListAsync(ct);
        var budget = await db.MonthlyBudgets.Include(b => b.Lines).FirstOrDefaultAsync(b => b.PeriodId == periodId, ct);
        if (budget is null)
        {
            budget = new MonthlyBudget { Id = Guid.NewGuid(), PeriodId = periodId, CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow };
            db.MonthlyBudgets.Add(budget);
        }

        foreach (var item in recurring.Where(item => budget.Lines.All(l => l.RecurringExpenseId != item.Id)))
        {
            budget.Lines.Add(new BudgetLine
            {
                Id = Guid.NewGuid(), MonthlyBudgetId = budget.Id, CategoryId = item.CategoryId,
                BudgetedAmount = item.EstimatedAmount, CommittedAmount = item.EstimatedAmount,
                RecurringExpenseId = item.Id, Notes = $"Generado desde {item.Name}"
            });
        }
        budget.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await BuildSummaryAsync(householdId, periodId, ct);
    }

    private async Task<BudgetSummaryDto> BuildSummaryAsync(Guid householdId, Guid periodId, CancellationToken ct)
    {
        var incomes = await db.Incomes.AsNoTracking().Where(i => i.PeriodId == periodId).ToListAsync(ct);
        var expenses = await db.Expenses.AsNoTracking().Where(e => e.PeriodId == periodId).ToListAsync(ct);
        var categories = await db.ExpenseCategories.AsNoTracking().Where(c => c.HouseholdId == householdId && c.IsActive).ToListAsync(ct);
        var budget = await db.MonthlyBudgets.AsNoTracking().Include(b => b.Lines).FirstOrDefaultAsync(b => b.PeriodId == periodId, ct);
        var totalEstimated = FinancialCalculator.TotalEstimatedIncome(incomes);
        var totalReceived = FinancialCalculator.TotalReceivedIncome(incomes);
        var totalSpent = FinancialCalculator.TotalConfirmedExpenses(expenses);
        var totalPending = FinancialCalculator.TotalPendingExpenses(expenses);
        var totalBudgeted = budget?.Lines.Sum(l => l.BudgetedAmount) ?? 0;

        var lines = categories.Select(c =>
        {
            var bl = budget?.Lines.FirstOrDefault(l => l.CategoryId == c.Id);
            var spent = expenses.Where(e => e.CategoryId == c.Id && e.Status == ExpenseStatus.Confirmed).Sum(e => e.Amount);
            var committed = expenses.Where(e => e.CategoryId == c.Id && e.Status == ExpenseStatus.Pending).Sum(e => e.Amount) + (bl?.CommittedAmount ?? 0);
            var budgeted = bl?.BudgetedAmount ?? 0;
            return new BudgetLineDto(bl?.Id ?? Guid.Empty, c.Id, c.Name, c.Icon, c.Color, budgeted, committed, spent,
                budgeted - spent, FinancialCalculator.ConsumedPercentage(budgeted, spent), bl?.Notes, bl is not null);
        }).ToList();

        var assignedPct = totalEstimated <= 0 ? 0 : Math.Round(totalBudgeted / totalEstimated * 100, 2);
        return new BudgetSummaryDto(totalEstimated, totalReceived, totalBudgeted, totalSpent, totalPending,
            totalEstimated - totalSpent, totalReceived - totalSpent, totalBudgeted - totalSpent, assignedPct,
            totalBudgeted > totalEstimated, budget?.ExceedsIncomeConfirmed ?? false, budget?.RowVersion, lines);
    }
}
