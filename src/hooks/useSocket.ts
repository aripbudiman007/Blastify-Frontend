import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { SOCKET_URL } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'

let socketInstance: Socket | null = null
let socketToken: string | null = null

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      })
      socketToken = accessToken
    } else if (socketToken !== accessToken) {
      // Token di-refresh — koneksi lama tidak otomatis pakai token baru, harus reconnect
      socketToken = accessToken
      socketInstance.auth = { token: accessToken }
      socketInstance.disconnect().connect()
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance)

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onConnectError = (err: Error) => {
      setIsConnected(false)
      if (err.message === 'Authentication required' || err.message === 'Invalid or expired authentication token') {
        toast.error('Koneksi realtime gagal: sesi tidak valid, silakan muat ulang halaman')
      }
    }

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)
    socketInstance.on('connect_error', onConnectError)

    // Backend: userId dari token — parameter emit diabaikan tapi tetap dikirim untuk kompatibilitas
    if (socketInstance.connected) {
      socketInstance.emit('join:user')
    } else {
      socketInstance.once('connect', () => socketInstance?.emit('join:user'))
    }

    // Sync initial connected state via callback to avoid lint rule
    const syncConnected = () => setIsConnected(socketInstance?.connected ?? false)
    queueMicrotask(syncConnected)

    return () => {
      socketInstance?.off('connect', onConnect)
      socketInstance?.off('disconnect', onDisconnect)
      socketInstance?.off('connect_error', onConnectError)
    }
  }, [accessToken])

  return { socket, isConnected }
}
