using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.DTOs.Expenses;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IExpenseService
{
    Task<PagedResult<ExpenseDto>> GetExpensesAsync(Guid householdId, Guid periodId, string userId, ExpenseFilterRequest filter, CancellationToken ct = default);
    Task<ExpenseDto> GetByIdAsync(Guid householdId, Guid expenseId, string userId, CancellationToken ct = default);
    Task<ExpenseDto> CreateAsync(Guid householdId, Guid periodId, string userId, CreateExpenseRequest request, CancellationToken ct = default);
    Task<ExpenseDto> UpdateAsync(Guid householdId, Guid expenseId, string userId, UpdateExpenseRequest request, CancellationToken ct = default);
    Task<ExpenseDto> ConfirmAsync(Guid householdId, Guid expenseId, string userId, CancellationToken ct = default);
    Task<ExpenseDto> CancelAsync(Guid householdId, Guid expenseId, string userId, CancelExpenseRequest request, CancellationToken ct = default);
}

public sealed class ExpenseService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : IExpenseService
{
    public async Task<PagedResult<ExpenseDto>> GetExpensesAsync(Guid householdId, Guid periodId, string userId, ExpenseFilterRequest filter, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var query = db.Expenses.AsNoTracking().Include(e => e.Category).Where(e => e.HouseholdId == householdId && e.PeriodId == periodId);
        if (filter.CategoryId.HasValue) query = query.Where(e => e.CategoryId == filter.CategoryId);
        if (filter.Status.HasValue) query = query.Where(e => e.Status == filter.Status);
        if (!string.IsNullOrWhiteSpace(filter.Search)) query = query.Where(e => e.Description.Contains(filter.Search.Trim()));
        var total = await query.CountAsync(ct);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var pageNumber = Math.Max(filter.PageNumber, 1);
        var items = await query.OrderByDescending(e => e.MovementDate).Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(e => Map(e)).ToListAsync(ct);
        return new PagedResult<ExpenseDto> { Items = items, PageNumber = pageNumber, PageSize = pageSize, TotalItems = total, TotalPages = (int)Math.Ceiling(total / (double)pageSize) };
    }

    public async Task<ExpenseDto> GetByIdAsync(Guid householdId, Guid expenseId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var expense = await db.Expenses.AsNoTracking().Include(e => e.Category).FirstOrDefaultAsync(e => e.Id == expenseId && e.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto no encontrado.");
        return Map(expense);
    }

    public async Task<ExpenseDto> CreateAsync(Guid householdId, Guid periodId, string userId, CreateExpenseRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var period = await access.RequireOpenPeriodAsync(householdId, periodId, ct);
        ValidateAmount(request.Amount);
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var existing = await db.Expenses.AsNoTracking().FirstOrDefaultAsync(e => e.HouseholdId == householdId && e.IdempotencyKey == request.IdempotencyKey, ct);
            if (existing is not null) return Map(await db.Expenses.Include(e => e.Category).FirstAsync(e => e.Id == existing.Id, ct));
        }
        if (!await db.ExpenseCategories.AnyAsync(c => c.Id == request.CategoryId && c.HouseholdId == householdId && c.IsActive, ct))
            throw new NotFoundException("Categoría no válida.");
        if (request.MovementDate < period.StartDate || request.MovementDate > period.EndDate)
            throw new BusinessException("La fecha debe estar dentro del período.");
        await ValidateBudgetImpactAsync(periodId, request.CategoryId, request.Amount, request.ConfirmUnbudgeted, request.ConfirmExceeded, null, ct);

        var expense = new Expense
        {
            Id = Guid.NewGuid(), HouseholdId = householdId, PeriodId = periodId, CategoryId = request.CategoryId,
            MovementType = request.MovementType, Description = request.Description.Trim(), Amount = request.Amount,
            MovementDate = request.MovementDate, PaymentMethod = request.PaymentMethod, MerchantOrPayee = request.MerchantOrPayee?.Trim(),
            ReferenceNumber = request.ReferenceNumber?.Trim(), RecurringExpenseId = request.RecurringExpenseId,
            IsRelatedToRecurring = request.RecurringExpenseId.HasValue, Notes = request.Notes?.Trim(),
            Status = ExpenseStatus.Confirmed, CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow,
            IdempotencyKey = request.IdempotencyKey?.Trim() ?? string.Empty
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync(ct);
        return Map(await db.Expenses.Include(e => e.Category).FirstAsync(e => e.Id == expense.Id, ct));
    }

    public async Task<ExpenseDto> UpdateAsync(Guid householdId, Guid expenseId, string userId, UpdateExpenseRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var expense = await db.Expenses.Include(e => e.Period).Include(e => e.Category).FirstOrDefaultAsync(e => e.Id == expenseId && e.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto no encontrado.");
        access.EnsurePeriodWritable(expense.Period);
        ValidateAmount(request.Amount);
        await ValidateBudgetImpactAsync(expense.PeriodId, request.CategoryId, request.Amount, request.ConfirmUnbudgeted, request.ConfirmExceeded, expenseId, ct);
        expense.CategoryId = request.CategoryId;
        expense.MovementType = request.MovementType;
        expense.Description = request.Description.Trim();
        expense.Amount = request.Amount;
        expense.MovementDate = request.MovementDate;
        expense.PaymentMethod = request.PaymentMethod;
        expense.MerchantOrPayee = request.MerchantOrPayee?.Trim();
        expense.ReferenceNumber = request.ReferenceNumber?.Trim();
        expense.Notes = request.Notes?.Trim();
        expense.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(expense);
    }

    public async Task<ExpenseDto> ConfirmAsync(Guid householdId, Guid expenseId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var expense = await db.Expenses.Include(e => e.Period).Include(e => e.Category).FirstOrDefaultAsync(e => e.Id == expenseId && e.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto no encontrado.");
        access.EnsurePeriodWritable(expense.Period);
        if (expense.Status != ExpenseStatus.Pending) throw new ConflictException("Solo se pueden confirmar gastos pendientes.");
        expense.Status = ExpenseStatus.Confirmed;
        expense.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(expense);
    }

    public async Task<ExpenseDto> CancelAsync(Guid householdId, Guid expenseId, string userId, CancelExpenseRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var expense = await db.Expenses.Include(e => e.Period).Include(e => e.Category).FirstOrDefaultAsync(e => e.Id == expenseId && e.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto no encontrado.");
        access.EnsurePeriodWritable(expense.Period);
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new BusinessException("Se requiere motivo de anulación.");
        expense.Status = ExpenseStatus.Cancelled;
        expense.CancellationReason = request.Reason.Trim();
        expense.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Cancel", nameof(Expense), expenseId.ToString(), newValues: request.Reason.Trim());
        return Map(expense);
    }

    private async Task ValidateBudgetImpactAsync(Guid periodId, Guid categoryId, decimal amount, bool confirmUnbudgeted, bool confirmExceeded, Guid? excludeId, CancellationToken ct)
    {
        var budgetLine = await db.BudgetLines.AsNoTracking().Include(l => l.MonthlyBudget)
            .FirstOrDefaultAsync(l => l.MonthlyBudget.PeriodId == periodId && l.CategoryId == categoryId, ct);
        if (budgetLine is null || budgetLine.BudgetedAmount <= 0)
        {
            if (!confirmUnbudgeted) throw new ConflictException("La categoría no tiene presupuesto asignado.");
            return;
        }
        var spentQuery = db.Expenses.AsNoTracking().Where(e => e.PeriodId == periodId && e.CategoryId == categoryId && e.Status == ExpenseStatus.Confirmed);
        if (excludeId.HasValue) spentQuery = spentQuery.Where(e => e.Id != excludeId.Value);
        var projected = await spentQuery.SumAsync(e => e.Amount, ct) + amount;
        if (projected > budgetLine.BudgetedAmount && !confirmExceeded)
            throw new ConflictException("El gasto excede el presupuesto de la categoría.");
    }

    private static void ValidateAmount(decimal amount)
    {
        if (amount <= 0) throw new BusinessException("El monto debe ser mayor que cero.");
    }

    private static ExpenseDto Map(Expense e) => new(e.Id, e.CategoryId, e.Category.Name, e.MovementType, e.Description, e.Amount,
        e.MovementDate, e.PaymentMethod, e.MerchantOrPayee, e.ReferenceNumber, e.Status, e.IsRelatedToRecurring,
        e.RecurringExpenseId, e.Notes, e.CreatedAtUtc, e.CreatedByUserId);
}
