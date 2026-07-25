import api from './axios'
import type { ApiResponse, Integration, IntegrationLog, PlatformPreset } from '@/types'

export interface CreateIntegrationDto {
  name: string
  platform?: string
  deviceId: string
  phoneField?: string
  targetPhone?: string
  messageTemplate: string
  filterField?: string
  filterValue?: string
  /** Verifikasi HMAC webhook masuk — nama header signature (mis. X-Shopify-Hmac-Sha256) */
  signatureHeader?: string | null
  /** Secret HMAC — jika diset, request tanpa signature valid ditolak 401 */
  signatureSecret?: string | null
}

export interface UpdateIntegrationDto extends Partial<CreateIntegrationDto> {
  isActive?: boolean
}

export const integrationApi = {
  // ─── Platform presets (public) ─────────────────────────────────────────────
  getPlatforms: () =>
    api.get<{ success: boolean; data: PlatformPreset[] }>('/integrations/platforms'),

  getPlatformPreset: (platform: string) =>
    api.get<{ success: boolean; data: PlatformPreset }>(`/integrations/platforms/${platform}`),

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  getAll: () =>
    api.get<{ success: boolean; data: Integration[] }>('/integrations'),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Integration }>(`/integrations/${id}`),

  create: (data: CreateIntegrationDto) =>
    api.post<{ success: boolean; data: Integration }>('/integrations', data),

  update: (id: string, data: UpdateIntegrationDto) =>
    api.patch<{ success: boolean; data: Integration }>(`/integrations/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/integrations/${id}`),

  rotateToken: (id: string) =>
    api.post<{ success: boolean; data: { id: string; secretToken: string } }>(
      `/integrations/${id}/rotate-token`
    ),

  getLogs: (id: string, limit = 50) =>
    api.get<{ success: boolean; data: IntegrationLog[] }>(
      `/integrations/${id}/logs`,
      { params: { limit } }
    ),
}

export const integrationQueryKeys = {
  all:      ['integrations'] as const,
  detail:   (id: string) => ['integrations', id] as const,
  logs:     (id: string) => ['integrations', id, 'logs'] as const,
  platforms: ['integrations', 'platforms'] as const,
}
