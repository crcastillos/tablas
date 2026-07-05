using System.Security.Claims;
using HouseholdFinance.Api.Exceptions;

namespace HouseholdFinance.Api.Security;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedBusinessException("No se pudo identificar al usuario.");
        }

        return userId;
    }
}
