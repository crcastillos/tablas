import type { AxiosError } from "axios";
import type { ApiResponse } from "@/frontend/types/domain";

export const getErrorMessage = (error: unknown, fallback = "Ocurrio un error inesperado."): string => {
  if (typeof error === "string") return error;
  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};
