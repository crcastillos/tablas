using HouseholdFinance.Api.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseholdFinance.Api.Controllers;

[ApiController]
[Route("api/diagnostics")]
[AllowAnonymous]
public sealed class DiagnosticsController : ControllerBase
{
    [HttpGet("log")]
    public IActionResult GetDeploymentLog()
    {
        return Ok(new
        {
            primaryDirectory = DeploymentFileLogger.PrimaryLogsDirectory,
            directories = DeploymentFileLogger.LogDirectories,
            baseDirectory = AppContext.BaseDirectory,
            latestLog = DeploymentFileLogger.ReadLatestLogTail()
        });
    }
}
