// ─── Enums ────────────────────────────────────────────────────────────────────

export type Plan = 'FREE' | 'LITE' | 'REGULAR' | 'MASTER' | 'ULTRA'

export type DeviceStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'CONNECTED'
  | 'BANNED'
  | 'LOGGED_OUT'

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'AUDIO'
  | 'LOCATION'
  | 'CONTACT'
  | 'TEMPLATE'
  | 'LIST'
  | 'BUTTON'

export type MessageStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'

export type BroadcastStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'FINISHED'
  | 'FAILED'

export type AutoReplyMatchType = 'EXACT' | 'CONTAINS' | 'STARTS_WITH' | 'REGEX' | 'AI'

export type InvoiceStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'

export type IntegrationLogStatus = 'SUCCESS' | 'FAILED' | 'FILTERED' | 'INVALID_PHONE' | 'INACTIVE'

export type AnnouncementType = 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS' | 'MAINTENANCE'

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF'

export type TemplateCategory = 'general' | 'greeting' | 'promo' | 'notification'

export type EmailTemplateCategory = 'registration' | 'account' | 'payment' | 'notification'

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  plan: Plan
  apiKey: string
  isActive: boolean
  emailVerified?: boolean
  totpEnabled?: boolean
  planExpiresAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface DeviceWarmup {
  startedAt: string | null
  day: number
  maxMessagesPerDay: number
  delayMultiplier: number
  isWarmingUp: boolean
}

export interface Device {
  id: string
  userId: string
  name: string
  phone: string | null
  status: DeviceStatus
  qrCode: string | null
  minDelay: number
  maxDelay: number
  workingHoursStart: number | null
  workingHoursEnd: number | null
  workingDays: number[]
  badWordsEnabled: boolean
  badWords: string[]
  autoSaveContacts: boolean
  typingIndicator: boolean
  readReceiptSimulation: boolean
  warmupEnabled: boolean
  warmup: DeviceWarmup | null
  createdAt: string
  updatedAt: string
}

export interface WaGroup {
  jid: string
  name: string
  description: string | null
  participantCount: number
  createdAt: string | null
}

export interface WaGroupMember {
  jid: string
  phone: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export type AgentRole = 'OWNER' | 'AGENT' | 'VIEWER'

export interface DeviceAgent {
  id: string
  deviceId: string
  userId: string
  role: AgentRole
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

export interface Message {
  id: string
  deviceId: string
  to: string
  type: MessageType
  content: string | null
  mediaUrl: string | null
  caption: string | null
  status: MessageStatus
  retries: number
  errorMessage: string | null
  waMessageId: string | null
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

export interface Webhook {
  id: string
  url: string
  secret: string
  isActive: boolean
  events: string[]
  devices: Device[]
  createdAt: string
  updatedAt?: string
}

export interface ContactLabel {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  userId: string
  name: string
  phone: string
  variables: Record<string, string> | null
  notes: string | null
  labels: ContactLabel[]
  createdAt: string
  updatedAt: string
}

export interface ContactGroup {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface AutoReply {
  id: string
  userId: string
  deviceId: string
  name: string
  keyword: string
  matchType: AutoReplyMatchType
  replyType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  replyContent: string
  replyMediaUrl: string | null
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface Broadcast {
  id: string
  userId: string
  name: string
  deviceId: string | null
  contactGroupId: string | null
  type: MessageType
  content: string
  mediaUrl: string | null
  caption: string | null
  status: BroadcastStatus
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  totalCount: number
  sentCount: number
  failedCount: number
  delayMin: number
  delayMax: number
  variantBContent: string | null
  variantBMediaUrl: string | null
  variantBCaption: string | null
  variantBRatio: number | null
  createdAt: string
  updatedAt: string
}

export interface BroadcastVariantStats {
  total: number
  SENT: number
  DELIVERED: number
  READ: number
  FAILED: number
  deliveryRate: number
}

export interface BroadcastVariants {
  broadcastId: string
  hasVariants: boolean
  variantBRatio: number
  A: BroadcastVariantStats
  B: BroadcastVariantStats
}

export interface Invoice {
  id: string
  userId: string
  plan: Plan
  amount: number         // IDR (dalam sen)
  status: InvoiceStatus
  paymentUrl: string | null
  paidAt: string | null
  expiresAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Integration {
  id: string
  userId: string
  deviceId: string
  name: string
  platform: string
  secretToken: string
  isActive: boolean
  phoneField: string | null
  targetPhone: string | null
  messageTemplate: string
  filterField: string | null
  filterValue: string | null
  signatureHeader: string | null
  signatureSecret: string | null
  createdAt: string
  updatedAt: string
  device: { id: string; name: string; status: DeviceStatus }
}

export interface IntegrationLog {
  id: string
  integrationId: string
  rawPayload: Record<string, unknown>
  renderedMessage: string | null
  phoneSent: string | null
  status: IntegrationLogStatus
  error: string | null
  createdAt: string
}

export interface PlatformPreset {
  key: string
  label: string
  category: string
  phoneField?: string
  filterField?: string
  filterValueExample?: string
  templateHint: string
  webhookDocsUrl?: string
  notes?: string
  /** true jika plan user saat ini tidak boleh memakai platform ini (butuh fitur webhook / upgrade) */
  locked?: boolean
}

export interface IncomingMessage {
  id: string
  userId?: string
  deviceId: string
  from: string
  pushName: string | null
  type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'sticker'
  content: string
  mediaUrl: string | null
  isRead: boolean
  isGroup: boolean
  groupId: string | null
  waMessageId: string | null
  repliedWith: string | null
  createdAt: string
}

export interface Conversation {
  from: string
  pushName: string | null
  deviceId: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export interface MessageTemplate {
  id: string
  userId: string
  name: string
  category: TemplateCategory
  type: MessageType
  content: string
  mediaUrl: string | null
  caption: string | null
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  userId: string | null
  name: string
  slug: string
  category: EmailTemplateCategory
  subject: string
  htmlContent: string
  plainTextContent: string | null
  variables: string[]
  isDefault: boolean
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: AnnouncementType
  targetPlan: Plan[]
  startsAt: string | null
  endsAt: string | null
  isActive?: boolean
  createdAt?: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export interface AuditLog {
  id: string
  actorType: 'user' | 'admin'
  actorId: string
  actorEmail: string
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

// ─── API Wrappers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    page: number
    limit: number
    total: number
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── DTOs (request bodies) ────────────────────────────────────────────────────

/** POST /messages/send — backend field names */
export interface SendMessageDto {
  deviceId: string
  to: string
  type: MessageType
  message?: string   // backend key (stored as `content`)
  url?: string       // backend key (stored as `mediaUrl`)
  caption?: string
  latitude?: number
  longitude?: number
  linkPreview?: boolean
  scheduledAt?: string
}

/** POST /messages/send-bulk — backend field names */
export interface BulkMessageDto {
  deviceId: string
  recipients: string[]
  type: MessageType
  message?: string
  url?: string
  caption?: string
}

export interface BulkSendResult {
  id: string
  to: string
  status: MessageStatus
  error: string | null
}

export interface MessageFilter {
  deviceId?: string
  status?: MessageStatus
  from?: string   // ISO8601 start date
  to?: string     // ISO8601 end date (note: same name as message recipient — only used as query param)
  search?: string
  page?: number
  limit?: number
}

export interface LoginDto {
  email: string
  password: string
  otp?: string   // wajib jika 2FA aktif (error OTP_REQUIRED)
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface UpdateProfileDto {
  name?: string
  password?: string
}

export interface CreateWebhookDto {
  url: string
  events: string[]
  deviceIds: string[]
}

export interface UpdateWebhookDto extends Partial<CreateWebhookDto> {
  isActive?: boolean
}

export interface CreateContactDto {
  name: string
  phone: string
  variables?: Record<string, string>
  notes?: string
}

export interface UpdateContactDto {
  name?: string
  variables?: Record<string, string>
  notes?: string
}

export interface CreateAutoReplyDto {
  deviceId: string
  name: string
  keyword: string
  matchType?: AutoReplyMatchType
  replyType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  replyContent: string
  replyMediaUrl?: string
  priority?: number
}

export interface UpdateAutoReplyDto extends Partial<Omit<CreateAutoReplyDto, 'deviceId'>> {
  isActive?: boolean
}

export interface CreateBroadcastDto {
  name: string
  deviceId?: string
  contactGroupId?: string
  type?: MessageType
  content: string
  mediaUrl?: string
  caption?: string
  scheduledAt?: string
  delayMin?: number
  delayMax?: number
  variantBContent?: string
  variantBMediaUrl?: string
  variantBCaption?: string
  variantBRatio?: number
}

// ─── Chat Flows ────────────────────────────────────────────────────────────────

export type ChatFlowNodeType = 'message' | 'question' | 'condition' | 'action' | 'end'

export type ChatFlowActionType = 'ADD_LABEL' | 'ASSIGN_AGENT' | 'WEBHOOK'

export interface ChatFlowConditionBranch {
  matchType: AutoReplyMatchType
  value: string
  next: string
}

export interface ChatFlowMessageNode {
  id: string
  type: 'message'
  text: string
  mediaUrl?: string
  next?: string
}

export interface ChatFlowQuestionNode {
  id: string
  type: 'question'
  text: string
  saveAs: string
  next: string
}

export interface ChatFlowConditionNode {
  id: string
  type: 'condition'
  variable: string
  branches: ChatFlowConditionBranch[]
  default?: string
}

export interface ChatFlowActionNode {
  id: string
  type: 'action'
  action: ChatFlowActionType
  params?: Record<string, string>
  next?: string
}

export interface ChatFlowEndNode {
  id: string
  type: 'end'
}

export type ChatFlowNode =
  | ChatFlowMessageNode
  | ChatFlowQuestionNode
  | ChatFlowConditionNode
  | ChatFlowActionNode
  | ChatFlowEndNode

export interface ChatFlow {
  id: string
  userId: string
  deviceId: string
  name: string
  triggerKeyword: string
  triggerMatchType: AutoReplyMatchType
  startNodeId: string
  nodes: ChatFlowNode[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateChatFlowDto {
  deviceId: string
  name: string
  triggerKeyword: string
  triggerMatchType?: AutoReplyMatchType
  startNodeId: string
  nodes: ChatFlowNode[]
}

export interface UpdateChatFlowDto extends Partial<Omit<CreateChatFlowDto, 'deviceId'>> {
  isActive?: boolean
}

export interface ChatFlowSession {
  id: string
  contactPhone: string
  currentNodeId: string
  variables: Record<string, string>
  updatedAt: string
}

// ─── IP Whitelist ─────────────────────────────────────────────────────────────

export interface IpWhitelistEntry {
  id: string
  userId: string
  ip: string
  label: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/** GET /account/ai-usage — kuota balasan AI bulanan */
export interface AiUsage {
  month: string       // YYYY-MM
  used: number
  limit: number       // 0 = plan tanpa AI, -1 = unlimited
  remaining: number   // -1 = unlimited
  plan: Plan
}

/** GET /plans — item pricing publik. Semua harga dalam IDR sen, -1 = unlimited */
export interface PublicPlan {
  plan: Plan
  price: number
  priceLabel: string   // "Gratis" | "Rp 25.000/bulan"
  watermark: boolean
  watermarkNote: string | null
  allowedMessageTypes: string[] | 'all'  // kosong array = semua tipe
  messageTypeNote: string
  limits: {
    maxDevices: number
    monthlyMessages: number
    maxContacts: number
    maxBroadcasts: number
    messageRetentionDays: number | null
    maxTemplates: number | null
    aiMonthlyReplies: number
  }
  features: {
    autoReply: boolean
    aiReply: boolean
    deviceRotation: boolean
    webhook: boolean
    csvImport: boolean
    ipWhitelist: boolean
  }
  integrations: {
    enabled: boolean
    allowedPlatforms: string[] | 'all'  // 'all' jika tanpa batasan, [] jika webhook tidak aktif
    totalPlatformsAvailable: number
  }
}

/** Baris PlanLimit dari GET/PUT /admin/plans (row Prisma; `seeded:false` jika belum ada di DB) */
export interface AdminPlanLimit {
  id?: string
  plan: Plan
  seeded?: boolean
  maxDevices?: number
  monthlyMessages?: number
  maxContacts?: number
  maxBroadcasts?: number
  messageRetentionDays?: number
  maxTemplates?: number
  canAutoReply?: boolean
  canDeviceRotation?: boolean
  canSchedule?: boolean
  canWebhook?: boolean
  canCsvImport?: boolean
  canIpWhitelist?: boolean
  canAiReply?: boolean
  aiMonthlyReplies?: number
  hasWatermark?: boolean
  allowedMessageTypes?: MessageType[]  // kosong = semua tipe diizinkan
  allowedPlatforms?: string[]  // key dari GET /integrations/platforms; kosong = semua platform
  price?: number   // IDR sen
}

export interface AccountStats {
  messages: {
    total: number
    thisMonth: number
    lastMonth: number
    byStatus: Record<string, number>
  }
  devices: {
    total: number
    byStatus: Record<string, number>
  }
  webhooks: {
    activeTotal: number
  }
}
