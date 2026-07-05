import { HouseholdRole } from "@/frontend/types/domain";

export const isOwner = (role: HouseholdRole): boolean => role === HouseholdRole.Owner;

export const canManagePeriods = (role: HouseholdRole, canManagePeriodsFlag: boolean): boolean =>
  isOwner(role) || canManagePeriodsFlag;

export const canManageMembers = (role: HouseholdRole, canManageMembersFlag: boolean): boolean =>
  isOwner(role) || canManageMembersFlag;
