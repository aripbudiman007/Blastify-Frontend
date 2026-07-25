import { Icon } from '@iconify/react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  iconBg?: string
  accentColor?: string   // CSS color for top border accent
  description?: string
  trend?: { value: number; positive?: boolean }
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon,
  iconColor   = 'text-wa-600',
  iconBg      = 'bg-wa-50 dark:bg-wa-950/40',
  accentColor = 'hsl(142 72% 29%)',
  description,
  trend,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
        </div>
      </div>
    )
  }

  const formatted = typeof value === 'number' ? value.toLocaleString('id-ID') : value

  return (
    <div
      className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground leading-none mb-1.5">
            {formatted}
          </p>
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-[11px] font-medium',
              trend.positive !== false ? 'text-emerald-600' : 'text-red-500'
            )}>
              <Icon
                icon={trend.positive !== false ? 'mdi:trending-up' : 'mdi:trending-down'}
                className="text-sm"
              />
              <span>{Math.abs(trend.value)}% dari bulan lalu</span>
            </div>
          )}
        </div>

        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          'transition-transform duration-200 group-hover:scale-110',
          iconBg
        )}>
          <Icon icon={icon} className={cn('text-[22px]', iconColor)} />
        </div>
      </div>
    </div>
  )
}
