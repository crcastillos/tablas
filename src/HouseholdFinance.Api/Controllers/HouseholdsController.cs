using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.DTOs.Households;
using HouseholdFinance.Api.Security;
using HouseholdFinance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseholdFinance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/households")]
public sealed class HouseholdsController(IHouseholdService householdService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<HouseholdDto>>>> GetMine(CancellationToken ct)
    {
        var response = await householdService.GetUserHouseholdsAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<HouseholdDto>>.Ok(response));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<HouseholdDto>>> Create([FromBody] CreateHouseholdRequest request, CancellationToken ct)
    {
        var response = await householdService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { householdId = response.Id }, ApiResponse<HouseholdDto>.Ok(response, "Hogar creado."));
    }

    [HttpGet("{householdId:guid}")]
    public async Task<ActionResult<ApiResponse<HouseholdDto>>> GetById(Guid householdId, CancellationToken ct)
    {
        var response = await householdService.GetAsync(householdId, User.GetUserId(), ct);
        return Ok(ApiResponse<HouseholdDto>.Ok(response));
    }

    [HttpPut("{householdId:guid}")]
    public async Task<ActionResult<ApiResponse<HouseholdDto>>> Update(Guid householdId, [FromBody] UpdateHouseholdRequest request, CancellationToken ct)
    {
        var response = await householdService.UpdateAsync(householdId, User.GetUserId(), request, ct);
        return Ok(ApiResponse<HouseholdDto>.Ok(response, "Hogar actualizado."));
    }

    [HttpGet("{householdId:guid}/members")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<HouseholdMemberDto>>>> GetMembers(Guid householdId, CancellationToken ct)
    {
        var response = await householdService.GetMembersAsync(householdId, User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<HouseholdMemberDto>>.Ok(response));
    }

    [HttpPost("{householdId:guid}/members")]
    public async Task<ActionResult<ApiResponse<HouseholdMemberDto>>> AddMember(Guid householdId, [FromBody] AddMemberRequest request, CancellationToken ct)
    {
        var response = await householdService.AddMemberAsync(householdId, User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetMembers), new { householdId }, ApiResponse<HouseholdMemberDto>.Ok(response, "Integrante agregado."));
    }

    [HttpPut("{householdId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult<ApiResponse<HouseholdMemberDto>>> UpdateMember(
        Guid householdId, Guid memberId, [FromBody] UpdateMemberRequest request, CancellationToken ct)
    {
        var response = await householdService.UpdateMemberAsync(householdId, User.GetUserId(), memberId, request, ct);
        return Ok(ApiResponse<HouseholdMemberDto>.Ok(response, "Integrante actualizado."));
    }

    [HttpDelete("{householdId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> DeleteMember(Guid householdId, Guid memberId, CancellationToken ct)
    {
        await householdService.RemoveMemberAsync(householdId, User.GetUserId(), memberId, ct);
        return NoContent();
    }
}
