import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { inboxApi, inboxQueryKeys } from '@/api/inbox.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatPhone } from '@/lib/utils'
import type { AxiosError } from 'axios'
import type { Conversation, IncomingMessage } from '@/types'

const TYPE_ICONS: Record<string, string> = {
  image:    'mdi:image',
  video:    'mdi:video',
  document: 'mdi:file-document',
  audio:    'mdi:microphone',
  sticker:  'mdi:sticker-emoji',
  text:     'mdi:message-text',
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏']

type ApiErrorBody = { error?: { code?: string; message?: string } }

function waActionErrorMessage(err: AxiosError<ApiErrorBody>, fallback: string): string {
  const code = err.response?.data?.error?.code
  if (code === 'SESSION_NOT_ACTIVE' || code === 'DEVICE_NOT_CONNECTED') {
    return 'Device tidak terhubung ke WhatsApp'
  }
  return err.response?.data?.error?.message ?? fallback
}

interface Props {
  conversation: Conversation
}

export function MessageThread({ conversation }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const messagesKey = inboxQueryKeys.messages(conversation.from, conversation.deviceId)

  const { data: messages, isLoading } = useQuery({
    queryKey: messagesKey,
    queryFn:  () => inboxApi.getMessages(conversation.from, { deviceId: conversation.deviceId }),
    select:   (r) => r.data.data ?? [],
    refetchInterval: 15_000,
  })

  // ── Reaksi emoji ────────────────────────────────────────────────────────────
  const { mutate: react } = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => inboxApi.react(id, emoji),
    onSuccess: (_res, { emoji }) => toast.success(emoji ? `Reaksi ${emoji} terkirim` : 'Reaksi dihapus'),
    onError: (err: AxiosError<ApiErrorBody>) =>
      toast.error(waActionErrorMessage(err, 'Gagal mengirim reaksi')),
  })

  // ── Reply quote ─────────────────────────────────────────────────────────────
  const [replyTarget, setReplyTarget] = useState<IncomingMessage | null>(null)
  const [replyText, setReplyText] = useState('')
  const { mutate: sendReply, isPending: replying } = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => inboxApi.replyQuote(id, message),
    onSuccess: () => {
      toast.success('Balasan terkirim')
      setReplyTarget(null); setReplyText('')
      queryClient.invalidateQueries({ queryKey: messagesKey })
    },
    onError: (err: AxiosError<ApiErrorBody>) =>
      toast.error(waActionErrorMessage(err, 'Gagal mengirim balasan')),
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const displayName = conversation.pushName || conversation.from

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-wa-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">{formatPhone(conversation.from)}</p>
          </div>
        </div>
        <Link
          to={`/messages/send?to=${conversation.from}`}
          className="text-xs"
        >
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Icon icon="mdi:reply" className="text-base" />
            Balas
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="mdi:loading" className="animate-spin text-2xl text-muted-foreground" />
          </div>
        ) : !messages?.length ? (
          <p className="text-center text-sm text-muted-foreground py-8">Tidak ada pesan</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onReact={(emoji) => react({ id: msg.id, emoji })}
              onReply={() => setReplyTarget(msg)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply quote composer */}
      {replyTarget && (
        <div className="border-t bg-background p-3 space-y-2 flex-shrink-0">
          <div className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 border-l-4 border-wa-600 text-xs">
            <div className="min-w-0">
              <p className="font-semibold text-wa-700">Membalas {replyTarget.pushName || formatPhone(replyTarget.from)}</p>
              <p className="text-muted-foreground truncate">
                {replyTarget.content || replyTarget.type}
              </p>
            </div>
            <button type="button" onClick={() => { setReplyTarget(null); setReplyText('') }} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <Icon icon="mdi:close" />
            </button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (replyText.trim()) sendReply({ id: replyTarget.id, message: replyText.trim() })
            }}
          >
            <Input
              placeholder="Tulis balasan..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="bg-wa-600 hover:bg-wa-700 flex-shrink-0" disabled={replying || !replyText.trim()}>
              {replying
                ? <Icon icon="mdi:loading" className="animate-spin" />
                : <Icon icon="mdi:send" />
              }
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

function MessageBubble({
  msg, onReact, onReply,
}: {
  msg: IncomingMessage
  onReact: (emoji: string) => void
  onReply: () => void
}) {
  const timeStr = format(new Date(msg.createdAt), 'HH:mm')

  return (
    <div className="group flex flex-col items-start gap-1 max-w-[80%]">
      <div className="flex items-center gap-1.5">
        {/* Main bubble */}
        <div className={cn(
          'px-3 py-2 rounded-2xl rounded-tl-sm text-sm shadow-sm',
          'bg-white border border-border'
        )}>
          {msg.type === 'text' ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          ) : msg.type === 'image' && msg.mediaUrl ? (
            <div className="space-y-1.5">
              <img
                src={msg.mediaUrl}
                alt="gambar"
                className="rounded-lg max-w-[240px] max-h-[180px] object-cover cursor-pointer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {msg.content && <p className="text-xs text-muted-foreground">{msg.content}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon icon={TYPE_ICONS[msg.type] ?? 'mdi:file'} className="text-xl text-wa-600" />
              <div>
                <p className="text-xs font-medium capitalize">{msg.type}</p>
                {msg.content && <p className="text-xs">{msg.content}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Hover actions: reaksi + reply quote */}
        <div className="hidden group-hover:flex items-center gap-0.5 bg-background border rounded-full px-1.5 py-0.5 shadow-sm flex-shrink-0">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              title={`Reaksi ${emoji}`}
              className="text-sm hover:scale-125 transition-transform px-0.5"
              onClick={() => onReact(emoji)}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            title="Balas dengan quote"
            className="text-muted-foreground hover:text-wa-600 px-1"
            onClick={onReply}
          >
            <Icon icon="mdi:reply" className="text-base" />
          </button>
        </div>
      </div>

      {/* Auto-reply indicator */}
      {msg.repliedWith && (
        <div className="ml-1 px-2.5 py-1 bg-wa-600/10 border border-wa-600/20 rounded-xl text-xs text-wa-700 max-w-[240px]">
          <span className="font-medium">Dibalas otomatis: </span>
          <span className="italic opacity-80">{msg.repliedWith}</span>
        </div>
      )}

      {/* Timestamp */}
      <span className="text-[10px] text-muted-foreground ml-1">{timeStr}</span>
    </div>
  )
}
