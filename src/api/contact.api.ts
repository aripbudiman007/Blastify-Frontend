import api from './axios'
import type { ApiResponse, Contact, ContactGroup, ContactLabel, CreateContactDto, UpdateContactDto } from '@/types'

export interface DedupeResult {
  dryRun: boolean
  duplicateGroups: number
  contactsRemoved: number
  details: {
    phone: string
    kept: { id: string; name: string; phone: string }
    removed: { id: string; name: string; phone: string }[]
  }[]
}

export const contactApi = {
  // ─── Labels ───────────────────────────────────────────────────────────────────
  getLabels: () =>
    api.get<ApiResponse<{ labels: ContactLabel[] }>>('/contacts/labels'),

  createLabel: (data: { name: string; color?: string }) =>
    api.post<ApiResponse<{ label: ContactLabel }>>('/contacts/labels', data),

  updateLabel: (id: string, data: { name?: string; color?: string }) =>
    api.put<ApiResponse<{ label: ContactLabel }>>(`/contacts/labels/${id}`, data),

  deleteLabel: (id: string) =>
    api.delete<ApiResponse<null>>(`/contacts/labels/${id}`),

  assignLabels: (contactId: string, labelIds: string[]) =>
    api.post<ApiResponse<{ contact: Contact }>>(`/contacts/${contactId}/labels`, { labelIds }),

  removeLabelFromContact: (contactId: string, labelId: string) =>
    api.delete<ApiResponse<null>>(`/contacts/${contactId}/labels/${labelId}`),

  validateNumbers: (deviceId: string, phones: string[]) =>
    api.get<ApiResponse<{ results: { phone: string; isWhatsApp: boolean; jid: string | null }[] }>>(
      '/contacts/validate',
      { params: { deviceId, phones: phones.join(',') } }
    ),

  // ─── Contacts ────────────────────────────────────────────────────────────────
  getAll: (params?: { q?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ contacts: Contact[] }>>('/contacts', { params }),

  create: (data: CreateContactDto) =>
    api.post<ApiResponse<{ contact: Contact }>>('/contacts', data),

  update: (id: string, data: UpdateContactDto) =>
    api.put<ApiResponse<{ contact: Contact }>>(`/contacts/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/contacts/${id}`),

  /** POST /contacts/dedupe — gabungkan duplikat (08xx vs 628xx). dryRun untuk pratinjau */
  dedupe: (dryRun: boolean) =>
    api.post<ApiResponse<DedupeResult>>('/contacts/dedupe', { dryRun }),

  /** GET /contacts/export — response CSV mentah, bukan JSON */
  exportCsv: () =>
    api.get<Blob>('/contacts/export', { responseType: 'blob' }),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<{ imported: number; skipped: number; errors: { row: number; error: string }[] }>>(
      '/contacts/import',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  // ─── Groups ──────────────────────────────────────────────────────────────────
  getGroups: () =>
    api.get<ApiResponse<{ groups: ContactGroup[] }>>('/contacts/groups'),

  createGroup: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<{ group: ContactGroup }>>('/contacts/groups', data),

  updateGroup: (id: string, data: { name?: string; description?: string }) =>
    api.put<ApiResponse<{ group: ContactGroup }>>(`/contacts/groups/${id}`, data),

  deleteGroup: (id: string) =>
    api.delete<ApiResponse<null>>(`/contacts/groups/${id}`),

  getGroupContacts: (groupId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ contacts: Contact[] }>>(`/contacts/groups/${groupId}/contacts`, { params }),

  addGroupMembers: (groupId: string, contactIds: string[]) =>
    api.post<ApiResponse<{ group: ContactGroup }>>(`/contacts/groups/${groupId}/members`, { contactIds }),

  removeGroupMember: (groupId: string, contactId: string) =>
    api.delete<ApiResponse<null>>(`/contacts/groups/${groupId}/members/${contactId}`),
}

export const contactQueryKeys = {
  all:    (params?: object) => ['contacts', params] as const,
  labels: ['contacts', 'labels'] as const,
  groups: ['contacts', 'groups'] as const,
  groupContacts: (groupId: string) => ['contacts', 'groups', groupId, 'contacts'] as const,
}
