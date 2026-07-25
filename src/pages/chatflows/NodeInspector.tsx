import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MATCH_TYPE_LABELS } from '@/lib/constants'
import type { AutoReplyMatchType, ChatFlowActionType } from '@/types'
import {
  ACTION_TYPES, ACTION_LABELS, NODE_TYPE_LABELS, NODE_TYPE_ICONS, MATCH_TYPES, type FormNode, type FormBranch,
} from './chatflow-utils'

interface NodeInspectorProps {
  node: FormNode
  isStart: boolean
  precedingSaveAs: string[]
  onUpdate: (patch: Partial<FormNode>) => void
  onRename: (newId: string) => boolean
  onDelete: () => void
  onSetStart: () => void
  onClose: () => void
  canDelete: boolean
}

export function NodeInspector({
  node, isStart, precedingSaveAs, onUpdate, onRename, onDelete, onSetStart, onClose, canDelete,
}: NodeInspectorProps) {
  const [idDraft, setIdDraft] = useState(node.id)
  useEffect(() => setIdDraft(node.id), [node.id])

  const commitId = () => {
    if (idDraft !== node.id) {
      const ok = onRename(idDraft.trim())
      if (!ok) setIdDraft(node.id)
    }
  }

  const insertVar = (varName: string) => onUpdate({ text: `${node.text ?? ''}{{${varName}}}` })

  const branches = node.branches ?? []
  const updateBranch = (i: number, patch: Partial<FormBranch>) => {
    const next = [...branches]
    next[i] = { ...next[i], ...patch }
    onUpdate({ branches: next })
  }

  return (
    <div className="w-[320px] flex-shrink-0 border-l bg-background flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <Icon icon={NODE_TYPE_ICONS[node.type]} className="text-wa-600" />
        <span className="text-sm font-semibold flex-1">{NODE_TYPE_LABELS[node.type]}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <Icon icon="mdi:close" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* ID + start */}
        <div className="space-y-1.5">
          <Label className="text-xs">ID Node</Label>
          <Input
            value={idDraft}
            className="font-mono text-xs"
            onChange={(e) => setIdDraft(e.target.value)}
            onBlur={commitId}
          />
          <div className="flex items-center gap-2 pt-1">
            {isStart ? (
              <Badge className="bg-wa-600 text-white text-xs">Node Awal</Badge>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onSetStart}>
                Jadikan Node Awal
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* message / question fields */}
        {(node.type === 'message' || node.type === 'question') && (
          <div className="space-y-3">
            {precedingSaveAs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] text-muted-foreground w-full">Sisipkan variabel:</span>
                {precedingSaveAs.map((v) => (
                  <button
                    key={v} type="button"
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono"
                    onClick={() => insertVar(v)}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Isi Pesan</Label>
              <Textarea rows={4} value={node.text ?? ''} onChange={(e) => onUpdate({ text: e.target.value })} />
            </div>
            {node.type === 'message' && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL Media (opsional)</Label>
                <Input value={node.mediaUrl ?? ''} onChange={(e) => onUpdate({ mediaUrl: e.target.value })} />
              </div>
            )}
            {node.type === 'question' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Simpan balasan sebagai (saveAs)</Label>
                <Input
                  className="font-mono text-xs"
                  placeholder="mis. name"
                  value={node.saveAs ?? ''}
                  onChange={(e) => onUpdate({ saveAs: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {/* condition fields */}
        {node.type === 'condition' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variabel yang Dicek</Label>
              <Input
                className="font-mono text-xs"
                placeholder="mis. qty"
                value={node.variable ?? ''}
                onChange={(e) => onUpdate({ variable: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Branch</Label>
                <Button
                  size="sm" variant="outline" className="h-6 text-xs"
                  onClick={() => onUpdate({ branches: [...branches, { matchType: 'EXACT', value: '', next: '' }] })}
                >
                  <Icon icon="mdi:plus" className="mr-1 text-xs" />Tambah
                </Button>
              </div>
              {branches.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Belum ada branch. Tambahkan minimal 1.</p>
              )}
              {branches.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Select value={b.matchType} onValueChange={(v) => updateBranch(i, { matchType: v as AutoReplyMatchType })}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATCH_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{MATCH_TYPE_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs flex-1"
                    placeholder="Nilai"
                    value={b.value}
                    onChange={(e) => updateBranch(i, { value: e.target.value })}
                  />
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                    onClick={() => onUpdate({ branches: branches.filter((_, bi) => bi !== i) })}
                  >
                    <Icon icon="mdi:close" className="text-muted-foreground text-sm" />
                  </Button>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Hubungkan output di sisi kanan node ke node lanjutan pada canvas.
              </p>
            </div>
          </div>
        )}

        {/* action fields */}
        {node.type === 'action' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Jenis Aksi</Label>
              <Select value={node.action ?? 'ADD_LABEL'} onValueChange={(v) => onUpdate({ action: v as ChatFlowActionType })}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => <SelectItem key={a} value={a} className="text-xs">{ACTION_LABELS[a]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {node.action === 'ADD_LABEL' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Label</Label>
                <Input placeholder="mis. lead-order" value={node.labelName ?? ''} onChange={(e) => onUpdate({ labelName: e.target.value })} />
              </div>
            )}
            {node.action === 'WEBHOOK' && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL Webhook</Label>
                <Input placeholder="https://example.com/webhook" value={node.webhookUrl ?? ''} onChange={(e) => onUpdate({ webhookUrl: e.target.value })} />
              </div>
            )}
          </div>
        )}

        {node.type === 'end' && (
          <p className="text-xs text-muted-foreground italic">Node ini mengakhiri sesi percakapan. Tidak ada field tambahan.</p>
        )}
      </div>

      <div className="p-3 border-t">
        <Button variant="destructive" className="w-full" size="sm" disabled={!canDelete} onClick={onDelete}>
          <Icon icon="mdi:trash-can-outline" className="mr-2" />Hapus Node
        </Button>
      </div>
    </div>
  )
}
