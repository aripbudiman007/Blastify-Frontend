import api from './axios'
import type { ApiResponse } from '@/types'

export interface UploadedMedia {
  url: string
  publicId: string
  format?: string
  resourceType: string
  bytes: number
  originalFilename: string
  usage: string
}

export const mediaApi = {
  /** POST /media/upload — multipart, field "file". Mengembalikan URL Cloudinary. */
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<UploadedMedia>>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
