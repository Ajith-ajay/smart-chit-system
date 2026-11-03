import { ApiResponse, PlanTemplate } from '@/types';
import { apiClient } from './client';

export const plansApi = {
  getAll: async (): Promise<PlanTemplate[]> => {
    const res = await apiClient.get<ApiResponse<PlanTemplate[]>>('/plans');
    return res.data.data;
  },

  getById: async (id: string): Promise<PlanTemplate> => {
    const res = await apiClient.get<ApiResponse<PlanTemplate>>(`/plans/${id}`);
    return res.data.data;
  },
};
