import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/auth.store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const breadcrumbMap: Record<string, { label: string; icon: string }> = {
  '/dashboard':         { label: 'Dashboard',     icon: 'mdi:view-dashboard'      },
  '/devices':           { label: 'Devices',        icon: 'mdi:cellphone'           },
  '/messages/send':     { label: 'Kirim Pesan',    icon: 'mdi:send'                },
  '/messages/history':  { label: 'Riwayat Pesan',  icon: 'mdi:message-text-clock'  },
  '/contacts':          { label: 'Kontak',          icon: 'mdi:contacts'            },
  '/broadcasts':        { label: 'Broadcast',       icon: 'mdi:bullhorn'            },
  '/auto-reply':        { label: 'Auto-Reply',      icon: 'mdi:reply-all'           },
  '/webhooks':          { label: 'Webhook',          icon: 'mdi:webhook'             },
  '/account':           { label: 'Akun',             icon: 'mdi:account-circle'      },
}

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const match = Object.entries(breadcrumbMap).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )
  const current = match?.[1] ?? { label: 'Halaman', icon: 'mdi:circle' }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 h-14
                       bg-card/95 backdrop-blur-md border-b border-border">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 text-muted-foreground"
        onClick={onMenuClick}
      >
        <Icon icon="mdi:menu" className="text-xl" />
      </Button>

      {/* Page title */}
      <div className="flex items-center gap-2">
        <Icon icon={current.icon} className="text-wa-600 text-[18px]" />
        <h1 className="font-semibold text-foreground text-sm md:text-[15px] tracking-tight">
          {current.label}
        </h1>
      </div>

      {/* Spacer */}
      <div className="ml-auto flex items-center gap-2">
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-muted"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-wa-600 text-white text-[11px] font-bold">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-[12px] font-semibold leading-none">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{user?.plan}</span>
              </div>
              <Icon icon="mdi:chevron-down" className="text-muted-foreground text-sm ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 mt-1">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate('/account')} className="gap-2 text-sm">
              <Icon icon="mdi:account-circle-outline" className="text-base" />
              Profil & Akun
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/account')} className="gap-2 text-sm">
              <Icon icon="mdi:key-outline" className="text-base" />
              API Key
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-sm text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <Icon icon="mdi:logout" className="text-base" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
