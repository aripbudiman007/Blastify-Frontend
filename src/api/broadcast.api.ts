import api from './axios'
import type { ApiResponse, Broadcast, BroadcastVariants, CreateBroadcastDto, Message } from '@/types'

export interface BroadcastAnalytics {
  broadcastId: string
  name: string
  status: string
  total: number
  byStatus: Record<string, number>
  rates: {
    sentRate: number      // % dari total
    deliveryRate: number  // % dari terkirim
    readRate: number      // % dari tersampaikan
    failRate: number      // % dari total
  }
  timeline: { hour: string; sent: number }[]
}

export const broadcastApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ broadcasts: Broadcast[] }>>('/broadcasts', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ broadcast: Broadcast }>>(`/broadcasts/${id}`),

  create: (data: CreateBroadcastDto) =>
    api.post<ApiResponse<{ broadcast: Broadcast }>>('/broadcasts', data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/broadcasts/${id}`),

  start: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/broadcasts/${id}/start`),

  pause: (id: string) =>
    api.post<ApiResponse<{ broadcast: Broadcast }>>(`/broadcasts/${id}/pause`),

  resume: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/broadcasts/${id}/resume`),

  getLogs: (id: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<{ logs: Message[] }>>(`/broadcasts/${id}/logs`, { params }),

  getAnalytics: (id: string) =>
    api.get<ApiResponse<BroadcastAnalytics>>(`/broadcasts/${id}/analytics`),

  getVariants: (id: string) =>
    api.get<ApiResponse<BroadcastVariants>>(`/broadcasts/${id}/variants`),
}

export const broadcastQueryKeys = {
  all:       (params?: object) => ['broadcasts', params] as const,
  detail:    (id: string)      => ['broadcasts', id]    as const,
  logs:      (id: string)      => ['broadcasts', id, 'logs'] as const,
  analytics: (id: string)      => ['broadcasts', id, 'analytics'] as const,
  variants:  (id: string)      => ['broadcasts', id, 'variants'] as const,
}
