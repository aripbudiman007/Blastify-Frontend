import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { APP_NAME, MESSAGE_TYPE_LABELS } from '@/lib/constants'
import { planApi } from '@/api/plan.api'
import { integrationApi } from '@/api/integration.api'
import type { PublicPlan } from '@/types'

// ─── Blastify Brand Design Tokens ─────────────────────────────────────────────
// Source: Official Blastify Brand Identity Guide

const BR = {
  // Core palette
  green: '#00C853',   // Primary Green — CTAs, highlights
  deepGreen: '#1B5E20',   // Deep Green — premium dark headers/footers
  charcoal: '#1A1A2E',   // Tech Charcoal — dark section backgrounds
  slate: '#4A5568',   // Slate Gray — body text on light backgrounds
  teal: '#00E5CC',   // Electric Teal — gradients, hover highlights
  softWhite: '#F8FAFC',   // Soft White — light section backgrounds
  // Derived
  chipBg: '#E8F5E9',   // Badge background
  chipText: '#1B5E20',   // Badge text
  cardBorder: '#E2E8F0',   // Subtle card borders on light
  textDark: '#F1F5F9',   // Text on dark sections
  textDarkSub: 'rgba(241,245,249,.56)',
  textDarkMuted: 'rgba(241,245,249,.26)',
  darkBorder: 'rgba(255,255,255,.08)',
  darkBorderMid: 'rgba(255,255,255,.13)',
  // Gradient signatures
  gBrand: 'linear-gradient(135deg, #00C853 0%, #00E5CC 100%)',
  gDark: 'linear-gradient(135deg, #1A1A2E 0%, #1B5E20 100%)',
} as const

// Multi-layered premium shadow for cards on light bg
const shadowCard = '0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.05), 0 20px 48px rgba(0,0,0,.04)'
const shadowCardHover = '0 2px 8px rgba(0,0,0,.06), 0 8px 28px rgba(0,0,0,.08), 0 28px 56px rgba(0,0,0,.06)'

const noiseUrl = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E\")"

type CodePart = { c: string; t: string }
type CodeLine = { parts: CodePart[] }

const COLOR_MAP: Record<string, string> = {
  'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1', 'slate-400': '#94a3b8', 'slate-500': '#6b7280',
  'amber-300': '#fcd34d', 'emerald-400': '#34d399', 'blue-300': '#93c5fd',
  'purple-400': '#c084fc', 'wa-400': '#00E676',
}


// ─── Chip / Badge component ───────────────────────────────────────────────────

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1 tracking-wide', className)}
      style={{ background: BR.chipBg, color: BR.chipText }}>
      {children}
    </span>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-500')}
      style={scrolled
        ? { background: 'rgba(26,26,46,.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${BR.darkBorder}`, boxShadow: '0 4px 24px rgba(0,0,0,.24)' }
        : { background: 'transparent' }}>

      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <img src="/logo.png" alt={APP_NAME} className="w-8 h-8 transition-shadow duration-300 group-hover:shadow-[0_0_0_3px_rgba(0,200,83,.25)]" />
          <span className="font-heading font-bold text-[15.5px] tracking-tight text-white">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            ['#features', 'Fitur'],
            ['#integrations', 'Integrasi'],
            ['#pricing', 'Harga'],
            ['#faq', 'FAQ'],
            ['/docs', 'API Docs'],
          ].map(([href, label]) => {
            const isRoute = href.startsWith('/')
            const cls = "relative text-[13.5px] font-medium transition-all duration-200"
            const style = { color: 'rgba(241,245,249,.62)', textDecoration: 'none' }
            const enter = (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = BR.textDark }
            const leave = (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = 'rgba(241,245,249,.62)' }
            return isRoute
              ? <Link key={href} to={href} className={cls} style={style} onMouseEnter={enter} onMouseLeave={leave}>{label}</Link>
              : <a key={href} href={href} className={cls} style={style} onMouseEnter={enter} onMouseLeave={leave}>{label}</a>
          })}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login"
            className="text-[13.5px] font-medium px-4 py-2 rounded-lg transition-all duration-200"
            style={{ color: 'rgba(241,245,249,.62)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BR.textDark; (e.currentTarget as HTMLElement).style.background = BR.darkBorder }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(241,245,249,.62)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            Masuk
          </Link>
          {/* Primary CTA — Brand Green, radius 8px per spec */}
          <Link to="/register"
            className="text-white text-[13.5px] font-semibold px-5 py-2 rounded-lg transition-all duration-300 hover:-translate-y-px hover:scale-[1.02]"
            style={{ background: BR.green, boxShadow: '0 2px 14px rgba(0,200,83,.38)', borderRadius: 8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BR.teal; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 22px rgba(0,229,204,.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BR.green; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(0,200,83,.38)' }}>
            Mulai gratis
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-xl transition-colors text-white"
          onClick={() => setMenuOpen(!menuOpen)}>
          <Icon icon={menuOpen ? 'mdi:close' : 'mdi:menu'} className="text-xl" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'rgba(26,26,46,.97)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${BR.darkBorder}` }}>
          <div className="px-6 py-4 space-y-1">
            {[['#features', 'Fitur'], ['#integrations', 'Integrasi'], ['#pricing', 'Harga'], ['#faq', 'FAQ'], ['/docs', 'API Docs']].map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{ color: BR.textDarkSub }}>
                {l}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${BR.darkBorder}` }}>
              <Link to="/login" className="block px-3 py-2.5 text-sm rounded-xl" style={{ color: BR.textDarkSub }}>Masuk</Link>
              <Link to="/register" className="block text-white text-sm font-semibold px-3 py-2.5 text-center"
                style={{ background: BR.green, borderRadius: 8 }}>
                Mulai gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function WaChatMockup() {
  return (
    <div className="relative select-none flex flex-col items-center" style={{ width: 310, animation: 'lp-float 6s ease-in-out infinite' }}>

      {/* Soft ambient halo */}
      <div className="absolute inset-[-20px] rounded-[50px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,200,83,.09) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Phone shell — 310 px */}
      <div className="relative rounded-[38px] overflow-hidden"
        style={{
          width: 310,
          background: '#111b21',
          border: '1.5px solid rgba(255,255,255,.1)',
          boxShadow: '0 40px 90px rgba(0,0,0,.7), 0 10px 36px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)',
        }}>

        {/* Pill notch */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-20 h-[5px] rounded-full" style={{ background: 'rgba(255,255,255,.08)' }} />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="text-white text-[10.5px] font-semibold tracking-tight">09:41</span>
          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,.65)' }}>
            <Icon icon="mdi:signal" style={{ fontSize: 10 }} />
            <Icon icon="mdi:wifi" style={{ fontSize: 10 }} />
            <Icon icon="mdi:battery" style={{ fontSize: 10 }} />
          </div>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: '#182026' }}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>NR</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold leading-tight">Nadia Rahma</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: BR.green }} />
              <p className="text-[9.5px]" style={{ color: 'rgba(255,255,255,.38)' }}>online</p>
            </div>
          </div>
          {/* Bot indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,200,83,.12)', border: '1px solid rgba(0,200,83,.2)' }}>
            <Icon icon="mdi:robot" style={{ color: BR.green, fontSize: 9 }} />
            <span className="text-[8.5px] font-bold" style={{ color: BR.green }}>AUTO</span>
          </div>
        </div>

        {/* Message thread */}
        <div className="px-3 py-3 space-y-2 bg-[#0b141a]" style={{ minHeight: 305 }}>
          {/* Date divider */}
          <div className="flex justify-center mb-1">
            <span className="text-[9px] px-2.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.35)' }}>
              Hari ini
            </span>
          </div>

          {/* Outgoing — order confirmation (triggered by webhook) */}
          <div className="flex justify-end">
            <div className="rounded-[13px] rounded-tr-[4px] px-3 py-2.5 max-w-[87%]"
              style={{ background: '#005c4b' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,229,204,.2)', color: '#00E5CC' }}>✓ ORDER #2847</span>
              </div>
              <p className="text-white text-[11.5px] leading-[1.55]">
                Halo Nadia, pesanan <span className="font-semibold">Serum Vitamin C 30ml</span> sudah kami terima! 🎉{'\n'}
                Estimasi: <span className="font-semibold">2–3 hari kerja.</span>
              </p>
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>10:02</span>
                <Icon icon="mdi:check-all" style={{ color: '#53d5a2', fontSize: 10 }} />
              </div>
            </div>
          </div>

          {/* Incoming — customer question */}
          <div className="flex justify-start">
            <div className="rounded-[13px] rounded-tl-[4px] px-3 py-2 max-w-[80%]"
              style={{ background: '#202c33' }}>
              <p className="text-white text-[11.5px] leading-[1.5]">
                Kak, bisa lacak pesanannya di mana ya? 😊
              </p>
              <span style={{ fontSize: 9, display: 'block', textAlign: 'right', marginTop: 3, color: 'rgba(255,255,255,.32)' }}>10:11</span>
            </div>
          </div>

          {/* Outgoing — auto-reply with tracking */}
          <div className="flex justify-end">
            <div className="rounded-[13px] rounded-tr-[4px] px-3 py-2.5 max-w-[88%]"
              style={{ background: '#005c4b' }}>
              <p className="text-white text-[11.5px] leading-[1.55]">
                Bisa dicek di 👉 <span className="underline text-emerald-300">shopee.co.id/track</span>{'\n'}
                No. resi: <span className="font-semibold font-mono">JNE891234567</span> 📦
              </p>
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>10:11</span>
                <Icon icon="mdi:check-all" style={{ color: '#53d5a2', fontSize: 10 }} />
              </div>
            </div>
          </div>

          {/* Incoming */}
          <div className="flex justify-start">
            <div className="rounded-[13px] rounded-tl-[4px] px-3 py-2 max-w-[65%]"
              style={{ background: '#202c33' }}>
              <p className="text-white text-[11.5px]">Makasih banyak kak! 🙏💚</p>
              <span style={{ fontSize: 9, display: 'block', textAlign: 'right', marginTop: 3, color: 'rgba(255,255,255,.32)' }}>10:12</span>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#111b21' }}>
          <div className="flex-1 rounded-full px-3.5 py-1.5 text-[11px]"
            style={{ background: '#2a3942', color: 'rgba(255,255,255,.25)' }}>
            Ketik pesan...
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: BR.gBrand }}>
            <Icon icon="mdi:microphone" className="text-white" style={{ fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* Stat strip — sits below the phone in normal flow, no overlap */}
      <div className="relative w-[92%]"
        style={{
          marginTop: 14,
          background: 'rgba(11,20,26,.96)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 14,
          padding: '11px 16px',
          boxShadow: '0 16px 40px rgba(0,0,0,.4)',
          display: 'flex',
          alignItems: 'center',
        }}>
        {[
          { val: '1.248', lbl: 'terkirim' },
          { val: '94%', lbl: 'delivered' },
          { val: '<1 dtk', lbl: 'auto-reply' },
        ].map((s, i) => (
          <div key={s.lbl} className="flex-1 text-center" style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,.08)' } : undefined}>
            <p className="text-[13px] font-bold leading-none" style={{ color: BR.textDark }}>{s.val}</p>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,.35)' }}>{s.lbl}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
      style={{ background: BR.charcoal }}>

      {/* Organic Background Blobs */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: noiseUrl, backgroundRepeat: 'repeat', backgroundSize: '150px 150px', opacity: 0.6 }} />
      <div className="pointer-events-none absolute -top-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(0,200,83,.08) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      <div className="pointer-events-none absolute bottom-0 -left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(0,229,204,.06) 0%, transparent 70%)', filter: 'blur(70px)' }} />

      <div className="relative max-w-[1200px] mx-auto px-6 w-full z-10 flex flex-col lg:flex-row items-center">

        {/* Left: Breaking the grid Typography */}
        <div className="lg:w-[65%] relative z-30 pt-10 lg:pt-0">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/10"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Icon icon="mdi:whatsapp" style={{ color: BR.green, fontSize: 13 }} />
            <span className="text-[11.5px] font-semibold text-slate-300">
              Unofficial WhatsApp Gateway — tanpa syarat WhatsApp Business API resmi
            </span>
          </div>

          <h1 className="mb-8 relative">
            <span className="block font-extrabold text-white leading-[1.02]"
              style={{ fontSize: 'clamp(40px, 5vw, 60px)', letterSpacing: '-0.02em' }}>
              WhatsApp Gateway untuk broadcast,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: BR.gBrand }}>
                auto-reply, dan webhook
              </span>
              , dalam satu API.
            </span>
          </h1>

          <p className="text-[18px] font-medium leading-relaxed max-w-[520px] mb-12 text-slate-300">
            Kirim ribuan pesan dengan delay anti-ban, balas chat otomatis 24 jam, dan hubungkan ke Shopify, WooCommerce, atau sistem Anda sendiri lewat webhook.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2.5 text-white font-bold px-7 py-3.5 text-[15px] rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: BR.green, boxShadow: '0 12px 32px rgba(0,200,83,.32)' }}>
              Mulai Gratis
              <Icon icon="mdi:arrow-right" className="text-base" />
            </Link>
            <a href="#api" className="px-6 py-3.5 text-[14.5px] font-semibold text-slate-300 hover:text-white transition-colors">
              Lihat Dokumentasi API
            </a>
          </div>
        </div>

        {/* Right: Floating Mockup deeply overlapping */}
        <div className="lg:w-[45%] lg:absolute lg:right-0 lg:translate-x-[5%] mt-16 lg:mt-0 relative z-20 flex justify-center perspective-1000">
          <div className="relative transform lg:rotate-y-[-15deg] lg:rotate-x-[5deg] hover:rotate-y-0 transition-transform duration-700 ease-out">
            <div className="absolute inset-0 bg-black/50 blur-[50px] rounded-[50px] transform translate-y-10 scale-90" />
            <WaChatMockup />
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Logos bar (Light) ────────────────────────────────────────────────────────

function LogosBar() {
  // Real brand logos via @iconify-json/simple-icons (installed locally)
  const logos = [
    { icon: 'simple-icons:shopify', name: 'Shopify', color: '#7AB55C' },
    { icon: 'simple-icons:woocommerce', name: 'WooCommerce', color: '#96588A' },
    { icon: 'simple-icons:jotform', name: 'Jotform', color: '#FF6100' },
    { icon: 'simple-icons:n8n', name: 'n8n', color: '#EA4B71' },
    { icon: 'simple-icons:zapier', name: 'Zapier', color: '#FF4A00' },
    { icon: 'simple-icons:make', name: 'Make', color: '#6D00CC' },
    { icon: 'simple-icons:typeform', name: 'Typeform', color: '#0AAF60' },
    { icon: 'simple-icons:bitrix24', name: 'Bitrix24', color: '#2FC7F7' },
    { icon: 'simple-icons:zoho', name: 'Zoho CRM', color: '#E42527' },
    { icon: 'simple-icons:webflow', name: 'Webflow', color: '#4353FF' },
  ]

  return (
    // ── LIGHT SECTION — transition bridge ──
    <div className="relative overflow-hidden py-10"
      style={{ background: BR.softWhite, borderBottom: `1px solid ${BR.cardBorder}` }}>
      {/* Fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-36 z-10"
        style={{ background: `linear-gradient(to right, ${BR.softWhite}, transparent)` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-36 z-10"
        style={{ background: `linear-gradient(to left, ${BR.softWhite}, transparent)` }} />

      <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.2em] mb-7"
        style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
        Terintegrasi dengan platform favorit Anda
      </p>

      {/* Marquee — brand icon + name side-by-side */}
      <div className="flex items-center animate-[marquee_32s_linear_infinite] w-max">
        {[...logos, ...logos].map((logo, i) => (
          <span key={i}
            className="inline-flex items-center gap-2.5 px-8 cursor-default group"
            style={{ whiteSpace: 'nowrap' }}>
            {/* Brand icon — muted default, brand-colored on hover */}
            <Icon
              icon={logo.icon}
              className="text-[18px] transition-all duration-300 flex-shrink-0"
              style={{ color: '#CBD5E1' }}
              onMouseEnter={e => { (e.currentTarget as unknown as HTMLElement).style.color = logo.color }}
              onMouseLeave={e => { (e.currentTarget as unknown as HTMLElement).style.color = '#CBD5E1' }}
            />
            <span
              className="text-[12.5px] font-semibold transition-colors duration-300"
              style={{ color: '#CBD5E1' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BR.slate }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#CBD5E1' }}>
              {logo.name}
            </span>
            {/* Separator dot */}
            <span className="w-[3px] h-[3px] rounded-full ml-3 flex-shrink-0"
              style={{ background: '#E2E8F0' }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Features — 12-column Bento on Light ─────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-28" style={{ background: BR.softWhite }}>
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Header — left-anchored, asymmetric with right CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: BR.green }}>Platform</p>
            <h2 className="font-black leading-[1.08] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(30px, 3.5vw, 44px)', color: BR.charcoal }}>
              Satu dasbor.<br />Semua yang bisnis Anda butuhkan.
            </h2>
          </div>
          <Link to="/register"
            className="flex-shrink-0 self-start sm:self-auto text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5"
            style={{ color: BR.green, border: `1.5px solid rgba(0,200,83,.35)`, background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BR.chipBg; (e.currentTarget as HTMLElement).style.borderColor = BR.green }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,83,.35)' }}>
            Lihat semua fitur →
          </Link>
        </div>

        {/* ── Asymmetric 12-col bento — NO ICON CIRCLES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 auto-rows-auto">

          {/* ── 01 · BROADCAST — dark hero card, col 1-7, rows 1-2 ── */}
          <div className="col-span-1 md:col-span-2 lg:col-start-1 lg:col-span-7 lg:row-start-1 lg:row-span-2
            rounded-[22px] relative overflow-hidden flex flex-col lg:min-h-[356px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,.07)', boxShadow: '0 12px 48px rgba(0,0,0,.35)' }}>

            {/* Noise */}
            <div className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: noiseUrl, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
            {/* Green top-left glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(0,200,83,.18) 0%, transparent 70%)', filter: 'blur(32px)' }} />
            {/* Watermark "01" — massive, ghost */}
            <div className="pointer-events-none absolute bottom-0 right-0 font-black leading-none select-none"
              style={{ fontSize: 200, color: 'rgba(255,255,255,.025)', lineHeight: 0.82, fontFamily: 'inherit' }}>
              01
            </div>

            <div className="relative flex-1 flex flex-col p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-5"
                style={{ color: 'rgba(0,200,83,.65)' }}>Broadcast</p>
              <h3 className="font-black text-[26px] leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ color: '#F1F5F9' }}>
                Kirim ke ribuan kontak.<br />Tepat waktu, tiap hari.
              </h3>
              <p className="text-[14px] leading-[1.75] max-w-sm"
                style={{ color: 'rgba(241,245,249,.45)' }}>
                Delay acak anti-ban built-in. Teks, gambar, video, dokumen.
                Jadwalkan broadcast di momen paling efektif.
              </p>

              {/* Message queue mockup — no icon, pure data UI */}
              <div className="mt-auto pt-6 space-y-2">
                {[
                  { phone: '+62812 ×××× 7731', preview: 'Flash sale KAOS PREMIUM — diskon 35%...', sent: true },
                  { phone: '+62857 ×××× 0294', preview: 'Pesanan #INV-4872 sudah dikemas 📦', sent: true },
                  { phone: '+62878 ×××× 5518', preview: 'Menyiapkan pesan...', sent: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: row.sent ? BR.green : 'rgba(241,245,249,.2)' }} />
                    <span className="text-[10.5px] font-mono flex-shrink-0 w-[130px]"
                      style={{ color: 'rgba(241,245,249,.38)' }}>{row.phone}</span>
                    <span className="text-[11.5px] flex-1 truncate"
                      style={{ color: 'rgba(241,245,249,.55)' }}>{row.preview}</span>
                    <span className="text-[9.5px] font-bold tracking-wide flex-shrink-0"
                      style={{ color: row.sent ? BR.green : 'rgba(241,245,249,.28)' }}>
                      {row.sent ? '✓ Terkirim' : 'Antrian'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex gap-8 mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                {[['10K+', 'pesan/hari'], ['< 3 dtk', 'avg delay'], ['99%', 'delivery']].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-black text-[20px] leading-none tracking-tight" style={{ color: '#F1F5F9' }}>{v}</p>
                    <p className="text-[10.5px] mt-1.5" style={{ color: 'rgba(241,245,249,.3)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 02 · AUTO-REPLY — light, col 8-12, row 1 ── */}
          <div className="lg:col-start-8 lg:col-span-5 lg:row-start-1 rounded-[22px] bg-white overflow-hidden
            flex flex-col relative transition-all duration-300 hover:-translate-y-1"
            style={{ border: `1px solid ${BR.cardBorder}`, boxShadow: shadowCard }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCardHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCard }}>
            {/* Ghost watermark */}
            <div className="pointer-events-none absolute top-0 right-0 font-black leading-none select-none"
              style={{ fontSize: 100, color: 'rgba(0,0,0,.03)', lineHeight: 0.82, fontFamily: 'inherit' }}>
              02
            </div>
            <div className="p-6 flex-1 flex flex-col relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                style={{ color: BR.green }}>Auto-Reply</p>
              <h3 className="font-black text-[21px] leading-[1.1] tracking-[-0.015em] mb-4"
                style={{ color: BR.charcoal }}>
                Bales otomatis,<br />24 jam non-stop.
              </h3>

              {/* Regex matcher UI — replaces icon circle */}
              <div className="rounded-xl overflow-hidden flex-shrink-0 mb-4"
                style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="px-3 py-2 text-[11px] font-mono"
                  style={{ borderBottom: '1px solid rgba(255,255,255,.06)', color: '#475569' }}>
                  <span className="text-[#64748b]">INPUT:</span>{' '}
                  <span>minta info </span>
                  <span style={{ color: '#fcd34d', background: 'rgba(252,211,77,.12)', padding: '0 3px', borderRadius: 3 }}>harga</span>
                  <span> dong</span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
                      style={{ background: 'rgba(0,200,83,.18)', color: '#00C853' }}>CONTAINS</span>
                    <span style={{ color: '#fcd34d' }}>"harga"</span>
                    <span className="ml-auto font-bold" style={{ color: '#34d399' }}>→ Reply dikirim</span>
                  </div>
                </div>
              </div>

              <p className="text-[13.5px] leading-relaxed" style={{ color: BR.slate }}>
                Balas otomatis berdasarkan kata kunci — exact, contains, regex.
                Aktif 24/7 tanpa biaya tambahan.
              </p>
            </div>
          </div>

          {/* ── 03 · WEBHOOK — light, col 8-12, row 2 ── */}
          <div className="lg:col-start-8 lg:col-span-5 lg:row-start-2 rounded-[22px] bg-white overflow-hidden
            flex flex-col relative transition-all duration-300 hover:-translate-y-1"
            style={{ border: `1px solid ${BR.cardBorder}`, boxShadow: shadowCard }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCardHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCard }}>
            <div className="pointer-events-none absolute top-0 right-0 font-black leading-none select-none"
              style={{ fontSize: 100, color: 'rgba(0,0,0,.03)', lineHeight: 0.82, fontFamily: 'inherit' }}>
              03
            </div>
            <div className="p-6 flex-1 flex flex-col relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                style={{ color: '#7C3AED' }}>Webhook</p>
              <h3 className="font-black text-[21px] leading-[1.1] tracking-[-0.015em] mb-4"
                style={{ color: BR.charcoal }}>
                Hubungkan platform<br />tanpa nulis kode.
              </h3>

              {/* Webhook URL mockup — replaces purple icon circle */}
              <div className="rounded-xl overflow-hidden mb-4 flex-shrink-0"
                style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(139,92,246,.22)', color: '#a78bfa' }}>POST</span>
                  <span className="text-[10.5px] font-mono truncate flex-1"
                    style={{ color: '#64748b' }}>blastify.id/integrations/receive/</span>
                  <span className="text-[10.5px] font-mono"
                    style={{ color: '#94a3b8' }}>tok_x9k2…</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: BR.green }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#34d399' }}>Connected — menunggu event</span>
                </div>
              </div>

              <p className="text-[13.5px] leading-relaxed" style={{ color: BR.slate }}>
                Shopify, WooCommerce, Jotform, Typeform, dan 25+ platform lain.
              </p>
            </div>
          </div>

          {/* ── 04 · MULTI-DEVICE — light, col 1-5, row 3 ── */}
          <div className="lg:col-start-1 lg:col-span-5 lg:row-start-3 rounded-[22px] bg-white overflow-hidden
            flex flex-col relative transition-all duration-300 hover:-translate-y-1"
            style={{ border: `1px solid ${BR.cardBorder}`, boxShadow: shadowCard }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCardHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCard }}>
            <div className="pointer-events-none absolute top-0 right-0 font-black leading-none select-none"
              style={{ fontSize: 100, color: 'rgba(0,0,0,.03)', lineHeight: 0.82, fontFamily: 'inherit' }}>
              04
            </div>
            <div className="p-6 flex-1 flex flex-col relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                style={{ color: '#F43F5E' }}>Multi-Device</p>
              <h3 className="font-black text-[21px] leading-[1.1] tracking-[-0.015em] mb-4"
                style={{ color: BR.charcoal }}>
                Banyak nomor,<br />satu dashboard.
              </h3>

              {/* Device status list — replaces rose icon circle */}
              <div className="space-y-2 mb-4">
                {[
                  { name: 'Device Utama', status: 'Connected', active: true },
                  { name: 'CS Jakarta', status: 'Connected', active: true },
                  { name: 'CS Surabaya', status: 'Standby', active: false },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ background: d.active ? 'rgba(0,200,83,.06)' : 'rgba(0,0,0,.03)', border: `1px solid ${d.active ? 'rgba(0,200,83,.15)' : BR.cardBorder}` }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: d.active ? BR.green : '#CBD5E1' }} />
                    <span className="text-[12px] font-semibold flex-1" style={{ color: BR.charcoal }}>{d.name}</span>
                    <span className="text-[10px] font-medium" style={{ color: d.active ? BR.green : BR.slate }}>{d.status}</span>
                  </div>
                ))}
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: BR.slate }}>
                Kelola banyak nomor WhatsApp. Agen tim dengan role berbeda.
              </p>
            </div>
          </div>

          {/* ── 05 · CONTACTS — light, col 6-12, row 3 ── */}
          <div className="lg:col-start-6 lg:col-span-7 lg:row-start-3 rounded-[22px] bg-white overflow-hidden
            flex flex-col relative transition-all duration-300 hover:-translate-y-1"
            style={{ border: `1px solid ${BR.cardBorder}`, boxShadow: shadowCard }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCardHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = shadowCard }}>
            <div className="pointer-events-none absolute top-0 right-0 font-black leading-none select-none"
              style={{ fontSize: 100, color: 'rgba(0,0,0,.03)', lineHeight: 0.82, fontFamily: 'inherit' }}>
              05
            </div>
            <div className="p-6 flex-1 flex flex-col relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                style={{ color: '#D97706' }}>Kontak</p>
              <h3 className="font-black text-[21px] leading-[1.1] tracking-[-0.015em] mb-4"
                style={{ color: BR.charcoal }}>
                Segmentasi tepat,<br />broadcast relevan.
              </h3>

              {/* Mini contact table — replaces amber icon circle */}
              <div className="rounded-xl overflow-hidden mb-4 flex-shrink-0"
                style={{ border: `1px solid ${BR.cardBorder}` }}>
                <div className="grid grid-cols-3 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-widest"
                  style={{ background: BR.softWhite, color: BR.slate, borderBottom: `1px solid ${BR.cardBorder}` }}>
                  <span>Nama</span><span>Telepon</span><span>Label</span>
                </div>
                {[
                  { name: 'Reza Firmansyah', phone: '0812 ×××× 4521', label: 'VIP' },
                  { name: 'Laila Kusuma', phone: '0857 ×××× 8823', label: 'Prospect' },
                ].map((c, i) => (
                  <div key={i} className="grid grid-cols-3 px-3 py-2 text-[11px]"
                    style={{ borderBottom: i === 0 ? `1px solid ${BR.cardBorder}` : 'none', color: BR.charcoal }}>
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="font-mono" style={{ color: BR.slate }}>{c.phone}</span>
                    <span className="font-semibold px-1.5 py-0.5 rounded-full w-fit text-[9.5px]"
                      style={{ background: BR.chipBg, color: BR.chipText }}>{c.label}</span>
                  </div>
                ))}
                <div className="px-3 py-2 text-[10.5px]" style={{ color: BR.slate, background: 'rgba(0,0,0,.02)' }}>
                  + 4.892 kontak lainnya
                </div>
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: BR.slate }}>
                Import CSV, label warna, variabel kustom. Import langsung dari WA Group.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── API Section — Dark ───────────────────────────────────────────────────────

function CodeBlock({ label, badge, lines }: { label: string; badge?: string; lines: CodeLine[] }) {
  return (
    <div className="rounded-[16px] overflow-hidden group transition-all duration-500"
      style={{ background: '#09090C', border: '1px solid rgba(255,255,255,.06)', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: 'rgba(255,255,255,.02)' }}>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <span className="text-[12px] font-mono text-slate-400">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide"
            style={{ color: BR.green, background: 'rgba(0,200,83,.1)', border: '1px solid rgba(0,200,83,.2)' }}>
            {badge}
          </span>
        )}
      </div>
      {/* Code Body - using whitespace-pre to respect exact spaces */}
      <div className="py-4 text-[13px] font-mono leading-[1.7] overflow-x-auto whitespace-pre">
        {lines.map((line, li) => (
          <div key={li} className="flex hover:bg-white/[0.02] px-4 transition-colors">
            {/* Line Number */}
            <span className="w-6 shrink-0 text-right pr-4 text-slate-600 select-none text-[11px] pt-[2px]">
              {li + 1}
            </span>
            {/* Code */}
            <div className="flex-1">
              {line.parts.map((part, pi) => (
                <span key={pi} style={{ color: COLOR_MAP[part.c] ?? '#94a3b8' }}>{part.t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApiSection() {
  return (
    <section id="api" className="py-32 relative overflow-hidden" style={{ background: BR.charcoal }}>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: noiseUrl, opacity: 0.5 }} />

      <div className="relative max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[42%_58%] gap-12 lg:gap-24 items-center">
        {/* Left: Explanations - Breaking the grid with overlapping text */}
        <div className="order-2 lg:order-1 relative z-20 lg:pt-10">
          <div className="absolute -left-10 -top-10 text-[120px] font-black opacity-5 pointer-events-none select-none">
            API
          </div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-md text-[11px] font-bold tracking-widest"
            style={{ background: 'rgba(0,200,83,.1)', color: BR.green }}>
            <Icon icon="mdi:code-braces" /> BUILT FOR DEVELOPERS
          </div>
          <h2 className="font-black tracking-[-0.03em] leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(38px, 4vw, 56px)', color: BR.textDark }}>
            Integrasi secepat minum kopi.
          </h2>
          <p className="text-[16px] leading-[1.8] mb-10 text-slate-300 font-medium">
            Dokumentasi lengkap, format JSON murni, dan Webhook yang merespons dalam hitungan milidetik. Kami membangun API yang tidak akan membuat Anda pusing.
          </p>

          <div className="flex flex-col gap-6">
            {[
              { title: 'REST API Standar Industri', desc: 'Endpoint JSON konsisten, mudah diintegrasikan dari bahasa atau framework apa pun.' },
              { title: 'Format JSON Konsisten', desc: 'Satu struktur response untuk semua endpoint. Mudah di-parse.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 border border-emerald-500/20">
                  <Icon icon="mdi:check" className="text-[12px] text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[15px] mb-1">{item.title}</h4>
                  <p className="text-[13.5px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Terminal with exact tabbing */}
        <div className="order-1 lg:order-2 relative group">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full opacity-20 blur-[100px] transition-opacity group-hover:opacity-40"
            style={{ background: BR.green }} />

          <div className="space-y-6 relative z-10 transform lg:rotate-y-[-4deg] lg:rotate-x-[2deg] transition-transform duration-700 hover:rotate-0 hover:scale-[1.02]">
            {/* Request with proper spaces */}
            <CodeBlock label="POST /api/v1/messages/send" badge="cURL" lines={[
              { parts: [{ c: 'purple-400', t: 'curl' }, { c: 'slate-300', t: ' -s -X POST \\' }] },
              { parts: [{ c: 'slate-300', t: '  ' }, { c: 'amber-300', t: 'https://api.blastify.id/api/v1/messages/send \\' }] },
              { parts: [{ c: 'slate-300', t: '  -H ' }, { c: 'blue-300', t: '"Content-Type: application/json" \\' }] },
              { parts: [{ c: 'slate-300', t: '  -H ' }, { c: 'blue-300', t: '"Authorization: Bearer ' }, { c: 'emerald-400', t: 'bfy_live_xK9mP…' }, { c: 'blue-300', t: '" \\' }] },
              { parts: [{ c: 'slate-300', t: '  -d ' }, { c: 'slate-300', t: "'{" }] },
              { parts: [{ c: 'blue-300', t: '    "deviceId"' }, { c: 'slate-400', t: ': ' }, { c: 'amber-300', t: '"dev_6a3f9c"' }, { c: 'slate-400', t: ',' }] },
              { parts: [{ c: 'blue-300', t: '    "to"' }, { c: 'slate-400', t: ':       ' }, { c: 'amber-300', t: '"628156789012"' }, { c: 'slate-400', t: ',' }] },
              { parts: [{ c: 'blue-300', t: '    "type"' }, { c: 'slate-400', t: ':     ' }, { c: 'amber-300', t: '"TEXT"' }, { c: 'slate-400', t: ',' }] },
              { parts: [{ c: 'blue-300', t: '    "message"' }, { c: 'slate-400', t: ':  ' }, { c: 'amber-300', t: '"Pesanan #4821 dikirim 🚚"' }] },
              { parts: [{ c: 'slate-300', t: "  }'" }] },
            ]} />

            {/* Response */}
            <div className="ml-0 lg:ml-12 relative">
              {/* Connector line for visual hierarchy */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-white/10 hidden lg:block" />
              <CodeBlock label="200 OK" badge="JSON" lines={[
                { parts: [{ c: 'slate-300', t: '{' }] },
                { parts: [{ c: 'blue-300', t: '  "success"' }, { c: 'slate-400', t: ': ' }, { c: 'emerald-400', t: 'true' }, { c: 'slate-500', t: ',' }] },
                { parts: [{ c: 'blue-300', t: '  "data"' }, { c: 'slate-400', t: ': {' }] },
                { parts: [{ c: 'blue-300', t: '    "id"' }, { c: 'slate-400', t: ':     ' }, { c: 'amber-300', t: '"msg_8xKq2r"' }, { c: 'slate-400', t: ',' }] },
                { parts: [{ c: 'blue-300', t: '    "status"' }, { c: 'slate-400', t: ': ' }, { c: 'amber-300', t: '"QUEUED"' }] },
                { parts: [{ c: 'slate-400', t: '  }' }] },
                { parts: [{ c: 'slate-300', t: '}' }] },
              ]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Integrations — Light ─────────────────────────────────────────────────────

function IntegrationsSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')

  const items = [
    // ── E-Commerce ──
    { name: 'Shopify',     icon: 'simple-icons:shopify',           cat: 'E-Commerce', color: '#7AB55C' },
    { name: 'WooCommerce', icon: 'simple-icons:woocommerce',       cat: 'E-Commerce', color: '#96588A' },
    { name: 'BigCommerce', icon: 'simple-icons:bigcommerce',       cat: 'E-Commerce', color: '#34313F' },
    { name: 'Magento 2',   icon: 'simple-icons:magento',           cat: 'E-Commerce', color: '#EE672F' },
    { name: 'Swell',       icon: 'mdi:waves',                      cat: 'E-Commerce', color: '#6C47FF' },
    { name: 'CS-Cart',     icon: 'mdi:cart-variant',               cat: 'E-Commerce', color: '#E65F2B' },
    { name: 'Zen Cart',    icon: 'mdi:cart-outline',               cat: 'E-Commerce', color: '#4A90D9' },
    { name: 'Berdu',       icon: 'mdi:storefront-outline',         cat: 'E-Commerce', color: '#0EA5E9' },
    { name: 'Sejoli',      icon: 'mdi:shopping-outline',           cat: 'E-Commerce', color: '#F59E0B' },
    { name: 'CepatLakoo',  icon: 'mdi:rocket-launch-outline',      cat: 'E-Commerce', color: '#EF4444' },
    // ── Form & Sheet ──
    { name: 'Google Forms',  icon: 'simple-icons:googleforms',     cat: 'Form & Sheet', color: '#673AB7' },
    { name: 'Google Sheets', icon: 'simple-icons:googlesheets',    cat: 'Form & Sheet', color: '#34A853' },
    { name: 'Jotform',       icon: 'mdi:clipboard-list-outline',    cat: 'Form & Sheet', color: '#FF6100' },
    { name: 'Formstack',     icon: 'mdi:form-select',              cat: 'Form & Sheet', color: '#21A7E0' },
    // ── Otomasi ──
    { name: 'Zapier',       icon: 'simple-icons:zapier',            cat: 'Otomasi', color: '#FF4A00' },
    { name: 'Make',         icon: 'simple-icons:make',              cat: 'Otomasi', color: '#6D00CC' },
    { name: 'Integromat',   icon: 'simple-icons:make',              cat: 'Otomasi', color: '#A259FF' },
    { name: 'n8n',          icon: 'simple-icons:n8n',               cat: 'Otomasi', color: '#EA4B71' },
    { name: 'Pabbly',       icon: 'mdi:autorenew',                  cat: 'Otomasi', color: '#6366F1' },
    { name: 'Integrately',  icon: 'mdi:transit-connection-variant', cat: 'Otomasi', color: '#F97316' },
    { name: 'Superblocks',  icon: 'mdi:code-braces',                cat: 'Otomasi', color: '#5E6AD2' },
    { name: 'Generic API',  icon: 'mdi:api',                        cat: 'Otomasi', color: '#00C853' },
    // ── CRM & Keuangan ──
    { name: 'Zoho',        icon: 'simple-icons:zoho',              cat: 'CRM & Keuangan', color: '#E42527' },
    { name: 'Bitrix24',    icon: 'mdi:hexagon-multiple-outline',    cat: 'CRM & Keuangan', color: '#2FC7F7' },
    { name: 'QuickBooks',  icon: 'simple-icons:quickbooks',        cat: 'CRM & Keuangan', color: '#2CA01C' },
    { name: 'Square',      icon: 'simple-icons:square',            cat: 'CRM & Keuangan', color: '#3E4348' },
    { name: 'FastSpring',  icon: 'mdi:lightning-bolt-outline',     cat: 'CRM & Keuangan', color: '#00B388' },
    { name: 'Vend',        icon: 'mdi:cash-register',              cat: 'CRM & Keuangan', color: '#1EC5E0' },
    // ── Website & CMS ──
    { name: 'Webflow',     icon: 'simple-icons:webflow',           cat: 'Website & CMS', color: '#4353FF' },
    { name: 'Wix',         icon: 'simple-icons:wix',               cat: 'Website & CMS', color: '#FAAD4D' },
    { name: 'GoDaddy',     icon: 'simple-icons:godaddy',           cat: 'Website & CMS', color: '#1BDBDB' },
    { name: 'LSD Plugins', icon: 'simple-icons:wordpress',         cat: 'Website & CMS', color: '#21759B' },
    { name: 'WPAff WA',    icon: 'mdi:whatsapp',                   cat: 'Website & CMS', color: '#00C853' },
    // ── Lokal Indonesia ──
    { name: 'SLiMS',     icon: 'mdi:library-outline',    cat: 'Lokal', color: '#1565C0' },
    { name: 'Mixradius', icon: 'mdi:bullseye-arrow',     cat: 'Lokal', color: '#FF6B35' },
    { name: 'OpenSID',   icon: 'mdi:home-city-outline',  cat: 'Lokal', color: '#B71C1C' },
    { name: 'Jibas',     icon: 'mdi:school-outline',     cat: 'Lokal', color: '#1B5E20' },
  ]

  const categories = ['Semua', 'E-Commerce', 'Form & Sheet', 'Otomasi', 'CRM & Keuangan', 'Website & CMS', 'Lokal']
  const filtered = activeCategory === 'Semua' ? items : items.filter(i => i.cat === activeCategory)

  return (
    <section id="integrations" className="py-32" style={{ background: BR.softWhite }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 items-start">

          {/* Left: Sticky Organic Timeline */}
          <div className="lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 mb-6 text-[12px] font-bold tracking-widest uppercase text-slate-500">
              <Icon icon="mdi:puzzle-outline" className="text-[16px]" /> Ekosistem Terbuka
            </div>
            <h2 className="font-black tracking-[-0.02em] leading-[1.1] mb-6"
              style={{ fontSize: 'clamp(32px, 3.5vw, 44px)', color: BR.charcoal }}>
              Terkoneksi ke alat kerja Anda.
            </h2>
            <p className="text-[16px] leading-relaxed mb-12 text-slate-600">
              Tidak perlu membuang sistem lama Anda. Cukup hubungkan Blastify menggunakan Webhook, dan biarkan notifikasi mengalir otomatis.
            </p>

            {/* Organic 3-step timeline */}
            <div className="relative ml-4">
              {/* Vertical dashed line */}
              <div className="absolute top-2 bottom-6 left-[15px] w-0.5 border-l-2 border-dashed border-slate-300" />

              {[
                { icon: 'mdi:content-copy', title: 'Salin Webhook', desc: 'Dapatkan URL unik dari dashboard.' },
                { icon: 'mdi:link', title: 'Tempel di Platform', desc: 'Masukkan ke Shopify, Jotform, dll.' },
                { icon: 'mdi:whatsapp', title: 'Otomatis Terkirim', desc: 'Notifikasi WA langsung berjalan.' }
              ].map((step, idx) => (
                <div key={idx} className="relative flex gap-6 mb-10 group">
                  <div className="w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center shrink-0 relative z-10 transition-colors group-hover:border-emerald-500"
                    style={{ borderColor: BR.cardBorder }}>
                    <Icon icon={step.icon} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="-mt-1">
                    <h4 className="font-bold text-[16px] text-slate-800 mb-1">{step.title}</h4>
                    <p className="text-[13.5px] text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Refined Grid */}
          <div className="relative">
            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn("px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border",
                    activeCategory === cat ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_16px_rgba(0,200,83,.3)]" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400")}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map(item => (
                <div key={item.name}
                  className="bg-white rounded-[20px] p-5 flex flex-col gap-3 group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ border: `1px solid ${BR.cardBorder}` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300"
                    style={{ background: `${item.color}10` }}>
                    <Icon icon={item.icon} className="text-[26px] group-hover:scale-110 transition-transform duration-300" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[14px] text-slate-800">{item.name}</h5>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.cat}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Generic API callout — always visible */}
            <div className="mt-5 rounded-[20px] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0f1e13 100%)', border: '1px solid rgba(0,200,83,.2)', boxShadow: '0 4px 24px rgba(0,0,0,.12)' }}>
              <div className="p-5 flex flex-col sm:flex-row gap-4">

                {/* Icon + label */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,200,83,.12)', border: '1px solid rgba(0,200,83,.18)' }}>
                    <Icon icon="mdi:api" className="text-[22px]" style={{ color: BR.green }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h5 className="font-bold text-[15px] text-white">Generic REST API</h5>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase"
                        style={{ background: 'rgba(0,200,83,.15)', color: BR.green, border: '1px solid rgba(0,200,83,.25)' }}>
                        Platform apa saja
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(241,245,249,.5)' }}>
                      Platform Anda tidak ada di daftar? Tidak masalah — kirim satu{' '}
                      <code className="font-mono text-[12px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,200,83,.12)', color: BR.green }}>
                        HTTP POST
                      </code>{' '}
                      ke endpoint API kami dari sistem mana pun. JSON murni, respons &lt;200ms, format standar yang mudah diparse dari bahasa apa pun.
                    </p>
                  </div>
                </div>

                {/* Feature tags */}
                <div className="flex sm:flex-col gap-2 flex-wrap sm:justify-center shrink-0">
                  {[
                    { icon: 'mdi:code-json',         label: 'JSON Payload' },
                    { icon: 'mdi:shield-key-outline', label: 'Bearer Token' },
                    { icon: 'mdi:swap-horizontal',    label: 'Standar REST' },
                    { icon: 'mdi:lightning-bolt',     label: '< 200ms' },
                  ].map(tag => (
                    <div key={tag.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                      <Icon icon={tag.icon} className="text-[12px]" style={{ color: 'rgba(241,245,249,.35)' }} />
                      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'rgba(241,245,249,.45)' }}>{tag.label}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Code hint strip */}
              <div className="px-5 py-3 font-mono text-[11.5px] flex items-center gap-3 overflow-x-auto"
                style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'rgba(241,245,249,.25)' }}>POST</span>
                <span style={{ color: '#94a3b8' }}>https://api.blastify.id/api/v1/messages/send</span>
                <span className="ml-auto flex items-center gap-1.5 shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer"
                  style={{ background: 'rgba(0,200,83,.1)', color: BR.green, border: '1px solid rgba(0,200,83,.2)' }}>
                  <Icon icon="mdi:book-open-outline" className="text-[11px]" />
                  Lihat Docs
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Testimonials / Social Proof — Light ──────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Setup awal cuma setengah jam. Tim CS kami yang sebelumnya kewalahan membalas chat sekarang bisa fokus ke hal lain. Auto-reply menangani keluhan dasar secara cerdas.",
      name: "Arief Setiawan", role: "Owner, Sablon Express", initials: "AS",
      grad: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    },
    {
      quote: "Fitur auto-reply REGEX-nya gila sih. Bisa handle ratusan variasi typo pelanggan tanpa harus nulis rule satu-satu.",
      name: "Sari Maharani", role: "Marketing Manager", initials: "SM",
      grad: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    },
    {
      quote: "Webhook ke Shopify mulus banget dari hari pertama. Tiap order masuk, customer otomatis dapet resi di WA mereka. Udah 4 bulan jalan tanpa error sekalipun.",
      name: "Fajar Nugroho", role: "Shopify Merchant", initials: "FN",
      grad: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    },
    {
      quote: "Sebagai dev, nemu REST API selengkap dan sebersih ini di layanan lokal tuh jarang. Integrasi ke ERP internal klien selesai kurang dari 4 jam kerja.",
      name: "Taufik Hidayat", role: "Backend Engineer", initials: "TH",
      grad: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
    },
    {
      quote: "Database pelanggan saya ada 4.000 lebih. Dulu kalau broadcast suka deg-degan nomor diblokir. Di sini ada fitur delay acak yang bikin broadcast aman banget.",
      name: "Putri Wahyuni", role: "Owner Skincare", initials: "PW",
      grad: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
    },
    {
      quote: "Bisa jalanin 3 nomor CS di satu dashboard. Pantau agen CS jadi gampang banget tanpa pusing pindah-pindah HP.",
      name: "Mega Lestari", role: "Digital Marketing", initials: "ML",
      grad: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
    },
  ];

  return (
    <section className="py-32" style={{ background: '#FFFFFF' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: BR.charcoal, lineHeight: 1.1 }}>
              Dicintai oleh mereka yang bergerak cepat.
            </h2>
            <p className="text-[16px] text-slate-500 font-medium">Dari startup tech hingga toko retail lokal. Kami mengurus infrastrukturnya, Anda fokus pada pelanggan Anda.</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex gap-1 text-yellow-400 mb-2">
              {[1, 2, 3, 4, 5].map(i => <Icon key={i} icon="mdi:star" className="text-2xl" />)}
            </div>
            <p className="font-bold text-slate-800 text-[18px]">4.9 / 5 Rating</p>
          </div>
        </div>

        {/* True Masonry Layout using CSS Columns */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, i) => (
            <div key={i} className="break-inside-avoid bg-slate-50 rounded-[24px] p-8 border border-slate-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <Icon icon="mdi:format-quote-open" className="text-5xl text-emerald-500/20 mb-4" />
              <p className="text-[16px] font-medium leading-[1.7] text-slate-700 mb-8">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ background: t.grad }}>
                  {t.initials}
                </div>
                <div>
                  <h5 className="font-bold text-[15px] text-slate-900">{t.name}</h5>
                  <p className="text-[13px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ─── Pricing — Dark ───────────────────────────────────────────────────────────

function PricingSection() {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set())
  const togglePlatforms = (name: string) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const { data: apiPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.getAll(),
    select: (r) => r.data.data?.plans ?? [],
  })

  const { data: allPlatforms } = useQuery({
    queryKey: ['integrations', 'platforms'],
    queryFn: () => integrationApi.getPlatforms(),
    select: (r) => r.data.data ?? [],
    staleTime: Infinity,
  })

  const fallbackLimitRows = (device: string, msgs: string, kontak: string, broadcast: string, retensi: string, template: string, ai: string) => [
    { label: 'Device', value: device }, { label: 'Pesan/bulan', value: msgs },
    { label: 'Kontak', value: kontak }, { label: 'Broadcast/bulan', value: broadcast },
    { label: 'Retensi pesan (hari)', value: retensi }, { label: 'Template', value: template },
    { label: 'Balasan AI/bulan', value: ai },
  ]
  const fallbackFeatureRows = (flags: Record<string, boolean>) => [
    { label: 'Auto-Reply', enabled: flags.autoReply ?? false },
    { label: 'AI Reply', enabled: flags.aiReply ?? false },
    { label: 'Device rotation', enabled: flags.deviceRotation ?? false },
    { label: 'Webhook', enabled: flags.webhook ?? false },
    { label: 'Import CSV', enabled: flags.csvImport ?? false },
    { label: 'IP Whitelist', enabled: flags.ipWhitelist ?? false },
    { label: 'Watermark', enabled: flags.watermark ?? false },
  ]

  const fallbackPlans = [
    {
      name: 'Free', price: 0, desc: 'Untuk coba-coba dan proyek kecil.',
      limitRows: fallbackLimitRows('1', '1.000', '500', '3', '2', '5', '0'),
      featureRows: fallbackFeatureRows({ watermark: true }),
      highlight: false, cta: 'Mulai gratis',
      watermark: true, watermarkNote: 'Pesan dilengkapi watermark Blastify', messageTypes: ['Teks'],
      integrationLabel: 'Webhook tidak tersedia', platforms: [] as { key: string; label: string; available: boolean }[],
    },
    {
      name: 'Lite', price: 25000, desc: 'Satu device, fitur webhook sudah tersedia.',
      limitRows: fallbackLimitRows('1', '1.000', '1.000', '5', '3', '20', '0'),
      featureRows: fallbackFeatureRows({ webhook: true }),
      highlight: false, cta: 'Pilih Lite',
      watermark: false, watermarkNote: null, messageTypes: ['Teks', 'Gambar', 'Dokumen'],
      integrationLabel: '6 platform integrasi', platforms: [] as { key: string; label: string; available: boolean }[],
    },
    {
      name: 'Regular', price: 66000, desc: 'Paling populer untuk bisnis aktif.',
      limitRows: fallbackLimitRows('3', '10.000', '5.000', '20', '5', '50', '0'),
      featureRows: fallbackFeatureRows({ autoReply: true, webhook: true, csvImport: true, ipWhitelist: true }),
      highlight: true, cta: 'Pilih Regular',
      watermark: false, watermarkNote: null, messageTypes: ['Teks', 'Gambar', 'Video', 'Dokumen', 'Audio', 'Lokasi', 'List Interaktif', 'Tombol'],
      integrationLabel: '23 platform integrasi', platforms: [] as { key: string; label: string; available: boolean }[],
    },
    {
      name: 'Master', price: 175000, desc: 'Untuk bisnis yang sudah serius.',
      limitRows: fallbackLimitRows('10', '∞', '∞', '∞', '7', '200', '2.000'),
      featureRows: fallbackFeatureRows({ autoReply: true, aiReply: true, deviceRotation: true, webhook: true, csvImport: true, ipWhitelist: true }),
      highlight: false, cta: 'Pilih Master',
      watermark: false, watermarkNote: null, messageTypes: ['Teks', 'Gambar', 'Video', 'Dokumen', 'Audio', 'Lokasi', 'List Interaktif', 'Tombol'],
      integrationLabel: 'Semua platform integrasi', platforms: [] as { key: string; label: string; available: boolean }[],
    },
    {
      name: 'Ultra', price: 355000, desc: 'Infrastruktur tak terbatas.',
      limitRows: fallbackLimitRows('∞', '∞', '∞', '∞', '30', '∞', '10.000'),
      featureRows: fallbackFeatureRows({ autoReply: true, aiReply: true, deviceRotation: true, webhook: true, csvImport: true, ipWhitelist: true }),
      highlight: false, cta: 'Pilih Ultra',
      watermark: false, watermarkNote: null, messageTypes: ['Teks', 'Gambar', 'Video', 'Dokumen', 'Audio', 'Lokasi', 'List Interaktif', 'Tombol'],
      integrationLabel: 'Semua platform integrasi', platforms: [] as { key: string; label: string; available: boolean }[],
    },
  ]

  // Metadata presentasi per plan (copywriting tetap di frontend; harga & limit dari API)
  const PLAN_META: Record<string, { label: string; desc: string; cta: string }> = {
    FREE:    { label: 'Free',    desc: 'Untuk coba-coba dan proyek kecil.',            cta: 'Mulai gratis'  },
    LITE:    { label: 'Lite',    desc: 'Satu device, fitur webhook sudah tersedia.',   cta: 'Pilih Lite'    },
    REGULAR: { label: 'Regular', desc: 'Paling populer untuk bisnis aktif.',           cta: 'Pilih Regular' },
    MASTER:  { label: 'Master',  desc: 'Untuk bisnis yang sudah serius.',              cta: 'Pilih Master'  },
    ULTRA:   { label: 'Ultra',   desc: 'Infrastruktur tak terbatas.',                  cta: 'Pilih Ultra'   },
  }
  const FEATURE_LABELS: Record<string, string> = {
    autoReply:      'Auto-Reply',
    aiReply:        'AI Reply',
    deviceRotation: 'Device rotation',
    webhook:        'Webhook',
    csvImport:      'Import CSV',
    ipWhitelist:    'IP Whitelist',
  }
  const FEATURE_ORDER = ['autoReply', 'aiReply', 'deviceRotation', 'webhook', 'csvImport', 'ipWhitelist'] as const
  const fmtNum = (n: number | null | undefined) =>
    n === -1 || n === null || n === undefined ? '∞' : n.toLocaleString('id-ID')

  const ALL_MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'LOCATION', 'LIST', 'BUTTON']

  const integrationLabel = (p: PublicPlan) => {
    if (!p.integrations?.enabled) return 'Webhook tidak tersedia'
    return p.integrations.allowedPlatforms === 'all'
      ? 'Semua platform integrasi'
      : `${p.integrations.allowedPlatforms.length} platform integrasi`
  }

  const platformStatusList = (p: PublicPlan) => {
    if (!allPlatforms?.length) return []
    const allowed = p.integrations?.allowedPlatforms
    return allPlatforms.map((plat) => ({
      key: plat.key,
      label: plat.label,
      available: p.integrations?.enabled === true && (allowed === 'all' || (Array.isArray(allowed) && allowed.includes(plat.key))),
    }))
  }

  const plans = apiPlans?.length
    ? apiPlans.map(p => {
        const meta = PLAN_META[p.plan] ?? { label: p.plan, desc: '', cta: `Pilih ${p.plan}` }
        const types = p.allowedMessageTypes === 'all' || !p.allowedMessageTypes?.length
          ? ALL_MESSAGE_TYPES
          : p.allowedMessageTypes
        return {
          name: meta.label,
          price: p.price / 100, // API dalam sen → tampilkan IDR
          desc: meta.desc,
          limitRows: [
            { label: 'Device',              value: fmtNum(p.limits.maxDevices) },
            { label: 'Pesan/bulan',         value: fmtNum(p.limits.monthlyMessages) },
            { label: 'Kontak',               value: fmtNum(p.limits.maxContacts) },
            { label: 'Broadcast/bulan',     value: fmtNum(p.limits.maxBroadcasts) },
            { label: 'Retensi pesan (hari)', value: fmtNum(p.limits.messageRetentionDays) },
            { label: 'Template',             value: fmtNum(p.limits.maxTemplates) },
            { label: 'Balasan AI/bulan',    value: fmtNum(p.limits.aiMonthlyReplies) },
          ],
          featureRows: [
            ...FEATURE_ORDER.map((key) => ({ label: FEATURE_LABELS[key], enabled: Boolean(p.features?.[key]) })),
            { label: 'Watermark', enabled: p.watermark },
          ],
          highlight: p.plan === 'REGULAR',
          cta: meta.cta,
          watermark: p.watermark,
          watermarkNote: p.watermarkNote,
          messageTypes: types.map((t) => MESSAGE_TYPE_LABELS[t] ?? t),
          integrationLabel: integrationLabel(p),
          platforms: platformStatusList(p),
        }
      })
    : fallbackPlans

  return (
    // ── DARK SECTION ──
    <section id="pricing" className="py-28 relative overflow-hidden" style={{ background: BR.charcoal }}>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: noiseUrl, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(0,200,83,.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-16">
          <Chip className="mb-5">Harga</Chip>
          <h2 className="font-black tracking-[-0.02em] leading-tight"
            style={{ fontSize: 'clamp(30px, 3.5vw, 46px)', color: BR.textDark }}>
            Transparan, tanpa kejutan.
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: BR.textDarkSub, fontFamily: 'Inter, sans-serif' }}>
            Mulai gratis. Upgrade saat Anda butuh lebih.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-start gap-3">
          {plansLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Icon icon="mdi:loading" className="animate-spin text-2xl mx-auto mb-2" />
              Loading plans...
            </div>
          ) : !plans.length ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Gagal load plans. Coba refresh halaman.
            </div>
          ) : plans.map(plan => (
            <div key={plan.name}
              className={cn(
                'rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all duration-300',
                !plan.highlight && 'hover:-translate-y-1',
                plan.highlight && 'my-3 sm:my-0 lg:scale-[1.04] z-10',
              )}
              style={plan.highlight ? {
                background: 'linear-gradient(160deg, #0D1A0E 0%, #071209 100%)',
                border: `1px solid rgba(0,200,83,.35)`,
                boxShadow: `0 0 0 1px rgba(0,200,83,.14), 0 0 64px rgba(0,200,83,.14), 0 16px 48px rgba(0,0,0,.5)`,
              } : {
                background: 'rgba(255,255,255,.04)',
                border: `1px solid ${BR.darkBorder}`,
                boxShadow: '0 4px 24px rgba(0,0,0,.3)',
              }}>

              {/* Popular plan top beam using Brand Accent Gradient */}
              {plan.highlight && (
                <div className="absolute top-0 inset-x-0 h-[2px]"
                  style={{ background: BR.gBrand }} />
              )}

              {plan.highlight && (
                <span className="text-[10px] font-bold text-white px-3 py-1 rounded-full w-fit mb-4"
                  style={{ background: BR.gBrand }}>
                  Terpopuler
                </span>
              )}

              <p className="font-heading font-semibold text-[15.5px] mb-1 tracking-tight" style={{ color: BR.textDark }}>{plan.name}</p>
              <p className="text-[12px] mb-5 leading-snug" style={{ color: BR.textDarkSub }}>{plan.desc}</p>

              <div className="mb-5">
                <span className="font-heading font-extrabold text-[26px] tracking-tight leading-none" style={{ color: BR.textDark }}>
                  {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                </span>
                {plan.price > 0 && <span className="text-[11px] ml-1" style={{ color: BR.textDarkMuted }}>/bln</span>}
              </div>

              <div className="rounded-xl px-3 py-2.5 mb-5 text-xs"
                style={{ background: plan.highlight ? 'rgba(0,200,83,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${plan.highlight ? 'rgba(0,200,83,.18)' : BR.darkBorder}` }}>
                {(plan as any).limitRows?.map((row: { label: string; value: string }) => (
                  <div key={row.label} className="flex items-center justify-between py-0.5">
                    <span style={{ color: BR.textDarkSub }}>{row.label}</span>
                    <span className="font-semibold" style={{ color: BR.textDark }}>{row.value}</span>
                  </div>
                ))}
                {(plan as any).watermark && (
                  <p className="pt-1.5 mt-1.5" style={{ color: '#FBBF24', borderTop: `1px solid ${BR.darkBorder}` }}>⚡ {(plan as any).watermarkNote}</p>
                )}
              </div>

              {(plan as any).messageTypes?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: BR.textDarkMuted }}>
                    Tipe pesan
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(plan as any).messageTypes.map((t: string) => (
                      <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${BR.darkBorder}`, color: BR.textDarkSub }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(plan as any).platforms?.length > 0 && (
                <div className="mb-5">
                  <button type="button" onClick={() => togglePlatforms(plan.name)}
                    className="w-full flex items-center justify-between text-[11px] py-1 group">
                    <span className="flex items-center gap-1.5" style={{ color: BR.textDarkSub }}>
                      <Icon icon="mdi:webhook" className="text-[13px]" style={{ color: BR.textDarkMuted }} />
                      {(plan as any).integrationLabel}
                    </span>
                    <Icon icon="mdi:chevron-down" className="text-[14px] transition-transform duration-200"
                      style={{ color: BR.textDarkMuted, transform: expandedPlatforms.has(plan.name) ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {expandedPlatforms.has(plan.name) && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 pt-2" style={{ borderTop: `1px solid ${BR.darkBorder}` }}>
                      {(plan as any).platforms.map((plat: { key: string; label: string; available: boolean }) => (
                        <div key={plat.key} className="flex items-center gap-1.5 text-[11px]"
                          style={{ color: plat.available ? BR.textDarkSub : BR.textDarkMuted }}>
                          <Icon icon={plat.available ? 'mdi:check-circle' : 'mdi:close-circle-outline'}
                            className="text-[12px] flex-shrink-0"
                            style={{ color: plat.available ? BR.green : 'rgba(255,255,255,.18)' }} />
                          <span className="truncate">{plat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <ul className="space-y-1.5 flex-1 mb-6">
                {(plan as any).featureRows?.map((row: { label: string; enabled: boolean }) => (
                  <li key={row.label} className="flex items-center gap-2 text-[12px]"
                    style={{ color: row.enabled ? BR.textDarkSub : BR.textDarkMuted }}>
                    <Icon icon={row.enabled ? 'mdi:check-circle' : 'mdi:close-circle-outline'}
                      className="text-[13px] flex-shrink-0"
                      style={{ color: row.enabled ? (plan.highlight ? BR.green : BR.green) : 'rgba(255,255,255,.18)' }} />
                    {row.label}
                  </li>
                ))}
              </ul>

              <Link to="/register"
                className={cn('block text-center text-[13px] font-semibold py-2.5 transition-all duration-300', plan.highlight ? 'hover:-translate-y-0.5' : 'hover:opacity-80')}
                style={plan.highlight
                  ? { background: BR.gBrand, color: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,200,83,.4)' }
                  : { border: `1px solid ${BR.darkBorder}`, color: BR.textDarkSub, borderRadius: 8, background: 'transparent' }}
                onMouseEnter={e => { if (plan.highlight) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(0,200,83,.55)' } }}
                onMouseLeave={e => { if (plan.highlight) { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,200,83,.4)' } }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[12px] mt-9 leading-relaxed" style={{ color: BR.textDarkMuted }}>
          Semua plan termasuk SSL, update otomatis, dan akses dashboard.
          Tidak ada biaya setup atau kontrak.
        </p>
      </div>
    </section>
  )
}

// ─── FAQ — Light, split layout ────────────────────────────────────────────────

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Apakah menggunakan WhatsApp Business API resmi?',
      a: 'Tidak. Blastify adalah unofficial WhatsApp Gateway — bukan produk resmi Meta / WhatsApp Inc. Cocok untuk personal dan bisnis skala menengah yang butuh setup cepat tanpa proses verifikasi bisnis resmi.',
    },
    {
      q: 'Seberapa aman nomor WhatsApp saya dari banned?',
      a: 'Kami menyediakan fitur anti-ban: delay acak antar pesan, jam kerja, dan batas kuota harian. Tapi risiko banned ada jika Anda mengirim spam atau melanggar ToS WhatsApp. Gunakan secara bertanggung jawab.',
    },
    {
      q: 'Apakah API-nya mudah diintegrasikan ke sistem yang sudah ada?',
      a: 'Ya. API Blastify menggunakan format REST standar dengan JSON. Cukup arahkan endpoint di kode Anda ke URL Blastify — tidak perlu mengubah struktur request. Cek dokumentasi integrasi di halaman Akun.',
    },
    {
      q: 'Bagaimana sistem pembayaran?',
      a: 'Transfer manual ke rekening kami (BCA, BRI, Mandiri, BSI, GoPay, OVO). Konfirmasi dikirim ke email, plan aktif dalam 1×24 jam kerja. Tidak ada auto-debit.',
    },
    {
      q: 'Apakah data kontak saya aman?',
      a: 'Ya. Data disimpan terenkripsi di server Indonesia. Kami tidak menjual atau membagikan data Anda ke pihak ketiga. Lihat Kebijakan Privasi untuk detail lengkap.',
    },
  ]

  return (
    // ── LIGHT SECTION ──
    <section id="faq" className="py-28" style={{ background: BR.softWhite, borderTop: `1px solid ${BR.cardBorder}` }}>
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-16 items-start">

          {/* Left — sticky anchor */}
          <div className="lg:sticky lg:top-24">
            <Chip className="mb-5">FAQ</Chip>
            <h2 className="font-black tracking-[-0.02em] leading-[1.1] mb-6"
              style={{ fontSize: 'clamp(28px, 3vw, 40px)', color: BR.charcoal }}>
              Pertanyaan umum.
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: BR.slate, fontFamily: 'Inter, sans-serif' }}>
              Tidak menemukan jawaban?{' '}
              <a href="mailto:support@blastify.id"
                className="font-medium transition-colors duration-200"
                style={{ color: BR.green }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BR.teal }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = BR.green }}>
                Hubungi kami
              </a>
            </p>
          </div>

          {/* Right — accordions */}
          <div>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${BR.cardBorder}` }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between py-6 text-left group gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-[11px] font-bold font-mono flex-shrink-0 mt-1 w-5"
                      style={{ color: '#CBD5E1' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-[15px] leading-snug transition-colors duration-200"
                      style={{ color: open === i ? BR.green : BR.charcoal }}>
                      {faq.q}
                    </span>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-250 flex-shrink-0"
                    style={open === i
                      ? { background: BR.green, transform: 'rotate(45deg)' }
                      : { background: BR.chipBg }}>
                    <Icon icon="mdi:plus" className="text-base"
                      style={{ color: open === i ? '#fff' : BR.deepGreen }} />
                  </div>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="pb-6 pl-9 transition-opacity duration-300"
                      style={{ opacity: open === i ? 1 : 0, transitionDelay: open === i ? '100ms' : '0ms' }}>
                      <p className="text-[14.5px] leading-[1.8]" style={{ color: BR.slate, fontFamily: 'Inter, sans-serif' }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Final CTA — Dark Premium Gradient ───────────────────────────────────────

function FinalCta() {
  return (
    // ── DARK CTA: Brand Accent Gradient applied to key elements, Dark Premium Gradient as bg ──
    <section className="relative overflow-hidden py-32"
      style={{ background: BR.gDark }}>
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,200,83,.22) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 25%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 25%, transparent 100%)',
          opacity: 0.2,
        }} />
      {/* Centre glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,200,83,.15) 0%, rgba(0,229,204,.06) 50%, transparent 80%)', filter: 'blur(48px)' }} />
      </div>

      <div className="relative max-w-[620px] mx-auto px-6 text-center">
        {/* H2 — large display on dark */}
        <h2 className="font-heading font-extrabold leading-[1.1] tracking-tight text-white mb-6"
          style={{ fontSize: 'clamp(34px, 4.5vw, 52px)' }}>
          Daftar, scan QR,{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: BR.gBrand }}>
            langsung kirim pesan.
          </span>
        </h2>
        <p className="text-[16px] leading-relaxed mb-10"
          style={{ color: BR.textDarkSub, fontFamily: 'Inter, sans-serif' }}>
          Tidak perlu kartu kredit. Setup dua menit.<br />
          Gratis selamanya untuk satu device.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Primary CTA — Brand Green #00C853, radius 8px */}
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-3.5 text-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
            style={{ background: BR.green, borderRadius: 8, boxShadow: '0 4px 32px rgba(0,200,83,.45)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BR.teal; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 48px rgba(0,229,204,.55)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BR.green; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 32px rgba(0,200,83,.45)' }}>
            Buat akun gratis
            <Icon icon="mdi:arrow-right" className="text-base" />
          </Link>
          {/* Secondary — ghost, border #00C853 */}
          <Link to="/login"
            className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 text-[14px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ color: BR.green, border: `1.5px solid rgba(0,200,83,.5)`, borderRadius: 8, background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BR.green; (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,83,.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,83,.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            Sudah punya akun →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer — Deep Green / Dark ───────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: BR.deepGreen, borderTop: '1px solid rgba(255,255,255,.08)' }}>

      {/* Links grid */}
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">

          {/* Brand col */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt={APP_NAME} className="w-7 h-7" />
              <span className="font-heading font-bold text-[14.5px] tracking-tight text-white">{APP_NAME}</span>
            </div>
            <p className="text-[12.5px] leading-relaxed max-w-[200px]" style={{ color: 'rgba(241,245,249,.5)' }}>
              WhatsApp Gateway &amp; Business Messaging untuk bisnis modern.
            </p>
            <p className="text-[10.5px]" style={{ color: 'rgba(255,255,255,.2)' }}>
              Bukan produk resmi Meta / WhatsApp Inc.
            </p>
          </div>

          {[
            {
              title: 'Produk',
              links: [['#features', 'Fitur'], ['#pricing', 'Harga'], ['#integrations', 'Integrasi'], ['/docs', 'API Docs']],
            },
            {
              title: 'Legal',
              links: [['/privacy', 'Kebijakan Privasi'], ['/terms', 'Syarat Layanan']],
            },
            {
              title: 'Kontak',
              links: [['mailto:support@blastify.id', 'support@blastify.id'], ['https://wa.me/6281234567890', 'WhatsApp Support']],
            },
          ].map(col => (
            <div key={col.title} className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(241,245,249,.3)' }}>{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(([href, label]) => {
                  const isExt = href.startsWith('http') || href.startsWith('mailto')
                  const style = { color: 'rgba(241,245,249,.5)', textDecoration: 'none', fontSize: 13 }
                  const cls = "transition-colors duration-200 hover:text-white text-[13px]"
                  return (
                    <li key={label}>
                      {isExt || href.startsWith('#')
                        ? <a href={href} className={cls} style={style}>{label}</a>
                        : <Link to={href} className={cls} style={style}>{label}</Link>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 text-[11.5px]"
          style={{ borderTop: '1px solid rgba(255,255,255,.08)', color: 'rgba(241,245,249,.3)' }}>
          <p>© {new Date().getFullYear()} PT Naraya Teknologi Nusantara (Hashcode Indonesia). Seluruh hak dilindungi.</p>
          <p>Made with ☕ in Indonesia</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

export function LandingPage() {
  useEffect(() => {
    const id = 'poppins-gfont'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  return (
    <div className="antialiased text-[#1A1A2E]">
      <style>{`
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-\\[marquee_32s_linear_infinite\\] {
          animation: marquee 32s linear infinite;
        }
        
        /* THE FIX: Apply Poppins ONLY to UI elements, protect monospace */
        #lp-root {
          font-family: 'Poppins', 'Inter', sans-serif;
        }
        
        /* Strict Monospace Override for API blocks */
        #lp-root .font-mono, 
        #lp-root code, 
        #lp-root pre {
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
          letter-spacing: -0.02em;
        }
      `}</style>
      <div id="lp-root">
        <Navbar />
        <Hero />
        <LogosBar />
        <FeaturesSection />
        <ApiSection />
        <IntegrationsSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
        <Footer />
      </div>
    </div>
  )
}
