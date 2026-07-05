import apiClient from './axiosClient'
import type { ApiResponse, Expense, ExpenseStatus, ExpenseMovementType, PaymentMethodType, PagedResult } from '../types/domain'

export interface ExpenseFilter {
  categoryId?: string
  movementType?: ExpenseMovementType
  status?: ExpenseStatus
  paymentMethod?: PaymentMethodType
  fromDate?: string
  toDate?: string
  search?: string
  pageNumber?: number
  pageSize?: number
}

export const expensesApi = {
  list: async (householdId: string, periodId: string, filter: ExpenseFilter = {}) => {
    const { data } = await apiClient.get<ApiResponse<PagedResult<Expense>>>(
      `/households/${householdId}/periods/${periodId}/expenses`,
      { params: filter },
    )
    return data.data!
  },
  get: async (householdId: string, expenseId: string) => {
    const { data } = await apiClient.get<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}`)
    return data.data!
  },
  create: async (householdId: string, periodId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<Expense>>(`/households/${householdId}/periods/${periodId}/expenses`, payload)
    return data.data!
  },
  update: async (householdId: string, expenseId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}`, payload)
    return data.data!
  },
  confirm: async (householdId: string, expenseId: string) => {
    const { data } = await apiClient.post<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}/confirm`)
    return data.data!
  },
  cancel: async (householdId: string, expenseId: string, reason: string) => {
    const { data } = await apiClient.post<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}/cancel`, { reason })
    return data.data!
  },
}
