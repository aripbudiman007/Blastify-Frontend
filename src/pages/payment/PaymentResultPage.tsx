import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { accountApi, accountQueryKeys } from '@/api/account.api'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import { PLAN_COLORS, INVOICE_STATUS_COLORS } from '@/lib/constants'

/**
 * Return URL dari payment gateway (iPaymu returnUrl/cancelUrl, Midtrans finish).
 * Callback gateway ke backend bisa datang beberapa detik setelah redirect,
 * jadi halaman success mem-poll daftar invoice sampai invoice terakhir PAID.
 */
export function PaymentResultPage({ variant }: { variant: 'success' | 'cancelled' }) {
  const { user, updateUser } = useAuthStore()
  const [pollCount, setPollCount] = useState(0)
  const maxPollAttempts = 30 // ~2 menit dengan backoff

  const { data: latestInvoice } = useQuery({
    queryKey: accountQueryKeys.invoices,
    queryFn:  accountApi.getInvoices,
    select:   (r) => (r.data.data?.invoices ?? [])[0],
    enabled:  variant === 'success',
    refetchInterval: (query) => {
      const latest = query.state.data?.data.data?.invoices?.[0]
      const isPending = !latest || latest.status === 'PENDING'

      if (!isPending) {
        setPollCount(0)
        return false
      }

      if (pollCount >= maxPollAttempts) {
        return false
      }

      setPollCount((p) => p + 1)
      const interval = Math.min(4000 + pollCount * 500, 10000)
      return interval
    },
  })

  const isPaid = latestInvoice?.status === 'PAID'

  // Sinkronkan plan di store setelah pembayaran terkonfirmasi
  useEffect(() => {
    if (!isPaid) return
    accountApi.getMe().then((res) => {
      const u = res.data.data?.user
      if (u && u.plan !== user?.plan) updateUser({ plan: u.plan })
    }).catch(() => { /* non-kritis — plan tersinkron saat load berikutnya */ })
  }, [isPaid]) // eslint-disable-line react-hooks/exhaustive-deps

  if (variant === 'cancelled') {
    return (
      <div className="max-w-lg">
        <PageHeader title="Pembayaran Dibatalkan" description="Transaksi tidak dilanjutkan" />
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <Icon icon="mdi:close-circle-outline" className="text-3xl text-amber-600" />
            </div>
            <p className="font-semibold text-lg">Pembayaran dibatalkan</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tidak ada dana yang terpotong. Invoice tetap berstatus PENDING — Anda bisa membayarnya
              lagi dari halaman Akun selama belum kedaluwarsa.
            </p>
            <div className="flex gap-2 mt-2">
              <Button asChild className="bg-wa-600 hover:bg-wa-700">
                <Link to="/account"><Icon icon="mdi:credit-card-outline" className="mr-2" />Coba Bayar Lagi</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Ke Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Pembayaran" description="Konfirmasi status pembayaran" />
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          {isPaid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Icon icon="mdi:check-circle" className="text-3xl text-emerald-600" />
              </div>
              <p className="font-semibold text-lg">Pembayaran berhasil!</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Plan <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', PLAN_COLORS[latestInvoice.plan])}>{latestInvoice.plan}</span>{' '}
                sudah aktif{latestInvoice.paidAt ? ` sejak ${formatDate(latestInvoice.paidAt)}` : ''}. Selamat menggunakan fitur baru Anda!
              </p>
              <Button asChild className="bg-wa-600 hover:bg-wa-700 mt-2">
                <Link to="/dashboard"><Icon icon="mdi:view-dashboard" className="mr-2" />Ke Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Icon icon="mdi:loading" className="animate-spin text-4xl text-wa-600" />
              <p className="font-semibold text-lg">Menunggu konfirmasi pembayaran…</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Pembayaran Anda sedang diverifikasi oleh payment gateway. Halaman ini akan
                diperbarui otomatis — biasanya kurang dari satu menit.
              </p>
              {latestInvoice && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Badge className={cn('text-xs py-0', INVOICE_STATUS_COLORS[latestInvoice.status] ?? '')}>{latestInvoice.status}</Badge>
                  <span className="text-muted-foreground text-xs font-mono">{latestInvoice.id}</span>
                </div>
              )}
              <Button asChild variant="outline" className="mt-2">
                <Link to="/account">Lihat Riwayat Invoice</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
