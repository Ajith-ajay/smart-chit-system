import { ApiResponse, Receipt } from '@/types';
import { apiClient } from './client';

export const receiptsApi = {
  getById: async (id: string): Promise<Receipt> => {
    const res = await apiClient.get<ApiResponse<Receipt>>(`/receipts/${id}`);
    return res.data.data;
  },

  getByPaymentId: async (paymentId: string): Promise<Receipt> => {
    const res = await apiClient.get<ApiResponse<Receipt>>(`/receipts/payments/${paymentId}`);
    return res.data.data;
  },

  cancel: async (id: string, reason?: string): Promise<Receipt> => {
    const res = await apiClient.post<ApiResponse<Receipt>>(`/receipts/${id}/cancel`, { reason });
    return res.data.data;
  },

  reissue: async (id: string): Promise<Receipt> => {
    const res = await apiClient.post<ApiResponse<Receipt>>(`/receipts/${id}/reissue`);
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Receipt[]> => {
    const res = await apiClient.get<ApiResponse<Receipt[]>>('/receipts', {
      params,
    });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },
};
