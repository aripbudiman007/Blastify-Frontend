import { useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { mediaApi } from '@/api/media.api'
import { Button } from '@/components/ui/button'

interface MediaUploadButtonProps {
  /** Dipanggil dengan URL Cloudinary setelah upload sukses */
  onUploaded: (url: string) => void
  accept?: string
  disabled?: boolean
}

/**
 * Tombol upload file ke POST /media/upload — dipakai di samping input URL media
 * supaya user tidak harus hosting file sendiri.
 */
export function MediaUploadButton({ onUploaded, accept, disabled }: MediaUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const res = await mediaApi.upload(file)
      onUploaded(res.data.data.url)
      toast.success('File berhasil diupload')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } }
      const code = axiosErr.response?.data?.error?.code
      toast.error(
        code === 'MEDIA_UPLOAD_DISABLED'
          ? 'Upload media tidak aktif di server ini — masukkan URL manual'
          : axiosErr.response?.data?.error?.message ?? 'Gagal mengupload file',
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
      />
      <Button
        type="button"
        variant="outline"
        className="flex-shrink-0"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading
          ? <><Icon icon="mdi:loading" className="animate-spin mr-1.5" />Mengupload...</>
          : <><Icon icon="mdi:upload" className="mr-1.5" />Upload</>
        }
      </Button>
    </>
  )
}
