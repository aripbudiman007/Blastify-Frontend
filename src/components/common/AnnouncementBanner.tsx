import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { announcementApi } from '@/api/announcement.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import type { Announcement, AnnouncementType } from '@/types'

const STORAGE_KEY = 'dismissed_announcements'

const TYPE_STYLES: Record<AnnouncementType, string> = {
  INFO:        'bg-blue-50   border-blue-200   text-blue-800',
  WARNING:     'bg-yellow-50 border-yellow-200 text-yellow-800',
  DANGER:      'bg-red-50    border-red-200    text-red-800',
  SUCCESS:     'bg-green-50  border-green-200  text-green-800',
  MAINTENANCE: 'bg-orange-50 border-orange-200 text-orange-800',
}

const TYPE_ICONS: Record<AnnouncementType, string> = {
  INFO:        'mdi:information-outline',
  WARNING:     'mdi:alert-outline',
  DANGER:      'mdi:alert-circle-outline',
  SUCCESS:     'mdi:check-circle-outline',
  MAINTENANCE: 'mdi:wrench-outline',
}

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveDismissed(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function AnnouncementBanner() {
  const user = useAuthStore((s) => s.user)
  const [dismissed, setDismissed] = useState<string[]>(getDismissed)

  const { data: announcements } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn:  () => announcementApi.getActive(),
    select:   (r) => r.data.data ?? [],
    staleTime: 5 * 60 * 1000,  // 5 min
    refetchInterval: 5 * 60 * 1000,
  })

  // Filter: not dismissed + either no targetPlan or user's plan is in targetPlan
  const visible = (announcements ?? []).filter((a: Announcement) => {
    if (dismissed.includes(a.id)) return false
    if (a.targetPlan && a.targetPlan.length > 0 && user?.plan) {
      return a.targetPlan.includes(user.plan)
    }
    return true
  })

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    saveDismissed(next)
  }

  if (!visible.length) return null

  return (
    <div className="space-y-1.5 px-4 md:px-6 lg:px-8 pt-4">
      {visible.map((a: Announcement) => (
        <div
          key={a.id}
          className={cn(
            'flex items-start gap-3 px-4 py-2.5 rounded-lg border text-sm',
            TYPE_STYLES[a.type]
          )}
        >
          <Icon icon={TYPE_ICONS[a.type]} className="text-lg flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{a.title}</span>
            {a.content && <span className="ml-2 opacity-90">{a.content}</span>}
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded"
            aria-label="Tutup pengumuman"
          >
            <Icon icon="mdi:close" className="text-base" />
          </button>
        </div>
      ))}
    </div>
  )
}
