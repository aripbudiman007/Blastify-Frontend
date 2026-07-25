import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { broadcastApi, broadcastQueryKeys, type BroadcastAnalytics } from '@/api/broadcast.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { contactApi, contactQueryKeys } from '@/api/contact.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/store/auth.store'
import { PLAN_LIMITS, STATUS_COLORS, MESSAGE_TYPE_LABELS } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Broadcast } from '@/types'

const schema = z.object({
  name:           z.string().min(1, 'Nama wajib diisi'),
  deviceId:       z.string().optional(),
  contactGroupId: z.string().optional(),
  type:           z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']),
  content:        z.string().min(1, 'Isi pesan wajib diisi'),
  mediaUrl:       z.string().optional(),
  caption:        z.string().optional(),
  scheduledAt:    z.string().optional(),
  delayMin:       z.coerce.number().min(500).default(1000),
  delayMax:       z.coerce.number().min(500).default(3000),
  abTestingEnabled: z.boolean().default(false),
  variantBContent:  z.string().optional(),
  variantBMediaUrl: z.string().optional(),
  variantBCaption:  z.string().optional(),
  variantBRatio:    z.coerce.number().min(1, 'Minimal 1%').max(99, 'Maksimal 99%').default(50),
}).superRefine((data, ctx) => {
  if (data.abTestingEnabled && !data.variantBContent?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isi pesan varian B wajib diisi', path: ['variantBContent'] })
  }
  if (data.delayMin && data.delayMax && data.delayMin > data.delayMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delay minimum tidak boleh lebih besar dari maksimum', path: ['delayMin'] })
  }
})
type FormData = z.infer<typeof schema>

const broadcastStatusIcon: Record<string, string> = {
  DRAFT:    'mdi:file-document-outline',
  QUEUED:   'mdi:clock-outline',
  RUNNING:  'mdi:play-circle',
  PAUSED:   'mdi:pause-circle',
  FINISHED: 'mdi:check-circle',
  FAILED:   'mdi:alert-circle',
}

export function BroadcastsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const plan = user?.plan ?? 'FREE'
  const canDeviceRotation = PLAN_LIMITS[plan]?.canDeviceRotation ?? false

  const [page, setPage]             = useState(1)
  const [formOpen, setFormOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null)
  const [logsTarget, setLogsTarget] = useState<Broadcast | null>(null)
  const [logsPage, setLogsPage]     = useState(1)
  const [analyticsTarget, setAnalyticsTarget] = useState<Broadcast | null>(null)
  const limit = 10

  const { data: broadcastData, isLoading } = useQuery({
    queryKey: broadcastQueryKeys.all({ page, limit }),
    queryFn:  () => broadcastApi.getAll({ page, limit }),
  })
  const broadcasts  = broadcastData?.data.data?.broadcasts ?? []
  const meta        = broadcastData?.data.meta
  const totalPages  = meta ? Math.ceil(meta.total / limit) : 1

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
  })

  const { data: groups } = useQuery({
    queryKey: contactQueryKeys.groups,
    queryFn:  () => contactApi.getGroups(),
    select:   (r) => r.data.data?.groups ?? [],
  })

  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as Resolver<FormData>,
      defaultValues: { type: 'TEXT', delayMin: 1000, delayMax: 3000, abTestingEnabled: false, variantBRatio: 50 },
    })

  const msgType = watch('type')
  const abTestingEnabled = watch('abTestingEnabled')
  const variantBRatio = watch('variantBRatio')

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (d: FormData) => broadcastApi.create({
      name:           d.name,
      deviceId:       d.deviceId,
      contactGroupId: d.contactGroupId,
      type:           d.type,
      content:        d.content,
      mediaUrl:       d.mediaUrl,
      caption:        d.caption,
      scheduledAt:    d.scheduledAt,
      delayMin:       d.delayMin,
      delayMax:       d.delayMax,
      ...(d.abTestingEnabled ? {
        variantBContent:  d.variantBContent,
        variantBMediaUrl: d.variantBMediaUrl,
        variantBCaption:  d.variantBCaption,
        variantBRatio:    d.variantBRatio,
      } : {}),
    }),
    onSuccess: () => {
      toast.success('Broadcast dibuat')
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
      setFormOpen(false); reset()
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code
      if (code === 'VARIANT_B_CONTENT_REQUIRED') toast.error('Isi pesan varian B wajib diisi')
      else toast.error('Gagal membuat broadcast')
    },
  })

  const { mutate: start } = useMutation({
    mutationFn: (id: string) => broadcastApi.start(id),
    onSuccess: () => {
      toast.success('Broadcast dimulai')
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: () => toast.error('Gagal memulai broadcast'),
  })

  const { mutate: pause } = useMutation({
    mutationFn: (id: string) => broadcastApi.pause(id),
    onSuccess: () => {
      toast.success('Broadcast dijeda')
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: () => toast.error('Gagal menjeda broadcast'),
  })

  const { mutate: resume } = useMutation({
    mutationFn: (id: string) => broadcastApi.resume(id),
    onSuccess: () => {
      toast.success('Broadcast dilanjutkan')
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: () => toast.error('Gagal melanjutkan broadcast'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => broadcastApi.delete(id),
    onSuccess: () => {
      toast.success('Broadcast dihapus')
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: () => toast.error('Gagal menghapus broadcast'),
  })

  // ─── Logs query (lazy — only when dialog opens) ───────────────────────────────
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: [...broadcastQueryKeys.logs(logsTarget?.id ?? ''), logsPage],
    queryFn:  () => broadcastApi.getLogs(logsTarget!.id, { page: logsPage, limit: 20 }),
    select:   (r) => ({ logs: r.data.data?.logs ?? [], meta: r.data.meta }),
    enabled:  !!logsTarget,
  })

  const progressPct = (b: Broadcast) =>
    b.totalCount > 0 ? Math.round((b.sentCount / b.totalCount) * 100) : 0

  return (
    <div>
      <PageHeader
        title="Broadcast"
        description="Kirim pesan massal ke grup kontak"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => { reset(); setFormOpen(true) }}>
            <Icon icon="mdi:plus" className="mr-2" />Buat Broadcast
          </Button>
        }
      />

      {isLoading ? <PageLoader /> : broadcasts.length === 0 ? (
        <EmptyState
          icon="mdi:bullhorn-outline"
          title="Belum ada broadcast"
          description="Buat broadcast untuk mengirim pesan ke banyak kontak sekaligus"
          action={
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => { reset(); setFormOpen(true) }}>
              <Icon icon="mdi:plus" className="mr-2" />Buat Broadcast
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {broadcasts.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon={broadcastStatusIcon[b.status] ?? 'mdi:bullhorn'} className="text-wa-600 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{b.name}</span>
                        <Badge className={cn('text-xs py-0', STATUS_COLORS[b.status] ?? '')}>{b.status}</Badge>
                        <Badge variant="secondary" className="text-xs py-0">{MESSAGE_TYPE_LABELS[b.type]}</Badge>
                      </div>

                      {/* Meta */}
                      <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
                        <p>Device: {b.deviceId ? (devices?.find(d => d.id === b.deviceId)?.name ?? b.deviceId) : 'Rotasi'}</p>
                        {b.scheduledAt && <p>Dijadwalkan: {formatDate(b.scheduledAt)}</p>}
                        {b.startedAt && <p>Mulai: {formatDate(b.startedAt)}</p>}
                      </div>

                      {/* Progress */}
                      {b.totalCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{b.sentCount} / {b.totalCount} terkirim</span>
                            <span className="text-red-500">{b.failedCount} gagal</span>
                          </div>
                          <Progress value={progressPct(b)} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {b.status === 'DRAFT' && (
                        <Button size="sm" className="bg-wa-600 hover:bg-wa-700" onClick={() => start(b.id)}>
                          <Icon icon="mdi:play" className="mr-1" />Mulai
                        </Button>
                      )}
                      {b.status === 'RUNNING' && (
                        <Button size="sm" variant="outline" onClick={() => pause(b.id)}>
                          <Icon icon="mdi:pause" className="mr-1" />Jeda
                        </Button>
                      )}
                      {b.status === 'PAUSED' && (
                        <Button size="sm" className="bg-wa-600 hover:bg-wa-700" onClick={() => resume(b.id)}>
                          <Icon icon="mdi:play" className="mr-1" />Lanjutkan
                        </Button>
                      )}
                      {['RUNNING', 'PAUSED', 'FINISHED'].includes(b.status) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setLogsTarget(b); setLogsPage(1) }}>
                            <Icon icon="mdi:text-box-outline" className="mr-1" />Log
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setAnalyticsTarget(b)}>
                            <Icon icon="mdi:chart-bar" className="mr-1" />Analytics
                          </Button>
                        </>
                      )}
                      {['DRAFT', 'FINISHED', 'FAILED'].includes(b.status) && (
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(b)}>
                          <Icon icon="mdi:delete-outline" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                {meta && `${(page - 1) * limit + 1}–${Math.min(page * limit, meta.total)} dari ${meta.total}`}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <Icon icon="mdi:chevron-left" />
                </Button>
                <span className="flex items-center px-3 text-xs">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <Icon icon="mdi:chevron-right" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Buat Broadcast</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Broadcast</Label>
              <Input placeholder="Promo Hari Raya" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Device {canDeviceRotation && <span className="text-xs text-muted-foreground">(kosong = rotasi)</span>}</Label>
                <Controller control={control} name="deviceId" render={({ field }) => (
                  <Select
                    value={field.value ?? '__auto__'}
                    onValueChange={(v) => field.onChange(v === '__auto__' ? undefined : v)}
                  >
                    <SelectTrigger><SelectValue placeholder={canDeviceRotation ? 'Rotasi otomatis' : 'Pilih device'} /></SelectTrigger>
                    <SelectContent>
                      {canDeviceRotation && <SelectItem value="__auto__">Rotasi otomatis</SelectItem>}
                      {devices?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Grup Kontak</Label>
                <Controller control={control} name="contactGroupId" render={({ field }) => (
                  <Select
                    value={field.value ?? '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih grup" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Tanpa grup</SelectItem>
                      {groups?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tipe Pesan</Label>
              <Controller control={control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'] as const).map(t => (
                      <SelectItem key={t} value={t}>{MESSAGE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-1.5">
              <Label>Isi Pesan {msgType !== 'TEXT' && '(caption)'}</Label>
              <Textarea
                placeholder="Hai {{name}}, kami punya promo spesial..."
                rows={3}
                {...register('content')}
              />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
              <p className="text-xs text-muted-foreground">Gunakan <code className="bg-muted px-1 rounded">{'{{name}}'}</code> atau <code className="bg-muted px-1 rounded">{'{{phone}}'}</code> untuk personalisasi</p>
            </div>

            {msgType !== 'TEXT' && (
              <div className="space-y-1.5">
                <Label>URL Media</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com/image.jpg" {...register('mediaUrl')} />
                  <MediaUploadButton onUploaded={(u) => setValue('mediaUrl', u)} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Jadwal (opsional)</Label>
              <Input type="datetime-local" {...register('scheduledAt')} />
            </div>

            {/* A/B Testing (collapsible) */}
            <div className="rounded-lg border">
              <Controller control={control} name="abTestingEnabled" render={({ field }) => (
                <div className="w-full flex items-center justify-between p-3">
                  <button
                    type="button"
                    className="flex-1 text-left text-sm font-medium flex items-center gap-2"
                    onClick={() => field.onChange(!field.value)}
                  >
                    <Icon icon="mdi:flask-outline" className="text-wa-600" />
                    A/B Testing <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
                  </button>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )} />
              {abTestingEnabled && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  <div className="space-y-1.5">
                    <Label>Isi Pesan Varian B</Label>
                    <Textarea placeholder="Varian pesan alternatif untuk diuji..." rows={3} {...register('variantBContent')} />
                    {errors.variantBContent && <p className="text-xs text-red-500">{errors.variantBContent.message}</p>}
                  </div>
                  {msgType !== 'TEXT' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>URL Media Varian B <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                        <Input placeholder="https://example.com/variant-b.jpg" {...register('variantBMediaUrl')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Caption Varian B <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                        <Input placeholder="Caption untuk varian B" {...register('variantBCaption')} />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <Label>Rasio Penerima Varian B</Label>
                      <span className="font-semibold text-wa-600">{variantBRatio}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} step={5}
                      {...register('variantBRatio')}
                      className="w-full accent-wa-600"
                    />
                    <p className="text-xs text-muted-foreground">
                      {variantBRatio}% penerima acak dapat varian B, sisanya ({100 - variantBRatio}%) dapat varian A (isi pesan utama).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Delay Min (ms)</Label>
                <Input type="number" {...register('delayMin')} />
              </div>
              <div className="space-y-1.5">
                <Label>Delay Max (ms)</Label>
                <Input type="number" {...register('delayMax')} />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground -mt-1">Jeda acak antara pengiriman (disarankan 1000–5000ms)</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={creating}>
                {creating ? 'Membuat...' : 'Buat Broadcast'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Broadcast?"
        description={`Broadcast "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Hapus" destructive loading={deleting}
        onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }}
      />

      {/* ── Broadcast Logs Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!logsTarget} onOpenChange={(v) => { if (!v) setLogsTarget(null) }}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:text-box-outline" className="text-wa-600" />
              Log Broadcast — {logsTarget?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
              </div>
            ) : !logsData?.logs.length ? (
              <p className="text-center text-sm text-muted-foreground py-8">Belum ada log pesan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ke</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.to}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs py-0', STATUS_COLORS[log.status] ?? '')}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {truncate(log.content ?? '', 60)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.sentAt ? formatDate(log.sentAt) : log.createdAt ? formatDate(log.createdAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {logsData?.meta && Math.ceil(logsData.meta.total / 20) > 1 && (
            <div className="flex items-center justify-between pt-3 border-t text-sm">
              <span className="text-muted-foreground text-xs">
                {(logsPage - 1) * 20 + 1}–{Math.min(logsPage * 20, logsData.meta.total)} dari {logsData.meta.total}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)}>
                  <Icon icon="mdi:chevron-left" />
                </Button>
                <span className="flex items-center px-2 text-xs">{logsPage} / {Math.ceil(logsData.meta.total / 20)}</span>
                <Button variant="outline" size="sm" disabled={logsPage >= Math.ceil(logsData.meta.total / 20)} onClick={() => setLogsPage(p => p + 1)}>
                  <Icon icon="mdi:chevron-right" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Broadcast Analytics Dialog ────────────────────────────────────── */}
      <Dialog open={!!analyticsTarget} onOpenChange={(v) => { if (!v) setAnalyticsTarget(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:chart-bar" className="text-wa-600" />
              Analytics — {analyticsTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {analyticsTarget && <BroadcastAnalyticsContent broadcastId={analyticsTarget.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BroadcastAnalyticsContent({ broadcastId }: { broadcastId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: broadcastQueryKeys.analytics(broadcastId),
    queryFn:  () => broadcastApi.getAnalytics(broadcastId),
    select:   (r) => r.data.data as BroadcastAnalytics,
    refetchInterval: 10_000,
  })

  const { data: variants } = useQuery({
    queryKey: broadcastQueryKeys.variants(broadcastId),
    queryFn:  () => broadcastApi.getVariants(broadcastId),
    select:   (r) => r.data.data,
    refetchInterval: 10_000,
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
      </div>
    )
  }

  const rateCards = [
    { label: 'Terkirim',     value: data.rates.sentRate,     icon: 'mdi:send-check',        color: 'text-cyan-600' },
    { label: 'Tersampaikan', value: data.rates.deliveryRate, icon: 'mdi:check-all',         color: 'text-emerald-600' },
    { label: 'Dibaca',       value: data.rates.readRate,     icon: 'mdi:eye-check-outline', color: 'text-blue-600' },
    { label: 'Gagal',        value: data.rates.failRate,     icon: 'mdi:alert-circle',      color: 'text-red-500' },
  ]
  const maxSent = Math.max(1, ...data.timeline.map((t) => t.sent))

  return (
    <div className="space-y-4">
      {/* A/B Testing results */}
      {variants?.hasVariants && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Icon icon="mdi:flask-outline" className="text-wa-600" />
            Hasil A/B Testing (rasio B: {variants.variantBRatio}%)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['A', 'B'] as const).map((variant) => (
              <div key={variant} className="p-3 rounded-lg border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Varian {variant}</span>
                  <span className="text-xs text-muted-foreground">{variants[variant].total} penerima</span>
                </div>
                <p className="text-lg font-bold text-wa-600">{variants[variant].deliveryRate}%</p>
                <p className="text-[11px] text-muted-foreground">Delivery rate</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-[10px] py-0">DELIVERED: {variants[variant].DELIVERED}</Badge>
                  <Badge variant="secondary" className="text-[10px] py-0">READ: {variants[variant].READ}</Badge>
                  <Badge variant="secondary" className="text-[10px] py-0">FAILED: {variants[variant].FAILED}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {rateCards.map((r) => (
          <div key={r.label} className="p-3 rounded-lg border text-center">
            <Icon icon={r.icon} className={cn('text-xl mx-auto mb-1', r.color)} />
            <p className="text-lg font-bold">{r.value}%</p>
            <p className="text-[11px] text-muted-foreground">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Breakdown Status ({data.total.toLocaleString('id-ID')} pesan)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <Badge key={status} className={cn('text-xs', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700')}>
              {status}: {count.toLocaleString('id-ID')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Timeline per jam */}
      {data.timeline.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pengiriman per Jam</p>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {data.timeline.map((t) => (
              <div key={t.hour} className="flex items-center gap-2 text-xs">
                <span className="w-28 flex-shrink-0 font-mono text-muted-foreground">{t.hour}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-wa-600 rounded-full"
                    style={{ width: `${(t.sent / maxSent) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-medium">{t.sent}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
