import { ApiResponse, KycDocument, KycDocumentStatus } from '@/types';
import { apiClient, getApiBaseUrl } from './client';

export const documentsApi = {
  getByEnrollment: async (enrollmentId: string): Promise<KycDocument[]> => {
    const res = await apiClient.get<ApiResponse<KycDocument[]>>(
      `/documents/enrollments/${enrollmentId}`,
    );
    return res.data.data;
  },

  getByMemberKyc: async (memberId: string): Promise<KycDocument[]> => {
    const res = await apiClient.get<ApiResponse<KycDocument[]>>(
      `/documents/members/${memberId}/kyc`,
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<KycDocument> => {
    const res = await apiClient.get<ApiResponse<KycDocument>>(`/documents/${id}`);
    return res.data.data;
  },

  createMetadata: async (
    enrollmentId: string,
    dto: { documentType: string; documentNumber?: string; fileName: string },
  ): Promise<KycDocument> => {
    const res = await apiClient.post<ApiResponse<KycDocument>>(
      `/documents/enrollments/${enrollmentId}`,
      dto,
    );
    return res.data.data;
  },

  upload: async (
    enrollmentId: string,
    file: File,
    documentType: string,
    documentNumber?: string,
  ): Promise<KycDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }

    const res = await apiClient.post<ApiResponse<KycDocument>>(
      `/documents/enrollments/${enrollmentId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return res.data.data;
  },

  verify: async (id: string): Promise<KycDocument> => {
    const res = await apiClient.post<ApiResponse<KycDocument>>(`/documents/${id}/verify`);
    return res.data.data;
  },

  reject: async (id: string, reason?: string): Promise<KycDocument> => {
    const res = await apiClient.post<ApiResponse<KycDocument>>(`/documents/${id}/reject`, {
      reason,
    });
    return res.data.data;
  },

  updateKycStatus: async (id: string, status: KycDocumentStatus): Promise<KycDocument> => {
    const res = await apiClient.patch<ApiResponse<KycDocument>>(`/documents/${id}/kyc-status`, {
      status,
    });
    return res.data.data;
  },

  getFileUrl: (id: string): string => {
    return `${getApiBaseUrl()}/documents/${id}/file`;
  },

  downloadFile: async (id: string, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/documents/${id}/file`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `document-${id}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
