import type { AxiosError } from 'axios'

export interface ApiError {
  code: string
  message: string
  status: number
  retryAfter?: number
}

export const ERROR_MESSAGE_MAP: Record<string, string> = {
  'INVALID_CREDENTIALS': 'Email atau password tidak sesuai.',
  'EMAIL_NOT_VERIFIED': 'Silakan verifikasi email Anda sebelum masuk.',
  'OTP_REQUIRED': 'Silakan masukkan kode autentikasi 2FA.',
  'INVALID_OTP': 'Kode autentikasi tidak valid atau sudah kadaluarsa.',
  'EMAIL_TAKEN': 'Email ini sudah terdaftar.',
  'RATE_LIMIT_EXCEEDED': 'Terlalu banyak percobaan. Silakan tunggu sebelum mencoba lagi.',
  'INVALID_PLAN': 'Paket tidak valid.',
  'CANNOT_DOWNGRADE': 'Tidak bisa menurunkan ke paket yang lebih rendah.',
  'UNAUTHORIZED': 'Anda tidak memiliki otorisasi untuk mengakses resource ini.',
  'FORBIDDEN': 'Akses ditolak.',
  'NOT_FOUND': 'Resource tidak ditemukan.',
  'VALIDATION_ERROR': 'Silakan periksa input Anda dan coba lagi.',
}

export function getErrorMessage(error: any): string {
  const errorCode = error.response?.data?.error?.code
  return (
    ERROR_MESSAGE_MAP[errorCode]
    || error.response?.data?.error?.message
    || error.response?.data?.message
    || error.message
    || 'Terjadi kesalahan. Silakan coba lagi.'
  )
}

export function handleApiError(
  error: any,
  onRateLimited?: (retryAfter: number) => void
): ApiError {
  const status = error.response?.status || 500
  const data = error.response?.data?.error || {}
  const retryAfter = parseInt((error.response?.headers['retry-after'] as string) || '0')

  if (status === 429) {
    onRateLimited?.(retryAfter)
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Terlalu banyak percobaan. Silakan tunggu ${Math.ceil(retryAfter / 60)} menit.`,
      status,
      retryAfter,
    }
  }

  return {
    code: data.code || 'UNKNOWN_ERROR',
    message: getErrorMessage(error),
    status,
  }
}

export function storeRateLimitToLocalStorage(
  endpoint: string,
  retryAfterSeconds: number
): void {
  const rateLimitKey = `rateLimit:${endpoint}`
  localStorage.setItem(`${rateLimitKey}:at`, Date.now().toString())
  localStorage.setItem(`${rateLimitKey}:retrySeconds`, retryAfterSeconds.toString())
}

export function isAxiosError429(error: any): error is AxiosError {
  return error.response?.status === 429
}
