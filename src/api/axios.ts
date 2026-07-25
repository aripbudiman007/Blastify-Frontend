import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_URL } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import type { AuthTokens, ApiResponse } from '@/types'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 429 (Too Many Requests) - Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = parseInt(
        (error.response.headers['retry-after'] as string) || '60'
      )
      const minutes = Math.ceil(retryAfter / 60)

      // Store in localStorage for persistence across page refresh
      localStorage.setItem('lastRateLimitAt', Date.now().toString())
      localStorage.setItem('rateLimitRetrySeconds', retryAfter.toString())

      // Show notification to user
      toast.error(
        `Terlalu banyak percobaan. Silakan tunggu ${minutes} menit sebelum mencoba lagi.`,
        { duration: 6000 }
      )

      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, updateTokens, logout } = useAuthStore.getState()
    if (!refreshToken) {
      logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }).catch((err) => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<ApiResponse<AuthTokens>>(
        `${API_URL}/auth/refresh`,
        { refreshToken }
      )
      const tokens = data.data
      updateTokens(tokens)
      processQueue(null, tokens.accessToken)
      original.headers.Authorization = `Bearer ${tokens.accessToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
