import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { inboxApi, inboxQueryKeys } from '@/api/inbox.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { useSocket } from '@/hooks/useSocket'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'

export function InboxPage() {
  const queryClient = useQueryClient()
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [filterDeviceId, setFilterDeviceId] = useState<string>('all')
  const [showThread, setShowThread] = useState(false) // mobile: show thread panel

  // ─── Devices for filter ───────────────────────────────────────────────────────
  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
    staleTime: 30_000,
  })

  // ─── Conversations ────────────────────────────────────────────────────────────
  const convQueryKey = [...inboxQueryKeys.conversations, filterDeviceId]
  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: convQueryKey,
    queryFn:  () => inboxApi.getConversations(
      filterDeviceId !== 'all' ? { deviceId: filterDeviceId } : undefined
    ),
    select:   (r) => r.data.data?.conversations ?? [],
    refetchInterval: 30_000,
  })

  // ─── Total unread ─────────────────────────────────────────────────────────────
  const totalUnread = (conversations ?? []).reduce((s, c) => s + c.unreadCount, 0)

  // ─── Socket.IO realtime ───────────────────────────────────────────────────────
  const { socket } = useSocket()
  useEffect(() => {
    if (!socket) return
    const handler = () => { refetch() }
    socket.on('incoming_message', handler)
    return () => { socket.off('incoming_message', handler) }
  }, [socket, refetch])

  // ─── Mark all read on conversation select ─────────────────────────────────────
  const { mutate: markAllRead } = useMutation({
    mutationFn: (deviceId: string) => inboxApi.markAllRead(deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: convQueryKey }),
  })

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv)
    setShowThread(true)
    if (conv.unreadCount > 0) {
      markAllRead(conv.deviceId)
      // Optimistically clear badge
      queryClient.setQueryData(convQueryKey, (old: Conversation[] | undefined) =>
        (old ?? []).map(c =>
          c.from === conv.from && c.deviceId === conv.deviceId ? { ...c, unreadCount: 0 } : c
        )
      )
      // Invalidate thread so messages reload
      queryClient.invalidateQueries({ queryKey: inboxQueryKeys.messages(conv.from, conv.deviceId) })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-base">Inbox</h1>
          {totalUnread > 0 && (
            <span className="bg-wa-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile back button */}
          {showThread && selectedConv && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden gap-1"
              onClick={() => setShowThread(false)}
            >
              <Icon icon="mdi:arrow-left" />Kembali
            </Button>
          )}
          {/* Device filter */}
          <Select value={filterDeviceId} onValueChange={setFilterDeviceId}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Semua device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Device</SelectItem>
              {devices?.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Split Layout ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Conversation list panel */}
        <div className={cn(
          'w-full md:w-[280px] lg:w-[320px] border-r flex-shrink-0 flex flex-col',
          showThread && selectedConv ? 'hidden md:flex' : 'flex'
        )}>
          <ConversationList
            conversations={conversations ?? []}
            selectedFrom={selectedConv?.from ?? null}
            loading={isLoading}
            onSelect={handleSelectConv}
          />
        </div>

        {/* Message thread panel */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          !showThread || !selectedConv ? 'hidden md:flex' : 'flex'
        )}>
          {selectedConv ? (
            <MessageThread conversation={selectedConv} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Icon icon="mdi:message-text-outline" className="text-5xl text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Pilih percakapan untuk membuka pesan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
