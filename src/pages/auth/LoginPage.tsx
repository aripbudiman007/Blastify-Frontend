import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRateLimit } from '@/hooks/useRateLimit'
import { storeRateLimitToLocalStorage, isAxiosError429 } from '@/utils/errorHandler'
import type { AxiosError } from 'axios'

const schema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  otp:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

type ApiErrorBody = { error?: { code?: string; message?: string }; message?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // Rate limiting
  const { isLimited, secondsRemaining } = useRateLimit('/auth/login', 900)

  // 2FA: backend menolak dengan OTP_REQUIRED → tampilkan input kode 6 digit
  const [otpRequired, setOtpRequired] = useState(false)
  // Email belum diverifikasi → tawarkan kirim ulang link
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (d: FormData) => {
      if (isLimited) {
        return Promise.reject(
          new Error(`Silakan tunggu ${secondsRemaining} detik sebelum mencoba lagi.`)
        )
      }
      return authApi.login({ email: d.email, password: d.password, otp: d.otp || undefined })
    },
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data.data
      login({ accessToken, refreshToken }, user)
      toast.success(`Selamat datang, ${user.name}!`)
      navigate('/dashboard')
    },
    onError: (err: AxiosError<ApiErrorBody>, variables) => {
      const code = err.response?.data?.error?.code

      // Handle rate limit
      if (isAxiosError429(err)) {
        const retryAfter = parseInt((err.response?.headers['retry-after'] as string) || '900')
        storeRateLimitToLocalStorage('/auth/login', retryAfter)
        toast.error(
          `Terlalu banyak percobaan. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
          { duration: 6000 }
        )
        return
      }

      if (code === 'OTP_REQUIRED') {
        setOtpRequired(true)
        toast.info('Masukkan kode dari aplikasi authenticator Anda')
        return
      }
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(variables.email)
        return
      }
      if (code === 'INVALID_OTP') {
        toast.error('Kode 2FA salah. Coba lagi.')
        return
      }
      toast.error(err.response?.data?.error?.message ?? 'Login gagal')
    },
  })

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => toast.success('Link verifikasi dikirim. Cek inbox (dan folder spam) Anda.'),
    onError: () => toast.error('Gagal mengirim ulang. Coba beberapa menit lagi.'),
  })

  const errorCode = (error as AxiosError<ApiErrorBody> | null)?.response?.data?.error?.code
  const showErrorBanner = isError && errorCode !== 'OTP_REQUIRED' && errorCode !== 'EMAIL_NOT_VERIFIED'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[26px] font-bold text-foreground tracking-tight">Masuk</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Masuk ke dashboard Blastify Anda
        </p>
      </div>

      {showErrorBanner && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400">
          <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
          <span>{(error as AxiosError<ApiErrorBody>).response?.data?.error?.message ?? 'Email atau password salah'}</span>
        </div>
      )}

      {unverifiedEmail && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Icon icon="mdi:email-alert-outline" className="flex-shrink-0 mt-0.5 text-base" />
            <span>
              Email <strong>{unverifiedEmail}</strong> belum diverifikasi. Klik link verifikasi
              di email Anda terlebih dahulu.
            </span>
          </div>
          <Button
            type="button" size="sm" variant="outline"
            className="w-full border-amber-300 dark:border-amber-700"
            disabled={resending}
            onClick={() => resend(unverifiedEmail)}
          >
            {resending
              ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Mengirim...</>
              : <><Icon icon="mdi:email-sync-outline" className="mr-2" />Kirim Ulang Email Verifikasi</>
            }
          </Button>
        </div>
      )}

      {isLimited && (
        <div className="mb-5 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
          <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
          <div>
            <div className="font-semibold mb-1">Terlalu banyak percobaan</div>
            <div>Silakan tunggu {secondsRemaining > 60 ? `${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s` : `${secondsRemaining}s`} sebelum mencoba lagi.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="anda@email.com"
            autoComplete="email"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link to="/forgot-password" className="text-xs text-wa-600 hover:text-wa-700 font-medium hover:underline">
              Lupa password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {otpRequired && (
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-sm font-medium">Kode Autentikasi (2FA)</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              autoComplete="one-time-code"
              className="h-11 text-center text-lg tracking-[0.5em] font-mono"
              disabled={isLimited || isPending}
              autoFocus
              {...register('otp')}
            />
            <p className="text-xs text-muted-foreground">
              Buka aplikasi authenticator (Google Authenticator/Authy) dan masukkan kode 6 digit.
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-wa-600 hover:bg-wa-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPending || isLimited}
        >
          {isLimited ? (
            <><Icon icon="mdi:clock-outline" className="mr-2 text-base" />Coba lagi dalam {secondsRemaining}s</>
          ) : isPending ? (
            <><Icon icon="mdi:loading" className="animate-spin mr-2 text-base" />Masuk...</>
          ) : (
            <><Icon icon="mdi:login" className="mr-2 text-base" />Masuk ke Dashboard</>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="text-wa-600 hover:text-wa-700 font-semibold hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
