import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { CreditCard, Plus, Trash2, Edit2, Search, FileText } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { useEffect } from 'react'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'
const paymentTypeLabel = { ADVANCE: 'Avans', PARTIAL: 'Taksit', FINAL: 'Final' }

const emptyForm = { amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '', jobId: '', cashRegisterId: '', receipt: null }

export default function PaymentsPage() {
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, payment: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()

    useEffect(() => {
        setCurrentPage(1)
    }, [search])

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
            toast.success(modal.payment ? 'Ödeme güncellendi.' : 'Ödeme eklendi.')
            setModal({ open: false, payment: null })
            setForm(emptyForm)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/payments/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['payments'])
            toast.success('Ödeme silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Ödeme silinemedi.')
            setDeleteConfirm(null)
        }
    })

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

    const handleDownload = async (payment) => {
        const toastId = toast.loading('Dekont indiriliyor...')
        try {
            const response = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            // Try to guess extension from content-type
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

    const totalPayments = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const filtered = payments.filter(p => {
        if (!search) return true;
        const s = search.toLowerCase();
        const jobTitle = p.job?.title?.toLowerCase() || 'genel';
        const desc = p.description?.toLowerCase() || '';
        return jobTitle.includes(s) || desc.includes(s);
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={24} className="text-emerald-500" />
                        Tahsilatlar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Toplam: {formatCurrency(totalPayments)}</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-500/25">
                    <Plus size={18} /> Tahsilat Ekle
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İş veya açıklama ara..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400" />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Tahsilat bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İş</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tutar</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tarih</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tip</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Kasa</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">{p.job?.title || 'Genel'}</div>
                                            {p.job?.customer ? (
                                                <div className="text-xs text-indigo-500 font-medium mt-0.5">{p.job.customer.name}</div>
                                            ) : (
                                                p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-base font-bold text-emerald-500">{formatCurrency(p.amount)}</span>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{formatDate(p.paymentDate || p.payment_date)}</td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{paymentTypeLabel[p.paymentType || p.payment_type] || '-'}</span>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{p.cash_register?.name || '-'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {p.receiptUrl && (
                                                    <button onClick={() => handleDownload(p)} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Dekontu İndir">
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                                <button onClick={() => openModal(p)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(p)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
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
            <Modal open={modal.open} onClose={() => setModal({ open: false, payment: null })} title={modal.payment ? 'Tahsilat Düzenle' : 'Tahsilat Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İş (İsteğe Bağlı)</label>
                        <select value={form.jobId} onChange={e => setForm(p => ({ ...p, jobId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                            <option value="">Genel Tahsilat</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.customer?.name})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar (₺) *</label>
                            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih *</label>
                            <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ödeme Tipi</label>
                            <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="ADVANCE">Avans</option>
                                <option value="PARTIAL">Taksit</option>
                                <option value="FINAL">Final</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kasa</label>
                            <select value={form.cashRegisterId} onChange={e => setForm(p => ({ ...p, cashRegisterId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                        <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dekont (Opsiyonel)</label>
                        <input type="file" onChange={e => setForm(p => ({ ...p, receipt: e.target.files[0] }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, payment: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Tahsilatı Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{formatCurrency(deleteConfirm?.amount)} tutarındaki tahsilatı silmek istediğinize emin misiniz?</p>
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
