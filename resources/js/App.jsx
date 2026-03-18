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
import LogsPage from './pages/LogsPage.jsx'
import BackupPage from './pages/BackupPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ApiDocsPage from './pages/ApiDocsPage.jsx'
import KanbanPage from './pages/KanbanPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AppointmentsPage from './pages/AppointmentsPage.jsx'
import ServiceTrackingPage from './pages/ServiceTrackingPage.jsx'
import ProposalsPage from './pages/ProposalsPage.jsx'
import PublicProposalPage from './pages/PublicProposalPage.jsx'
import AdminTenantsPage from './pages/admin/dashboard/TenantsPage.jsx'

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

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Standard User Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

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
                <Route path="/logs" element={<LogsPage />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
