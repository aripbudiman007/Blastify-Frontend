import { Navigate, Outlet } from 'react-router-dom'
import { useAdminStore } from '@/store/admin.store'

export function AdminProtectedRoute() {
  const { adminToken } = useAdminStore()
  if (!adminToken) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
