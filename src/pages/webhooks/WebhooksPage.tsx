import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { webhookApi, webhookQueryKeys } from '@/api/webhook.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { WEBHOOK_EVENTS } from '@/lib/constants'
import type { Webhook } from '@/types'

const schema = z.object({
  url:       z.string().url('URL tidak valid'),
  events:    z.array(z.string()).min(1, 'Pilih minimal 1 event'),
  deviceIds: z.array(z.string()),
})
type FormData = z.infer<typeof schema>

export function WebhooksPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Webhook | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null)
  const [testResult, setTestResult] = useState<{ status: number; body: unknown } | null>(null)
  const [testOpen, setTestOpen] = useState(false)

  const { data: webhooks, isLoading } = useQuery({
    queryKey: webhookQueryKeys.all,
    queryFn: () => webhookApi.getAll(),
    select: (r) => r.data.data?.webhooks ?? [],
  })

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => deviceApi.getAll(),
    select: (r) => r.data.data?.devices ?? [],
  })

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { events: [], deviceIds: [] },
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: (d: FormData) =>
      editTarget
        ? webhookApi.update(editTarget.id, d)
        : webhookApi.create(d),
    onSuccess: () => {
      toast.success(editTarget ? 'Webhook diperbarui' : 'Webhook ditambahkan')
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.all })
      setFormOpen(false)
      setEditTarget(null)
      reset()
    },
    onError: () => toast.error('Gagal menyimpan webhook'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => webhookApi.delete(id),
    onSuccess: () => {
      toast.success('Webhook dihapus')
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.all })
    },
  })

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      webhookApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: webhookQueryKeys.all }),
    onError: () => toast.error('Gagal mengubah status webhook'),
  })

  const { mutate: test, isPending: testing } = useMutation({
    mutationFn: (id: string) => webhookApi.test(id),
    onSuccess: (res) => {
      setTestResult(res.data.data)
      setTestOpen(true)
    },
    onError: () => toast.error('Gagal mengirim test webhook'),
  })

  const openEdit = (wh: Webhook) => {
    setEditTarget(wh)
    setValue('url', wh.url)
    setValue('events', wh.events)
    setValue('deviceIds', wh.devices.map((d) => d.id))
    setFormOpen(true)
  }

  const openAdd = () => {
    setEditTarget(null)
    reset()
    setFormOpen(true)
  }

  if (isLoading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Webhook"
        description="Terima notifikasi realtime ke URL Anda"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}>
            <Icon icon="mdi:plus" className="mr-2" />
            Tambah Webhook
          </Button>
        }
      />

      {webhooks?.length === 0 ? (
        <EmptyState
          icon="mdi:webhook"
          title="Belum ada webhook"
          description="Tambahkan webhook untuk menerima notifikasi event WhatsApp"
          action={
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}>
              <Icon icon="mdi:plus" className="mr-2" />
              Tambah Webhook
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {webhooks?.map((wh) => (
            <Card key={wh.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon icon="mdi:webhook" className="text-wa-600 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{wh.url}</span>
                      <CopyButton text={wh.url} />
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {wh.events.map((ev) => (
                        <Badge key={ev} variant="secondary" className="text-xs py-0">
                          {WEBHOOK_EVENTS.find((e) => e.value === ev)?.label ?? ev}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Icon icon="mdi:cellphone" />
                      {wh.devices.length > 0
                        ? wh.devices.map((d) => d.name).join(', ')
                        : 'Semua device'
                      }
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Secret:</span>
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                        {wh.secret.slice(0, 12)}...
                      </code>
                      <CopyButton text={wh.secret} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={wh.isActive}
                      onCheckedChange={(v) => toggle({ id: wh.id, isActive: v })}
                    />
                    <Button
                      variant="outline" size="sm"
                      onClick={() => test(wh.id)}
                      disabled={testing}
                    >
                      <Icon icon="mdi:test-tube" className="mr-1" />
                      Test
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(wh)}>
                      <Icon icon="mdi:pencil-outline" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setDeleteTarget(wh)}
                    >
                      <Icon icon="mdi:delete-outline" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { reset(); setEditTarget(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Webhook' : 'Tambah Webhook'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => save(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>URL Webhook</Label>
              <Input placeholder="https://your-server.com/webhook" {...register('url')} />
              {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <Controller
                control={control}
                name="events"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map((ev) => (
                      <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value.includes(ev.value)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, ev.value]
                                : field.value.filter((v) => v !== ev.value)
                            )
                          }}
                        />
                        <span className="text-sm">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.events && <p className="text-xs text-red-500">{errors.events.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Device (opsional — kosong = semua device)</Label>
              <Controller
                control={control}
                name="deviceIds"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    {devices?.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value.includes(d.id)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, d.id]
                                : field.value.filter((v) => v !== d.id)
                            )
                          }}
                        />
                        <span className="text-sm">{d.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
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

      {/* Test Result Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon={testResult && testResult.status < 300 ? 'mdi:check-circle' : 'mdi:alert-circle'} className={testResult && testResult.status < 300 ? 'text-green-500' : 'text-red-500'} />
              Hasil Test Webhook
            </DialogTitle>
          </DialogHeader>
          {testResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={testResult.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {testResult.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Response Body:</p>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                  {JSON.stringify(testResult.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus Webhook?"
        description={`Webhook ${deleteTarget?.url} akan dihapus permanen.`}
        confirmLabel="Hapus"
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id); setDeleteTarget(null) }}
        loading={deleting}
        destructive
      />
    </div>
  )
}
