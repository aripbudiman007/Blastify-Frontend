import api from './axios'
import type { ApiResponse, ChatFlow, ChatFlowSession, CreateChatFlowDto, UpdateChatFlowDto } from '@/types'

export const chatFlowApi = {
  getAll: (params?: { deviceId?: string }) =>
    api.get<ApiResponse<{ flows: ChatFlow[] }>>('/chat-flows', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ flow: ChatFlow }>>(`/chat-flows/${id}`),

  create: (data: CreateChatFlowDto) =>
    api.post<ApiResponse<{ flow: ChatFlow }>>('/chat-flows', data),

  update: (id: string, data: UpdateChatFlowDto) =>
    api.put<ApiResponse<{ flow: ChatFlow }>>(`/chat-flows/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/chat-flows/${id}`),

  getSessions: (id: string) =>
    api.get<ApiResponse<{ sessions: ChatFlowSession[] }>>(`/chat-flows/${id}/sessions`),
}

export const chatFlowQueryKeys = {
  all:      (deviceId?: string) => ['chat-flows', deviceId] as const,
  detail:   (id: string)        => ['chat-flows', id] as const,
  sessions: (id: string)        => ['chat-flows', id, 'sessions'] as const,
}
