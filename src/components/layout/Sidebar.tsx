import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { APP_NAME, PLAN_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { inboxApi, inboxQueryKeys } from '@/api/inbox.api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: 'mdi:view-dashboard-outline', activeIcon: 'mdi:view-dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Perangkat',
    items: [
      { to: '/devices', icon: 'mdi:cellphone', activeIcon: 'mdi:cellphone', label: 'Devices', badge: true },
    ],
  },
  {
    label: 'Pesan',
    items: [
      { to: '/inbox',            icon: 'mdi:inbox-outline',             activeIcon: 'mdi:inbox',             label: 'Inbox',        badge: true },
      { to: '/messages/send',    icon: 'mdi:send-outline',              activeIcon: 'mdi:send',              label: 'Kirim Pesan'   },
      { to: '/messages/history', icon: 'mdi:message-text-clock-outline', activeIcon: 'mdi:message-text-clock', label: 'Riwayat Pesan' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/contacts',   icon: 'mdi:contacts-outline',       activeIcon: 'mdi:contacts',       label: 'Kontak'    },
      { to: '/broadcasts', icon: 'mdi:bullhorn-outline',        activeIcon: 'mdi:bullhorn',       label: 'Broadcast' },
      { to: '/templates',  icon: 'mdi:file-document-outline',   activeIcon: 'mdi:file-document',  label: 'Templates' },
    ],
  },
  {
    label: 'Otomasi',
    items: [
      { to: '/auto-reply',    icon: 'mdi:reply-all-outline', activeIcon: 'mdi:reply-all',    label: 'Auto-Reply'  },
      { to: '/chat-flows',    icon: 'mdi:robot-outline',     activeIcon: 'mdi:robot',        label: 'Chat Flow'   },
      { to: '/integrations',  icon: 'mdi:connection',        activeIcon: 'mdi:connection',   label: 'Integrasi'   },
      { to: '/webhooks',      icon: 'mdi:webhook',           activeIcon: 'mdi:webhook',      label: 'Webhook'     },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { to: '/account',      icon: 'mdi:account-circle-outline', activeIcon: 'mdi:account-circle', label: 'Akun' },
      { to: '/ip-whitelist', icon: 'mdi:shield-key-outline',     activeIcon: 'mdi:shield-key',     label: 'IP Whitelist' },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: devicesData } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
    staleTime: 30_000,
  })

  const connectedCount = devicesData?.filter((d) => d.status === 'CONNECTED').length ?? 0

  const { data: conversations } = useQuery({
    queryKey: inboxQueryKeys.conversations,
    queryFn:  () => inboxApi.getConversations(),
    select:   (r) => r.data.data?.conversations ?? [],
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  const totalUnread = (conversations ?? []).reduce((s, c) => s + c.unreadCount, 0)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col w-[240px]',
          'border-r transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:relative md:z-auto',
        )}
        style={{ background: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-4 py-[18px]"
          style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}
        >
          <img src="/logo.png" alt={APP_NAME} className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-[15px] tracking-tight" style={{ color: 'hsl(var(--sidebar-fg))' }}>
              {APP_NAME}
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            <Icon icon="mdi:close" className="text-base" />
          </button>
        </div>

        {/* ── Nav ───────────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'hsl(var(--sidebar-muted))' }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => { if (window.innerWidth < 768) onClose() }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                        isActive
                          ? 'text-white shadow-sm'
                          : 'hover:text-white'
                      )
                    }
                    style={({ isActive }) => ({
                      background: isActive ? 'hsl(var(--sidebar-active))' : 'transparent',
                      color: isActive ? '#fff' : 'hsl(var(--sidebar-muted))',
                    })}
                    onMouseEnter={(e) => {
                      if (!(e.currentTarget as HTMLElement).classList.contains('active')) {
                        (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-border))'
                        ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--sidebar-fg))'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(e.currentTarget as HTMLElement).querySelector('[data-active]')) {
                        const isActive = (e.currentTarget as HTMLElement).getAttribute('aria-current') === 'page'
                        if (!isActive) {
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--sidebar-muted))'
                        }
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          icon={isActive ? (item.activeIcon ?? item.icon) : item.icon}
                          className="text-[17px] flex-shrink-0"
                        />
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && item.badge && item.to === '/inbox' && totalUnread > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500 text-white">
                            {totalUnread > 99 ? '99+' : totalUnread}
                          </span>
                        )}
                        {'badge' in item && item.badge && item.to === '/devices' && connectedCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-wa-600 text-white">
                            {connectedCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── User footer ──────────────────────────────────────────────────── */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}
        >
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-wa-700 text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: 'hsl(var(--sidebar-fg))' }}>
                {user?.name}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'hsl(var(--sidebar-muted))' }}>
                {user?.email}
              </p>
            </div>
            <span
              className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0', PLAN_COLORS[user?.plan ?? 'FREE'])}
            >
              {user?.plan}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(0 63% 31% / 0.3)'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(0 84% 75%)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--sidebar-muted))'
            }}
          >
            <Icon icon="mdi:logout" className="text-[17px]" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
