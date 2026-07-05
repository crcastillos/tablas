using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IAuditService
{
    Task LogAsync(Guid? householdId, string userId, string action, string entityName, string entityId, string? oldValues = null, string? newValues = null, CancellationToken ct = default);
}

public sealed class AuditService(ApplicationDbContext db) : IAuditService
{
    public async Task LogAsync(Guid? householdId, string userId, string action, string entityName, string entityId, string? oldValues = null, string? newValues = null, CancellationToken ct = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            HouseholdId = householdId,
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            CreatedAtUtc = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
    }
}

public interface IHouseholdAccessService
{
    Task<HouseholdMember> RequireMembershipAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<HouseholdMember> RequireOwnerAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task RequireManageMembersAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task RequireManagePeriodsAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<FinancialPeriod> RequireOpenPeriodAsync(Guid householdId, Guid periodId, CancellationToken ct = default);
    Task<FinancialPeriod> RequirePeriodAsync(Guid householdId, Guid periodId, CancellationToken ct = default);
    void EnsurePeriodWritable(FinancialPeriod period);
}

public sealed class HouseholdAccessService(ApplicationDbContext db) : IHouseholdAccessService
{
    public async Task<HouseholdMember> RequireMembershipAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        var member = await db.HouseholdMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.HouseholdId == householdId && m.UserId == userId && m.IsActive, ct)
            ?? throw new ForbiddenException("No pertenece a este hogar.");

        return member;
    }

    public async Task<HouseholdMember> RequireOwnerAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        var member = await RequireMembershipAsync(householdId, userId, ct);
        if (member.Role != HouseholdRole.Owner)
            throw new ForbiddenException("Se requiere rol de propietario.");

        return member;
    }

    public async Task RequireManageMembersAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        var member = await RequireMembershipAsync(householdId, userId, ct);
        if (member.Role != HouseholdRole.Owner && !member.CanManageMembers)
            throw new ForbiddenException("No tiene permiso para administrar integrantes.");
    }

    public async Task RequireManagePeriodsAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        var member = await RequireMembershipAsync(householdId, userId, ct);
        if (member.Role != HouseholdRole.Owner && !member.CanManagePeriods)
            throw new ForbiddenException("No tiene permiso para administrar períodos.");
    }

    public async Task<FinancialPeriod> RequirePeriodAsync(Guid householdId, Guid periodId, CancellationToken ct = default)
    {
        return await db.FinancialPeriods
            .FirstOrDefaultAsync(p => p.Id == periodId && p.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Período no encontrado.");
    }

    public async Task<FinancialPeriod> RequireOpenPeriodAsync(Guid householdId, Guid periodId, CancellationToken ct = default)
    {
        var period = await RequirePeriodAsync(householdId, periodId, ct);
        EnsurePeriodWritable(period);
        return period;
    }

    public void EnsurePeriodWritable(FinancialPeriod period)
    {
        if (period.Status == PeriodStatus.Closed)
            throw new ConflictException("El período está cerrado y es de solo lectura.");
    }
}

public static class PeriodHelper
{
    public static (DateOnly Start, DateOnly End) GetMonthRange(int year, int month)
    {
        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1).AddDays(-1);
        return (start, end);
    }
}

public static class FinancialCalculator
{
    public static decimal TotalEstimatedIncome(IEnumerable<Income> incomes) =>
        incomes.Where(i => i.Status != IncomeStatus.Cancelled).Sum(i => i.EstimatedAmount);

    public static decimal TotalReceivedIncome(IEnumerable<Income> incomes) =>
        incomes.Where(i => i.Status == IncomeStatus.Received).Sum(i => i.ReceivedAmount);

    public static decimal TotalConfirmedExpenses(IEnumerable<Expense> expenses) =>
        expenses.Where(e => e.Status == ExpenseStatus.Confirmed).Sum(e => e.Amount);

    public static decimal TotalPendingExpenses(IEnumerable<Expense> expenses) =>
        expenses.Where(e => e.Status == ExpenseStatus.Pending).Sum(e => e.Amount);

    public static decimal ConsumedPercentage(decimal budgeted, decimal spent) =>
        budgeted <= 0 ? (spent > 0 ? 100 : 0) : Math.Round(spent / budgeted * 100, 2);
}
