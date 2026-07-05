import apiClient from "@/frontend/api/axiosClient";
import type {
  ApiResponse,
  BudgetVsActualReport,
  CashFlowReport,
  CategoryReport,
  Dashboard,
  MonthlyComparisonReport,
} from "@/frontend/types/domain";

export const reportsApi = {
  dashboard: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<Dashboard>>(`/households/${householdId}/periods/${periodId}/dashboard`);
    return data.data!;
  },
  budgetVsActual: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<BudgetVsActualReport>>(
      `/households/${householdId}/periods/${periodId}/reports/budget-vs-actual`,
    );
    return data.data!;
  },
  byCategory: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<CategoryReport>>(`/households/${householdId}/periods/${periodId}/reports/by-category`);
    return data.data!;
  },
  cashFlow: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<CashFlowReport>>(`/households/${householdId}/periods/${periodId}/reports/cash-flow`);
    return data.data!;
  },
  monthlyComparison: async (householdId: string, months = 6) => {
    const { data } = await apiClient.get<ApiResponse<MonthlyComparisonReport>>(`/households/${householdId}/reports/monthly-comparison`, {
      params: { months },
    });
    return data.data!;
  },
};
