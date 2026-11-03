import {
  ApiResponse,
  BatchReport,
  CollectionReportItem,
  DashboardMetrics,
  EnrollmentReport,
  WithdrawalReportItem,
} from '@/types';
import { apiClient } from './client';

export interface DateFilterParams {
  from?: string;
  to?: string;
  batchId?: string;
  memberId?: string;
  planId?: string;
}

export const reportsApi = {
  getDashboard: async (): Promise<DashboardMetrics> => {
    const res = await apiClient.get<ApiResponse<DashboardMetrics>>('/reports/dashboard');
    return res.data.data;
  },

  getBatchReport: async (batchId: string): Promise<BatchReport> => {
    const res = await apiClient.get<ApiResponse<BatchReport>>(`/reports/batches/${batchId}`);
    return res.data.data;
  },

  getEnrollmentReport: async (enrollmentId: string): Promise<EnrollmentReport> => {
    const res = await apiClient.get<ApiResponse<EnrollmentReport>>(
      `/reports/enrollments/${enrollmentId}`,
    );
    return res.data.data;
  },

  getCollectionsReport: async (params?: DateFilterParams): Promise<CollectionReportItem[]> => {
    const res = await apiClient.get<ApiResponse<CollectionReportItem[]>>('/reports/collections', {
      params,
    });
    return Array.isArray(res.data.data) ? res.data.data : res.data?.data || [];
  },

  getWithdrawalsReport: async (params?: DateFilterParams): Promise<WithdrawalReportItem[]> => {
    const res = await apiClient.get<ApiResponse<WithdrawalReportItem[]>>('/reports/withdrawals', {
      params,
    });
    return Array.isArray(res.data.data) ? res.data.data : res.data?.data || [];
  },
};
