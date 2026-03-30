import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2, Edit2, Search, Calendar, User, FolderOpen, History, CheckCircle2, XCircle, Ban, Play } from 'lucide-react'
import { useAuthStore } from '../stores/index.js'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'

const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'
const formatDateTime = (val) => val ? new Date(val).toLocaleString('tr-TR') : '-'
const periodUnitLabel = { day: 'Günlük', week: 'Haftalık', month: 'Aylık', year: 'Yıllık' }
const formLabelClass = 'block text-sm font-medium theme-text-secondary mb-1'
const formInputClass = 'w-full px-3 py-2 border rounded-lg text-sm theme-input'
const tinyLabelClass = 'block text-xs font-semibold theme-text-secondary mb-1 uppercase tracking-wider'

const emptyForm = {
    category_id: '',
    customer_id: '',
    job_id: '',
    title: '',
    description: '',
    period: 1,
    period_unit: 'year',
    start_date: new Date().toISOString().substring(0, 10)
}

export default function ServiceTrackingPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_service_tracking_feature === false || user?.tenant?.plan_service_tracking_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Hizmet Takibi" />
    }

    // ===== STATE DECLARATIONS =====
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, tracking: null })
    const [historyModal, setHistoryModal] = useState({ open: false, tracking: null, logs: [] })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [cancelConfirm, setCancelConfirm] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState('active')
    const itemsPerPage = 10
    const qc = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()

    // ===== REGULAR FUNCTIONS =====
    const openModal = (tracking = null) => {
        setForm(tracking ? {
            category_id: tracking.category_id || '',
            customer_id: tracking.customer_id || '',
            job_id: tracking.job_id || '',
            title: tracking.title || '',
            description: tracking.description || '',
            period: tracking.period || 1,
            period_unit: tracking.period_unit || 'month',
            start_date: tracking.start_date ? new Date(tracking.start_date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        } : emptyForm)
        setModal({ open: true, tracking })
    }

    const closeMainModal = () => {
        setModal({ open: false, tracking: null })
        if (searchParams.has('id')) {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('id')
            setSearchParams(newParams, { replace: true })
        }
    }

    const openHistory = async (tracking) => {
        try {
            const res = await api.get(`/service-trackings/${tracking.id}/logs`)
            setHistoryModal({ open: true, tracking, logs: res.data })
        } catch (err) {
            toast.error('Geçmiş yüklenemedi.')
        }
    }

    const isDelayed = (date) => {
        if (!date) return false
        return new Date(date) < new Date().setHours(0, 0, 0, 0)
    }

    const isFuture = (date) => {
        if (!date) return false
        return new Date(date) > new Date().setHours(23, 59, 59, 999)
    }

    const canProcessDate = (date, period, unit) => {
        if (!date) return false
        const nextDt = new Date(date)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        // Past or today is always allowed
        if (nextDt <= todayEnd) return true

        // Future dates must be within 1 cycle from "today"
        const limit = new Date()
        const p = parseInt(period) || 1
        if (unit === 'day') limit.setDate(limit.getDate() + p)
        else if (unit === 'week') limit.setDate(limit.getDate() + (p * 7))
        else if (unit === 'month') limit.setMonth(limit.getMonth() + p)
        else if (unit === 'year') limit.setFullYear(limit.getFullYear() + p)
        limit.setHours(23, 59, 59, 999)

        return nextDt <= limit
    }

    // ===== QUERY HOOKS =====
    const { data: trackings = [], isLoading, error, isError } = useQuery({
        queryKey: ['service-trackings', statusFilter],
        queryFn: () => api.get('/service-trackings', { params: { status: statusFilter } }).then(r => r.data),
        retry: false
    })

    const { data: categories = [] } = useQuery({
        queryKey: ['service-tracking-categories'],
        queryFn: () => api.get('/settings/service-tracking-categories').then(r => r.data),
    })

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(r => r.data),
    })

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(r => r.data),
    })

    // ===== MUTATION HOOKS =====
    const saveMutation = useMutation({
        mutationFn: () => modal.tracking
            ? api.put(`/service-trackings/${modal.tracking.id}`, form)
            : api.post('/service-trackings', form),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success(modal.tracking ? 'Takip güncellendi.' : 'Takip eklendi.')
            closeMainModal()
            setForm(emptyForm)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/service-trackings/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success('Takip silindi.')
            setDeleteConfirm(null)
        },
    })

    const completeMutation = useMutation({
        mutationFn: ({ id, date, status }) => api.post(`/service-trackings/${id}/complete`, { planned_date: date, status: status || 'completed' }),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success('İşlem kaydedildi.')
        },
    })

    const catchUpMutation = useMutation({
        mutationFn: (id) => api.post(`/service-trackings/${id}/catch-up`),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success('Tüm gecikmiş kayıtlar atlandı ve güncele getirildi.')
        },
    })

    const updateLogStatusMutation = useMutation({
        mutationFn: ({ logId, status }) => api.put(`/service-tracking-logs/${logId}/status`, { status }),
        onSuccess: (res, variables) => {
            // Update the logs in historyModal state without a full fetch if possible, 
            // but for simplicity let's just refresh if we have the tracking id
            if (historyModal.tracking) {
                openHistory(historyModal.tracking)
            }
            toast.success('İşlem durumu güncellendi.')
        },
    })

    const cancelMutation = useMutation({
        mutationFn: (id) => api.post(`/service-trackings/${id}/cancel`),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success('Hizmet takibi iptal edildi.')
            setCancelConfirm(null)
        },
    })

    const activateMutation = useMutation({
        mutationFn: (id) => api.post(`/service-trackings/${id}/activate`),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            toast.success('Hizmet takibi tekrar aktifleştirildi.')
        },
    })

    const deleteLogMutation = useMutation({
        mutationFn: (logId) => api.delete(`/service-tracking-logs/${logId}`),
        onSuccess: () => {
            qc.invalidateQueries(['service-trackings'])
            if (historyModal.tracking) {
                openHistory(historyModal.tracking)
            }
            toast.success('Hizmet kaydı silindi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    // ===== EFFECT HOOKS =====
    useEffect(() => {
        setCurrentPage(1)
    }, [search, statusFilter])

    useEffect(() => {
        const idParam = searchParams.get('id')
        if (idParam && trackings.length > 0 && !modal.open) {
            const tracking = trackings.find(t => t.id.toString() === idParam)
            if (tracking) openModal(tracking)
        }
    }, [searchParams, trackings])

    // ===== DERIVED DATA =====
    const filtered = trackings.filter(t => {
        const searchLower = (search || '').toString().toLowerCase()
        const titleMatch = (t.title || '').toString().toLowerCase().includes(searchLower)
        const customerMatch = (t.customer?.name || '').toString().toLowerCase().includes(searchLower)
        const jobTitleMatch = (t.job?.title || '').toString().toLowerCase().includes(searchLower)
        const jobCustomerMatch = (t.job?.customer?.name || '').toString().toLowerCase().includes(searchLower)
        const categoryMatch = (t.category?.name || '').toString().toLowerCase().includes(searchLower)

        return titleMatch || customerMatch || jobTitleMatch || jobCustomerMatch || categoryMatch
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <PageHeader
                title="Hizmet Takibi"
                subtitle="Hizmet periyotlarını ve hatırlatmaları yönetin."
                icon={Clock}
                iconColor="text-indigo-500"
                actions={[
                    { label: 'Yeni Takip Ekle', onClick: () => openModal(), icon: Plus, variant: 'primary' }
                ]}
                search={{ icon: Search, value: search, onChange: e => setSearch(e.target.value), placeholder: 'Başlık, müşteri veya kategori ara...' }}
                breadcrumbs={['Hizmet Takibi']}
            >
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border rounded-xl text-sm min-w-[150px] theme-input"
                >
                    <option value="active">Sadece Aktifler</option>
                    <option value="cancelled">İptal Edilenler</option>
                    <option value="all">Tümü</option>
                </select>
            </PageHeader>

            <div className="theme-surface border rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8 text-center theme-text-secondary">Yükleniyor...</div>
                ) : isError ? (
                    <div className="p-12 text-center theme-text-secondary">
                        {error?.response?.status === 403 ? (
                            <PlanRestrictionView featureName="Hizmet Takibi" />
                        ) : (
                            <>
                                <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                                <p>Veriler yüklenemedi. Oturumunuz kapanmış olabilir, lütfen sayfayı yenileyiniz.</p>
                            </>
                        )}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock size={40} className="mx-auto theme-text-secondary opacity-50 mb-3" />
                        <p className="theme-text-secondary">Takip edilecek hizmet bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full theme-table">
                            <thead>
                                <tr className="border-b theme-divider theme-surface-alt">
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">Hizmet / Müşteri</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">Kategori</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">Döngü</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">Gelecek İşlem Tarihi</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-divider">
                                {paginatedData.map(t => {
                                    const delayed = isDelayed(t.next_date)
                                    const missedCount = t.missed_dates?.length || 0

                                    return (
                                        <tr key={t.id} className={`hover:bg-[var(--theme-bg-surface-alt)] transition-colors ${delayed ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="font-medium theme-text-primary text-sm">{t.title}</div>
                                                {(t.customer || t.job) && (
                                                    <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium mt-0.5">
                                                        <User size={12} />
                                                        {t.job ? `${t.job.title} / ${t.job.customer?.name || 'Bilinmiyor'}` : t.customer?.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs px-2.5 py-1 rounded-lg theme-muted-badge font-medium border theme-divider">
                                                    {t.category?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-sm theme-text-secondary">
                                                    {t.period} {periodUnitLabel[t.period_unit]}
                                                </div>
                                                {t.status === 'cancelled' && (
                                                    <span className="text-[10px] text-orange-500 font-bold uppercase mt-1 block">İptal Edildi</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${delayed ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                        <Calendar size={14} />
                                                        {formatDate(t.next_date)}
                                                    </div>
                                                    {missedCount > 0 && (
                                                        <div
                                                            title={`Gecikmiş Tarihler:\n${t.missed_dates.map(d => formatDate(d)).join('\n')}`}
                                                            className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded inline-block font-bold cursor-help"
                                                        >
                                                            {missedCount} GECİKMİÅ DÖNGÜ
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(t.status === 'active' || !t.status) && (
                                                        delayed ? (
                                                            <>
                                                                <button onClick={() => completeMutation.mutate({ id: t.id, date: t.next_date, status: 'completed' })} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-green-500/20">
                                                                    <CheckCircle2 size={12} /> YAPILDI
                                                                </button>
                                                                <button onClick={() => completeMutation.mutate({ id: t.id, date: t.next_date, status: 'skipped' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-red-500/20">
                                                                    <XCircle size={12} /> YAPILMADI
                                                                </button>
                                                                <button onClick={() => catchUpMutation.mutate(t.id)} className="px-3 py-1.5 theme-button-secondary text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md">
                                                                    GÜNCELE GETİR
                                                                </button>
                                                            </>
                                                        ) : canProcessDate(t.next_date, t.period, t.period_unit) && (
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => completeMutation.mutate({ id: t.id, date: t.next_date, status: 'completed' })} className="p-2 rounded-lg theme-text-secondary hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors" title={isFuture(t.next_date) ? "Gelecek Hizmeti Åimdiden Yapıldı Olarak İşaretle" : "Hizmet Yapıldı"}><CheckCircle2 size={16} /></button>
                                                                <button onClick={() => completeMutation.mutate({ id: t.id, date: t.next_date, status: 'skipped' })} className="p-2 rounded-lg theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title={isFuture(t.next_date) ? "Gelecek Hizmeti Åimdiden Yapılmadı Olarak İşaretle" : "Hizmet Yapılmadı"}><XCircle size={16} /></button>
                                                            </div>
                                                        )
                                                    )}
                                                    <button onClick={() => openHistory(t)} className="p-2 rounded-lg theme-text-secondary hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-green-500/10 transition-colors" title="Geçmiş"><History size={16} /></button>
                                                    <button onClick={() => openModal(t)} className="p-2 rounded-lg theme-text-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Düzenle"><Edit2 size={16} /></button>
                                                    {t.status === 'cancelled' ? (
                                                        <button onClick={() => activateMutation.mutate(t.id)} className="p-2 rounded-lg theme-text-secondary hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors" title="Takibi Tekrar Başlat (Aktifleştir)"><Play size={16} /></button>
                                                    ) : (
                                                        <button onClick={() => setCancelConfirm(t)} className="p-2 rounded-lg theme-text-secondary hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Takibi İptal Et (Durdur)"><Ban size={16} /></button>
                                                    )}
                                                    <button onClick={() => setDeleteConfirm(t)} className="p-2 rounded-lg theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Sil"><Trash2 size={16} /></button>
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
                            totalItems={filtered.length}
                        />
                    </div>
                )}
            </div>


            {/* Save/Edit Modal */}
            <Modal open={modal.open} onClose={closeMainModal} title={modal.tracking ? 'Hizmet Takibi Düzenle' : 'Yeni Hizmet Takibi'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={formLabelClass}>Hizmet Takip Kategorisi *</label>
                            <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required className={formInputClass}>
                                <option value="">Kategori Seçin...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={formLabelClass}>
                                Müşteri (İsteğe Bağlı)
                            </label>
                            <select
                                value={form.customer_id}
                                onChange={e => setForm(p => ({ ...p, customer_id: e.target.value, job_id: '' }))}
                                className={formInputClass}
                            >
                                <option value="">Genel Takip / Müşteri Seçin...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={formLabelClass}>İş Seçimi (İsteğe Bağlı)</label>
                            <select value={form.job_id} onChange={e => {
                                const jobId = e.target.value
                                const selectedJob = jobs.find(j => j.id == jobId)
                                setForm(p => ({
                                    ...p,
                                    job_id: jobId,
                                    customer_id: selectedJob?.customerId || p.customer_id
                                }))
                            }} className={formInputClass}>
                                <option value="">İş Seçin...</option>
                                {jobs.filter(j => !form.customer_id || j.customerId == form.customer_id).map(j => (
                                    <option key={j.id} value={j.id}>{j.title} ({j.customer?.name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={formLabelClass}>Başlık *</label>
                        <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Örn: Klima Bakımı" className={formInputClass} />
                    </div>

                    <div>
                        <label className={formLabelClass}>Açıklama</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={formInputClass} placeholder="Takip detayı..." />
                    </div>

                    <div className="theme-surface-alt p-4 rounded-xl border theme-divider space-y-4">
                        <div className="text-sm font-bold theme-text-primary flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" />
                            Döngü Ayarları
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={tinyLabelClass}>Periyot (Sayı)</label>
                                <input type="number" min="1" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} required className={formInputClass} />
                            </div>
                            <div>
                                <label className={tinyLabelClass}>Zaman Birimi</label>
                                <select value={form.period_unit} onChange={e => setForm(p => ({ ...p, period_unit: e.target.value }))} required className={formInputClass}>
                                    <option value="day">Gün</option>
                                    <option value="week">Hafta</option>
                                    <option value="month">Ay</option>
                                    <option value="year">Yıl</option>
                                </select>
                            </div>
                            <div>
                                <label className={tinyLabelClass}>Başlangıç Tarihi</label>
                                <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required className={formInputClass} />
                            </div>
                        </div>
                        <div className="text-xs text-indigo-500 font-medium italic">
                            * Takip her {form.period} {periodUnitLabel[form.period_unit]?.toLowerCase()}da bir çalışacaktır.
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeMainModal} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* History Modal */}
            <Modal open={historyModal.open} onClose={() => setHistoryModal({ open: false, tracking: null, logs: [] })} title={`${historyModal.tracking?.title} - Hizmet Geçmişi`} size="xl">
                <div className="space-y-4">
                    {historyModal.tracking?.status === 'cancelled' && (
                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl p-3 flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xs font-medium">
                            <Ban size={16} />
                            Bu takip iptal edildiği için geçmiş verileri düzenlenemez.
                        </div>
                    )}
                    {historyModal.logs.length === 0 ? (
                        <div className="p-8 text-center theme-text-secondary">Henüz bir işlem kaydı bulunmuyor.</div>
                    ) : (
                        <div className="overflow-hidden border theme-divider rounded-xl">
                            <table className="w-full text-sm theme-table">
                                <thead className="theme-surface-alt theme-text-secondary">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold">Planlanan Tarih</th>
                                        <th className="px-4 py-2 text-left font-semibold">İşlem Tarihi</th>
                                        <th className="px-4 py-2 text-left font-semibold">Durum</th>
                                        <th className="px-4 py-2 text-left font-semibold">Notlar</th>
                                        <th className="px-4 py-2 text-right font-semibold">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y theme-divider">
                                    {historyModal.logs.map((log, index) => (
                                        <tr key={log.id} className="theme-surface">
                                            <td className="px-4 py-3 font-medium theme-text-primary">{formatDate(log.planned_date)}</td>
                                            <td className="px-4 py-3 theme-text-secondary">{formatDateTime(log.completed_at)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => updateLogStatusMutation.mutate({ logId: log.id, status: log.status === 'completed' ? 'skipped' : 'completed' })}
                                                    disabled={updateLogStatusMutation.isPending || historyModal.tracking?.status === 'cancelled'}
                                                    className={`flex items-center gap-1 font-bold text-[11px] px-2 py-1 rounded transition-colors ${historyModal.tracking?.status === 'cancelled'
                                                        ? 'theme-text-secondary cursor-not-allowed opacity-60'
                                                        : log.status === 'completed'
                                                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                            : 'theme-text-secondary hover:bg-[var(--theme-bg-surface-alt)]'
                                                        }`}
                                                >
                                                    {log.status === 'completed' ? (
                                                        <><CheckCircle2 size={14} /> YAPILDI</>
                                                    ) : (
                                                        <><XCircle size={14} /> ATLANDI</>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 theme-text-secondary text-xs italic">{log.notes || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {historyModal.tracking?.status !== 'cancelled' && index === 0 && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Bu son işlem kaydını silmek ve takvimi geri almak istediğinize emin misiniz?')) {
                                                                deleteLogMutation.mutate(log.id)
                                                            }
                                                        }}
                                                        disabled={deleteLogMutation.isPending}
                                                        className="p-1.5 theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Bu Kaydı Sil ve Geri Al"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button onClick={() => setHistoryModal({ open: false, tracking: null, logs: [] })} className="w-full py-2.5 rounded-xl text-sm font-medium theme-button-secondary">Kapat</button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hizmet Takibini Sil">
                <div className="space-y-4">
                    <p className="theme-text-secondary"><span className="font-semibold theme-text-primary">{deleteConfirm?.title}</span> takibini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Cancel Modal */}
            <Modal open={!!cancelConfirm} onClose={() => setCancelConfirm(null)} title="Takibi İptal Et (Durdur)">
                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>Dikkat:</strong> Bu işlemi yaptığınızda hizmet takibi durdurulacak ve listeden kaldırılacaktır. Geçmiş kayıtlar saklanmaya devam eder.
                        </p>
                    </div>
                    <p className="theme-text-secondary"><span className="font-semibold theme-text-primary">{cancelConfirm?.title}</span> takibini komple iptal etmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setCancelConfirm(null)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary">Vazgeç</button>
                        <button onClick={() => cancelMutation.mutate(cancelConfirm.id)} disabled={cancelMutation.isPending} className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50">
                            {cancelMutation.isPending ? 'İptal Ediliyor...' : 'Evet, Takibi Durdur'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

