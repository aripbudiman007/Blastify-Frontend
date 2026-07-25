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
  name:            z.string().min(2, 'Nama minimal 2 karakter'),
  email:           z.string().email('Email tidak valid'),
  password:        z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // Rate limiting
  const { isLimited, secondsRemaining } = useRateLimit('/auth/register', 3600)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Omit<FormData, 'confirmPassword'>) => {
      if (isLimited) {
        return Promise.reject(
          new Error(`Silakan tunggu ${secondsRemaining} detik sebelum mencoba lagi.`)
        )
      }
      return authApi.register(d)
    },
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data.data
      login({ accessToken, refreshToken }, user)
      toast.success('Akun berhasil dibuat!')
      navigate('/dashboard')
    },
    onError: (err: AxiosError<{ message: string; error?: { code?: string } }>) => {
      // Handle rate limit
      if (isAxiosError429(err)) {
        const retryAfter = parseInt((err.response?.headers['retry-after'] as string) || '3600')
        storeRateLimitToLocalStorage('/auth/register', retryAfter)
        toast.error(
          `Terlalu banyak percobaan. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
          { duration: 6000 }
        )
        return
      }
      toast.error(err.response?.data?.message ?? 'Registrasi gagal')
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[26px] font-bold text-foreground tracking-tight">Buat Akun</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Gratis selamanya, tanpa kartu kredit
        </p>
      </div>

      {isLimited && (
        <div className="mb-5 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
          <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
          <div>
            <div className="font-semibold mb-1">Terlalu banyak pendaftaran</div>
            <div>Silakan tunggu {secondsRemaining > 60 ? `${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s` : `${secondsRemaining}s`} sebelum mencoba lagi.</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(({ name, email, password }) => mutate({ name, email, password }))}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap</Label>
          <Input
            id="name"
            placeholder="Budi Santoso"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="anda@email.com"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 karakter"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="h-11"
            disabled={isLimited || isPending}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-wa-600 hover:bg-wa-700 text-white font-semibold rounded-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPending || isLimited}
        >
          {isLimited ? (
            <><Icon icon="mdi:clock-outline" className="mr-2 text-base" />Coba lagi dalam {secondsRemaining}s</>
          ) : isPending ? (
            <><Icon icon="mdi:loading" className="animate-spin mr-2 text-base" />Mendaftar...</>
          ) : (
            <><Icon icon="mdi:account-plus" className="mr-2 text-base" />Buat Akun Gratis</>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-wa-600 hover:text-wa-700 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
