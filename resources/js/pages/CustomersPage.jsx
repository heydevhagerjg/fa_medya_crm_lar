import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'
import { formatPhoneNumber } from '../lib/utils'

import toast from 'react-hot-toast'
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, ChevronRight, X, Check, XCircle } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/index.js'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomersPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_customer_feature === false || user?.tenant?.plan_customer_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="MÃ¼ÅŸteri" />
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
            toast.success(modal.customer ? 'MÃ¼ÅŸteri gÃ¼ncellendi.' : 'MÃ¼ÅŸteri eklendi.')
            closeModal()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluÅŸtu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/customers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['customers'])
            toast.success('MÃ¼ÅŸteri silindi.')
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
            const low = (search || '').toString().toLowerCase();
            const clean = (search || '').toString().replace(/\D/g, '');
            const nameMatch = (c.name || '').toString().toLowerCase().includes(low);
            const emailMatch = (c.email || '').toString().toLowerCase().includes(low);
            const phoneMatch = (c.phone || '').toString().includes(clean);
            const phoneFormatMatch = (c.phone || '').toString().includes(search);
            return nameMatch || emailMatch || phoneMatch || phoneFormatMatch;
        })
        .sort((a, b) => b.id - a.id)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <PageHeader
                title="MÃ¼ÅŸteriler"
                subtitle={`${customers.length} mÃ¼ÅŸteri`}
                icon={Users}
                iconColor="text-indigo-500"
                actions={[
                    { label: 'MÃ¼ÅŸteri Ekle', onClick: () => openModal(), icon: Plus, variant: 'primary' }
                ]}
                search={{ icon: Search, value: search, onChange: e => setSearch(e.target.value), placeholder: 'Ä°sim, telefon veya e-posta ara...' }}
                breadcrumbs={[`MÃ¼ÅŸteriler (${customers.length} KayÄ±tlÄ± Veri)`]}
            />

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">YÃ¼kleniyor...</div>
                ) : isError ? (
                    <div className="p-12 text-center text-gray-500">
                        {error?.response?.status === 403 ? (
                            <PlanRestrictionView featureName="MÃ¼ÅŸteri" />
                        ) : (
                            <>
                                <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                                <p>Veriler yÃ¼klenemedi. Oturumunuz kapanmÄ±ÅŸ olabilir, lÃ¼tfen sayfayÄ± yenileyiniz.</p>
                            </>
                        )}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{search ? 'Aramayla eÅŸleÅŸen mÃ¼ÅŸteri bulunamadÄ±.' : 'HenÃ¼z mÃ¼ÅŸteri yok.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full theme-table">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MÃ¼ÅŸteri</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Ä°letiÅŸim</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Ä°ÅŸ SayÄ±sÄ±</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ä°ÅŸlem</th>
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
                                                {customer._count?.job || 0} iÅŸ
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/customers/${customer.id}`} className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Detay">
                                                    <ChevronRight size={16} />
                                                </Link>
                                                <button onClick={() => openModal(customer)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="DÃ¼zenle">
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
            <Modal open={modal.open} onClose={closeModal} title={modal.customer ? 'MÃ¼ÅŸteri DÃ¼zenle' : 'Yeni MÃ¼ÅŸteri'}>
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
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ä°ptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="MÃ¼ÅŸteriyi Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.name}</span> isimli mÃ¼ÅŸteriyi silmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ä°ptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

