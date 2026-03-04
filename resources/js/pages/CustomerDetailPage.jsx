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
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <Briefcase size={18} className="text-indigo-500" />
                        İşler ({(customer.job || []).length})
                    </h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {(customer.job || []).length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Henüz iş yok.</p>
                        ) : (customer.job || []).map(job => {
                            const paid = (job.payment || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
                            const remaining = parseFloat(job.total_price || 0) - paid
                            return (
                                <Link key={job.id} to={`/jobs/${job.id}`} className="block p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 dark:text-white truncate">{job.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{formatDate(job.start_date)} • {formatCurrency(job.total_price)}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.jobStatus?.color || '#94a3b8' }} />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {job.jobStatus?.name || 'Aşama Belirtilmemiş'}
                                                </span>
                                            </div>
                                            {remaining > 0 && <span className="text-xs text-red-500">{formatCurrency(remaining)} kalan</span>}
                                        </div>
                                    </div>
                                    {(job.jobstep || []).length > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                <span>İlerleme</span>
                                                <span>{job.jobstep.filter(s => s.is_completed).length}/{job.jobstep.length}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${(job.jobstep.filter(s => s.is_completed).length / job.jobstep.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
