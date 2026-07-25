import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

interface DeviceStatusBadgeProps {
  status: DeviceStatus
  className?: string
}

const config: Record<DeviceStatus, { label: string; icon: string; className: string; animate?: boolean }> = {
  CONNECTED:    { label: 'Terhubung',     icon: 'mdi:check-circle',  className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CONNECTING:   { label: 'Menghubungkan', icon: 'mdi:loading',       className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',  animate: true },
  QR_READY:     { label: 'Scan QR',       icon: 'mdi:qrcode',        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  DISCONNECTED: { label: 'Terputus',      icon: 'mdi:minus-circle',  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  LOGGED_OUT:   { label: 'Keluar',        icon: 'mdi:logout',        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  BANNED:       { label: 'Diblokir',      icon: 'mdi:block-helper',  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function DeviceStatusBadge({ status, className }: DeviceStatusBadgeProps) {
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', c.className, className)}>
      <Icon icon={c.icon} className={cn('text-sm', c.animate && 'animate-spin')} />
      {c.label}
      {status === 'QR_READY' && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse ml-0.5" />
      )}
    </span>
  )
}
