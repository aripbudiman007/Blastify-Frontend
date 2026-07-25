import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatDate } from '@/lib/utils'
import { PLAN_COLORS, INVOICE_STATUS_COLORS, STATUS_COLORS } from '@/lib/constants'
import type { Plan } from '@/types'

const PLANS: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: adminQueryKeys.userDetail(id!),
    queryFn:  () => adminApi.getUser(id!),
    select:   (r) => r.data.data,
  })

  const { control, register, handleSubmit, reset } = useForm<{ plan: Plan; expiresAt?: string }>()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.userDetail(id!) })
    qc.invalidateQueries({ queryKey: adminQueryKeys.users })
  }

  const { mutate: updatePlan, isPending: planSaving } = useMutation({
    mutationFn: (d: { plan: Plan; expiresAt?: string }) =>
      adminApi.updateUserPlan(id!, d),
    onSuccess: () => { invalidate(); toast.success('Plan diperbarui'); setPlanDialogOpen(false) },
    onError:   () => toast.error('Gagal mengubah plan'),
  })

  const { mutate: toggleStatus, isPending: statusSaving } = useMutation({
    mutationFn: (isActive: boolean) => adminApi.updateUserStatus(id!, isActive),
    onSuccess: () => { invalidate(); toast.success('Status diperbarui'); setDeactivateTarget(false) },
    onError:   () => toast.error('Gagal mengubah status'),
  })

  if (isLoading) return <PageLoader />
  if (!user) return <p className="text-center py-8 text-muted-foreground">User tidak ditemukan</p>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/users')}>
          <Icon icon="mdi:arrow-left" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { reset({ plan: user.plan }); setPlanDialogOpen(true) }}>
            <Icon icon="mdi:crown-outline" className="mr-1.5" />Ubah Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={user.isActive ? 'text-red-600' : 'text-green-600'}
            onClick={() => setDeactivateTarget(true)}
          >
            <Icon icon={user.isActive ? 'mdi:account-off-outline' : 'mdi:account-check-outline'} className="mr-1.5" />
            {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Plan',     value: <Badge className={cn('text-xs', PLAN_COLORS[user.plan])}>{user.plan}</Badge> },
          { label: 'Status',   value: <Badge className={cn('text-xs', user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{user.isActive ? 'Aktif' : 'Nonaktif'}</Badge> },
          { label: 'Devices',  value: user._count.devices },
          { label: 'Pesan',    value: user._count.messages?.toLocaleString() ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <div className="font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border p-4 space-y-1.5 text-sm">
        <p className="font-semibold mb-2">Info Langganan</p>
        <p><span className="text-muted-foreground w-36 inline-block">Aktif sejak</span>
          {user.planActivatedAt ? formatDate(user.planActivatedAt) : '—'}
        </p>
        <p><span className="text-muted-foreground w-36 inline-block">Kadaluarsa</span>
          {user.planExpiresAt ? formatDate(user.planExpiresAt) : '—'}
        </p>
        <p><span className="text-muted-foreground w-36 inline-block">Bergabung</span>
          {formatDate(user.createdAt)}
        </p>
      </div>

      {/* Devices */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold text-sm">Devices ({user.devices.length})</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.devices.map((d: { id: string; name: string; status: import('@/types').DeviceStatus; phone: string | null }) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm font-medium">{d.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.phone ?? '—'}</TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-700')}>
                    {d.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invoices */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold text-sm">Riwayat Invoice</p>
        </div>
        {user.invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">Belum ada invoice</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{inv.id.slice(0, 8)}…</TableCell>
                  <TableCell><Badge className={cn('text-xs', PLAN_COLORS[inv.plan as Plan])}>{inv.plan}</Badge></TableCell>
                  <TableCell className="text-sm">Rp {(inv.amount / 100).toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', INVOICE_STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-700')}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(inv.createdAt, 'dd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Change plan dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ubah Plan User</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => updatePlan({
            plan: d.plan,
            // datetime-local menghasilkan string tanpa offset (mis. "2026-07-20T14:30") —
            // backend butuh format ISO 8601 lengkap dengan 'Z'
            expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : undefined,
          }))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan Baru</Label>
              <Controller
                control={control}
                name="plan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih plan" /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Kadaluarsa (opsional)</Label>
              <Input type="datetime-local" {...register('expiresAt')} />
              <p className="text-xs text-muted-foreground">Kosongkan = 30 hari dari sekarang</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={planSaving}>
                {planSaving ? <Icon icon="mdi:loading" className="animate-spin" /> : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activate/deactivate confirm */}
      <ConfirmDialog
        open={deactivateTarget}
        onOpenChange={setDeactivateTarget}
        title={user.isActive ? 'Nonaktifkan User?' : 'Aktifkan User?'}
        description={user.isActive
          ? `User "${user.email}" tidak dapat login sampai diaktifkan kembali.`
          : `User "${user.email}" akan dapat login kembali.`
        }
        confirmLabel={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        destructive={user.isActive}
        loading={statusSaving}
        onConfirm={() => toggleStatus(!user.isActive)}
      />
    </div>
  )
}
