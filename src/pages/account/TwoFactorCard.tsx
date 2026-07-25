import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { accountApi, accountQueryKeys } from '@/api/account.api'
import { useRateLimit } from '@/hooks/useRateLimit'
import { storeRateLimitToLocalStorage, isAxiosError429 } from '@/utils/errorHandler'
import { CopyButton } from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { AxiosError } from 'axios'

type ApiErrorBody = { error?: { code?: string; message?: string } }

interface SetupData {
  secret: string
  otpauthUri: string
  qrDataUrl: string
}

/** Kartu pengaturan 2FA (TOTP) — dipakai di tab Keamanan AccountPage. */
export function TwoFactorCard({ totpEnabled }: { totpEnabled: boolean }) {
  const queryClient = useQueryClient()
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')

  // Rate limiting for 2FA operations
  const { isLimited: isEnableLimited, secondsRemaining: enableSecondsRemaining } = useRateLimit('/account/2fa/enable', 900)
  const { isLimited: isDisableLimited, secondsRemaining: disableSecondsRemaining } = useRateLimit('/account/2fa/disable', 900)

  const invalidateMe = () => queryClient.invalidateQueries({ queryKey: accountQueryKeys.me })

  const { mutate: setup, isPending: settingUp } = useMutation({
    mutationFn: accountApi.setup2fa,
    onSuccess: (res) => setSetupData(res.data.data),
    onError: (err: AxiosError<ApiErrorBody>) =>
      toast.error(err.response?.data?.error?.message ?? 'Gagal memulai setup 2FA'),
  })

  const { mutate: enable, isPending: enabling } = useMutation({
    mutationFn: (code: string) => accountApi.enable2fa(code),
    onSuccess: () => {
      toast.success('2FA aktif. Login berikutnya membutuhkan kode authenticator.')
      setSetupData(null); setOtp('')
      invalidateMe()
    },
    onError: (err: AxiosError<ApiErrorBody>) => {
      // Handle rate limit
      if (isAxiosError429(err)) {
        const retryAfter = parseInt((err.response?.headers['retry-after'] as string) || '900')
        storeRateLimitToLocalStorage('/account/2fa/enable', retryAfter)
        toast.error(
          `Terlalu banyak percobaan. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
          { duration: 6000 }
        )
        return
      }
      toast.error(
        err.response?.data?.error?.code === 'INVALID_OTP'
          ? 'Kode salah. Pastikan jam perangkat Anda akurat, lalu coba lagi.'
          : err.response?.data?.error?.message ?? 'Gagal mengaktifkan 2FA',
      )
    },
  })

  const { mutate: disable, isPending: disabling } = useMutation({
    mutationFn: (pwd: string) => accountApi.disable2fa(pwd),
    onSuccess: () => {
      toast.success('2FA dinonaktifkan')
      setPassword('')
      invalidateMe()
    },
    onError: (err: AxiosError<ApiErrorBody>) => {
      // Handle rate limit
      if (isAxiosError429(err)) {
        const retryAfter = parseInt((err.response?.headers['retry-after'] as string) || '900')
        storeRateLimitToLocalStorage('/account/2fa/disable', retryAfter)
        toast.error(
          `Terlalu banyak percobaan. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
          { duration: 6000 }
        )
        return
      }
      toast.error(
        err.response?.data?.error?.code === 'INVALID_PASSWORD'
          ? 'Password salah'
          : err.response?.data?.error?.message ?? 'Gagal menonaktifkan 2FA',
      )
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon icon="mdi:shield-lock" className="text-wa-600" />
          Two-Factor Authentication (2FA)
          {totpEnabled
            ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ml-1">Aktif</Badge>
            : <Badge variant="secondary" className="text-[10px] ml-1">Nonaktif</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lapisan keamanan tambahan: setelah aktif, login membutuhkan kode 6 digit dari aplikasi
          authenticator (Google Authenticator, Authy, 1Password, dll) selain password.
        </p>

        {totpEnabled ? (
          /* ── Nonaktifkan ─────────────────────────────────────────────────── */
          <div className="space-y-3">
            <Separator />
            {isDisableLimited && (
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
                <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
                <div>
                  <div className="font-semibold mb-1">Terlalu banyak percobaan</div>
                  <div>Silakan tunggu {disableSecondsRemaining > 60 ? `${Math.floor(disableSecondsRemaining / 60)}m ${disableSecondsRemaining % 60}s` : `${disableSecondsRemaining}s`} sebelum mencoba lagi.</div>
                </div>
              </div>
            )}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nonaktifkan 2FA</p>
            <p className="text-sm text-muted-foreground">
              Konfirmasi dengan password akun (bukan kode OTP) — sehingga tetap bisa dilepas
              walau authenticator hilang.
            </p>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password" placeholder="Password akun Anda"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={isDisableLimited || disabling}
              />
            </div>
            <Button
              variant="outline"
              className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabling || password.length === 0 || isDisableLimited}
              onClick={() => disable(password)}
            >
              {isDisableLimited ? (
                <><Icon icon="mdi:clock-outline" className="mr-2" />Coba lagi dalam {disableSecondsRemaining}s</>
              ) : disabling ? (
                <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menonaktifkan...</>
              ) : (
                <><Icon icon="mdi:shield-off-outline" className="mr-2" />Nonaktifkan 2FA</>
              )}
            </Button>
          </div>
        ) : !setupData ? (
          /* ── Mulai setup ─────────────────────────────────────────────────── */
          <>
            {isEnableLimited && (
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
                <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
                <div>
                  <div className="font-semibold mb-1">Terlalu banyak percobaan</div>
                  <div>Silakan tunggu {enableSecondsRemaining > 60 ? `${Math.floor(enableSecondsRemaining / 60)}m ${enableSecondsRemaining % 60}s` : `${enableSecondsRemaining}s`} sebelum mencoba lagi.</div>
                </div>
              </div>
            )}
            <Button
              className="bg-wa-600 hover:bg-wa-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={settingUp || isEnableLimited}
              onClick={() => setup()}
            >
              {isEnableLimited ? (
                <><Icon icon="mdi:clock-outline" className="mr-2" />Coba lagi dalam {enableSecondsRemaining}s</>
              ) : settingUp ? (
                <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyiapkan...</>
              ) : (
                <><Icon icon="mdi:shield-plus-outline" className="mr-2" />Aktifkan 2FA</>
              )}
            </Button>
          </>
        ) : (
          /* ── Scan QR + konfirmasi kode ───────────────────────────────────── */
          <div className="space-y-4">
            <Separator />
            {isEnableLimited && (
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2.5 text-sm text-orange-600 dark:text-orange-400">
                <Icon icon="mdi:alert-circle" className="flex-shrink-0 mt-0.5 text-base" />
                <div>
                  <div className="font-semibold mb-1">Terlalu banyak percobaan</div>
                  <div>Silakan tunggu {enableSecondsRemaining > 60 ? `${Math.floor(enableSecondsRemaining / 60)}m ${enableSecondsRemaining % 60}s` : `${enableSecondsRemaining}s`} sebelum mencoba lagi.</div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={setupData.qrDataUrl}
                alt="QR Code 2FA"
                className="w-40 h-40 rounded-lg border bg-white p-1.5 flex-shrink-0"
              />
              <div className="space-y-3 flex-1 min-w-0">
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Buka aplikasi authenticator Anda</li>
                  <li>Scan QR code di samping</li>
                  <li>Masukkan kode 6 digit yang muncul</li>
                </ol>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tidak bisa scan? Masukkan manual:
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border text-xs font-mono">
                    <span className="flex-1 break-all">{setupData.secret}</span>
                    <CopyButton text={setupData.secret} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <Label>Kode Verifikasi</Label>
              <Input
                inputMode="numeric" maxLength={6} placeholder="123456"
                className="text-center text-lg tracking-[0.5em] font-mono"
                disabled={isEnableLimited || enabling}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-wa-600 hover:bg-wa-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={enabling || otp.length !== 6 || isEnableLimited}
                onClick={() => enable(otp)}
              >
                {isEnableLimited ? (
                  <><Icon icon="mdi:clock-outline" className="mr-2" />Coba lagi dalam {enableSecondsRemaining}s</>
                ) : enabling ? (
                  <><Icon icon="mdi:loading" className="animate-spin mr-2" />Memverifikasi...</>
                ) : (
                  <><Icon icon="mdi:check" className="mr-2" />Verifikasi & Aktifkan</>
                )}
              </Button>
              <Button
                variant="outline"
                disabled={isEnableLimited || enabling}
                onClick={() => { setSetupData(null); setOtp('') }}
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
