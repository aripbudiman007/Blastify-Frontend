import api from './axios'
import type { ApiResponse, PublicPlan } from '@/types'

// GET /plans — publik, untuk halaman pricing
export const planApi = {
  getAll: () =>
    api.get<ApiResponse<{ plans: PublicPlan[] }>>('/plans'),
}

export const planQueryKeys = {
  all: ['plans'] as const,
}
