import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'

/** Halaman tujuan link verifikasi email: /verify-email?token=... */
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { isSuccess, isError, isLoading } = useQuery({
    queryKey: ['verify-email', token],
    queryFn:  () => authApi.verifyEmail(token),
    enabled:  !!token,
    retry:    false,
  })

  return (
    <div className="animate-fade-in text-center">
      {!token || isError ? (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4">
            <Icon icon="mdi:link-off" className="text-3xl text-red-600" />
          </div>
          <h2 className="text-xl font-bold">Link verifikasi tidak valid</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Token sudah dipakai, kedaluwarsa (24 jam), atau tidak lengkap. Login lalu kirim ulang
            email verifikasi dari halaman masuk.
          </p>
        </>
      ) : isLoading ? (
        <>
          <Icon icon="mdi:loading" className="animate-spin text-4xl text-wa-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Memverifikasi email…</h2>
        </>
      ) : isSuccess ? (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
            <Icon icon="mdi:email-check" className="text-3xl text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">Email terverifikasi!</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Akun Anda sudah aktif. Silakan masuk untuk mulai menggunakan dashboard.
          </p>
        </>
      ) : null}

      <Button asChild className="bg-wa-600 hover:bg-wa-700">
        <Link to="/login"><Icon icon="mdi:login" className="mr-2" />Ke Halaman Masuk</Link>
      </Button>
    </div>
  )
}
