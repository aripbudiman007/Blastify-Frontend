import { useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import type { MessageTemplate, TemplateCategory, MessageType } from '@/types'

const CATEGORIES: { value: TemplateCategory; label: string; color: string }[] = [
  { value: 'general',      label: 'General',      color: 'bg-gray-100   text-gray-700'   },
  { value: 'greeting',     label: 'Sapaan',       color: 'bg-blue-100   text-blue-700'   },
  { value: 'promo',        label: 'Promo',        color: 'bg-orange-100 text-orange-700' },
  { value: 'notification', label: 'Notifikasi',   color: 'bg-purple-100 text-purple-700' },
]

const MSG_TYPES: { value: MessageType; label: string }[] = [
  { value: 'TEXT',     label: 'Teks'     },
  { value: 'IMAGE',    label: 'Gambar'   },
  { value: 'VIDEO',    label: 'Video'    },
  { value: 'DOCUMENT', label: 'Dokumen'  },
]

const schema = z.object({
  name:     z.string().min(1, 'Nama wajib').max(100),
  category: z.enum(['general', 'greeting', 'promo', 'notification'] as const).default('general'),
  type:     z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'TEMPLATE'] as const).default('TEXT'),
  content:  z.string().min(1, 'Isi template wajib'),
  mediaUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  caption:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  template?: MessageTemplate | null
  onSubmit: (data: FormData) => void
  loading?: boolean
}

// Extract {{variable}} placeholders from template content
function extractVars(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))]
}

export function TemplateFormDialog({ open, onOpenChange, template, onSubmit, loading }: Props) {
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as Resolver<FormData>,
      defaultValues: { category: 'general', type: 'TEXT' },
    })

  const contentValue = watch('content') ?? ''
  const typeValue    = watch('type')
  const vars         = extractVars(contentValue)

  useEffect(() => {
    if (open) {
      if (template) {
        reset({
          name:     template.name,
          category: template.category,
          type:     template.type as FormData['type'],
          content:  template.content,
          mediaUrl: template.mediaUrl ?? '',
          caption:  template.caption ?? '',
        })
      } else {
        reset({ category: 'general', type: 'TEXT' })
      }
    }
  }, [open, template, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Tambah Template'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nama Template</Label>
            <Input placeholder="Sambutan Pelanggan Baru" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Pesan</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MSG_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Media URL (if not TEXT) */}
          {typeValue !== 'TEXT' && (
            <div className="space-y-1.5">
              <Label>URL Media</Label>
              <div className="flex gap-2">
                <Input placeholder="https://example.com/file.jpg" {...register('mediaUrl')} />
                <MediaUploadButton onUploaded={(u) => setValue('mediaUrl', u, { shouldValidate: true })} />
              </div>
              {errors.mediaUrl && <p className="text-xs text-red-500">{errors.mediaUrl.message}</p>}
            </div>
          )}

          {/* Content */}
          <div className="space-y-1.5">
            <Label>{typeValue === 'TEXT' ? 'Isi Pesan' : 'Caption'}</Label>
            <Textarea
              rows={4}
              placeholder="Halo {{name}}, selamat datang di toko kami!"
              {...register('content')}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <p className="text-xs text-muted-foreground">
              Gunakan <code className="bg-muted px-1 rounded">{'{{nama_variabel}}'}</code> untuk variabel dinamis
            </p>
          </div>

          {/* Caption (for non-TEXT with separate caption) */}
          {typeValue !== 'TEXT' && (
            <div className="space-y-1.5">
              <Label>Keterangan (opsional)</Label>
              <Input placeholder="Caption gambar/video" {...register('caption')} />
            </div>
          )}

          {/* Variable preview */}
          {vars.length > 0 && (
            <div className="rounded-lg bg-muted/50 border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Variabel terdeteksi:</p>
              <div className="flex flex-wrap gap-1.5">
                {vars.map(v => (
                  <Badge key={v} variant="secondary" className="text-xs font-mono">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {vars.map(v => (
                  <p key={v}>
                    <span className="font-mono text-foreground">{`{{${v}}}`}</span>
                    {' → '}
                    <span className="italic opacity-60">contoh nilai</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={loading}>
              {loading
                ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menyimpan...</>
                : <><Icon icon="mdi:content-save-outline" className="mr-2" />{template ? 'Simpan' : 'Tambah Template'}</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CATEGORIES, type FormData as TemplateFormData }
