import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Koneksi kembali normal')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Koneksi terputus. Beberapa fitur mungkin tidak tersedia.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
