import axios from 'axios';
import { getPublicApiBaseUrl } from '@/lib/api-base';
import { unwrapApiData } from '@/lib/api-response';

const api = axios.create({
  baseURL: getPublicApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't try to refresh token for login or register requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('auth/login') &&
      !originalRequest.url?.includes('auth/register') &&
      !originalRequest.url?.includes('auth/verify-2fa')
    ) {
      originalRequest._retry = true;
      try {
        if (typeof window === 'undefined') {
          return Promise.reject(error);
        }
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return Promise.reject(error);
        }
        const refreshUrl = `${getPublicApiBaseUrl()}/auth/refresh-token`;
        const response = await axios.post(refreshUrl, {
          refreshToken,
          accessToken: localStorage.getItem('token'),
        });

        const envelope = unwrapApiData<{
          accessToken: string;
          refreshToken: string;
        }>(response.data);
        const token = envelope.accessToken;
        const newRefreshToken = envelope.refreshToken;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        // Update cookie as well
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear everything on failure
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
