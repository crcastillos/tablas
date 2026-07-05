using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.DTOs.Incomes;

public sealed record IncomeTypeDto(int Id, string Code, string Name);
public sealed record IncomeDto(
    Guid Id, int IncomeTypeId, string IncomeTypeName, string Description,
    decimal EstimatedAmount, decimal ReceivedAmount, DateOnly? ExpectedDate, DateOnly? ReceivedDate,
    string? SourcePerson, bool IsRecurring, IncomeStatus Status, string? Notes);
public sealed record CreateIncomeRequest(
    int IncomeTypeId, string Description, decimal EstimatedAmount, DateOnly? ExpectedDate,
    string? SourcePerson, bool IsRecurring, string? Notes);
public sealed record UpdateIncomeRequest(
    int IncomeTypeId, string Description, decimal EstimatedAmount, DateOnly? ExpectedDate,
    string? SourcePerson, bool IsRecurring, string? Notes);
public sealed record ReceiveIncomeRequest(decimal ReceivedAmount, DateOnly ReceivedDate);
public sealed record CancelIncomeRequest(string Reason);
