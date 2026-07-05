using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IDataSeedService
{
    Task SeedAsync(CancellationToken ct = default);
    Task SeedDemoAsync(CancellationToken ct = default);
}

public sealed class DataSeedService(
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager) : IDataSeedService
{
    public const string DemoUserEmail = "demo@finanzashogar.local";
    public const string DemoUserName = "demo.finanzas";
    public const string DemoPassword = "DemoFinanzas2026";
    private const string DemoHouseholdName = "Familia Demo Finanzas";

    private static readonly (string Code, string Name, int Order)[] IncomeTypes =
    [
        ("SALARY", "Salario", 1), ("FEES", "Honorarios", 2), ("COMMISSIONS", "Comisiones", 3),
        ("BONUS", "Bonificaciones", 4), ("REMITTANCE", "Remesas", 5), ("SALES", "Ventas", 6),
        ("RENT", "Alquileres", 7), ("EXTRAORDINARY", "Ingreso extraordinario", 8), ("OTHER", "Otro", 9)
    ];

    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedIncomeTypesAsync(ct);
    }

    public async Task SeedDemoAsync(CancellationToken ct = default)
    {
        await SeedIncomeTypesAsync(ct);
        var demoUser = await SeedDemoUserAsync(ct);
        var household = await SeedDemoHouseholdAsync(demoUser, ct);
        await SeedDemoPeriodsDataAsync(household, demoUser.Id, ct);
    }

    private async Task SeedIncomeTypesAsync(CancellationToken ct)
    {
        foreach (var item in IncomeTypes)
        {
            if (await db.IncomeTypes.AnyAsync(t => t.Code == item.Code, ct))
            {
                continue;
            }

            db.IncomeTypes.Add(new IncomeType
            {
                Code = item.Code,
                Name = item.Name,
                SortOrder = item.Order,
                IsSystem = true,
                IsActive = true
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<ApplicationUser> SeedDemoUserAsync(CancellationToken ct)
    {
        var existing = await userManager.FindByEmailAsync(DemoUserEmail);
        if (existing is not null)
        {
            return existing;
        }

        var user = new ApplicationUser
        {
            UserName = DemoUserName,
            Email = DemoUserEmail,
            DisplayName = "Usuario Demo",
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, DemoPassword);
        if (!result.Succeeded)
        {
            var errorMessage = string.Join("; ", result.Errors.Select(x => x.Description));
            throw new InvalidOperationException($"No se pudo crear el usuario demo: {errorMessage}");
        }

        return user;
    }

    private async Task<Household> SeedDemoHouseholdAsync(ApplicationUser user, CancellationToken ct)
    {
        var household = await db.Households.FirstOrDefaultAsync(x => x.Name == DemoHouseholdName, ct);
        if (household is null)
        {
            household = new Household
            {
                Name = DemoHouseholdName,
                Description = "Datos de demostracion para pruebas funcionales",
                CurrencyCode = "USD",
                TimeZoneId = "America/El_Salvador"
            };
            db.Households.Add(household);
            await db.SaveChangesAsync(ct);
        }

        var memberExists = await db.HouseholdMembers
            .AnyAsync(x => x.HouseholdId == household.Id && x.UserId == user.Id, ct);
        if (!memberExists)
        {
            db.HouseholdMembers.Add(new HouseholdMember
            {
                HouseholdId = household.Id,
                UserId = user.Id,
                Role = HouseholdRole.Owner,
                CanManageMembers = true,
                CanManagePeriods = true,
                IsActive = true
            });
            await db.SaveChangesAsync(ct);
        }

        return household;
    }

    private async Task SeedDemoPeriodsDataAsync(Household household, string userId, CancellationToken ct)
    {
        var now = GetElSalvadorNow();
        var targetYear = now.Year;
        var monthSpecs = new[]
        {
            new { Month = 5, Status = PeriodStatus.Closed },
            new { Month = 6, Status = PeriodStatus.Closed },
            new { Month = 7, Status = PeriodStatus.Open }
        };

        foreach (var spec in monthSpecs)
        {
            await EnsurePeriodWithColdDataAsync(household, userId, targetYear, spec.Month, spec.Status, now.Day, ct);
        }
    }

    private async Task EnsurePeriodWithColdDataAsync(
        Household household,
        string userId,
        int year,
        int month,
        PeriodStatus status,
        int currentDayInMonth,
        CancellationToken ct)
    {
        var period = await db.FinancialPeriods
            .Include(x => x.Budget)
            .ThenInclude(x => x!.Lines)
            .FirstOrDefaultAsync(x => x.HouseholdId == household.Id && x.Year == year && x.Month == month, ct);

        if (period is null)
        {
            period = new FinancialPeriod
            {
                HouseholdId = household.Id,
                Year = year,
                Month = month,
                StartDate = new DateOnly(year, month, 1),
                EndDate = new DateOnly(year, month, DateTime.DaysInMonth(year, month)),
                Status = status
            };
            db.FinancialPeriods.Add(period);
            await db.SaveChangesAsync(ct);
        }
        else if (period.Status != status)
        {
            period.Status = status;
            period.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        var categories = await EnsureCategoriesAsync(household.Id, ct);
        var recurring = await EnsureRecurringExpensesAsync(household.Id, categories, ct);
        var salaryTypeId = (await db.IncomeTypes.FirstAsync(x => x.Code == "SALARY", ct)).Id;
        var otherTypeId = (await db.IncomeTypes.FirstAsync(x => x.Code == "OTHER", ct)).Id;

        await EnsureIncomesAsync(household.Id, period.Id, userId, salaryTypeId, otherTypeId, year, month, ct);
        await EnsureBudgetAsync(period.Id, userId, categories, recurring, ct);
        await EnsureExpensesAsync(household.Id, period.Id, categories, recurring, year, month, currentDayInMonth, userId, ct);
    }

    private async Task<Dictionary<string, ExpenseCategory>> EnsureCategoriesAsync(Guid householdId, CancellationToken ct)
    {
        var seeds = new[]
        {
            new { Name = "Alimentacion", Type = ExpenseCategoryType.Variable, Icon = "restaurant", Color = "#4CAF50", Order = 1 },
            new { Name = "Vivienda", Type = ExpenseCategoryType.Fixed, Icon = "home", Color = "#1565C0", Order = 2 },
            new { Name = "Transporte", Type = ExpenseCategoryType.Variable, Icon = "directions_car", Color = "#00897B", Order = 3 },
            new { Name = "Servicios Basicos", Type = ExpenseCategoryType.Fixed, Icon = "bolt", Color = "#FF8F00", Order = 4 },
            new { Name = "Salud", Type = ExpenseCategoryType.Variable, Icon = "local_hospital", Color = "#C62828", Order = 5 },
            new { Name = "Ahorro", Type = ExpenseCategoryType.Savings, Icon = "savings", Color = "#6A1B9A", Order = 6 }
        };

        var result = new Dictionary<string, ExpenseCategory>(StringComparer.OrdinalIgnoreCase);
        foreach (var seed in seeds)
        {
            var existing = await db.ExpenseCategories.FirstOrDefaultAsync(
                x => x.HouseholdId == householdId && x.Name == seed.Name,
                ct);

            if (existing is null)
            {
                existing = new ExpenseCategory
                {
                    HouseholdId = householdId,
                    Name = seed.Name,
                    CategoryType = seed.Type,
                    Icon = seed.Icon,
                    Color = seed.Color,
                    SortOrder = seed.Order,
                    IsDefault = true,
                    IsActive = true
                };
                db.ExpenseCategories.Add(existing);
            }

            result[seed.Name] = existing;
        }

        await db.SaveChangesAsync(ct);
        return result;
    }

    private async Task<Dictionary<string, RecurringExpense>> EnsureRecurringExpensesAsync(
        Guid householdId,
        IReadOnlyDictionary<string, ExpenseCategory> categories,
        CancellationToken ct)
    {
        var seeds = new[]
        {
            new { Name = "Alquiler", Category = "Vivienda", Amount = 450m, Day = 1 },
            new { Name = "Energia Electrica", Category = "Servicios Basicos", Amount = 45m, Day = 10 },
            new { Name = "Internet", Category = "Servicios Basicos", Amount = 30m, Day = 12 }
        };

        var result = new Dictionary<string, RecurringExpense>(StringComparer.OrdinalIgnoreCase);
        foreach (var seed in seeds)
        {
            var existing = await db.RecurringExpenses.FirstOrDefaultAsync(
                x => x.HouseholdId == householdId && x.Name == seed.Name,
                ct);

            if (existing is null)
            {
                existing = new RecurringExpense
                {
                    HouseholdId = householdId,
                    CategoryId = categories[seed.Category].Id,
                    Name = seed.Name,
                    Description = $"Pago recurrente de {seed.Name}",
                    EstimatedAmount = seed.Amount,
                    ExpectedPaymentDay = seed.Day,
                    Frequency = RecurrenceFrequency.Monthly,
                    StartDate = new DateOnly(DateTime.UtcNow.Year, 1, 1),
                    IsActive = true,
                    AutoGenerateInBudget = true
                };
                db.RecurringExpenses.Add(existing);
            }

            result[seed.Name] = existing;
        }

        await db.SaveChangesAsync(ct);
        return result;
    }

    private async Task EnsureIncomesAsync(
        Guid householdId,
        Guid periodId,
        string userId,
        int salaryTypeId,
        int otherTypeId,
        int year,
        int month,
        CancellationToken ct)
    {
        var salaryDescription = $"Salario base {year}-{month:00}";
        if (!await db.Incomes.AnyAsync(x => x.PeriodId == periodId && x.Description == salaryDescription, ct))
        {
            db.Incomes.Add(new Income
            {
                HouseholdId = householdId,
                PeriodId = periodId,
                IncomeTypeId = salaryTypeId,
                Description = salaryDescription,
                EstimatedAmount = 1750m,
                ReceivedAmount = 1750m,
                ExpectedDate = new DateOnly(year, month, 1),
                ReceivedDate = new DateOnly(year, month, 1),
                SourcePerson = "Ingreso principal",
                IsRecurring = true,
                Status = IncomeStatus.Received,
                CreatedByUserId = userId
            });
        }

        var extraDescription = $"Ingreso extra {year}-{month:00}";
        if (!await db.Incomes.AnyAsync(x => x.PeriodId == periodId && x.Description == extraDescription, ct))
        {
            db.Incomes.Add(new Income
            {
                HouseholdId = householdId,
                PeriodId = periodId,
                IncomeTypeId = otherTypeId,
                Description = extraDescription,
                EstimatedAmount = 220m,
                ReceivedAmount = month < 7 ? 220m : 0m,
                ExpectedDate = new DateOnly(year, month, 15),
                ReceivedDate = month < 7 ? new DateOnly(year, month, 15) : null,
                SourcePerson = "Trabajo freelance",
                IsRecurring = false,
                Status = month < 7 ? IncomeStatus.Received : IncomeStatus.Pending,
                CreatedByUserId = userId
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureBudgetAsync(
        Guid periodId,
        string userId,
        IReadOnlyDictionary<string, ExpenseCategory> categories,
        IReadOnlyDictionary<string, RecurringExpense> recurring,
        CancellationToken ct)
    {
        var budget = await db.MonthlyBudgets
            .Include(x => x.Lines)
            .FirstOrDefaultAsync(x => x.PeriodId == periodId, ct);

        if (budget is null)
        {
            budget = new MonthlyBudget
            {
                PeriodId = periodId,
                CreatedByUserId = userId,
                ExceedsIncomeConfirmed = false
            };
            db.MonthlyBudgets.Add(budget);
            await db.SaveChangesAsync(ct);
        }

        var lines = new[]
        {
            new { Category = "Vivienda", Amount = 450m, Recurring = "Alquiler" },
            new { Category = "Servicios Basicos", Amount = 95m, Recurring = string.Empty },
            new { Category = "Alimentacion", Amount = 380m, Recurring = string.Empty },
            new { Category = "Transporte", Amount = 180m, Recurring = string.Empty },
            new { Category = "Salud", Amount = 120m, Recurring = string.Empty },
            new { Category = "Ahorro", Amount = 250m, Recurring = string.Empty }
        };

        foreach (var line in lines)
        {
            var categoryId = categories[line.Category].Id;
            var exists = budget.Lines.Any(x => x.CategoryId == categoryId);
            if (exists)
            {
                continue;
            }

            budget.Lines.Add(new BudgetLine
            {
                CategoryId = categoryId,
                BudgetedAmount = line.Amount,
                CommittedAmount = line.Amount,
                RecurringExpenseId = string.IsNullOrWhiteSpace(line.Recurring) ? null : recurring[line.Recurring].Id,
                Notes = "Seed demo"
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureExpensesAsync(
        Guid householdId,
        Guid periodId,
        IReadOnlyDictionary<string, ExpenseCategory> categories,
        IReadOnlyDictionary<string, RecurringExpense> recurring,
        int year,
        int month,
        int currentDayInMonth,
        string userId,
        CancellationToken ct)
    {
        var julyLimit = month == 7 ? Math.Min(currentDayInMonth, DateTime.DaysInMonth(year, month)) : DateTime.DaysInMonth(year, month);
        var seeds = new List<(string Description, decimal Amount, int Day, string Category, ExpenseMovementType Type, bool RecurringFlag, Guid? RecurringId)>
        {
            ("Alquiler mensual", 450m, 1, "Vivienda", ExpenseMovementType.ServicePayment, true, recurring["Alquiler"].Id),
            ("Supermercado quincenal", 165m, Math.Min(5, julyLimit), "Alimentacion", ExpenseMovementType.Purchase, false, null),
            ("Combustible", 55m, Math.Min(8, julyLimit), "Transporte", ExpenseMovementType.Purchase, false, null),
            ("Energia electrica", 45m, Math.Min(10, julyLimit), "Servicios Basicos", ExpenseMovementType.ServicePayment, true, recurring["Energia Electrica"].Id),
            ("Internet hogar", 30m, Math.Min(12, julyLimit), "Servicios Basicos", ExpenseMovementType.ServicePayment, true, recurring["Internet"].Id),
            ("Aporte ahorro mensual", 200m, Math.Min(15, julyLimit), "Ahorro", ExpenseMovementType.SavingsTransfer, false, null)
        };

        foreach (var item in seeds.Where(x => x.Day >= 1 && x.Day <= julyLimit))
        {
            var movementDate = new DateOnly(year, month, item.Day);
            var idempotencyKey = $"seed-{year}-{month:00}-{item.Day:00}-{item.Description.Replace(" ", "-").ToLowerInvariant()}";
            if (await db.Expenses.AnyAsync(x => x.PeriodId == periodId && x.IdempotencyKey == idempotencyKey, ct))
            {
                continue;
            }

            db.Expenses.Add(new Expense
            {
                HouseholdId = householdId,
                PeriodId = periodId,
                CategoryId = categories[item.Category].Id,
                MovementType = item.Type,
                Description = item.Description,
                Amount = item.Amount,
                MovementDate = movementDate,
                PaymentMethod = PaymentMethodType.BankTransfer,
                MerchantOrPayee = "Seed Demo",
                Status = ExpenseStatus.Confirmed,
                IsRelatedToRecurring = item.RecurringFlag,
                RecurringExpenseId = item.RecurringId,
                Notes = "Dato frio de demostracion",
                CreatedByUserId = userId,
                IdempotencyKey = idempotencyKey
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static DateTime GetElSalvadorNow()
    {
        var zones = new[] { "America/El_Salvador", "Central America Standard Time" };
        foreach (var zone in zones)
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(zone);
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        return DateTime.UtcNow;
    }
}
