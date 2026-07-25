import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatDate } from '@/lib/utils'
import { PLAN_COLORS } from '@/lib/constants'
import type { Plan } from '@/types'
import type { AdminUserRow } from '@/api/admin.api'

const PLANS: Plan[] = ['FREE', 'LITE', 'REGULAR', 'MASTER', 'ULTRA']

export function AdminUsersPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [planFilter, setPlan] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.users, page, search, planFilter],
    queryFn:  () => adminApi.listUsers({
      page,
      search: search || undefined,
      plan: (planFilter !== 'all' ? planFilter as Plan : undefined),
    }),
    select: (r) => r.data.data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: adminQueryKeys.users })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUserStatus(id, isActive),
    onSuccess: () => { invalidate(); toast.success('Status diperbarui') },
    onError:   () => toast.error('Gagal mengubah status'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { invalidate(); toast.success('User dihapus'); setDeleteTarget(null) },
    onError:   () => toast.error('Gagal menghapus user'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ? `${data.total.toLocaleString()} user terdaftar` : 'Kelola semua user'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Cari email / nama..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-56"
        />
        <Select value={planFilter} onValueChange={v => { setPlan(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Plan</SelectItem>
            {PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Plan Expires</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((user: AdminUserRow) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', PLAN_COLORS[user.plan])}>{user.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user._count.devices}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.planExpiresAt ? formatDate(user.planExpiresAt, 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(user.createdAt, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => navigate(`/admin/users/${user.id}`)}>
                          <Icon icon="mdi:eye-outline" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => toggleStatus({ id: user.id, isActive: !user.isActive })}>
                          <Icon icon={user.isActive ? 'mdi:account-off-outline' : 'mdi:account-check-outline'} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteTarget(user)}>
                          <Icon icon="mdi:delete-outline" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Halaman {data.page} dari {Math.ceil(data.total / data.limit)}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <Icon icon="mdi:chevron-left" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.limit)}>
                  <Icon icon="mdi:chevron-right" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus User?"
        description={`User "${deleteTarget?.email}" beserta semua data (device, pesan, kontak) akan dihapus permanen.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={() => { if (deleteTarget) remove(deleteTarget.id) }}
      />
    </div>
  )
}
