import api from './axios'
import type { ApiResponse, IpWhitelistEntry } from '@/types'

export const ipWhitelistApi = {
  getAll: () =>
    api.get<ApiResponse<IpWhitelistEntry[]>>('/ip-whitelist'),

  add: (data: { ip: string; label?: string }) =>
    api.post<ApiResponse<IpWhitelistEntry>>('/ip-whitelist', data),

  update: (id: string, data: { ip?: string; label?: string | null; isActive?: boolean }) =>
    api.put<ApiResponse<IpWhitelistEntry>>(`/ip-whitelist/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/ip-whitelist/${id}`),
}

export const ipWhitelistQueryKeys = {
  all: ['ip-whitelist'] as const,
}
