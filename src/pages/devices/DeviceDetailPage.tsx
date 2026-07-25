import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { contactApi, contactQueryKeys } from '@/api/contact.api'
import { messageApi, messageQueryKeys } from '@/api/message.api'
import { DeviceStatusBadge } from '@/components/device/DeviceStatusBadge'
import { QRCodeModal } from '@/components/device/QRCodeModal'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate, formatPhone, truncate } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DeviceAgent, AgentRole, WaGroup } from '@/types'

// ─── Settings form ─────────────────────────────────────────────────────────────
const settingsSchema = z.object({
  name:                  z.string().min(1).max(100),
  minDelay:              z.coerce.number().int().min(0).max(60000),
  maxDelay:              z.coerce.number().int().min(0).max(60000),
  workingHoursStart:     z.coerce.number().int().min(0).max(23).nullable(),
  workingHoursEnd:       z.coerce.number().int().min(0).max(23).nullable(),
  workingDays:           z.array(z.number().int().min(0).max(6)),
  badWordsEnabled:       z.boolean(),
  badWordsRaw:           z.string(),
  autoSaveContacts:      z.boolean(),
  typingIndicator:       z.boolean(),
  readReceiptSimulation: z.boolean(),
  warmupEnabled:         z.boolean(),
})
type SettingsForm = z.infer<typeof settingsSchema>

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// ─── Agent form ────────────────────────────────────────────────────────────────
const agentSchema = z.object({
  email: z.string().email('Email tidak valid'),
  role:  z.enum(['OWNER', 'AGENT', 'VIEWER'] as const),
})
type AgentForm = z.infer<typeof agentSchema>

const ROLE_LABELS: Record<AgentRole, string> = {
  OWNER:  'Owner',
  AGENT:  'Agent',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<AgentRole, string> = {
  OWNER:  'bg-purple-100 text-purple-700',
  AGENT:  'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [qrOpen, setQrOpen]               = useState(false)
  const [agentOpen, setAgentOpen]         = useState(false)
  const [editAgent, setEditAgent]         = useState<DeviceAgent | null>(null)
  const [deleteAgent, setDeleteAgent]     = useState<DeviceAgent | null>(null)

  // WA Group state
  const [groupSheet, setGroupSheet]       = useState<WaGroup | null>(null)
  const [importOpen, setImportOpen]       = useState(false)
  const [importGroupId, setImportGroupId] = useState<string>('')

  // ─── Queries ──────────────────────────────────────────────────────────────────
  const { data: device, isLoading } = useQuery({
    queryKey: deviceQueryKeys.detail(id!),
    queryFn:  () => deviceApi.getById(id!),
    select:   (r) => r.data.data?.device,
    enabled:  !!id,
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: messageQueryKeys.all({ deviceId: id }),
    queryFn:  () => messageApi.getAll({ deviceId: id, limit: 20 }),
    select:   (r) => r.data.data?.messages ?? [],
    enabled:  !!id,
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: deviceQueryKeys.agents(id!),
    queryFn:  () => deviceApi.getAgents(id!),
    select:   (r) => r.data.data?.agents ?? [],
    enabled:  !!id,
  })

  const { data: waGroups, isLoading: waGroupsLoading, error: waGroupsError, refetch: refetchGroups } = useQuery({
    queryKey: deviceQueryKeys.waGroups(id!),
    queryFn:  () => deviceApi.getWaGroups(id!),
    select:   (r) => r.data.data?.groups ?? [],
    enabled:  false, // manual trigger — only fetch when tab is opened
  })

  const { data: groupMembers, isLoading: membersLoading } = useQuery({
    queryKey: deviceQueryKeys.waMembers(id!, groupSheet?.jid ?? ''),
    queryFn:  () => deviceApi.getWaGroupMembers(id!, groupSheet!.jid),
    select:   (r) => r.data.data,
    enabled:  !!groupSheet && !!id,
  })

  const { data: contactGroups } = useQuery({
    queryKey: contactQueryKeys.groups,
    queryFn:  () => contactApi.getGroups(),
    select:   (r) => r.data.data?.groups ?? [],
  })

  // ─── Settings form ────────────────────────────────────────────────────────────
  const {
    register: regS, handleSubmit: hsS, control: ctrlS, watch: watchS,
    reset: resetS, formState: { errors: errS, isDirty: settingsDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsForm>,
    values: device ? {
      name:                  device.name,
      minDelay:              device.minDelay ?? 500,
      maxDelay:              device.maxDelay ?? 2000,
      workingHoursStart:     device.workingHoursStart ?? null,
      workingHoursEnd:       device.workingHoursEnd ?? null,
      workingDays:           device.workingDays ?? [],
      badWordsEnabled:       device.badWordsEnabled ?? false,
      badWordsRaw:           (device.badWords ?? []).join(', '),
      autoSaveContacts:      device.autoSaveContacts ?? false,
      typingIndicator:       device.typingIndicator ?? false,
      readReceiptSimulation: device.readReceiptSimulation ?? false,
      warmupEnabled:         device.warmupEnabled ?? false,
    } : undefined,
  })

  const badWordsEnabledValue = watchS('badWordsEnabled')

  const { mutate: saveSettings, isPending: savingSettings } = useMutation({
    mutationFn: (d: SettingsForm) =>
      deviceApi.updateSettings(id!, {
        name:              d.name,
        minDelay:          d.minDelay,
        maxDelay:          d.maxDelay,
        workingHoursStart: d.workingHoursStart,
        workingHoursEnd:   d.workingHoursEnd,
        workingDays:       d.workingDays,
        badWordsEnabled:   d.badWordsEnabled,
        badWords:              d.badWordsRaw.split(',').map(w => w.trim()).filter(Boolean),
        autoSaveContacts:      d.autoSaveContacts,
        typingIndicator:       d.typingIndicator,
        readReceiptSimulation: d.readReceiptSimulation,
        warmupEnabled:         d.warmupEnabled,
      }),
    onSuccess: () => {
      toast.success('Pengaturan disimpan')
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.detail(id!) })
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
      resetS()
    },
    onError: () => toast.error('Gagal menyimpan pengaturan'),
  })

  // ─── Agent mutations ──────────────────────────────────────────────────────────
  const {
    register: regA, handleSubmit: hsA, reset: resetA, control: ctrlA,
    setValue: setVA, formState: { errors: errA },
  } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
    defaultValues: { role: 'AGENT' },
  })

  const { mutate: saveAgent, isPending: savingAgent } = useMutation({
    mutationFn: (d: AgentForm) =>
      editAgent
        ? deviceApi.updateAgent(id!, editAgent.id, { role: d.role })
        : deviceApi.addAgent(id!, { email: d.email, role: d.role }),
    onSuccess: () => {
      toast.success(editAgent ? 'Role diperbarui' : 'Agent ditambahkan')
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.agents(id!) })
      setAgentOpen(false); setEditAgent(null); resetA()
    },
    onError: (err: unknown) => {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      if (code === 'USER_NOT_FOUND') toast.error('Pengguna tidak ditemukan')
      else if (code === 'AGENT_ALREADY_EXISTS') toast.error('Pengguna sudah menjadi agent')
      else toast.error('Gagal menyimpan agent')
    },
  })

  const { mutate: removeAgent, isPending: removingAgent } = useMutation({
    mutationFn: (agentId: string) => deviceApi.deleteAgent(id!, agentId),
    onSuccess: () => {
      toast.success('Agent dihapus')
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.agents(id!) })
    },
    onError: () => toast.error('Gagal menghapus agent'),
  })

  // ─── WA Group import ──────────────────────────────────────────────────────────
  const { mutate: importGroup, isPending: importing } = useMutation({
    mutationFn: () => deviceApi.importWaGroupContacts(
      id!, groupSheet!.jid, importGroupId || undefined
    ),
    onSuccess: (res) => {
      const { created, skipped } = res.data.data
      toast.success(`Import selesai: ${created} kontak baru, ${skipped} dilewati`)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setImportOpen(false); setImportGroupId('')
    },
    onError: () => toast.error('Gagal import kontak'),
  })

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const openAddAgent = () => { setEditAgent(null); resetA(); setAgentOpen(true) }
  const openEditAgent = (a: DeviceAgent) => {
    setEditAgent(a); setVA('email', a.user.email); setVA('role', a.role)
    setAgentOpen(true)
  }

  const toggleDay = (day: number, current: number[]) =>
    current.includes(day) ? current.filter(d => d !== day) : [...current, day]

  if (isLoading) return <PageLoader />
  if (!device) return (
    <EmptyState title="Device tidak ditemukan" action={
      <Button onClick={() => navigate('/devices')}>Kembali ke Devices</Button>
    } />
  )

  const canConnect = ['DISCONNECTED', 'LOGGED_OUT', 'QR_READY'].includes(device.status)
  const isConnected = device.status === 'CONNECTED'

  return (
    <div>
      <PageHeader
        title={String(device.name)}
        description={device.phone ? formatPhone(device.phone) : 'Belum terhubung'}
        action={
          <div className="flex items-center gap-2">
            <DeviceStatusBadge status={device.status} />
            {canConnect && (
              <Button size="sm" className="bg-wa-600 hover:bg-wa-700" onClick={() => setQrOpen(true)}>
                <Icon icon="mdi:qrcode" className="mr-2" />Hubungkan
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/devices')}>
              <Icon icon="mdi:arrow-left" className="mr-2" />Kembali
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="info">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="info">
            <Icon icon="mdi:information-outline" className="mr-1.5 text-base" />Info
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Icon icon="mdi:cog-outline" className="mr-1.5 text-base" />Pengaturan
          </TabsTrigger>
          <TabsTrigger value="wa-groups" onClick={() => { if (!waGroups) refetchGroups() }}>
            <Icon icon="mdi:account-group-outline" className="mr-1.5 text-base" />Grup WA
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Icon icon="mdi:account-multiple-outline" className="mr-1.5 text-base" />Agent
            {agents && agents.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs py-0">{agents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Icon icon="mdi:message-text-outline" className="mr-1.5 text-base" />Pesan
          </TabsTrigger>
        </TabsList>

        {/* ── Info ───────────────────────────────────────────────────────────── */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Informasi Device</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {([
                  { label: 'ID', value: device.id },
                  { label: 'Nama', value: device.name },
                  { label: 'Nomor WA', value: device.phone ? formatPhone(device.phone) : '-' },
                  { label: 'Status', value: <DeviceStatusBadge status={device.status} /> },
                  { label: 'Dibuat', value: formatDate(device.createdAt) },
                  { label: 'Diperbarui', value: formatDate(device.updatedAt) },
                ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Ringkasan Pengaturan</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {([
                  { label: 'Delay pengiriman', value: `${device.minDelay ?? 500}–${device.maxDelay ?? 2000} ms` },
                  {
                    label: 'Jam kerja',
                    value: device.workingHoursStart != null && device.workingHoursEnd != null
                      ? `${String(device.workingHoursStart).padStart(2, '0')}:00 – ${String(device.workingHoursEnd).padStart(2, '0')}:00`
                      : 'Tidak dibatasi',
                  },
                  {
                    label: 'Hari aktif',
                    value: device.workingDays?.length
                      ? device.workingDays.map(d => DAY_LABELS[d]).join(', ')
                      : 'Semua hari',
                  },
                  {
                    label: 'Filter kata',
                    value: device.badWordsEnabled
                      ? `Aktif (${device.badWords?.length ?? 0} kata)`
                      : 'Nonaktif',
                  },
                  {
                    label: 'Simpan kontak otomatis',
                    value: device.autoSaveContacts ? 'Aktif' : 'Nonaktif',
                  },
                  {
                    label: 'Indikator mengetik',
                    value: device.typingIndicator ? 'Aktif' : 'Nonaktif',
                  },
                  {
                    label: 'Simulasi baca pesan',
                    value: device.readReceiptSimulation ? 'Aktif' : 'Nonaktif',
                  },
                  {
                    label: 'Warm-up',
                    value: device.warmupEnabled
                      ? (device.warmup?.isWarmingUp
                          ? `Hari ${device.warmup.day}/14 · ${device.warmup.maxMessagesPerDay}/hari`
                          : 'Menunggu koneksi')
                      : 'Nonaktif',
                  },
                ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Settings ───────────────────────────────────────────────────────── */}
        <TabsContent value="settings">
          <form onSubmit={hsS((d) => saveSettings(d))} className="space-y-5 max-w-2xl">
            {/* Name */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Nama Device</CardTitle></CardHeader>
              <CardContent>
                <Input {...regS('name')} />
                {errS.name && <p className="text-xs text-red-500 mt-1">{errS.name.message}</p>}
              </CardContent>
            </Card>

            {/* Random delay */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:timer-sand" className="text-wa-600" />
                  Delay Anti-Ban
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Jeda acak antar pengiriman pesan untuk menghindari deteksi spam.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Delay Minimum (ms)</Label>
                    <Input type="number" min={0} max={60000} step={100} {...regS('minDelay')} />
                    {errS.minDelay && <p className="text-xs text-red-500">{errS.minDelay.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delay Maksimum (ms)</Label>
                    <Input type="number" min={0} max={60000} step={100} {...regS('maxDelay')} />
                    {errS.maxDelay && <p className="text-xs text-red-500">{errS.maxDelay.message}</p>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Disarankan 500–5000 ms. 1000 ms = 1 detik.</p>
              </CardContent>
            </Card>

            {/* Working hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:clock-outline" className="text-wa-600" />
                  Jam Operasional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Pesan hanya dikirim pada jam dan hari yang ditentukan.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Jam Mulai (0–23)</Label>
                    <Input type="number" min={0} max={23} placeholder="0" {...regS('workingHoursStart')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jam Selesai (0–23)</Label>
                    <Input type="number" min={0} max={23} placeholder="23" {...regS('workingHoursEnd')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hari Aktif</Label>
                  <Controller
                    control={ctrlS}
                    name="workingDays"
                    render={({ field }) => (
                      <div className="flex gap-2 flex-wrap">
                        {DAY_LABELS.map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => field.onChange(toggleDay(idx, field.value))}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                              field.value.includes(idx)
                                ? 'bg-wa-600 text-white border-wa-600'
                                : 'bg-background text-muted-foreground border-border hover:border-wa-600 hover:text-wa-600'
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">Kosongkan semua untuk tidak membatasi hari.</p>
                </div>
              </CardContent>
            </Card>

            {/* Auto-save contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:contacts" className="text-wa-600" />
                  Simpan Kontak Otomatis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Simpan pengirim sebagai kontak</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nomor yang mengirim pesan ke device ini otomatis disimpan ke daftar kontak
                    </p>
                  </div>
                  <Controller
                    control={ctrlS}
                    name="autoSaveContacts"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Human behavior simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:robot-happy-outline" className="text-wa-600" />
                  Simulasi Perilaku Manusia (Anti-Ban)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Indikator Mengetik</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tampilkan status "sedang mengetik..." sebelum pesan dikirim
                    </p>
                  </div>
                  <Controller
                    control={ctrlS}
                    name="typingIndicator"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Simulasi Baca Pesan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Otomatis menandai pesan masuk sebagai "sudah dibaca" dengan jeda acak
                    </p>
                  </div>
                  <Controller
                    control={ctrlS}
                    name="readReceiptSimulation"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Warm-up */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:fire" className="text-wa-600" />
                  Warm-up Device (Anti-Ban)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Aktifkan Warm-up</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Batasi volume pengiriman harian secara bertahap selama ~14 hari agar nomor tidak cepat di-ban
                    </p>
                  </div>
                  <Controller
                    control={ctrlS}
                    name="warmupEnabled"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                {device.warmupEnabled && device.warmup && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs">
                    <Icon icon="mdi:fire" className="text-amber-600 flex-shrink-0" />
                    <span>
                      {device.warmup.isWarmingUp ? (
                        <>Warm-up hari <strong>{device.warmup.day}/14</strong> · Limit <strong>{device.warmup.maxMessagesPerDay} pesan/hari</strong> · Delay {device.warmup.delayMultiplier}x lebih lambat</>
                      ) : (
                        <>Warm-up akan mulai saat device terhubung ke WhatsApp</>
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bad words filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon icon="mdi:filter-outline" className="text-wa-600" />
                  Filter Kata Terlarang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Aktifkan Filter</p>
                    <p className="text-xs text-muted-foreground">Pesan mengandung kata terlarang akan diblokir</p>
                  </div>
                  <Controller
                    control={ctrlS}
                    name="badWordsEnabled"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                {badWordsEnabledValue && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label>Daftar Kata Terlarang</Label>
                      <Input placeholder="kata1, kata2, kata3" {...regS('badWordsRaw')} />
                      <p className="text-xs text-muted-foreground">Pisahkan dengan koma. Tidak case-sensitive.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-wa-600 hover:bg-wa-700"
                disabled={savingSettings || !settingsDirty}
              >
                {savingSettings ? (
                  <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                ) : (
                  <><Icon icon="mdi:content-save-outline" className="mr-2" />Simpan Pengaturan</>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── WA Groups ──────────────────────────────────────────────────────── */}
        <TabsContent value="wa-groups">
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Daftar grup WhatsApp yang diikuti oleh device ini. Klik grup untuk melihat anggota dan import sebagai kontak.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGroups()}
                disabled={waGroupsLoading}
              >
                <Icon icon={waGroupsLoading ? 'mdi:loading' : 'mdi:refresh'} className={cn('mr-2', waGroupsLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>

            {!isConnected && !waGroups && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <Icon icon="mdi:wifi-off" className="text-2xl text-amber-600" />
                </div>
                <p className="font-semibold text-sm">Device tidak terhubung</p>
                <p className="text-xs text-muted-foreground">Hubungkan device terlebih dahulu untuk melihat grup WhatsApp.</p>
              </div>
            )}

            {waGroupsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            )}

            {waGroupsError && !waGroupsLoading && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <Icon icon="mdi:alert-circle-outline" className="text-2xl text-red-500" />
                </div>
                <p className="font-semibold text-sm">Gagal memuat grup</p>
                <p className="text-xs text-muted-foreground">Pastikan device terhubung dan sesi WhatsApp aktif.</p>
                <Button variant="outline" size="sm" onClick={() => refetchGroups()}>
                  <Icon icon="mdi:refresh" className="mr-2" />Coba lagi
                </Button>
              </div>
            )}

            {waGroups && !waGroupsLoading && (
              waGroups.length === 0 ? (
                <EmptyState
                  icon="mdi:account-group-outline"
                  title="Tidak ada grup"
                  description="Device ini tidak tergabung dalam grup WhatsApp manapun."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {waGroups.map((g) => (
                    <button
                      key={g.jid}
                      onClick={() => setGroupSheet(g)}
                      className="text-left p-4 rounded-xl border border-border bg-card hover:border-wa-600 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-wa-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-wa-600/20 transition-colors">
                          <Icon icon="mdi:account-group" className="text-wa-600 text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{g.name}</p>
                          {g.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{g.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Icon icon="mdi:account-multiple" className="text-xs text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{g.participantCount} anggota</span>
                          </div>
                        </div>
                        <Icon icon="mdi:chevron-right" className="text-muted-foreground group-hover:text-wa-600 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {isConnected && !waGroups && !waGroupsLoading && !waGroupsError && (
              <EmptyState
                icon="mdi:account-group-outline"
                title="Klik Refresh untuk memuat grup"
                description="Klik tombol Refresh di atas untuk mengambil daftar grup dari WhatsApp."
                action={
                  <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => refetchGroups()}>
                    <Icon icon="mdi:refresh" className="mr-2" />Muat Grup
                  </Button>
                }
              />
            )}
          </div>

          {/* Group members sheet */}
          <Sheet open={!!groupSheet} onOpenChange={(v) => { if (!v) setGroupSheet(null) }}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account-group" className="text-wa-600" />
                  {groupSheet?.name}
                </SheetTitle>
                {groupSheet?.description && (
                  <p className="text-xs text-muted-foreground">{groupSheet.description}</p>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {/* Import bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-wa-600/5 border border-wa-600/20">
                  <div>
                    <p className="text-xs font-semibold text-wa-700 dark:text-wa-400">
                      {groupSheet?.participantCount} anggota
                    </p>
                    <p className="text-xs text-muted-foreground">Import semua sebagai kontak</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-wa-600 hover:bg-wa-700"
                    onClick={() => { setImportGroupId(''); setImportOpen(true) }}
                  >
                    <Icon icon="mdi:account-multiple-plus" className="mr-1.5" />
                    Import
                  </Button>
                </div>

                {/* Members list */}
                {membersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
                  </div>
                ) : groupMembers?.members.length ? (
                  <div className="space-y-1">
                    {groupMembers.members.map((m) => (
                      <div
                        key={m.jid}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon icon="mdi:account" className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">+{m.phone}</p>
                        </div>
                        <div className="flex gap-1">
                          {m.isSuperAdmin && (
                            <Badge className="text-[10px] py-0 bg-purple-100 text-purple-700">Owner</Badge>
                          )}
                          {m.isAdmin && !m.isSuperAdmin && (
                            <Badge className="text-[10px] py-0 bg-blue-100 text-blue-700">Admin</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">Tidak ada data anggota</p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Import dialog */}
          <Dialog open={importOpen} onOpenChange={(v) => { if (!v) { setImportOpen(false); setImportGroupId('') } }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account-multiple-plus" className="text-wa-600" />
                  Import Anggota Grup
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{groupSheet?.participantCount ?? 0}</span> anggota dari grup{' '}
                  <span className="font-semibold text-foreground">"{groupSheet?.name}"</span> akan diimpor ke daftar kontak.
                </p>
                <div className="space-y-1.5">
                  <Label>Tambah ke Grup Kontak <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                  <Select
                    value={importGroupId || '__none__'}
                    onValueChange={(v) => setImportGroupId(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tidak menambahkan ke grup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Tidak menambahkan ke grup</SelectItem>
                      {contactGroups?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportOpen(false)}>Batal</Button>
                <Button
                  className="bg-wa-600 hover:bg-wa-700"
                  disabled={importing}
                  onClick={() => importGroup()}
                >
                  {importing ? (
                    <><Icon icon="mdi:loading" className="animate-spin mr-2" />Mengimpor...</>
                  ) : (
                    <><Icon icon="mdi:check" className="mr-2" />Mulai Import</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Agents ─────────────────────────────────────────────────────────── */}
        <TabsContent value="agents">
          <div className="max-w-2xl space-y-4">
            <div className="flex justify-between items-start">
              <p className="text-sm text-muted-foreground max-w-sm">
                Tambahkan pengguna lain sebagai agent untuk mengelola device ini bersama.
              </p>
              <Button className="bg-wa-600 hover:bg-wa-700 flex-shrink-0" onClick={openAddAgent}>
                <Icon icon="mdi:account-plus" className="mr-2" />Tambah Agent
              </Button>
            </div>

            {agentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : !agents?.length ? (
              <EmptyState
                icon="mdi:account-multiple-outline"
                title="Belum ada agent"
                description="Undang pengguna lain untuk mengelola device ini"
                action={
                  <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddAgent}>
                    <Icon icon="mdi:account-plus" className="mr-2" />Tambah Agent
                  </Button>
                }
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs bg-muted/30">
                        <th className="text-left px-4 py-3">Pengguna</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                        <th className="text-left px-4 py-3">Role</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Bergabung</th>
                        <th className="px-4 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((a) => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-wa-600/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-wa-700 text-xs font-bold">
                                  {a.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium">{a.user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.user.email}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn('text-xs', ROLE_COLORS[a.role])}>{ROLE_LABELS[a.role]}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                            {formatDate(a.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {a.role !== 'OWNER' && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAgent(a)}>
                                  <Icon icon="mdi:pencil-outline" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteAgent(a)}>
                                  <Icon icon="mdi:delete-outline" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Agent form dialog */}
          <Dialog open={agentOpen} onOpenChange={(v) => { setAgentOpen(v); if (!v) { resetA(); setEditAgent(null) } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editAgent ? 'Ubah Role Agent' : 'Tambah Agent'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={hsA((d) => saveAgent(d))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email Pengguna</Label>
                  <Input placeholder="user@example.com" disabled={!!editAgent} {...regA('email')} />
                  {errA.email && <p className="text-xs text-red-500">{errA.email.message}</p>}
                  {editAgent && <p className="text-xs text-muted-foreground">{editAgent.user.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Controller control={ctrlA} name="role" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['AGENT', 'VIEWER'] as AgentRole[]).map((r) => (
                          <SelectItem key={r} value={r}>
                            <div className="flex items-center gap-2">
                              <Badge className={cn('text-xs', ROLE_COLORS[r])}>{ROLE_LABELS[r]}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {r === 'AGENT' ? '— Kirim pesan & kelola' : '— Lihat saja'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAgentOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={savingAgent}>
                    {savingAgent ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Messages ───────────────────────────────────────────────────────── */}
        <TabsContent value="messages">
          {messagesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : messages?.length === 0 ? (
            <EmptyState icon="mdi:message-off" title="Belum ada pesan" description="Pesan yang dikirim melalui device ini akan muncul di sini" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3">Tujuan</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Isi Pesan</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages?.map((msg) => (
                      <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">+{msg.to}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {truncate(msg.content ?? '', 60)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs', STATUS_COLORS[msg.status])}>
                            {msg.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(msg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <QRCodeModal deviceId={device.id} deviceName={device.name} open={qrOpen} onOpenChange={setQrOpen} />

      <ConfirmDialog
        open={!!deleteAgent}
        onOpenChange={(v) => { if (!v) setDeleteAgent(null) }}
        title="Hapus Agent?"
        description={`${deleteAgent?.user.name} (${deleteAgent?.user.email}) akan dihapus dari device ini.`}
        confirmLabel="Hapus" destructive loading={removingAgent}
        onConfirm={() => { if (deleteAgent) { removeAgent(deleteAgent.id); setDeleteAgent(null) } }}
      />
    </div>
  )
}
