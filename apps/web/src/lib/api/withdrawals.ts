import {
  ApiResponse,
  ApproveWithdrawalDto,
  CreatePayoutDto,
  CreateWithdrawalDto,
  RejectWithdrawalDto,
  ReversePayoutDto,
  Withdrawal,
  WithdrawalEligibility,
  WithdrawalPayout,
} from '@/types';
import { apiClient } from './client';

export const withdrawalsApi = {
  getEligibility: async (enrollmentId: string): Promise<WithdrawalEligibility> => {
    const res = await apiClient.get<ApiResponse<WithdrawalEligibility>>(
      `/withdrawals/enrollments/${enrollmentId}/eligible`,
    );
    return res.data.data;
  },

  getByEnrollment: async (enrollmentId: string): Promise<Withdrawal[]> => {
    const res = await apiClient.get<ApiResponse<Withdrawal[]>>(
      `/withdrawals/enrollments/${enrollmentId}`,
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Withdrawal> => {
    const res = await apiClient.get<ApiResponse<Withdrawal>>(`/withdrawals/${id}`);
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<Withdrawal[]> => {
    const res = await apiClient.get<ApiResponse<Withdrawal[]>>('/withdrawals', {
      params,
    });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },

  create: async (enrollmentId: string, dto: CreateWithdrawalDto): Promise<Withdrawal> => {
    const res = await apiClient.post<ApiResponse<Withdrawal>>(
      `/withdrawals/enrollments/${enrollmentId}`,
      dto,
    );
    return res.data.data;
  },

  approve: async (id: string, dto?: ApproveWithdrawalDto): Promise<Withdrawal> => {
    const res = await apiClient.post<ApiResponse<Withdrawal>>(
      `/withdrawals/${id}/approve`,
      dto || {},
    );
    return res.data.data;
  },

  reject: async (id: string, dto: RejectWithdrawalDto): Promise<Withdrawal> => {
    const res = await apiClient.post<ApiResponse<Withdrawal>>(`/withdrawals/${id}/reject`, dto);
    return res.data.data;
  },

  createPayout: async (id: string, dto: CreatePayoutDto): Promise<WithdrawalPayout> => {
    const res = await apiClient.post<ApiResponse<WithdrawalPayout>>(
      `/withdrawals/${id}/payouts`,
      dto,
    );
    return res.data.data;
  },

  reversePayout: async (payoutId: string, dto?: ReversePayoutDto): Promise<WithdrawalPayout> => {
    const res = await apiClient.post<ApiResponse<WithdrawalPayout>>(
      `/withdrawals/payouts/${payoutId}/reverse`,
      dto || {},
    );
    return res.data.data;
  },
};
