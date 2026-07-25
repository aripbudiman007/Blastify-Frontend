import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { PLAN_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

const PLANS: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: adminQueryKeys.stats,
    queryFn:  () => adminApi.getStats(),
    select:   (r) => r.data.data,
    refetchInterval: 60_000,
  })

  if (isLoading) return <PageLoader />
  if (!stats) return null

  const maxPlanCount = Math.max(...Object.values(stats.usersByPlan ?? {}).map(Number), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan sistem secara keseluruhan</p>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',     value: stats.totalUsers,        icon: 'mdi:account-group',   color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Total Devices',   value: stats.totalDevices,      icon: 'mdi:cellphone',        color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Online Sekarang', value: stats.connectedDevices,  icon: 'mdi:wifi',             color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Invoice Pending', value: stats.pendingInvoices,   icon: 'mdi:receipt-text-clock', color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', s.bg)}>
              <Icon icon={s.icon} className={cn('text-xl', s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pesan Hari Ini',   value: stats.messagesToday.toLocaleString(),        icon: 'mdi:message-text',    color: 'text-cyan-600',    bg: 'bg-cyan-50'    },
          { label: 'Pesan Bulan Ini',  value: stats.messagesThisMonth.toLocaleString(),    icon: 'mdi:message-text',    color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
          { label: 'User Aktif 30h',   value: stats.activeUsers30d.toLocaleString(),       icon: 'mdi:account-check',   color: 'text-teal-600',    bg: 'bg-teal-50'    },
          { label: 'User Baru Hari Ini', value: stats.newUsersToday.toLocaleString(),      icon: 'mdi:account-plus',    color: 'text-violet-600',  bg: 'bg-violet-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', s.bg)}>
              <Icon icon={s.icon} className={cn('text-xl', s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Plan breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border p-5">
          <p className="text-sm font-semibold text-muted-foreground mb-1">Revenue Bulan Ini</p>
          <p className="text-3xl font-bold text-emerald-600">{formatIDR(stats.revenueThisMonth)}</p>
          <p className="text-xs text-muted-foreground mt-1">Dari invoice yang sudah dikonfirmasi</p>
        </div>

        {/* Plan breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border p-5 space-y-3">
          <p className="text-sm font-semibold">Distribusi Plan</p>
          {PLANS.map(plan => {
            const count = stats.usersByPlan?.[plan] ?? 0
            const pct = Math.round((count / maxPlanCount) * 100)
            return (
              <div key={plan} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('px-2 py-0.5 rounded font-bold text-[11px]', PLAN_COLORS[plan])}>{plan}</span>
                  <span className="font-semibold">{count.toLocaleString()} user</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-wa-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
