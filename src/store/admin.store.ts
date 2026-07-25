import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminRole } from '@/types'

interface AdminInfo {
  id: string
  email: string
  name: string
  role: AdminRole
}

interface AdminState {
  adminToken: string | null
  admin: AdminInfo | null
  setAdmin: (token: string, admin: AdminInfo) => void
  clearAdmin: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      adminToken: null,
      admin: null,
      setAdmin: (adminToken, admin) => set({ adminToken, admin }),
      clearAdmin: () => set({ adminToken: null, admin: null }),
    }),
    { name: 'admin-auth' }
  )
)
