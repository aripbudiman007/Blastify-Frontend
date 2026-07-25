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
import { PLAN_COLORS, STATUS_COLORS } from '@/lib/constants'
import type { DeviceStatus } from '@/types'

const STATUSES: DeviceStatus[] = ['CONNECTED', 'CONNECTING', 'QR_READY', 'DISCONNECTED', 'BANNED', 'LOGGED_OUT']

export function AdminDevicesPage() {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState<string>('all')
  const [disconnectTarget, setDisconnect] = useState<string | null>(null)
  const [deleteTarget, setDelete]         = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.devices, page, statusFilter],
    queryFn:  () => adminApi.listDevices({
      page,
      status: statusFilter !== 'all' ? statusFilter as DeviceStatus : undefined,
    }),
    select: (r) => r.data.data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: adminQueryKeys.devices })

  const { mutate: disconnect, isPending: disconnecting } = useMutation({
    mutationFn: (id: string) => adminApi.disconnectDevice(id),
    onSuccess: () => { invalidate(); toast.success('Device diputus'); setDisconnect(null) },
    onError:   () => toast.error('Gagal memutus device'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => adminApi.deleteDevice(id),
    onSuccess: () => { invalidate(); toast.success('Device dihapus'); setDelete(null) },
    onError:   () => toast.error('Gagal menghapus device'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Devices</h1>
        <p className="text-sm text-muted-foreground">{data?.total ? `${data.total} device terdaftar` : 'Kelola semua device'}</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Semua status" /></SelectTrigger>
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
                  <TableHead>Device</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((dev: import('@/api/admin.api').AdminDeviceRow) => (
                  <TableRow key={dev.id}>
                    <TableCell className="font-medium text-sm">{dev.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{dev.user.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-muted-foreground">{dev.user.email}</p>
                          <Badge className={cn('text-[10px] py-0', PLAN_COLORS[dev.user.plan])}>{dev.user.plan}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dev.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[dev.status] ?? 'bg-gray-100 text-gray-700')}>
                        {dev.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(dev.createdAt, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {dev.status === 'CONNECTED' && (
                          <Button size="icon" variant="outline" className="h-8 w-8" title="Disconnect"
                            onClick={() => setDisconnect(dev.id)}>
                            <Icon icon="mdi:wifi-off" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                          onClick={() => setDelete(dev.id)}>
                          <Icon icon="mdi:delete-outline" />
                        </Button>
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

      <ConfirmDialog open={!!disconnectTarget} onOpenChange={v => { if (!v) setDisconnect(null) }}
        title="Putus Koneksi Device?" description="Sesi WhatsApp device ini akan dihentikan paksa."
        confirmLabel="Putus" destructive loading={disconnecting}
        onConfirm={() => { if (disconnectTarget) disconnect(disconnectTarget) }} />

      <ConfirmDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDelete(null) }}
        title="Hapus Device?" description="Device dan semua riwayat pesannya akan dihapus permanen."
        confirmLabel="Hapus" destructive loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget) }} />
    </div>
  )
}
