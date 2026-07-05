import apiClient from "@/frontend/api/axiosClient";
import type { ApiResponse, BudgetSummary, ExpenseCategory, RecurringExpense } from "@/frontend/types/domain";

export const categoriesApi = {
  list: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<ExpenseCategory[]>>(`/households/${householdId}/expense-categories`);
    return data.data ?? [];
  },
  create: async (householdId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<ExpenseCategory>>(`/households/${householdId}/expense-categories`, payload);
    return data.data!;
  },
};

export const recurringApi = {
  list: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<RecurringExpense[]>>(`/households/${householdId}/recurring-expenses`);
    return data.data ?? [];
  },
  create: async (householdId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<RecurringExpense>>(`/households/${householdId}/recurring-expenses`, payload);
    return data.data!;
  },
};

export const budgetsApi = {
  get: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<BudgetSummary>>(`/households/${householdId}/periods/${periodId}/budget`);
    return data.data!;
  },
  upsert: async (householdId: string, periodId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<BudgetSummary>>(`/households/${householdId}/periods/${periodId}/budget`, payload);
    return data.data!;
  },
  generateFromRecurring: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.post<ApiResponse<BudgetSummary>>(
      `/households/${householdId}/periods/${periodId}/budget/generate-from-recurring`,
    );
    return data.data!;
  },
};
