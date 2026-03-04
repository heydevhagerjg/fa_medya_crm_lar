import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import { Users, Briefcase, TrendingUp, CreditCard, TrendingDown, CheckSquare, Clock, BarChart3, ArrowUpRight, Activity, Plus, ChevronDown, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'

const statusLabel = {
    PENDING: { label: 'Bekliyor', color: 'text-yellow-500 bg-yellow-500/10' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: 'text-blue-500 bg-blue-500/10' },
    COMPLETED: { label: 'Tamamlandı', color: 'text-green-500 bg-green-500/10' },
    CANCELLED: { label: 'İptal', color: 'text-red-500 bg-red-500/10' },
}

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/dashboard/stats').then(r => r.data),
        refetchInterval: 60000,
    })

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const statCards = [
        { label: 'Toplam Müşteri', value: stats?.totalCustomers || 0, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10 dark:bg-blue-500/10', iconColor: 'text-blue-500' },
        { label: 'Aktif İşler', value: stats?.activeJobs || 0, icon: Briefcase, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500/10', iconColor: 'text-indigo-500' },
        { label: 'Tamamlanan', value: stats?.completedJobs || 0, icon: CheckSquare, color: 'from-green-500 to-green-600', bg: 'bg-green-500/10', iconColor: 'text-green-500' },
        { label: 'Toplam Tahsilat', value: formatCurrency(stats?.totalPayments), icon: CreditCard, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', isText: true },
        { label: 'Toplam Masraf', value: formatCurrency(stats?.totalExpenses), icon: TrendingDown, color: 'from-red-500 to-red-600', bg: 'bg-red-500/10', iconColor: 'text-red-500', isText: true },
        { label: 'Net Kâr', value: formatCurrency(stats?.netProfit), icon: TrendingUp, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', iconColor: 'text-purple-500', isText: true },
    ]

    if (isLoading) return <LoadingSkeleton />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center relative z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ana Sayfa</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Genel bakış ve istatistikler</p>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30"
                    >
                        <Plus size={18} />
                        Yeni
                        <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <Link to="/customers?new=1" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <UserPlus size={16} className="text-blue-500" />
                                </div>
                                <span className="font-medium">Yeni Müşteri</span>
                            </Link>
                            <Link to="/jobs?new=1" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <Briefcase size={16} className="text-indigo-500" />
                                </div>
                                <span className="font-medium">Yeni İş / Proje</span>
                            </Link>
                            <Link to="/payments?new=1" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <CreditCard size={16} className="text-emerald-500" />
                                </div>
                                <span className="font-medium">Yeni Tahsilat</span>
                            </Link>
                            <Link to="/expenses?new=1" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown size={16} className="text-red-500" />
                                </div>
                                <span className="font-medium">Yeni Masraf</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {statCards.map(({ label, value, icon: Icon, bg, iconColor, isText }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${bg} p-2.5 rounded-xl`}>
                                <Icon size={20} className={iconColor} />
                            </div>
                            <ArrowUpRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className={`${isText ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white`}>{value}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Cash Registers Section */}
            <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Giriş/Çıkış Özeti (Kasalar)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats?.cashRegisters?.map((cr) => (
                        <div key={cr.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                <CreditCard size={20} className="text-gray-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{cr.name}</div>
                                    {cr.isDefault && (
                                        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">Varsayılan</span>
                                    )}
                                </div>
                                <div className={`text-lg font-bold ${cr.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {formatCurrency(cr.balance)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!stats?.cashRegisters?.length && <p className="text-sm text-gray-500">Henüz kasa kaydı yok.</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Jobs */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase size={18} className="text-indigo-500" />
                            Son İşler
                        </h2>
                        <Link to="/jobs" className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">Tümü →</Link>
                    </div>
                    <div className="space-y-3">
                        {(stats?.recentJobs || []).map(job => {
                            const s = statusLabel[job.status] || statusLabel.PENDING
                            return (
                                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                        <Briefcase size={16} className="text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{job.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{job.customer?.name} • {formatDate(job.createdAt)}</div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${s.color}`}>{s.label}</span>
                                </Link>
                            )
                        })}
                        {!stats?.recentJobs?.length && <p className="text-center text-gray-400 text-sm py-4">Henüz iş yok.</p>}
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard size={18} className="text-emerald-500" />
                            Son Tahsilatlar
                        </h2>
                        <Link to="/payments" className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">Tümü →</Link>
                    </div>
                    <div className="space-y-3">
                        {(stats?.recentPayments || []).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <CreditCard size={16} className="text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.job?.title || 'Genel'}</div>
                                    <div className="text-xs text-gray-500">{formatDate(p.paymentDate)}</div>
                                </div>
                                <span className="text-sm font-bold text-emerald-500">{formatCurrency(p.amount)}</span>
                            </div>
                        ))}
                        {!stats?.recentPayments?.length && <p className="text-center text-gray-400 text-sm py-4">Henüz tahsilat yok.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-48" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-32" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-20" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-64" />
                ))}
            </div>
        </div>
    )
}
