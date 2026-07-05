import type { AxiosError } from 'axios'
import type { ApiResponse } from '../types/domain'

export const getErrorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado.'): string => {
  if (typeof error === 'string') return error
  const axiosError = error as AxiosError<ApiResponse<unknown>>
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback
}
