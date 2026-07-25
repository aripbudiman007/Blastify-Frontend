import { Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { integrationApi, integrationQueryKeys } from '@/api/integration.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { PLAN_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AdminPlanLimit } from '@/types'

// Angka -1 = unlimited. Harga diedit dalam Rupiah, dikirim ke backend dalam sen.
// Input dibungkus preprocess supaya field kosong (NaN) tampil sebagai pesan yang jelas, bukan error teknis Zod.
const numberField = (min: number) =>
  z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
    z.number({ error: 'Wajib diisi dengan angka' }).int('Harus bilangan bulat').min(min, `Minimal ${min}`),
  )

const schema = z.object({
  priceRupiah:          numberField(0),
  maxDevices:           numberField(-1),
  monthlyMessages:      numberField(-1),
  maxContacts:          numberField(-1),
  maxBroadcasts:        numberField(-1),
  messageRetentionDays: numberField(-1),
  maxTemplates:         numberField(-1),
  aiMonthlyReplies:     numberField(-1),
  canAutoReply:         z.boolean(),
  canDeviceRotation:    z.boolean(),
  canSchedule:          z.boolean(),
  canWebhook:           z.boolean(),
  canCsvImport:         z.boolean(),
  canIpWhitelist:       z.boolean(),
  canAiReply:           z.boolean(),
  hasWatermark:         z.boolean(),
  allowedMessageTypes:  z.array(z.string()),
  allowedPlatforms:     z.array(z.string()),
})
type FormData = z.infer<typeof schema>

const NUMBER_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: 'maxDevices',           label: 'Device' },
  { key: 'monthlyMessages',      label: 'Pesan/bulan' },
  { key: 'maxContacts',          label: 'Kontak' },
  { key: 'maxBroadcasts',        label: 'Broadcast/bulan' },
  { key: 'messageRetentionDays', label: 'Retensi pesan (hari)' },
  { key: 'maxTemplates',         label: 'Template' },
  { key: 'aiMonthlyReplies',     label: 'Balasan AI/bulan' },
]

const FEATURE_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: 'canAutoReply',      label: 'Auto-Reply' },
  { key: 'canAiReply',        label: 'AI Reply' },
  { key: 'canDeviceRotation', label: 'Device Rotation' },
  { key: 'canSchedule',       label: 'Pesan Terjadwal' },
  { key: 'canWebhook',        label: 'Webhook' },
  { key: 'canCsvImport',      label: 'Import CSV' },
  { key: 'canIpWhitelist',    label: 'IP Whitelist' },
  { key: 'hasWatermark',      label: 'Watermark' },
]

const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'LOCATION', 'CONTACT', 'TEMPLATE', 'LIST', 'BUTTON'] as const

const fmt = (n: number | undefined) =>
  n === undefined ? '—' : n === -1 ? '∞' : n.toLocaleString('id-ID')

const isPlatformAllowed = (plan: AdminPlanLimit, key: string) => {
  if (!plan.canWebhook) return false
  const allowed = plan.allowedPlatforms ?? []
  return allowed.length === 0 || allowed.includes(key)
}

function groupByCategory<T extends { category: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
}

export function AdminPlansPage() {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<AdminPlanLimit | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: adminQueryKeys.plans,
    queryFn:  () => adminApi.listPlans(),
    select:   (r) => r.data.data?.plans ?? [],
  })

  const { data: platforms } = useQuery({
    queryKey: integrationQueryKeys.platforms,
    queryFn:  () => integrationApi.getPlatforms(),
    select:   (r) => r.data.data ?? [],
    staleTime: Infinity,
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (d: FormData) => adminApi.updatePlan(editTarget!.plan, {
      price:                Math.round(d.priceRupiah * 100), // Rupiah → sen
      maxDevices:           d.maxDevices,
      monthlyMessages:      d.monthlyMessages,
      maxContacts:          d.maxContacts,
      maxBroadcasts:        d.maxBroadcasts,
      messageRetentionDays: d.messageRetentionDays,
      maxTemplates:         d.maxTemplates,
      aiMonthlyReplies:     d.aiMonthlyReplies,
      canAutoReply:         d.canAutoReply,
      canDeviceRotation:    d.canDeviceRotation,
      canSchedule:          d.canSchedule,
      canWebhook:           d.canWebhook,
      canCsvImport:         d.canCsvImport,
      canIpWhitelist:       d.canIpWhitelist,
      canAiReply:           d.canAiReply,
      hasWatermark:         d.hasWatermark,
      allowedMessageTypes:  d.allowedMessageTypes,
      allowedPlatforms:     d.allowedPlatforms,
    }),
    onSuccess: () => {
      toast.success(`Plan ${editTarget?.plan} diperbarui — berlaku langsung ke semua user`)
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setEditTarget(null)
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err.response?.data?.error?.message ?? 'Gagal update plan'),
  })

  const openEdit = (plan: AdminPlanLimit) => {
    setEditTarget(plan)
    reset({
      priceRupiah:          (plan.price ?? 0) / 100,
      maxDevices:           plan.maxDevices ?? 1,
      monthlyMessages:      plan.monthlyMessages ?? 1000,
      maxContacts:          plan.maxContacts ?? 500,
      maxBroadcasts:        plan.maxBroadcasts ?? 5,
      messageRetentionDays: plan.messageRetentionDays ?? 2,
      maxTemplates:         plan.maxTemplates ?? 5,
      aiMonthlyReplies:     plan.aiMonthlyReplies ?? 0,
      canAutoReply:         plan.canAutoReply ?? false,
      canDeviceRotation:    plan.canDeviceRotation ?? false,
      canSchedule:          plan.canSchedule ?? true,
      canWebhook:           plan.canWebhook ?? false,
      canCsvImport:         plan.canCsvImport ?? false,
      canIpWhitelist:       plan.canIpWhitelist ?? false,
      canAiReply:           plan.canAiReply ?? false,
      hasWatermark:         plan.hasWatermark ?? false,
      allowedMessageTypes:  plan.allowedMessageTypes ?? [],
      allowedPlatforms:     plan.allowedPlatforms ?? [],
    })
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Plan Management</h1>
        <p className="text-sm text-muted-foreground">
          Ubah harga, limit, dan fitur setiap plan. Perubahan berlaku langsung tanpa deploy.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium w-44">Atribut</th>
                  {plans?.map((plan) => (
                    <th key={plan.plan} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded', PLAN_COLORS[plan.plan])}>
                          {plan.plan}
                        </span>
                        {plan.seeded === false && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            belum di-seed
                          </span>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => openEdit(plan)}>
                          <Icon icon="mdi:pencil" className="mr-1 text-xs" />
                          Edit
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Harga */}
                <tr className="border-b bg-muted/10">
                  <td className="px-4 py-3 font-medium">Harga/bulan</td>
                  {plans?.map((plan) => (
                    <td key={plan.plan} className="px-4 py-3 text-center font-semibold">
                      {(plan.price ?? 0) === 0
                        ? 'Gratis'
                        : `Rp ${((plan.price ?? 0) / 100).toLocaleString('id-ID')}`}
                    </td>
                  ))}
                </tr>

                {/* Limit angka */}
                {NUMBER_FIELDS.map(({ key, label }) => (
                  <tr key={key} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                    {plans?.map((plan) => (
                      <td key={plan.plan} className="px-4 py-2.5 text-center font-medium">
                        {fmt(plan[key as keyof AdminPlanLimit] as number | undefined)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Fitur boolean */}
                {FEATURE_FIELDS.map(({ key, label }, i) => (
                  <tr key={key} className={cn('hover:bg-muted/20', i < FEATURE_FIELDS.length - 1 && 'border-b')}>
                    <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                    {plans?.map((plan) => {
                      const enabled = plan[key as keyof AdminPlanLimit] as boolean | undefined
                      return (
                        <td key={plan.plan} className="px-4 py-2.5 text-center">
                          <Icon
                            icon={enabled ? 'mdi:check-circle' : 'mdi:close-circle-outline'}
                            className={cn('text-lg inline-block', enabled ? 'text-emerald-600' : 'text-muted-foreground/40')}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Tipe pesan yang diizinkan */}
                <tr className="border-b hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">Tipe Pesan</td>
                  {plans?.map((plan) => {
                    const types = plan.allowedMessageTypes ?? []
                    const typeLabel = types.length === 0 ? 'Semua' : types.join(', ')
                    return (
                      <td key={plan.plan} className="px-4 py-2.5 text-center text-xs font-medium">
                        <span className="bg-muted px-2 py-1 rounded inline-block">{typeLabel}</span>
                      </td>
                    )
                  })}
                </tr>

                {/* Platform integrasi — satu baris per platform, dikelompokkan per kategori */}
                {Object.entries(groupByCategory(platforms ?? [])).map(([category, items]) => (
                  <Fragment key={category}>
                    <tr className="bg-muted/30">
                      <td colSpan={(plans?.length ?? 0) + 1} className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {category}
                      </td>
                    </tr>
                    {items.map((plat) => (
                      <tr key={plat.key} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground pl-6">{plat.label}</td>
                        {plans?.map((plan) => {
                          const allowed = isPlatformAllowed(plan, plat.key)
                          return (
                            <td key={plan.plan} className="px-4 py-2 text-center">
                              <Icon
                                icon={allowed ? 'mdi:check-circle' : 'mdi:close-circle-outline'}
                                className={cn('text-base inline-block', allowed ? 'text-emerald-600' : 'text-muted-foreground/40')}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan — {editTarget?.plan}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleSubmit((d) => save(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="priceRupiah">Harga per bulan (Rupiah)</Label>
                <Input id="priceRupiah" type="number" min={0}
                  {...register('priceRupiah', { valueAsNumber: true })} />
                {errors.priceRupiah && <p className="text-xs text-red-500">{errors.priceRupiah.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {NUMBER_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="text-xs">{label}</Label>
                    <Input id={key} type="number" min={-1}
                      {...register(key as 'maxDevices', { valueAsNumber: true })} />
                    {errors[key] && <p className="text-xs text-red-500">{errors[key]?.message as string}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Isi -1 untuk unlimited.</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fitur</p>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURE_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={watch(key as 'canAutoReply')}
                        onCheckedChange={(v) => setValue(key as 'canAutoReply', v === true)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedMessageTypes" className="text-xs">Tipe Pesan yang Diizinkan</Label>
                <p className="text-xs text-muted-foreground mb-2">Kosongkan untuk mengizinkan semua tipe. Pilih untuk membatasi.</p>
                <div className="grid grid-cols-3 gap-2">
                  {MESSAGE_TYPES.map((msgType) => {
                    const selected = watch('allowedMessageTypes').includes(msgType)
                    return (
                      <label key={msgType} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(v) => {
                            const current = watch('allowedMessageTypes')
                            if (v === true) {
                              setValue('allowedMessageTypes', [...current, msgType])
                            } else {
                              setValue('allowedMessageTypes', current.filter((t) => t !== msgType))
                            }
                          }}
                        />
                        {msgType}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Platform Integrasi yang Diizinkan</Label>
                <p className="text-xs text-muted-foreground mb-2">Kosongkan untuk mengizinkan semua platform. Pilih untuk membatasi (butuh fitur Webhook aktif).</p>
                {!watch('canWebhook') && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <Icon icon="mdi:alert-outline" className="flex-shrink-0 mt-0.5" />
                    Fitur <strong>Webhook</strong> untuk plan ini masih nonaktif — pilihan platform di bawah tidak akan berpengaruh sampai Webhook diaktifkan.
                  </p>
                )}
                <div className="max-h-56 overflow-y-auto border rounded-lg p-3 space-y-3">
                  {Object.entries(groupByCategory(platforms ?? [])).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{category}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {items.map((p) => {
                          const selected = watch('allowedPlatforms').includes(p.key)
                          return (
                            <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(v) => {
                                  const current = watch('allowedPlatforms')
                                  if (v === true) {
                                    setValue('allowedPlatforms', [...current, p.key])
                                  } else {
                                    setValue('allowedPlatforms', current.filter((k) => k !== p.key))
                                  }
                                }}
                              />
                              {p.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
                <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={saving}>
                  {saving
                    ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                    : <><Icon icon="mdi:content-save-outline" className="mr-2" />Simpan</>
                  }
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
