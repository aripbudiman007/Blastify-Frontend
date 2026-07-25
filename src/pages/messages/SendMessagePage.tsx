import { useState } from 'react'
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { messageApi } from '@/api/message.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { planApi, planQueryKeys } from '@/api/plan.api'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/common/PageHeader'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { parsePhoneNumbers } from '@/lib/utils'
import { MESSAGE_TYPE_LABELS } from '@/lib/constants'
import { validateUrl, validateScheduleTime } from '@/lib/validation'
import type { MessageType } from '@/types'

const schema = z.object({
  deviceId:    z.string().min(1, 'Pilih device'),
  to:          z.string().min(8, 'Nomor tidak valid'),
  type:        z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'LOCATION', 'LIST', 'BUTTON']),
  message:     z.string().optional(),   // TEXT content — backend field name
  url:         z.string().optional(),   // media URL   — backend field name
  caption:     z.string().optional(),
  latitude:    z.coerce.number().optional(),
  longitude:   z.coerce.number().optional(),
  linkPreview: z.boolean().default(false),
  scheduled:   z.boolean().default(false),
  scheduledAt: z.string().optional(),
  // BUTTON — dibangun lewat form interaktif, bukan textarea JSON mentah
  buttonBody:   z.string().optional(),
  buttonFooter: z.string().optional(),
  buttonItems:  z.array(z.object({ text: z.string() })).optional(),
  // LIST — dibangun lewat form interaktif, bukan textarea JSON mentah
  listTitle:      z.string().optional(),
  listBody:       z.string().optional(),
  listFooter:     z.string().optional(),
  listButtonText: z.string().optional(),
  listSections:   z.array(z.object({
    title: z.string().optional(),
    rows:  z.array(z.object({ title: z.string(), description: z.string().optional() })),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'TEXT' && !data.message?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pesan wajib diisi', path: ['message'] })
  }
  if (['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'].includes(data.type)) {
    if (!data.url?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL media wajib diisi', path: ['url'] })
    } else if (!validateUrl(data.url)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL tidak valid', path: ['url'] })
    }
  }
  if (data.type === 'LOCATION') {
    if (data.latitude === undefined || isNaN(data.latitude)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Latitude wajib diisi', path: ['latitude'] })
    } else if (data.latitude < -90 || data.latitude > 90) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Latitude harus antara -90 dan 90', path: ['latitude'] })
    }
    if (data.longitude === undefined || isNaN(data.longitude)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Longitude wajib diisi', path: ['longitude'] })
    } else if (data.longitude < -180 || data.longitude > 180) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Longitude harus antara -180 dan 180', path: ['longitude'] })
    }
  }
  if (data.scheduled && data.scheduledAt) {
    if (!validateScheduleTime(data.scheduledAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Jadwal harus di masa depan', path: ['scheduledAt'] })
    }
  }
  if (data.type === 'LIST') {
    if (!data.listBody?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isi pesan wajib diisi', path: ['listBody'] })
    }
    const sections = data.listSections ?? []
    if (sections.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimal 1 kategori', path: ['listSections'] })
    }
    sections.forEach((s, si) => {
      if (s.rows.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimal 1 pilihan', path: ['listSections', si, 'rows'] })
      }
      s.rows.forEach((r, ri) => {
        if (!r.title.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Judul pilihan wajib diisi', path: ['listSections', si, 'rows', ri, 'title'] })
        }
      })
    })
  }
  if (data.type === 'BUTTON') {
    if (!data.buttonBody?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isi pesan wajib diisi', path: ['buttonBody'] })
    }
    const items = data.buttonItems ?? []
    if (items.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimal 1 tombol', path: ['buttonItems'] })
    }
    items.forEach((b, i) => {
      if (!b.text.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Label tombol wajib diisi', path: ['buttonItems', i, 'text'] })
      }
    })
  }
})
type FormData = z.infer<typeof schema>

const messageTypes: MessageType[] = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'LOCATION', 'LIST', 'BUTTON']

function MediaPreview({ type, url, caption }: { type: MessageType; url?: string; caption?: string }) {
  const hasUrl = Boolean(url?.trim())
  return (
    <div className="space-y-1.5">
      {type === 'IMAGE' && (
        hasUrl
          ? <img src={url} alt="preview" className="rounded-lg max-h-52 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          : <div className="rounded-lg h-40 bg-black/5 flex items-center justify-center"><Icon icon="mdi:image-outline" className="text-3xl text-muted-foreground/50" /></div>
      )}
      {type === 'VIDEO' && (
        hasUrl
          ? <video src={url} controls className="rounded-lg max-h-52 w-full" />
          : <div className="rounded-lg h-40 bg-black/5 flex items-center justify-center"><Icon icon="mdi:video-outline" className="text-3xl text-muted-foreground/50" /></div>
      )}
      {type === 'AUDIO' && (
        hasUrl
          ? <audio src={url} controls className="w-full" />
          : <div className="rounded-lg h-14 bg-black/5 flex items-center justify-center gap-2 text-muted-foreground/60"><Icon icon="mdi:volume-high" />Audio</div>
      )}
      {type === 'DOCUMENT' && (
        <div className="rounded-lg p-3 bg-black/5 flex items-center gap-2">
          <Icon icon="mdi:file-document-outline" className="text-2xl text-muted-foreground/70 flex-shrink-0" />
          <span className="text-xs truncate">{hasUrl ? url!.split('/').pop() : 'Dokumen'}</span>
        </div>
      )}
      {caption && <p className="text-[13px] leading-snug whitespace-pre-wrap">{caption}</p>}
    </div>
  )
}

function WhatsAppPreview({
  to, type, message, url, caption, linkPreview, latitude, longitude, deviceName,
  buttonBody, buttonFooter, buttonItems,
  listTitle, listBody, listFooter, listButtonText, listSections,
}: {
  to?: string; type: MessageType; message?: string; url?: string; caption?: string
  linkPreview?: boolean; latitude?: number; longitude?: number; deviceName?: string
  buttonBody?: string; buttonFooter?: string; buttonItems?: { text: string }[]
  listTitle?: string; listBody?: string; listFooter?: string; listButtonText?: string
  listSections?: { title?: string; rows: { title: string; description?: string }[] }[]
}) {
  const now = new Date()
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const urlMatch = message?.match(/https?:\/\/[^\s]+/)

  return (
    <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ background: '#e5ddd5' }}>
      {/* Header bar */}
      <div className="px-3 py-2.5 flex items-center gap-2 bg-wa-700 text-white">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon icon="mdi:account" className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate">{to ? `+${to}` : 'Nomor tujuan'}</p>
          <p className="text-[10px] opacity-75 truncate">{deviceName ?? 'Pilih device'}</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-3 min-h-[220px] flex flex-col justify-end">
        <div className="ml-auto max-w-[85%] rounded-lg px-2.5 py-2 shadow-sm" style={{ background: '#dcf8c6' }}>
          {/* TEXT */}
          {type === 'TEXT' && (
            <>
              {message?.trim()
                ? <p className="text-[13px] leading-snug whitespace-pre-wrap break-words">{message}</p>
                : <p className="text-[13px] text-muted-foreground/60 italic">Ketik pesan untuk melihat pratinjau...</p>}
              {linkPreview && urlMatch && (
                <div className="mt-1.5 rounded-md overflow-hidden border border-black/10 bg-white/40">
                  <div className="h-16 bg-black/10 flex items-center justify-center">
                    <Icon icon="mdi:link-variant" className="text-lg text-muted-foreground/50" />
                  </div>
                  <p className="text-[10px] px-2 py-1 truncate text-muted-foreground">{urlMatch[0]}</p>
                </div>
              )}
            </>
          )}

          {/* MEDIA */}
          {['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(type) && (
            <MediaPreview type={type} url={url} caption={caption} />
          )}

          {/* LOCATION */}
          {type === 'LOCATION' && (
            <div className="space-y-1.5">
              <div className="rounded-lg h-32 bg-black/10 flex items-center justify-center">
                <Icon icon="mdi:map-marker" className="text-3xl text-red-500" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)
                  ? `${latitude}, ${longitude}`
                  : 'Lokasi belum diisi'}
              </p>
            </div>
          )}

          {/* LIST */}
          {type === 'LIST' && (
            <div className="space-y-1">
              {listTitle?.trim() && <p className="text-[13px] font-semibold">{listTitle}</p>}
              {listBody?.trim()
                ? <p className="text-[12.5px] leading-snug whitespace-pre-wrap">{listBody}</p>
                : <p className="text-[12px] text-muted-foreground/60 italic">Ketik isi pesan...</p>}
              {listFooter?.trim() && <p className="text-[10.5px] text-muted-foreground">{listFooter}</p>}
              <div className="mt-1.5 rounded-md border border-black/10 bg-white/50 px-2.5 py-1.5 text-center text-[12px] font-medium text-wa-700">
                {listButtonText?.trim() || 'Pilih'}
              </div>
              {(listSections ?? []).map((sec, i) => (
                <div key={i} className="text-[11px] text-muted-foreground mt-1">
                  {sec.title?.trim() && <p className="font-medium">{sec.title}</p>}
                  {sec.rows.map((row, j) => (
                    <p key={j} className="pl-2">• {row.title?.trim() || `Pilihan ${j + 1}`}{row.description?.trim() ? ` — ${row.description}` : ''}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* BUTTON */}
          {type === 'BUTTON' && (
            <div className="space-y-1.5">
              {buttonBody?.trim()
                ? <p className="text-[12.5px] leading-snug whitespace-pre-wrap">{buttonBody}</p>
                : <p className="text-[12px] text-muted-foreground/60 italic">Ketik isi pesan...</p>}
              {buttonFooter?.trim() && <p className="text-[10.5px] text-muted-foreground">{buttonFooter}</p>}
              <div className="space-y-1 mt-1">
                {(buttonItems ?? []).map((btn, i) => (
                  <div key={i} className="rounded-md border border-black/10 bg-white/50 px-2.5 py-1.5 text-center text-[12px] font-medium text-wa-700">
                    {btn.text?.trim() || `Tombol ${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground/70">{time}</span>
            <Icon icon="mdi:check-all" className="text-[13px] text-sky-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ListSectionEditor({
  control, register, sectionIndex, onRemoveSection, canRemoveSection,
}: {
  control: any; register: any; sectionIndex: number
  onRemoveSection: () => void; canRemoveSection: boolean
}) {
  const { fields: rowFields, append: appendRow, remove: removeRow } = useFieldArray({
    control, name: `listSections.${sectionIndex}.rows`,
  })

  return (
    <div className="rounded-lg border p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Nama kategori ${sectionIndex + 1} (opsional)`}
          {...register(`listSections.${sectionIndex}.title`)}
        />
        <Button type="button" size="icon" variant="ghost" disabled={!canRemoveSection} onClick={onRemoveSection}>
          <Icon icon="mdi:trash-can-outline" className="text-red-500" />
        </Button>
      </div>

      <div className="space-y-2 pl-2 border-l-2">
        {rowFields.map((row, ri) => (
          <div key={row.id} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input placeholder={`Pilihan ${ri + 1}`} {...register(`listSections.${sectionIndex}.rows.${ri}.title`)} />
              <Input placeholder="Deskripsi (opsional)" {...register(`listSections.${sectionIndex}.rows.${ri}.description`)} />
            </div>
            <Button type="button" size="icon" variant="ghost" disabled={rowFields.length <= 1} onClick={() => removeRow(ri)}>
              <Icon icon="mdi:close" className="text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={() => appendRow({ title: '', description: '' })}>
        <Icon icon="mdi:plus" className="mr-1" />Tambah Pilihan
      </Button>
    </div>
  )
}

export function SendMessagePage() {
  const [bulkText, setBulkText] = useState('')
  const [bulkExpanded, setBulkExpanded] = useState(false)
  const userPlan = useAuthStore((s) => s.user?.plan)

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => deviceApi.getAll(),
    select: (r) => (r.data.data?.devices ?? []).filter((d) => d.status === 'CONNECTED'),
  })

  const { data: plans } = useQuery({
    queryKey: planQueryKeys.all,
    queryFn: () => planApi.getAll(),
    select: (r) => r.data.data?.plans ?? [],
    staleTime: Infinity,
  })

  const currentPlan = plans?.find((p) => p.plan === userPlan)
  const allowedTypes = currentPlan?.allowedMessageTypes
  const isTypeAllowed = (t: MessageType) =>
    !allowedTypes || allowedTypes === 'all' || allowedTypes.length === 0 || allowedTypes.includes(t)

  const { control, register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      type: 'TEXT', scheduled: false,
      buttonItems: [{ text: '' }],
      listSections: [{ title: '', rows: [{ title: '', description: '' }] }],
    },
  })

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control, name: 'buttonItems',
  })

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control, name: 'listSections',
  })

  const type        = watch('type')
  const scheduled   = watch('scheduled')
  const msgValue    = watch('message') ?? ''
  const toValue     = watch('to')
  const urlValue    = watch('url')
  const captionValue = watch('caption')
  const linkPreviewValue = watch('linkPreview')
  const latitudeValue  = watch('latitude')
  const longitudeValue = watch('longitude')
  const deviceIdValue  = watch('deviceId')
  const selectedDevice = devices?.find((d) => d.id === deviceIdValue)
  const buttonBodyValue   = watch('buttonBody')
  const buttonFooterValue = watch('buttonFooter')
  const buttonItemsValue  = watch('buttonItems')
  const listTitleValue      = watch('listTitle')
  const listBodyValue       = watch('listBody')
  const listFooterValue     = watch('listFooter')
  const listButtonTextValue = watch('listButtonText')
  const listSectionsValue   = watch('listSections')

  const { mutate: send, isPending } = useMutation({
    mutationFn: messageApi.send,
    onSuccess: (_, vars) => {
      toast.success('Pesan berhasil masuk antrian')
      reset({
        deviceId:    vars.deviceId,
        type:        vars.type as FormData['type'],
        scheduled:   false,
        linkPreview: false,
        to: '', message: '', url: '', caption: '', scheduledAt: '',
      })
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code
      const msg = err.response?.data?.error?.message
      if (code === 'MESSAGE_TYPE_NOT_ALLOWED') {
        toast.error(`Tipe pesan tidak diizinkan: ${msg}`)
      } else if (code === 'WARMUP_LIMIT_REACHED') {
        toast.error(msg || 'Device sedang warm-up, limit harian tercapai')
      } else {
        toast.error(msg || 'Gagal mengirim pesan')
      }
    },
  })

  const { mutate: sendBulk, isPending: bulkPending } = useMutation({
    mutationFn: messageApi.sendBulk,
    onSuccess: (res) => {
      toast.success(`${res.data.data.results.length} pesan masuk antrian`)
      setBulkText('')
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code
      const msg = err.response?.data?.error?.message
      if (code === 'MESSAGE_TYPE_NOT_ALLOWED') {
        toast.error(`Tipe pesan tidak diizinkan: ${msg}`)
      } else if (code === 'WARMUP_LIMIT_REACHED') {
        toast.error(msg || 'Device sedang warm-up, limit harian tercapai')
      } else {
        toast.error(msg || 'Gagal mengirim pesan massal')
      }
    },
  })

  const bulkNumbers = parsePhoneNumbers(bulkText)

  // Serialisasi form interaktif BUTTON → JSON yang dipahami backend (id tombol di-auto oleh backend)
  const buildMessageContent = (data: FormData): string | undefined => {
    if (data.type === 'BUTTON') {
      return JSON.stringify({
        text: data.buttonBody,
        footer: data.buttonFooter?.trim() || undefined,
        buttons: (data.buttonItems ?? []).map((b) => ({ text: b.text })),
      })
    }
    if (data.type === 'LIST') {
      return JSON.stringify({
        title: data.listTitle?.trim() || undefined,
        text: data.listBody,
        footer: data.listFooter?.trim() || undefined,
        buttonText: data.listButtonText?.trim() || 'Pilih',
        sections: (data.listSections ?? []).map((s, si) => ({
          title: s.title?.trim() || undefined,
          rows: s.rows.map((r, ri) => ({
            id: `sec${si + 1}-row${ri + 1}`,
            title: r.title,
            description: r.description?.trim() || undefined,
          })),
        })),
      })
    }
    return data.message || undefined
  }

  const onSubmit = (data: FormData) => {
    send({
      deviceId:    data.deviceId,
      to:          data.to,
      type:        data.type,
      message:     buildMessageContent(data),
      url:         data.url     || undefined,
      caption:     data.caption,
      latitude:    data.latitude,
      longitude:   data.longitude,
      linkPreview: data.type === 'TEXT' ? data.linkPreview : undefined,
      scheduledAt: data.scheduled ? data.scheduledAt : undefined,
    })
  }

  const onBulkSubmit = (data: FormData) => {
    if (bulkNumbers.length === 0) return toast.error('Tidak ada nomor valid')
    if (bulkNumbers.length > 50)  return toast.error('Maksimal 50 nomor')
    sendBulk({
      deviceId:   data.deviceId,
      recipients: bulkNumbers,
      type:       data.type,
      message:    buildMessageContent(data),
      url:        data.url     || undefined,
      caption:    data.caption,
    })
  }

  return (
    <div className="max-w-5xl">
      <PageHeader title="Kirim Pesan" description="Kirim pesan WhatsApp ke satu atau banyak nomor" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Device */}
            <div className="space-y-1.5">
              <Label>Device</Label>
              <Controller
                control={control}
                name="deviceId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih device yang terhubung" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices?.length === 0 && (
                        <SelectItem value="__empty__" disabled>Tidak ada device terhubung</SelectItem>
                      )}
                      {devices?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="flex items-center gap-2">
                            <Icon icon="mdi:cellphone-check" className="text-wa-600" />
                            {d.name} {d.phone && `(+${d.phone})`}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deviceId && <p className="text-xs text-red-500">{errors.deviceId.message}</p>}
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <Label>Ke Nomor</Label>
              <Input placeholder="628123456789 (tanpa + atau spasi)" {...register('to')} />
              {errors.to && <p className="text-xs text-red-500">{errors.to.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipe Pesan</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {messageTypes.map((t) => {
                      const allowed = isTypeAllowed(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!allowed}
                          title={allowed ? undefined : `Tipe ${MESSAGE_TYPE_LABELS[t]} butuh upgrade plan`}
                          onClick={() => {
                            if (!allowed) {
                              toast.error(`Tipe ${MESSAGE_TYPE_LABELS[t]} tidak tersedia di plan Anda. Upgrade untuk menggunakannya.`)
                              return
                            }
                            field.onChange(t)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                            !allowed
                              ? 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'
                              : field.value === t
                                ? 'bg-wa-600 text-white border-wa-600'
                                : 'bg-background border-border hover:border-whatsapp-400'
                          }`}
                        >
                          {!allowed && <Icon icon="mdi:lock-outline" className="text-xs" />}
                          {MESSAGE_TYPE_LABELS[t]}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              {allowedTypes && allowedTypes !== 'all' && allowedTypes.length > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Icon icon="mdi:information-outline" />
                  Plan {userPlan} hanya bisa mengirim: {allowedTypes.join(', ')}
                </p>
              )}
            </div>

            {/* Content */}
            {type === 'TEXT' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label>Pesan</Label>
                    <span className="text-xs text-muted-foreground">{msgValue.length}/4096</span>
                  </div>
                  <Textarea
                    placeholder="Tulis pesan Anda..."
                    rows={4}
                    maxLength={4096}
                    {...register('message')}
                  />
                  {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Link Preview</p>
                    <p className="text-xs text-muted-foreground">Tampilkan pratinjau link jika ada URL dalam pesan</p>
                  </div>
                  <Controller
                    control={control}
                    name="linkPreview"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            )}

            {type === 'LIST' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Judul <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                  <Input placeholder="mis. Pilih Menu" {...register('listTitle')} />
                </div>

                <div className="space-y-1.5">
                  <Label>Isi Pesan</Label>
                  <Textarea placeholder="Silakan pilih salah satu:" rows={3} {...register('listBody')} />
                  {errors.listBody && <p className="text-xs text-red-500">{errors.listBody.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Footer <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                  <Input placeholder="mis. Blastify" {...register('listFooter')} />
                </div>

                <div className="space-y-1.5">
                  <Label>Teks Tombol <span className="text-xs text-muted-foreground">(opsional, default "Pilih")</span></Label>
                  <Input placeholder="mis. Lihat Pilihan" {...register('listButtonText')} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Kategori &amp; Pilihan</Label>
                    <Button
                      type="button" size="sm" variant="outline"
                      onClick={() => appendSection({ title: '', rows: [{ title: '', description: '' }] })}
                    >
                      <Icon icon="mdi:plus" className="mr-1" />Tambah Kategori
                    </Button>
                  </div>
                  {errors.listSections && !Array.isArray(errors.listSections) && (
                    <p className="text-xs text-red-500">{errors.listSections.message as string}</p>
                  )}
                  <div className="space-y-3">
                    {sectionFields.map((section, si) => (
                      <ListSectionEditor
                        key={section.id}
                        control={control}
                        register={register}
                        sectionIndex={si}
                        onRemoveSection={() => removeSection(si)}
                        canRemoveSection={sectionFields.length > 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {type === 'BUTTON' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Isi Pesan</Label>
                  <Textarea placeholder="Tulis pesan Anda..." rows={3} {...register('buttonBody')} />
                  {errors.buttonBody && <p className="text-xs text-red-500">{errors.buttonBody.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Footer <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                  <Input placeholder="mis. Blastify" {...register('buttonFooter')} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Tombol <span className="text-xs text-muted-foreground">(maks. 3)</span></Label>
                    {buttonFields.length < 3 && (
                      <Button type="button" size="sm" variant="outline" onClick={() => appendButton({ text: '' })}>
                        <Icon icon="mdi:plus" className="mr-1" />Tambah Tombol
                      </Button>
                    )}
                  </div>
                  {errors.buttonItems && !Array.isArray(errors.buttonItems) && (
                    <p className="text-xs text-red-500">{errors.buttonItems.message as string}</p>
                  )}
                  <div className="space-y-2">
                    {buttonFields.map((field, i) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input placeholder={`Label tombol ${i + 1}`} {...register(`buttonItems.${i}.text`)} />
                        <Button
                          type="button" size="icon" variant="ghost"
                          disabled={buttonFields.length <= 1}
                          onClick={() => removeButton(i)}
                        >
                          <Icon icon="mdi:trash-can-outline" className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {Array.isArray(errors.buttonItems) && errors.buttonItems.map((err, i) =>
                    err?.text && <p key={i} className="text-xs text-red-500">Tombol {i + 1}: {err.text.message}</p>
                  )}
                </div>
              </div>
            )}

            {['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'].includes(type) && (
              <>
                <div className="space-y-1.5">
                  <Label>URL Media</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://example.com/file.jpg" {...register('url')} />
                    <MediaUploadButton onUploaded={(u) => setValue('url', u, { shouldValidate: true })} />
                  </div>
                  {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
                </div>
                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(type) && (
                  <div className="space-y-1.5">
                    <Label>Caption (opsional)</Label>
                    <Textarea placeholder="Caption untuk media..." rows={2} {...register('caption')} />
                  </div>
                )}
              </>
            )}

            {type === 'LOCATION' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" placeholder="-6.2" {...register('latitude')} />
                  {errors.latitude && <p className="text-xs text-red-500">{errors.latitude.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" placeholder="106.8" {...register('longitude')} />
                  {errors.longitude && <p className="text-xs text-red-500">{errors.longitude.message}</p>}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Jadwalkan Pengiriman</p>
                <p className="text-xs text-muted-foreground">Kirim pesan pada waktu tertentu</p>
              </div>
              <Controller
                control={control}
                name="scheduled"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {scheduled && (
              <div className="space-y-1.5">
                <Label>Waktu Pengiriman</Label>
                <Input type="datetime-local" {...register('scheduledAt')} />
              </div>
            )}

            <Button type="submit" className="w-full bg-wa-600 hover:bg-wa-700" disabled={isPending}>
              {isPending
                ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Mengirim...</>
                : <><Icon icon="mdi:send" className="mr-2" />Kirim Pesan</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Send */}
      <Card className="mt-4">
        <CardHeader className="cursor-pointer" onClick={() => setBulkExpanded(!bulkExpanded)}>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Icon icon="mdi:account-multiple" className="text-wa-600" />
              Kirim Massal (Bulk)
            </span>
            <Icon icon={bulkExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
          </CardTitle>
        </CardHeader>
        {bulkExpanded && (
          <CardContent className="pt-0 space-y-4">
            <Separator />
            <p className="text-sm text-muted-foreground">
              Masukkan satu nomor per baris (maks. 50 nomor). Format: 628xxx
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label>Daftar Nomor</Label>
                <span className="text-xs text-muted-foreground">{bulkNumbers.length} nomor terdeteksi</span>
              </div>
              <Textarea
                placeholder={`628123456789\n628987654321\n628111222333`}
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-wa-600 hover:bg-wa-700"
              disabled={bulkPending || bulkNumbers.length === 0}
              onClick={handleSubmit(onBulkSubmit)}
            >
              {bulkPending
                ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Mengirim...</>
                : <><Icon icon="mdi:send-check" className="mr-2" />Kirim ke {bulkNumbers.length} Nomor</>}
            </Button>
          </CardContent>
        )}
      </Card>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pratinjau Langsung</p>
        <WhatsAppPreview
          to={toValue}
          type={type}
          message={msgValue}
          url={urlValue}
          caption={captionValue}
          linkPreview={linkPreviewValue}
          latitude={latitudeValue}
          longitude={longitudeValue}
          deviceName={selectedDevice?.name}
          buttonBody={buttonBodyValue}
          buttonFooter={buttonFooterValue}
          buttonItems={buttonItemsValue}
          listTitle={listTitleValue}
          listBody={listBodyValue}
          listFooter={listFooterValue}
          listButtonText={listButtonTextValue}
          listSections={listSectionsValue}
        />
      </div>
      </div>
    </div>
  )
}
