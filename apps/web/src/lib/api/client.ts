import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Storage keys
const ACCESS_TOKEN_KEY = 'scms_access_token';
const REFRESH_TOKEN_KEY = 'scms_refresh_token';
const API_BASE_URL_KEY = 'scms_api_base_url';

/**
 * Get configured API Base URL
 * Default to the public Next.js API URL or the local API.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(API_BASE_URL_KEY);
    if (saved && saved.trim() !== '') {
      return saved.trim();
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
}

console.log(`Backend API ${getApiBaseUrl()}`);

/**
 * Update the API Base URL at runtime
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(API_BASE_URL_KEY, cleanUrl);
    apiClient.defaults.baseURL = cleanUrl;
  }
}

/**
 * Token Helpers
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Create centralized Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Update baseURL on instance dynamically before each request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrency lock for token refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt to refresh if the failed request was the login or refresh endpoint itself
      const requestUrl = originalRequest.url || '';
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent('scms:auth-expired'));
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newAccessToken = refreshResponse.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.refreshToken || refreshToken;

        if (newAccessToken) {
          setTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned in refresh response');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        window.dispatchEvent(new CustomEvent('scms:auth-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Extracts a human-friendly error message from an Axios error
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  if (axios.isAxiosError(error)) {
    const resp = error.response;
    if (resp?.data) {
      if (typeof resp.data === 'string') return resp.data;
      if (Array.isArray(resp.data.message)) {
        return resp.data.message.join(', ');
      }
      if (typeof resp.data.message === 'string') {
        return resp.data.message;
      }
      if (typeof resp.data.error === 'string') {
        return resp.data.error;
      }
    }
    if (error.code === 'ERR_NETWORK') {
      return `Backend unavailable. Unable to connect to ${getApiBaseUrl()}. Please verify your NestJS server is running and CORS is configured.`;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Ping backend to check health/availability
 */
export async function checkBackendConnection(): Promise<{
  isOnline: boolean;
  status?: number;
  error?: string;
}> {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/auth/me`, {
      timeout: 4000,
      headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
    });
    return { isOnline: true, status: res.status };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      // 401 still means backend is online and reachable!
      if (
        err.response?.status === 401 ||
        err.response?.status === 200 ||
        err.response?.status === 403
      ) {
        return { isOnline: true, status: err.response.status };
      }
      return { isOnline: false, error: extractErrorMessage(err) };
    }
    return { isOnline: false, error: String(err) };
  }
}
