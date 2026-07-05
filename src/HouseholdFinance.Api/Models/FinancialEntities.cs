namespace HouseholdFinance.Api.Models;

public sealed class IncomeType
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsSystem { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public ICollection<Income> Incomes { get; set; } = [];
}

public sealed class Income
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Guid PeriodId { get; set; }
    public int IncomeTypeId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public DateOnly? ExpectedDate { get; set; }
    public DateOnly? ReceivedDate { get; set; }
    public string? SourcePerson { get; set; }
    public bool IsRecurring { get; set; }
    public Enums.IncomeStatus Status { get; set; } = Enums.IncomeStatus.Pending;
    public string? Notes { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public string? CancellationReason { get; set; }
    public Household Household { get; set; } = null!;
    public FinancialPeriod Period { get; set; } = null!;
    public IncomeType IncomeType { get; set; } = null!;
}

public sealed class ExpenseCategory
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Enums.ExpenseCategoryType CategoryType { get; set; } = Enums.ExpenseCategoryType.Variable;
    public string Icon { get; set; } = "category";
    public string Color { get; set; } = "#607D8B";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Household Household { get; set; } = null!;
    public ICollection<BudgetLine> BudgetLines { get; set; } = [];
    public ICollection<RecurringExpense> RecurringExpenses { get; set; } = [];
    public ICollection<Expense> Expenses { get; set; } = [];
}

public sealed class RecurringExpense
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal EstimatedAmount { get; set; }
    public int ExpectedPaymentDay { get; set; } = 1;
    public Enums.RecurrenceFrequency Frequency { get; set; } = Enums.RecurrenceFrequency.Monthly;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Provider { get; set; }
    public bool IsActive { get; set; } = true;
    public bool AutoGenerateInBudget { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Household Household { get; set; } = null!;
    public ExpenseCategory Category { get; set; } = null!;
    public ICollection<Expense> Expenses { get; set; } = [];
}

public sealed class MonthlyBudget
{
    public Guid Id { get; set; }
    public Guid PeriodId { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public bool ExceedsIncomeConfirmed { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public FinancialPeriod Period { get; set; } = null!;
    public ICollection<BudgetLine> Lines { get; set; } = [];
}

public sealed class BudgetLine
{
    public Guid Id { get; set; }
    public Guid MonthlyBudgetId { get; set; }
    public Guid CategoryId { get; set; }
    public decimal BudgetedAmount { get; set; }
    public decimal CommittedAmount { get; set; }
    public string? Notes { get; set; }
    public Guid? RecurringExpenseId { get; set; }
    public MonthlyBudget MonthlyBudget { get; set; } = null!;
    public ExpenseCategory Category { get; set; } = null!;
    public RecurringExpense? RecurringExpense { get; set; }
}

public sealed class Expense
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Guid PeriodId { get; set; }
    public Guid CategoryId { get; set; }
    public Enums.ExpenseMovementType MovementType { get; set; } = Enums.ExpenseMovementType.Purchase;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly MovementDate { get; set; }
    public Enums.PaymentMethodType PaymentMethod { get; set; } = Enums.PaymentMethodType.Cash;
    public string? MerchantOrPayee { get; set; }
    public string? ReferenceNumber { get; set; }
    public Enums.ExpenseStatus Status { get; set; } = Enums.ExpenseStatus.Pending;
    public bool IsRelatedToRecurring { get; set; }
    public Guid? RecurringExpenseId { get; set; }
    public string? Notes { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public string? CancellationReason { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public Household Household { get; set; } = null!;
    public FinancialPeriod Period { get; set; } = null!;
    public ExpenseCategory Category { get; set; } = null!;
    public RecurringExpense? RecurringExpense { get; set; }
}
