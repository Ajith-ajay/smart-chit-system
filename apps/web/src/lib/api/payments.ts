import { ApiResponse, CreatePaymentDto, Payment, PaymentSummary, ReversePaymentDto } from '@/types';
import { apiClient } from './client';

export const paymentsApi = {
  create: async (enrollmentId: string, dto: CreatePaymentDto): Promise<Payment> => {
    const res = await apiClient.post<ApiResponse<Payment>>(
      `/payments/enrollments/${enrollmentId}`,
      dto,
    );
    return res.data.data;
  },

  getByEnrollment: async (enrollmentId: string): Promise<Payment[]> => {
    const res = await apiClient.get<ApiResponse<Payment[]>>(
      `/payments/enrollments/${enrollmentId}`,
    );
    return res.data.data;
  },

  getEnrollmentSummary: async (enrollmentId: string): Promise<PaymentSummary> => {
    const res = await apiClient.get<ApiResponse<PaymentSummary>>(
      `/payments/enrollments/${enrollmentId}/summary`,
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data.data;
  },

  reverse: async (id: string, dto?: ReversePaymentDto): Promise<Payment> => {
    const res = await apiClient.post<ApiResponse<Payment>>(`/payments/${id}/reverse`, dto || {});
    return res.data.data;
  },
};
