namespace HouseholdFinance.Api.Models;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? HouseholdId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
