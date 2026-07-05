using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.Models;

public sealed class FinancialPeriod
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public PeriodStatus Status { get; set; } = PeriodStatus.Draft;
    public byte[] RowVersion { get; set; } = [];
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public string? ClosedByUserId { get; set; }

    public Household Household { get; set; } = null!;
    public MonthlyBudget? Budget { get; set; }
    public ICollection<Income> Incomes { get; set; } = [];
    public ICollection<Expense> Expenses { get; set; } = [];
}
