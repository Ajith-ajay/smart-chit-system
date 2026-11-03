import {
  ApiResponse,
  AuthResponse,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  User,
} from '@/types';
import { apiClient, clearTokens, setTokens } from './client';

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email: dto.email,
      password: dto.password,
    });
    if (res.data?.data.accessToken) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data?.data;
  },

  refresh: async (
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> => {
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  changePassword: async (dto: ChangePasswordDto): Promise<{ message?: string }> => {
    const res = await apiClient.post('/auth/change-password', dto);
    return res.data;
  },

  forgotPassword: async (dto: ForgotPasswordDto): Promise<{ message?: string }> => {
    const res = await apiClient.post('/auth/forgot-password', dto);
    return res.data;
  },

  resetPassword: async (dto: ResetPasswordDto): Promise<{ message?: string }> => {
    const res = await apiClient.post('/auth/reset-password', dto);
    return res.data;
  },
};
