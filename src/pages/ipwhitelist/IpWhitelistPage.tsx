import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { ipWhitelistApi, ipWhitelistQueryKeys } from '@/api/ipwhitelist.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { IpWhitelistEntry } from '@/types'

const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-fA-F:]+$/

const schema = z.object({
  ip:    z.string().min(1, 'IP wajib diisi').regex(ipRegex, 'Format IP atau CIDR tidak valid'),
  label: z.string().max(100).optional(),
})
type FormData = z.infer<typeof schema>

export function IpWhitelistPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<IpWhitelistEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IpWhitelistEntry | null>(null)

  const { data: entries, isLoading } = useQuery({
    queryKey: ipWhitelistQueryKeys.all,
    queryFn:  ipWhitelistApi.getAll,
    select:   (r) => r.data.data ?? [],
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ipWhitelistQueryKeys.all })

  const { mutate: save, isPending } = useMutation({
    mutationFn: (d: FormData) =>
      editTarget
        ? ipWhitelistApi.update(editTarget.id, { ip: d.ip, label: d.label || null })
        : ipWhitelistApi.add({ ip: d.ip, label: d.label || undefined }),
    onSuccess: () => {
      toast.success(editTarget ? 'Whitelist diperbarui' : 'IP ditambahkan ke whitelist')
      invalidate()
      setFormOpen(false); setEditTarget(null); reset()
    },
    onError: (err: { response?: { data?: { error?: { code?: string } } } }) => {
      toast.error(
        err.response?.data?.error?.code === 'IP_DUPLICATE'
          ? 'IP sudah ada di whitelist'
          : 'Gagal menyimpan whitelist',
      )
    },
  })

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ipWhitelistApi.update(id, { isActive }),
    onSuccess: invalidate,
    onError: () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => ipWhitelistApi.delete(id),
    onSuccess: () => { toast.success('IP dihapus dari whitelist'); invalidate() },
    onError: () => toast.error('Gagal menghapus IP'),
  })

  const openAdd = () => { setEditTarget(null); reset(); setFormOpen(true) }
  const openEdit = (entry: IpWhitelistEntry) => {
    setEditTarget(entry)
    setValue('ip', entry.ip)
    setValue('label', entry.label ?? '')
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="IP Whitelist"
        description="Batasi akses API Key hanya dari alamat IP tertentu"
        action={
          <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}>
            <Icon icon="mdi:plus" className="mr-2" />Tambah IP
          </Button>
        }
      />

      <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
        <Icon icon="mdi:information-outline" className="flex-shrink-0 mt-0.5" />
        <span>
          Jika whitelist kosong, API bisa diakses dari IP mana saja. Setelah minimal satu IP aktif ditambahkan,
          request API Key dari IP di luar daftar akan ditolak. Mendukung IP tunggal (<code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">103.10.20.5</code>)
          dan notasi CIDR (<code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">103.10.20.0/24</code>).
        </span>
      </div>

      {isLoading ? <PageLoader /> : !entries?.length ? (
        <EmptyState
          icon="mdi:shield-key-outline"
          title="Belum ada IP whitelist"
          description="API Anda saat ini bisa diakses dari IP mana saja"
          action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={openAdd}><Icon icon="mdi:plus" className="mr-2" />Tambah IP</Button>}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon icon="mdi:shield-key" className="text-wa-600 flex-shrink-0" />
                      <code className="font-mono text-sm font-medium">{entry.ip}</code>
                      {entry.label && <span className="text-xs text-muted-foreground">— {entry.label}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Ditambahkan {formatDate(entry.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={entry.isActive} onCheckedChange={(v) => toggle({ id: entry.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}><Icon icon="mdi:pencil-outline" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(entry)}><Icon icon="mdi:delete-outline" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { reset(); setEditTarget(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editTarget ? 'Edit IP Whitelist' : 'Tambah IP Whitelist'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => save(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Alamat IP / CIDR</Label>
              <Input placeholder="103.10.20.5 atau 103.10.20.0/24" {...register('ip')} />
              {errors.ip && <p className="text-xs text-red-500">{errors.ip.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Label <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Input placeholder="Server produksi" {...register('label')} />
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

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus IP dari Whitelist?"
        description={`IP ${deleteTarget?.ip} akan dihapus. Jika ini entri terakhir, API kembali bisa diakses dari IP mana saja.`}
        confirmLabel="Hapus" destructive loading={deleting}
        onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }}
      />
    </div>
  )
}
