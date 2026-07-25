import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { autoReplyApi, autoReplyQueryKeys } from '@/api/autoreply.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
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
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth.store'
import { PLAN_LIMITS, MATCH_TYPE_LABELS } from '@/lib/constants'
import type { AutoReply } from '@/types'

const schema = z.object({
  deviceId:     z.string().min(1, 'Pilih device'),
  name:         z.string().min(1, 'Nama wajib diisi'),
  keyword:      z.string().min(1, 'Keyword wajib diisi'),
  matchType:    z.enum(['EXACT', 'CONTAINS', 'STARTS_WITH', 'REGEX', 'AI']),
  replyType:    z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  replyContent: z.string().min(1, 'Balasan wajib diisi'),
  replyMediaUrl: z.string().optional(),
  priority:     z.coerce.number().default(0),
})
type FormData = z.infer<typeof schema>

export function AutoReplyPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const plan = user?.plan ?? 'FREE'
  const canAutoReply = PLAN_LIMITS[plan]?.canAutoReply ?? false
  const canAiReply   = PLAN_LIMITS[plan]?.canAiReply   ?? false

  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<AutoReply | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AutoReply | null>(null)

  const { data: autoReplies, isLoading } = useQuery({
    queryKey: autoReplyQueryKeys.all(deviceFilter !== 'all' ? deviceFilter : undefined),
    queryFn:  () => autoReplyApi.getAll(deviceFilter !== 'all' ? { deviceId: deviceFilter } : undefined),
    select:   (r) => r.data.data?.autoReplies ?? [],
    enabled:  canAutoReply,
  })

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
  })

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as Resolver<FormData>,
      defaultValues: { matchType: 'CONTAINS', replyType: 'TEXT', priority: 0 },
    })

  const replyType = watch('replyType')
  const matchType = watch('matchType')
  const isAiMode  = matchType === 'AI'

  const { mutate: save, isPending } = useMutation({
    mutationFn: (d: FormData) =>
      editTarget ? autoReplyApi.update(editTarget.id, d) : autoReplyApi.create(d),
    onSuccess: () => {
      toast.success(editTarget ? 'Auto-reply diperbarui' : 'Auto-reply ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['auto-replies'] })
      setFormOpen(false); setEditTarget(null); reset()
    },
    onError: () => toast.error('Gagal menyimpan auto-reply'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => autoReplyApi.delete(id),
    onSuccess: () => {
      toast.success('Auto-reply dihapus')
      queryClient.invalidateQueries({ queryKey: ['auto-replies'] })
    },
  })

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      autoReplyApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-replies'] }),
    onError: () => toast.error('Gagal mengubah status'),
  })

  const openAdd = () => {
    setEditTarget(null); reset()
    setFormOpen(true)
  }
  const openEdit = (ar: AutoReply) => {
    setEditTarget(ar)
    setValue('deviceId', ar.deviceId)
    setValue('name', ar.name)
    setValue('keyword', ar.keyword)
    setValue('matchType', ar.matchType)
    setValue('replyType', ar.replyType)
    setValue('replyContent', ar.replyContent)
    setValue('replyMediaUrl', ar.replyMediaUrl ?? '')
    setValue('priority', ar.priority)
    setFormOpen(true)
  }

  if (!canAutoReply) {
    return (
      <div>
        <PageHeader title="Auto-Reply" description="Balas pesan masuk secara otomatis" />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Icon icon="mdi:lock" className="text-3xl text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Fitur Premium</p>
            <p className="text-muted-foreground text-sm mt-1">Auto-reply tersedia untuk plan REGULAR ke atas.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Auto-Reply"
        description="Balas pesan masuk secara otomatis berdasarkan keyword"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}>
            <Icon icon="mdi:plus" className="mr-2" />Tambah Auto-Reply
          </Button>
        }
      />

      {/* Device filter */}
      <div className="flex gap-3 mb-4">
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Semua Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Device</SelectItem>
            {devices?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : !autoReplies?.length ? (
        <EmptyState
          icon="mdi:reply-all"
          title="Belum ada auto-reply"
          description="Tambahkan aturan balas otomatis untuk merespons pesan masuk"
          action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}><Icon icon="mdi:plus" className="mr-2" />Tambah Auto-Reply</Button>}
        />
      ) : (
        <div className="space-y-3">
          {autoReplies.map((ar) => (
            <Card key={ar.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon icon="mdi:reply" className="text-wa-600 flex-shrink-0" />
                      <span className="font-medium text-sm">{ar.name}</span>
                      <Badge variant="secondary" className="text-xs py-0">{MATCH_TYPE_LABELS[ar.matchType]}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Keyword: <code className="bg-muted px-1 py-0.5 rounded">{ar.keyword}</code></p>
                      <p>Balasan: <span className="text-foreground">{ar.replyContent.slice(0, 80)}{ar.replyContent.length > 80 ? '…' : ''}</span></p>
                      <p>Device: <span className="text-foreground">{devices?.find(d => d.id === ar.deviceId)?.name ?? ar.deviceId}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={ar.isActive} onCheckedChange={(v) => toggle({ id: ar.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ar)}><Icon icon="mdi:pencil-outline" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(ar)}><Icon icon="mdi:delete-outline" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { reset(); setEditTarget(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Auto-Reply' : 'Tambah Auto-Reply'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => save(d.matchType === 'AI' ? { ...d, replyType: 'TEXT', replyMediaUrl: undefined } : d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nama Aturan</Label>
                <Input placeholder="Salam pembuka" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Device</Label>
                <Controller control={control} name="deviceId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!editTarget}>
                    <SelectTrigger><SelectValue placeholder="Pilih device" /></SelectTrigger>
                    <SelectContent>
                      {devices?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.deviceId && <p className="text-xs text-red-500">{errors.deviceId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Keyword</Label>
                <Input placeholder={isAiMode ? '* (semua pesan)' : 'halo'} {...register('keyword')} />
                {errors.keyword && <p className="text-xs text-red-500">{errors.keyword.message}</p>}
                {isAiMode && (
                  <p className="text-xs text-muted-foreground">
                    Isi <code className="bg-muted px-1 rounded">*</code> untuk menangkap semua pesan, atau kata tertentu sebagai filter.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tipe Pencocokan</Label>
                <Controller control={control} name="matchType" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MATCH_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} disabled={v === 'AI' && !canAiReply}>
                          {l}{v === 'AI' && !canAiReply ? ' — plan MASTER ke atas' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {!isAiMode && (
              <div className="space-y-1.5">
                <Label>Tipe Balasan</Label>
                <Controller control={control} name="replyType" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{isAiMode ? 'Instruksi AI (System Prompt)' : <>Isi Balasan {replyType !== 'TEXT' && '(caption)'}</>}</Label>
              <Textarea
                placeholder={isAiMode
                  ? 'Kamu adalah CS toko sepatu. Jawab ramah dan ringkas, maksimal 3 kalimat...'
                  : 'Halo! Terima kasih sudah menghubungi kami...'}
                rows={3}
                {...register('replyContent')}
              />
              {errors.replyContent && <p className="text-xs text-red-500">{errors.replyContent.message}</p>}
              {isAiMode && (
                <p className="text-xs text-muted-foreground">
                  Balasan digenerate AI berdasarkan instruksi ini dan riwayat percakapan — bukan dikirim apa adanya.
                </p>
              )}
            </div>

            {!isAiMode && replyType !== 'TEXT' && (
              <div className="space-y-1.5">
                <Label>URL Media</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com/image.jpg" {...register('replyMediaUrl')} />
                  <MediaUploadButton onUploaded={(u) => setValue('replyMediaUrl', u)} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Prioritas <span className="text-muted-foreground text-xs">(angka lebih besar = lebih prioritas)</span></Label>
              <Input type="number" {...register('priority')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Auto-Reply?"
        description={`Auto-reply "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Hapus" destructive loading={deleting}
        onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }}
      />
    </div>
  )
}
