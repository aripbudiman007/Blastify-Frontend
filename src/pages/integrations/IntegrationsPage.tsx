import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { integrationApi, integrationQueryKeys } from '@/api/integration.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { API_URL } from '@/lib/constants'
import type { Integration, IntegrationLog, PlatformPreset } from '@/types'

// ─── Platform icon + brand colour map ────────────────────────────────────────
// Source: @iconify-json/simple-icons (brand logos) + mdi (fallbacks)
// Brand hex values from simpleicons.org
const PLATFORM_ICON_MAP: Record<string, { icon: string; color: string }> = {
  shopify:     { icon: 'simple-icons:shopify',       color: '#7AB55C' },
  woocommerce: { icon: 'simple-icons:woocommerce',   color: '#96588A' },
  magento2:    { icon: 'simple-icons:magento',       color: '#EE672F' },
  bigcommerce: { icon: 'simple-icons:bigcommerce',   color: '#34313F' },
  zencart:     { icon: 'mdi:cart-outline',           color: '#4A90D9' },
  cscart:      { icon: 'mdi:store-outline',          color: '#E63B2E' },
  swell:       { icon: 'mdi:shopping',               color: '#6C5CE7' },
  fastspring:  { icon: 'mdi:leaf',                   color: '#00C07F' },
  square:      { icon: 'simple-icons:square',        color: '#3E4348' },
  vend:        { icon: 'mdi:cash-register',          color: '#0E9F6E' },
  quickbooks:  { icon: 'simple-icons:quickbooks',    color: '#2CA01C' },
  jotform:     { icon: 'mdi:clipboard-list-outline',  color: '#FF6100' },
  typeform:    { icon: 'simple-icons:typeform',      color: '#0AAF60' },
  formstack:   { icon: 'simple-icons:formstack',      color: '#21A0D2' },
  googleforms: { icon: 'simple-icons:googleforms',   color: '#7248B9' },
  webflow:     { icon: 'simple-icons:webflow',       color: '#4353FF' },
  wix:         { icon: 'simple-icons:wix',           color: '#FAAD00' },
  godaddy:     { icon: 'simple-icons:godaddy',       color: '#1BDBDB' },
  bitrix24:    { icon: 'mdi:account-multiple-outline', color: '#2FC7F7' },
  zoho:        { icon: 'simple-icons:zoho',          color: '#E42527' },
  slims:           { icon: 'mdi:bookshelf',              color: '#1565C0' },
  opensid:         { icon: 'mdi:home-city-outline',      color: '#388E3C' },
  jibas:           { icon: 'mdi:school-outline',         color: '#F57C00' },
  mixradius:       { icon: 'mdi:router-wireless',        color: '#9C27B0' },
  // ── Platform Indonesia (new) ──
  berdu:           { icon: 'mdi:storefront',             color: '#00C853' },
  sejoli:          { icon: 'simple-icons:wordpress',     color: '#21759B' },
  cepatlakoo:      { icon: 'mdi:rocket-launch',          color: '#FF5722' },
  wpaffwhatsapp:   { icon: 'simple-icons:whatsapp',      color: '#25D366' },
  lsdplugins:      { icon: 'mdi:puzzle-outline',         color: '#7B1FA2' },
  // ── Automation ──
  zapier:          { icon: 'simple-icons:zapier',        color: '#FF4A00' },
  n8n:             { icon: 'simple-icons:n8n',           color: '#EA4B71' },
  pabbly:          { icon: 'mdi:connection',             color: '#8E44AD' },
  integrately:     { icon: 'mdi:lightning-bolt',         color: '#E67E22' },
  integromat:      { icon: 'simple-icons:make',          color: '#6D00CC' },
  superblocks:     { icon: 'mdi:view-dashboard-outline', color: '#2B5CE6' },
  generic:         { icon: 'mdi:webhook',                color: '#64748B' },
}

function getPlatformMeta(key: string) {
  return PLATFORM_ICON_MAP[key] ?? { icon: 'mdi:webhook', color: '#64748B' }
}

// ─── Status colours ────────────────────────────────────────────────────────────
const LOG_STATUS_COLORS: Record<string, string> = {
  SUCCESS:       'bg-emerald-100 text-emerald-700',
  FAILED:        'bg-red-100    text-red-700',
  FILTERED:      'bg-yellow-100 text-yellow-700',
  INVALID_PHONE: 'bg-orange-100 text-orange-700',
  INACTIVE:      'bg-gray-100   text-gray-500',
}

// ─── Form schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:            z.string().min(1, 'Nama wajib diisi').max(100),
  platform:        z.string().min(1).default('generic'),
  deviceId:        z.string().min(1, 'Pilih device'),
  phoneSource:     z.enum(['field', 'fixed']),
  phoneField:      z.string().optional(),
  targetPhone:     z.string().optional(),
  messageTemplate: z.string().min(1, 'Template pesan wajib diisi'),
  filterField:     z.string().optional(),
  filterValue:     z.string().optional(),
  signatureHeader: z.string().max(100).optional(),
  signatureSecret: z.string().max(255).optional(),
}).superRefine((d, ctx) => {
  if (d.phoneSource === 'field' && !d.phoneField?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dot-path field telepon wajib diisi', path: ['phoneField'] })
  }
  if (d.phoneSource === 'fixed' && !d.targetPhone?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nomor telepon tujuan wajib diisi', path: ['targetPhone'] })
  }
})
type FormData = z.infer<typeof schema>

// ─── Webhook URL builder ────────────────────────────────────────────────────────
function webhookUrl(secretToken: string) {
  return `${API_URL}/integrations/receive/${secretToken}`
}

export function IntegrationsPage() {
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState<Integration | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null)
  const [logsTarget, setLogsTarget]   = useState<Integration | null>(null)
  const [rotateTarget, setRotateTarget] = useState<Integration | null>(null)

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: integrations, isLoading } = useQuery({
    queryKey: integrationQueryKeys.all,
    queryFn:  () => integrationApi.getAll(),
    select:   (r) => r.data.data ?? [],
  })

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
  })

  const { data: platforms } = useQuery({
    queryKey: integrationQueryKeys.platforms,
    queryFn:  () => integrationApi.getPlatforms(),
    select:   (r) => r.data.data ?? [],
    staleTime: Infinity,
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: integrationQueryKeys.logs(logsTarget?.id ?? ''),
    queryFn:  () => integrationApi.getLogs(logsTarget!.id, 100),
    select:   (r) => r.data.data ?? [],
    enabled:  !!logsTarget,
  })

  // ─── Grouped platforms ────────────────────────────────────────────────────────
  const platformGroups = useMemo(() => {
    if (!platforms) return {}
    return platforms.reduce<Record<string, PlatformPreset[]>>((acc, p) => {
      if (!acc[p.category]) acc[p.category] = []
      acc[p.category].push(p)
      return acc
    }, {})
  }, [platforms])

  // ─── Form ─────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as Resolver<FormData>,
      defaultValues: {
        platform: 'generic',
        phoneSource: 'field',
      },
    })

  const selectedPlatform = watch('platform')
  const phoneSource      = watch('phoneSource')

  // Auto-fill template hint when platform changes
  const onPlatformChange = (key: string) => {
    const preset = platforms?.find(p => p.key === key)
    if (preset?.locked) {
      toast.error(`Platform ${preset.label} butuh plan dengan fitur Webhook. Upgrade untuk menggunakannya.`)
      return
    }
    setValue('platform', key)
    if (preset) {
      if (preset.phoneField) setValue('phoneField', preset.phoneField)
      if (preset.filterField) setValue('filterField', preset.filterField)
      if (preset.filterValueExample) setValue('filterValue', preset.filterValueExample)
      setValue('messageTemplate', preset.templateHint)
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    reset({ platform: 'generic', phoneSource: 'field' })
    setFormOpen(true)
  }

  const openEdit = (intg: Integration) => {
    setEditTarget(intg)
    reset({
      name:            intg.name,
      platform:        intg.platform,
      deviceId:        intg.deviceId,
      phoneSource:     intg.phoneField ? 'field' : 'fixed',
      phoneField:      intg.phoneField ?? '',
      targetPhone:     intg.targetPhone ?? '',
      messageTemplate: intg.messageTemplate,
      filterField:     intg.filterField ?? '',
      filterValue:     intg.filterValue ?? '',
      signatureHeader: intg.signatureHeader ?? '',
      signatureSecret: intg.signatureSecret ?? '',
    })
    setFormOpen(true)
  }

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const submitHandler = (d: FormData) => save(d)

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        name:            d.name,
        platform:        d.platform,
        deviceId:        d.deviceId,
        phoneField:      d.phoneSource === 'field' ? (d.phoneField || undefined) : undefined,
        targetPhone:     d.phoneSource === 'fixed' ? (d.targetPhone || undefined) : undefined,
        messageTemplate: d.messageTemplate,
        filterField:     d.filterField || undefined,
        filterValue:     d.filterValue || undefined,
        // null saat edit = hapus verifikasi signature; undefined saat create = tidak diset
        signatureHeader: d.signatureHeader?.trim() || (editTarget ? null : undefined),
        signatureSecret: d.signatureSecret?.trim() || (editTarget ? null : undefined),
      }
      return editTarget
        ? integrationApi.update(editTarget.id, payload)
        : integrationApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editTarget ? 'Integrasi diperbarui' : 'Integrasi dibuat')
      queryClient.invalidateQueries({ queryKey: integrationQueryKeys.all })
      setFormOpen(false); setEditTarget(null); reset()
    },
    onError: () => toast.error('Gagal menyimpan integrasi'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      integrationApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationQueryKeys.all }),
    onError:   () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => integrationApi.delete(id),
    onSuccess: () => {
      toast.success('Integrasi dihapus')
      queryClient.invalidateQueries({ queryKey: integrationQueryKeys.all })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus integrasi'),
  })

  const { mutate: rotate, isPending: rotating } = useMutation({
    mutationFn: (id: string) => integrationApi.rotateToken(id),
    onSuccess: () => {
      toast.success('Webhook URL diperbarui')
      queryClient.invalidateQueries({ queryKey: integrationQueryKeys.all })
      setRotateTarget(null)
    },
    onError: () => toast.error('Gagal mereset URL'),
  })

  return (
    <div>
      <PageHeader
        title="Integrasi Webhook"
        description="Terima event dari platform lain dan kirim pesan WhatsApp otomatis"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={openCreate}>
            <Icon icon="mdi:plus" className="mr-2" />Buat Integrasi
          </Button>
        }
      />

      {isLoading ? <PageLoader /> : !integrations?.length ? (
        <EmptyState
          icon="mdi:connection"
          title="Belum ada integrasi"
          description="Hubungkan platform seperti Shopify, WooCommerce, Jotform, dan lainnya untuk kirim WhatsApp otomatis"
          action={
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={openCreate}>
              <Icon icon="mdi:plus" className="mr-2" />Buat Integrasi
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {integrations.map((intg) => (
            <Card key={intg.id} className={cn('transition-shadow hover:shadow-md', !intg.isActive && 'opacity-60')}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Brand icon — coloured */}
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${getPlatformMeta(intg.platform).color}18` }}>
                        <Icon
                          icon={getPlatformMeta(intg.platform).icon}
                          className="text-base"
                          style={{ color: getPlatformMeta(intg.platform).color }}
                        />
                      </div>
                      <span className="font-semibold text-sm truncate">{intg.name}</span>
                      <Badge variant="secondary" className="text-xs py-0 capitalize">
                        {platforms?.find(p => p.key === intg.platform)?.label ?? intg.platform}
                      </Badge>
                      <Badge className={cn('text-xs py-0', intg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        {intg.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    {/* Device & phone info */}
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1.5">
                        <Icon icon="mdi:cellphone" className="text-base" />
                        Device: <span className="font-medium">{intg.device.name}</span>
                        <Badge className={cn('text-[10px] py-0 ml-1', intg.device.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {intg.device.status}
                        </Badge>
                      </p>
                      {intg.phoneField && (
                        <p className="flex items-center gap-1.5">
                          <Icon icon="mdi:code-braces" className="text-base" />
                          Phone field: <code className="bg-muted px-1 rounded font-mono">{intg.phoneField}</code>
                        </p>
                      )}
                      {intg.targetPhone && (
                        <p className="flex items-center gap-1.5">
                          <Icon icon="mdi:phone" className="text-base" />
                          Target: <span className="font-medium">{intg.targetPhone}</span>
                        </p>
                      )}
                    </div>

                    {/* Webhook URL */}
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[11px] bg-muted px-2 py-1 rounded font-mono text-muted-foreground truncate flex-1">
                        {webhookUrl(intg.secretToken)}
                      </code>
                      <CopyButton text={webhookUrl(intg.secretToken)} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={intg.isActive}
                      onCheckedChange={(v) => toggleActive({ id: intg.id, isActive: v })}
                      className="data-[state=checked]:bg-wa-600"
                    />
                    <Button variant="outline" size="sm" onClick={() => { setLogsTarget(intg) }}>
                      <Icon icon="mdi:text-box-search-outline" className="mr-1" />Log
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(intg)}>
                      <Icon icon="mdi:pencil-outline" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRotateTarget(intg)}>
                      <Icon icon="mdi:refresh" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(intg)}>
                      <Icon icon="mdi:delete-outline" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditTarget(null); reset() } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Integrasi' : 'Buat Integrasi Baru'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Nama Integrasi</Label>
              <Input placeholder="Shopify - Order Baru" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Controller
                control={control}
                name="platform"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={onPlatformChange}>
                    {/* Trigger: shows brand icon + label of selected platform */}
                    <SelectTrigger>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon
                          icon={getPlatformMeta(field.value || 'generic').icon}
                          className="flex-shrink-0 text-base"
                          style={{ color: getPlatformMeta(field.value || 'generic').color }}
                        />
                        <SelectValue placeholder="Pilih platform" />
                      </div>
                    </SelectTrigger>

                    {/* Dropdown: each option shows brand icon + label */}
                    <SelectContent className="max-h-80">
                      {Object.entries(platformGroups).map(([category, items]) => (
                        <SelectGroup key={category}>
                          <SelectLabel className="text-xs font-bold text-muted-foreground px-2 py-1.5">
                            {category}
                          </SelectLabel>
                          {items.map((p) => {
                            const meta = getPlatformMeta(p.key)
                            return (
                              <SelectItem key={p.key} value={p.key} textValue={p.label}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${meta.color}18` }}>
                                    <Icon icon={meta.icon} className="text-sm" style={{ color: meta.color }} />
                                  </div>
                                  <span className={cn('text-sm', p.locked && 'text-muted-foreground')}>{p.label}</span>
                                  {p.locked && (
                                    <Icon icon="mdi:lock-outline" className="text-xs text-amber-500 flex-shrink-0" />
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {/* Locked platform warning */}
              {selectedPlatform && platforms && (() => {
                const preset = platforms.find(p => p.key === selectedPlatform)
                return preset?.locked ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg flex items-center gap-1">
                    <Icon icon="mdi:lock-outline" />
                    Platform ini butuh plan dengan fitur Webhook. Upgrade plan untuk mengaktifkan.
                  </p>
                ) : null
              })()}
              {/* Platform notes */}
              {selectedPlatform && platforms && (() => {
                const preset = platforms.find(p => p.key === selectedPlatform)
                return preset?.notes ? (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Icon icon="mdi:information-outline" className="inline mr-1" />
                    {preset.notes}
                  </p>
                ) : null
              })()}
              {selectedPlatform && platforms && (() => {
                const preset = platforms.find(p => p.key === selectedPlatform)
                return preset?.webhookDocsUrl ? (
                  <a
                    href={preset.webhookDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-wa-600 hover:underline flex items-center gap-1"
                  >
                    <Icon icon="mdi:open-in-new" />Dokumentasi webhook {preset.label}
                  </a>
                ) : null
              })()}
            </div>

            {/* Device */}
            <div className="space-y-1.5">
              <Label>Device WhatsApp</Label>
              <Controller
                control={control}
                name="deviceId"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih device" /></SelectTrigger>
                    <SelectContent>
                      {devices?.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="flex items-center gap-2">
                            {d.name}
                            <Badge className={cn('text-[10px] py-0', d.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {d.status}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deviceId && <p className="text-xs text-red-500">{errors.deviceId.message}</p>}
            </div>

            {/* Phone source */}
            <div className="space-y-1.5">
              <Label>Sumber Nomor Penerima</Label>
              <Controller
                control={control}
                name="phoneSource"
                render={({ field }) => (
                  <div className="flex gap-2">
                    {(['field', 'fixed'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => field.onChange(v)}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                          field.value === v
                            ? 'bg-wa-600 text-white border-wa-600'
                            : 'border-border hover:border-wa-600 hover:text-wa-600'
                        )}
                      >
                        {v === 'field' ? (
                          <><Icon icon="mdi:code-braces" className="inline mr-1" />Dari Payload</>
                        ) : (
                          <><Icon icon="mdi:phone" className="inline mr-1" />Nomor Tetap</>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              />

              {phoneSource === 'field' ? (
                <div className="space-y-1">
                  <Input
                    placeholder="customer.phone  atau  billing.address.phone"
                    className="font-mono text-xs"
                    {...register('phoneField')}
                  />
                  <p className="text-xs text-muted-foreground">Dot-notation path ke nomor telepon di payload webhook</p>
                  {errors.phoneField && <p className="text-xs text-red-500">{errors.phoneField.message}</p>}
                </div>
              ) : (
                <div className="space-y-1">
                  <Input placeholder="628123456789" {...register('targetPhone')} />
                  <p className="text-xs text-muted-foreground">Semua webhook akan dikirim ke nomor ini</p>
                  {errors.targetPhone && <p className="text-xs text-red-500">{errors.targetPhone.message}</p>}
                </div>
              )}
            </div>

            {/* Message template */}
            <div className="space-y-1.5">
              <Label>Template Pesan</Label>
              <Textarea
                placeholder="Halo {{customer.first_name}}, pesanan #{{order_number}} telah diterima!"
                rows={4}
                {...register('messageTemplate')}
              />
              {errors.messageTemplate && <p className="text-xs text-red-500">{errors.messageTemplate.message}</p>}
              <p className="text-xs text-muted-foreground">
                Gunakan <code className="bg-muted px-1 rounded">{'{{dot.notation}}'}</code> untuk data dari payload.
                Array: <code className="bg-muted px-1 rounded">{'{{items.0.name}}'}</code>
              </p>
            </div>

            {/* Filter (optional) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filter Event (opsional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Field Filter</Label>
                  <Input
                    placeholder="topic  atau  event"
                    className="text-xs"
                    {...register('filterField')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nilai yang Diterima</Label>
                  <Input
                    placeholder="orders/create"
                    className="text-xs"
                    {...register('filterValue')}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk memproses semua event. Diisi = hanya proses jika payload[filterField] === filterValue
              </p>
            </div>

            {/* Signature verification (optional) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Verifikasi Signature HMAC (opsional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Header Signature</Label>
                  <Input
                    placeholder="X-Shopify-Hmac-Sha256"
                    className="text-xs"
                    {...register('signatureHeader')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Signature Secret</Label>
                  <Input
                    type="password"
                    placeholder="Secret dari platform"
                    className="text-xs"
                    {...register('signatureSecret')}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Jika secret diisi, webhook masuk diverifikasi HMAC — request dengan signature tidak
                valid ditolak (401). Kosongkan keduanya untuk menonaktifkan.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditTarget(null); reset() }}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={saving}>
                {saving ? (
                  <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                ) : (
                  <><Icon icon="mdi:content-save-outline" className="mr-2" />{editTarget ? 'Simpan' : 'Buat Integrasi'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Logs Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet open={!!logsTarget} onOpenChange={(v) => { if (!v) setLogsTarget(null) }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Icon icon="mdi:text-box-search-outline" className="text-wa-600" />
              Log Webhook — {logsTarget?.name}
            </SheetTitle>
          </SheetHeader>

          {logsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
            </div>
          ) : !logs?.length ? (
            <p className="text-center text-sm text-muted-foreground py-12">Belum ada log. Kirim test webhook untuk melihat hasilnya.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Rotate token confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!rotateTarget}
        onOpenChange={(v) => { if (!v) setRotateTarget(null) }}
        title="Reset Webhook URL?"
        description={`URL webhook "${rotateTarget?.name}" akan berubah. Platform yang menggunakan URL lama harus diperbarui.`}
        confirmLabel="Reset URL"
        destructive
        loading={rotating}
        onConfirm={() => { if (rotateTarget) rotate(rotateTarget.id) }}
      />

      {/* ── Delete confirm ────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Integrasi?"
        description={`Integrasi "${deleteTarget?.name}" dan semua log-nya akan dihapus permanen.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id) }}
      />
    </div>
  )
}

// ─── Log Entry sub-component ──────────────────────────────────────────────────
function LogEntry({ log }: { log: IntegrationLog }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <Badge className={cn('text-xs py-0 flex-shrink-0', LOG_STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-600')}>
          {log.status}
        </Badge>
        {log.phoneSent && (
          <span className="font-mono text-xs text-muted-foreground">{log.phoneSent}</span>
        )}
        <span className="flex-1 text-xs text-muted-foreground truncate">
          {log.renderedMessage ?? log.error ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(log.createdAt)}</span>
        <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="border-t p-3 bg-muted/30 space-y-3">
          {log.error && (
            <p className="text-xs text-red-600 flex items-start gap-1.5">
              <Icon icon="mdi:alert-circle-outline" className="mt-0.5 flex-shrink-0" />
              {log.error}
            </p>
          )}
          {log.renderedMessage && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Pesan dikirim</p>
              <pre className="text-xs bg-background rounded p-2 border whitespace-pre-wrap">{log.renderedMessage}</pre>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Raw Payload</p>
            <pre className="text-[10px] bg-background rounded p-2 border overflow-auto max-h-40 whitespace-pre">
              {JSON.stringify(log.rawPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
