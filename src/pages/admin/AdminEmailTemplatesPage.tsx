import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { useAdminStore } from '@/store/admin.store'
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
import { cn } from '@/lib/utils'
import type { EmailTemplate, EmailTemplateCategory } from '@/types'
import type { AxiosError } from 'axios'

const EMAIL_CATEGORIES: { value: EmailTemplateCategory; label: string }[] = [
  { value: 'registration', label: 'Registrasi' },
  { value: 'account',      label: 'Akun' },
  { value: 'payment',      label: 'Pembayaran' },
  { value: 'notification', label: 'Notifikasi' },
]

function extractVars(...parts: (string | undefined | null)[]): string[] {
  const combined = parts.filter(Boolean).join(' ')
  const matches = combined.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))]
}

const createSchema = z.object({
  name:             z.string().min(1).max(255),
  slug:             z.string().min(1, 'Slug wajib').regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  category:         z.enum(['registration', 'account', 'payment', 'notification'] as const),
  subject:          z.string().min(1, 'Subjek wajib'),
  htmlContent:      z.string().min(1, 'Konten HTML wajib'),
  plainTextContent: z.string().optional(),
})

const editSchema = z.object({
  name:             z.string().min(1).max(255),
  category:         z.enum(['registration', 'account', 'payment', 'notification'] as const),
  subject:          z.string().min(1, 'Subjek wajib'),
  htmlContent:      z.string().min(1, 'Konten HTML wajib'),
  plainTextContent: z.string().optional(),
  isActive:         z.boolean(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData   = z.infer<typeof editSchema>

export function AdminEmailTemplatesPage() {
  const qc = useQueryClient()
  const { admin } = useAdminStore()
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'

  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: adminQueryKeys.emailTemplates,
    queryFn:  () => adminApi.listEmailTemplates(),
    select:   (r) => r.data.data?.templates ?? [],
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: adminQueryKeys.emailTemplates })
  const isEdit = !!editTarget

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: 'notification' },
  })
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (!formOpen) return
    if (editTarget) {
      editForm.reset({
        name: editTarget.name, category: editTarget.category, subject: editTarget.subject,
        htmlContent: editTarget.htmlContent, plainTextContent: editTarget.plainTextContent ?? '',
        isActive: editTarget.isActive,
      })
    } else {
      createForm.reset({ category: 'notification', name: '', slug: '', subject: '', htmlContent: '', plainTextContent: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, editTarget])

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (d: CreateFormData) => adminApi.createEmailTemplate({
      name: d.name, slug: d.slug, category: d.category, subject: d.subject,
      htmlContent: d.htmlContent, plainTextContent: d.plainTextContent || undefined,
    }),
    onSuccess: () => { toast.success('Template default dibuat'); invalidate(); setFormOpen(false) },
    onError: (e: AxiosError<{ error?: { code?: string; message?: string } }>) => {
      if (e.response?.data?.error?.code === 'TEMPLATE_EXISTS') {
        toast.error('Slug ini sudah dipakai template default lain.')
        return
      }
      toast.error(e.response?.data?.error?.message ?? 'Gagal membuat template')
    },
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (d: EditFormData) => adminApi.updateEmailTemplate(editTarget!.id, d),
    onSuccess: () => { toast.success('Template diperbarui'); invalidate(); setFormOpen(false); setEditTarget(null) },
    onError:   () => toast.error('Gagal memperbarui template'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateEmailTemplate(id, { isActive }),
    onSuccess: invalidate,
    onError:   () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => adminApi.deleteEmailTemplate(id),
    onSuccess: () => { toast.success('Template dihapus'); invalidate(); setDeleteTarget(null) },
    onError:   () => toast.error('Gagal menghapus template'),
  })

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit   = (t: EmailTemplate) => { setEditTarget(t); setFormOpen(true) }

  const subjectVal = isEdit ? editForm.watch('subject') : createForm.watch('subject')
  const htmlVal    = isEdit ? editForm.watch('htmlContent') : createForm.watch('htmlContent')
  const vars = useMemo(() => extractVars(subjectVal, htmlVal), [subjectVal, htmlVal])

  // logoUrl is injected server-side on every send (see sendTemplateEmail) — substitute
  // it here too so the preview matches what recipients actually see.
  const previewHtml = useMemo(
    () => (htmlVal ?? '').replace(/\{\{\s*logoUrl\s*\}\}/g, `${window.location.origin}/logo.png`),
    [htmlVal],
  )

  const submit = isEdit
    ? editForm.handleSubmit((d) => update(d))
    : createForm.handleSubmit((d) => create(d))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Email Templates</h1>
          <p className="text-sm text-muted-foreground">
            Kelola {templates?.length ?? 0} template email default sistem — fallback untuk semua user yang belum membuat override.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Icon icon="mdi:plus" className="mr-2" />Buat Template Default
          </Button>
        )}
      </div>

      {isLoading ? <PageLoader /> : !templates?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Belum ada template default</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className={cn(
              'flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-card',
              !t.isActive && 'opacity-60'
            )}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <Badge variant="outline" className="text-[10px] py-0 font-mono">{t.slug}</Badge>
                  <Badge className="text-[10px] py-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    {EMAIL_CATEGORIES.find(c => c.value === t.category)?.label ?? t.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">v{t.version}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManage && (
                  <Switch
                    checked={t.isActive}
                    onCheckedChange={(v) => toggleActive({ id: t.id, isActive: v })}
                  />
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                  <Icon icon={canManage ? 'mdi:pencil-outline' : 'mdi:eye-outline'} />
                </Button>
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(t)}>
                    <Icon icon="mdi:delete-outline" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditTarget(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit: ${editTarget?.name}` : 'Buat Template Default Baru'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={isEdit && !canManage} className="contents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nama Template</Label>
                    <Input
                      placeholder="Password Reset"
                      {...(isEdit ? editForm.register('name') : createForm.register('name'))}
                    />
                  </div>

                  {!isEdit ? (
                    <div className="space-y-1.5">
                      <Label>Slug <span className="text-muted-foreground font-normal">(unik, immutable setelah dibuat)</span></Label>
                      <Input placeholder="new-system-template" className="font-mono" {...createForm.register('slug')} />
                      {createForm.formState.errors.slug && (
                        <p className="text-xs text-red-500">{createForm.formState.errors.slug.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <Input value={editTarget?.slug ?? ''} disabled className="bg-muted font-mono" />
                      <p className="text-xs text-muted-foreground">Slug tidak bisa diubah setelah dibuat.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Kategori</Label>
                      <Select
                        value={isEdit ? editForm.watch('category') : createForm.watch('category')}
                        onValueChange={(v) => isEdit
                          ? editForm.setValue('category', v as EmailTemplateCategory)
                          : createForm.setValue('category', v as EmailTemplateCategory)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EMAIL_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isEdit && (
                      <div className="flex items-end gap-2 pb-1.5">
                        <Label className="text-xs">Aktif</Label>
                        <Switch
                          checked={editForm.watch('isActive')}
                          onCheckedChange={(v) => editForm.setValue('isActive', v)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Subjek Email</Label>
                    <Input
                      placeholder="Reset Password - Blastify"
                      {...(isEdit ? editForm.register('subject') : createForm.register('subject'))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Konten HTML</Label>
                    <Textarea
                      rows={10}
                      className="font-mono text-xs"
                      {...(isEdit ? editForm.register('htmlContent') : createForm.register('htmlContent'))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Konten Plain Text <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                    <Textarea
                      rows={3}
                      {...(isEdit ? editForm.register('plainTextContent') : createForm.register('plainTextContent'))}
                    />
                  </div>

                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {vars.map(v => (
                        <Badge key={v} variant="secondary" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Preview</Label>
                  <iframe
                    title="preview-email"
                    sandbox=""
                    srcDoc={previewHtml || '<p style="color:#888;font-family:sans-serif">Belum ada konten</p>'}
                    className="w-full h-[420px] border rounded-lg bg-white"
                  />
                </div>
              </div>
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {isEdit && !canManage ? 'Tutup' : 'Batal'}
              </Button>
              {(!isEdit || canManage) && (
                <Button type="submit" disabled={creating || updating}>
                  {(creating || updating) ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                  {isEdit ? 'Simpan' : 'Buat Template'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Template Default?"
        description={`Template "${deleteTarget?.name}" (${deleteTarget?.slug}) akan dihapus. Sistem tidak akan punya fallback default untuk slug ini.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id) }}
      />
    </div>
  )
}
