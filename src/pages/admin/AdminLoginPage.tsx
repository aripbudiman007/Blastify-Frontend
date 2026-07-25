import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.api'
import { useAdminStore } from '@/store/admin.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_NAME } from '@/lib/constants'
import type { AdminRole } from '@/types'

const schema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib'),
})
type FormData = z.infer<typeof schema>

export function AdminLoginPage() {
  const navigate = useNavigate()
  const setAdmin = useAdminStore(s => s.setAdmin)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (d: FormData) => {
    try {
      const res = await adminApi.login(d.email, d.password)
      const { token, admin } = res.data.data
      setAdmin(token, { ...admin, role: admin.role as AdminRole })
      navigate('/admin/dashboard', { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Login gagal. Periksa email dan password.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt={APP_NAME} className="w-14 h-14" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-slate-400">{APP_NAME} Backoffice</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Email Admin</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-red-600"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-red-600"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Masuk...</>
                : <><Icon icon="mdi:login" className="mr-2" />Masuk</>
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Akses terbatas — hanya untuk administrator
        </p>
      </div>
    </div>
  )
}
