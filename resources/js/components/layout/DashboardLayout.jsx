import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import {
    LayoutDashboard, Users, Briefcase, CreditCard, TrendingDown,
    Settings, FileText, Database, LogOut, Menu, X, Sun, Moon,
    ChevronRight, Bell, User, FolderOpen, FileCode, LayoutList
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Ana Sayfa' },
    { to: '/jobs', icon: Briefcase, label: 'İşler' },
    { to: '/kanban', icon: LayoutList, label: 'İş Takip (Kanban)' },
    { to: '/customers', icon: Users, label: 'Müşteriler' },
    { to: '/payments', icon: CreditCard, label: 'Tahsilatlar' },
    { to: '/expenses', icon: TrendingDown, label: 'Masraflar' },
    { to: '/files', icon: FolderOpen, label: 'Dosyalar' },
    { to: '/logs', icon: FileText, label: 'Aktivite Logları' },
    { to: '/backup', icon: Database, label: 'Yedek' },
    { to: '/api-docs', icon: FileCode, label: 'API Dokümanı' },
    { to: '/settings', icon: Settings, label: 'Ayarlar' },
]

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, clearAuth } = useAuthStore()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout')
        } catch { }
        clearAuth()
        navigate('/login')
        toast.success('Çıkış yapıldı.')
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
                bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Briefcase size={16} className="text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">FA Medya</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">CRM Panel</div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Tenant info */}
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Tenant</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user?.tenant?.name || 'Yükleniyor...'}</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                                ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom user section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                        </div>
                    </div>
                    <NavLink
                        to="/profile"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `
                            w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors mb-1
                            ${isActive
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }
                        `}
                    >
                        <User size={16} />
                        Profilim
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={16} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex-1 lg:flex-none" />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user?.name}</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
