using System.ComponentModel.DataAnnotations;

namespace HouseholdFinance.Api.DTOs.Auth;

public sealed class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string DisplayName { get; set; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public sealed record AuthResponse(string Token, DateTime ExpiresAtUtc, UserProfileDto User);
public sealed record UserProfileDto(string Id, string Email, string DisplayName);
