import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { DeviceCard } from '@/components/device/DeviceCard'
import { QRCodeModal } from '@/components/device/QRCodeModal'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Device } from '@/types'

const schema = z.object({ name: z.string().min(2, 'Nama minimal 2 karakter') })
type FormData = z.infer<typeof schema>

export function DevicesPage() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<Device | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const { data: devices, isLoading } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn: () => deviceApi.getAll(),
    select: (r) => r.data.data?.devices ?? [],
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: deviceApi.create,
    onSuccess: (res) => {
      const device = res.data.data.device
      setNewDevice(device)
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
      toast.success(`Device "${device.name}" berhasil ditambahkan`)
      setAddOpen(false)
      reset()
      setQrOpen(true)
    },
    onError: () => toast.error('Gagal menambahkan device'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Devices"
        description={`${devices?.length ?? 0} device terdaftar`}
        action={
          <Button
            className="bg-wa-600 hover:bg-wa-700"
            onClick={() => setAddOpen(true)}
          >
            <Icon icon="mdi:plus" className="mr-2" />
            Tambah Device
          </Button>
        }
      />

      {devices?.length === 0 ? (
        <EmptyState
          icon="mdi:cellphone-off"
          title="Belum ada device"
          description="Tambahkan device WhatsApp pertama Anda untuk mulai mengirim pesan"
          action={
            <Button
              className="bg-wa-600 hover:bg-wa-700"
              onClick={() => setAddOpen(true)}
            >
              <Icon icon="mdi:plus" className="mr-2" />
              Tambah Device
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)
            : devices?.map((device) => <DeviceCard key={device.id} device={device} />)
          }
        </div>
      )}

      {/* Add Device Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Device Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => create(d))}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="deviceName">Nama Device</Label>
                <Input
                  id="deviceName"
                  placeholder="Contoh: Layanan Pelanggan, Bot Notifikasi"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={isPending}>
                {isPending ? (
                  <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                ) : 'Simpan & Hubungkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auto-open QR after create */}
      {newDevice && (
        <QRCodeModal
          deviceId={newDevice.id}
          deviceName={newDevice.name}
          open={qrOpen}
          onOpenChange={setQrOpen}
        />
      )}
    </div>
  )
}
