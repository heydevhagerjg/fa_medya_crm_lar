import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAdminStore, useThemeStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import {
    Database, LogOut, Menu, X, Sun, Moon,
    ShieldCheck, Settings, Package,
    LogInIcon
} from 'lucide-react'

const adminNavItems = [
    { to: '/admin/dashboard', icon: Database, label: 'Firmalar (Tenants)', color: '#905EFC' },
    { to: '/admin/packages', icon: Package, label: 'Sistem Paketleri', color: '#1ED2A7' },
    { to: '/admin/backups', icon: Database, label: 'Sistem Yedekleri', color: '#f59e0b' },
    { to: '/admin/tenant-backups', icon: Database, label: 'Firma Yedekleri', color: '#905EFC' },
    { to: '/admin/settings', icon: Settings, label: 'Sistem Ayarları', color: '#ef4444' },
]

export default function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const { admin, clearAdminAuth } = useAdminStore()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        try { await api.post('/admin/logout') } catch {}
        clearAdminAuth()
        navigate('/admin/login')
        toast.success('Admin çıkışı yapıldı.')
    }

    const todayStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-[70px] flex items-center justify-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                    <ShieldCheck size={20} strokeWidth={2} />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col items-center gap-1 py-3 px-[18px]">
                {adminNavItems.map((item) => {
                    const IconComp = item.icon
                    const isActive = location.pathname === item.to || location.pathname.startsWith(item.to)
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={`
                                relative group w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                                ${isActive
                                    ? 'bg-[#1A1A2E] dark:bg-white text-white dark:text-[#1A1A2E] shadow-md'
                                    : 'text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white'
                                }
                            `}
                        >
                            <IconComp size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className="nav-tooltip">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="flex flex-col items-center gap-1 pb-5 px-[18px]">
                <button
                    onClick={toggleTheme}
                    className="relative group w-11 h-11 rounded-full flex items-center justify-center text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white transition-all"
                >
                    {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
                    <span className="nav-tooltip">{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="relative group w-11 h-11 rounded-full bg-[#E5E9F0] dark:bg-white/10 flex items-center justify-center text-sm font-black text-[#1A1A2E] dark:text-white hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 transition-all mt-1"
                >
                    <LogInIcon size={14} />
                    <span className="nav-tooltip">{admin?.name} — Çıkış</span>
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen bg-[#F4F5F7] dark:bg-[#0A0A0A] overflow-hidden">
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar — Desktop */}
            <aside className="hidden lg:flex w-20 shrink-0 flex-col bg-white dark:bg-[#111111] border-r border-[#E5E9F0] dark:border-white/5 overflow-visible z-30">
                {sidebarContent}
            </aside>

            {/* Sidebar — Mobile */}
            <aside className={`
                lg:hidden fixed inset-y-0 left-0 z-50 w-20 flex flex-col
                bg-white dark:bg-[#111111] border-r border-[#E5E9F0] dark:border-white/5
                transform transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#F4F5F7] dark:bg-white/10 text-[#9097A6] hover:text-[#1A1A2E] transition-all">
                    <X size={14} />
                </button>
                {sidebarContent}
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-[70px] shrink-0 flex items-center gap-4 px-5 lg:px-7 bg-white dark:bg-[#111111] border-b border-[#E5E9F0] dark:border-white/5">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white transition-all shrink-0"
                    >
                        <Menu size={18} />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-sm">
                            <ShieldCheck size={14} strokeWidth={2} />
                        </div>
                        <span className="text-sm font-black text-[#1A1A2E] dark:text-white tracking-wide uppercase">Admin Panel</span>
                    </div>

                    <div className="flex-1" />

                    <span className="text-sm font-semibold text-[#9097A6] select-none">{todayStr}</span>

                    <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E9F0] dark:border-white/10">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-[#1A1A2E] dark:text-white leading-tight">{admin?.name}</div>
                            <div className="text-[11px] text-[#9097A6] font-medium">Sistem Yöneticisi</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-sm select-none">
                            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-5 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
