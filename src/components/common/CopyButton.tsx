import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
}

export function CopyButton({ text, label, variant = 'ghost', size = 'icon' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(text)
    setCopied(true)
    toast.success('Disalin ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant={variant} size={size} onClick={handleCopy} title="Salin">
      <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className="text-base" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  )
}
