import apiClient from "@/frontend/api/axiosClient";
import type { ApiResponse, FinancialPeriod, Household, HouseholdMember, HouseholdRole } from "@/frontend/types/domain";

export const householdsApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<Household[]>>("/households");
    return data.data ?? [];
  },
  create: async (name: string, description?: string) => {
    const { data } = await apiClient.post<ApiResponse<Household>>("/households", { name, description });
    return data.data!;
  },
  update: async (householdId: string, name: string, description?: string) => {
    const { data } = await apiClient.put<ApiResponse<Household>>(`/households/${householdId}`, { name, description });
    return data.data!;
  },
  members: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<HouseholdMember[]>>(`/households/${householdId}/members`);
    return data.data ?? [];
  },
  addMember: async (
    householdId: string,
    email: string,
    role: HouseholdRole,
    canManageMembers: boolean,
    canManagePeriods: boolean,
  ) => {
    const { data } = await apiClient.post<ApiResponse<HouseholdMember>>(`/households/${householdId}/members`, {
      email,
      role,
      canManageMembers,
      canManagePeriods,
    });
    return data.data!;
  },
  removeMember: async (householdId: string, memberId: string) => {
    await apiClient.delete(`/households/${householdId}/members/${memberId}`);
  },
};

export const periodsApi = {
  list: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<FinancialPeriod[]>>(`/households/${householdId}/periods`);
    return data.data ?? [];
  },
  create: async (householdId: string, year: number, month: number) => {
    const { data } = await apiClient.post<ApiResponse<FinancialPeriod>>(`/households/${householdId}/periods`, { year, month });
    return data.data!;
  },
  close: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.post<ApiResponse<FinancialPeriod>>(`/households/${householdId}/periods/${periodId}/close`);
    return data.data!;
  },
  reopen: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.post<ApiResponse<FinancialPeriod>>(`/households/${householdId}/periods/${periodId}/reopen`);
    return data.data!;
  },
};
