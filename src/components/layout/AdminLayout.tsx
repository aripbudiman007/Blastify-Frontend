import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAdminStore } from '@/store/admin.store'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { useState } from 'react'

const ADMIN_NAV = [
  { to: '/admin/dashboard',     icon: 'mdi:view-dashboard-outline',  label: 'Dashboard'      },
  { to: '/admin/users',         icon: 'mdi:account-group-outline',   label: 'Users'          },
  { to: '/admin/invoices',      icon: 'mdi:receipt-text-outline',    label: 'Invoices'       },
  { to: '/admin/revenue',       icon: 'mdi:cash-multiple',           label: 'Revenue'        },
  { to: '/admin/plans',         icon: 'mdi:tag-multiple-outline',    label: 'Plans'          },
  { to: '/admin/devices',       icon: 'mdi:cellphone',       label: 'Devices'        },
  { to: '/admin/broadcasts',    icon: 'mdi:bullhorn-outline',        label: 'Broadcasts'     },
  { to: '/admin/announcements', icon: 'mdi:bullhorn-variant-outline',label: 'Announcements'  },
  { to: '/admin/audit-logs',    icon: 'mdi:clipboard-text-clock-outline', label: 'Audit Logs'},
  { to: '/admin/email-templates', icon: 'mdi:email-edit-outline', label: 'Email Templates'},
]

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100    text-red-800',
  ADMIN:       'bg-orange-100 text-orange-800',
  STAFF:       'bg-blue-100   text-blue-800',
}

export function AdminLayout() {
  const { admin, clearAdmin } = useAdminStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { clearAdmin(); navigate('/admin/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 w-[220px] bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0 md:relative md:z-auto'
      )}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt={APP_NAME} className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-white">Admin Panel</p>
              <p className="text-[10px] text-slate-400">{APP_NAME}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <Icon icon={item.icon} className="text-[17px] flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="px-2 py-2 mb-1">
            <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
            {admin?.role && (
              <span className={cn('mt-1 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded', ROLE_COLORS[admin.role] ?? 'bg-gray-100 text-gray-700')}>
                {admin.role}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <Icon icon="mdi:logout" className="text-[16px]" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 border-b dark:border-slate-800 flex-shrink-0">
          <button
            className="md:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon icon="mdi:menu" className="text-xl" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">Backoffice Admin</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
