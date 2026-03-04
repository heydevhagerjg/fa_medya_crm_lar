import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/index.js'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
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

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/kanban" element={<KanbanPage />} />
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

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
