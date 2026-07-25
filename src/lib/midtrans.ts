// Midtrans Snap popup helper.
// Popup hanya dipakai jika VITE_MIDTRANS_CLIENT_KEY diset — selain itu
// (atau jika script gagal dimuat) fallback redirect ke paymentUrl.

const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string | undefined
const IS_PRODUCTION = (import.meta.env.VITE_MIDTRANS_PRODUCTION as string | undefined) === 'true'

const SNAP_SCRIPT_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

declare global {
  interface Window {
    snap?: { pay: (token: string, options?: Record<string, unknown>) => void }
  }
}

let snapLoading: Promise<void> | null = null

function loadSnapScript(): Promise<void> {
  if (window.snap) return Promise.resolve()
  if (snapLoading) return snapLoading

  snapLoading = new Promise((resolve, reject) => {
    if (!CLIENT_KEY) {
      snapLoading = null
      return reject(new Error('Midtrans Client Key not configured'))
    }

    const script = document.createElement('script')
    script.src = SNAP_SCRIPT_URL
    script.setAttribute('data-client-key', CLIENT_KEY)
    script.onload = () => resolve()
    script.onerror = () => { snapLoading = null; reject(new Error('Failed to load Midtrans Snap')) }
    document.head.appendChild(script)
  })
  return snapLoading
}

/**
 * Buka pembayaran: Snap popup jika snapToken + client key tersedia,
 * selain itu buka paymentUrl di tab baru.
 */
export async function openPayment(snapToken: string | undefined, paymentUrl: string | null | undefined): Promise<void> {
  if (snapToken && CLIENT_KEY) {
    try {
      await loadSnapScript()
      window.snap!.pay(snapToken)
      return
    } catch {
      // script diblokir / gagal dimuat — jatuh ke redirect
    }
  }
  if (paymentUrl) window.open(paymentUrl, '_blank')
}
