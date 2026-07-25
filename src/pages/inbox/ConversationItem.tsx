import { format, isToday, isYesterday } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn, truncate } from '@/lib/utils'
import type { Conversation } from '@/types'

interface Props {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

function formatConvTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Kemarin'
  return format(d, 'd MMM', { locale: idLocale })
}

function initials(name: string | null, phone: string) {
  if (name) return name.charAt(0).toUpperCase()
  return phone.replace(/\D/g, '').charAt(0) || '?'
}

export function ConversationItem({ conversation: conv, isSelected, onClick }: Props) {
  const displayName = conv.pushName || conv.from

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left',
        isSelected && 'bg-wa-600/10 border-r-2 border-wa-600'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold',
        isSelected ? 'bg-wa-600' : 'bg-slate-400'
      )}>
        {initials(conv.pushName, conv.from)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn('text-sm font-medium truncate', isSelected && 'text-wa-700')}>
            {displayName}
          </span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
            {formatConvTime(conv.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {truncate(conv.lastMessage ?? '', 35)}
          </p>
          {conv.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-wa-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
