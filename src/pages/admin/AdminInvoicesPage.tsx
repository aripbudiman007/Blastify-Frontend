import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatDate } from '@/lib/utils'
import { PLAN_COLORS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import type { Plan, InvoiceStatus } from '@/types'

const PLANS: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']
const STATUSES: InvoiceStatus[] = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']

export function AdminInvoicesPage() {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState<string>('all')
  const [planFilter, setPlan]     = useState<string>('all')
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget]   = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.invoices, page, statusFilter, planFilter],
    queryFn:  () => adminApi.listInvoices({
      page,
      status: statusFilter !== 'all' ? statusFilter as InvoiceStatus : undefined,
      plan:   planFilter   !== 'all' ? planFilter as Plan : undefined,
    }),
    select: (r) => r.data.data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: adminQueryKeys.invoices })

  const { mutate: confirm, isPending: confirming } = useMutation({
    mutationFn: (id: string) => adminApi.confirmInvoice(id),
    onSuccess:  () => { invalidate(); toast.success('Invoice dikonfirmasi — plan user diperbarui'); setConfirmTarget(null) },
    onError:    (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Gagal mengkonfirmasi invoice'),
  })

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => adminApi.cancelInvoice(id),
    onSuccess:  () => { invalidate(); toast.success('Invoice dibatalkan'); setCancelTarget(null) },
    onError:    () => toast.error('Gagal membatalkan invoice'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ? `${data.total} invoice` : 'Kelola semua invoice pembayaran'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={v => { setPlan(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Plan</SelectItem>
            {PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((inv: import('@/api/admin.api').AdminInvoiceRow) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{inv.id.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{inv.user.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', PLAN_COLORS[inv.plan])}>{inv.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      Rp {(inv.amount / 100).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', INVOICE_STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-700')}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(inv.createdAt, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {inv.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => setConfirmTarget(inv.id)}>
                              <Icon icon="mdi:check" className="mr-1" />Konfirmasi
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"
                              onClick={() => setCancelTarget(inv.id)}>
                              Batalkan
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.total > 20 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Halaman {data.page} dari {Math.ceil(data.total / data.limit)}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <Icon icon="mdi:chevron-left" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.limit)}>
                  <Icon icon="mdi:chevron-right" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={v => { if (!v) setConfirmTarget(null) }}
        title="Konfirmasi Pembayaran Invoice?"
        description="Invoice akan ditandai PAID dan plan user akan langsung diperbarui."
        confirmLabel="Konfirmasi"
        loading={confirming}
        onConfirm={() => { if (confirmTarget) confirm(confirmTarget) }}
      />
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={v => { if (!v) setCancelTarget(null) }}
        title="Batalkan Invoice?"
        description="Invoice akan ditandai CANCELLED. Aksi ini tidak dapat diundur."
        confirmLabel="Batalkan"
        destructive
        loading={cancelling}
        onConfirm={() => { if (cancelTarget) cancel(cancelTarget) }}
      />
    </div>
  )
}
