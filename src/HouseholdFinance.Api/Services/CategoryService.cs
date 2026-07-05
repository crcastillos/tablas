using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Budgets;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<ExpenseCategoryDto> CreateAsync(Guid householdId, string userId, CreateExpenseCategoryRequest request, CancellationToken ct = default);
    Task<ExpenseCategoryDto> UpdateAsync(Guid householdId, string userId, Guid categoryId, UpdateExpenseCategoryRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid householdId, string userId, Guid categoryId, CancellationToken ct = default);
    Task SeedDefaultCategoriesAsync(Guid householdId, CancellationToken ct = default);
}

public interface IRecurringExpenseService
{
    Task<IReadOnlyList<RecurringExpenseDto>> GetAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<RecurringExpenseDto> CreateAsync(Guid householdId, string userId, CreateRecurringExpenseRequest request, CancellationToken ct = default);
    Task<RecurringExpenseDto> UpdateAsync(Guid householdId, string userId, Guid id, UpdateRecurringExpenseRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid householdId, string userId, Guid id, CancellationToken ct = default);
}

public sealed class CategoryService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : ICategoryService
{
    private static readonly (string Name, string Icon, string Color, ExpenseCategoryType Type)[] Defaults =
    [
        ("Energía eléctrica", "bolt", "#FFC107", ExpenseCategoryType.Fixed),
        ("Agua", "water_drop", "#03A9F4", ExpenseCategoryType.Fixed),
        ("Internet", "wifi", "#2196F3", ExpenseCategoryType.Fixed),
        ("Alimentación", "restaurant", "#4CAF50", ExpenseCategoryType.Variable),
        ("Transporte", "directions_bus", "#009688", ExpenseCategoryType.Variable),
        ("Salud y medicamentos", "medical_services", "#E91E63", ExpenseCategoryType.Variable),
        ("Ahorro", "savings", "#2E7D32", ExpenseCategoryType.Savings),
        ("Gastos varios", "more_horiz", "#9E9E9E", ExpenseCategoryType.Variable)
    ];

    public async Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        await SeedDefaultCategoriesAsync(householdId, ct);
        return await db.ExpenseCategories.AsNoTracking().Where(c => c.HouseholdId == householdId)
            .OrderBy(c => c.SortOrder).Select(c => Map(c)).ToListAsync(ct);
    }

    public async Task<ExpenseCategoryDto> CreateAsync(Guid householdId, string userId, CreateExpenseCategoryRequest request, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        var name = request.Name.Trim();
        if (await db.ExpenseCategories.AnyAsync(c => c.HouseholdId == householdId && c.Name == name, ct))
            throw new ConflictException("Ya existe una categoría con ese nombre.");
        var category = new ExpenseCategory
        {
            Id = Guid.NewGuid(), HouseholdId = householdId, Name = name, Description = request.Description?.Trim(),
            CategoryType = request.CategoryType, Icon = request.Icon, Color = request.Color,
            SortOrder = await db.ExpenseCategories.CountAsync(c => c.HouseholdId == householdId, ct) + 1,
            CreatedAtUtc = DateTime.UtcNow
        };
        db.ExpenseCategories.Add(category);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Create", nameof(ExpenseCategory), category.Id.ToString(), newValues: category.Name);
        return Map(category);
    }

    public async Task<ExpenseCategoryDto> UpdateAsync(Guid householdId, string userId, Guid categoryId, UpdateExpenseCategoryRequest request, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        var category = await db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Categoría no encontrada.");
        category.Name = request.Name.Trim();
        category.Description = request.Description?.Trim();
        category.CategoryType = request.CategoryType;
        category.Icon = request.Icon;
        category.Color = request.Color;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Update", nameof(ExpenseCategory), categoryId.ToString(), newValues: category.Name);
        return Map(category);
    }

    public async Task DeactivateAsync(Guid householdId, string userId, Guid categoryId, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        var category = await db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Categoría no encontrada.");
        category.IsActive = false;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Deactivate", nameof(ExpenseCategory), categoryId.ToString());
    }

    public async Task SeedDefaultCategoriesAsync(Guid householdId, CancellationToken ct = default)
    {
        if (await db.ExpenseCategories.AnyAsync(c => c.HouseholdId == householdId, ct)) return;
        var order = 1;
        foreach (var item in Defaults)
        {
            db.ExpenseCategories.Add(new ExpenseCategory
            {
                Id = Guid.NewGuid(), HouseholdId = householdId, Name = item.Name, Icon = item.Icon,
                Color = item.Color, CategoryType = item.Type, SortOrder = order++, IsDefault = true, CreatedAtUtc = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync(ct);
    }

    private static ExpenseCategoryDto Map(ExpenseCategory c) =>
        new(c.Id, c.Name, c.Description, c.CategoryType, c.Icon, c.Color, c.SortOrder, c.IsActive, c.IsDefault);
}

public sealed class RecurringExpenseService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : IRecurringExpenseService
{
    public async Task<IReadOnlyList<RecurringExpenseDto>> GetAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        return await db.RecurringExpenses.AsNoTracking().Where(r => r.HouseholdId == householdId).Include(r => r.Category)
            .OrderBy(r => r.Name).Select(r => Map(r)).ToListAsync(ct);
    }

    public async Task<RecurringExpenseDto> CreateAsync(Guid householdId, string userId, CreateRecurringExpenseRequest request, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        if (!await db.ExpenseCategories.AnyAsync(c => c.Id == request.CategoryId && c.HouseholdId == householdId && c.IsActive, ct))
            throw new NotFoundException("Categoría no válida.");
        if (request.EstimatedAmount <= 0) throw new BusinessException("El monto debe ser mayor que cero.");
        var entity = new RecurringExpense
        {
            Id = Guid.NewGuid(), HouseholdId = householdId, CategoryId = request.CategoryId, Name = request.Name.Trim(),
            Description = request.Description?.Trim(), EstimatedAmount = request.EstimatedAmount,
            ExpectedPaymentDay = request.ExpectedPaymentDay, Frequency = request.Frequency,
            StartDate = request.StartDate, EndDate = request.EndDate, Provider = request.Provider?.Trim(),
            AutoGenerateInBudget = request.AutoGenerateInBudget, CreatedAtUtc = DateTime.UtcNow
        };
        db.RecurringExpenses.Add(entity);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Create", nameof(RecurringExpense), entity.Id.ToString(), newValues: entity.Name);
        return await GetDtoAsync(entity.Id, ct);
    }

    public async Task<RecurringExpenseDto> UpdateAsync(Guid householdId, string userId, Guid id, UpdateRecurringExpenseRequest request, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        var entity = await db.RecurringExpenses.FirstOrDefaultAsync(r => r.Id == id && r.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto recurrente no encontrado.");
        entity.CategoryId = request.CategoryId;
        entity.Name = request.Name.Trim();
        entity.EstimatedAmount = request.EstimatedAmount;
        entity.ExpectedPaymentDay = request.ExpectedPaymentDay;
        entity.Frequency = request.Frequency;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.Provider = request.Provider?.Trim();
        entity.AutoGenerateInBudget = request.AutoGenerateInBudget;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Update", nameof(RecurringExpense), id.ToString());
        return await GetDtoAsync(id, ct);
    }

    public async Task DeactivateAsync(Guid householdId, string userId, Guid id, CancellationToken ct = default)
    {
        await access.RequireOwnerAsync(householdId, userId, ct);
        var entity = await db.RecurringExpenses.FirstOrDefaultAsync(r => r.Id == id && r.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Gasto recurrente no encontrado.");
        entity.IsActive = false;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Deactivate", nameof(RecurringExpense), id.ToString());
    }

    private async Task<RecurringExpenseDto> GetDtoAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.RecurringExpenses.AsNoTracking().Include(r => r.Category).FirstAsync(r => r.Id == id, ct);
        return Map(entity);
    }

    private static RecurringExpenseDto Map(RecurringExpense r) =>
        new(r.Id, r.CategoryId, r.Category.Name, r.Name, r.Description, r.EstimatedAmount, r.ExpectedPaymentDay,
            r.Frequency, r.StartDate, r.EndDate, r.Provider, r.IsActive, r.AutoGenerateInBudget);
}
