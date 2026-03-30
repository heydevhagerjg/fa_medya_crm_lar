import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import {
    Users, Briefcase, TrendingUp, CreditCard, TrendingDown, CheckSquare, Clock, BarChart3,
    ArrowUpRight, Activity, Plus, ChevronDown, UserPlus, Calendar as CalendarIcon, FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/index.js'
import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/layout/PageHeader.jsx'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function DashboardPage() {
    const { user } = useAuthStore()
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

    const hasPermission = (p) => {
        if (!p) return true;
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(p) || false;
    }

    const statCards = [
        { label: 'Toplam Müşteri', value: stats?.totalCustomers || 0, icon: Users, bg: 'bg-primary/10', iconColor: 'text-primary' },
        { label: 'Aktif İşler', value: stats?.activeJobs || 0, icon: Briefcase, bg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
        { label: 'Tamamlanan', value: stats?.completedJobs || 0, icon: CheckSquare, bg: 'bg-success/10', iconColor: 'text-success' },
        { label: 'Toplam Tahsilat', value: formatCurrency(stats?.totalPayments), icon: CreditCard, bg: 'bg-orange-500/10', iconColor: 'text-orange-500', isText: true, permission: 'payments.view' },
        { label: 'Toplam Masraf', value: formatCurrency(stats?.totalExpenses), icon: TrendingDown, bg: 'bg-red-500/10', iconColor: 'text-red-500', isText: true, permission: 'expenses.view' },
        { label: 'Kasa Toplamı', value: formatCurrency(stats?.cashRegisters?.reduce((acc, cr) => acc + cr.balance, 0)), icon: TrendingUp, bg: 'bg-purple-500/10', iconColor: 'text-purple-500', isText: true },
    ]

    if (isLoading) return <LoadingSkeleton />

    return (
        <div className="theme-app-shell space-y-6">
            <PageHeader
                title="İstatistikler"
                subtitle="Canlı Veri Akışı"
                icon={BarChart3}
                iconColor="text-indigo-500"
                actions={[
                    { label: 'Hızlı İşlem', onClick: () => setDropdownOpen(!dropdownOpen), icon: Plus, variant: 'primary' }
                ]}
                breadcrumbs={['İstatistikler']}
                childrenPlacement="actions"
            >
                {dropdownOpen && (
                    <div className="theme-surface absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border theme-divider py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <Link to="/customers?new=1" className="theme-text-primary flex items-center gap-3 px-4 py-3 text-sm hover:theme-surface-alt transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <UserPlus size={16} className="text-blue-500" />
                            </div>
                            <span className="font-medium">Yeni Müşteri</span>
                        </Link>
                        <Link to="/jobs?new=1" className="theme-text-primary flex items-center gap-3 px-4 py-3 text-sm hover:theme-surface-alt transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Briefcase size={16} className="text-indigo-500" />
                            </div>
                            <span className="font-medium">Yeni İş / Proje</span>
                        </Link>
                        {hasPermission('payments.create') && (
                            <Link to="/payments?new=1" className="theme-text-primary flex items-center gap-3 px-4 py-3 text-sm hover:theme-surface-alt transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <CreditCard size={16} className="text-emerald-500" />
                                </div>
                                <span className="font-medium">Yeni Tahsilat</span>
                            </Link>
                        )}
                        {hasPermission('expenses.create') && (
                            <Link to="/expenses?new=1" className="theme-text-primary flex items-center gap-3 px-4 py-3 text-sm hover:theme-surface-alt transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown size={16} className="text-red-500" />
                                </div>
                                <span className="font-medium">Yeni Masraf</span>
                            </Link>
                        )}
                    </div>
                )}
            </PageHeader>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {statCards
                    .filter(card => hasPermission(card.permission))
                    .map(({ label, value, icon: IconComp, bg, iconColor, isText }) => (
                    <div key={label} className="theme-surface border theme-divider rounded-3xl p-4 hover:-translate-y-1 transition-all duration-300 group shadow-[0_1px_8px_0_rgba(26,26,46,0.06)] hover:shadow-xl dark:shadow-none dark:hover:shadow-primary/5">
                        <div className="flex items-start justify-between mb-5">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${bg}`}>
                                <IconComp size={20} className={iconColor} />
                            </div>
                            <div className="theme-surface-alt w-7 h-7 rounded-full border theme-divider flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <ArrowUpRight size={12} className="theme-text-secondary" />
                            </div>
                        </div>
                        <div className={`${isText ? 'text-base' : 'text-2xl'} font-black theme-text-primary tracking-tight leading-none`}>{value}</div>
                        <div className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest mt-2 opacity-80">{label}</div>
                    </div>
                ))}
            </div>

            {/* Cash Registers Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-base font-black theme-text-primary tracking-tight uppercase">Kasa Özeti</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats?.cashRegisters?.map((cr) => (
                        <div key={cr.id} className="theme-surface border theme-divider rounded-2xl p-3 flex items-center gap-3 transition-all hover:theme-surface-alt shadow-[0_1px_8px_0_rgba(26,26,46,0.06)] dark:shadow-none">
                            <div className="theme-surface-alt w-12 h-12 rounded-xl border theme-divider flex items-center justify-center">
                                <CreditCard size={20} className="theme-text-secondary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-bold theme-text-secondary uppercase tracking-wider">{cr.name}</div>
                                    {cr.isDefault && (
                                        <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">Varsayılan</span>
                                    )}
                                </div>
                                <div className={`text-sm font-black mt-0.5 ${cr.balance >= 0 ? 'text-success' : 'text-red-500'}`}>
                                    {formatCurrency(cr.balance)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!stats?.cashRegisters?.length && <p className="text-sm theme-text-secondary py-4 font-medium italic">Henüz kasa kaydı yok.</p>}
                </div>
            </div>

            {stats?.upcomingAppointments?.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-lg font-black theme-text-primary tracking-tight uppercase">Yaklaşan Randevular</h2>
                        </div>
                        <Link to="/appointments" className="text-xs font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full transition-all">Tüm Takvim</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        {stats.upcomingAppointments.map((apt) => (
                            <AppointmentCard key={apt.id} apt={apt} />
                        ))}
                    </div>
                </div>
            )}

            {/* Service Tracking Reminders */}
            {stats?.upcomingServiceTrackings?.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold theme-text-primary flex items-center gap-2">
                            <Clock size={18} className="text-orange-500" />
                            Hizmet Yenileme Hatırlatmaları (±7 Gün)
                        </h2>
                        <Link to="/service-trackings" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full">Tüm Takipler</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.upcomingServiceTrackings.map((t) => {
                            const isOverdue = new Date(t.next_date) < new Date().setHours(0, 0, 0, 0)
                            return (
                                <Link key={t.id} to="/service-trackings" className={`theme-surface border theme-divider rounded-2xl p-4 hover:shadow-lg transition-all border-l-4 ${isOverdue ? 'border-l-red-500 shadow-red-500/5' : 'border-l-orange-500 shadow-orange-500/5'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold theme-text-secondary uppercase">{t.category?.name || 'Genel'}</div>
                                        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {isOverdue ? 'GECİKTİ' : 'YAKLAŞTI'}
                                        </div>
                                    </div>
                                    <div className="font-bold theme-text-primary text-sm truncate mb-1">{t.title}</div>
                                    <div className="text-xs theme-text-secondary mb-3 truncate">
                                        {t.job ? `${t.job.title} / ${t.job.customer?.name || 'Bilinmiyor'}` : (t.customer?.name || 'Genel Müşteri')}
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className={`text-xs font-bold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-orange-500'}`}>
                                            <CalendarIcon size={12} />
                                            {formatDate(t.next_date)}
                                        </div>
                                        {t.missed_count > 0 && (
                                            <div className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                                {t.missed_count} Gecikme
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Jobs */}
                <div className="theme-surface border theme-divider rounded-2xl p-5 shadow-[0_1px_8px_0_rgba(26,26,46,0.06)] dark:shadow-none">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h2 className="text-lg font-black theme-text-primary tracking-tight uppercase">Son İşler</h2>
                        </div>
                        <Link to="/jobs" className="text-xs font-black text-primary hover:opacity-70 uppercase tracking-widest transition-opacity">Tümünü Gör</Link>
                    </div>
                    <div className="space-y-1">
                        {(stats?.recentJobs || []).map(job => (
                            <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-3 py-3 px-1 rounded-xl hover:theme-surface-alt transition-all group border border-transparent hover:theme-divider">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Briefcase size={18} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold theme-text-primary text-base truncate">{job.title}</div>
                                    <div className="text-[10px] font-bold theme-text-secondary mt-0.5 truncate uppercase tracking-tighter">{job.customer?.name}</div>
                                </div>
                                <div className="theme-surface-alt flex items-center gap-2 px-2 py-1 rounded-full border theme-divider shadow-sm">
                                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: job.jobStatus?.color || '#94a3b8' }} />
                                    <span className="text-[8px] font-black theme-text-secondary uppercase tracking-tight">
                                        {job.jobStatus?.name || 'Aşama Belirtilmemiş'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                        {!stats?.recentJobs?.length && <p className="text-center theme-text-secondary text-sm py-4 italic">Henüz iş yok.</p>}
                    </div>
                </div>

                {/* Recent Payments */}
                {hasPermission('payments.view') && (
                    <div className="theme-surface border theme-divider rounded-2xl p-5 shadow-[0_1px_8px_0_rgba(26,26,46,0.06)] dark:shadow-none">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-success rounded-full" />
                                <h2 className="text-lg font-black theme-text-primary tracking-tight uppercase">Son Tahsilatlar</h2>
                            </div>
                            <Link to="/payments" className="text-xs font-black text-success hover:opacity-70 uppercase tracking-widest transition-opacity">Tümünü Gör</Link>
                        </div>
                        <div className="space-y-1">
                            {(stats?.recentPayments || []).map(p => (
                                <Link key={p.id} to={`/payments?id=${p.id}`} className="flex items-center gap-3 py-3 px-1 rounded-xl hover:theme-surface-alt transition-all group border border-transparent hover:theme-divider cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <CreditCard size={18} className="text-success" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold theme-text-primary text-base truncate">{p.job?.title || 'Genel'}</div>
                                        <div className="text-[10px] font-bold theme-text-secondary mt-0.5 uppercase tracking-tighter">{formatDate(p.paymentDate)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.receiptUrl && (
                                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="theme-surface-alt w-7 h-7 rounded-full flex items-center justify-center theme-text-secondary hover:text-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm border theme-divider" title="Dekontu Görüntüle">
                                                <FileText size={12} />
                                            </a>
                                        )}
                                        <span className="text-xs font-black text-success tabular-nums">{formatCurrency(p.amount)}</span>
                                    </div>
                                </Link>
                            ))}
                            {!stats?.recentPayments?.length && <p className="text-center theme-text-secondary text-sm py-4 italic">Henüz tahsilat yok.</p>}
                        </div>
                    </div>
                )}

                {/* Recent Expenses */}
                {hasPermission('expenses.view') && (
                    <div className="theme-surface border theme-divider rounded-2xl p-5 shadow-[0_1px_8px_0_rgba(26,26,46,0.06)] dark:shadow-none">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                                <h2 className="text-lg font-black theme-text-primary tracking-tight uppercase">Son Masraflar</h2>
                            </div>
                            <Link to="/expenses" className="text-xs font-black text-red-500 hover:opacity-70 uppercase tracking-widest transition-opacity">Tümünü Gör</Link>
                        </div>
                        <div className="space-y-1">
                            {(stats?.recentExpenses || []).map(e => (
                                <Link key={e.id} to={`/expenses?id=${e.id}`} className="flex items-center gap-3 py-3 px-1 rounded-xl hover:theme-surface-alt transition-all group border border-transparent hover:theme-divider cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <TrendingDown size={18} className="text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold theme-text-primary text-base truncate">{e.title || e.job?.title || 'Genel Masraf'}</div>
                                        <div className="text-[10px] font-bold theme-text-secondary mt-0.5 uppercase tracking-tighter">{formatDate(e.date)}</div>
                                    </div>
                                    <span className="text-xs font-black text-red-500 tabular-nums">{formatCurrency(e.amount)}</span>
                                </Link>
                            ))}
                            {!stats?.recentExpenses?.length && <p className="text-center theme-text-secondary text-sm py-4 italic">Henüz masraf yok.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function AppointmentCard({ apt }) {
    const [urgencyClass, setUrgencyClass] = useState('')

    useEffect(() => {
        const updateUrgency = () => {
            const now = new Date()
            const start = new Date(apt.startTime)
            const diffMs = start - now
            const diffHours = diffMs / (1000 * 60 * 60)

            if (diffMs < 0) {
                setUrgencyClass('animate-pulse-red-hard shadow-red-100')
            } else if (diffHours < 1.5) {
                setUrgencyClass('animate-pulse-yellow-hard shadow-yellow-100')
            } else if (diffHours < 6) {
                setUrgencyClass('animate-pulse-yellow-soft shadow-amber-50')
            } else {
                setUrgencyClass('theme-surface shadow-sm')
            }
        }

        updateUrgency()
        const interval = setInterval(updateUrgency, 60000)
        return () => clearInterval(interval)
    }, [apt.startTime])

    return (
        <Link to={`/appointments?id=${apt.id}`} className={`${urgencyClass} border theme-divider rounded-3xl p-6 hover:shadow-xl transition-all group border-l-8 border-l-primary flex flex-col justify-between h-full cursor-pointer theme-surface`}>
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="font-black theme-text-primary text-base truncate leading-tight tracking-tight">{apt.title}</div>
                        <div className="flex items-center gap-1.5 text-xs theme-text-secondary mt-2 font-bold uppercase tracking-wider">
                            <Users size={12} className="shrink-0 text-primary" />
                            <span className="truncate">{apt.customer?.name}</span>
                        </div>
                    </div>
                    <div className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1.5 shadow-sm h-fit ${apt.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : apt.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        <Clock size={12} />
                        <Countdown targetDate={apt.startTime} />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary dark:text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <CalendarIcon size={12} />
                    {new Date(apt.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="theme-muted-badge flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border theme-divider">
                    <Clock size={12} />
                    {new Date(apt.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </Link>
    )
}

function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const calculate = () => {
            const now = new Date()
            const target = new Date(targetDate)
            const diffMs = target - now

            if (diffMs <= 0) {
                setTimeLeft('Geciktin')
                return
            }

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

            let parts = []
            if (days > 0) parts.push(`${days}g`)
            if (hours > 0) parts.push(`${hours}sa`)
            parts.push(`${mins}dk`)

            setTimeLeft(parts.join(' '))
        }

        calculate()
        const timer = setInterval(calculate, 60000)
        return () => clearInterval(timer)
    }, [targetDate])

    return <span>{timeLeft}</span>
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8 animate-pulse p-4">
            <div className="h-10 theme-surface-alt border theme-divider rounded-full w-48" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="theme-surface border theme-divider rounded-3xl h-32 px-6 py-8" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="theme-surface border theme-divider rounded-3xl h-96" />
                ))}
            </div>
        </div>
    )
}
