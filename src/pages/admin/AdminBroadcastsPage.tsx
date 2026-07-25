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
import { STATUS_COLORS } from '@/lib/constants'
import type { BroadcastStatus } from '@/types'

const STATUSES: BroadcastStatus[] = ['DRAFT', 'QUEUED', 'RUNNING', 'PAUSED', 'FINISHED', 'FAILED']

export function AdminBroadcastsPage() {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState<string>('all')
  const [stopTarget, setStopTarget] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.broadcasts, page, statusFilter],
    queryFn:  () => adminApi.listBroadcasts({
      page,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    select: (r) => r.data.data,
  })

  const { mutate: stop, isPending: stopping } = useMutation({
    mutationFn: (id: string) => adminApi.stopBroadcast(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminQueryKeys.broadcasts })
      toast.success('Broadcast dihentikan')
      setStopTarget(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Gagal menghentikan broadcast'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Broadcasts</h1>
        <p className="text-sm text-muted-foreground">{data?.total ? `${data.total} broadcast` : 'Monitor semua broadcast'}</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((bc: import('@/api/admin.api').AdminBroadcastRow) => (
                  <TableRow key={bc.id}>
                    <TableCell className="font-medium text-sm">{bc.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{bc.user.name}</p>
                        <p className="text-xs text-muted-foreground">{bc.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[bc.status] ?? 'bg-gray-100 text-gray-700')}>
                        {bc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="text-green-600 font-medium">{bc.sentCount}</span>
                      {' / '}
                      <span>{bc.totalCount}</span>
                      {bc.failedCount > 0 && <span className="text-red-500 ml-1">({bc.failedCount} gagal)</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {bc.startedAt ? formatDate(bc.startedAt, 'dd MMM HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {bc.status === 'RUNNING' && (
                          <Button size="sm" variant="destructive" className="h-7 text-xs"
                            onClick={() => setStopTarget(bc.id)}>
                            <Icon icon="mdi:stop" className="mr-1" />Stop
                          </Button>
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
              <span className="text-muted-foreground">Halaman {data.page} dari {Math.ceil(data.total / data.limit)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><Icon icon="mdi:chevron-left" /></Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / data.limit)}><Icon icon="mdi:chevron-right" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!stopTarget}
        onOpenChange={v => { if (!v) setStopTarget(null) }}
        title="Hentikan Broadcast?"
        description="Broadcast akan diset ke status PAUSED. Bisa dilanjutkan oleh user."
        confirmLabel="Hentikan"
        destructive
        loading={stopping}
        onConfirm={() => { if (stopTarget) stop(stopTarget) }}
      />
    </div>
  )
}
