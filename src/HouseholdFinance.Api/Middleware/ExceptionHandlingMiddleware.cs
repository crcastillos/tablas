using System.Net;
using System.Text.Json;
using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.Exceptions;

namespace HouseholdFinance.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (BusinessException ex)
        {
            logger.LogWarning(ex, "Business error {StatusCode}", ex.StatusCode);
            await WriteErrorAsync(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled error");
            var message = "Ha ocurrido un error inesperado.";
            await WriteErrorAsync(context, (int)HttpStatusCode.InternalServerError, message);
        }
    }

    private static Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsync(JsonSerializer.Serialize(ApiResponse<object>.Fail(message)));
    }
}

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault() ?? Guid.NewGuid().ToString();
        context.Response.Headers[HeaderName] = correlationId;
        context.Items[HeaderName] = correlationId;
        await next(context);
    }
}
