import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'
import { formatPhoneNumber } from '../lib/utils'

import toast from 'react-hot-toast'
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, ChevronRight, X, Check, XCircle } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/index.js'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomersPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_customer_feature === false || user?.tenant?.plan_customer_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Müşteri" />
    }
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, customer: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()

    useEffect(() => {
        setCurrentPage(1)
    }, [search])

    const { data: customers = [], isLoading, error, isError } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(r => r.data),
        retry: false
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.customer
            ? api.put(`/customers/${modal.customer.id}`, data)
            : api.post('/customers', data),
        onSuccess: () => {
            qc.invalidateQueries(['customers'])
            toast.success(modal.customer ? 'Müşteri güncellendi.' : 'Müşteri eklendi.')
            closeModal()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/customers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['customers'])
            toast.success('Müşteri silindi.')
            setDeleteConfirm(null)
        },
        onError: () => toast.error('Silinemedi.'),
    })

    const openModal = (customer = null) => {
        setForm(customer ? { name: customer.name, phone: customer.phone || '', email: customer.email || '', notes: customer.notes || '' } : emptyForm)
        setModal({ open: true, customer })
    }

    const closeModal = () => {
        setModal({ open: false, customer: null })
        setForm(emptyForm)
    }

    const filtered = customers
        .filter(c => {
            const low = search.toLowerCase();
            const clean = search.replace(/\D/g, '');
            return c.name.toLowerCase().includes(low) || 
                   c.email?.toLowerCase().includes(low) || 
                   (c.phone && c.phone.includes(clean)) || 
                   (c.phone && formatPhoneNumber(c.phone).includes(search));
        })
        .sort((a, b) => b.id - a.id)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={24} className="text-indigo-500" />
                        Müşteriler
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{customers.length} müşteri</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
                >
                    <Plus size={18} /> Müşteri Ekle
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="İsim, telefon veya e-posta ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : isError ? (
                    <div className="p-12 text-center text-gray-500">
                        {error?.response?.status === 403 ? (
                            <PlanRestrictionView featureName="Müşteri" />
                        ) : (
                            <>
                                <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                                <p>Veriler yüklenemedi. Oturumunuz kapanmış olabilir, lütfen sayfayı yenileyiniz.</p>
                            </>
                        )}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{search ? 'Aramayla eşleşen müşteri bulunamadı.' : 'Henüz müşteri yok.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Müşteri</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">İletişim</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">İş Sayısı</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link to={`/customers/${customer.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-500 transition-colors">
                                                        {customer.name}
                                                    </Link>
                                                    {customer.notes && <div className="text-xs text-gray-400 truncate max-w-xs">{customer.notes}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <div className="space-y-1">
                                                {customer.phone && <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Phone size={12} />{formatPhoneNumber(customer.phone)}</div>}

                                                {customer.email && <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Mail size={12} />{customer.email}</div>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                                                {customer._count?.job || 0} iş
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/customers/${customer.id}`} className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Detay">
                                                    <ChevronRight size={16} />
                                                </Link>
                                                <button onClick={() => openModal(customer)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Düzenle">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(customer)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Sil">
                                                    <Trash2 size={16} />
                                                </button>
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

            {/* Add/Edit Modal */}
            <Modal open={modal.open} onClose={closeModal} title={modal.customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}>
                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    {[
                        { key: 'name', label: 'Ad Soyad *', required: true, type: 'text' },
                        { key: 'phone', label: 'Telefon', type: 'tel' },
                        { key: 'email', label: 'E-posta', type: 'email' },
                    ].map(({ key, label, required, type }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                            <input
                                type={type}
                                value={key === 'phone' ? formatPhoneNumber(form[key]) : (form[key] || '')}
                                onChange={e => {
                                    let val = e.target.value;
                                    if (key === 'phone') {
                                        // Store cleaned numeric value in state
                                        val = val.replace(/\D/g, '');
                                        // If it starts with 0 and they are typing, we might want to keep it or clean it
                                        // Our formatPhoneNumber handles 05... -> 905...
                                        if (val.length > 12) val = val.substring(0, 12);
                                    }
                                    setForm(p => ({ ...p, [key]: val }));
                                }}
                                required={required}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notlar</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Müşteriyi Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.name}</span> isimli müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
