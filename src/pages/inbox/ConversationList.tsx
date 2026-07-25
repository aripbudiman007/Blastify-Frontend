import { Icon } from '@iconify/react'
import { ConversationItem } from './ConversationItem'
import type { Conversation } from '@/types'

interface Props {
  conversations: Conversation[]
  selectedFrom: string | null
  loading: boolean
  onSelect: (conv: Conversation) => void
}

export function ConversationList({ conversations, selectedFrom, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
      </div>
    )
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <Icon icon="mdi:message-off-outline" className="text-4xl text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Belum ada pesan masuk</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conv) => (
        <ConversationItem
          key={`${conv.deviceId}:${conv.from}`}
          conversation={conv}
          isSelected={selectedFrom === conv.from}
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  )
}
