import api from './axios'
import type { ApiResponse, AutoReply, CreateAutoReplyDto, UpdateAutoReplyDto } from '@/types'

export const autoReplyApi = {
  getAll: (params?: { deviceId?: string }) =>
    api.get<ApiResponse<{ autoReplies: AutoReply[] }>>('/auto-replies', { params }),

  create: (data: CreateAutoReplyDto) =>
    api.post<ApiResponse<{ autoReply: AutoReply }>>('/auto-replies', data),

  update: (id: string, data: UpdateAutoReplyDto) =>
    api.put<ApiResponse<{ autoReply: AutoReply }>>(`/auto-replies/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/auto-replies/${id}`),
}

export const autoReplyQueryKeys = {
  all: (deviceId?: string) => ['auto-replies', deviceId] as const,
}
