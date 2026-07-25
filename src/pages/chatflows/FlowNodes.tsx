import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Icon } from '@iconify/react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MATCH_TYPE_LABELS } from '@/lib/constants'
import {
  NODE_TYPE_LABELS, NODE_TYPE_ICONS, NODE_TYPE_COLORS, ACTION_LABELS, type FormNode,
} from './chatflow-utils'

export type RFNodeData = {
  formNode: FormNode
  isStart: boolean
} & Record<string, unknown>

export type RFNode = Node<RFNodeData>

function truncate(s: string | undefined, n: number) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

function NodeShell({
  data, selected, hasTarget = true, children,
}: {
  data: RFNodeData; selected?: boolean; hasTarget?: boolean; children: React.ReactNode
}) {
  const { formNode, isStart } = data
  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-card shadow-sm w-[240px] transition-shadow',
        NODE_TYPE_COLORS[formNode.type],
        selected && 'ring-2 ring-wa-600 shadow-md',
      )}
    >
      {hasTarget && (
        <Handle type="target" position={Position.Top} id="target" className="!bg-wa-600 !w-2.5 !h-2.5" />
      )}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b bg-muted/40 rounded-t-[10px]">
        <Icon icon={NODE_TYPE_ICONS[formNode.type]} className="text-sm flex-shrink-0" />
        <span className="text-[11px] font-semibold flex-1 truncate">{NODE_TYPE_LABELS[formNode.type]}</span>
        {isStart && <Badge className="bg-wa-600 text-white text-[9px] py-0 px-1.5 flex-shrink-0">AWAL</Badge>}
      </div>
      <div className="px-2.5 py-2 space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground truncate">{formNode.id}</p>
        {children}
      </div>
    </div>
  )
}

export const MessageNode = memo(({ data, selected }: NodeProps<RFNode>) => (
  <NodeShell data={data} selected={selected}>
    <p className="text-xs leading-snug line-clamp-3">
      {truncate(data.formNode.text, 90) || <span className="italic text-muted-foreground">Belum ada isi pesan</span>}
    </p>
    <Handle type="source" position={Position.Bottom} id="next" className="!bg-wa-600 !w-2.5 !h-2.5" />
  </NodeShell>
))
MessageNode.displayName = 'MessageNode'

export const QuestionNode = memo(({ data, selected }: NodeProps<RFNode>) => (
  <NodeShell data={data} selected={selected}>
    <p className="text-xs leading-snug line-clamp-2">
      {truncate(data.formNode.text, 70) || <span className="italic text-muted-foreground">Belum ada isi pesan</span>}
    </p>
    {data.formNode.saveAs && (
      <Badge variant="outline" className="text-[9px] py-0 font-mono">→ {data.formNode.saveAs}</Badge>
    )}
    <Handle type="source" position={Position.Bottom} id="next" className="!bg-wa-600 !w-2.5 !h-2.5" />
  </NodeShell>
))
QuestionNode.displayName = 'QuestionNode'

export const ConditionNode = memo(({ data, selected }: NodeProps<RFNode>) => {
  const branches = data.formNode.branches ?? []
  const outputs = [
    ...branches.map((b, i) => ({ id: `branch-${i}`, label: `${MATCH_TYPE_LABELS[b.matchType] ?? ''} "${b.value || '(kosong)'}"` })),
    { id: 'default', label: 'default' },
  ]
  return (
    <NodeShell data={data} selected={selected}>
      <p className="text-xs">
        Cek <code className="bg-muted px-1 rounded font-mono">{data.formNode.variable || '?'}</code>
      </p>
      <div className="pt-1 space-y-1 pr-1">
        {outputs.map((o) => (
          <p key={o.id} className="text-[9px] text-muted-foreground text-right truncate" title={o.label}>
            {o.label} →
          </p>
        ))}
      </div>
      {outputs.map((o, i) => (
        <Handle
          key={o.id}
          type="source"
          position={Position.Right}
          id={o.id}
          style={{ top: `${((i + 1) / (outputs.length + 1)) * 100}%` }}
          className="!bg-amber-500 !w-2.5 !h-2.5"
        />
      ))}
    </NodeShell>
  )
})
ConditionNode.displayName = 'ConditionNode'

export const ActionNode = memo(({ data, selected }: NodeProps<RFNode>) => (
  <NodeShell data={data} selected={selected}>
    <p className="text-xs">{ACTION_LABELS[data.formNode.action ?? 'ADD_LABEL']}</p>
    {data.formNode.action === 'ADD_LABEL' && data.formNode.labelName && (
      <Badge variant="outline" className="text-[9px] py-0">{data.formNode.labelName}</Badge>
    )}
    {data.formNode.action === 'WEBHOOK' && data.formNode.webhookUrl && (
      <p className="text-[9px] text-muted-foreground truncate">{data.formNode.webhookUrl}</p>
    )}
    <Handle type="source" position={Position.Bottom} id="next" className="!bg-wa-600 !w-2.5 !h-2.5" />
  </NodeShell>
))
ActionNode.displayName = 'ActionNode'

export const EndNode = memo(({ data, selected }: NodeProps<RFNode>) => (
  <NodeShell data={data} selected={selected}>
    <p className="text-xs text-muted-foreground italic">Percakapan selesai</p>
  </NodeShell>
))
EndNode.displayName = 'EndNode'

export const nodeTypes = {
  message:   MessageNode,
  question:  QuestionNode,
  condition: ConditionNode,
  action:    ActionNode,
  end:       EndNode,
}
