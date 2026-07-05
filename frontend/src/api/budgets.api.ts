import apiClient from './axiosClient'
import type { ApiResponse, BudgetSummary, ExpenseCategory, RecurringExpense } from '../types/domain'

export const categoriesApi = {
  list: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<ExpenseCategory[]>>(`/households/${householdId}/expense-categories`)
    return data.data ?? []
  },
  create: async (householdId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<ExpenseCategory>>(`/households/${householdId}/expense-categories`, payload)
    return data.data!
  },
  update: async (householdId: string, categoryId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put<ApiResponse<ExpenseCategory>>(`/households/${householdId}/expense-categories/${categoryId}`, payload)
    return data.data!
  },
  deactivate: async (householdId: string, categoryId: string) => {
    await apiClient.post(`/households/${householdId}/expense-categories/${categoryId}/deactivate`)
  },
}

export const recurringApi = {
  list: async (householdId: string) => {
    const { data } = await apiClient.get<ApiResponse<RecurringExpense[]>>(`/households/${householdId}/recurring-expenses`)
    return data.data ?? []
  },
  create: async (householdId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<RecurringExpense>>(`/households/${householdId}/recurring-expenses`, payload)
    return data.data!
  },
  update: async (householdId: string, id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put<ApiResponse<RecurringExpense>>(`/households/${householdId}/recurring-expenses/${id}`, payload)
    return data.data!
  },
  deactivate: async (householdId: string, id: string) => {
    await apiClient.post(`/households/${householdId}/recurring-expenses/${id}/deactivate`)
  },
}

export const budgetsApi = {
  get: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.get<ApiResponse<BudgetSummary>>(`/households/${householdId}/periods/${periodId}/budget`)
    return data.data!
  },
  upsert: async (householdId: string, periodId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<ApiResponse<BudgetSummary>>(`/households/${householdId}/periods/${periodId}/budget`, payload)
    return data.data!
  },
  generateFromRecurring: async (householdId: string, periodId: string) => {
    const { data } = await apiClient.post<ApiResponse<BudgetSummary>>(`/households/${householdId}/periods/${periodId}/budget/generate-from-recurring`)
    return data.data!
  },
}
