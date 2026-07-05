using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HouseholdFinance.Api.Configuration;
using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Auth;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HouseholdFinance.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserProfileDto> GetProfileAsync(string userId, CancellationToken ct = default);
}

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            throw new ConflictException("El correo ya está registrado.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName.Trim(),
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new BusinessException(string.Join("; ", result.Errors.Select(e => e.Description)));

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedBusinessException("Credenciales inválidas.");

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
            throw new UnauthorizedBusinessException("Credenciales inválidas.");

        return await BuildAuthResponse(user);
    }

    public async Task<UserProfileDto> GetProfileAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("Usuario no encontrado.");

        return new UserProfileDto(user.Id, user.Email ?? string.Empty, user.DisplayName);
    }

    private Task<AuthResponse> BuildAuthResponse(ApplicationUser user)
    {
        var expires = DateTime.UtcNow.AddMinutes(_jwt.DurationInMinutes);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_jwt.Issuer, _jwt.Audience, claims, expires: expires, signingCredentials: creds);
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Task.FromResult(new AuthResponse(tokenString, expires, new UserProfileDto(user.Id, user.Email ?? string.Empty, user.DisplayName)));
    }
}
