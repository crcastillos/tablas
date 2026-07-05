using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.DTOs.Expenses;

public sealed record ExpenseDto(
    Guid Id, Guid CategoryId, string CategoryName, ExpenseMovementType MovementType,
    string Description, decimal Amount, DateOnly MovementDate, PaymentMethodType PaymentMethod,
    string? MerchantOrPayee, string? ReferenceNumber, ExpenseStatus Status,
    bool IsRelatedToRecurring, Guid? RecurringExpenseId, string? Notes,
    DateTime CreatedAtUtc, string CreatedByUserId);
public sealed record CreateExpenseRequest(
    Guid CategoryId, ExpenseMovementType MovementType, string Description, decimal Amount,
    DateOnly MovementDate, PaymentMethodType PaymentMethod, string? MerchantOrPayee,
    string? ReferenceNumber, Guid? RecurringExpenseId, string? Notes,
    bool ConfirmUnbudgeted, bool ConfirmExceeded, string? IdempotencyKey);
public sealed record UpdateExpenseRequest(
    Guid CategoryId, ExpenseMovementType MovementType, string Description, decimal Amount,
    DateOnly MovementDate, PaymentMethodType PaymentMethod, string? MerchantOrPayee,
    string? ReferenceNumber, string? Notes, bool ConfirmUnbudgeted, bool ConfirmExceeded);
public sealed record CancelExpenseRequest(string Reason);
public sealed record ExpenseFilterRequest(
    Guid? CategoryId, ExpenseMovementType? MovementType, ExpenseStatus? Status,
    PaymentMethodType? PaymentMethod, DateOnly? FromDate, DateOnly? ToDate,
    string? Search, int PageNumber = 1, int PageSize = 20);
