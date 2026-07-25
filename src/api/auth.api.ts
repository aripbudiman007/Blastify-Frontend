import api from './axios'
import type { ApiResponse, AuthTokens, User, LoginDto, RegisterDto } from '@/types'

export const authApi = {
  login: (data: LoginDto) =>
    api.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', data),

  register: (data: RegisterDto) =>
    api.post<ApiResponse<AuthTokens & { user: User }>>('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  verifyEmail: (token: string) =>
    api.get<ApiResponse<{ message: string }>>('/auth/verify-email', { params: { token } }),

  resendVerification: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string; devToken?: string }>>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data),
}
