import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  email: z.string().email('Email tidak valid'),
})
type FormData = z.infer<typeof schema>

type ApiErrorBody = { error?: { code?: string; message?: string }; message?: string }

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: FormData) => authApi.forgotPassword(d.email),
    onSuccess: () => setSent(true),
    onError: (err: AxiosError<ApiErrorBody>) => {
      if (err.response?.status === 429) {
        toast.error(err.response?.data?.error?.message ?? 'Terlalu banyak permintaan. Coba lagi nanti.')
        return
      }
      toast.error(err.response?.data?.error?.message ?? 'Gagal mengirim link reset password')
    },
  })

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-wa-600/10 flex items-center justify-center mx-auto mb-5">
          <Icon icon="mdi:email-check-outline" className="text-3xl text-wa-600" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">Cek Email Anda</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Jika email tersebut terdaftar, kami sudah mengirimkan link reset password.
          Cek inbox (dan folder spam) Anda.
        </p>

        <div className="mt-8 pt-6 border-t border-border">
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
        <h2 className="text-[26px] font-bold text-foreground tracking-tight">Lupa Password</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Masukkan email Anda, kami akan kirimkan link untuk reset password
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="anda@email.com"
            autoComplete="email"
            className="h-11"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-wa-600 hover:bg-wa-700 text-white font-semibold rounded-lg"
          disabled={isPending}
        >
          {isPending ? (
            <><Icon icon="mdi:loading" className="animate-spin mr-2 text-base" />Mengirim...</>
          ) : (
            <><Icon icon="mdi:email-arrow-right-outline" className="mr-2 text-base" />Kirim Link Reset</>
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
