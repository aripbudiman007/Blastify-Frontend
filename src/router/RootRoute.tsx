import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { LandingPage } from '@/pages/landing/LandingPage'

// Domain "app.*" (mis. app.blastify.id) selalu masuk ke aplikasi (login/dashboard),
// bukan landing page — meski sama-sama satu build/deployment Vercel.
const isAppDomain =
  typeof window !== 'undefined' && window.location.hostname.startsWith('app.')

export function RootRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAppDomain) {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
  }

  return <LandingPage />
}
