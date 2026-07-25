import api from './axios'
import type { ApiResponse, Message, SendMessageDto, BulkMessageDto, BulkSendResult, MessageFilter } from '@/types'

export const messageApi = {
  send: (data: SendMessageDto) =>
    api.post<ApiResponse<{ message: Message }>>('/messages/send', data),

  sendBulk: (data: BulkMessageDto) =>
    api.post<ApiResponse<{ results: BulkSendResult[] }>>('/messages/send-bulk', data),

  getAll: (params?: MessageFilter) =>
    api.get<ApiResponse<{ messages: Message[] }>>('/messages', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ message: Message }>>(`/messages/${id}`),

  /** Tarik pesan terkirim (delete for everyone) */
  revoke: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/messages/${id}/revoke`),
}

export const messageQueryKeys = {
  all: (filter?: MessageFilter) => ['messages', filter] as const,
  detail: (id: string) => ['messages', id] as const,
}
