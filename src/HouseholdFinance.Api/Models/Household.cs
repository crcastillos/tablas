namespace HouseholdFinance.Api.Models;

public sealed class Household
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public string TimeZoneId { get; set; } = "America/El_Salvador";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<HouseholdMember> Members { get; set; } = [];
    public ICollection<FinancialPeriod> Periods { get; set; } = [];
    public ICollection<ExpenseCategory> ExpenseCategories { get; set; } = [];
    public ICollection<RecurringExpense> RecurringExpenses { get; set; } = [];
    public ICollection<Income> Incomes { get; set; } = [];
    public ICollection<Expense> Expenses { get; set; } = [];
}
