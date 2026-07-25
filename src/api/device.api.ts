import api from './axios'
import type { ApiResponse, Device, DeviceAgent, AgentRole, WaGroup, WaGroupMember } from '@/types'

export interface DeviceSettingsDto {
  name?: string
  minDelay?: number
  maxDelay?: number
  workingHoursStart?: number | null
  workingHoursEnd?: number | null
  workingDays?: number[]
  badWordsEnabled?: boolean
  badWords?: string[]
  autoSaveContacts?: boolean
  typingIndicator?: boolean
  readReceiptSimulation?: boolean
  warmupEnabled?: boolean
}

export const deviceApi = {
  getAll: () =>
    api.get<ApiResponse<{ devices: Device[] }>>('/devices'),

  getById: (id: string) =>
    api.get<ApiResponse<{ device: Device }>>(`/devices/${id}`),

  create: (data: { name: string }) =>
    api.post<ApiResponse<{ device: Device }>>('/devices', data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/devices/${id}`),

  connect: (id: string) =>
    api.post<ApiResponse<{ deviceId: string; qr?: string }>>(`/devices/${id}/connect`),

  disconnect: (id: string) =>
    api.post<ApiResponse<{ deviceId: string; message: string }>>(`/devices/${id}/disconnect`),

  getQR: (id: string) =>
    api.get<ApiResponse<{ deviceId: string; qr: string }>>(`/devices/${id}/qr`),

  /** Alternatif QR — panggil setelah /connect. Kode 8 karakter dimasukkan di WhatsApp */
  requestPairingCode: (id: string, phone: string) =>
    api.post<ApiResponse<{ pairingCode: string; phone: string; message: string }>>(
      `/devices/${id}/pairing-code`, { phone },
    ),

  // ─── Device settings ──────────────────────────────────────────────────────────
  updateSettings: (id: string, data: DeviceSettingsDto) =>
    api.patch<ApiResponse<{ device: Device }>>(`/devices/${id}/settings`, data),

  // ─── Multi-agent ──────────────────────────────────────────────────────────────
  getAgents: (id: string) =>
    api.get<ApiResponse<{ agents: DeviceAgent[] }>>(`/devices/${id}/agents`),

  addAgent: (id: string, data: { email: string; role?: AgentRole }) =>
    api.post<ApiResponse<{ agent: DeviceAgent }>>(`/devices/${id}/agents`, data),

  updateAgent: (deviceId: string, agentId: string, data: { role: AgentRole }) =>
    api.patch<ApiResponse<{ agent: DeviceAgent }>>(`/devices/${deviceId}/agents/${agentId}`, data),

  deleteAgent: (deviceId: string, agentId: string) =>
    api.delete<ApiResponse<null>>(`/devices/${deviceId}/agents/${agentId}`),

  // ─── WA Groups ────────────────────────────────────────────────────────────────
  getWaGroups: (deviceId: string) =>
    api.get<ApiResponse<{ groups: WaGroup[] }>>(`/devices/${deviceId}/wa-groups`),

  getWaGroupMembers: (deviceId: string, groupJid: string) =>
    api.get<ApiResponse<{ jid: string; name: string; description: string | null; members: WaGroupMember[] }>>(
      `/devices/${deviceId}/wa-groups/${encodeURIComponent(groupJid)}/members`
    ),

  importWaGroupContacts: (deviceId: string, groupJid: string, contactGroupId?: string) =>
    api.post<ApiResponse<{ created: number; skipped: number }>>(
      `/devices/${deviceId}/wa-groups/${encodeURIComponent(groupJid)}/import`,
      contactGroupId ? { contactGroupId } : {}
    ),
}

export const deviceQueryKeys = {
  all:       ['devices'] as const,
  detail:    (id: string) => ['devices', id] as const,
  agents:    (id: string) => ['devices', id, 'agents'] as const,
  waGroups:  (id: string) => ['devices', id, 'wa-groups'] as const,
  waMembers: (id: string, jid: string) => ['devices', id, 'wa-groups', jid] as const,
}
