import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import type { Announcement, AnnouncementType, Plan } from '@/types'

const ANN_TYPES: AnnouncementType[] = ['INFO', 'WARNING', 'DANGER', 'SUCCESS', 'MAINTENANCE']
const PLANS: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']

const TYPE_STYLES: Record<AnnouncementType, string> = {
  INFO:        'bg-blue-50   border-blue-300   text-blue-800',
  WARNING:     'bg-yellow-50 border-yellow-300 text-yellow-800',
  DANGER:      'bg-red-50    border-red-300    text-red-800',
  SUCCESS:     'bg-green-50  border-green-300  text-green-800',
  MAINTENANCE: 'bg-orange-50 border-orange-300 text-orange-800',
}

const TYPE_ICONS: Record<AnnouncementType, string> = {
  INFO:        'mdi:information-outline',
  WARNING:     'mdi:alert-outline',
  DANGER:      'mdi:alert-circle-outline',
  SUCCESS:     'mdi:check-circle-outline',
  MAINTENANCE: 'mdi:wrench-outline',
}

const schema = z.object({
  title:      z.string().min(1).max(200),
  content:    z.string().min(1),
  type:       z.enum(['INFO', 'WARNING', 'DANGER', 'SUCCESS', 'MAINTENANCE'] as const).default('INFO'),
  isActive:   z.boolean().default(true),
  startsAt:   z.string().optional(),
  endsAt:     z.string().optional(),
  targetPlan: z.array(z.enum(['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA'] as const)).default([]),
})
type FormData = z.infer<typeof schema>

export function AdminAnnouncementsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const { data: announcements, isLoading } = useQuery({
    queryKey: adminQueryKeys.announcements,
    queryFn:  () => adminApi.listAnnouncements(),
    select:   (r) => r.data.data ?? [],
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: adminQueryKeys.announcements })

  const submitHandler = (d: FormData) => save(d)

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData>, defaultValues: { type: 'INFO', isActive: true, targetPlan: [] } })

  const watchedTitle   = watch('title') ?? ''
  const watchedContent = watch('content') ?? ''
  const watchedType    = watch('type') ?? 'INFO'
  const watchedPlan    = watch('targetPlan') ?? []

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        ...d,
        startsAt: d.startsAt || null,
        endsAt:   d.endsAt   || null,
      }
      return editTarget
        ? adminApi.updateAnnouncement(editTarget.id, payload)
        : adminApi.createAnnouncement(payload)
    },
    onSuccess: () => { invalidate(); toast.success(editTarget ? 'Pengumuman diperbarui' : 'Pengumuman dibuat'); setFormOpen(false); setEditTarget(null) },
    onError:   () => toast.error('Gagal menyimpan pengumuman'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateAnnouncement(id, { isActive }),
    onSuccess: invalidate,
    onError:   () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => { invalidate(); toast.success('Pengumuman dihapus'); setDeleteTarget(null) },
    onError:   () => toast.error('Gagal menghapus'),
  })

  const openCreate = () => {
    setEditTarget(null)
    reset({ type: 'INFO', isActive: true, targetPlan: [] })
    setFormOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    reset({
      title:      a.title,
      content:    a.content,
      type:       a.type,
      isActive:   a.isActive ?? true,
      startsAt:   a.startsAt ? a.startsAt.slice(0, 16) : '',
      endsAt:     a.endsAt   ? a.endsAt.slice(0, 16)   : '',
      targetPlan: a.targetPlan ?? [],
    })
    setFormOpen(true)
  }

  const togglePlan = (plan: Plan) => {
    const current = watchedPlan
    setValue('targetPlan',
      current.includes(plan) ? current.filter(p => p !== plan) : [...current, plan]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Banner pengumuman untuk user dashboard</p>
        </div>
        <Button onClick={openCreate}>
          <Icon icon="mdi:plus" className="mr-2" />Buat Pengumuman
        </Button>
      </div>

      {isLoading ? <PageLoader /> : !announcements?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Belum ada pengumuman</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: Announcement) => (
            <div key={a.id} className={cn(
              'border rounded-xl p-4 space-y-2',
              !a.isActive && 'opacity-50'
            )}>
              {/* Preview banner */}
              <div className={cn('flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm', TYPE_STYLES[a.type])}>
                <Icon icon={TYPE_ICONS[a.type]} className="text-lg flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{a.title}</span>
                  {a.content && <span className="ml-2 opacity-90">{a.content}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">{a.type}</Badge>
                  {(a.targetPlan?.length ?? 0) > 0 && (
                    <span>Target: {a.targetPlan.join(', ')}</span>
                  )}
                  {a.startsAt && <span>Mulai: {formatDate(a.startsAt, 'dd MMM yyyy')}</span>}
                  {a.endsAt   && <span>Selesai: {formatDate(a.endsAt, 'dd MMM yyyy')}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={a.isActive ?? true}
                    onCheckedChange={v => toggleActive({ id: a.id, isActive: v })}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                    <Icon icon="mdi:pencil-outline" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(a)}>
                    <Icon icon="mdi:delete-outline" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={v => { setFormOpen(v); if (!v) setEditTarget(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Judul</Label>
              <Input placeholder="Maintenance Terjadwal" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Isi Pengumuman</Label>
              <Textarea rows={3} placeholder="Detail pengumuman..." {...register('content')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Controller control={control} name="type" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Label>Aktif</Label>
                <Controller control={control} name="isActive" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mulai (opsional)</Label>
                <Input type="datetime-local" {...register('startsAt')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selesai (opsional)</Label>
                <Input type="datetime-local" {...register('endsAt')} />
              </div>
            </div>

            {/* Target plan */}
            <div className="space-y-2">
              <Label className="text-xs">Target Plan (kosong = semua plan)</Label>
              <div className="flex flex-wrap gap-2">
                {PLANS.map(p => (
                  <button
                    key={p} type="button"
                    onClick={() => togglePlan(p)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors',
                      watchedPlan.includes(p)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-border hover:border-slate-400'
                    )}
                  >{p}</button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            {watchedTitle && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Preview</Label>
                <div className={cn('flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm', TYPE_STYLES[watchedType as AnnouncementType] ?? TYPE_STYLES.INFO)}>
                  <Icon icon={TYPE_ICONS[watchedType as AnnouncementType] ?? TYPE_ICONS.INFO} className="text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{watchedTitle}</span>
                    {watchedContent && <span className="ml-2 opacity-90">{watchedContent}</span>}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                {editTarget ? 'Simpan' : 'Buat Pengumuman'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        title="Hapus Pengumuman?"
        description={`Pengumuman "${deleteTarget?.title}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id) }}
      />
    </div>
  )
}
