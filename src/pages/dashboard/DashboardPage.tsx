import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { accountApi, accountQueryKeys } from '@/api/account.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { messageApi, messageQueryKeys } from '@/api/message.api'
import { StatCard } from '@/components/common/StatCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_COLORS } from '@/lib/constants'
import { truncate, formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

const statusLabel: Record<DeviceStatus, string> = {
  CONNECTED: 'Terhubung', CONNECTING: 'Menghubungkan',
  QR_READY: 'Scan QR',   DISCONNECTED: 'Terputus',
  LOGGED_OUT: 'Keluar',  BANNED: 'Diblokir',
}

const STATUS_CHART_COLORS: Record<string, string> = {
  sent:      'hsl(142,76%,36%)',
  delivered: 'hsl(160,84%,39%)',
  read:      'hsl(200,98%,39%)',
  failed:    'hsl(0,72%,51%)',
  pending:   'hsl(220,14%,70%)',
  queued:    'hsl(220,90%,60%)',
}

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: accountQueryKeys.me,
    queryFn: () => accountApi.getMe(),
    select: (r) => r.data.data,
  })

  const { data: stats } = useQuery({
    queryKey: accountQueryKeys.stats,
    queryFn: () => accountApi.getStats(),
    select: (r) => r.data.data,
  })

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => deviceApi.getAll(),
    select: (r) => r.data.data?.devices ?? [],
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: messageQueryKeys.all({ limit: 5 }),
    queryFn: () => messageApi.getAll({ limit: 5 }),
    select: (r) => r.data.data?.messages ?? [],
  })

  const usage = meData?.usage

  // Build bar chart data from stats.messages.byStatus
  const statusChartData = stats
    ? Object.entries(stats.messages.byStatus).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        jumlah: val,
        color: STATUS_CHART_COLORS[key] ?? 'hsl(220,14%,70%)',
      }))
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas WhatsApp Gateway Anda"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Device"
          value={usage?.totalDevices ?? 0}
          icon="mdi:cellphone"
          iconColor="text-wa-600"
          iconBg="bg-wa-50 dark:bg-wa-950/40"
          accentColor="hsl(142 72% 29%)"
          loading={meLoading}
          description="Device terdaftar"
        />
        <StatCard
          title="Device Terhubung"
          value={usage?.connectedDevices ?? 0}
          icon="mdi:cellphone-check"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          accentColor="hsl(160 84% 39%)"
          loading={meLoading}
          description="Aktif saat ini"
        />
        <StatCard
          title="Pesan Bulan Ini"
          value={usage?.messagesSentThisMonth ?? 0}
          icon="mdi:message-text"
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          accentColor="hsl(217 91% 60%)"
          loading={meLoading}
          description="Terkirim bulan ini"
        />
        <StatCard
          title="Total Pesan"
          value={stats?.messages.total ?? 0}
          icon="mdi:message-fast"
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          accentColor="hsl(258 90% 66%)"
          loading={meLoading}
          description="Sepanjang waktu"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status breakdown chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Status Pesan (Keseluruhan)</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data pesan
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Pesan']} />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {stats && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Bulan ini</p>
                  <p className="font-bold text-sm">{stats.messages.thisMonth.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Bulan lalu</p>
                  <p className="font-bold text-sm">{stats.messages.lastMonth.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Webhook aktif</p>
                  <p className="font-bold text-sm">{stats.webhooks.activeTotal}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Status Device</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/devices')} className="text-xs text-wa-600">
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {devicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : devices?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada device</p>
            ) : (
              devices?.slice(0, 5).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon icon="mdi:cellphone" className="text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.phone ?? 'Belum terhubung'}</p>
                    </div>
                  </div>
                  <Badge className={cn('text-xs flex-shrink-0', STATUS_COLORS[device.status])}>
                    {statusLabel[device.status]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Pesan Terbaru</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/messages/history')} className="text-xs text-wa-600">
            Lihat Semua
          </Button>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : messages?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada pesan terkirim</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Tujuan</th>
                    <th className="text-left py-2 pr-4 hidden sm:table-cell">Isi Pesan</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {messages?.map((msg) => (
                    <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 pr-4 font-medium">+{msg.to}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">
                        {truncate(msg.content ?? '', 50)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={cn('text-xs', STATUS_COLORS[msg.status])}>{msg.status}</Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">{formatRelative(msg.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
