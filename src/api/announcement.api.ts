import api from './axios'
import type { Announcement } from '@/types'

export const announcementApi = {
  getActive: () =>
    api.get<{ success: boolean; data: Announcement[] }>('/announcements/active'),
}
