import api from './axios'
import type { ApiResponse, User, UpdateProfileDto, AccountStats, AiUsage, Invoice, Plan } from '@/types'

export interface AccountUsage {
  messagesSentThisMonth: number
  totalDevices: number
  connectedDevices: number
}

export interface AccountMeResponse {
  user: User
  usage: AccountUsage
}

export const accountApi = {
  getMe: () =>
    api.get<ApiResponse<AccountMeResponse>>('/account/me'),

  getStats: () =>
    api.get<ApiResponse<AccountStats>>('/account/stats'),

  updateProfile: (data: UpdateProfileDto) =>
    api.put<ApiResponse<{ user: User }>>('/account/me', data),

  regenerateApiKey: () =>
    api.post<ApiResponse<{ apiKey: string }>>('/account/api-key/regenerate'),

  getInvoices: () =>
    api.get<ApiResponse<{ invoices: Invoice[] }>>('/account/invoices'),

  getAiUsage: () =>
    api.get<ApiResponse<AiUsage>>('/account/ai-usage'),

  // ─── 2FA (TOTP) ───────────────────────────────────────────────────────────
  setup2fa: () =>
    api.post<ApiResponse<{ secret: string; otpauthUri: string; qrDataUrl: string; message: string }>>('/account/2fa/setup'),

  enable2fa: (otp: string) =>
    api.post<ApiResponse<{ message: string }>>('/account/2fa/enable', { otp }),

  disable2fa: (password: string) =>
    api.post<ApiResponse<{ message: string }>>('/account/2fa/disable', { password }),

  upgradePlan: (plan: Plan) =>
    api.post<ApiResponse<{ invoice: Invoice; snapToken?: string; message: string }>>('/account/upgrade', { plan }),
}

export const accountQueryKeys = {
  me:       ['account', 'me']       as const,
  stats:    ['account', 'stats']    as const,
  invoices: ['account', 'invoices'] as const,
  aiUsage:  ['account', 'ai-usage'] as const,
}
