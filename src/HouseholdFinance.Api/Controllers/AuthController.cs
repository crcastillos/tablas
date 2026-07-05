using HouseholdFinance.Api.DTOs.Auth;
using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.Security;
using HouseholdFinance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HouseholdFinance.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var response = await authService.RegisterAsync(request, ct);
        return Created(string.Empty, ApiResponse<AuthResponse>.Ok(response, "Usuario registrado."));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var response = await authService.LoginAsync(request, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(response, "Sesión iniciada."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> Me(CancellationToken ct)
    {
        var response = await authService.GetProfileAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(response));
    }

    [Authorize]
    [HttpPost("logout")]
    public ActionResult<ApiResponse<object>> Logout() =>
        Ok(ApiResponse<object>.Ok(new { }, "Cierre de sesión exitoso."));
}
