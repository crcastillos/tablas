import apiClient from "@/frontend/api/axiosClient";
import type { ApiResponse, AuthResponse, UserProfile } from "@/frontend/types/domain";

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", payload);
    return data.data!;
  },
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return data.data!;
  },
  me: async () => {
    const { data } = await apiClient.get<ApiResponse<UserProfile>>("/auth/me");
    return data.data!;
  },
  logout: async () => {
    await apiClient.post("/auth/logout");
  },
};
