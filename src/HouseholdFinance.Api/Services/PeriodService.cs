using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Periods;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IPeriodService
{
    Task<IReadOnlyList<FinancialPeriodDto>> GetPeriodsAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<FinancialPeriodDto> CreateAsync(Guid householdId, string userId, CreatePeriodRequest request, CancellationToken ct = default);
    Task<FinancialPeriodDto> GetAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<FinancialPeriodDto> CloseAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<FinancialPeriodDto> ReopenAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
}

public sealed class PeriodService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : IPeriodService
{
    public async Task<IReadOnlyList<FinancialPeriodDto>> GetPeriodsAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        return await db.FinancialPeriods.AsNoTracking()
            .Where(p => p.HouseholdId == householdId)
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
            .Select(p => Map(p))
            .ToListAsync(ct);
    }

    public async Task<FinancialPeriodDto> CreateAsync(Guid householdId, string userId, CreatePeriodRequest request, CancellationToken ct = default)
    {
        await access.RequireManagePeriodsAsync(householdId, userId, ct);

        if (request.Month is < 1 or > 12)
            throw new BusinessException("Mes inválido.");

        if (await db.FinancialPeriods.AnyAsync(p => p.HouseholdId == householdId && p.Year == request.Year && p.Month == request.Month, ct))
            throw new ConflictException("Ya existe un período para ese año y mes.");

        var (start, end) = PeriodHelper.GetMonthRange(request.Year, request.Month);
        var period = new FinancialPeriod
        {
            Id = Guid.NewGuid(),
            HouseholdId = householdId,
            Year = request.Year,
            Month = request.Month,
            StartDate = start,
            EndDate = end,
            Status = PeriodStatus.Open,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.FinancialPeriods.Add(period);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Create", nameof(FinancialPeriod), period.Id.ToString(), newValues: $"{request.Year}-{request.Month:D2}");
        return Map(period);
    }

    public async Task<FinancialPeriodDto> GetAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var period = await db.FinancialPeriods.AsNoTracking().FirstOrDefaultAsync(p => p.Id == periodId && p.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Período no encontrado.");
        return Map(period);
    }

    public async Task<FinancialPeriodDto> CloseAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireManagePeriodsAsync(householdId, userId, ct);
        var period = await access.RequirePeriodAsync(householdId, periodId, ct);

        if (period.Status == PeriodStatus.Closed)
            throw new ConflictException("El período ya está cerrado.");

        period.Status = PeriodStatus.Closed;
        period.ClosedAtUtc = DateTime.UtcNow;
        period.ClosedByUserId = userId;
        period.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Close", nameof(FinancialPeriod), periodId.ToString());
        return Map(period);
    }

    public async Task<FinancialPeriodDto> ReopenAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireManagePeriodsAsync(householdId, userId, ct);
        var period = await access.RequirePeriodAsync(householdId, periodId, ct);

        if (period.Status != PeriodStatus.Closed)
            throw new ConflictException("Solo se pueden reabrir períodos cerrados.");

        period.Status = PeriodStatus.Open;
        period.ClosedAtUtc = null;
        period.ClosedByUserId = null;
        period.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Reopen", nameof(FinancialPeriod), periodId.ToString());
        return Map(period);
    }

    private static FinancialPeriodDto Map(FinancialPeriod p) =>
        new(p.Id, p.Year, p.Month, p.StartDate, p.EndDate, p.Status, p.CreatedAtUtc, p.ClosedAtUtc);
}
