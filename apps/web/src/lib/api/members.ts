import { ApiResponse, CreateMemberDto, Member, UpdateMemberDto } from '@/types';
import { apiClient } from './client';

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MembersResponse {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const membersApi = {
  getAll: async (params?: MemberQueryParams): Promise<MembersResponse | Member[]> => {
    const res = await apiClient.get<ApiResponse<MembersResponse | Member[]>>('/members', {
      params,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Member> => {
    const res = await apiClient.get<ApiResponse<Member>>(`/members/${id}`);
    return res.data.data;
  },

  create: async (dto: CreateMemberDto): Promise<Member> => {
    const res = await apiClient.post<ApiResponse<Member>>('/members', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateMemberDto): Promise<Member> => {
    const res = await apiClient.patch<ApiResponse<Member>>(`/members/${id}`, dto);
    return res.data.data;
  },

  delete: async (id: string): Promise<{ message?: string; success?: boolean }> => {
    const res = await apiClient.delete(`/members/${id}`);
    return res.data.data;
  },
};
