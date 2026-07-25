import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { contactApi, contactQueryKeys, type DedupeResult } from '@/api/contact.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/store/auth.store'
import { PLAN_LIMITS } from '@/lib/constants'
import type { Contact, ContactGroup, ContactLabel } from '@/types'

// ─── Label color palette ───────────────────────────────────────────────────────
const LABEL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6',
]

const contactSchema = z.object({
  name:  z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(7, 'Nomor tidak valid'),
  notes: z.string().optional(),
})
type ContactForm = z.infer<typeof contactSchema>

const groupSchema = z.object({
  name:        z.string().min(1, 'Nama grup wajib diisi'),
  description: z.string().optional(),
})
type GroupForm = z.infer<typeof groupSchema>

const labelSchema = z.object({
  name:  z.string().min(1, 'Nama label wajib diisi').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})
type LabelForm = z.infer<typeof labelSchema>

export function ContactsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const plan = user?.plan ?? 'FREE'
  const canCsvImport = PLAN_LIMITS[plan]?.canCsvImport ?? false

  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [contactOpen, setContactOpen]     = useState(false)
  const [groupOpen, setGroupOpen]         = useState(false)
  const [labelOpen, setLabelOpen]         = useState(false)
  const [editContact, setEditContact]     = useState<Contact | null>(null)
  const [editGroup, setEditGroup]         = useState<ContactGroup | null>(null)
  const [editLabel, setEditLabel]         = useState<ContactLabel | null>(null)
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)
  const [deleteGroup, setDeleteGroup]     = useState<ContactGroup | null>(null)
  const [deleteLabel, setDeleteLabel]     = useState<ContactLabel | null>(null)
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0])
  const [dedupePreview, setDedupePreview] = useState<DedupeResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const limit   = 20

  const debouncedSearch = useDebounce(search, 400)

  const { data: contactData, isLoading } = useQuery({
    queryKey: contactQueryKeys.all({ q: debouncedSearch || undefined, page, limit }),
    queryFn:  () => contactApi.getAll({ q: debouncedSearch || undefined, page, limit }),
  })
  const contacts    = contactData?.data.data?.contacts ?? []
  const meta        = contactData?.data.meta
  const totalPages  = meta ? Math.ceil(meta.total / limit) : 1

  const { data: groups } = useQuery({
    queryKey: contactQueryKeys.groups,
    queryFn:  () => contactApi.getGroups(),
    select:   (r) => r.data.data?.groups ?? [],
  })

  const { data: labels } = useQuery({
    queryKey: contactQueryKeys.labels,
    queryFn:  () => contactApi.getLabels(),
    select:   (r) => r.data.data?.labels ?? [],
  })

  // ─── Contact form ─────────────────────────────────────────────────────────────
  const { register: regC, handleSubmit: hsC, reset: resetC, setValue: setVC, formState: { errors: errC } } =
    useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  const { mutate: saveContact, isPending: savingContact } = useMutation({
    mutationFn: (d: ContactForm) =>
      editContact ? contactApi.update(editContact.id, d) : contactApi.create(d),
    onSuccess: () => {
      toast.success(editContact ? 'Kontak diperbarui' : 'Kontak ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setContactOpen(false); setEditContact(null); resetC()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      toast.error(msg === 'DUPLICATE_PHONE' ? 'Nomor sudah terdaftar' : 'Gagal menyimpan kontak')
    },
  })

  const { mutate: removeContact, isPending: deletingContact } = useMutation({
    mutationFn: (id: string) => contactApi.delete(id),
    onSuccess: () => {
      toast.success('Kontak dihapus')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  // ─── Group form ───────────────────────────────────────────────────────────────
  const { register: regG, handleSubmit: hsG, reset: resetG, setValue: setVG, formState: { errors: errG } } =
    useForm<GroupForm>({ resolver: zodResolver(groupSchema) })

  const { mutate: saveGroup, isPending: savingGroup } = useMutation({
    mutationFn: (d: GroupForm) =>
      editGroup ? contactApi.updateGroup(editGroup.id, d) : contactApi.createGroup(d),
    onSuccess: () => {
      toast.success(editGroup ? 'Grup diperbarui' : 'Grup ditambahkan')
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.groups })
      setGroupOpen(false); setEditGroup(null); resetG()
    },
    onError: () => toast.error('Gagal menyimpan grup'),
  })

  const { mutate: removeGroup, isPending: deletingGroup } = useMutation({
    mutationFn: (id: string) => contactApi.deleteGroup(id),
    onSuccess: () => {
      toast.success('Grup dihapus')
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.groups })
    },
  })

  // ─── Label form ───────────────────────────────────────────────────────────────
  const { register: regL, handleSubmit: hsL, reset: resetL, setValue: setVL, watch: watchL, formState: { errors: errL } } =
    useForm<LabelForm>({
      resolver: zodResolver(labelSchema),
      defaultValues: { color: LABEL_COLORS[0] },
    })
  const labelNamePreview = watchL('name')

  const { mutate: saveLabel, isPending: savingLabel } = useMutation({
    mutationFn: (d: LabelForm) =>
      editLabel ? contactApi.updateLabel(editLabel.id, d) : contactApi.createLabel(d),
    onSuccess: () => {
      toast.success(editLabel ? 'Label diperbarui' : 'Label ditambahkan')
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.labels })
      setLabelOpen(false); setEditLabel(null); resetL(); setSelectedColor(LABEL_COLORS[0])
    },
    onError: () => toast.error('Gagal menyimpan label'),
  })

  const { mutate: removeLabel, isPending: deletingLabel } = useMutation({
    mutationFn: (id: string) => contactApi.deleteLabel(id),
    onSuccess: () => {
      toast.success('Label dihapus')
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.labels })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  // ─── CSV Import ───────────────────────────────────────────────────────────────
  const { mutate: importCsv, isPending: importing } = useMutation({
    mutationFn: (file: File) => contactApi.importCsv(file),
    onSuccess: (res) => {
      const { imported, skipped } = res.data.data
      toast.success(`Import selesai: ${imported} kontak berhasil, ${skipped} dilewati`)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: () => toast.error('Gagal import CSV'),
  })

  // ─── Dedupe ───────────────────────────────────────────────────────────────────
  const { mutate: dedupe, isPending: deduping } = useMutation({
    mutationFn: (dryRun: boolean) => contactApi.dedupe(dryRun),
    onSuccess: (res, dryRun) => {
      const data = res.data.data
      if (dryRun) {
        if (data.duplicateGroups === 0) {
          toast.success('Tidak ada kontak duplikat 🎉')
          return
        }
        setDedupePreview(data)
        return
      }
      toast.success(`${data.contactsRemoved} kontak duplikat digabungkan`)
      setDedupePreview(null)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: () => toast.error('Gagal memproses duplikat'),
  })

  // ─── CSV Export ───────────────────────────────────────────────────────────────
  const { mutate: exportCsv, isPending: exporting } = useMutation({
    mutationFn: () => contactApi.exportCsv(),
    onSuccess: (res) => {
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Kontak berhasil diexport')
    },
    onError: () => toast.error('Gagal mengexport kontak'),
  })

  const openAddContact = () => { setEditContact(null); resetC(); setContactOpen(true) }
  const openEditContact = (c: Contact) => {
    setEditContact(c)
    setVC('name', c.name); setVC('phone', c.phone); setVC('notes', c.notes ?? '')
    setContactOpen(true)
  }
  const openAddGroup  = () => { setEditGroup(null); resetG(); setGroupOpen(true) }
  const openEditGroup = (g: ContactGroup) => {
    setEditGroup(g)
    setVG('name', g.name); setVG('description', g.description ?? '')
    setGroupOpen(true)
  }
  const openAddLabel  = () => {
    setEditLabel(null); resetL()
    const color = LABEL_COLORS[0]; setSelectedColor(color); setVL('color', color)
    setLabelOpen(true)
  }
  const openEditLabel = (l: ContactLabel) => {
    setEditLabel(l); setVL('name', l.name); setVL('color', l.color)
    setSelectedColor(l.color); setLabelOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Kontak"
        description="Kelola kontak, grup, dan label untuk pengiriman pesan"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => dedupe(true)} disabled={deduping}>
              <Icon icon={deduping ? 'mdi:loading' : 'mdi:merge'} className={`mr-2 ${deduping ? 'animate-spin' : ''}`} />
              Gabung Duplikat
            </Button>
            <Button variant="outline" onClick={() => exportCsv()} disabled={exporting}>
              <Icon icon={exporting ? 'mdi:loading' : 'mdi:file-download'} className={`mr-2 ${exporting ? 'animate-spin' : ''}`} />
              Export CSV
            </Button>
            {canCsvImport && (
              <>
                <input
                  ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f) }}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
                  <Icon icon={importing ? 'mdi:loading' : 'mdi:file-upload'} className={`mr-2 ${importing ? 'animate-spin' : ''}`} />
                  Import CSV
                </Button>
              </>
            )}
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddContact}>
              <Icon icon="mdi:account-plus" className="mr-2" />
              Tambah Kontak
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="contacts">
        <TabsList className="mb-4">
          <TabsTrigger value="contacts">
            <Icon icon="mdi:contacts" className="mr-1.5" />
            Kontak
            {meta && <Badge variant="secondary" className="ml-1.5 text-xs py-0">{meta.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Icon icon="mdi:account-group" className="mr-1.5" />
            Grup
            {groups && <Badge variant="secondary" className="ml-1.5 text-xs py-0">{groups.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="labels">
            <Icon icon="mdi:label-multiple" className="mr-1.5" />
            Label
            {labels && <Badge variant="secondary" className="ml-1.5 text-xs py-0">{labels.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── Contacts tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="contacts">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          {isLoading ? <PageLoader /> : contacts.length === 0 ? (
            <EmptyState
              icon="mdi:contacts-outline"
              title="Belum ada kontak"
              description="Tambahkan kontak atau import dari CSV"
              action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddContact}><Icon icon="mdi:account-plus" className="mr-2" />Tambah Kontak</Button>}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs bg-muted/30">
                      <th className="text-left px-4 py-3">Nama</th>
                      <th className="text-left px-4 py-3">Nomor</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Label</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Catatan</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">+{c.phone}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {c.labels?.map((l) => (
                              <span
                                key={l.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                                style={{ background: l.color }}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.notes ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditContact(c)}>
                              <Icon icon="mdi:pencil-outline" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteContact(c)}>
                              <Icon icon="mdi:delete-outline" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                    <span className="text-muted-foreground">
                      {meta && `${(page - 1) * limit + 1}–${Math.min(page * limit, meta.total)} dari ${meta.total}`}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <Icon icon="mdi:chevron-left" />
                      </Button>
                      <span className="flex items-center px-3 text-xs">{page} / {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        <Icon icon="mdi:chevron-right" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Groups tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="groups">
          <div className="flex justify-end mb-4">
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddGroup}>
              <Icon icon="mdi:plus" className="mr-2" />Tambah Grup
            </Button>
          </div>
          {!groups?.length ? (
            <EmptyState icon="mdi:account-group-outline" title="Belum ada grup" description="Buat grup kontak untuk broadcast yang lebih mudah" action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddGroup}><Icon icon="mdi:plus" className="mr-2" />Tambah Grup</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <Card key={g.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon icon="mdi:account-group" className="text-wa-600 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{g.name}</span>
                        </div>
                        {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditGroup(g)}>
                          <Icon icon="mdi:pencil-outline" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteGroup(g)}>
                          <Icon icon="mdi:delete-outline" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Labels tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="labels">
          <div className="flex justify-end mb-4">
            <Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddLabel}>
              <Icon icon="mdi:tag-plus" className="mr-2" />Tambah Label
            </Button>
          </div>
          {!labels?.length ? (
            <EmptyState
              icon="mdi:label-multiple-outline"
              title="Belum ada label"
              description="Buat label untuk mengkategorikan kontak Anda"
              action={<Button className="bg-wa-600 hover:bg-wa-700" onClick={openAddLabel}><Icon icon="mdi:tag-plus" className="mr-2" />Tambah Label</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {labels.map((l) => (
                <Card key={l.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-1.5" style={{ background: l.color }} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: l.color }}
                        />
                        <span className="font-medium text-sm truncate">{l.name}</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLabel(l)}>
                          <Icon icon="mdi:pencil-outline" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteLabel(l)}>
                          <Icon icon="mdi:delete-outline" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact form dialog */}
      <Dialog open={contactOpen} onOpenChange={(v) => { setContactOpen(v); if (!v) { resetC(); setEditContact(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editContact ? 'Edit Kontak' : 'Tambah Kontak'}</DialogTitle></DialogHeader>
          <form onSubmit={hsC((d) => saveContact(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input {...regC('name')} />
              {errC.name && <p className="text-xs text-red-500">{errC.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nomor HP</Label>
              <Input placeholder="628123456789" {...regC('phone')} disabled={!!editContact} />
              {errC.phone && <p className="text-xs text-red-500">{errC.phone.message}</p>}
              {editContact && <p className="text-xs text-muted-foreground">Nomor tidak dapat diubah</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input {...regC('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={savingContact}>
                {savingContact ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group form dialog */}
      <Dialog open={groupOpen} onOpenChange={(v) => { setGroupOpen(v); if (!v) { resetG(); setEditGroup(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editGroup ? 'Edit Grup' : 'Tambah Grup'}</DialogTitle></DialogHeader>
          <form onSubmit={hsG((d) => saveGroup(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Grup</Label>
              <Input {...regG('name')} />
              {errG.name && <p className="text-xs text-red-500">{errG.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi (opsional)</Label>
              <Input {...regG('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={savingGroup}>
                {savingGroup ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Label form dialog */}
      <Dialog open={labelOpen} onOpenChange={(v) => { setLabelOpen(v); if (!v) { resetL(); setEditLabel(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editLabel ? 'Edit Label' : 'Tambah Label'}</DialogTitle></DialogHeader>
          <form onSubmit={hsL((d) => saveLabel(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Label</Label>
              <Input placeholder="Pelanggan VIP" {...regL('name')} />
              {errL.name && <p className="text-xs text-red-500">{errL.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2 flex-wrap">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setSelectedColor(color); setVL('color', color) }}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ background: color }}
                    title={color}
                  >
                    {selectedColor === color && (
                      <Icon icon="mdi:check" className="text-white text-sm mx-auto" />
                    )}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ background: selectedColor }}
                >
                  {labelNamePreview || 'Label'}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLabelOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-wa-600 hover:bg-wa-700" disabled={savingLabel}>
                {savingLabel ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteContact} onOpenChange={(v) => { if (!v) setDeleteContact(null) }}
        title="Hapus Kontak?" description={`${deleteContact?.name} (${deleteContact?.phone}) akan dihapus.`}
        confirmLabel="Hapus" destructive loading={deletingContact}
        onConfirm={() => { if (deleteContact) { removeContact(deleteContact.id); setDeleteContact(null) } }}
      />
      <ConfirmDialog
        open={!!deleteGroup} onOpenChange={(v) => { if (!v) setDeleteGroup(null) }}
        title="Hapus Grup?" description={`Grup "${deleteGroup?.name}" akan dihapus permanen.`}
        confirmLabel="Hapus" destructive loading={deletingGroup}
        onConfirm={() => { if (deleteGroup) { removeGroup(deleteGroup.id); setDeleteGroup(null) } }}
      />
      <ConfirmDialog
        open={!!deleteLabel} onOpenChange={(v) => { if (!v) setDeleteLabel(null) }}
        title="Hapus Label?" description={`Label "${deleteLabel?.name}" akan dihapus dari semua kontak.`}
        confirmLabel="Hapus" destructive loading={deletingLabel}
        onConfirm={() => { if (deleteLabel) { removeLabel(deleteLabel.id); setDeleteLabel(null) } }}
      />

      {/* Dedupe preview */}
      <Dialog open={!!dedupePreview} onOpenChange={(v) => { if (!v) setDedupePreview(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:merge" className="text-wa-600" />
              Pratinjau Gabung Duplikat
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ditemukan <strong>{dedupePreview?.duplicateGroups}</strong> nomor duplikat —{' '}
            <strong>{dedupePreview?.contactsRemoved}</strong> kontak akan digabungkan ke kontak tertua.
            Label, grup, dan variabel ikut dipindahkan.
          </p>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {dedupePreview?.details.map((d) => (
              <div key={d.phone} className="p-3 rounded-lg border text-sm space-y-1">
                <p className="font-mono text-xs text-muted-foreground">{d.phone}</p>
                <p className="flex items-center gap-1.5">
                  <Icon icon="mdi:check-circle" className="text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">{d.kept.name}</span>
                  <span className="text-xs text-muted-foreground">({d.kept.phone}) — dipertahankan</span>
                </p>
                {d.removed.map((r) => (
                  <p key={r.id} className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon icon="mdi:close-circle" className="text-red-400 flex-shrink-0" />
                    <span className="line-through">{r.name}</span>
                    <span className="text-xs">({r.phone}) — digabung</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDedupePreview(null)}>Batal</Button>
            <Button className="bg-wa-600 hover:bg-wa-700" disabled={deduping} onClick={() => dedupe(false)}>
              {deduping
                ? <><Icon icon="mdi:loading" className="animate-spin mr-2" />Menggabungkan...</>
                : <><Icon icon="mdi:merge" className="mr-2" />Gabungkan Sekarang</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
