import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { messageApi, messageQueryKeys } from '@/api/message.api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useDebounce } from '@/hooks/useDebounce'
import { STATUS_COLORS, MESSAGE_TYPE_ICONS, MESSAGE_TYPE_LABELS } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Message, MessageStatus } from '@/types'

const statuses: MessageStatus[] = ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED']

export function MessageHistoryPage() {
  const [search, setSearch] = useState('')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Message | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Message | null>(null)
  const limit = 20
  const queryClient = useQueryClient()

  // Tarik pesan (delete for everyone) — hanya untuk pesan yang sudah terkirim
  const { mutate: revoke, isPending: revoking } = useMutation({
    mutationFn: (id: string) => messageApi.revoke(id),
    onSuccess: () => {
      toast.success('Pesan ditarik untuk semua orang')
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (err: { response?: { data?: { error?: { code?: string; message?: string } } } }) => {
      const code = err.response?.data?.error?.code
      toast.error(
        code === 'SESSION_NOT_ACTIVE' ? 'Device tidak terhubung ke WhatsApp'
        : code === 'NOT_SENT' ? 'Pesan belum terkirim — tidak bisa ditarik'
        : err.response?.data?.error?.message ?? 'Gagal menarik pesan',
      )
    },
  })

  const debouncedSearch = useDebounce(search, 400)

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => deviceApi.getAll(),
    select: (r) => r.data.data?.devices ?? [],
  })

  const filter = {
    search: debouncedSearch || undefined,
    deviceId: deviceFilter !== 'all' ? deviceFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as MessageStatus) : undefined,
    page,
    limit,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: messageQueryKeys.all(filter),
    queryFn: () => messageApi.getAll(filter),
  })

  const messages = data?.data.data?.messages ?? []
  const meta = data?.data.meta
  const totalPages = meta ? Math.ceil(meta.total / limit) : 1

  const handleReset = () => {
    setSearch('')
    setDeviceFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  return (
    <div>
      <PageHeader title="Riwayat Pesan" description="Semua pesan yang dikirim melalui Blastify" />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nomor tujuan..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <Select value={deviceFilter} onValueChange={(v) => { setDeviceFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Device</SelectItem>
            {devices?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || deviceFilter !== 'all' || statusFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <Icon icon="mdi:filter-off" className="mr-1" />
            Reset
          </Button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : messages.length === 0 ? (
        <EmptyState
          icon="mdi:message-off"
          title="Tidak ada pesan ditemukan"
          description="Coba ubah filter atau kirim pesan baru"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className={cn('overflow-x-auto', isFetching && 'opacity-70')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs bg-muted/30">
                    <th className="text-left px-4 py-3">Tujuan</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Tipe</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Isi Pesan</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Waktu</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : messages.map((msg) => (
                        <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">+{msg.to}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon icon={MESSAGE_TYPE_ICONS[msg.type]} />
                              {MESSAGE_TYPE_LABELS[msg.type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                            {truncate(msg.content ?? '', 60)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn('text-xs', STATUS_COLORS[msg.status])}>
                              {msg.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(msg.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-0.5 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDetail(msg)}
                              >
                                <Icon icon="mdi:eye-outline" />
                              </Button>
                              {['SENT', 'DELIVERED', 'READ'].includes(msg.status) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  title="Tarik pesan (hapus untuk semua)"
                                  onClick={() => setRevokeTarget(msg)}
                                >
                                  <Icon icon="mdi:undo-variant" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <span className="text-muted-foreground">
                  {meta && `${(page - 1) * limit + 1}–${Math.min(page * limit, meta.total)} dari ${meta.total}`}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline" size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <Icon icon="mdi:chevron-left" />
                  </Button>
                  <span className="flex items-center px-3 text-xs">{page} / {totalPages}</span>
                  <Button
                    variant="outline" size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <Icon icon="mdi:chevron-right" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              {[
                { label: 'ID', value: detail.id },
                { label: 'Tujuan', value: `+${detail.to}` },
                { label: 'Tipe', value: MESSAGE_TYPE_LABELS[detail.type] },
                { label: 'Status', value: <Badge className={cn('text-xs', STATUS_COLORS[detail.status])}>{detail.status}</Badge> },
                { label: 'Isi Pesan', value: detail.content || '-' },
                { label: 'URL Media', value: detail.mediaUrl || '-' },
                { label: 'Error', value: detail.errorMessage || '-' },
                { label: 'Dibuat', value: formatDate(detail.createdAt) },
                { label: 'Terkirim', value: detail.sentAt ? formatDate(detail.sentAt) : '-' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
                  <span className="text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(v) => { if (!v) setRevokeTarget(null) }}
        title="Tarik pesan ini?"
        description={`Pesan ke +${revokeTarget?.to} akan dihapus untuk semua orang (delete for everyone). Aksi ini tidak bisa dibatalkan.`}
        confirmLabel="Tarik Pesan" destructive loading={revoking}
        onConfirm={() => { if (revokeTarget) { revoke(revokeTarget.id); setRevokeTarget(null) } }}
      />
    </div>
  )
}
