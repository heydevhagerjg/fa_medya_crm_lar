import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Briefcase, Plus, Search, Edit2, Trash2, ChevronRight, Filter, Calendar } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { useEffect } from 'react'

const statusConfig = {
    PENDING: { label: 'Bekliyor', color: 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: 'text-blue-500 bg-blue-500/10 border border-blue-500/20' },
    COMPLETED: { label: 'Tamamlandı', color: 'text-green-500 bg-green-500/10 border border-green-500/20' },
    CANCELLED: { label: 'İptal', color: 'text-red-500 bg-red-500/10 border border-red-500/20' },
}

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function JobsPage() {
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [modal, setModal] = useState({ open: false, job: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [form, setForm] = useState({})
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()
    const navigate = useNavigate()

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filterStatus])

    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(r => r.data),
    })

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(r => r.data),
    })

    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: () => api.get('/settings/services').then(r => r.data),
    })

    const { data: statuses = [] } = useQuery({
        queryKey: ['job-statuses'],
        queryFn: () => api.get('/settings/statuses').then(r => r.data),
    })

    const openModal = (job = null) => {
        setForm(job ? {
            customerId: job.customerId || job.customer_id,
            serviceId: job.serviceId || job.service_id || '',
            jobStatusId: job.jobStatusId || job.job_status_id || '',
            title: job.title,
            description: job.description || '',
            status: job.status || 'PENDING',
            totalPrice: job.totalPrice || job.total_price || 0,
            startDate: job.startDate || job.start_date ? (job.startDate || job.start_date).toString().substring(0, 10) : '',
            endDate: job.endDate || job.end_date ? (job.endDate || job.end_date).toString().substring(0, 10) : '',
            customFields: job.customfieldvalue ? Object.fromEntries(job.customfieldvalue.map(cf => [cf.custom_field_id, cf.value])) : {}
        } : {
            customerId: customers[0]?.id || '',
            serviceId: '',
            jobStatusId: '',
            title: '',
            description: '',
            status: 'PENDING',
            totalPrice: 0,
            startDate: new Date().toISOString().substring(0, 10),
            endDate: '',
            customFields: {}
        })
        setModal({ open: true, job })
    }

    const saveMutation = useMutation({
        mutationFn: (data) => modal.job
            ? api.put(`/jobs/${modal.job.id}`, data)
            : api.post('/jobs', data),
        onSuccess: () => {
            qc.invalidateQueries(['jobs'])
            toast.success(modal.job ? 'İş güncellendi.' : 'İş eklendi.')
            setModal({ open: false, job: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/jobs/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['jobs'])
            toast.success('İş silindi.')
            setDeleteConfirm(null)
        },
    })

    const filtered = jobs.filter(j => {
        const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) || j.customer?.name?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || j.status === filterStatus
        return matchSearch && matchStatus
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase size={24} className="text-indigo-500" />
                        İşler
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{jobs.length} iş</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
                    <Plus size={18} /> Yeni İş
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İş veya müşteri ara..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500">
                    <option value="">Tüm Durumlar</option>
                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Status summary */}
            <div className="flex gap-2 flex-wrap">
                {Object.entries(statusConfig).map(([k, v]) => {
                    const count = jobs.filter(j => j.status === k).length
                    return (
                        <button key={k} onClick={() => setFilterStatus(filterStatus === k ? '' : k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === k ? v.color : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                        >
                            {v.label}: {count}
                        </button>
                    )
                })}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Briefcase size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">İş bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İş</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Müşteri</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fiyat</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(job => {
                                    const statusConf = statusConfig[job.status] || statusConfig.PENDING
                                    const customStatus = statuses.find(s => s.id === (job.jobStatusId || job.job_status_id))
                                    return (
                                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-5 py-4">
                                                <Link to={`/jobs/${job.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-500 transition-colors block">{job.title}</Link>
                                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                    <Calendar size={10} />
                                                    {formatDate(job.startDate || job.start_date)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <Link to={`/customers/${job.customerId || job.customer_id}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">{job.customer?.name || '-'}</Link>
                                            </td>
                                            <td className="px-5 py-4 hidden lg:table-cell">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(job.totalPrice || job.total_price)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-lg inline-flex w-fit ${statusConf.color}`}>{statusConf.label}</span>
                                                    {customStatus && (
                                                        <span className="text-xs px-2 py-0.5 rounded-md inline-flex w-fit" style={{ background: customStatus.color + '20', color: customStatus.color, border: `1px solid ${customStatus.color}40` }}>{customStatus.name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/jobs/${job.id}`} className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"><ChevronRight size={16} /></Link>
                                                    <button onClick={() => openModal(job)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => setDeleteConfirm(job)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal open={modal.open} onClose={() => setModal({ open: false, job: null })} title={modal.job ? 'İş Düzenle' : 'Yeni İş'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık *</label>
                            <input type="text" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Müşteri *</label>
                            <select value={form.customerId || ''} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hizmet</label>
                            <select value={form.serviceId || ''} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                            <select value={form.status || 'PENDING'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İş Durumu</label>
                            <select value={form.jobStatusId || ''} onChange={e => setForm(p => ({ ...p, jobStatusId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toplam Fiyat (₺)</label>
                            <input type="number" min="0" step="0.01" value={form.totalPrice || 0} onChange={e => setForm(p => ({ ...p, totalPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
                            <input type="date" value={form.startDate || ''} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
                            <input type="date" value={form.endDate || ''} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                            <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                        </div>
                        {services.find(s => s.id == form.serviceId)?.customfield?.map(cf => (
                            <div key={cf.id} className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{cf.label} {cf.required ? '*' : ''}</label>
                                {cf.type === 'textarea' ? (
                                    <textarea value={form.customFields?.[cf.id] || ''} onChange={e => setForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: e.target.value } }))} required={cf.required} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                                ) : (
                                    <input type={cf.type || 'text'} value={form.customFields?.[cf.id] || ''} onChange={e => setForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: e.target.value } }))} required={cf.required} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, job: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="İşi Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.title}</span> işini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    )
}
