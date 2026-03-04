import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { ArrowLeft, Briefcase, Phone, Mail, FileText } from 'lucide-react'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function CustomerDetailPage() {
    const { id } = useParams()
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => api.get(`/customers/${id}`).then(r => r.data),
    })

    if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor...</div>
    if (!customer) return <div className="text-center text-gray-400 py-12">Müşteri bulunamadı.</div>

    const totalRevenue = (customer.job || []).reduce((s, j) => s + parseFloat(j.total_price || 0), 0)
    const totalPaid = (customer.job || []).reduce((s, j) => s + (j.payment || []).reduce((ps, p) => ps + parseFloat(p.amount || 0), 0), 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/customers" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Müşteri Detayı</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{customer.name}</div>
                            <div className="text-sm text-gray-500">{(customer.job || []).length} iş</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {customer.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={14} className="text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={14} className="text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
                            </div>
                        )}
                        {customer.notes && (
                            <div className="flex items-start gap-3 text-sm mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <FileText size={14} className="text-gray-400 mt-0.5" />
                                <span className="text-gray-600 dark:text-gray-400">{customer.notes}</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
                            <div className="text-xs text-gray-500">Toplam Fiyat</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</div>
                            <div className="text-xs text-gray-500">Tahsilat</div>
                        </div>
                    </div>
                </div>

                {/* Jobs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Jobs List */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                            <Briefcase size={18} className="text-indigo-500" />
                            İşler ({(customer.job || []).length})
                        </h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {(customer.job || []).length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">Henüz iş yok.</p>
                            ) : (customer.job || []).map(job => {
                                const paid = (job.payment || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
                                const remaining = parseFloat(job.total_price || 0) - paid
                                return (
                                    <Link key={job.id} to={`/jobs/${job.id}`} className="block p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-white truncate text-sm">{job.title}</div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{formatDate(job.start_date)} • {formatCurrency(job.total_price)}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: job.jobStatus?.color || '#94a3b8' }} />
                                                    <span className="text-[10px] font-black uppercase tracking-tight text-gray-700 dark:text-gray-300">
                                                        {job.jobStatus?.name || 'BELİRSİZ'}
                                                    </span>
                                                </div>
                                                {remaining > 0 && <span className="text-[10px] text-red-500 font-bold">{formatCurrency(remaining)} kalan</span>}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Appointments List */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                            <FileText size={18} className="text-indigo-500" />
                            Randevular ({(customer.appointment || []).length})
                        </h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {(customer.appointment || []).length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">Henüz randevu yok.</p>
                            ) : (customer.appointment || []).map(apt => (
                                <div key={apt.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-800/20">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">{apt.title}</div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 font-medium">
                                                <span>{formatDate(apt.startTime)}</span>
                                                <span>•</span>
                                                <span>{apt.startTime ? new Date(apt.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            </div>
                                            {apt.description && (
                                                <p className="text-xs text-gray-400 mt-2 italic leading-relaxed">{apt.description}</p>
                                            )}
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border ${apt.status === 'COMPLETED'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20'
                                            : apt.status === 'CANCELLED'
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-500/20'
                                                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/20'
                                            }`}>
                                            {apt.status === 'PENDING' ? 'BEKLİYOR' : apt.status === 'COMPLETED' ? 'TAMAMLANDI' : 'İPTAL'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
