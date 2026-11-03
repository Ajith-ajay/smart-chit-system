import { ApiResponse, CatchUpDto, CatchUpPreview, CreateEnrollmentDto, Enrollment } from '@/types';
import { apiClient } from './client';

export interface EnrollmentQueryParams {
  page?: number;
  limit?: number;
  memberId?: string;
  batchId?: string;
  batchPlanId?: string;
  status?: string;
}

export interface EnrollmentsResponse {
  data: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const enrollmentsApi = {
  getAll: async (params?: EnrollmentQueryParams): Promise<EnrollmentsResponse | Enrollment[]> => {
    const res = await apiClient.get('/enrollments', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Enrollment> => {
    const res = await apiClient.get<ApiResponse<Enrollment>>(`/enrollments/${id}`);
    return res.data.data;
  },

  create: async (dto: CreateEnrollmentDto): Promise<Enrollment> => {
    const res = await apiClient.post<ApiResponse<Enrollment>>('/enrollments', dto);
    return res.data.data;
  },

  getCatchUpPreview: async (
    memberId: string,
    batchId: string,
    batchPlanId: string,
  ): Promise<CatchUpPreview> => {
    const res = await apiClient.get<ApiResponse<CatchUpPreview>>(
      `/enrollments/members/${memberId}/catch-up-preview`,
      {
        params: { batchId, batchPlanId },
      },
    );
    return res.data.data;
  },

  executeCatchUp: async (
    memberId: string,
    dto: CatchUpDto,
  ): Promise<{
    enrollment: Enrollment;
    payment?: unknown;
    message?: string;
  }> => {
    const res = await apiClient.post(`/enrollments/members/${memberId}/catch-up`, dto);
    return res.data.data;
  },
};
