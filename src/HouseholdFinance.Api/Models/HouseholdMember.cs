using HouseholdFinance.Api.Models.Enums;

namespace HouseholdFinance.Api.Models;

public sealed class HouseholdMember
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public HouseholdRole Role { get; set; } = HouseholdRole.Member;
    public bool CanManageMembers { get; set; }
    public bool CanManagePeriods { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;

    public Household Household { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
