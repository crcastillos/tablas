import apiClient from "@/frontend/api/axiosClient";
import type {
  ApiResponse,
  Expense,
  ExpenseMovementType,
  ExpenseStatus,
  PagedResult,
  PaymentMethodType,
} from "@/frontend/types/domain";

export interface ExpenseFilter {
  categoryId?: string;
  movementType?: ExpenseMovementType;
  status?: ExpenseStatus;
  paymentMethod?: PaymentMethodType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const expensesApi = {
  list: async (householdId: string, periodId: string, filter: ExpenseFilter = {}) => {
    const { data } = await apiClient.get<ApiResponse<PagedResult<Expense>>>(
      `/households/${householdId}/periods/${periodId}/expenses`,
      { params: filter },
    );
    return data.data!;
  },
  create: async (householdId: string, periodId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<Expense>>(`/households/${householdId}/periods/${periodId}/expenses`, payload);
    return data.data!;
  },
};
