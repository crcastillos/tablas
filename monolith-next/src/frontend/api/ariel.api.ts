import apiClient from "@/frontend/api/axiosClient";
import type { ApiResponse, ArielChatResponse } from "@/frontend/types/domain";

export interface ArielChatPayload {
  message: string;
  householdId: string;
  periodId: string;
}

export const arielApi = {
  chat: async (payload: ArielChatPayload) => {
    const { data } = await apiClient.post<ApiResponse<ArielChatResponse>>("/ariel/chat", payload);
    return data.data!;
  },
};
