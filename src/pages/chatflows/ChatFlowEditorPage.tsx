import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Icon } from '@iconify/react'
import {
  ReactFlow, Background, Controls, MiniMap, Panel, MarkerType,
  useNodesState, useEdgesState,
  type Edge, type Connection, type NodeChange, type EdgeChange, type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { chatFlowApi, chatFlowQueryKeys } from '@/api/chatflow.api'
import { deviceApi, deviceQueryKeys } from '@/api/device.api'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/auth.store'
import { PLAN_LIMITS, MATCH_TYPE_LABELS } from '@/lib/constants'
import type { AutoReplyMatchType, ChatFlowNodeType } from '@/types'
import { nodeTypes, type RFNode } from './FlowNodes'
import { NodeInspector } from './NodeInspector'
import { layoutNodes } from './layout'
import {
  NODE_TYPES, NODE_TYPE_LABELS, NODE_TYPE_ICONS, MATCH_TYPES,
  slugify, uniqueId, toApiNode, fromApiNode, sourceHandlesOf, targetOfHandle, withHandleTarget,
  type FormNode,
} from './chatflow-utils'

function buildEdgesFromNodes(formNodes: FormNode[]): Edge[] {
  const edges: Edge[] = []
  formNodes.forEach((n) => {
    sourceHandlesOf(n).forEach((handle) => {
      const target = targetOfHandle(n, handle)
      if (target) {
        edges.push({
          id: `${n.id}::${handle}::${target}`,
          source: n.id, sourceHandle: handle, target, targetHandle: 'target',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        })
      }
    })
  })
  return edges
}

function buildRFNodes(formNodes: FormNode[], startNodeId: string): RFNode[] {
  return formNodes.map((fn) => ({
    id: fn.id,
    type: fn.type,
    position: { x: 0, y: 0 },
    data: { formNode: fn, isStart: fn.id === startNodeId },
  }))
}

export function ChatFlowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const initializedRef = useRef(false)
  const plan = useAuthStore((s) => s.user?.plan ?? 'FREE')
  const canUseChatFlow = PLAN_LIMITS[plan]?.canAutoReply ?? false

  const [name, setName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [triggerKeyword, setTriggerKeyword] = useState('')
  const [triggerMatchType, setTriggerMatchType] = useState<AutoReplyMatchType>('CONTAINS')
  const [startNodeId, setStartNodeId] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<RFNode>([])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>([])

  const { data: devices } = useQuery({
    queryKey: deviceQueryKeys.all,
    queryFn:  () => deviceApi.getAll(),
    select:   (r) => r.data.data?.devices ?? [],
  })

  const { data: flow, isLoading } = useQuery({
    queryKey: chatFlowQueryKeys.detail(id ?? ''),
    queryFn:  () => chatFlowApi.getById(id!),
    select:   (r) => r.data.data?.flow,
    enabled:  !isNew && canUseChatFlow,
  })

  // ─── Initialize canvas from loaded flow / defaults for a new flow ────────────
  useEffect(() => {
    if (initializedRef.current) return
    if (isNew) {
      initializedRef.current = true
      const formNodes: FormNode[] = [{ id: 'start', type: 'message', text: '', next: '' }]
      setStartNodeId('start')
      const rfNodes = layoutNodes(buildRFNodes(formNodes, 'start'), [])
      setNodes(rfNodes)
      setEdges([])
      return
    }
    if (flow) {
      initializedRef.current = true
      setName(flow.name)
      setDeviceId(flow.deviceId)
      setTriggerKeyword(flow.triggerKeyword)
      setTriggerMatchType(flow.triggerMatchType)
      setStartNodeId(flow.startNodeId)
      const formNodes = flow.nodes.map(fromApiNode)
      const rfEdges = buildEdgesFromNodes(formNodes)
      const rfNodes = layoutNodes(buildRFNodes(formNodes, flow.startNodeId), rfEdges)
      setNodes(rfNodes)
      setEdges(rfEdges)
    }
  }, [isNew, flow, setNodes, setEdges])

  // Keep isStart flag on node data in sync with startNodeId
  useEffect(() => {
    setNodes((nds) => nds.map((n) => (
      n.data.isStart === (n.id === startNodeId) ? n : { ...n, data: { ...n.data, isStart: n.id === startNodeId } }
    )))
  }, [startNodeId, setNodes])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const { source, sourceHandle, target } = connection
    if (!source || !target || !sourceHandle || source === target) return
    setEdges((eds) => {
      const filtered = eds.filter((e) => !(e.source === source && e.sourceHandle === sourceHandle))
      const newEdge: Edge = {
        id: `${source}::${sourceHandle}::${target}`,
        source, sourceHandle, target, targetHandle: 'target',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      }
      return [...filtered, newEdge]
    })
    setNodes((nds) => nds.map((n) => n.id === source
      ? { ...n, data: { ...n.data, formNode: withHandleTarget(n.data.formNode, sourceHandle, target) } }
      : n))
  }, [setEdges, setNodes])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    changes.forEach((c) => {
      if (c.type === 'remove') {
        const edge = edges.find((e) => e.id === c.id)
        if (edge?.sourceHandle) {
          setNodes((nds) => nds.map((n) => n.id === edge.source
            ? { ...n, data: { ...n.data, formNode: withHandleTarget(n.data.formNode, edge.sourceHandle!, undefined) } }
            : n))
        }
      }
    })
    onEdgesChangeBase(changes)
  }, [edges, onEdgesChangeBase, setNodes])

  const handleNodesChange = useCallback((changes: NodeChange<RFNode>[]) => {
    const removedIds = changes.filter((c) => c.type === 'remove').map((c) => c.id)
    if (removedIds.length > 0) {
      setEdges((eds) => eds.filter((e) => !removedIds.includes(e.source) && !removedIds.includes(e.target)))
      setNodes((nds) => nds.map((n) => {
        if (removedIds.includes(n.id)) return n
        let fn = n.data.formNode
        if (fn.next && removedIds.includes(fn.next)) fn = { ...fn, next: undefined }
        if (fn.default && removedIds.includes(fn.default)) fn = { ...fn, default: undefined }
        if (fn.branches?.some((b) => removedIds.includes(b.next))) {
          fn = { ...fn, branches: fn.branches.map((b) => removedIds.includes(b.next) ? { ...b, next: '' } : b) }
        }
        return fn === n.data.formNode ? n : { ...n, data: { ...n.data, formNode: fn } }
      }))
      if (selectedNodeId && removedIds.includes(selectedNodeId)) setSelectedNodeId(null)
      if (removedIds.includes(startNodeId)) setStartNodeId('')
    }
    onNodesChangeBase(changes)
  }, [onNodesChangeBase, setEdges, setNodes, selectedNodeId, startNodeId])

  const updateSelectedNode = useCallback((patch: Partial<FormNode>) => {
    if (!selectedNodeId) return
    setNodes((nds) => nds.map((n) => n.id === selectedNodeId
      ? { ...n, data: { ...n.data, formNode: { ...n.data.formNode, ...patch } } }
      : n))
  }, [selectedNodeId, setNodes])

  const renameSelectedNode = useCallback((newId: string): boolean => {
    if (!selectedNodeId || !newId || newId === selectedNodeId) return true
    if (nodes.some((n) => n.id === newId)) {
      toast.error(`ID "${newId}" sudah dipakai node lain`)
      return false
    }
    const oldId = selectedNodeId
    setNodes((nds) => nds.map((n) => {
      if (n.id === oldId) {
        return { ...n, id: newId, data: { ...n.data, formNode: { ...n.data.formNode, id: newId } } }
      }
      let fn = n.data.formNode
      if (fn.next === oldId) fn = { ...fn, next: newId }
      if (fn.default === oldId) fn = { ...fn, default: newId }
      if (fn.branches?.some((b) => b.next === oldId)) {
        fn = { ...fn, branches: fn.branches.map((b) => b.next === oldId ? { ...b, next: newId } : b) }
      }
      return fn === n.data.formNode ? n : { ...n, data: { ...n.data, formNode: fn } }
    }))
    setEdges((eds) => eds.map((e) => {
      const source = e.source === oldId ? newId : e.source
      const target = e.target === oldId ? newId : e.target
      if (source === e.source && target === e.target) return e
      return { ...e, id: `${source}::${e.sourceHandle}::${target}`, source, target }
    }))
    if (startNodeId === oldId) setStartNodeId(newId)
    setSelectedNodeId(newId)
    return true
  }, [selectedNodeId, nodes, setNodes, setEdges, startNodeId])

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return
    handleNodesChange([{ type: 'remove', id: selectedNodeId }])
  }, [selectedNodeId, handleNodesChange])

  const addNode = (type: ChatFlowNodeType) => {
    const id = uniqueId(slugify(type), nodes.map((n) => n.id))
    const formNode: FormNode = {
      id, type,
      ...(type === 'condition' ? { branches: [] } : {}),
      ...(type === 'action' ? { action: 'ADD_LABEL' as const } : {}),
    }
    const count = nodes.length
    const newNode: RFNode = {
      id, type,
      position: { x: 80 + (count % 4) * 260, y: 40 + Math.floor(count / 4) * 180 },
      data: { formNode, isStart: false },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(id)
  }

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (payload: {
      deviceId: string; name: string; triggerKeyword: string
      triggerMatchType: AutoReplyMatchType; startNodeId: string; nodes: ReturnType<typeof toApiNode>[]
    }) => (isNew ? chatFlowApi.create(payload) : chatFlowApi.update(id!, payload)),
    onSuccess: () => {
      toast.success(isNew ? 'Chat flow dibuat' : 'Chat flow diperbarui')
      queryClient.invalidateQueries({ queryKey: ['chat-flows'] })
      navigate('/chat-flows')
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code
      const message = err.response?.data?.error?.message
      if (code === 'INVALID_START_NODE') toast.error('Node awal tidak valid')
      else if (code === 'INVALID_FLOW_NODES') toast.error('Daftar node tidak valid')
      else if (code === 'FEATURE_NOT_AVAILABLE') toast.error(message || 'Chat Flow butuh plan REGULAR ke atas')
      else toast.error('Gagal menyimpan chat flow')
    },
  })

  const handleSave = () => {
    if (!deviceId) return toast.error('Pilih device')
    if (!name.trim()) return toast.error('Nama flow wajib diisi')
    if (!triggerKeyword.trim()) return toast.error('Trigger keyword wajib diisi')
    if (nodes.length === 0) return toast.error('Minimal 1 node')
    if (nodes.length > 200) return toast.error('Maksimal 200 node')
    if (!nodes.some((n) => n.id === startNodeId)) return toast.error('Node awal tidak valid, pilih ulang node awal')

    for (const n of nodes) {
      const fn = n.data.formNode
      if (fn.type === 'question' && !fn.next) {
        return toast.error(`Node pertanyaan "${fn.id}" wajib dihubungkan ke node lanjutan`)
      }
      if (fn.type === 'condition') {
        if (!fn.branches || fn.branches.length === 0) {
          return toast.error(`Node kondisi "${fn.id}" wajib memiliki minimal 1 branch`)
        }
        if (fn.branches.some((b) => !b.next)) {
          return toast.error(`Semua branch pada node "${fn.id}" wajib dihubungkan ke node lanjutan`)
        }
      }
    }

    save({
      deviceId, name, triggerKeyword, triggerMatchType, startNodeId,
      nodes: nodes.map((n) => toApiNode(n.data.formNode)),
    })
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)?.data.formNode ?? null
  const precedingSaveAs = nodes
    .filter((n) => n.data.formNode.type === 'question' && n.data.formNode.saveAs && n.id !== selectedNodeId)
    .map((n) => n.data.formNode.saveAs!)

  if (!canUseChatFlow) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background text-center p-6" style={{ zIndex: 50 }}>
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Icon icon="mdi:lock" className="text-3xl text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-lg">Fitur Premium</p>
          <p className="text-muted-foreground text-sm mt-1">Chat Flow tersedia untuk plan REGULAR ke atas.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/chat-flows')}>
          <Icon icon="mdi:arrow-left" className="mr-2" />Kembali
        </Button>
      </div>
    )
  }

  if (!isNew && isLoading) return <PageLoader />

  return (
    <div className="fixed inset-0 flex flex-col bg-background" style={{ zIndex: 50 }}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b bg-background flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat-flows')}>
          <Icon icon="mdi:arrow-left" />
        </Button>
        <Input
          placeholder="Nama Flow"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-48 h-8"
        />
        <Select value={deviceId} onValueChange={setDeviceId} disabled={!isNew}>
          <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Device" /></SelectTrigger>
          <SelectContent>
            {devices?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Trigger keyword"
          value={triggerKeyword}
          onChange={(e) => setTriggerKeyword(e.target.value)}
          className="w-36 h-8"
        />
        <Select value={triggerMatchType} onValueChange={(v) => setTriggerMatchType(v as AutoReplyMatchType)}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MATCH_TYPES.map((t) => <SelectItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button className="bg-wa-600 hover:bg-wa-700 h-8" onClick={handleSave} disabled={saving}>
          {saving ? <Icon icon="mdi:loading" className="animate-spin mr-1.5" /> : <Icon icon="mdi:content-save-outline" className="mr-1.5" />}
          Simpan
        </Button>
      </div>

      {/* Canvas + inspector */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable className="!bg-muted" />
            <Panel position="top-left">
              <div className="flex flex-col gap-1 bg-card border rounded-lg p-1.5 shadow-sm">
                <span className="text-[10px] font-semibold text-muted-foreground px-1.5 uppercase tracking-wide">Tambah Node</span>
                {NODE_TYPES.map((t) => (
                  <Button key={t} size="sm" variant="outline" className="justify-start h-7 text-xs" onClick={() => addNode(t)}>
                    <Icon icon={NODE_TYPE_ICONS[t]} className="mr-1.5" />{NODE_TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            isStart={selectedNode.id === startNodeId}
            precedingSaveAs={precedingSaveAs}
            onUpdate={updateSelectedNode}
            onRename={renameSelectedNode}
            onDelete={deleteSelectedNode}
            onSetStart={() => setStartNodeId(selectedNode.id)}
            onClose={() => setSelectedNodeId(null)}
            canDelete={nodes.length > 1}
          />
        )}
      </div>
    </div>
  )
}
