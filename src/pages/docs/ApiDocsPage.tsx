import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  green:      '#00C853',
  teal:       '#00E5CC',
  charcoal:   '#1A1A2E',
  softWhite:  '#F8FAFC',
  cardBorder: '#E2E8F0',
  slate:      '#4A5568',
}

// ─── Method badge ─────────────────────────────────────────────────────────────

const METHOD_STYLE: Record<string, { bg: string; text: string }> = {
  GET:    { bg: 'rgba(59,130,246,.12)',  text: '#3B82F6' },
  POST:   { bg: 'rgba(0,200,83,.12)',    text: '#00C853' },
  PATCH:  { bg: 'rgba(245,158,11,.12)',  text: '#D97706' },
  DELETE: { bg: 'rgba(239,68,68,.12)',   text: '#EF4444' },
}

function MethodBadge({ method }: { method: string }) {
  const s = METHOD_STYLE[method] ?? METHOD_STYLE.GET
  return (
    <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded tracking-widest"
      style={{ background: s.bg, color: s.text }}>
      {method}
    </span>
  )
}

// ─── Code block with copy ─────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: '#09090C', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
        <span className="text-[11px] font-mono" style={{ color: 'rgba(241,245,249,.3)' }}>{lang}</span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
          style={{ color: copied ? C.green : 'rgba(241,245,249,.3)' }}>
          <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className="text-[13px]" />
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <pre className="px-5 py-4 text-[12.5px] font-mono leading-[1.8] overflow-x-auto whitespace-pre"
        style={{ color: '#94a3b8' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Parameter table ─────────────────────────────────────────────────────────

interface Param { name: string; type: string; required?: boolean; desc: string }

function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.cardBorder}` }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: C.softWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest w-36">Parameter</th>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest w-24">Tipe</th>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest w-20">Wajib</th>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={p.name} style={{ borderTop: i > 0 ? `1px solid ${C.cardBorder}` : undefined }}>
              <td className="px-4 py-3 font-mono text-[12px]" style={{ color: C.green }}>{p.name}</td>
              <td className="px-4 py-3 font-mono text-[11.5px] text-slate-400">{p.type}</td>
              <td className="px-4 py-3">
                {p.required
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,83,.1)', color: C.green }}>Ya</span>
                  : <span className="text-[10px] text-slate-400">Opsional</span>}
              </td>
              <td className="px-4 py-3 text-slate-600 leading-relaxed">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Endpoint block ───────────────────────────────────────────────────────────

interface EndpointProps {
  id: string
  method: string
  path: string
  title: string
  desc: string
  params?: Param[]
  requestBody?: string
  responseBody: string
}

function Endpoint({ id, method, path, title, desc, params, requestBody, responseBody }: EndpointProps) {
  return (
    <div id={id} className="scroll-mt-24 mb-14">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <MethodBadge method={method} />
        <code className="text-[13px] font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">{path}</code>
      </div>
      <h3 className="text-[18px] font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-[14px] text-slate-500 leading-relaxed mb-5">{desc}</p>
      {params && params.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Parameter</p>
          <ParamTable params={params} />
        </div>
      )}
      {requestBody && (
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Request Body</p>
          <CodeBlock code={requestBody} lang="json — request" />
        </div>
      )}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Response</p>
        <CodeBlock code={responseBody} lang="json — response" />
      </div>
    </div>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHead({ id, icon, title, desc }: { id: string; icon: string; title: string; desc: string }) {
  return (
    <div id={id} className="scroll-mt-20 mb-8 pb-6" style={{ borderBottom: `2px solid ${C.cardBorder}` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,200,83,.1)' }}>
          <Icon icon={icon} className="text-[16px]" style={{ color: C.green }} />
        </div>
        <h2 className="text-[22px] font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="text-[14px] text-slate-500 leading-relaxed ml-11">{desc}</p>
    </div>
  )
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

const NAV = [
  { id: 'intro',        label: 'Pendahuluan',      icon: 'mdi:book-open-outline' },
  { id: 'auth',         label: 'Autentikasi',       icon: 'mdi:key-outline' },
  { id: 'response',     label: 'Format Respons',    icon: 'mdi:code-json' },
  {
    id: 'messages', label: 'Pesan', icon: 'mdi:message-text-outline', children: [
      { id: 'msg-text',     label: 'Kirim Teks' },
      { id: 'msg-image',    label: 'Kirim Gambar' },
      { id: 'msg-video',    label: 'Kirim Video' },
      { id: 'msg-document', label: 'Kirim Dokumen' },
      { id: 'msg-audio',    label: 'Kirim Audio' },
      { id: 'msg-location', label: 'Kirim Lokasi' },
      { id: 'msg-list',     label: 'Riwayat Pesan' },
    ]
  },
  {
    id: 'broadcast', label: 'Broadcast', icon: 'mdi:broadcast', children: [
      { id: 'bc-create', label: 'Buat Broadcast' },
      { id: 'bc-start',  label: 'Mulai / Pause' },
      { id: 'bc-status', label: 'Status & Log' },
    ]
  },
  {
    id: 'devices', label: 'Device', icon: 'mdi:cellphone-link', children: [
      { id: 'dev-list',    label: 'List Device' },
      { id: 'dev-connect', label: 'Koneksi & QR' },
    ]
  },
  {
    id: 'contacts', label: 'Kontak', icon: 'mdi:contacts-outline', children: [
      { id: 'con-list',   label: 'List Kontak' },
      { id: 'con-create', label: 'Tambah Kontak' },
    ]
  },
  {
    id: 'webhooks', label: 'Webhook', icon: 'mdi:webhook', children: [
      { id: 'wh-create',  label: 'Buat Webhook' },
      { id: 'wh-payload', label: 'Payload Event' },
    ]
  },
  {
    id: 'integrations', label: 'Integrasi', icon: 'mdi:puzzle-outline', children: [
      { id: 'int-receive', label: 'Terima Webhook' },
    ]
  },
  { id: 'errors', label: 'Kode Error', icon: 'mdi:alert-circle-outline' },
]

const BASE = 'https://api.blastify.id/api/v1'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ApiDocsPage() {
  const [activeId, setActiveId] = useState('intro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = 'poppins-gfont'
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => {
    const allIds = NAV.flatMap(n => n.children ? [n.id, ...n.children.map(c => c.id)] : [n.id])
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    allIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <nav className="py-6 px-3">
      {NAV.map(section => (
        <div key={section.id} className="mb-1">
          <button onClick={() => scrollTo(section.id)}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all text-left',
              activeId === section.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')}
            style={activeId === section.id ? { background: 'rgba(0,200,83,.15)', color: C.green } : {}}>
            <Icon icon={section.icon} className="text-[15px] flex-shrink-0" />
            {section.label}
          </button>
          {section.children?.map(child => (
            <button key={child.id} onClick={() => scrollTo(child.id)}
              className={cn('w-full text-left pl-9 pr-3 py-1.5 text-[12px] rounded-lg transition-all block',
                activeId === child.id ? 'font-semibold' : 'text-slate-500 hover:text-slate-300')}
              style={activeId === child.id ? { color: C.green } : {}}>
              {child.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Top navbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 gap-4"
        style={{ background: 'rgba(15,15,25,.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Link to="/" className="flex items-center gap-2 mr-4">
          <img src="/logo.png" alt={APP_NAME} className="w-7 h-7" />
          <span className="font-bold text-white text-[14px]">{APP_NAME}</span>
        </Link>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(0,200,83,.15)', color: C.green }}>
          API Docs
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/register"
            className="hidden sm:flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-1.5 rounded-lg text-white transition-all"
            style={{ background: C.green }}>
            <Icon icon="mdi:account-plus-outline" className="text-sm" />
            Daftar Gratis
          </Link>
          <button className="md:hidden text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon icon={mobileOpen ? 'mdi:close' : 'mdi:menu'} className="text-xl" />
          </button>
        </div>
      </header>

      <div className="flex pt-14 min-h-screen">

        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
          style={{ background: '#0D0D1A', borderRight: '1px solid rgba(255,255,255,.07)' }}>
          <SidebarContent />
        </aside>

        {/* Sidebar mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <aside className="absolute left-0 top-14 bottom-0 w-64 overflow-y-auto"
              style={{ background: '#0D0D1A', borderRight: '1px solid rgba(255,255,255,.07)' }}
              onClick={e => e.stopPropagation()}>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main ref={contentRef} className="flex-1 min-w-0 px-6 sm:px-10 lg:px-16 py-12 max-w-4xl">

          {/* ── Pendahuluan ── */}
          <div id="intro" className="scroll-mt-20 mb-14">
            <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">Dokumentasi API</h1>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
              API {APP_NAME} memungkinkan Anda mengirim pesan WhatsApp, mengelola device, broadcast massal,
              serta menerima notifikasi real-time melalui webhook — semuanya menggunakan format REST standar dengan JSON.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: 'mdi:server',           title: 'Base URL',    val: BASE },
                { icon: 'mdi:tag-outline',       title: 'Versi API',  val: 'v1' },
                { icon: 'mdi:lightning-bolt',    title: 'Respons',    val: '< 200ms rata-rata' },
              ].map(i => (
                <div key={i.title} className="rounded-xl p-4" style={{ background: C.softWhite, border: `1px solid ${C.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon icon={i.icon} className="text-[14px]" style={{ color: C.green }} />
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">{i.title}</p>
                  </div>
                  <p className="font-mono text-[12px] text-slate-700 break-all">{i.val}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(0,200,83,.05)', border: '1px solid rgba(0,200,83,.2)' }}>
              <Icon icon="mdi:information-outline" className="text-[18px] flex-shrink-0 mt-0.5" style={{ color: C.green }} />
              <p className="text-[13px] leading-relaxed text-slate-600">
                API Key dapat ditemukan di halaman <strong>Akun → API Key</strong> setelah login ke dashboard.
                Gunakan API Key sebagai Bearer token di setiap request.
              </p>
            </div>
          </div>

          {/* ── Autentikasi ── */}
          <SectionHead id="auth" icon="mdi:key-outline" title="Autentikasi"
            desc="Semua endpoint memerlukan API Key yang dikirim sebagai Bearer token di header Authorization." />

          <p className="text-[14px] text-slate-600 mb-4">
            Tambahkan header berikut pada setiap request ke API:
          </p>
          <CodeBlock lang="http — request header" code={`Authorization: Bearer bfy_live_xxxxxxxxxxxxxxxxxxxxxxxx`} />
          <div className="mt-5 mb-10">
            <p className="text-[13px] text-slate-500 mb-3">Contoh request dengan cURL:</p>
            <CodeBlock lang="bash" code={`curl -s -X POST ${BASE}/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer bfy_live_xK9mP3r..." \\
  -d '{"deviceId":"dev_abc123","to":"6281234567890","type":"TEXT","message":"Halo!"}'`} />
          </div>

          {/* ── Format Respons ── */}
          <SectionHead id="response" icon="mdi:code-json" title="Format Respons"
            desc="Semua endpoint mengembalikan JSON dengan struktur yang konsisten." />

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Sukses (2xx)</p>
              <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    // payload spesifik endpoint
  }
}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Error (4xx / 5xx)</p>
              <CodeBlock lang="json" code={`{
  "success": false,
  "message": "Deskripsi error",
  "code": "KODE_ERROR"
}`} />
            </div>
          </div>

          {/* ── Pesan ── */}
          <SectionHead id="messages" icon="mdi:message-text-outline" title="Pesan"
            desc="Endpoint untuk mengirim berbagai jenis pesan WhatsApp melalui device yang terhubung." />

          <Endpoint id="msg-text" method="POST" path="/messages/send" title="Kirim Pesan Teks"
            desc="Mengirim pesan teks plain ke nomor WhatsApp tujuan."
            params={[
              { name: 'deviceId', type: 'string',  required: true,  desc: 'ID device yang digunakan untuk mengirim' },
              { name: 'to',       type: 'string',  required: true,  desc: 'Nomor tujuan format internasional tanpa + (contoh: 6281234567890)' },
              { name: 'type',     type: 'string',  required: true,  desc: 'Harus berisi nilai TEXT' },
              { name: 'message',  type: 'string',  required: true,  desc: 'Isi pesan teks' },
              { name: 'scheduledAt', type: 'string', desc: 'ISO 8601 datetime — jika diisi, pesan dijadwalkan' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "TEXT",
  "message":  "Halo! Pesanan #4821 Anda sudah dikirim 🚚"
}`}
            responseBody={`{
  "success": true,
  "data": {
    "message": {
      "id":        "msg_8xKq2r",
      "deviceId":  "dev_6a3f9c",
      "to":        "6281234567890",
      "type":      "TEXT",
      "status":    "QUEUED",
      "createdAt": "2025-06-01T09:00:00.000Z"
    }
  }
}`} />

          <Endpoint id="msg-image" method="POST" path="/messages/send" title="Kirim Gambar"
            desc="Mengirim gambar dengan opsional teks caption."
            params={[
              { name: 'deviceId', type: 'string', required: true, desc: 'ID device pengirim' },
              { name: 'to',       type: 'string', required: true, desc: 'Nomor tujuan format internasional' },
              { name: 'type',     type: 'string', required: true, desc: 'Harus berisi nilai IMAGE' },
              { name: 'mediaUrl', type: 'string', required: true, desc: 'URL publik file gambar (jpg/png/webp, maks 5 MB)' },
              { name: 'caption',  type: 'string', desc: 'Teks caption di bawah gambar' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "IMAGE",
  "mediaUrl": "https://cdn.tokoanda.com/promo-banner.jpg",
  "caption":  "Flash Sale 50% — hari ini saja! 🔥"
}`}
            responseBody={`{
  "success": true,
  "data": {
    "message": {
      "id":       "msg_Yt3mNk",
      "type":     "IMAGE",
      "status":   "QUEUED",
      "mediaUrl": "https://cdn.tokoanda.com/promo-banner.jpg"
    }
  }
}`} />

          <Endpoint id="msg-video" method="POST" path="/messages/send" title="Kirim Video"
            desc="Mengirim file video dengan opsional caption."
            params={[
              { name: 'deviceId', type: 'string', required: true, desc: 'ID device pengirim' },
              { name: 'to',       type: 'string', required: true, desc: 'Nomor tujuan format internasional' },
              { name: 'type',     type: 'string', required: true, desc: 'Harus berisi nilai VIDEO' },
              { name: 'mediaUrl', type: 'string', required: true, desc: 'URL publik file video (mp4, maks 16 MB)' },
              { name: 'caption',  type: 'string', desc: 'Teks caption' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "VIDEO",
  "mediaUrl": "https://cdn.tokoanda.com/tutorial.mp4",
  "caption":  "Cara pakai produk kami 🎬"
}`}
            responseBody={`{
  "success": true,
  "data": { "message": { "id": "msg_Rv8pLc", "type": "VIDEO", "status": "QUEUED" } }
}`} />

          <Endpoint id="msg-document" method="POST" path="/messages/send" title="Kirim Dokumen"
            desc="Mengirim file dokumen (PDF, DOCX, XLSX, dll)."
            params={[
              { name: 'deviceId', type: 'string', required: true, desc: 'ID device pengirim' },
              { name: 'to',       type: 'string', required: true, desc: 'Nomor tujuan format internasional' },
              { name: 'type',     type: 'string', required: true, desc: 'Harus berisi nilai DOCUMENT' },
              { name: 'mediaUrl', type: 'string', required: true, desc: 'URL publik file dokumen (maks 100 MB)' },
              { name: 'caption',  type: 'string', desc: 'Nama file atau deskripsi dokumen' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "DOCUMENT",
  "mediaUrl": "https://cdn.tokoanda.com/invoice-4821.pdf",
  "caption":  "Invoice Pesanan #4821"
}`}
            responseBody={`{
  "success": true,
  "data": { "message": { "id": "msg_Jd2wQx", "type": "DOCUMENT", "status": "QUEUED" } }
}`} />

          <Endpoint id="msg-audio" method="POST" path="/messages/send" title="Kirim Audio"
            desc="Mengirim file audio (mp3, ogg, m4a)."
            params={[
              { name: 'deviceId', type: 'string', required: true, desc: 'ID device pengirim' },
              { name: 'to',       type: 'string', required: true, desc: 'Nomor tujuan format internasional' },
              { name: 'type',     type: 'string', required: true, desc: 'Harus berisi nilai AUDIO' },
              { name: 'mediaUrl', type: 'string', required: true, desc: 'URL publik file audio (maks 16 MB)' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "AUDIO",
  "mediaUrl": "https://cdn.tokoanda.com/voice-note.ogg"
}`}
            responseBody={`{
  "success": true,
  "data": { "message": { "id": "msg_Kp7nZs", "type": "AUDIO", "status": "QUEUED" } }
}`} />

          <Endpoint id="msg-location" method="POST" path="/messages/send" title="Kirim Lokasi"
            desc="Mengirim pin lokasi berdasarkan koordinat latitude dan longitude."
            params={[
              { name: 'deviceId',  type: 'string', required: true, desc: 'ID device pengirim' },
              { name: 'to',        type: 'string', required: true, desc: 'Nomor tujuan format internasional' },
              { name: 'type',      type: 'string', required: true, desc: 'Harus berisi nilai LOCATION' },
              { name: 'message',   type: 'string', required: true, desc: 'Format: "latitude,longitude" — contoh: "-6.2088,106.8456"' },
              { name: 'caption',   type: 'string', desc: 'Nama atau deskripsi lokasi' },
            ]}
            requestBody={`{
  "deviceId": "dev_6a3f9c",
  "to":       "6281234567890",
  "type":     "LOCATION",
  "message":  "-6.2088,106.8456",
  "caption":  "Toko Kami — Jl. Sudirman No. 1, Jakarta"
}`}
            responseBody={`{
  "success": true,
  "data": { "message": { "id": "msg_Lm4eWb", "type": "LOCATION", "status": "QUEUED" } }
}`} />

          <Endpoint id="msg-list" method="GET" path="/messages" title="Riwayat Pesan"
            desc="Mengambil daftar pesan yang telah dikirim, dengan opsi filter."
            params={[
              { name: 'deviceId', type: 'string', desc: 'Filter berdasarkan device' },
              { name: 'status',   type: 'string', desc: 'Filter status: PENDING | QUEUED | SENT | DELIVERED | READ | FAILED' },
              { name: 'page',     type: 'number', desc: 'Halaman (default: 1)' },
              { name: 'limit',    type: 'number', desc: 'Jumlah per halaman (default: 20, maks: 100)' },
            ]}
            responseBody={`{
  "success": true,
  "data": {
    "messages": [
      {
        "id":        "msg_8xKq2r",
        "deviceId":  "dev_6a3f9c",
        "to":        "6281234567890",
        "type":      "TEXT",
        "content":   "Halo! Pesanan #4821 sudah dikirim 🚚",
        "status":    "DELIVERED",
        "sentAt":    "2025-06-01T09:00:05.000Z",
        "createdAt": "2025-06-01T09:00:00.000Z"
      }
    ]
  }
}`} />

          {/* ── Broadcast ── */}
          <SectionHead id="broadcast" icon="mdi:broadcast" title="Broadcast"
            desc="Kirim pesan massal ke banyak nomor sekaligus dengan delay acak anti-ban bawaan." />

          <Endpoint id="bc-create" method="POST" path="/broadcasts" title="Buat Broadcast"
            desc="Membuat jadwal broadcast baru. Broadcast tidak langsung jalan — panggil endpoint /start setelah dibuat."
            params={[
              { name: 'name',           type: 'string',   required: true,  desc: 'Nama broadcast untuk identifikasi' },
              { name: 'deviceId',       type: 'string',   required: true,  desc: 'ID device yang akan mengirim' },
              { name: 'type',           type: 'string',   required: true,  desc: 'Jenis pesan: TEXT | IMAGE | VIDEO | DOCUMENT' },
              { name: 'content',        type: 'string',   required: true,  desc: 'Isi pesan. Gunakan {{name}} untuk variabel kontak' },
              { name: 'contactGroupId', type: 'string',   desc: 'ID grup kontak sebagai target' },
              { name: 'mediaUrl',       type: 'string',   desc: 'URL media — wajib jika type bukan TEXT' },
              { name: 'caption',        type: 'string',   desc: 'Caption untuk media' },
              { name: 'scheduledAt',    type: 'string',   desc: 'ISO 8601 — jadwal otomatis mulai pada waktu tertentu' },
              { name: 'delayMin',       type: 'number',   desc: 'Delay minimum antar pesan dalam detik (default: 3)' },
              { name: 'delayMax',       type: 'number',   desc: 'Delay maksimum antar pesan dalam detik (default: 8)' },
            ]}
            requestBody={`{
  "name":           "Flash Sale Juni",
  "deviceId":       "dev_6a3f9c",
  "contactGroupId": "grp_pelanggan_vip",
  "type":           "IMAGE",
  "mediaUrl":       "https://cdn.tokoanda.com/flash-sale.jpg",
  "content":        "Halo {{name}}, ada flash sale khusus untuk Anda! 🎉",
  "delayMin":       4,
  "delayMax":       9
}`}
            responseBody={`{
  "success": true,
  "data": {
    "broadcast": {
      "id":           "bc_9Pq4rT",
      "name":         "Flash Sale Juni",
      "status":       "DRAFT",
      "totalCount":   248,
      "sentCount":    0,
      "failedCount":  0,
      "createdAt":    "2025-06-01T08:00:00.000Z"
    }
  }
}`} />

          <Endpoint id="bc-start" method="POST" path="/broadcasts/{id}/start" title="Mulai / Pause Broadcast"
            desc="Memulai, menjeda, atau melanjutkan broadcast. Ganti {id} dengan ID broadcast."
            params={[
              { name: 'id', type: 'path', required: true, desc: 'ID broadcast dari endpoint buat broadcast' },
            ]}
            responseBody={`// POST /broadcasts/bc_9Pq4rT/start
{
  "success": true,
  "data": { "message": "Broadcast dimulai" }
}

// POST /broadcasts/bc_9Pq4rT/pause
{
  "success": true,
  "data": { "broadcast": { "id": "bc_9Pq4rT", "status": "PAUSED" } }
}

// POST /broadcasts/bc_9Pq4rT/resume
{
  "success": true,
  "data": { "message": "Broadcast dilanjutkan" }
}`} />

          <Endpoint id="bc-status" method="GET" path="/broadcasts/{id}" title="Status & Log Broadcast"
            desc="Mengecek status pengiriman broadcast beserta log per nomor."
            responseBody={`{
  "success": true,
  "data": {
    "broadcast": {
      "id":          "bc_9Pq4rT",
      "status":      "RUNNING",
      "totalCount":  248,
      "sentCount":   112,
      "failedCount": 3,
      "startedAt":   "2025-06-01T08:05:00.000Z"
    }
  }
}`} />

          {/* ── Device ── */}
          <SectionHead id="devices" icon="mdi:cellphone-link" title="Device"
            desc="Kelola nomor WhatsApp yang terhubung ke akun Anda." />

          <Endpoint id="dev-list" method="GET" path="/devices" title="List Device"
            desc="Mengambil semua device milik akun beserta status koneksi."
            responseBody={`{
  "success": true,
  "data": {
    "devices": [
      {
        "id":     "dev_6a3f9c",
        "name":   "Device Utama",
        "phone":  "6281234567890",
        "status": "CONNECTED",
        "minDelay": 3,
        "maxDelay": 8
      },
      {
        "id":     "dev_2b8mXy",
        "name":   "CS Jakarta",
        "phone":  "6282100001111",
        "status": "CONNECTED"
      }
    ]
  }
}`} />

          <Endpoint id="dev-connect" method="POST" path="/devices/{id}/connect" title="Koneksi & QR Code"
            desc="Memulai sesi koneksi dan mendapatkan QR code untuk di-scan di WhatsApp."
            responseBody={`{
  "success": true,
  "data": {
    "deviceId": "dev_6a3f9c",
    "qr": "data:image/png;base64,iVBORw0KGgo..."
  }
}

// Cek QR terbaru: GET /devices/{id}/qr
// Putus koneksi:  POST /devices/{id}/disconnect`} />

          {/* ── Kontak ── */}
          <SectionHead id="contacts" icon="mdi:contacts-outline" title="Kontak"
            desc="Simpan dan kelola database kontak untuk digunakan pada broadcast." />

          <Endpoint id="con-list" method="GET" path="/contacts" title="List Kontak"
            desc="Mengambil daftar kontak dengan opsi filter label atau grup."
            params={[
              { name: 'page',    type: 'number', desc: 'Halaman (default: 1)' },
              { name: 'limit',   type: 'number', desc: 'Per halaman (default: 20)' },
              { name: 'search',  type: 'string', desc: 'Cari berdasarkan nama atau nomor' },
              { name: 'groupId', type: 'string', desc: 'Filter berdasarkan ID grup kontak' },
            ]}
            responseBody={`{
  "success": true,
  "data": {
    "contacts": [
      {
        "id":        "con_Rz7kPs",
        "name":      "Budi Santoso",
        "phone":     "6281234567890",
        "variables": { "kota": "Jakarta", "tier": "VIP" },
        "labels":    [{ "id": "lbl_1", "name": "VIP", "color": "#00C853" }],
        "createdAt": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
}`} />

          <Endpoint id="con-create" method="POST" path="/contacts" title="Tambah Kontak"
            desc="Menambahkan kontak baru ke database. Nomor harus unik per akun."
            params={[
              { name: 'name',      type: 'string', required: true, desc: 'Nama lengkap kontak' },
              { name: 'phone',     type: 'string', required: true, desc: 'Nomor WhatsApp format internasional tanpa +' },
              { name: 'variables', type: 'object', desc: 'Key-value bebas — digunakan sebagai variabel template {{key}}' },
              { name: 'notes',     type: 'string', desc: 'Catatan internal' },
              { name: 'labelIds',  type: 'array',  desc: 'Array ID label yang ditempel ke kontak ini' },
            ]}
            requestBody={`{
  "name":      "Budi Santoso",
  "phone":     "6281234567890",
  "variables": { "kota": "Jakarta", "tier": "VIP" },
  "notes":     "Pelanggan sejak 2023"
}`}
            responseBody={`{
  "success": true,
  "data": {
    "contact": {
      "id":    "con_Rz7kPs",
      "name":  "Budi Santoso",
      "phone": "6281234567890"
    }
  }
}`} />

          {/* ── Webhook ── */}
          <SectionHead id="webhooks" icon="mdi:webhook" title="Webhook Keluar"
            desc="Terima notifikasi real-time ke server Anda setiap kali ada event pesan masuk atau perubahan status." />

          <Endpoint id="wh-create" method="POST" path="/webhooks" title="Buat Webhook"
            desc="Mendaftarkan URL endpoint server Anda untuk menerima event."
            params={[
              { name: 'url',       type: 'string', required: true, desc: 'URL HTTPS yang menerima HTTP POST saat event terjadi' },
              { name: 'events',    type: 'array',  required: true, desc: 'Array event: message.received | message.sent | message.delivered | message.read | device.connected | device.disconnected' },
              { name: 'deviceIds', type: 'array',  desc: 'Batasi ke device tertentu — kosong = semua device' },
              { name: 'secret',    type: 'string', desc: 'Secret untuk verifikasi signature HMAC-SHA256 di header X-Blastify-Signature' },
            ]}
            requestBody={`{
  "url":    "https://server-anda.com/webhook/blastify",
  "events": ["message.received", "message.delivered"],
  "secret": "rahasia_verifikasi_anda"
}`}
            responseBody={`{
  "success": true,
  "data": {
    "webhook": {
      "id":       "wh_Kn3pQr",
      "url":      "https://server-anda.com/webhook/blastify",
      "isActive": true,
      "events":   ["message.received", "message.delivered"]
    }
  }
}`} />

          <div id="wh-payload" className="scroll-mt-24 mb-14">
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">Payload Event</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed mb-5">
              Saat event terjadi, {APP_NAME} mengirim HTTP POST ke URL Anda dengan payload berikut:
            </p>
            <CodeBlock lang="json — contoh event message.received" code={`{
  "event":     "message.received",
  "timestamp": "2025-06-01T09:05:00.000Z",
  "deviceId":  "dev_6a3f9c",
  "data": {
    "from":    "6281234567890",
    "name":    "Budi Santoso",
    "type":    "TEXT",
    "message": "Halo kak, status pesanan saya bagaimana?"
  }
}`} />
            <div className="mt-4 rounded-xl p-4 flex gap-3"
              style={{ background: 'rgba(59,130,246,.05)', border: '1px solid rgba(59,130,246,.2)' }}>
              <Icon icon="mdi:shield-check-outline" className="text-[18px] flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Untuk verifikasi keaslian request, bandingkan header{' '}
                <code className="font-mono text-[11.5px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">X-Blastify-Signature</code>{' '}
                dengan HMAC-SHA256 dari request body menggunakan secret yang Anda daftarkan.
              </p>
            </div>
          </div>

          {/* ── Integrasi (Receive) ── */}
          <SectionHead id="integrations" icon="mdi:puzzle-outline" title="Webhook Masuk (Integrasi)"
            desc="Endpoint publik untuk menerima data dari platform luar (Shopify, Jotform, dll) lalu diteruskan sebagai pesan WhatsApp." />

          <Endpoint id="int-receive" method="POST" path="/integrations/receive/{token}"
            title="Terima Data dari Platform Luar"
            desc="Endpoint ini tidak memerlukan Authorization header — autentikasi menggunakan token unik per integrasi. Token didapat dari menu Integrasi di dashboard."
            params={[
              { name: 'token',  type: 'path',   required: true, desc: 'Token unik integrasi — tampil di dashboard saat membuat integrasi' },
            ]}
            requestBody={`// Contoh payload dari Shopify order webhook:
{
  "customer": {
    "phone":      "+6281234567890",
    "first_name": "Budi"
  },
  "order_number": "#4821",
  "total_price":  "150000.00"
}`}
            responseBody={`{
  "success": true,
  "data": {
    "status":    "QUEUED",
    "messageId": "msg_Xt9nMq"
  }
}`} />

          {/* ── Error Codes ── */}
          <SectionHead id="errors" icon="mdi:alert-circle-outline" title="Kode Error"
            desc="Daftar kode error yang dapat dikembalikan oleh API." />

          <div className="rounded-xl overflow-hidden mb-14" style={{ border: `1px solid ${C.cardBorder}` }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: C.softWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest w-20">HTTP</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest w-44">Kode</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['400', 'VALIDATION_ERROR',    'Request body tidak valid atau parameter wajib tidak diisi'],
                  ['401', 'UNAUTHORIZED',         'API Key tidak diberikan atau tidak valid'],
                  ['403', 'PLAN_LIMIT_EXCEEDED',  'Kuota pesan atau device plan sudah habis'],
                  ['403', 'FEATURE_NOT_ALLOWED',  'Fitur tidak tersedia di plan Anda'],
                  ['404', 'NOT_FOUND',             'Resource yang diminta tidak ditemukan'],
                  ['409', 'DEVICE_NOT_CONNECTED',  'Device belum terhubung ke WhatsApp'],
                  ['409', 'DUPLICATE_PHONE',       'Nomor kontak sudah terdaftar di akun Anda'],
                  ['422', 'INVALID_PHONE',          'Format nomor tidak valid (gunakan format internasional tanpa +)'],
                  ['429', 'RATE_LIMITED',           'Terlalu banyak request — tunggu sebelum mencoba lagi'],
                  ['500', 'INTERNAL_ERROR',         'Kesalahan internal server — hubungi support jika berlanjut'],
                ].map(([code, key, desc], i) => (
                  <tr key={key} style={{ borderTop: i > 0 ? `1px solid ${C.cardBorder}` : undefined }}>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{code}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px]" style={{ color: '#EF4444' }}>{key}</td>
                    <td className="px-4 py-3 text-slate-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer CTA */}
          <div className="rounded-2xl p-8 text-center mb-8"
            style={{ background: 'linear-gradient(135deg, #0A0A14 0%, #0D1A0E 100%)', border: '1px solid rgba(0,200,83,.2)' }}>
            <p className="font-extrabold text-white text-[20px] mb-2">Siap mulai integrasi?</p>
            <p className="text-[13.5px] mb-6" style={{ color: 'rgba(241,245,249,.5)' }}>
              Daftar gratis, dapatkan API Key, dan kirim pesan pertama dalam 2 menit.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 text-white font-bold px-7 py-3 rounded-xl text-[14px] transition-all hover:-translate-y-0.5"
              style={{ background: C.green, boxShadow: '0 4px 24px rgba(0,200,83,.4)' }}>
              Buat Akun Gratis
              <Icon icon="mdi:arrow-right" />
            </Link>
          </div>

        </main>
      </div>
    </div>
  )
}
