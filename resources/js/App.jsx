import { Routes, Route, Navigate } from 'react-router-dom'
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

const RestoringOverlay = () => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-full w-full h-full flex items-center justify-center border-4 border-indigo-500 shadow-2xl shadow-indigo-500/20">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Yedekten Geri Dönülüyor</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Verileriniz ve dosyalarınız güvenli bir şekilde sisteme aktarılıyor. Bu işlem birkaç dakika sürebilir.
        </p>
        <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sistem Hazırlanıyor...</span>
        </div>
    </div>
)

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
            }, 5000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isAuthenticated, user?.tenant?.is_restoring])

    const isRestoring = isAuthenticated && user?.tenant?.is_restoring
    if (isRestoring) return <RestoringOverlay />

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
