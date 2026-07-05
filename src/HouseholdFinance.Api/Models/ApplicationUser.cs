using Microsoft.AspNetCore.Identity;

namespace HouseholdFinance.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<HouseholdMember> HouseholdMemberships { get; set; } = [];
}
