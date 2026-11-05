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
    type SummaryResponse = Omit<PaymentSummary, 'installments'> & {
      installments: Array<Omit<PaymentSummary['installments'][number], 'status'>>;
    };
    const res = await apiClient.get<ApiResponse<SummaryResponse>>(
      `/payments/enrollments/${enrollmentId}/summary`,
    );
    const summary = res.data.data;
    return {
      ...summary,
      installments: summary.installments.map((installment) => {
        const overdue =
          !installment.isPaid &&
          Number(installment.paidAmount) === 0 &&
          new Date(installment.dueDate).getTime() < Date.now();
        const status = installment.isPaid
          ? 'PAID'
          : Number(installment.paidAmount) > 0
            ? 'PARTIAL'
            : overdue
              ? 'OVERDUE'
              : 'PENDING';
        return { ...installment, status };
      }),
    };
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
