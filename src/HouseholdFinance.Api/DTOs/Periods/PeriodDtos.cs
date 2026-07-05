using System.ComponentModel.DataAnnotations;
using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.DTOs.Periods;

public sealed record FinancialPeriodDto(
    Guid Id, int Year, int Month, DateOnly StartDate, DateOnly EndDate,
    PeriodStatus Status, DateTime CreatedAtUtc, DateTime? ClosedAtUtc);

public sealed class CreatePeriodRequest
{
    [Range(2000, 2500)]
    public int Year { get; set; }
    [Range(1, 12)]
    public int Month { get; set; }

    public CreatePeriodRequest() { }
    public CreatePeriodRequest(int year, int month) { Year = year; Month = month; }
}
