import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PLAN_COLORS } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'

// Semua nominal dari backend dalam sen IDR
function formatIDR(amountInCents: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(amountInCents / 100)
}

const MONTH_OPTIONS = [3, 6, 12, 24]

export function AdminRevenuePage() {
  const [months, setMonths] = useState(12)

  const { data, isLoading } = useQuery({
    queryKey: adminQueryKeys.revenue(months),
    queryFn:  () => adminApi.getRevenueReport(months),
    select:   (r) => r.data.data,
  })

  if (isLoading) return <PageLoader />
  if (!data) return null

  const maxMonthly = Math.max(1, ...data.monthly.map((m) => m.revenue))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Revenue Reports</h1>
          <p className="text-sm text-muted-foreground">MRR, revenue bulanan, dan pembayaran terbaru</p>
        </div>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m} value={String(m)}>{m} bulan terakhir</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-1">MRR (Monthly Recurring Revenue)</p>
            <p className="text-3xl font-bold text-emerald-600">{formatIDR(data.mrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.mrrByPlan.reduce((n, p) => n + p.subscribers, 0)} subscriber berbayar aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Revenue Sepanjang Masa</p>
            <p className="text-3xl font-bold">{formatIDR(data.allTime.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.allTime.invoices} invoice terbayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Revenue {months} Bulan Terakhir</p>
            <p className="text-3xl font-bold">
              {formatIDR(data.monthly.reduce((n, m) => n + m.revenue, 0))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.monthly.reduce((n, m) => n + m.invoices, 0)} invoice terbayar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly revenue bars */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon icon="mdi:chart-bar" className="text-emerald-600" />
              Revenue per Bulan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.monthly.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada pembayaran di periode ini.</p>
            ) : (
              <div className="space-y-2">
                {data.monthly.map((m) => (
                  <div key={m.month} className="flex items-center gap-2 text-xs">
                    <span className="w-16 flex-shrink-0 font-mono text-muted-foreground">{m.month}</span>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(m.revenue / maxMonthly) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-medium">{formatIDR(m.revenue)}</span>
                    <span className="w-14 text-right text-muted-foreground">{m.invoices} inv</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MRR by plan + payment methods */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:star-circle-outline" className="text-amber-500" />
                MRR per Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!data.mrrByPlan.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada subscriber berbayar.</p>
              ) : data.mrrByPlan.map((p) => (
                <div key={p.plan} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', PLAN_COLORS[p.plan])}>{p.plan}</span>
                    <span className="text-muted-foreground text-xs">{p.subscribers} subscriber</span>
                  </span>
                  <span className="font-medium">{formatIDR(p.mrr)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:credit-card-multiple-outline" className="text-blue-500" />
                Per Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!data.byPaymentMethod.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data.</p>
              ) : data.byPaymentMethod.map((m) => (
                <div key={m.method} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{m.method} <span className="text-muted-foreground text-xs">({m.invoices} inv)</span></span>
                  <span className="font-medium">{formatIDR(m.revenue)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="mdi:receipt-text-check-outline" className="text-emerald-600" />
            Pembayaran Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs bg-muted/30">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Jumlah</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Dibayar</th>
                </tr>
              </thead>
              <tbody>
                {!data.recentPayments.length ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Belum ada pembayaran.</td></tr>
                ) : data.recentPayments.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', PLAN_COLORS[inv.plan])}>{inv.plan}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatIDR(inv.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {inv.paidAt ? formatDate(inv.paidAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
