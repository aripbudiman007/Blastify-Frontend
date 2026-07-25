import api from './axios'
import type { IncomingMessage, Conversation } from '@/types'

export interface InboxListResponse {
  data: IncomingMessage[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const inboxQueryKeys = {
  conversations: ['inbox', 'conversations'] as const,
  conversationsByDevice: (deviceId: string) => ['inbox', 'conversations', deviceId] as const,
  messages: (from: string, deviceId?: string) => ['inbox', 'messages', from, deviceId ?? 'all'] as const,
}

export const inboxApi = {
  getConversations: (params?: { deviceId?: string }) =>
    api.get<{ success: boolean; data: { conversations: Conversation[] } }>(
      '/inbox/conversations',
      { params }
    ),

  getMessages: (from: string, params?: { deviceId?: string }) =>
    api.get<{ success: boolean; data: IncomingMessage[] }>(
      `/inbox/${encodeURIComponent(from)}`,
      { params }
    ),

  list: (params?: {
    deviceId?: string
    from?: string
    isRead?: boolean
    isGroup?: boolean
    page?: number
    limit?: number
  }) =>
    api.get<{ success: boolean; data: InboxListResponse }>('/inbox', { params }),

  markRead: (id: string) =>
    api.put<{ success: boolean; data: IncomingMessage }>(`/inbox/${id}/read`),

  markAllRead: (deviceId?: string) =>
    api.put<{ success: boolean; data: { updated: number } }>(
      '/inbox/read-all',
      undefined,
      { params: deviceId ? { deviceId } : undefined }
    ),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/inbox/${id}`),

  /** Kirim reaksi emoji ke pesan masuk. Emoji string kosong = hapus reaksi */
  react: (id: string, emoji: string) =>
    api.post<{ success: boolean; data: { emoji: string } }>(`/inbox/${id}/reaction`, { emoji }),

  /** Balas pesan masuk dengan quote (reply bubble) */
  replyQuote: (id: string, message: string) =>
    api.post<{ success: boolean; data: { message: string } }>(`/inbox/${id}/reply`, { message }),
}
