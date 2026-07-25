import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { APP_NAME } from '@/lib/constants'
import { Icon } from '@iconify/react'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'hsl(var(--sidebar))' }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, hsl(142 72% 29%) 0%, transparent 60%),
                              radial-gradient(circle at 80% 20%, hsl(217 91% 60%) 0%, transparent 60%)`,
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt={APP_NAME} className="w-10 h-10" />
          <span className="text-xl font-bold text-white tracking-tight">{APP_NAME}</span>
        </div>

        {/* Feature highlights */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Otomatisasi WhatsApp<br />untuk bisnis Anda
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: 'hsl(var(--sidebar-muted))' }}>
              Kirim pesan, kelola device, broadcast, dan auto-reply — semua dari satu dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: 'mdi:lightning-bolt', text: 'API cepat & mudah diintegrasikan' },
              { icon: 'mdi:shield-check',   text: 'Data Anda aman & terisolasi' },
              { icon: 'mdi:chart-line',     text: 'Analitik pesan real-time' },
              { icon: 'mdi:robot',          text: 'Auto-reply & broadcast massal' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-wa-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon icon={f.icon} className="text-wa-400 text-sm" />
                </div>
                <span className="text-sm" style={{ color: 'hsl(var(--sidebar-muted))' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs" style={{ color: 'hsl(var(--sidebar-muted))' }}>
          © {new Date().getFullYear()} {APP_NAME}. Unofficial WhatsApp Gateway.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo.png" alt={APP_NAME} className="w-9 h-9" />
            <span className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
