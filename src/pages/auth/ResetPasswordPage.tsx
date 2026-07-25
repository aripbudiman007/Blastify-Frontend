import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AxiosError } from 'axios'

const schema = z.object({
  password:        z.string().min(8, 'Password minimal 8 karakter').max(100, 'Password maksimal 100 karakter'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

type ApiErrorBody = { error?: { code?: string; message?: string }; message?: string }

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [tokenInvalid, setTokenInvalid] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: FormData) => authApi.resetPassword({ token, password: d.password }),
    onSuccess: () => {
      toast.success('Password berhasil direset. Kami juga mengirim email konfirmasi ke alamat Anda. Silakan masuk dengan password baru.')
      navigate('/login')
    },
    onError: (err: AxiosError<ApiErrorBody>) => {
      const code = err.response?.data?.error?.code
      if (code === 'INVALID_RESET_TOKEN') {
        setTokenInvalid(true)
        return
      }
      toast.error(err.response?.data?.error?.message ?? 'Gagal mereset password')
    },
  })

  if (!token || tokenInvalid) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-5">
          <Icon icon="mdi:link-off" className="text-3xl text-red-500" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">Link Tidak Berlaku</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Link reset password ini sudah tidak berlaku (kadaluarsa setelah 1 jam atau sudah pernah dipakai).
          Silakan minta link baru.
        </p>

        <Button
          className="w-full h-11 bg-wa-600 hover:bg-wa-700 text-white font-semibold rounded-lg mt-6"
          onClick={() => navigate('/forgot-password')}
        >
          <Icon icon="mdi:email-arrow-right-outline" className="mr-2 text-base" />
          Minta Link Baru
        </Button>

        <div className="mt-6 pt-6 border-t border-border">
          <Link to="/login" className="text-sm text-wa-600 hover:text-wa-700 font-semibold hover:underline">
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[26px] font-bold text-foreground tracking-tight">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Masukkan password baru untuk akun Anda
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password Baru</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 karakter"
            autoComplete="new-password"
            className="h-11"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Konfirmasi Password Baru</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-11"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-wa-600 hover:bg-wa-700 text-white font-semibold rounded-lg"
          disabled={isPending}
        >
          {isPending ? (
            <><Icon icon="mdi:loading" className="animate-spin mr-2 text-base" />Menyimpan...</>
          ) : (
            <><Icon icon="mdi:lock-reset" className="mr-2 text-base" />Reset Password</>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Ingat password Anda?{' '}
          <Link to="/login" className="text-wa-600 hover:text-wa-700 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
