using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Incomes;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IIncomeService
{
    Task<IReadOnlyList<IncomeTypeDto>> GetIncomeTypesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<IncomeDto>> GetIncomesAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default);
    Task<IncomeDto> CreateAsync(Guid householdId, Guid periodId, string userId, CreateIncomeRequest request, CancellationToken ct = default);
    Task<IncomeDto> UpdateAsync(Guid householdId, Guid incomeId, string userId, UpdateIncomeRequest request, CancellationToken ct = default);
    Task<IncomeDto> ReceiveAsync(Guid householdId, Guid incomeId, string userId, ReceiveIncomeRequest request, CancellationToken ct = default);
    Task<IncomeDto> CancelAsync(Guid householdId, Guid incomeId, string userId, CancelIncomeRequest request, CancellationToken ct = default);
}

public sealed class IncomeService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : IIncomeService
{
    public async Task<IReadOnlyList<IncomeTypeDto>> GetIncomeTypesAsync(CancellationToken ct = default) =>
        await db.IncomeTypes.AsNoTracking().Where(t => t.IsActive).OrderBy(t => t.SortOrder)
            .Select(t => new IncomeTypeDto(t.Id, t.Code, t.Name)).ToListAsync(ct);

    public async Task<IReadOnlyList<IncomeDto>> GetIncomesAsync(Guid householdId, Guid periodId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        await access.RequirePeriodAsync(householdId, periodId, ct);
        return await db.Incomes.AsNoTracking().Where(i => i.HouseholdId == householdId && i.PeriodId == periodId)
            .Include(i => i.IncomeType).OrderByDescending(i => i.CreatedAtUtc).Select(i => Map(i)).ToListAsync(ct);
    }

    public async Task<IncomeDto> CreateAsync(Guid householdId, Guid periodId, string userId, CreateIncomeRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var period = await access.RequireOpenPeriodAsync(householdId, periodId, ct);
        ValidateAmount(request.EstimatedAmount);
        if (!await db.IncomeTypes.AnyAsync(t => t.Id == request.IncomeTypeId && t.IsActive, ct))
            throw new NotFoundException("Tipo de ingreso no válido.");

        var income = new Income
        {
            Id = Guid.NewGuid(), HouseholdId = householdId, PeriodId = period.Id, IncomeTypeId = request.IncomeTypeId,
            Description = request.Description.Trim(), EstimatedAmount = request.EstimatedAmount, ExpectedDate = request.ExpectedDate,
            SourcePerson = request.SourcePerson?.Trim(), IsRecurring = request.IsRecurring, Notes = request.Notes?.Trim(),
            CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow
        };
        db.Incomes.Add(income);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Create", nameof(Income), income.Id.ToString());
        return await GetDtoAsync(income.Id, ct);
    }

    public async Task<IncomeDto> UpdateAsync(Guid householdId, Guid incomeId, string userId, UpdateIncomeRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var income = await db.Incomes.Include(i => i.Period).FirstOrDefaultAsync(i => i.Id == incomeId && i.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Ingreso no encontrado.");
        access.EnsurePeriodWritable(income.Period);
        if (income.Status == IncomeStatus.Cancelled) throw new ConflictException("No se puede editar un ingreso anulado.");
        ValidateAmount(request.EstimatedAmount);
        income.IncomeTypeId = request.IncomeTypeId;
        income.Description = request.Description.Trim();
        income.EstimatedAmount = request.EstimatedAmount;
        income.ExpectedDate = request.ExpectedDate;
        income.SourcePerson = request.SourcePerson?.Trim();
        income.IsRecurring = request.IsRecurring;
        income.Notes = request.Notes?.Trim();
        income.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await GetDtoAsync(incomeId, ct);
    }

    public async Task<IncomeDto> ReceiveAsync(Guid householdId, Guid incomeId, string userId, ReceiveIncomeRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var income = await db.Incomes.Include(i => i.Period).FirstOrDefaultAsync(i => i.Id == incomeId && i.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Ingreso no encontrado.");
        access.EnsurePeriodWritable(income.Period);
        ValidateAmount(request.ReceivedAmount);
        income.ReceivedAmount = request.ReceivedAmount;
        income.ReceivedDate = request.ReceivedDate;
        income.Status = IncomeStatus.Received;
        income.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await GetDtoAsync(incomeId, ct);
    }

    public async Task<IncomeDto> CancelAsync(Guid householdId, Guid incomeId, string userId, CancelIncomeRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var income = await db.Incomes.Include(i => i.Period).FirstOrDefaultAsync(i => i.Id == incomeId && i.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Ingreso no encontrado.");
        access.EnsurePeriodWritable(income.Period);
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new BusinessException("Se requiere motivo de anulación.");
        income.Status = IncomeStatus.Cancelled;
        income.CancellationReason = request.Reason.Trim();
        income.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await GetDtoAsync(incomeId, ct);
    }

    private static void ValidateAmount(decimal amount)
    {
        if (amount <= 0) throw new BusinessException("El monto debe ser mayor que cero.");
        if (decimal.Round(amount, 2) != amount) throw new BusinessException("El monto admite máximo dos decimales.");
    }

    private async Task<IncomeDto> GetDtoAsync(Guid id, CancellationToken ct)
    {
        var income = await db.Incomes.AsNoTracking().Include(i => i.IncomeType).FirstAsync(i => i.Id == id, ct);
        return Map(income);
    }

    private static IncomeDto Map(Income i) => new(i.Id, i.IncomeTypeId, i.IncomeType.Name, i.Description, i.EstimatedAmount,
        i.ReceivedAmount, i.ExpectedDate, i.ReceivedDate, i.SourcePerson, i.IsRecurring, i.Status, i.Notes);
}
