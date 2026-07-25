export const API_URL    = import.meta.env.VITE_API_URL    as string
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string
export const APP_NAME   = (import.meta.env.VITE_APP_NAME as string) || 'Blastify'

// URL tempat aplikasi (login/dashboard) di-hosting — beda domain dari landing page.
// Di production: https://app.blastify.id. Di dev: kosongkan/localhost karena masih 1 server yang sama.
export const APP_URL = (import.meta.env.VITE_APP_URL as string) || 'https://app.blastify.id'

// ─── Plan definitions (must match backend PlanLimit table) ────────────────────

export const PLAN_LIMITS: Record<string, {
  devices: number
  messages: number
  contacts: number
  broadcasts: number
  canAutoReply: boolean
  canDeviceRotation: boolean
  canWebhook: boolean
  canCsvImport: boolean
  canAiReply: boolean
  aiMonthlyReplies: number
}> = {
  FREE:     { devices: 1,   messages: 1_000,   contacts: 500,       broadcasts: 3,  canAutoReply: false, canDeviceRotation: false, canWebhook: false, canCsvImport: false, canAiReply: false, aiMonthlyReplies: 0      },
  LITE:     { devices: 1,   messages: 1_000,   contacts: 1_000,     broadcasts: 5,  canAutoReply: false, canDeviceRotation: false, canWebhook: true,  canCsvImport: false, canAiReply: false, aiMonthlyReplies: 0      },
  REGULAR:  { devices: 3,   messages: 10_000,  contacts: 5_000,     broadcasts: 20, canAutoReply: true,  canDeviceRotation: false, canWebhook: true,  canCsvImport: true,  canAiReply: false, aiMonthlyReplies: 0      },
  MASTER:   { devices: 10,  messages: 999_999, contacts: 999_999,   broadcasts: 999, canAutoReply: true, canDeviceRotation: true,  canWebhook: true,  canCsvImport: true,  canAiReply: true,  aiMonthlyReplies: 2_000  },
  ULTRA:    { devices: 999, messages: 999_999, contacts: 999_999,   broadcasts: 999, canAutoReply: true, canDeviceRotation: true,  canWebhook: true,  canCsvImport: true,  canAiReply: true,  aiMonthlyReplies: 10_000 },
}

export const PLAN_COLORS: Record<string, string> = {
  FREE:    'bg-gray-100    text-gray-800    dark:bg-gray-800    dark:text-gray-100',
  LITE:    'bg-blue-100    text-blue-800    dark:bg-blue-900    dark:text-blue-100',
  REGULAR: 'bg-purple-100  text-purple-800  dark:bg-purple-900  dark:text-purple-100',
  MASTER:  'bg-amber-100   text-amber-800   dark:bg-amber-900   dark:text-amber-100',
  ULTRA:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
}

export const PLAN_PRICES: Record<string, string> = {
  FREE:    'Gratis',
  LITE:    'Rp 25.000/bln',
  REGULAR: 'Rp 66.000/bln',
  MASTER:  'Rp 175.000/bln',
  ULTRA:   'Rp 355.000/bln',
}

// ─── Webhook events ───────────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  { value: 'message.received',   label: 'Pesan Diterima'        },
  { value: 'message.sent',       label: 'Pesan Terkirim'        },
  { value: 'message.delivered',  label: 'Pesan Tersampaikan'    },
  { value: 'message.read',       label: 'Pesan Dibaca'          },
  { value: 'device.connected',   label: 'Device Terhubung'      },
  { value: 'device.disconnected',label: 'Device Terputus'       },
  { value: 'device.qr',          label: 'QR Code Diperbarui'    },
]

// ─── Message types ────────────────────────────────────────────────────────────

export const MESSAGE_TYPE_LABELS: Record<string, string> = {
  TEXT:     'Teks',
  IMAGE:    'Gambar',
  VIDEO:    'Video',
  DOCUMENT: 'Dokumen',
  AUDIO:    'Audio',
  LOCATION: 'Lokasi',
  CONTACT:  'Kontak',
  TEMPLATE: 'Template',
  LIST:     'List Interaktif',
  BUTTON:   'Tombol',
}

export const MESSAGE_TYPE_ICONS: Record<string, string> = {
  TEXT:     'mdi:message-text',
  IMAGE:    'mdi:image',
  VIDEO:    'mdi:video',
  DOCUMENT: 'mdi:file-document',
  AUDIO:    'mdi:microphone',
  LOCATION: 'mdi:map-marker',
  CONTACT:  'mdi:account-card',
  TEMPLATE: 'mdi:card-text',
  LIST:     'mdi:format-list-bulleted',
  BUTTON:   'mdi:gesture-tap-button',
}

// ─── Status colours ───────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  // message
  PENDING:      'bg-gray-100   text-gray-700',
  QUEUED:       'bg-blue-100   text-blue-700',
  SENT:         'bg-cyan-100   text-cyan-700',
  DELIVERED:    'bg-green-100  text-green-700',
  READ:         'bg-emerald-100 text-emerald-700',
  FAILED:       'bg-red-100    text-red-700',
  // device
  CONNECTED:    'bg-green-100  text-green-700',
  CONNECTING:   'bg-blue-100   text-blue-700',
  QR_READY:     'bg-yellow-100 text-yellow-700',
  DISCONNECTED: 'bg-gray-100   text-gray-700',
  LOGGED_OUT:   'bg-gray-100   text-gray-700',
  BANNED:       'bg-red-100    text-red-700',
  // broadcast
  DRAFT:        'bg-gray-100   text-gray-700',
  RUNNING:      'bg-blue-100   text-blue-700',
  PAUSED:       'bg-yellow-100 text-yellow-700',
  FINISHED:     'bg-emerald-100 text-emerald-700',
}

// ─── Auto-reply match types ───────────────────────────────────────────────────

export const MATCH_TYPE_LABELS: Record<string, string> = {
  EXACT:       'Persis',
  CONTAINS:    'Mengandung',
  STARTS_WITH: 'Diawali',
  REGEX:       'Regex',
  AI:          'AI (LLM)',
}

// ─── Invoice status colours ───────────────────────────────────────────────────

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  PAID:      'bg-emerald-100 text-emerald-700',
  EXPIRED:   'bg-gray-100   text-gray-700',
  CANCELLED: 'bg-red-100    text-red-700',
}

// ─── Plan prices (IDR display) ────────────────────────────────────────────────

export const PLAN_UPGRADE_PRICES: Record<string, { display: string; amount: number }> = {
  FREE:    { display: 'Gratis',          amount: 0         },
  LITE:    { display: 'Rp 25.000/bln',   amount: 2500000   },
  REGULAR: { display: 'Rp 66.000/bln',   amount: 6600000   },
  MASTER:  { display: 'Rp 175.000/bln',  amount: 17500000  },
  ULTRA:   { display: 'Rp 355.000/bln',  amount: 35500000  },
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const QR_TIMEOUT = 60
