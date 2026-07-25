import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { chatFlowApi, chatFlowQueryKeys } from '@/api/chatflow.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth.store'
import { PLAN_LIMITS, MATCH_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { ChatFlow } from '@/types'

export function ChatFlowsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const plan = user?.plan ?? 'FREE'
  const canUseChatFlow = PLAN_LIMITS[plan]?.canAutoReply ?? false

  const [deviceFilter, setDeviceFilter]     = useState<string>('all')
  const [deleteTarget, setDeleteTarget]     = useState<ChatFlow | null>(null)
  const [sessionsTarget, setSessionsTarget] = useState<ChatFlow | null>(null)

  const { data: flows, isLoading } = useQuery({
    queryKey: chatFlowQueryKeys.all(deviceFilter !== 'all' ? deviceFilter : undefined),
    queryFn:  () => chatFlowApi.getAll(deviceFilter !== 'all' ? { deviceId: deviceFilter } : undefined),
    select:   (r) => r.data.data?.flows ?? [],
    enabled:  canUseChatFlow,
  })

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => chatFlowApi.delete(id),
    onSuccess: () => {
      toast.success('Chat flow dihapus')
      queryClient.invalidateQueries({ queryKey: ['chat-flows'] })
    },
    onError: () => toast.error('Gagal menghapus chat flow'),
  })

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      chatFlowApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-flows'] }),
    onError: () => toast.error('Gagal mengubah status'),
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: chatFlowQueryKeys.sessions(sessionsTarget?.id ?? ''),
    queryFn:  () => chatFlowApi.getSessions(sessionsTarget!.id),
    select:   (r) => r.data.data?.sessions ?? [],
    enabled:  !!sessionsTarget,
  })

  if (!canUseChatFlow) {
    return (
      <div>
        <PageHeader title="Chat Flow" description="Chatbot multi-langkah otomatis berdasarkan keyword pemicu" />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Icon icon="mdi:lock" className="text-3xl text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Fitur Premium</p>
            <p className="text-muted-foreground text-sm mt-1">Chat Flow tersedia untuk plan REGULAR ke atas.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Chat Flow"
        description="Chatbot multi-langkah otomatis berdasarkan keyword pemicu"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => navigate('/chat-flows/new')}>
            <Icon icon="mdi:plus" className="mr-2" />Buat Chat Flow
          </Button>
        }
      />

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

      {isLoading ? <PageLoader /> : !flows?.length ? (
        <EmptyState
          icon="mdi:robot-outline"
          title="Belum ada chat flow"
          description="Buat skenario percakapan otomatis multi-langkah berdasarkan keyword"
          action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={() => navigate('/chat-flows/new')}><Icon icon="mdi:plus" className="mr-2" />Buat Chat Flow</Button>}
        />
      ) : (
        <div className="space-y-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/chat-flows/${flow.id}`)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon icon="mdi:robot-outline" className="text-wa-600 flex-shrink-0" />
                      <span className="font-medium text-sm">{flow.name}</span>
                      <Badge variant="secondary" className="text-xs py-0">{MATCH_TYPE_LABELS[flow.triggerMatchType]}</Badge>
                      <Badge variant="outline" className="text-xs py-0">{flow.nodes.length} node</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Trigger: <code className="bg-muted px-1 py-0.5 rounded">{flow.triggerKeyword}</code></p>
                      <p>Device: <span className="text-foreground">{devices?.find(d => d.id === flow.deviceId)?.name ?? flow.deviceId}</span></p>
                      <p>Node awal: <span className="text-foreground">{flow.startNodeId}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={flow.isActive} onCheckedChange={(v) => toggle({ id: flow.id, isActive: v })} />
                    <Button variant="outline" size="sm" onClick={() => setSessionsTarget(flow)}>
                      <Icon icon="mdi:monitor-eye" className="mr-1" />Sesi
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/chat-flows/${flow.id}`)}>
                      <Icon icon="mdi:pencil-outline" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(flow)}>
                      <Icon icon="mdi:delete-outline" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Sessions monitor ──────────────────────────────────────────────── */}
      <Sheet open={!!sessionsTarget} onOpenChange={(v) => { if (!v) setSessionsTarget(null) }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Icon icon="mdi:monitor-eye" className="text-wa-600" />
              Sesi Aktif — {sessionsTarget?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
              </div>
            ) : !sessions?.length ? (
              <p className="text-center text-sm text-muted-foreground py-8">Tidak ada sesi percakapan aktif.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">+{s.contactPhone}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(s.updatedAt)}</span>
                  </div>
                  <p className="text-xs">
                    Posisi node: <Badge variant="secondary" className="text-xs py-0">{s.currentNodeId}</Badge>
                  </p>
                  {Object.keys(s.variables ?? {}).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(s.variables).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-[10px] py-0">{k}: {v}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Chat Flow?"
        description={`Chat flow "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Hapus" destructive loading={deleting}
        onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }}
      />
    </div>
  )
}
