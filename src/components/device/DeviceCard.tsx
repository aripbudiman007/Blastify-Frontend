import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { DeviceStatusBadge } from './DeviceStatusBadge'
import { QRCodeModal } from './QRCodeModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Device } from '@/types'

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [qrOpen, setQrOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  const { mutate: disconnect, isPending: disconnecting } = useMutation({
    mutationFn: () => deviceApi.disconnect(device.id),
    onSuccess: () => {
      toast.success(`${device.name} berhasil diputuskan`)
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
    },
    onError: () => toast.error('Gagal memutuskan device'),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => deviceApi.delete(device.id),
    onSuccess: () => {
      toast.success(`${device.name} berhasil dihapus`)
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
    },
    onError: () => toast.error('Gagal menghapus device'),
  })

  const canConnect = ['DISCONNECTED', 'LOGGED_OUT', 'QR_READY'].includes(device.status)
  const isConnected = device.status === 'CONNECTED'

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          {/* Header */}
          <div
            className="flex items-start justify-between mb-3"
            onClick={() => navigate(`/devices/${device.id}`)}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-whatsapp-50 dark:bg-whatsapp-900/20 flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:cellphone" className="text-xl text-wa-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{device.name}</p>
                <p className="text-xs text-muted-foreground">
                  {device.phone ? `+${device.phone}` : 'Belum terhubung'}
                </p>
              </div>
            </div>
            <DeviceStatusBadge status={device.status} />
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            Ditambahkan {formatDate(device.createdAt, 'dd MMM yyyy')}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            {canConnect && (
              <Button
                size="sm"
                className="flex-1 bg-wa-600 hover:bg-wa-700 text-xs"
                onClick={() => setQrOpen(true)}
              >
                <Icon icon="mdi:qrcode" className="mr-1" />
                Hubungkan
              </Button>
            )}
            {isConnected && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setDisconnectOpen(true)}
                disabled={disconnecting}
              >
                <Icon icon="mdi:cellphone-off" className="mr-1" />
                Putuskan
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Icon icon="mdi:delete-outline" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        deviceId={device.id}
        deviceName={device.name}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Putuskan Device?"
        description={`${device.name} akan diputuskan dari WhatsApp. Anda perlu scan QR ulang untuk menghubungkan kembali.`}
        confirmLabel="Putuskan"
        onConfirm={() => { disconnect(); setDisconnectOpen(false) }}
        loading={disconnecting}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Device?"
        description={`${device.name} akan dihapus permanen beserta semua riwayat pesannya.`}
        confirmLabel="Hapus"
        onConfirm={() => { remove(); setDeleteOpen(false) }}
        loading={deleting}
        destructive
      />
    </>
  )
}
