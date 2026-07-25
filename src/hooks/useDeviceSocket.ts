import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSocket } from './useSocket'
import type { DeviceStatus } from '@/types'
import { deviceQueryKeys } from '@/api/device.api'
import { messageQueryKeys } from '@/api/message.api'

interface DeviceSocketState {
  qrCode: string | null
  status: DeviceStatus | null
}

export function useDeviceSocket(deviceId: string) {
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const [state, setState] = useState<DeviceSocketState>({ qrCode: null, status: null })

  useEffect(() => {
    if (!socket || !deviceId) return

    // Backend: socket.on('join:device', (deviceId) => socket.join(`device:${deviceId}`))
    socket.emit('join:device', deviceId)

    // Backend: io.to(`device:${deviceId}`).emit('qr', { deviceId, qr: qrBase64 })
    const onQR = (data: { deviceId: string; qr: string }) => {
      setState((prev) => ({ ...prev, qrCode: data.qr }))
    }

    // Backend: io.to(`device:${deviceId}`).emit('connected', { deviceId, phone })
    const onConnected = (data: { deviceId: string; phone: string }) => {
      setState((prev) => ({ ...prev, status: 'CONNECTED' }))
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.detail(data.deviceId) })
    }

    // Backend: io.to(`device:${deviceId}`).emit('disconnected', { deviceId, statusCode })
    const onDisconnected = (data: { deviceId: string; statusCode?: string }) => {
      const status: DeviceStatus =
        data.statusCode === '401' ? 'LOGGED_OUT' :
        data.statusCode === '403' ? 'BANNED' :
        'DISCONNECTED'
      setState((prev) => ({ ...prev, status }))
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.detail(data.deviceId) })
    }

    // Backend: io.to(`device:${deviceId}`).emit('message', payload)
    const onMessage = (data: { from?: string; content?: string }) => {
      queryClient.invalidateQueries({ queryKey: messageQueryKeys.all() })
      toast.info(`Pesan masuk dari ${data.from ?? 'unknown'}`, {
        description: data.content?.slice(0, 80),
      })
    }

    // Backend: socket.emit('error', { message: 'Access denied to this device' }) jika join:device ditolak
    const onError = (err: { message?: string }) => {
      toast.error(err.message ?? 'Akses ke device ditolak')
    }

    socket.on('qr', onQR)
    socket.on('connected', onConnected)
    socket.on('disconnected', onDisconnected)
    socket.on('message', onMessage)
    socket.on('error', onError)

    return () => {
      socket.off('qr', onQR)
      socket.off('connected', onConnected)
      socket.off('disconnected', onDisconnected)
      socket.off('message', onMessage)
      socket.off('error', onError)
    }
  }, [socket, deviceId, queryClient])

  return state
}
