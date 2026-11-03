import {
  AddBatchPlanDto,
  ApiResponse,
  Batch,
  CreateBatchDto,
  LifecycleProcessDto,
  LifecycleResult,
  UpdateBatchDto,
} from '@/types';
import { apiClient } from './client';

export interface BatchQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface BatchesResponse {
  data: Batch[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const batchesApi = {
  getAll: async (params?: BatchQueryParams): Promise<BatchesResponse | Batch[]> => {
    const res = await apiClient.get<ApiResponse<BatchesResponse | Batch[]>>('/batches', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Batch> => {
    const res = await apiClient.get<ApiResponse<Batch>>(`/batches/${id}`);
    return res.data.data;
  },

  create: async (dto: CreateBatchDto): Promise<Batch> => {
    const res = await apiClient.post<ApiResponse<Batch>>('/batches', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateBatchDto): Promise<Batch> => {
    const res = await apiClient.patch<ApiResponse<Batch>>(`/batches/${id}`, dto);
    return res.data.data;
  },

  addPlan: async (batchId: string, dto: AddBatchPlanDto): Promise<Batch> => {
    const res = await apiClient.post<ApiResponse<Batch>>(`/batches/${batchId}/plans`, dto);
    return res.data.data;
  },

  removePlan: async (
    batchId: string,
    planTemplateId: string,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await apiClient.delete(`/batches/${batchId}/plans/${planTemplateId}`);
    return res.data.data;
  },

  start: async (id: string): Promise<Batch> => {
    const res = await apiClient.post<ApiResponse<Batch>>(`/batches/${id}/start`);
    return res.data.data;
  },

  complete: async (id: string): Promise<Batch> => {
    const res = await apiClient.post<ApiResponse<Batch>>(`/batches/${id}/complete`);
    return res.data.data;
  },

  cancel: async (id: string): Promise<Batch> => {
    const res = await apiClient.post<ApiResponse<Batch>>(`/batches/${id}/cancel`);
    return res.data.data;
  },

  processLifecycle: async (id: string, dto?: LifecycleProcessDto): Promise<LifecycleResult> => {
    const res = await apiClient.post<ApiResponse<LifecycleResult>>(
      `/batches/${id}/lifecycle/process`,
      dto || {},
    );
    return res.data.data;
  },

  processAllLifecycle: async (dto?: LifecycleProcessDto): Promise<LifecycleResult> => {
    const res = await apiClient.post<ApiResponse<LifecycleResult>>(
      '/batches/lifecycle/process-all',
      dto || {},
    );
    return res.data.data;
  },
};
