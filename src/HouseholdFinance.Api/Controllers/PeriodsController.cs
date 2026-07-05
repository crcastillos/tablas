using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.DTOs.Periods;
using HouseholdFinance.Api.Security;
using HouseholdFinance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseholdFinance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}/periods")]
public sealed class PeriodsController(IPeriodService periodService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinancialPeriodDto>>>> GetAll(Guid householdId, CancellationToken ct)
    {
        var response = await periodService.GetPeriodsAsync(householdId, User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<FinancialPeriodDto>>.Ok(response));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FinancialPeriodDto>>> Create(
        Guid householdId, [FromBody] CreatePeriodRequest request, CancellationToken ct)
    {
        var response = await periodService.CreateAsync(householdId, User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { householdId, periodId = response.Id }, ApiResponse<FinancialPeriodDto>.Ok(response, "Período creado."));
    }

    [HttpGet("{periodId:guid}")]
    public async Task<ActionResult<ApiResponse<FinancialPeriodDto>>> GetById(Guid householdId, Guid periodId, CancellationToken ct)
    {
        var response = await periodService.GetAsync(householdId, periodId, User.GetUserId(), ct);
        return Ok(ApiResponse<FinancialPeriodDto>.Ok(response));
    }

    [HttpPost("{periodId:guid}/close")]
    public async Task<ActionResult<ApiResponse<FinancialPeriodDto>>> Close(Guid householdId, Guid periodId, CancellationToken ct)
    {
        var response = await periodService.CloseAsync(householdId, periodId, User.GetUserId(), ct);
        return Ok(ApiResponse<FinancialPeriodDto>.Ok(response, "Período cerrado."));
    }

    [HttpPost("{periodId:guid}/reopen")]
    public async Task<ActionResult<ApiResponse<FinancialPeriodDto>>> Reopen(Guid householdId, Guid periodId, CancellationToken ct)
    {
        var response = await periodService.ReopenAsync(householdId, periodId, User.GetUserId(), ct);
        return Ok(ApiResponse<FinancialPeriodDto>.Ok(response, "Período reabierto."));
    }
}
