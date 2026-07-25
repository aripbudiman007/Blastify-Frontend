import type { ChatFlowNode, ChatFlowNodeType, ChatFlowActionType, AutoReplyMatchType } from '@/types'

export const NODE_TYPES: ChatFlowNodeType[] = ['message', 'question', 'condition', 'action', 'end']
export const ACTION_TYPES: ChatFlowActionType[] = ['ADD_LABEL', 'ASSIGN_AGENT', 'WEBHOOK']
export const MATCH_TYPES: AutoReplyMatchType[] = ['EXACT', 'CONTAINS', 'STARTS_WITH', 'REGEX', 'AI']

export const NODE_TYPE_LABELS: Record<ChatFlowNodeType, string> = {
  message:   'Kirim Pesan',
  question:  'Pertanyaan',
  condition: 'Kondisi',
  action:    'Aksi',
  end:       'Selesai',
}
export const NODE_TYPE_ICONS: Record<ChatFlowNodeType, string> = {
  message:   'mdi:message-text-outline',
  question:  'mdi:comment-question-outline',
  condition: 'mdi:call-split',
  action:    'mdi:lightning-bolt-outline',
  end:       'mdi:flag-checkered',
}
export const NODE_TYPE_COLORS: Record<ChatFlowNodeType, string> = {
  message:   'border-blue-400',
  question:  'border-purple-400',
  condition: 'border-amber-400',
  action:    'border-emerald-400',
  end:       'border-gray-400',
}
export const ACTION_LABELS: Record<ChatFlowActionType, string> = {
  ADD_LABEL:    'Tambah Label ke Kontak',
  ASSIGN_AGENT: 'Assign ke Agent (round-robin)',
  WEBHOOK:      'Kirim ke Webhook',
}

// ─── Form node shape — superset of all node types, filtered on save ──────────
export interface FormBranch {
  matchType: AutoReplyMatchType
  value: string
  next: string
}

export interface FormNode {
  id: string
  type: ChatFlowNodeType
  text?: string
  mediaUrl?: string
  next?: string
  saveAs?: string
  variable?: string
  branches?: FormBranch[]
  default?: string
  action?: ChatFlowActionType
  labelName?: string
  webhookUrl?: string
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'node'
}

export function uniqueId(base: string, existing: string[]) {
  let id = base, n = 1
  while (existing.includes(id)) id = `${base}_${n++}`
  return id
}

export function toApiNode(n: FormNode): ChatFlowNode {
  switch (n.type) {
    case 'message':
      return { id: n.id, type: 'message', text: n.text ?? '', mediaUrl: n.mediaUrl || undefined, next: n.next || undefined }
    case 'question':
      return { id: n.id, type: 'question', text: n.text ?? '', saveAs: n.saveAs ?? '', next: n.next ?? '' }
    case 'condition':
      return {
        id: n.id, type: 'condition', variable: n.variable ?? '',
        branches: (n.branches ?? []).map((b) => ({ matchType: b.matchType, value: b.value, next: b.next })),
        default: n.default || undefined,
      }
    case 'action': {
      const params: Record<string, string> = {}
      if (n.action === 'ADD_LABEL') params.labelName = n.labelName ?? ''
      if (n.action === 'WEBHOOK') params.url = n.webhookUrl ?? ''
      return { id: n.id, type: 'action', action: n.action ?? 'ADD_LABEL', params, next: n.next || undefined }
    }
    case 'end':
      return { id: n.id, type: 'end' }
  }
}

export function fromApiNode(n: ChatFlowNode): FormNode {
  const base = { id: n.id, type: n.type }
  switch (n.type) {
    case 'message':
      return { ...base, text: n.text, mediaUrl: n.mediaUrl ?? '', next: n.next ?? '' }
    case 'question':
      return { ...base, text: n.text, saveAs: n.saveAs, next: n.next }
    case 'condition':
      return { ...base, variable: n.variable, branches: n.branches, default: n.default ?? '' }
    case 'action':
      return {
        ...base, action: n.action, next: n.next ?? '',
        labelName: n.params?.labelName ?? '',
        webhookUrl: n.params?.url ?? '',
      }
    case 'end':
      return { ...base }
  }
}

/** Outgoing handle ids for a node's source connections (excludes the fixed 'target' input handle) */
export function sourceHandlesOf(n: FormNode): string[] {
  if (n.type === 'end') return []
  if (n.type === 'condition') return [...(n.branches ?? []).map((_, i) => `branch-${i}`), 'default']
  return ['next']
}

/** Read where a given source handle currently points, from the form node's own fields */
export function targetOfHandle(n: FormNode, handle: string): string | undefined {
  if (handle === 'next') return n.next || undefined
  if (handle === 'default') return n.default || undefined
  if (handle.startsWith('branch-')) {
    const idx = Number(handle.slice('branch-'.length))
    return n.branches?.[idx]?.next || undefined
  }
  return undefined
}

/** Write a new target for a given source handle, returning a new FormNode */
export function withHandleTarget(n: FormNode, handle: string, target: string | undefined): FormNode {
  if (handle === 'next') return { ...n, next: target }
  if (handle === 'default') return { ...n, default: target }
  if (handle.startsWith('branch-')) {
    const idx = Number(handle.slice('branch-'.length))
    const branches = [...(n.branches ?? [])]
    if (branches[idx]) branches[idx] = { ...branches[idx], next: target ?? '' }
    return { ...n, branches }
  }
  return n
}
