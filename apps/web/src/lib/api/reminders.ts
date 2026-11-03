import {
  ApiResponse,
  CreateFollowUpDto,
  CreateReminderDto,
  DispatchDueResult,
  FollowUp,
  Reminder,
  ReminderStatus,
} from '@/types';
import { apiClient } from './client';

export const remindersApi = {
  create: async (enrollmentId: string, dto: CreateReminderDto): Promise<Reminder> => {
    const res = await apiClient.post<ApiResponse<Reminder>>(
      `/reminders/enrollments/${enrollmentId}`,
      dto,
    );
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
  }): Promise<Reminder[]> => {
    const res = await apiClient.get<ApiResponse<Reminder[]>>('/reminders', {
      params,
    });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },

  updateStatus: async (id: string, status: ReminderStatus): Promise<Reminder> => {
    const res = await apiClient.patch<ApiResponse<Reminder>>(`/reminders/${id}/status`, { status });
    return res.data.data;
  },

  dispatchDueWhatsApp: async (): Promise<DispatchDueResult> => {
    const res = await apiClient.post<ApiResponse<DispatchDueResult>>('/reminders/dispatch-due');
    return res.data.data;
  },

  createFollowUp: async (enrollmentId: string, dto: CreateFollowUpDto): Promise<FollowUp> => {
    const res = await apiClient.post<ApiResponse<FollowUp>>(
      `/reminders/enrollments/${enrollmentId}/follow-ups`,
      dto,
    );
    return res.data.data;
  },

  getFollowUps: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<FollowUp[]> => {
    const res = await apiClient.get('/reminders/follow-ups', { params });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },

  completeFollowUp: async (id: string, notes?: string): Promise<FollowUp> => {
    const res = await apiClient.post<ApiResponse<FollowUp>>(
      `/reminders/follow-ups/${id}/complete`,
      { notes },
    );
    return res.data.data;
  },
};
