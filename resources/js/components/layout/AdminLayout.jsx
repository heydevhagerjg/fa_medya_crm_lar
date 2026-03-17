import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminStore, useThemeStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import {
    Database, LogOut, Menu, X, Sun, Moon,
    ShieldCheck, User
} from 'lucide-react'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { admin, clearAdminAuth } = useAdminStore()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await api.post('/admin/logout')
        } catch { }
        clearAdminAuth()
        navigate('/admin/login')
        toast.success('Admin çıkışı yapıldı.')
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
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Admin Panel</div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <NavLink
                        to="/admin/dashboard"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                            ${isActive
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                        `}
                    >
                        <Database size={18} />
                        <span>Firmalar (Tenants)</span>
                    </NavLink>
                </nav>

                {/* Bottom user section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{admin?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Sistem Yöneticisi</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={16} />
                        Güvenli Çıkış
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
                    <div className="flex-1" />
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
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
