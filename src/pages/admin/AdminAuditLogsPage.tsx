import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { adminApi, adminQueryKeys } from '@/api/admin.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatDate } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  login:    'bg-blue-100  text-blue-700',
  deleted:  'bg-red-100   text-red-700',
  created:  'bg-green-100 text-green-700',
  updated:  'bg-yellow-100 text-yellow-700',
  confirmed:'bg-emerald-100 text-emerald-700',
  cancelled:'bg-gray-100  text-gray-600',
}

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k))
  return key ? ACTION_COLORS[key] : 'bg-gray-100 text-gray-600'
}

export function AdminAuditLogsPage() {
  const [page, setPage]     = useState(1)
  const [action, setAction] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.auditLogs, page, action],
    queryFn:  () => adminApi.getAuditLogs({
      page,
      limit: 50,
      action: action || undefined,
    }),
    select: (r) => r.data.data,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Riwayat semua tindakan admin dan sistem</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Filter aksi (contoh: user.deleted)"
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1) }}
          className="w-60"
        />
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((log: import('@/types').AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt, 'dd MMM HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{log.actorEmail}</p>
                        <Badge className={cn('text-[10px] py-0 mt-0.5', log.actorType === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                          {log.actorType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', actionColor(log.action))}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.targetType && <span>{log.targetType}: </span>}
                      {log.targetId && <span className="font-mono">{log.targetId.slice(0, 8)}…</span>}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="ml-1 opacity-60">{JSON.stringify(log.metadata).slice(0, 50)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{log.ip ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.total > 50 && (
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
    </div>
  )
}
