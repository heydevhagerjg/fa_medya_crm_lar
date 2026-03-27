import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, useAdminStore } from './stores/index.js'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import CustomerDetailPage from './pages/CustomerDetailPage.jsx'
import JobsPage from './pages/JobsPage.jsx'
import JobDetailPage from './pages/JobDetailPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import ExpensesPage from './pages/ExpensesPage.jsx'
import FilesPage from './pages/FilesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ApiDocsPage from './pages/ApiDocsPage.jsx'
import KanbanPage from './pages/KanbanPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AppointmentsPage from './pages/AppointmentsPage.jsx'
import ServiceTrackingPage from './pages/ServiceTrackingPage.jsx'
import ProposalsPage from './pages/ProposalsPage.jsx'
import PublicProposalPage from './pages/PublicProposalPage.jsx'
import BackupPage from './pages/BackupPage.jsx'
import AdminTenantsPage from './pages/admin/dashboard/TenantsPage.jsx'
import AdminPackagesPage from './pages/admin/dashboard/PackagesPage.jsx'
import AdminSettingsPage from './pages/admin/dashboard/SettingsPage.jsx'
import AdminBackupPage from './pages/admin/dashboard/SystemBackupPage.jsx'
import AdminTenantBackupPage from './pages/admin/dashboard/TenantBackupPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import TermsOfServicePage from './pages/TermsOfServicePage.jsx'
import RefundPolicyPage from './pages/RefundPolicyPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'

import { useEffect, useState } from 'react'
import api from './lib/api.js'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return children
}

const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore()
    if (isAuthenticated) return <Navigate to="/dashboard" replace />
    return children
}

const AdminProtectedRoute = ({ children }) => {
    const { isAdminAuthenticated } = useAdminStore()
    if (!isAdminAuthenticated) return <Navigate to="/admin/login" replace />
    return children
}

const AdminPublicRoute = ({ children }) => {
    const { isAdminAuthenticated } = useAdminStore()
    if (isAdminAuthenticated) return <Navigate to="/admin/dashboard" replace />
    return children
}

const RestoringOverlay = ({ user }) => {
    const progress = user?.tenant?.restoring_progress || 0
    const message = user?.tenant?.restoring_message || 'Sistem hazırlanıyor...'

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-full w-full h-full flex items-center justify-center border-4 border-indigo-500 shadow-2xl shadow-indigo-500/20">
                    <div className="text-xl font-black text-indigo-500">{progress}%</div>
                </div>
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Yedekten Geri Dönülüyor</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
                Verileriniz ve dosyalarınız güvenli bir şekilde sisteme aktarılıyor. Bu işlem birkaç dakika sürebilir.
            </p>

            {/* Progress Bar Container */}
            <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{message}</span>
            </div>
        </div>
    )
}

export default function App() {
    const { isAuthenticated, user, updateUser, clearAuth } = useAuthStore()
    const [isPolling, setIsPolling] = useState(false)

    // Poll for restoration status
    useEffect(() => {
        let interval;
        if (isAuthenticated && user?.tenant?.is_restoring && !isPolling) {
            setIsPolling(true)
            interval = setInterval(async () => {
                try {
                    const response = await api.get('/auth/me')
                    const newUser = response.data
                    updateUser(newUser)
                    if (!newUser.tenant?.is_restoring) {
                        setIsPolling(false)
                        clearInterval(interval)
                        window.location.reload() // Reload to refresh all data caches
                    }
                } catch (err) {
                    if (err.response?.status === 401) {
                        clearAuth()
                        clearInterval(interval)
                    }
                }
            }, 2000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isAuthenticated, user?.tenant?.is_restoring])

    const location = useLocation()
    const isAdminRoute = location.pathname.startsWith('/admin')
    const isPublicRoute = ['/', '/login', '/register', '/pricing', '/tos', '/refund', '/privacy', '/public-proposal/'].some(path => 
        location.pathname === path || location.pathname.startsWith(path + '/')
    )

    const isRestoring = !isAdminRoute && !isPublicRoute && isAuthenticated && user?.tenant?.is_restoring
    if (isRestoring) {
        return (
            <DashboardLayout isRestoring={true}>
                <RestoringOverlay user={user} />
            </DashboardLayout>
        )
    }

    return (
        <>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Standard User Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/tos" element={<TermsOfServicePage />} />
            <Route path="/refund" element={<RefundPolicyPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/kanban" element={<KanbanPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/service-trackings" element={<ServiceTrackingPage />} />
                <Route path="/proposals" element={<ProposalsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/files/folder/:folderId" element={<FilesPage />} />
                <Route path="/settings/*" element={<SettingsPage />} />
                <Route path="/backup" element={<BackupPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/api-docs" element={<ApiDocsPage />} />
            </Route>

            {/* Public Access Link for Clients */}
            <Route path="/public-proposal/:uuid" element={<PublicProposalPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />
            <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route path="/admin/dashboard" element={<AdminTenantsPage />} />
                <Route path="/admin/tenants" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/packages" element={<AdminPackagesPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/backups" element={<AdminBackupPage />} />
                <Route path="/admin/tenant-backups" element={<AdminTenantBackupPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}
