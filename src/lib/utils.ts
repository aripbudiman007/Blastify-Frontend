import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy, HH:mm') {
  return format(new Date(date), pattern)
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatPhone(phone: string) {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('62')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`
  return `+${cleaned}`
}

export function truncate(str: string, length = 50) {
  if (!str) return ''
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function parsePhoneNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map(n => n.trim().replace(/\D/g, ''))
    .filter(n => n.length >= 8)
}
