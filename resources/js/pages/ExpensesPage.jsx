import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { TrendingDown, Plus, Trash2, Edit2, Search, FileText, Eye, Download } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { useEffect } from 'react'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'
const emptyForm = { title: '', amount: '', date: new Date().toISOString().substring(0, 10), description: '', jobId: '', categoryId: '', cashRegisterId: '', receipt: null }

export default function ExpensesPage() {
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, expense: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [preview, setPreview] = useState({ open: false, url: null, type: null, fileName: null })
    const itemsPerPage = 10
    const qc = useQueryClient()

    useEffect(() => {
        setCurrentPage(1)
    }, [search])

    const { data: expenses = [], isLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => api.get('/expenses').then(r => r.data) })
    const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => api.get('/jobs').then(r => r.data) })
    const { data: categories = [] } = useQuery({ queryKey: ['expense-categories'], queryFn: () => api.get('/settings/expense-categories').then(r => r.data) })
    const { data: cashRegisters = [] } = useQuery({ queryKey: ['cash-registers'], queryFn: () => api.get('/settings/cash-registers').then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                const value = form[key];
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            if (modal.expense) {
                formData.append('_method', 'PUT');
                return api.post(`/expenses/${modal.expense.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            return api.post('/expenses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            qc.invalidateQueries(['expenses'])
            toast.success(modal.expense ? 'Masraf güncellendi.' : 'Masraf eklendi.')
            setModal({ open: false, expense: null })
            setForm(emptyForm)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/expenses/${id}`),
        onSuccess: () => { qc.invalidateQueries(['expenses']); toast.success('Masraf silindi.'); setDeleteConfirm(null) },
        onError: (err) => { toast.error(err.response?.data?.message || 'Masraf silinemedi.'); setDeleteConfirm(null) }
    })

    const openModal = (expense = null) => {
        if (expense) {
            setForm({
                title: expense.title,
                amount: expense.amount,
                date: (expense.date || '').toString().substring(0, 10),
                description: expense.description || '',
                jobId: expense.jobId || expense.job_id || '',
                categoryId: expense.categoryId || expense.category_id || '',
                cashRegisterId: expense.cashRegisterId || expense.cash_register_id || '',
                receipt: null
            })
        } else {
            const defaultCash = cashRegisters.find(c => c.is_default);
            setForm({
                ...emptyForm,
                cashRegisterId: defaultCash ? defaultCash.id : '',
            })
        }
        setModal({ open: true, expense })
    }

    const handlePreview = async (expense) => {
        const toastId = toast.loading('Dekont yükleniyor...')
        try {
            const response = await api.get(`/expenses/${expense.id}/receipt`, { responseType: 'blob' })
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
                fileName: `dekont-${expense.id}.${ext}`
            })
            toast.dismiss(toastId)
        } catch (error) {
            console.error('Preview error:', error)
            toast.error('Dekont yüklenemedi.', { id: toastId })
        }
    }

    const handleDownload = async (expense = null) => {
        if (preview.open && preview.url) {
            const a = document.createElement('a')
            a.href = preview.url
            a.download = preview.fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            return;
        }

        if (!expense) return;

        const toastId = toast.loading('Dekont indiriliyor...')
        try {
            const response = await api.get(`/expenses/${expense.id}/receipt`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            const contentType = response.headers['content-type']
            let ext = 'jpg'
            if (contentType === 'application/pdf') ext = 'pdf'
            else if (contentType === 'image/png') ext = 'png'
            
            a.download = `dekont-${expense.id}.${ext}`
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

    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const filtered = expenses.filter(e => {
        if (!search) return true;
        const s = search.toLowerCase();
        const title = e.title?.toLowerCase() || '';
        const jobTitle = e.job?.title?.toLowerCase() || 'genel';
        return title.includes(s) || jobTitle.includes(s);
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingDown size={24} className="text-red-500" />
                        Masraflar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Toplam: {formatCurrency(totalExpenses)}</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-500/25">
                    <Plus size={18} /> Masraf Ekle
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Başlık veya iş ara..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400" />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center"><TrendingDown size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" /><p className="text-gray-500 dark:text-gray-400">Masraf bulunamadı.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Başlık</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tutar</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tarih</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Kategori</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">{e.title}</div>
                                            {e.job && <div className="text-xs text-gray-400 mt-0.5">{e.job.title}</div>}
                                        </td>
                                        <td className="px-5 py-4"><span className="text-base font-bold text-red-500">{formatCurrency(e.amount)}</span></td>
                                        <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{formatDate(e.date)}</td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            {e.category && <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">{e.category.name}</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {e.receipt_path && (
                                                    <>
                                                        <button onClick={() => handlePreview(e)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Dekontu Önizle">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleDownload(e)} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Dekontu İndir">
                                                            <Download size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => openModal(e)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(e)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
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

            <Modal open={modal.open} onClose={() => setModal({ open: false, expense: null })} title={modal.expense ? 'Masraf Düzenle' : 'Masraf Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık *</label>
                        <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar (₺) *</label>
                            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih *</label>
                            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İlgili İş</label>
                        <select value={form.jobId} onChange={e => setForm(p => ({ ...p, jobId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                            <option value="">İş Seçin (İsteğe Bağlı)</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dekont (Opsiyonel)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setForm(p => ({ ...p, receipt: e.target.files[0] }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, expense: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Masrafı Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.title}</span> masrafını silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal open={preview.open} onClose={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} title="Dekont Önizleme" size="xl">
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-200 dark:border-gray-700">
                        {preview.type?.includes('pdf') ? (
                            <iframe src={preview.url} className="w-full h-full border-none" title="PDF Preview" />
                        ) : preview.type?.includes('image') ? (
                            <img src={preview.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="Receipt Preview" />
                        ) : (
                            <div className="text-center p-12">
                                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">Bu dosya önizlenemiyor.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button 
                            onClick={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} 
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
        </div>
    )
}
