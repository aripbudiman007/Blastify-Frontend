import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountApi, accountQueryKeys } from '@/api/account.api'
import { planApi, planQueryKeys } from '@/api/plan.api'
import { contactApi } from '@/api/contact.api'
import { broadcastApi } from '@/api/broadcast.api'
import { templateApi } from '@/api/template.api'
import { useAuthStore } from '@/store/auth.store'
import { useRateLimit } from '@/hooks/useRateLimit'
import { storeRateLimitToLocalStorage, isAxiosError429 } from '@/utils/errorHandler'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { API_URL, PLAN_COLORS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import { openPayment } from '@/lib/midtrans'
import { TwoFactorCard } from './TwoFactorCard'
import type { Plan } from '@/types'

// ─── Blastify compat endpoint catalogue ───────────────────────────────────────
const COMPAT_BASE = `${API_URL}/blastify`

interface CompatEndpoint {
  method: 'POST' | 'GET'
  path: string
  description: string
  fields: { name: string; type: string; required: boolean; note?: string }[]
  example?: string
}

const COMPAT_ENDPOINTS: CompatEndpoint[] = [
  {
    method: 'POST',
    path: '/send-message',
    description: 'Kirim pesan teks',
    fields: [
      { name: 'phone',         type: 'string', required: true,  note: 'Nomor tujuan (628xxx)' },
      { name: 'message',       type: 'string', required: true,  note: 'Isi pesan' },
      { name: 'secret_device', type: 'string', required: false, note: 'Nomor device (opsional)' },
    ],
    example: '{\n  "phone": "628123456789",\n  "message": "Halo!"\n}',
  },
  {
    method: 'POST',
    path: '/send-image',
    description: 'Kirim gambar',
    fields: [
      { name: 'phone',         type: 'string', required: true },
      { name: 'image',         type: 'string (URL)', required: true,  note: 'URL gambar' },
      { name: 'caption',       type: 'string', required: false },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "image": "https://example.com/img.jpg",\n  "caption": "Lihat ini!"\n}',
  },
  {
    method: 'POST',
    path: '/send-video',
    description: 'Kirim video',
    fields: [
      { name: 'phone',         type: 'string', required: true },
      { name: 'video',         type: 'string (URL)', required: true,  note: 'URL video' },
      { name: 'caption',       type: 'string', required: false },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "video": "https://example.com/vid.mp4"\n}',
  },
  {
    method: 'POST',
    path: '/send-document',
    description: 'Kirim dokumen / file',
    fields: [
      { name: 'phone',         type: 'string', required: true },
      { name: 'document',      type: 'string (URL)', required: true,  note: 'URL dokumen' },
      { name: 'caption',       type: 'string', required: false },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "document": "https://example.com/file.pdf"\n}',
  },
  {
    method: 'POST',
    path: '/send-audio',
    description: 'Kirim audio / voice note',
    fields: [
      { name: 'phone',         type: 'string', required: true },
      { name: 'audio',         type: 'string (URL)', required: true,  note: 'URL audio' },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "audio": "https://example.com/audio.mp3"\n}',
  },
  {
    method: 'POST',
    path: '/send-location',
    description: 'Kirim lokasi',
    fields: [
      { name: 'phone',         type: 'string', required: true },
      { name: 'latitude',      type: 'number', required: true },
      { name: 'longitude',     type: 'number', required: true },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "latitude": -6.2088,\n  "longitude": 106.8456\n}',
  },
  {
    method: 'POST',
    path: '/send-list-message',
    description: 'Kirim pesan list interaktif',
    fields: [
      { name: 'phone',    type: 'string',   required: true },
      { name: 'title',    type: 'string',   required: false },
      { name: 'text',     type: 'string',   required: true,  note: 'Isi pesan utama' },
      { name: 'footer',   type: 'string',   required: false },
      { name: 'button',   type: 'string',   required: false, note: 'Teks tombol' },
      { name: 'sections', type: 'array',    required: true,  note: 'Array section dengan rows' },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "text": "Pilih menu",\n  "button": "Lihat",\n  "sections": [{\n    "title": "Menu",\n    "rows": [{"rowId":"1","title":"Item A"}]\n  }]\n}',
  },
  {
    method: 'POST',
    path: '/send-button-message',
    description: 'Kirim pesan dengan tombol cepat',
    fields: [
      { name: 'phone',   type: 'string', required: true },
      { name: 'text',    type: 'string', required: true },
      { name: 'footer',  type: 'string', required: false },
      { name: 'buttons', type: 'array',  required: true, note: '[{buttonId, buttonText:{displayText}}]' },
      { name: 'secret_device', type: 'string', required: false },
    ],
    example: '{\n  "phone": "628123456789",\n  "text": "Konfirmasi?",\n  "buttons": [\n    {"buttonId":"1","buttonText":{"displayText":"Ya"}},\n    {"buttonId":"2","buttonText":{"displayText":"Tidak"}}\n  ]\n}',
  },
  {
    method: 'GET',
    path: '/check-number',
    description: 'Cek apakah nomor terdaftar di WhatsApp',
    fields: [
      { name: 'phone',         type: 'string (query)', required: true,  note: 'Satu atau beberapa nomor, pisahkan koma' },
      { name: 'secret_device', type: 'string (query)', required: false },
    ],
    example: 'GET /check-number?phone=628123456789,628987654321',
  },
  {
    method: 'GET',
    path: '/device',
    description: 'Info semua device yang dimiliki',
    fields: [],
    example: 'GET /device',
  },
]

// ─── Profile schema ────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name:     z.string().min(2, 'Nama minimal 2 karakter'),
  password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
})
type ProfileForm = z.infer<typeof profileSchema>

// ─── Compact endpoint card ─────────────────────────────────────────────────────
function EndpointCard({ ep, apiKey }: { ep: CompatEndpoint; apiKey: string }) {
  const [open, setOpen] = useState(false)
  const fullUrl = `${COMPAT_BASE}${ep.path}`

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <span className={cn(
          'text-[11px] font-bold px-2 py-0.5 rounded-md font-mono flex-shrink-0',
          ep.method === 'POST'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
        )}>
          {ep.method}
        </span>
        <code className="text-sm text-foreground flex-1 font-mono">{ep.path}</code>
        <span className="text-xs text-muted-foreground hidden sm:block">{ep.description}</span>
        <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">
          {/* Full URL */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL</p>
            <div className="flex items-center gap-2 p-2 bg-background rounded-lg border text-xs font-mono">
              <span className="flex-1 truncate">{fullUrl}</span>
              <CopyButton text={fullUrl} />
            </div>
          </div>

          {/* Auth header */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Header Autentikasi</p>
            <div className="flex items-center gap-2 p-2 bg-background rounded-lg border text-xs font-mono">
              <span className="text-muted-foreground">Authorization:</span>
              <span className="flex-1 truncate">{apiKey || '<API_KEY_ANDA>'}</span>
              {apiKey && <CopyButton text={apiKey} />}
            </div>
          </div>

          {/* Fields */}
          {ep.fields.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parameter</p>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-left px-3 py-2 font-semibold">Field</th>
                      <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Tipe</th>
                      <th className="text-left px-3 py-2 font-semibold">Wajib</th>
                      <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.fields.map((f) => (
                      <tr key={f.name} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-foreground">{f.name}</td>
                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{f.type}</td>
                        <td className="px-3 py-2">
                          {f.required
                            ? <Badge className="text-[10px] py-0 bg-red-100 text-red-700">Ya</Badge>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{f.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example */}
          {ep.example && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contoh</p>
              <div className="relative group">
                <pre className="p-3 bg-background border rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                  {ep.example}
                </pre>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={ep.example} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function AccountPage() {
  const { user, updateUser } = useAuthStore()
  const [showKey, setShowKey]   = useState(false)
  const [regenOpen, setRegenOpen] = useState(false)

  // Rate limiting for upgrade
  const { isLimited: isUpgradeLimited, secondsRemaining: upgradeSecondsRemaining } = useRateLimit('/account/upgrade', 3600)

  const { data: meData } = useQuery({
    queryKey: accountQueryKeys.me,
    queryFn:  () => accountApi.getMe(),
    select:   (r) => r.data.data,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', password: '' },
  })

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (res) => {
      updateUser(res.data.data.user)
      toast.success('Profil berhasil diperbarui')
    },
    onError: () => toast.error('Gagal memperbarui profil'),
  })

  const queryClient = useQueryClient()

  const { mutate: regenerate, isPending: regenerating } = useMutation({
    mutationFn: accountApi.regenerateApiKey,
    onSuccess: (res) => {
      updateUser({ apiKey: res.data.data.apiKey })
      toast.success('API Key berhasil diperbarui')
    },
    onError: () => toast.error('Gagal memperbarui API Key'),
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: accountQueryKeys.invoices,
    queryFn:  accountApi.getInvoices,
    select:   (r) => r.data.data?.invoices ?? [],
  })

  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null)
  const { mutate: upgradePlan, isPending: upgrading } = useMutation({
    mutationFn: (p: Plan) => accountApi.upgradePlan(p),
    onSuccess: (res, planArg) => {
      const inv = res.data.data?.invoice
      const snapToken = res.data.data?.snapToken
      if (inv?.status === 'PAID') {
        updateUser({ plan: planArg })
        toast.success(`Plan diupgrade ke ${planArg}`)
      } else if (snapToken || inv?.paymentUrl) {
        toast.success('Invoice dibuat. Selesaikan pembayaran.')
        void openPayment(snapToken, inv?.paymentUrl)
      } else {
        toast.success(res.data.data?.message ?? 'Invoice dibuat')
      }
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.invoices })
      setUpgradeTarget(null)
    },
    onError: (err: any) => {
      // Handle rate limit
      if (isAxiosError429(err)) {
        const retryAfter = parseInt((err.response?.headers['retry-after'] as string) || '3600')
        storeRateLimitToLocalStorage('/account/upgrade', retryAfter)
        toast.error(
          `Terlalu banyak percobaan upgrade. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
          { duration: 6000 }
        )
        return
      }
      toast.error('Gagal membuat invoice upgrade')
    },
  })

  const plan = user?.plan ?? 'FREE'

  const { data: plans } = useQuery({
    queryKey: planQueryKeys.all,
    queryFn:  () => planApi.getAll(),
    select:   (r) => r.data.data?.plans ?? [],
    staleTime: 5 * 60_000, // Cache untuk 5 menit - plans jarang berubah
    refetchOnWindowFocus: false,
  })

  const currentPlanData = plans?.find((p) => p.plan === plan)

  const limits = {
    devices:           currentPlanData?.limits.maxDevices ?? 0,
    messages:          currentPlanData?.limits.monthlyMessages ?? 0,
    contacts:          currentPlanData?.limits.maxContacts ?? 0,
    broadcasts:        currentPlanData?.limits.maxBroadcasts ?? 0,
    templates:         currentPlanData?.limits.maxTemplates ?? 0,
    retentionDays:     currentPlanData?.limits.messageRetentionDays ?? 0,
    aiMonthlyReplies:  currentPlanData?.limits.aiMonthlyReplies ?? 0,
    canAutoReply:      currentPlanData?.features.autoReply ?? false,
    canDeviceRotation: currentPlanData?.features.deviceRotation ?? false,
    canWebhook:        currentPlanData?.features.webhook ?? false,
    canCsvImport:      currentPlanData?.features.csvImport ?? false,
    canIpWhitelist:    currentPlanData?.features.ipWhitelist ?? false,
    canAiReply:        currentPlanData?.features.aiReply ?? false,
    hasWatermark:      currentPlanData?.watermark ?? false,
  }

  const { data: aiUsage } = useQuery({
    queryKey: accountQueryKeys.aiUsage,
    queryFn:  accountApi.getAiUsage,
    select:   (r) => r.data.data,
    enabled:  limits.canAiReply,
  })

  const { data: contactsTotal } = useQuery({
    queryKey: ['contacts', 'count'],
    queryFn:  () => contactApi.getAll({ limit: 1 }),
    select:   (r) => r.data.meta?.total ?? 0,
  })

  const { data: broadcastsTotal } = useQuery({
    queryKey: ['broadcasts', 'count'],
    queryFn:  () => broadcastApi.getAll({ limit: 1 }),
    select:   (r) => r.data.meta?.total ?? 0,
  })

  const { data: templatesTotal } = useQuery({
    queryKey: ['templates', 'count'],
    queryFn:  () => templateApi.list({ limit: 1 }),
    select:   (r) => r.data.data?.total ?? 0,
  })

  const msgUsed = meData?.usage?.messagesSentThisMonth ?? 0
  const devUsed = meData?.usage?.totalDevices ?? 0
  const msgPct  = limits.messages > 0 ? Math.min((msgUsed / limits.messages) * 100, 100) : 0
  const apiKey  = user?.apiKey ?? ''

  const fmtLimit = (n: number) => (n === -1 ? '∞' : n.toLocaleString('id-ID'))
  const pctOf = (used: number, limit: number) => (limit > 0 ? Math.min((used / limit) * 100, 100) : 0)

  return (
    <div className="max-w-2xl">
      <PageHeader title="Akun" description="Kelola profil, API Key, dan integrasi" />

      <Tabs defaultValue="profil" className="mt-2">
        <TabsList className="mb-5">
          <TabsTrigger value="profil">
            <Icon icon="mdi:account-circle-outline" className="mr-1.5" />Profil
          </TabsTrigger>
          <TabsTrigger value="keamanan">
            <Icon icon="mdi:shield-lock-outline" className="mr-1.5" />Keamanan
          </TabsTrigger>
          <TabsTrigger value="api">
            <Icon icon="mdi:key-outline" className="mr-1.5" />API Key
          </TabsTrigger>
          <TabsTrigger value="integrasi">
            <Icon icon="mdi:connection" className="mr-1.5" />Integrasi
          </TabsTrigger>
          <TabsTrigger value="plan">
            <Icon icon="mdi:star-circle-outline" className="mr-1.5" />Plan
          </TabsTrigger>
        </TabsList>

        {/* ── Profil ─────────────────────────────────────────────────────────── */}
        <TabsContent value="profil" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:account-circle" className="text-wa-600" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => updateProfile({ name: d.name, password: d.password || undefined }))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama</Label>
                  <Input {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email tidak bisa diubah</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Password Baru <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                  <Input type="password" placeholder="Kosongkan jika tidak ingin mengubah" {...register('password')} />
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={isPending}>
                  {isPending
                    ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                    : <><Icon icon="mdi:content-save" className="mr-2" />Simpan Perubahan</>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Keamanan ───────────────────────────────────────────────────────── */}
        <TabsContent value="keamanan" className="space-y-5">
          <TwoFactorCard totpEnabled={meData?.user?.totpEnabled ?? false} />
        </TabsContent>

        {/* ── API Key ────────────────────────────────────────────────────────── */}
        <TabsContent value="api" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:key" className="text-wa-600" />
                API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <code className="flex-1 font-mono text-sm truncate">
                  {showKey ? (apiKey || '—') : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button variant="ghost" size="icon" onClick={() => setShowKey((v) => !v)} className="flex-shrink-0">
                  <Icon icon={showKey ? 'mdi:eye-off' : 'mdi:eye'} />
                </Button>
                {apiKey && <CopyButton text={apiKey} />}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                <Icon icon="mdi:alert" className="flex-shrink-0 mt-0.5" />
                <span>Jangan bagikan API Key kepada siapapun. API Key memberikan akses penuh ke akun Anda.</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cara Penggunaan (REST API)</p>
                <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
                  <p className="text-xs text-muted-foreground">Header autentikasi untuk semua request:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono flex-1 break-all">
                      Authorization: Bearer {showKey ? apiKey : '••••••••'}
                    </code>
                    {apiKey && <CopyButton text={`Authorization: Bearer ${apiKey}`} />}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => setRegenOpen(true)}
              >
                <Icon icon="mdi:refresh" className="mr-2" />Generate API Key Baru
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrasi ──────────────────────────────────────────────────────── */}
        <TabsContent value="integrasi" className="space-y-5">
          {/* Wablas compat info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:connection" className="text-wa-600" />
                Blastify Compatible API
                <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ml-1">n8n ready</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Endpoint ini kompatibel dengan format Wablas, sehingga workflow n8n yang sudah menggunakan Wablas HTTP node bisa langsung dipindahkan ke Blastify dengan mengubah base URL dan token.
              </p>

              {/* Base URL */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base URL</p>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border font-mono text-sm">
                  <span className="flex-1 break-all">{COMPAT_BASE}</span>
                  <CopyButton text={COMPAT_BASE} />
                </div>
              </div>

              {/* Auth */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Autentikasi</p>
                <div className="p-3 bg-muted/50 rounded-lg border space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge className="text-[10px] mt-0.5 flex-shrink-0 bg-gray-100 text-gray-700">Header</Badge>
                    <code className="font-mono text-xs break-all flex-1">Authorization: {showKey ? apiKey : '<API_KEY_ANDA>'}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tidak perlu prefix "Bearer" — kirim API Key langsung. Prefix Bearer juga didukung.
                  </p>
                </div>
              </div>

              <Separator />

              {/* n8n guide */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cara Pakai di n8n</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Buka node HTTP Request di workflow n8n Anda',
                    `Ganti URL ke: ${COMPAT_BASE}/send-message (atau endpoint lain)`,
                    'Di bagian Authentication, pilih "Header Auth"',
                    `Isi Name: Authorization | Value: ${showKey ? apiKey : '<API_KEY_ANDA>'}`,
                    'Kirim body JSON seperti contoh di tiap endpoint di bawah',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-wa-600/10 text-wa-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              Endpoint ({COMPAT_ENDPOINTS.length})
            </p>
            {COMPAT_ENDPOINTS.map((ep) => (
              <EndpointCard key={ep.path} ep={ep} apiKey={showKey ? apiKey : ''} />
            ))}
          </div>

          {/* Response format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon icon="mdi:code-json" className="text-wa-600" />
                Format Response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-600">Sukses</p>
                  <pre className="p-3 bg-muted/50 rounded-lg border text-xs font-mono leading-relaxed">
{`{
  "status": true,
  "message": {
    "id": "msg_xxx",
    "to": "628xxx",
    "status": "QUEUED"
  }
}`}
                  </pre>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-red-500">Error</p>
                  <pre className="p-3 bg-muted/50 rounded-lg border text-xs font-mono leading-relaxed">
{`{
  "status": false,
  "message": "No connected device found"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Plan ───────────────────────────────────────────────────────────── */}
        <TabsContent value="plan" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:star-circle" className="text-wa-600" />
                Informasi Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Plan saat ini:</span>
                <span className={cn('text-sm font-bold px-2.5 py-1 rounded-lg', PLAN_COLORS[plan])}>
                  {plan}
                </span>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Pesan bulan ini</span>
                    <span className="font-medium">
                      {msgUsed.toLocaleString('id-ID')} / {fmtLimit(limits.messages)}
                    </span>
                  </div>
                  <Progress value={msgPct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{msgPct.toFixed(1)}% dari kuota bulanan</p>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Device</span>
                  <span className="font-medium">{devUsed} / {fmtLimit(limits.devices)}</span>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Kontak</span>
                    <span className="font-medium">
                      {(contactsTotal ?? 0).toLocaleString('id-ID')} / {fmtLimit(limits.contacts)}
                    </span>
                  </div>
                  <Progress value={pctOf(contactsTotal ?? 0, limits.contacts)} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Broadcast</span>
                    <span className="font-medium">
                      {(broadcastsTotal ?? 0).toLocaleString('id-ID')} / {fmtLimit(limits.broadcasts)}
                    </span>
                  </div>
                  <Progress value={pctOf(broadcastsTotal ?? 0, limits.broadcasts)} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Template</span>
                    <span className="font-medium">
                      {(templatesTotal ?? 0).toLocaleString('id-ID')} / {fmtLimit(limits.templates)}
                    </span>
                  </div>
                  <Progress value={pctOf(templatesTotal ?? 0, limits.templates)} className="h-2" />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retensi Pesan</span>
                  <span className="font-medium">{limits.retentionDays} hari</span>
                </div>

                {limits.canAiReply && aiUsage && (
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon icon="mdi:robot-outline" className="text-wa-600" />
                        Balasan AI bulan ini
                      </span>
                      <span className="font-medium">
                        {aiUsage.used.toLocaleString('id-ID')} / {aiUsage.limit === -1 ? '∞' : aiUsage.limit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {aiUsage.limit > 0 && (
                      <>
                        <Progress value={Math.min((aiUsage.used / aiUsage.limit) * 100, 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Sisa {aiUsage.remaining.toLocaleString('id-ID')} balasan AI ({aiUsage.month})
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Feature matrix */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fitur Tersedia</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {([
                    { label: 'Auto-Reply',       ok: limits.canAutoReply },
                    { label: 'Rotasi Device',    ok: limits.canDeviceRotation },
                    { label: 'Webhook',          ok: limits.canWebhook },
                    { label: 'Import CSV',       ok: limits.canCsvImport },
                    { label: 'IP Whitelist',     ok: limits.canIpWhitelist },
                    { label: 'Balasan AI (LLM)', ok: limits.canAiReply },
                    { label: 'Tanpa Watermark',  ok: !limits.hasWatermark },
                  ] as { label: string; ok: boolean }[]).map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <Icon
                        icon={f.ok ? 'mdi:check-circle' : 'mdi:close-circle'}
                        className={f.ok ? 'text-emerald-500' : 'text-muted-foreground'}
                      />
                      <span className={f.ok ? '' : 'text-muted-foreground'}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {plan !== 'ULTRA' && (
                <div className="space-y-3">
                  <Separator />
                  {isUpgradeLimited && (
                    <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
                      <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
                      <div>
                        <div className="font-semibold mb-1">Terlalu banyak percobaan upgrade</div>
                        <div>Silakan tunggu {upgradeSecondsRemaining > 60 ? `${Math.floor(upgradeSecondsRemaining / 60)}m ${upgradeSecondsRemaining % 60}s` : `${upgradeSecondsRemaining}s`} sebelum mencoba lagi.</div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upgrade Plan</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['LITE', 'REGULAR', 'MASTER', 'ULTRA'] as Plan[])
                      .filter((p) => {
                        const order: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']
                        return order.indexOf(p) > order.indexOf(plan as Plan)
                      })
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setUpgradeTarget(p)}
                          disabled={isUpgradeLimited || upgrading}
                          className={cn(
                            'text-left p-3 rounded-lg border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                            !isUpgradeLimited && !upgrading ? 'hover:border-wa-600 hover:bg-wa-600/5' : ''
                          )}
                        >
                          <p className={cn('text-xs font-bold px-1.5 py-0.5 rounded w-fit mb-1', PLAN_COLORS[p])}>{p}</p>
                          <p className="text-xs text-muted-foreground">
                            {plans?.find((pl) => pl.plan === p)?.priceLabel ?? '—'}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Riwayat Invoice ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:receipt-text-outline" className="text-wa-600" />
                Riwayat Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="mdi:loading" className="animate-spin text-xl text-muted-foreground" />
                </div>
              ) : !invoices?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada invoice.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div className="flex items-center gap-3">
                        <Badge className={cn('text-xs py-0', INVOICE_STATUS_COLORS[inv.status] ?? '')}>{inv.status}</Badge>
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', PLAN_COLORS[inv.plan])}>{inv.plan}</span>
                        <span className="text-muted-foreground text-xs">{formatDate(inv.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {inv.amount === 0 ? 'Gratis' : `Rp ${(inv.amount / 100).toLocaleString('id-ID')}`}
                        </span>
                        {inv.paymentUrl && inv.status === 'PENDING' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(inv.paymentUrl!, '_blank')}>
                            <Icon icon="mdi:credit-card-outline" className="mr-1" />Bayar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade confirmation */}
      <ConfirmDialog
        open={!!upgradeTarget}
        onOpenChange={(v) => { if (!v) setUpgradeTarget(null) }}
        title={`Upgrade ke ${upgradeTarget}?`}
        description={
          upgradeTarget
            ? (plans?.find((pl) => pl.plan === upgradeTarget)?.price ?? 0) === 0
              ? `Plan akan langsung diubah ke ${upgradeTarget} tanpa biaya.`
              : `Invoice sebesar ${plans?.find((pl) => pl.plan === upgradeTarget)?.priceLabel ?? ''} akan dibuat. Anda akan diarahkan ke halaman pembayaran.`
            : ''
        }
        confirmLabel={(plans?.find((pl) => pl.plan === upgradeTarget)?.price ?? 0) === 0 ? 'Upgrade Gratis' : 'Buat Invoice'}
        loading={upgrading}
        onConfirm={() => { if (upgradeTarget) upgradePlan(upgradeTarget) }}
      />

      <ConfirmDialog
        open={regenOpen}
        onOpenChange={setRegenOpen}
        title="Generate API Key Baru?"
        description="API Key lama akan tidak berlaku seketika. Semua integrasi yang menggunakan key lama harus diperbarui."
        confirmLabel="Generate Baru"
        onConfirm={() => { regenerate(); setRegenOpen(false) }}
        loading={regenerating}
        destructive
      />
    </div>
  )
}
