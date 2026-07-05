using System.Net.Http.Headers;
using System.Net.Http.Json;
using HouseholdFinance.Api.DTOs.Auth;
using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.DTOs.Households;
using HouseholdFinance.Api.DTOs.Periods;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HouseholdFinance.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString("N");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("TestingDbName", _dbName);
    }
}

[Collection("Integration")]
public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;
    private static readonly System.Text.Json.JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    public Task InitializeAsync()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        return Task.CompletedTask;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Register_Login_And_CreateHousehold_Succeeds()
    {
        var email = $"user_{Guid.NewGuid():N}@test.com";
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "Password1!",
            DisplayName = "Test User"
        });
        registerResponse.EnsureSuccessStatusCode();

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = email, Password = "Password1!" });
        loginResponse.EnsureSuccessStatusCode();
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions);
        Assert.NotNull(loginBody?.Data?.Token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginBody.Data.Token);
        var householdResponse = await _client.PostAsJsonAsync("/api/households", new CreateHouseholdRequest { Name = "Hogar Test" });
        householdResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task CreatePeriod_Duplicate_ReturnsConflict()
    {
        var email = $"user_{Guid.NewGuid():N}@test.com";
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest { Email = email, Password = "Password1!", DisplayName = "Test" });
        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = email, Password = "Password1!" });
        var loginBody = await login.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginBody!.Data!.Token);

        var household = await (await _client.PostAsJsonAsync("/api/households", new CreateHouseholdRequest { Name = "Hogar" }))
            .Content.ReadFromJsonAsync<ApiResponse<HouseholdDto>>(JsonOptions);

        var request = new CreatePeriodRequest(2026, 7);
        await _client.PostAsJsonAsync($"/api/households/{household!.Data!.Id}/periods", request);
        var second = await _client.PostAsJsonAsync($"/api/households/{household.Data.Id}/periods", request);
        Assert.Equal(System.Net.HttpStatusCode.Conflict, second.StatusCode);
    }
}
