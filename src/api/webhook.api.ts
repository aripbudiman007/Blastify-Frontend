import api from './axios'
import type { ApiResponse, Webhook, CreateWebhookDto, UpdateWebhookDto } from '@/types'

export const webhookApi = {
  getAll: () =>
    api.get<ApiResponse<{ webhooks: Webhook[] }>>('/webhooks'),

  getById: (id: string) =>
    api.get<ApiResponse<{ webhook: Webhook }>>(`/webhooks/${id}`),

  create: (data: CreateWebhookDto) =>
    api.post<ApiResponse<{ webhook: Webhook }>>('/webhooks', data),

  update: (id: string, data: UpdateWebhookDto) =>
    api.patch<ApiResponse<{ webhook: Webhook }>>(`/webhooks/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/webhooks/${id}`),

  test: (id: string) =>
    api.post<ApiResponse<{ status: number; body: unknown }>>(`/webhooks/${id}/test`),
}

export const webhookQueryKeys = {
  all: ['webhooks'] as const,
  detail: (id: string) => ['webhooks', id] as const,
}
