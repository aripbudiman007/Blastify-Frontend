import axios from 'axios'
import { API_URL } from '@/lib/constants'
import { useAdminStore } from '@/store/admin.store'
import type { Plan, Announcement, AdminUser, AuditLog, InvoiceStatus, DeviceStatus, AdminPlanLimit, EmailTemplate, EmailTemplateCategory } from '@/types'

// ─── Axios instance with admin token injection ────────────────────────────────
export const adminAxios = axios.create({
  baseURL: `${API_URL}/admin`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

adminAxios.interceptors.request.use((config) => {
  const token = useAdminStore.getState().adminToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminAxios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAdminStore.getState().clearAdmin()
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

// ─── Response types ───────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number
  activeUsers30d: number
  usersByPlan: Record<Plan, number>
  totalDevices: number
  connectedDevices: number
  messagesToday: number
  messagesThisMonth: number
  revenueThisMonth: number
  pendingInvoices: number
  newUsersToday: number
}

export interface AdminUserRow {
  id: string
  name: string
  email: string
  plan: Plan
  isActive: boolean
  planExpiresAt: string | null
  planActivatedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { devices: number; messages: number }
}

export interface AdminUserDetail extends AdminUserRow {
  apiKey: string
  devices: { id: string; name: string; status: DeviceStatus; phone: string | null }[]
  invoices: AdminInvoiceRow[]
  _count: { devices: number; messages: number; contacts: number; broadcasts: number }
}

export interface AdminInvoiceRow {
  id: string
  userId: string
  plan: Plan
  amount: number
  status: InvoiceStatus
  paymentUrl: string | null
  paidAt: string | null
  expiresAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string }
}

export interface RevenueReport {
  currency: string          // "IDR (sen)"
  mrr: number
  mrrByPlan: { plan: Plan; subscribers: number; mrr: number }[]
  monthly: { month: string; revenue: number; invoices: number }[]
  byPlan: { plan: Plan; revenue: number; invoices: number }[]
  byPaymentMethod: { method: string; revenue: number; invoices: number }[]
  allTime: { revenue: number; invoices: number }
  recentPayments: AdminInvoiceRow[]
}

export interface AdminDeviceRow {
  id: string
  name: string
  phone: string | null
  status: DeviceStatus
  createdAt: string
  user: { id: string; name: string; email: string; plan: Plan }
}

export interface AdminBroadcastRow {
  id: string
  name: string
  status: string
  type: string
  totalCount: number
  sentCount: number
  failedCount: number
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    adminAxios.post<{ success: boolean; data: { token: string; admin: { id: string; email: string; name: string; role: string } } }>(
      '/auth/login', { email, password }
    ),
  me: () =>
    adminAxios.get<{ success: boolean; data: AdminUser }>('/auth/me'),

  // Dashboard
  getStats: () =>
    adminAxios.get<{ success: boolean; data: AdminStats }>('/dashboard/stats'),

  // Revenue report
  getRevenueReport: (months = 12) =>
    adminAxios.get<{ success: boolean; data: RevenueReport }>('/reports/revenue', { params: { months } }),

  // Users
  listUsers: (params?: { page?: number; limit?: number; search?: string; plan?: Plan }) =>
    adminAxios.get<{ success: boolean; data: PaginatedResponse<AdminUserRow> }>('/users', { params }),

  getUser: (id: string) =>
    adminAxios.get<{ success: boolean; data: AdminUserDetail }>(`/users/${id}`),

  updateUserPlan: (id: string, data: { plan: Plan; expiresAt?: string }) =>
    adminAxios.put<{ success: boolean; data: { id: string; email: string; plan: Plan; planExpiresAt: string | null } }>(
      `/users/${id}/plan`, data
    ),

  updateUserStatus: (id: string, isActive: boolean) =>
    adminAxios.put<{ success: boolean; data: { id: string; email: string; isActive: boolean } }>(
      `/users/${id}/status`, { isActive }
    ),

  deleteUser: (id: string) =>
    adminAxios.delete<{ success: boolean; message: string }>(`/users/${id}`),

  // Invoices
  listInvoices: (params?: { status?: InvoiceStatus; plan?: Plan; page?: number; limit?: number; dateFrom?: string; dateTo?: string }) =>
    adminAxios.get<{ success: boolean; data: PaginatedResponse<AdminInvoiceRow> }>('/invoices', { params }),

  getInvoice: (id: string) =>
    adminAxios.get<{ success: boolean; data: AdminInvoiceRow & { user: { plan: Plan; planExpiresAt: string | null } } }>(`/invoices/${id}`),

  confirmInvoice: (id: string) =>
    adminAxios.put<{ success: boolean; data: { invoiceId: string; plan: Plan; planExpiresAt: string } }>(
      `/invoices/${id}/confirm`
    ),

  cancelInvoice: (id: string) =>
    adminAxios.put<{ success: boolean; message: string }>(`/invoices/${id}/cancel`),

  // Devices
  listDevices: (params?: { status?: DeviceStatus; userId?: string; page?: number; limit?: number }) =>
    adminAxios.get<{ success: boolean; data: PaginatedResponse<AdminDeviceRow> }>('/devices', { params }),

  disconnectDevice: (id: string) =>
    adminAxios.put<{ success: boolean; message: string }>(`/devices/${id}/disconnect`),

  deleteDevice: (id: string) =>
    adminAxios.delete<{ success: boolean; message: string }>(`/devices/${id}`),

  // Broadcasts
  listBroadcasts: (params?: { status?: string; userId?: string; page?: number; limit?: number }) =>
    adminAxios.get<{ success: boolean; data: PaginatedResponse<AdminBroadcastRow> }>('/broadcasts', { params }),

  stopBroadcast: (id: string) =>
    adminAxios.put<{ success: boolean; message: string }>(`/broadcasts/${id}/stop`),

  // Announcements
  listAnnouncements: () =>
    adminAxios.get<{ success: boolean; data: Announcement[] }>('/announcements'),

  createAnnouncement: (data: {
    title: string
    content: string
    type?: string
    isActive?: boolean
    startsAt?: string | null
    endsAt?: string | null
    targetPlan?: Plan[]
  }) =>
    adminAxios.post<{ success: boolean; data: Announcement }>('/announcements', data),

  updateAnnouncement: (id: string, data: {
    title?: string; content?: string; type?: string; isActive?: boolean
    startsAt?: string | null; endsAt?: string | null; targetPlan?: Plan[]
  }) =>
    adminAxios.put<{ success: boolean; data: Announcement }>(`/announcements/${id}`, data),

  deleteAnnouncement: (id: string) =>
    adminAxios.delete<{ success: boolean; message: string }>(`/announcements/${id}`),

  // Audit logs
  getAuditLogs: (params?: { page?: number; limit?: number; actorId?: string; action?: string; dateFrom?: string; dateTo?: string }) =>
    adminAxios.get<{ success: boolean; data: PaginatedResponse<AuditLog> }>('/audit-logs', { params }),

  // Admin management (SUPER_ADMIN only)
  listAdmins: () =>
    adminAxios.get<{ success: boolean; data: AdminUser[] }>('/admins'),

  createAdmin: (data: { email: string; name: string; password: string; role?: string }) =>
    adminAxios.post<{ success: boolean; data: AdminUser }>('/admins', data),

  updateAdminStatus: (id: string, isActive: boolean) =>
    adminAxios.put<{ success: boolean; data: { id: string; email: string; isActive: boolean } }>(
      `/admins/${id}/status`, { isActive }
    ),

  // Plans (admin can edit pricing & limits — angka -1 = unlimited, price dalam IDR sen)
  listPlans: () =>
    adminAxios.get<{ success: boolean; data: { plans: AdminPlanLimit[] } }>('/plans'),

  updatePlan: (plan: Plan, data: Partial<Omit<AdminPlanLimit, 'id' | 'plan' | 'seeded'>>) =>
    adminAxios.put<{ success: boolean; data: AdminPlanLimit }>(`/plans/${plan}`, data),

  // Email templates (default sistem — dipakai sebagai fallback semua user)
  listEmailTemplates: () =>
    adminAxios.get<{ success: boolean; data: { templates: EmailTemplate[] } }>('/email-templates'),

  createEmailTemplate: (data: {
    name: string
    slug: string
    category?: EmailTemplateCategory
    subject: string
    htmlContent: string
    plainTextContent?: string
  }) =>
    adminAxios.post<{ success: boolean; data: EmailTemplate }>('/email-templates', data),

  updateEmailTemplate: (id: string, data: {
    name?: string
    category?: EmailTemplateCategory
    subject?: string
    htmlContent?: string
    plainTextContent?: string
    isActive?: boolean
  }) =>
    adminAxios.put<{ success: boolean; data: EmailTemplate }>(`/email-templates/${id}`, data),

  deleteEmailTemplate: (id: string) =>
    adminAxios.delete<{ success: boolean; message: string }>(`/email-templates/${id}`),
}

export const adminQueryKeys = {
  stats:         ['admin', 'stats'] as const,
  plans:         ['admin', 'plans'] as const,
  revenue:       (months: number) => ['admin', 'revenue', months] as const,
  users:         ['admin', 'users'] as const,
  userDetail:    (id: string) => ['admin', 'users', id] as const,
  invoices:      ['admin', 'invoices'] as const,
  invoiceDetail: (id: string) => ['admin', 'invoices', id] as const,
  devices:       ['admin', 'devices'] as const,
  broadcasts:    ['admin', 'broadcasts'] as const,
  announcements: ['admin', 'announcements'] as const,
  auditLogs:     ['admin', 'audit-logs'] as const,
  admins:        ['admin', 'admins'] as const,
  emailTemplates: ['admin', 'email-templates'] as const,
}
