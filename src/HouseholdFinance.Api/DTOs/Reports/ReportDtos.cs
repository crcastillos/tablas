namespace HouseholdFinance.Api.DTOs.Reports;

public sealed record DashboardDto(
    Guid PeriodId, int Year, int Month, string PeriodStatus,
    decimal EstimatedIncome, decimal ReceivedIncome, decimal TotalBudgeted,
    decimal ConfirmedExpenses, decimal PendingExpenses, decimal EstimatedCashBalance,
    decimal RealCashBalance, decimal BudgetUtilizationPercentage,
    IReadOnlyList<CategorySpendingDto> TopCategories,
    IReadOnlyList<CategorySpendingDto> ExceededCategories,
    IReadOnlyList<UpcomingPaymentDto> UpcomingPayments,
    IReadOnlyList<WeeklySpendingDto> WeeklySpending,
    IReadOnlyList<RecentMovementDto> RecentMovements,
    MonthlyComparisonSnippetDto? PreviousMonthComparison);
public sealed record CategorySpendingDto(Guid CategoryId, string CategoryName, string Color, decimal Budgeted, decimal Spent, decimal Percentage);
public sealed record UpcomingPaymentDto(Guid RecurringExpenseId, string Name, decimal Amount, int ExpectedDay, string CategoryName);
public sealed record WeeklySpendingDto(int WeekNumber, decimal Amount);
public sealed record RecentMovementDto(Guid Id, string Description, decimal Amount, DateOnly Date, string Status, string Type);
public sealed record MonthlyComparisonSnippetDto(int Year, int Month, decimal Spent, decimal Budgeted, decimal ChangePercentage);
public sealed record BudgetVsActualReportDto(IReadOnlyList<BudgetLineReportDto> Lines, decimal TotalBudgeted, decimal TotalSpent, decimal Variance);
public sealed record BudgetLineReportDto(string CategoryName, decimal Budgeted, decimal Spent, decimal Variance, decimal Percentage);
public sealed record CategoryReportDto(IReadOnlyList<CategorySpendingDto> Categories, decimal Total);
public sealed record CashFlowReportDto(decimal OpeningBalance, decimal TotalIncome, decimal TotalExpenses, decimal ClosingBalance, IReadOnlyList<CashFlowItemDto> Items);
public sealed record CashFlowItemDto(DateOnly Date, string Description, decimal Income, decimal Expense, decimal Balance);
public sealed record MonthlyComparisonReportDto(IReadOnlyList<MonthlyComparisonItemDto> Months);
public sealed record MonthlyComparisonItemDto(int Year, int Month, decimal EstimatedIncome, decimal ReceivedIncome, decimal Budgeted, decimal Spent);
