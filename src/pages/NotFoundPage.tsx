import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Icon icon="mdi:alert-circle-outline" className="text-8xl text-muted-foreground" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Halaman tidak ditemukan</p>
      <Button className="bg-wa-600 hover:bg-wa-700" onClick={() => navigate('/dashboard')}>
        <Icon icon="mdi:home" className="mr-2" />
        Kembali ke Dashboard
      </Button>
    </div>
  )
}
