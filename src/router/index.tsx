import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { LoginPage }          from '@/pages/auth/LoginPage'
import { RegisterPage }       from '@/pages/auth/RegisterPage'
import { VerifyEmailPage }    from '@/pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage }  from '@/pages/auth/ResetPasswordPage'
import { DashboardPage }      from '@/pages/dashboard/DashboardPage'
import { DevicesPage }        from '@/pages/devices/DevicesPage'
import { DeviceDetailPage }   from '@/pages/devices/DeviceDetailPage'
import { SendMessagePage }    from '@/pages/messages/SendMessagePage'
import { MessageHistoryPage } from '@/pages/messages/MessageHistoryPage'
import { InboxPage }          from '@/pages/inbox/InboxPage'
import { ContactsPage }       from '@/pages/contacts/ContactsPage'
import { AutoReplyPage }      from '@/pages/autoreply/AutoReplyPage'
import { ChatFlowsPage }      from '@/pages/chatflows/ChatFlowsPage'
import { ChatFlowEditorPage } from '@/pages/chatflows/ChatFlowEditorPage'
import { BroadcastsPage }     from '@/pages/broadcasts/BroadcastsPage'
import { TemplatesPage }      from '@/pages/templates/TemplatesPage'
import { WebhooksPage }       from '@/pages/webhooks/WebhooksPage'
import { IntegrationsPage }   from '@/pages/integrations/IntegrationsPage'
import { AccountPage }        from '@/pages/account/AccountPage'
import { PayInvoicePage }     from '@/pages/payment/PayInvoicePage'
import { PaymentResultPage }  from '@/pages/payment/PaymentResultPage'
import { IpWhitelistPage }    from '@/pages/ipwhitelist/IpWhitelistPage'
import { NotFoundPage }       from '@/pages/NotFoundPage'
import { LandingPage }        from '@/pages/landing/LandingPage'
import { PrivacyPage }        from '@/pages/legal/PrivacyPage'
import { TermsPage }          from '@/pages/legal/TermsPage'
import { ApiDocsPage }        from '@/pages/docs/ApiDocsPage'

// ─── Admin (lazy loaded for better performance) ──────────────────────────────
const AdminLoginPage         = lazy(() => import('@/pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const AdminDashboardPage     = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminUsersPage         = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminUserDetailPage    = lazy(() => import('@/pages/admin/AdminUserDetailPage').then(m => ({ default: m.AdminUserDetailPage })))
const AdminInvoicesPage      = lazy(() => import('@/pages/admin/AdminInvoicesPage').then(m => ({ default: m.AdminInvoicesPage })))
const AdminRevenuePage       = lazy(() => import('@/pages/admin/AdminRevenuePage').then(m => ({ default: m.AdminRevenuePage })))
const AdminPlansPage         = lazy(() => import('@/pages/admin/AdminPlansPage').then(m => ({ default: m.AdminPlansPage })))
const AdminDevicesPage       = lazy(() => import('@/pages/admin/AdminDevicesPage').then(m => ({ default: m.AdminDevicesPage })))
const AdminBroadcastsPage    = lazy(() => import('@/pages/admin/AdminBroadcastsPage').then(m => ({ default: m.AdminBroadcastsPage })))
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage })))
const AdminAuditLogsPage     = lazy(() => import('@/pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })))
const AdminEmailTemplatesPage = lazy(() => import('@/pages/admin/AdminEmailTemplatesPage').then(m => ({ default: m.AdminEmailTemplatesPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',           element: <LoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/verify-email',    element: <VerifyEmailPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password',  element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard',         element: <DashboardPage /> },
          { path: '/devices',           element: <DevicesPage /> },
          { path: '/devices/:id',       element: <DeviceDetailPage /> },
          { path: '/messages/send',     element: <SendMessagePage /> },
          { path: '/messages/history',  element: <MessageHistoryPage /> },
          { path: '/inbox',             element: <InboxPage /> },
          { path: '/contacts',          element: <ContactsPage /> },
          { path: '/broadcasts',        element: <BroadcastsPage /> },
          { path: '/templates',         element: <TemplatesPage /> },
          { path: '/auto-reply',        element: <AutoReplyPage /> },
          { path: '/chat-flows',        element: <ChatFlowsPage /> },
          { path: '/chat-flows/new',    element: <ChatFlowEditorPage /> },
          { path: '/chat-flows/:id',    element: <ChatFlowEditorPage /> },
          { path: '/webhooks',          element: <WebhooksPage /> },
          { path: '/integrations',      element: <IntegrationsPage /> },
          { path: '/account',           element: <AccountPage /> },
          { path: '/ip-whitelist',      element: <IpWhitelistPage /> },
          { path: '/pay/:invoiceId',    element: <PayInvoicePage /> },
          { path: '/payment/success',   element: <PaymentResultPage variant="success" /> },
          { path: '/payment/cancelled', element: <PaymentResultPage variant="cancelled" /> },
        ],
      },
    ],
  },
  // ─── Admin Panel (completely separate from user auth) ─────────────────────
  {
    path: '/admin/login',
    element: <Suspense fallback={<PageLoader />}><AdminLoginPage /></Suspense>,
  },
  {
    element: <AdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin',                  element: <Navigate to="/admin/dashboard" replace /> },
          { path: '/admin/dashboard',        element: <Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense> },
          { path: '/admin/users',            element: <Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense> },
          { path: '/admin/users/:id',        element: <Suspense fallback={<PageLoader />}><AdminUserDetailPage /></Suspense> },
          { path: '/admin/invoices',         element: <Suspense fallback={<PageLoader />}><AdminInvoicesPage /></Suspense> },
          { path: '/admin/revenue',          element: <Suspense fallback={<PageLoader />}><AdminRevenuePage /></Suspense> },
          { path: '/admin/plans',            element: <Suspense fallback={<PageLoader />}><AdminPlansPage /></Suspense> },
          { path: '/admin/devices',          element: <Suspense fallback={<PageLoader />}><AdminDevicesPage /></Suspense> },
          { path: '/admin/broadcasts',       element: <Suspense fallback={<PageLoader />}><AdminBroadcastsPage /></Suspense> },
          { path: '/admin/announcements',    element: <Suspense fallback={<PageLoader />}><AdminAnnouncementsPage /></Suspense> },
          { path: '/admin/audit-logs',       element: <Suspense fallback={<PageLoader />}><AdminAuditLogsPage /></Suspense> },
          { path: '/admin/email-templates',  element: <Suspense fallback={<PageLoader />}><AdminEmailTemplatesPage /></Suspense> },
        ],
      },
    ],
  },
  // ─── Legal pages (public, no auth) ──────────────────────────────────────────
  { path: '/privacy', element: <PrivacyPage />  },
  { path: '/terms',   element: <TermsPage />    },
  { path: '/docs',    element: <ApiDocsPage />  },

  { path: '*', element: <NotFoundPage /> },
])
