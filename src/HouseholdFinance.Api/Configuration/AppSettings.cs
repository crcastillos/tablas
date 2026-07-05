namespace HouseholdFinance.Api.Configuration;

public sealed class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int DurationInMinutes { get; set; } = 60;
}

public sealed class CorsSettings
{
    public const string SectionName = "CorsSettings";
    public string[] AllowedOrigins { get; set; } = [];
}
