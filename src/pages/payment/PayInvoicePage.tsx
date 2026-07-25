import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { accountApi, accountQueryKeys } from '@/api/account.api'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CopyButton } from '@/components/common/CopyButton'
import { cn, formatDate } from '@/lib/utils'
import { PLAN_COLORS, INVOICE_STATUS_COLORS } from '@/lib/constants'

/**
 * Halaman pembayaran invoice — tujuan fallback `paymentUrl` dari backend
 * saat payment gateway tidak dikonfigurasi ({APP_URL}/pay/{invoiceId}).
 * Untuk invoice gateway (Midtrans/iPaymu) tombol bayar mengarah ke URL hosted.
 */
export function PayInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()

  const { data: invoice, isLoading } = useQuery({
    queryKey: accountQueryKeys.invoices,
    queryFn:  accountApi.getInvoices,
    select:   (r) => (r.data.data?.invoices ?? []).find((i) => i.id === invoiceId),
  })

  if (isLoading) return <PageLoader />

  if (!invoice) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Pembayaran" description="Detail invoice" />
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <Icon icon="mdi:receipt-text-remove-outline" className="text-4xl text-muted-foreground" />
            <p className="font-medium">Invoice tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">
              Invoice ini tidak ada di akun Anda, atau Anda login dengan akun yang berbeda.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/account"><Icon icon="mdi:arrow-left" className="mr-2" />Kembali ke Akun</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid    = invoice.status === 'PAID'
  const isPending = invoice.status === 'PENDING'
  // paymentUrl gateway = URL eksternal; paymentUrl manual menunjuk balik ke halaman ini
  const externalPayUrl = invoice.paymentUrl && !invoice.paymentUrl.includes('/pay/') ? invoice.paymentUrl : null

  return (
    <div className="max-w-lg">
      <PageHeader title="Pembayaran" description="Selesaikan pembayaran invoice Anda" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="mdi:receipt-text-outline" className="text-wa-600" />
            Detail Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nomor Invoice</span>
              <span className="flex items-center gap-1.5 font-mono text-xs">
                {invoice.id}
                <CopyButton text={invoice.id} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={cn('text-xs py-0', INVOICE_STATUS_COLORS[invoice.status] ?? '')}>{invoice.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', PLAN_COLORS[invoice.plan])}>{invoice.plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-semibold text-base">
                {invoice.amount === 0 ? 'Gratis' : `Rp ${(invoice.amount / 100).toLocaleString('id-ID')}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dibuat</span>
              <span>{formatDate(invoice.createdAt)}</span>
            </div>
            {invoice.expiresAt && isPending && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bayar sebelum</span>
                <span className="text-amber-600 font-medium">{formatDate(invoice.expiresAt)}</span>
              </div>
            )}
          </div>

          <Separator />

          {isPaid ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
              <Icon icon="mdi:check-circle" className="flex-shrink-0 mt-0.5" />
              <span>Invoice sudah dibayar{invoice.paidAt ? ` pada ${formatDate(invoice.paidAt)}` : ''}. Plan Anda sudah aktif.</span>
            </div>
          ) : !isPending ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
              <Icon icon="mdi:information-outline" className="flex-shrink-0 mt-0.5" />
              <span>Invoice ini berstatus {invoice.status} dan tidak bisa dibayar lagi. Buat invoice upgrade baru dari halaman Akun.</span>
            </div>
          ) : externalPayUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk membayar melalui payment gateway. Plan aktif otomatis setelah pembayaran terverifikasi.
              </p>
              <Button className="w-full bg-wa-600 hover:bg-wa-700" onClick={() => window.open(externalPayUrl, '_blank')}>
                <Icon icon="mdi:credit-card-outline" className="mr-2" />Bayar Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pembayaran Manual</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Hubungi admin melalui kontak yang tertera di website untuk mendapatkan detail rekening tujuan.',
                  `Lakukan transfer sebesar Rp ${(invoice.amount / 100).toLocaleString('id-ID')} dan sertakan nomor invoice sebagai berita transfer.`,
                  'Kirim bukti transfer ke admin. Plan Anda diaktifkan setelah admin mengonfirmasi pembayaran.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-wa-600/10 text-wa-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                <Icon icon="mdi:clock-alert-outline" className="flex-shrink-0 mt-0.5" />
                <span>Invoice kedaluwarsa otomatis jika tidak dibayar sebelum batas waktu di atas.</span>
              </div>
            </div>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link to="/account"><Icon icon="mdi:arrow-left" className="mr-2" />Kembali ke Akun</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
