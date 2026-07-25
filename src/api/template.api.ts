import api from './axios'
import type { MessageTemplate, MessageType, TemplateCategory } from '@/types'

export interface TemplateListResponse {
  data: MessageTemplate[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateTemplateDto {
  name: string
  category?: TemplateCategory
  type?: MessageType
  content: string
  mediaUrl?: string
  caption?: string
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
  isActive?: boolean
}

export interface UseTemplateResponse extends MessageTemplate {
  renderedContent: string
  renderedCaption?: string
}

export const templateQueryKeys = {
  all:    ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
}

export const templateApi = {
  list: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: TemplateListResponse }>('/templates', { params }),

  detail: (id: string) =>
    api.get<{ success: boolean; data: MessageTemplate }>(`/templates/${id}`),

  create: (data: CreateTemplateDto) =>
    api.post<{ success: boolean; data: MessageTemplate }>('/templates', data),

  update: (id: string, data: UpdateTemplateDto) =>
    api.put<{ success: boolean; data: MessageTemplate }>(`/templates/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/templates/${id}`),

  // POST /templates/:id/use — body: { vars: Record<string, string> }
  // Returns rendered content with variables substituted + increments usageCount
  use: (id: string, vars?: Record<string, string>) =>
    api.post<{ success: boolean; data: UseTemplateResponse }>(
      `/templates/${id}/use`,
      { vars: vars ?? {} }
    ),
}
