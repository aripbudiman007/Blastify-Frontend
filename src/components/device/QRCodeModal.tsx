import { useEffect, useReducer, useCallback, useState } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { useDeviceSocket } from '@/hooks/useDeviceSocket'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QR_TIMEOUT } from '@/lib/constants'

interface QRCodeModalProps {
  deviceId: string
  deviceName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalState = {
  qrCode: string | null
  countdown: number
  statusText: string
}

type ModalAction =
  | { type: 'RESET' }
  | { type: 'QR_RECEIVED'; qr: string }
  | { type: 'STATUS_TEXT'; text: string }
  | { type: 'TICK' }
  | { type: 'EXPIRED' }

const initialState: ModalState = {
  qrCode: null,
  countdown: QR_TIMEOUT,
  statusText: 'Memulai koneksi...',
}

function reducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'RESET':
      return initialState
    case 'QR_RECEIVED':
      return { qrCode: action.qr, countdown: QR_TIMEOUT, statusText: 'Menunggu scan QR...' }
    case 'STATUS_TEXT':
      return { ...state, statusText: action.text }
    case 'TICK':
      return { ...state, countdown: Math.max(0, state.countdown - 1) }
    case 'EXPIRED':
      return { ...state, statusText: 'QR kedaluwarsa — memperbarui...', countdown: 0 }
    default:
      return state
  }
}

export function QRCodeModal({ deviceId, deviceName, open, onOpenChange }: QRCodeModalProps) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { qrCode, countdown, statusText } = state

  const { qrCode: socketQr, status: socketStatus } = useDeviceSocket(open ? deviceId : '')

  // Pairing code (alternatif QR): "Tautkan dengan nomor telepon"
  const [mode, setMode] = useState<'qr' | 'pairing'>('qr')
  const [phone, setPhone] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)

  const { mutate: requestPairing, isPending: pairingPending } = useMutation({
    mutationFn: () => deviceApi.requestPairingCode(deviceId, phone.trim()),
    onSuccess: (res) => setPairingCode(res.data.data.pairingCode),
    onError: (err: { response?: { data?: { error?: { code?: string; message?: string } } } }) => {
      const code = err.response?.data?.error?.code
      toast.error(
        code === 'NOT_CONNECTING' ? 'Koneksi belum siap — tunggu beberapa detik lalu coba lagi'
        : code === 'ALREADY_PAIRED' ? 'Device sudah terhubung dengan WhatsApp'
        : err.response?.data?.error?.message ?? 'Gagal meminta pairing code',
      )
    },
  })

  const { mutate: connect, isPending } = useMutation({
    mutationFn: () => deviceApi.connect(deviceId),
    onSuccess: (res) => {
      if (res.data.data?.qr) dispatch({ type: 'QR_RECEIVED', qr: res.data.data.qr })
      else dispatch({ type: 'STATUS_TEXT', text: 'Menunggu QR dari server...' })
    },
    onError: () => {
      dispatch({ type: 'STATUS_TEXT', text: 'Gagal memulai koneksi' })
      toast.error('Gagal memulai koneksi device')
    },
  })

  // Reset & start connection when modal opens
  useEffect(() => {
    if (!open) return
    dispatch({ type: 'RESET' })
    setMode('qr'); setPhone(''); setPairingCode(null)
    connect()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync QR from socket
  useEffect(() => {
    if (socketQr) dispatch({ type: 'QR_RECEIVED', qr: socketQr })
  }, [socketQr])

  // Handle socket status changes
  useEffect(() => {
    if (!socketStatus) return
    if (socketStatus === 'CONNECTED') {
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
      toast.success(`${deviceName} berhasil terhubung!`)
      onOpenChange(false)
    } else if (socketStatus === 'BANNED') {
      dispatch({ type: 'STATUS_TEXT', text: 'Nomor ini diblokir oleh WhatsApp' })
    } else if (socketStatus === 'CONNECTING') {
      dispatch({ type: 'STATUS_TEXT', text: 'Menghubungkan...' })
    }
  }, [socketStatus, deviceName, onOpenChange, queryClient])

  // Countdown timer
  useEffect(() => {
    if (!open || !qrCode || countdown <= 0) return
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(t)
  }, [open, qrCode, countdown])

  // Auto-refresh when countdown hits zero
  useEffect(() => {
    if (!open || !qrCode || countdown > 0) return
    dispatch({ type: 'EXPIRED' })
    connect()
  }, [countdown]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    dispatch({ type: 'RESET' })
    connect()
  }, [connect])

  const isBanned = socketStatus === 'BANNED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:whatsapp" className="text-wa-600 text-xl" />
            Hubungkan WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-whatsapp-50 dark:bg-whatsapp-900/20 rounded-lg p-3 space-y-1 text-sm text-whatsapp-800 dark:text-whatsapp-300">
            <p className="font-medium mb-2">Cara menghubungkan:</p>
            <p>1. Buka WhatsApp di ponsel Anda</p>
            <p>2. Ketuk <strong>⋮ → Perangkat Tertaut</strong></p>
            <p>3. Ketuk <strong>Tautkan Perangkat</strong></p>
            {mode === 'qr'
              ? <p>4. Scan QR Code di bawah ini</p>
              : <p>4. Ketuk <strong>Tautkan dengan nomor telepon</strong>, lalu masukkan kode di bawah</p>
            }
          </div>

          {/* Pairing code mode */}
          {mode === 'pairing' && !isBanned && (
            <div className="flex flex-col items-center gap-3">
              {pairingCode ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-1.5 py-6 bg-muted/50 rounded-xl border-2 border-whatsapp-200">
                    {pairingCode.split('').map((ch, i) => (
                      <span key={i} className="w-8 h-10 flex items-center justify-center bg-background border rounded-lg font-mono text-lg font-bold">
                        {ch}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Masukkan kode ini di WhatsApp ({phone}). Kode hanya berlaku sebentar —
                    minta ulang jika kedaluwarsa.
                  </p>
                  <Button variant="outline" className="w-full" disabled={pairingPending} onClick={() => requestPairing()}>
                    <Icon icon={pairingPending ? 'mdi:loading' : 'mdi:refresh'} className={`mr-2 ${pairingPending ? 'animate-spin' : ''}`} />
                    Minta Kode Baru
                  </Button>
                </div>
              ) : (
                <form
                  className="w-full space-y-2"
                  onSubmit={(e) => { e.preventDefault(); if (phone.trim()) requestPairing() }}
                >
                  <Input
                    placeholder="Nomor WhatsApp device, cth: 628123456789"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    autoFocus
                  />
                  <Button type="submit" className="w-full bg-wa-600 hover:bg-wa-700" disabled={pairingPending || phone.trim().length < 8}>
                    {pairingPending
                      ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Meminta kode...</>
                      : <><Icon icon="mdi:cellphone-key" className="mr-2" />Minta Pairing Code</>
                    }
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* QR Code Area */}
          {mode === 'qr' && (
          <div className="flex flex-col items-center gap-3">
            {isBanned ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-red-200 dark:border-red-800 gap-2 animate-fade-in">
                <Icon icon="mdi:block-helper" className="text-5xl text-red-500" />
                <p className="text-sm text-red-600 font-medium text-center px-4">
                  Nomor ini diblokir oleh WhatsApp
                </p>
              </div>
            ) : isPending || (!qrCode && !isBanned) ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center bg-muted/50 dark:bg-muted/20 rounded-xl gap-4 border-2 border-dashed border-muted-foreground/20 animate-fade-in">
                <div className="space-y-2 text-center">
                  <Icon icon="mdi:qrcode-scan" className="text-5xl text-wa-600/50 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Memuat QR Code...</p>
                    <div className="w-40 h-1.5 bg-gradient-to-r from-transparent via-wa-600 to-transparent rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ) : qrCode ? (
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border-2 border-whatsapp-200 dark:border-whatsapp-700 shadow-md animate-fade-in">
                <img src={qrCode} alt="QR Code WhatsApp" width={220} height={220} className="rounded bg-white" />
              </div>
            ) : null}

            {/* Countdown */}
            {qrCode && !isBanned && (
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:timer-outline" />
                    QR kedaluwarsa dalam:{' '}
                    <strong className={countdown <= 10 ? 'text-red-500' : ''}>{countdown}s</strong>
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleRefresh}>
                    <Icon icon="mdi:refresh" className="mr-1" />
                    Perbarui
                  </Button>
                </div>
                <Progress value={(countdown / QR_TIMEOUT) * 100} className="h-1.5" />
              </div>
            )}

            {/* Status */}
            <p className={`text-sm font-medium ${isBanned ? 'text-red-500' : 'text-muted-foreground'}`}>
              {statusText}
            </p>
          </div>
          )}

          {/* Mode toggle */}
          {!isBanned && (
            <button
              type="button"
              className="w-full text-center text-xs text-wa-600 hover:text-wa-700 hover:underline"
              onClick={() => { setMode((m) => (m === 'qr' ? 'pairing' : 'qr')); setPairingCode(null) }}
            >
              {mode === 'qr' ? 'Tidak bisa scan? Tautkan dengan nomor telepon' : 'Kembali ke QR Code'}
            </button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Device: <strong>{deviceName}</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
