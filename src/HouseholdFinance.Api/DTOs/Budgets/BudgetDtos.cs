using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.DTOs.Budgets;

public sealed record ExpenseCategoryDto(
    Guid Id, string Name, string? Description, ExpenseCategoryType CategoryType,
    string Icon, string Color, int SortOrder, bool IsActive, bool IsDefault);
public sealed record CreateExpenseCategoryRequest(
    string Name, string? Description, ExpenseCategoryType CategoryType, string Icon, string Color);
public sealed record UpdateExpenseCategoryRequest(
    string Name, string? Description, ExpenseCategoryType CategoryType, string Icon, string Color);
public sealed record RecurringExpenseDto(
    Guid Id, Guid CategoryId, string CategoryName, string Name, string? Description,
    decimal EstimatedAmount, int ExpectedPaymentDay, RecurrenceFrequency Frequency,
    DateOnly StartDate, DateOnly? EndDate, string? Provider, bool IsActive, bool AutoGenerateInBudget);
public sealed record CreateRecurringExpenseRequest(
    Guid CategoryId, string Name, string? Description, decimal EstimatedAmount,
    int ExpectedPaymentDay, RecurrenceFrequency Frequency, DateOnly StartDate,
    DateOnly? EndDate, string? Provider, bool AutoGenerateInBudget);
public sealed record UpdateRecurringExpenseRequest(
    Guid CategoryId, string Name, string? Description, decimal EstimatedAmount,
    int ExpectedPaymentDay, RecurrenceFrequency Frequency, DateOnly StartDate,
    DateOnly? EndDate, string? Provider, bool AutoGenerateInBudget);
public sealed record BudgetLineDto(
    Guid Id, Guid CategoryId, string CategoryName, string Icon, string Color,
    decimal BudgetedAmount, decimal CommittedAmount, decimal SpentAmount,
    decimal AvailableAmount, decimal ConsumedPercentage, string? Notes, bool HasBudget);
public sealed record BudgetSummaryDto(
    decimal TotalEstimatedIncome, decimal TotalReceivedIncome, decimal TotalBudgeted,
    decimal TotalSpent, decimal TotalPending, decimal EstimatedCashBalance,
    decimal RealCashBalance, decimal BudgetBalance, decimal AssignedPercentage,
    bool ExceedsIncome, bool ExceedsIncomeConfirmed, byte[]? RowVersion,
    IReadOnlyList<BudgetLineDto> Lines);
public sealed record UpsertBudgetRequest(
    IReadOnlyList<BudgetLineInput> Lines, bool ConfirmExceedsIncome, byte[]? RowVersion);
public sealed record BudgetLineInput(Guid CategoryId, decimal BudgetedAmount, string? Notes);
