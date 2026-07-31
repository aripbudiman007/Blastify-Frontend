import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Kebijakan Privasi', icon: 'mdi:shield-lock-outline'   },
  { to: '/terms',   label: 'Syarat Layanan',    icon: 'mdi:file-document-outline' },
  { to: '/refund',  label: 'Kebijakan Refund',  icon: 'mdi:cash-refund'           },
]

function LegalNav() {
  return (
    <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt={APP_NAME} className="w-7 h-7" />
          <span className="font-bold text-gray-900 text-sm">{APP_NAME}</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
          <Icon icon="mdi:arrow-left" />
          Kembali ke Beranda
        </Link>
      </div>
    </header>
  )
}

function LegalFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>© {new Date().getFullYear()} {APP_NAME}. Seluruh hak dilindungi.</p>
        <div className="flex items-center gap-4">
          {LEGAL_LINKS.map(l => (
            <Link key={l.to} to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

interface LegalLayoutProps {
  title: string
  subtitle: string
  icon: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalLayout({ title, subtitle, icon, lastUpdated, children }: LegalLayoutProps) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <LegalNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-wa-600/20 border border-wa-600/30 flex items-center justify-center mx-auto">
            <Icon icon={icon} className="text-wa-400 text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
          <p className="text-slate-500 text-xs">Terakhir diperbarui: {lastUpdated}</p>
        </div>
      </div>

      {/* Sidebar nav + content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border p-4 space-y-1 lg:sticky lg:top-20">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
                Dokumen Legal
              </p>
              {LEGAL_LINKS.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === l.to
                      ? 'bg-wa-50 text-wa-700 border border-wa-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon icon={l.icon} className="text-base flex-shrink-0" />
                  {l.label}
                </Link>
              ))}
            </div>
          </aside>

          {/* Article content */}
          <main className="flex-1 min-w-0">
            <article className="bg-white rounded-xl border shadow-sm p-6 sm:p-8 lg:p-10 legal-content">
              {children}
            </article>
          </main>
        </div>
      </div>

      <LegalFooter />
    </div>
  )
}
