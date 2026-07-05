using System.ComponentModel.DataAnnotations;
using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.DTOs.Households;

public sealed record HouseholdDto(Guid Id, string Name, string? Description, string CurrencyCode, string TimeZoneId, HouseholdRole Role);

public sealed class CreateHouseholdRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(250)]
    public string? Description { get; set; }
}

public sealed class UpdateHouseholdRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(250)]
    public string? Description { get; set; }
}

public sealed record HouseholdMemberDto(
    Guid Id, string UserId, string Email, string DisplayName,
    HouseholdRole Role, bool CanManageMembers, bool CanManagePeriods, bool IsActive);

public sealed class AddMemberRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    public HouseholdRole Role { get; set; } = HouseholdRole.Member;
    public bool CanManageMembers { get; set; }
    public bool CanManagePeriods { get; set; }
}

public sealed record UpdateMemberRequest(HouseholdRole Role, bool CanManageMembers, bool CanManagePeriods, bool IsActive);
