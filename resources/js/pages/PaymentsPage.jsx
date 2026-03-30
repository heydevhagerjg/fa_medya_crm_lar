import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { CreditCard, Plus, Trash2, Edit2, Search, FileText, Eye, Download, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'
const paymentTypeLabel = { ADVANCE: 'Avans', PARTIAL: 'Taksit', FINAL: 'Final' }
const formLabelClass = 'block text-sm font-medium theme-text-secondary mb-1'
const formInputClass = 'w-full px-3 py-2 border rounded-lg text-sm theme-input'

const emptyForm = { amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '', jobId: '', cashRegisterId: '', receipt: null }

export default function PaymentsPage() {
    // 1. State declarations
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, payment: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [preview, setPreview] = useState({ open: false, url: null, type: null, fileName: null })
    const itemsPerPage = 10
    const qc = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()

    // 2. useQuery hooks (MUST come before functions that use this data)
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: () => api.get('/payments').then(r => r.data),
    })

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(r => r.data),
    })

    const { data: cashRegisters = [] } = useQuery({
        queryKey: ['cash-registers'],
        queryFn: () => api.get('/settings/cash-registers').then(r => r.data),
    })

    // 3. Function definitions (now cashRegisters is available)
    const openModal = (payment = null) => {
        if (payment) {
            setForm({
                amount: payment.amount,
                paymentDate: (payment.paymentDate || payment.payment_date || '').toString().substring(0, 10),
                paymentType: payment.paymentType || payment.payment_type || 'FINAL',
                description: payment.description || '',
                jobId: payment.jobId || payment.job_id || '',
                cashRegisterId: payment.cashRegisterId || payment.cash_register_id || '',
                receipt: null
            })
        } else {
            const defaultCash = cashRegisters.find(c => c.is_default);
            setForm({
                ...emptyForm,
                cashRegisterId: defaultCash ? defaultCash.id : '',
            })
        }
        setModal({ open: true, payment })
    }

    const closeMainModal = () => {
        setModal({ open: false, payment: null })
        if (searchParams.has('id')) {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('id')
            setSearchParams(newParams, { replace: true })
        }
    }

    const handlePreview = async (payment) => {
        const toastId = toast.loading('Dekont yükleniyor...')
        try {
            const response = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'blob' })
            const contentType = response.headers['content-type']
            const blob = new Blob([response.data], { type: contentType })
            const url = window.URL.createObjectURL(blob)
            
            let ext = 'jpg'
            if (contentType === 'application/pdf') ext = 'pdf'
            else if (contentType === 'image/png') ext = 'png'
            
            setPreview({
                open: true,
                url,
                type: contentType,
                fileName: `dekont-${payment.id}.${ext}`
            })
            toast.dismiss(toastId)
        } catch (error) {
            console.error('Preview error:', error)
            toast.error('Dekont yüklenemedi.', { id: toastId })
        }
    }

    const handleDownload = async (payment = null) => {
        // If we have a preview open, download that URL
        if (preview.open && preview.url) {
            const a = document.createElement('a')
            a.href = preview.url
            a.download = preview.fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            return;
        }

        if (!payment) return;

        const toastId = toast.loading('Dekont indiriliyor...')
        try {
            const response = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            const contentType = response.headers['content-type']
            let ext = 'jpg'
            if (contentType === 'application/pdf') ext = 'pdf'
            else if (contentType === 'image/png') ext = 'png'
            
            a.download = `dekont-${payment.id}.${ext}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('İndirme başarılı.', { id: toastId })
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Dekont indirilemedi. Lütfen oturumunuzu kontrol edin.', { id: toastId })
        }
    }

    // 4. useMutation hooks
    const saveMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                const value = form[key];
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });
            
            if (modal.payment) {
                formData.append('_method', 'PUT');
                return api.post(`/payments/${modal.payment.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            return api.post('/payments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            qc.invalidateQueries(['payments'])
            qc.invalidateQueries(['dashboard-stats'])
            toast.success(modal.payment ? 'Ödeme güncellendi.' : 'Ödeme eklendi.')
            closeMainModal()
            setForm(emptyForm)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/payments/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['payments'])
            qc.invalidateQueries(['dashboard-stats'])
            toast.success('Ödeme silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Ödeme silinemedi.')
            setDeleteConfirm(null)
        }
    })

    // 5. useEffect hooks
    useEffect(() => {
        setCurrentPage(1)
    }, [search])

    useEffect(() => {
        const idParam = searchParams.get('id')
        if (idParam && payments.length > 0 && !modal.open) {
            const payment = payments.find(p => p.id.toString() === idParam)
            if (payment) openModal(payment)
        }
    }, [searchParams, payments])

    // 6. Derived data and render logic
    const totalPayments = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const filtered = payments.filter(p => {
        const searchLower = (search || '').toString().toLowerCase()
        const jobTitleMatch = (p.job?.title || 'genel').toString().toLowerCase().includes(searchLower)
        const descMatch = (p.description || '').toString().toLowerCase().includes(searchLower)
        return jobTitleMatch || descMatch
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <PageHeader
                title="Tahsilatlar"
                subtitle={`Toplam: ${formatCurrency(totalPayments)}`}
                icon={CreditCard}
                iconColor="text-emerald-500"
                actions={[
                    { label: 'Tahsilat Ekle', onClick: () => openModal(), icon: Plus, variant: 'primary' }
                ]}
                search={{ icon: Search, value: search, onChange: e => setSearch(e.target.value), placeholder: 'İş veya açıklama ara...' }}
                breadcrumbs={['Tahsilatlar']}
            />

            <div className="theme-surface border rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center theme-text-secondary">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard size={40} className="mx-auto theme-text-secondary opacity-50 mb-3" />
                        <p className="theme-text-secondary">Tahsilat bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full theme-table">
                            <thead>
                                <tr className="border-b theme-divider theme-surface-alt">
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">İş</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">Tutar</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider hidden md:table-cell">Tarih</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider hidden lg:table-cell">Tip</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider hidden lg:table-cell">Kasa</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold theme-text-secondary uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-divider">
                                {paginatedData.map(p => (
                                    <tr key={p.id} className="hover:bg-[var(--theme-bg-surface-alt)] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium theme-text-primary text-sm">{p.job?.title || 'Genel'}</div>
                                            {p.job?.customer ? (
                                                <div className="text-xs text-indigo-500 font-medium mt-0.5">{p.job.customer.name}</div>
                                            ) : (
                                                p.description && <div className="text-xs theme-text-secondary mt-0.5">{p.description}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-base font-bold text-emerald-500">{formatCurrency(p.amount)}</span>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell text-sm theme-text-secondary">{formatDate(p.paymentDate || p.payment_date)}</td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{paymentTypeLabel[p.paymentType || p.payment_type] || '-'}</span>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{p.cash_register?.name || '-'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {p.receiptUrl && (
                                                    <>
                                                        <button onClick={() => handlePreview(p)} className="p-2 rounded-lg theme-text-secondary hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Dekontu Önizle">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleDownload(p)} className="p-2 rounded-lg theme-text-secondary hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Dekontu İndir">
                                                            <Download size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => openModal(p)} className="p-2 rounded-lg theme-text-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(p)} className="p-2 rounded-lg theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {/* Modal */}
            <Modal open={modal.open} onClose={closeMainModal} title={modal.payment ? 'Tahsilat Düzenle' : 'Tahsilat Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className={formLabelClass}>İş (İsteğe Bağlı)</label>
                        <select value={form.jobId} onChange={e => setForm(p => ({ ...p, jobId: e.target.value }))} className={formInputClass}>
                            <option value="">Genel Tahsilat</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.customer?.name})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={formLabelClass}>Tutar (â‚º) *</label>
                            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className={formInputClass} />
                        </div>
                        <div>
                            <label className={formLabelClass}>Tarih *</label>
                            <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} required className={formInputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={formLabelClass}>Ödeme Tipi</label>
                            <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} className={formInputClass}>
                                <option value="ADVANCE">Avans</option>
                                <option value="PARTIAL">Taksit</option>
                                <option value="FINAL">Final</option>
                            </select>
                        </div>
                        <div>
                            <label className={formLabelClass}>Kasa</label>
                            <select value={form.cashRegisterId} onChange={e => setForm(p => ({ ...p, cashRegisterId: e.target.value }))} className={formInputClass}>
                                <option value="">Seçin...</option>
                                {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={formLabelClass}>Açıklama</label>
                        <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={formInputClass} />
                    </div>
                    <div>
                        <label className={formLabelClass}>Dekont (Opsiyonel)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setForm(p => ({ ...p, receipt: e.target.files[0] }))} className={formInputClass} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeMainModal} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Tahsilatı Sil">
                <div className="space-y-4">
                    <p className="theme-text-secondary">{formatCurrency(deleteConfirm?.amount)} tutarındaki tahsilatı silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal open={preview.open} onClose={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} title="Dekont Önizleme" size="xl">
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-1 theme-surface-alt rounded-xl overflow-hidden flex items-center justify-center relative border theme-divider">
                        {preview.type?.includes('pdf') ? (
                            <iframe src={preview.url} className="w-full h-full border-none" title="PDF Preview" />
                        ) : preview.type?.includes('image') ? (
                            <img src={preview.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="Receipt Preview" />
                        ) : (
                            <div className="text-center p-12">
                                <FileText size={48} className="mx-auto theme-text-secondary mb-4" />
                                <p className="theme-text-secondary">Bu dosya önizlenemiyor.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button 
                            onClick={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} 
                            className="px-6 py-2.5 border rounded-xl text-sm font-medium transition-colors theme-button-secondary"
                        >
                            Kapat
                        </button>
                        <button 
                            onClick={() => handleDownload()} 
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Download size={18} /> İndir
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    )
}

