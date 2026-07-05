using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.DTOs.Households;
using HouseholdFinance.Api.Exceptions;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseholdFinance.Api.Services;

public interface IHouseholdService
{
    Task<IReadOnlyList<HouseholdDto>> GetUserHouseholdsAsync(string userId, CancellationToken ct = default);
    Task<HouseholdDto> CreateAsync(string userId, CreateHouseholdRequest request, CancellationToken ct = default);
    Task<HouseholdDto> GetAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<HouseholdDto> UpdateAsync(Guid householdId, string userId, UpdateHouseholdRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<HouseholdMemberDto>> GetMembersAsync(Guid householdId, string userId, CancellationToken ct = default);
    Task<HouseholdMemberDto> AddMemberAsync(Guid householdId, string userId, AddMemberRequest request, CancellationToken ct = default);
    Task<HouseholdMemberDto> UpdateMemberAsync(Guid householdId, string userId, Guid memberId, UpdateMemberRequest request, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid householdId, string userId, Guid memberId, CancellationToken ct = default);
}

public sealed class HouseholdService(ApplicationDbContext db, IHouseholdAccessService access, IAuditService audit) : IHouseholdService
{
    public async Task<IReadOnlyList<HouseholdDto>> GetUserHouseholdsAsync(string userId, CancellationToken ct = default)
    {
        return await db.HouseholdMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.IsActive)
            .Include(m => m.Household)
            .OrderBy(m => m.Household.Name)
            .Select(m => new HouseholdDto(m.Household.Id, m.Household.Name, m.Household.Description, m.Household.CurrencyCode, m.Household.TimeZoneId, m.Role))
            .ToListAsync(ct);
    }

    public async Task<HouseholdDto> CreateAsync(string userId, CreateHouseholdRequest request, CancellationToken ct = default)
    {
        var household = new Household
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        var member = new HouseholdMember
        {
            Id = Guid.NewGuid(),
            HouseholdId = household.Id,
            UserId = userId,
            Role = HouseholdRole.Owner,
            CanManageMembers = true,
            CanManagePeriods = true,
            JoinedAtUtc = DateTime.UtcNow
        };

        db.Households.Add(household);
        db.HouseholdMembers.Add(member);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(household.Id, userId, "Create", nameof(Household), household.Id.ToString(), newValues: household.Name);

        return new HouseholdDto(household.Id, household.Name, household.Description, household.CurrencyCode, household.TimeZoneId, HouseholdRole.Owner);
    }

    public async Task<HouseholdDto> GetAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        var member = await access.RequireMembershipAsync(householdId, userId, ct);
        var household = await db.Households.AsNoTracking().FirstAsync(h => h.Id == householdId, ct);
        return new HouseholdDto(household.Id, household.Name, household.Description, household.CurrencyCode, household.TimeZoneId, member.Role);
    }

    public async Task<HouseholdDto> UpdateAsync(Guid householdId, string userId, UpdateHouseholdRequest request, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        var household = await db.Households.FirstAsync(h => h.Id == householdId, ct);
        var oldName = household.Name;
        household.Name = request.Name.Trim();
        household.Description = request.Description?.Trim();
        household.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "Update", nameof(Household), householdId.ToString(), oldName, household.Name);
        return new HouseholdDto(household.Id, household.Name, household.Description, household.CurrencyCode, household.TimeZoneId, HouseholdRole.Owner);
    }

    public async Task<IReadOnlyList<HouseholdMemberDto>> GetMembersAsync(Guid householdId, string userId, CancellationToken ct = default)
    {
        await access.RequireMembershipAsync(householdId, userId, ct);
        return await db.HouseholdMembers.AsNoTracking()
            .Where(m => m.HouseholdId == householdId)
            .Include(m => m.User)
            .OrderBy(m => m.Role).ThenBy(m => m.User.DisplayName)
            .Select(m => new HouseholdMemberDto(m.Id, m.UserId, m.User.Email ?? string.Empty, m.User.DisplayName, m.Role, m.CanManageMembers, m.CanManagePeriods, m.IsActive))
            .ToListAsync(ct);
    }

    public async Task<HouseholdMemberDto> AddMemberAsync(Guid householdId, string userId, AddMemberRequest request, CancellationToken ct = default)
    {
        await access.RequireManageMembersAsync(householdId, userId, ct);
        var targetUser = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct)
            ?? throw new NotFoundException("Usuario no encontrado.");

        if (await db.HouseholdMembers.AnyAsync(m => m.HouseholdId == householdId && m.UserId == targetUser.Id, ct))
            throw new ConflictException("El usuario ya es miembro del hogar.");

        var member = new HouseholdMember
        {
            Id = Guid.NewGuid(),
            HouseholdId = householdId,
            UserId = targetUser.Id,
            Role = request.Role,
            CanManageMembers = request.Role == HouseholdRole.Owner || request.CanManageMembers,
            CanManagePeriods = request.Role == HouseholdRole.Owner || request.CanManagePeriods,
            JoinedAtUtc = DateTime.UtcNow
        };
        db.HouseholdMembers.Add(member);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "AddMember", nameof(HouseholdMember), member.Id.ToString(), newValues: targetUser.Email);
        return new HouseholdMemberDto(member.Id, member.UserId, targetUser.Email ?? string.Empty, targetUser.DisplayName, member.Role, member.CanManageMembers, member.CanManagePeriods, member.IsActive);
    }

    public async Task<HouseholdMemberDto> UpdateMemberAsync(Guid householdId, string userId, Guid memberId, UpdateMemberRequest request, CancellationToken ct = default)
    {
        await access.RequireManageMembersAsync(householdId, userId, ct);
        var member = await db.HouseholdMembers.Include(m => m.User).FirstOrDefaultAsync(m => m.Id == memberId && m.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Miembro no encontrado.");

        member.Role = request.Role;
        member.CanManageMembers = request.Role == HouseholdRole.Owner || request.CanManageMembers;
        member.CanManagePeriods = request.Role == HouseholdRole.Owner || request.CanManagePeriods;
        member.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "UpdateMember", nameof(HouseholdMember), memberId.ToString());
        return new HouseholdMemberDto(member.Id, member.UserId, member.User.Email ?? string.Empty, member.User.DisplayName, member.Role, member.CanManageMembers, member.CanManagePeriods, member.IsActive);
    }

    public async Task RemoveMemberAsync(Guid householdId, string userId, Guid memberId, CancellationToken ct = default)
    {
        await access.RequireManageMembersAsync(householdId, userId, ct);
        var member = await db.HouseholdMembers.FirstOrDefaultAsync(m => m.Id == memberId && m.HouseholdId == householdId, ct)
            ?? throw new NotFoundException("Miembro no encontrado.");

        if (member.UserId == userId)
            throw new BusinessException("No puede eliminarse a sí mismo como propietario.");

        if (member.Role == HouseholdRole.Owner && !await db.HouseholdMembers.AnyAsync(m => m.HouseholdId == householdId && m.Role == HouseholdRole.Owner && m.Id != memberId && m.IsActive, ct))
            throw new ConflictException("Debe existir al menos un propietario activo.");

        db.HouseholdMembers.Remove(member);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(householdId, userId, "RemoveMember", nameof(HouseholdMember), memberId.ToString());
    }
}
