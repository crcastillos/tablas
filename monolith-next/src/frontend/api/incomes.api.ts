import apiClient from "@/frontend/api/axiosClient";
import type { ApiResponse, Income, IncomeType } from "@/frontend/types/domain";

export const incomesApi = {
  types: async () => {
    const { data } = await apiClient.get<ApiResponse<IncomeType[]>>("/income-types");
    return data.data ?? [];
  },
  list: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<Income[]>>(`/households/${householdId}/periods/${periodId}/incomes`);
    return data.data ?? [];
  },
  create: async (householdId: string, periodId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<Income>>(`/households/${householdId}/periods/${periodId}/incomes`, payload);
    return data.data!;
  },
  receive: async (householdId: string, incomeId: string, receivedAmount: number, receivedDate: string) => {
    const { data } = await apiClient.post<ApiResponse<Income>>(`/households/${householdId}/incomes/${incomeId}/receive`, {
      receivedAmount,
      receivedDate,
    });
    return data.data!;
  },
};
