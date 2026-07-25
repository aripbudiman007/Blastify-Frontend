import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { templateApi, templateQueryKeys } from '@/api/template.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TemplateFormDialog, CATEGORIES } from './TemplateFormDialog'
import type { TemplateFormData } from './TemplateFormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, truncate } from '@/lib/utils'
import { MESSAGE_TYPE_ICONS, MESSAGE_TYPE_LABELS } from '@/lib/constants'
import type { MessageTemplate } from '@/types'

// Extract {{variable}} names from content
function extractVarNames(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))]
}

const CATEGORY_STYLES: Record<string, string> = {
  general:      'bg-gray-100   text-gray-700',
  greeting:     'bg-blue-100   text-blue-700',
  promo:        'bg-orange-100 text-orange-700',
  notification: 'bg-purple-100 text-purple-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  general:      'General',
  greeting:     'Sapaan',
  promo:        'Promo',
  notification: 'Notifikasi',
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch]       = useState('')
  const [formOpen, setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<MessageTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null)
  const [useTarget, setUseTarget]       = useState<MessageTemplate | null>(null)

  // ─── Query ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: [...templateQueryKeys.all, activeTab, search],
    queryFn:  () => templateApi.list({
      category: activeTab !== 'all' ? activeTab : undefined,
      search: search || undefined,
    }),
    select: (r) => r.data.data ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 1 },
  })

  const templates = data?.data ?? []

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: templateQueryKeys.all })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (d: TemplateFormData) => templateApi.create({
      name: d.name, category: d.category, type: d.type,
      content: d.content,
      mediaUrl: d.mediaUrl || undefined,
      caption: d.caption || undefined,
    }),
    onSuccess: () => { toast.success('Template dibuat'); invalidate(); setFormOpen(false) },
    onError:   (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Gagal membuat template'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (d: TemplateFormData) => templateApi.update(editTarget!.id, {
      name: d.name, category: d.category, type: d.type,
      content: d.content,
      mediaUrl: d.mediaUrl || undefined,
      caption: d.caption || undefined,
    }),
    onSuccess: () => { toast.success('Template diperbarui'); invalidate(); setFormOpen(false); setEditTarget(null) },
    onError:   () => toast.error('Gagal memperbarui template'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      templateApi.update(id, { isActive }),
    onSuccess: invalidate,
    onError:   () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () => { toast.success('Template dihapus'); invalidate(); setDeleteTarget(null) },
    onError:   () => toast.error('Gagal menghapus template'),
  })

  const handleFormSubmit = (d: TemplateFormData) => {
    editTarget ? update(d) : create(d)
  }

  return (
    <div>
      <PageHeader
        title="Template Pesan"
        description="Simpan template yang sering dipakai dan gunakan ulang dengan cepat"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Icon icon="mdi:plus" className="mr-2" />Tambah Template
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex-1">
          <Input
            placeholder="Cari template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? <PageLoader /> : !templates.length ? (
        <EmptyState
          icon="mdi:file-document-outline"
          title="Belum ada template"
          description="Buat template untuk mempercepat pengiriman pesan yang sering dipakai"
          action={
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
              <Icon icon="mdi:plus" className="mr-2" />Tambah Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => { setEditTarget(t); setFormOpen(true) }}
              onDelete={() => setDeleteTarget(t)}
              onUse={() => setUseTarget(t)}
              onToggle={(isActive) => toggleActive({ id: t.id, isActive })}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditTarget(null) }}
        template={editTarget}
        onSubmit={handleFormSubmit}
        loading={creating || updating}
      />

      {/* Use template dialog */}
      {useTarget && (
        <UseTemplateDialog
          template={useTarget}
          onClose={() => setUseTarget(null)}
          onApply={(content, type) => {
            navigate(`/messages/send?content=${encodeURIComponent(content)}&type=${type}`)
            setUseTarget(null)
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Template?"
        description={`Template "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id) }}
      />
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({
  template: t, onEdit, onDelete, onUse, onToggle,
}: {
  template: MessageTemplate
  onEdit: () => void
  onDelete: () => void
  onUse: () => void
  onToggle: (v: boolean) => void
}) {
  const hasVars = /\{\{[^}]+\}\}/.test(t.content)

  return (
    <div className={cn(
      'border rounded-xl p-4 space-y-3 bg-card hover:shadow-md transition-shadow',
      !t.isActive && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{t.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={cn('text-xs py-0', CATEGORY_STYLES[t.category] ?? 'bg-gray-100 text-gray-700')}>
              {CATEGORY_LABELS[t.category] ?? t.category}
            </Badge>
            <Badge variant="outline" className="text-xs py-0 gap-1">
              <Icon icon={MESSAGE_TYPE_ICONS[t.type] ?? 'mdi:file'} className="text-sm" />
              {MESSAGE_TYPE_LABELS[t.type] ?? t.type}
            </Badge>
          </div>
        </div>
        <Switch
          checked={t.isActive}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-wa-600 flex-shrink-0"
        />
      </div>

      {/* Content preview */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 min-h-[52px]">
        {truncate(t.content, 100)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon icon="mdi:chart-line" className="text-sm" />
          <span>Dipakai {t.usageCount}×</span>
          {hasVars && (
            <Badge variant="outline" className="text-[10px] py-0 gap-0.5 ml-1">
              <Icon icon="mdi:code-braces" className="text-xs" />vars
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" className="h-7 text-xs bg-wa-600 hover:bg-wa-700" onClick={onUse}>
            <Icon icon="mdi:send-outline" className="mr-1 text-sm" />Gunakan
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Icon icon="mdi:pencil-outline" className="text-sm" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete}>
            <Icon icon="mdi:delete-outline" className="text-sm" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Use Template Dialog — fill variables ─────────────────────────────────────
function UseTemplateDialog({
  template: t,
  onClose,
  onApply,
}: {
  template: MessageTemplate
  onClose: () => void
  onApply: (content: string, type: string) => void
}) {
  const queryClient = useQueryClient()
  const varNames = extractVarNames(t.content)

  const { register, watch, handleSubmit } = useForm<Record<string, string>>()
  const values = watch()

  // Live preview
  const preview = useMemo(() => {
    let rendered = t.content
    for (const [k, v] of Object.entries(values)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`)
    }
    return rendered
  }, [t.content, values])

  const { mutate: useTemplate, isPending } = useMutation({
    mutationFn: (vars: Record<string, string>) => templateApi.use(t.id, vars),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all })
      onApply(res.data.data.renderedContent, t.type)
    },
    onError: () => toast.error('Gagal menggunakan template'),
  })

  const onSubmit = (vars: Record<string, string>) => {
    useTemplate(vars)
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:send-outline" className="text-wa-600" />
            Gunakan Template: {t.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {varNames.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Isi nilai untuk setiap variabel:</p>
              {varNames.map(v => (
                <div key={v} className="space-y-1">
                  <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                  <Input
                    placeholder={`Nilai untuk ${v}`}
                    {...register(v)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Template ini tidak memiliki variabel.</p>
          )}

          {/* Live preview */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Preview</Label>
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap min-h-[60px] border">
              {preview}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={isPending}>
              {isPending
                ? <Icon icon="mdi:loading" className="animate-spin" />
                : <><Icon icon="mdi:open-in-new" className="mr-2" />Buka di Kirim Pesan</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
