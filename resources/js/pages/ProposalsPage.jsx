import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import {
    FileText, Plus, Search, Edit2, Trash2, Send,
    MoreHorizontal, Check, X, Clock, PlusCircle, Link,
    RotateCcw, MessageSquare, CheckCircle, XCircle, Download
} from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Pagination from '../components/ui/Pagination.jsx'

const statuses = {
    'DRAFT': { label: 'Taslak', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    'SENT': { label: 'Gönderildi', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    'ACCEPTED': { label: 'Kabul Edildi', color: 'bg-green-100 text-green-600 border-green-200' },
    'REJECTED': { label: 'Reddedildi', color: 'bg-red-100 text-red-600 border-red-200' },
    'REVISION_REQUESTED': { label: 'Revize İstendi', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    'CANCELLED': { label: 'İptal Edildi', color: 'bg-red-50 text-red-500 border-red-100' },
    'RENEWAL_REQUESTED': { label: 'Yenileme Talebi', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
}

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function ProposalsPage() {
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [modal, setModal] = useState({ open: false, proposal: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [revisionModal, setRevisionModal] = useState({ open: false, proposal: null })
    const [form, setForm] = useState({
        customer_id: '',
        service_id: '',
        title: '',
        description: '',
        valid_until: '',
        items: [{ description: '', quantity: 1, unit_price: 0 }],
        installments: [],
        is_vat_included: false,
        vat_rate: 20
    })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()

    const { data: proposals = [], isLoading } = useQuery({
        queryKey: ['proposals'],
        queryFn: () => api.get('/proposals').then(r => r.data),
    })

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(r => r.data),
    })

    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: () => api.get('/settings/services').then(r => r.data),
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.proposal
            ? api.put(`/proposals/${modal.proposal.id}`, data)
            : api.post('/proposals', data),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success(modal.proposal ? 'Teklif güncellendi.' : 'Teklif oluşturuldu.')
            setModal({ open: false, proposal: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/proposals/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success('Teklif silindi.')
            setDeleteConfirm(null)
        },
    })

    const sendMutation = useMutation({
        mutationFn: (id) => api.post(`/proposals/${id}/send`),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success('Teklif gönderildi olarak işaretlendi.')
        },
    })

    const recallMutation = useMutation({
        mutationFn: (id) => api.post(`/proposals/${id}/recall`),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success('Teklif geri çekildi.')
        },
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.put(`/proposals/${id}`, { status }),
        onSuccess: () => {
            toast.success('Durum güncellendi.')
        },
    })

    const toggleInstallmentPaidMutation = useMutation({
        mutationFn: (id) => api.patch(`/proposals/installments/${id}/toggle-paid`),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success('Ödeme durumu güncellendi.')
        },
    })

    const respondRevisionMutation = useMutation({
        mutationFn: ({ proposalId, revisionId, status }) => api.post(`/proposals/${proposalId}/revisions/${revisionId}/respond`, { status }),
        onSuccess: () => {
            qc.invalidateQueries(['proposals'])
            toast.success('Talep yanıtlandı.')
        },
    })

    const openModal = (proposal = null) => {
        if (proposal) {
            setForm({
                customer_id: proposal.customer_id,
                service_id: proposal.service_id || '',
                title: proposal.title,
                description: proposal.description || '',
                valid_until: proposal.valid_until ? proposal.valid_until.substring(0, 10) : '',
                items: proposal.items?.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unit_price
                })) || [{ description: '', quantity: 1, unit_price: 0 }],
                installments: proposal.installments?.map(i => ({
                    id: i.id,
                    amount: i.amount,
                    percentage: i.percentage,
                    payment_date: i.payment_date?.substring(0, 10) || '',
                    description: i.description || '',
                    is_paid: i.is_paid
                })) || [],
                is_vat_included: proposal.is_vat_included || false,
                vat_rate: proposal.vat_rate || 20
            })
        } else {
            setForm({
                customer_id: '',
                service_id: '',
                title: '',
                description: '',
                valid_until: '',
                items: [{ description: '', quantity: 1, unit_price: 0 }],
                installments: [],
                is_vat_included: false,
                vat_rate: 20
            })
        }
        setModal({ open: true, proposal })
    }

    const addItem = () => {
        setForm(f => ({
            ...f,
            items: [...f.items, { description: '', quantity: 1, unit_price: 0 }]
        }))
    }

    const removeItem = (index) => {
        setForm(f => ({
            ...f,
            items: f.items.filter((_, i) => i !== index)
        }))
    }

    const updateItem = (index, field, value) => {
        const newItems = [...form.items]
        newItems[index][field] = value
        setForm(f => ({ ...f, items: newItems }))
    }

    const subtotal = useMemo(() => {
        return form.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0)
    }, [form.items])

    const vatAmount = useMemo(() => {
        return form.is_vat_included ? (subtotal * (parseFloat(form.vat_rate || 0) / 100)) : 0
    }, [subtotal, form.is_vat_included, form.vat_rate])

    const totalPrice = useMemo(() => {
        return subtotal + vatAmount
    }, [subtotal, vatAmount])

    const totalScheduled = useMemo(() => {
        return form.installments.reduce((sum, ins) => sum + parseFloat(ins.amount || 0), 0)
    }, [form.installments])

    const totalPaidInForm = useMemo(() => {
        return form.installments.reduce((sum, ins) => sum + (ins.is_paid ? parseFloat(ins.amount || 0) : 0), 0)
    }, [form.installments])

    // Automatically update installment amounts when total price changes (e.g. VAT toggle)
    useEffect(() => {
        if (totalPrice > 0 && form.installments.length > 0) {
            setForm(f => {
                const updatedInstallments = f.installments.map(ins => ({
                    ...ins,
                    amount: ((parseFloat(ins.percentage || 0) / 100) * totalPrice).toFixed(2)
                }))

                // Detect changes to avoid unnecessary state updates or infinite loops
                const isDifferent = updatedInstallments.some((ins, i) => ins.amount !== f.installments[i].amount)
                if (isDifferent) {
                    return { ...f, installments: updatedInstallments }
                }
                return f
            })
        }
    }, [totalPrice])

    const addInstallment = () => {
        setForm(f => ({
            ...f,
            installments: [...f.installments, { amount: 0, percentage: 0, payment_date: '', description: '', is_paid: false }]
        }))
    }

    const removeInstallment = (index) => {
        setForm(f => ({
            ...f,
            installments: f.installments.filter((_, i) => i !== index)
        }))
    }

    const updateInstallment = (index, field, value) => {
        const newIns = [...form.installments]
        newIns[index][field] = value

        if (field === 'amount' && totalPrice > 0) {
            newIns[index].percentage = ((parseFloat(value) / totalPrice) * 100).toFixed(2)
        } else if (field === 'percentage' && totalPrice > 0) {
            newIns[index].amount = ((parseFloat(value) / 100) * totalPrice).toFixed(2)
        }

        setForm(f => ({ ...f, installments: newIns }))
    }

    const filtered = proposals.filter(p => {
        const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.customer?.name?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || p.status === filterStatus
        return matchSearch && matchStatus
    })

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const getPublicUrl = (uuid) => `${window.location.origin}/public-proposal/${uuid}`

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-indigo-500" />
                        Teklifler
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{proposals.length} toplam teklif</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
                    <Plus size={18} /> Yeni Teklif Oluştur
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Teklif veya müşteri ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                    <option value="">Tüm Durumlar</option>
                    {Object.entries(statuses).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-200 dark:text-gray-800 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Teklif bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teklif Detayı</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Geçerlilik</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiyat</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                    <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(proposal => (
                                    <tr key={proposal.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white leading-tight">{proposal.title}</div>
                                            <div className="text-sm text-gray-500 mt-1">{proposal.customer?.name}</div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(proposal.valid_until)}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(proposal.total_price)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statuses[proposal.status]?.color}`}>
                                                {statuses[proposal.status]?.label}
                                            </span>
                                            {proposal.revision_requests?.some(r => r.status === 'PENDING') && (
                                                <button
                                                    onClick={() => setRevisionModal({ open: true, proposal })}
                                                    className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${proposal.status === 'RENEWAL_REQUESTED'
                                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                                                        : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                                                        }`}
                                                >
                                                    <MessageSquare size={12} /> {proposal.status === 'RENEWAL_REQUESTED' ? 'Yeni Teklif Talebi' : 'Bekleyen Revizeler'}
                                                </button>
                                            )}
                                            {proposal.installments?.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                                                        <span>ÖDEME PERİYODU</span>
                                                        <span className={proposal.installments.every(i => i.is_paid) ? "text-green-500" : "text-amber-500"}>
                                                            {proposal.installments.filter(i => i.is_paid).length} / {proposal.installments.length}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5">
                                                        {proposal.installments.map(i => (
                                                            <div
                                                                key={i.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleInstallmentPaidMutation.mutate(i.id)
                                                                }}
                                                                className={`flex-1 cursor-pointer transition-all hover:opacity-80 ${i.is_paid ? 'bg-green-500 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                                title={`${i.description || 'Ödeme'}: ${formatCurrency(i.amount)} (${i.is_paid ? 'Ödendi' : 'Bekliyor'})`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        const url = getPublicUrl(proposal.uuid)
                                                        navigator.clipboard.writeText(url)
                                                        toast.success('Teklif bağlantısı kopyalandı.')
                                                    }}
                                                    title="Bağlantıyı Kopyala"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                >
                                                    <Link size={16} />
                                                </button>
                                                <a
                                                    href={`/api/public/proposals/${proposal.uuid}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="PDF İndir"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                {['DRAFT', 'REVISION_REQUESTED'].includes(proposal.status) && (
                                                    <button
                                                        onClick={() => sendMutation.mutate(proposal.id)}
                                                        title="Gönder / Güncel Halini İlet"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {proposal.status === 'SENT' && (
                                                    <button
                                                        onClick={() => recallMutation.mutate(proposal.id)}
                                                        title="Geri Çek (Taslağa Al)"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openModal(proposal)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {proposal.status !== 'CANCELLED' && proposal.status !== 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: 'CANCELLED' })}
                                                        title="İptal Et"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                {proposal.status === 'CANCELLED' && (
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: 'DRAFT' })}
                                                        title="Tekrar Aktif Et"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirm(proposal)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
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

            <Modal
                open={modal.open}
                onClose={() => setModal({ open: false, proposal: null })}
                title={modal.proposal ? 'Teklifi Düzenle' : 'Yeni Teklif Oluştur'}
                size="lg"
            >
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık *</label>
                            <input
                                required
                                type="text"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Müşteri *</label>
                            <select
                                required
                                value={form.customer_id}
                                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">Müşteri Seçin</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İlişkili Hizmet (Opsiyonel)</label>
                            <select
                                value={form.service_id}
                                onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">Hizmet Seçin</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Geçerlilik Tarihi</label>
                            <input
                                type="date"
                                value={form.valid_until}
                                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        {modal.proposal?.customer_notes && (
                            <div className="sm:col-span-2 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    <Clock size={14} /> Müşteri Revize/Red Notu
                                </div>
                                <p className="text-sm text-orange-800 dark:text-orange-300 italic">"{modal.proposal.customer_notes}"</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Teklif Kalemleri</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                            >
                                <PlusCircle size={14} /> Yeni Kalem Ekle
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-end group">
                                    <div className="flex-1">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Hizmet/Ürün Açıklaması</label>
                                        <input
                                            required
                                            placeholder="Örn: Logo Tasarımı"
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Adet</label>
                                        <input
                                            required
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Birim Fiyat</label>
                                        <input
                                            required
                                            type="number"
                                            value={item.unit_price}
                                            onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        disabled={form.items.length === 1}
                                        className="p-2 mb-0.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={form.is_vat_included}
                                            onChange={e => setForm(f => ({ ...f, is_vat_included: e.target.checked }))}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">KDV Eklensin mi?</span>
                                    </label>
                                    {form.is_vat_included && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <span className="text-xs font-bold text-gray-400">ORAN (%)</span>
                                            <input
                                                type="number"
                                                value={form.vat_rate}
                                                onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}
                                                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-10">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ara Toplam</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(subtotal)}
                                    </div>
                                </div>
                                {form.is_vat_included && (
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">KDV (%{form.vat_rate})</div>
                                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(vatAmount)}
                                        </div>
                                    </div>
                                )}
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Genel Toplam</div>
                                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(totalPrice)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                            <span className="text-sm font-medium text-gray-500">Teklif Toplamı:</span>
                            <span className="text-lg font-black text-indigo-600">{formatCurrency(totalPrice)}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Ödeme Takvimi</h3>
                            <button
                                type="button"
                                onClick={addInstallment}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
                            >
                                <PlusCircle size={14} /> Ödeme Ekle
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {form.installments.map((ins, idx) => (
                                <div key={idx} className="flex gap-3 items-end group p-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl">
                                    <div className="flex-1">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Ödeme Açıklaması</label>
                                        <input
                                            placeholder="Örn: %30 Peşinat"
                                            value={ins.description}
                                            onChange={e => updateInstallment(idx, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Yüzde (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={ins.percentage}
                                            onChange={e => updateInstallment(idx, 'percentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tutar</label>
                                        <input
                                            type="number"
                                            value={ins.amount}
                                            onChange={e => updateInstallment(idx, 'amount', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="w-36">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tarih</label>
                                        <input
                                            type="date"
                                            value={ins.payment_date}
                                            onChange={e => updateInstallment(idx, 'payment_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center mb-1.5">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Ödeme</label>
                                        <button
                                            type="button"
                                            onClick={() => updateInstallment(idx, 'is_paid', !ins.is_paid)}
                                            className={`p-2 rounded-lg border transition-all ${ins.is_paid ? 'bg-green-500 border-green-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}
                                            title={ins.is_paid ? 'Ödendi Olarak İşaretli' : 'Ödenmedi Olarak İşaretli'}
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeInstallment(idx)}
                                        className="mb-1 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {form.installments.length === 0 && (
                                <p className="text-center py-4 text-xs text-gray-400 italic">Henüz ödeme planı eklenmedi. Teklif kabul edildiğinde ödeme takibi yapabilmek için eklemeniz önerilir.</p>
                            )}
                        </div>

                        <div className={`mt-4 pt-3 flex items-center justify-between border-t ${Math.abs(totalScheduled - totalPrice) > 0.1 ? 'border-red-200 bg-red-50 dark:bg-red-500/5' : 'border-emerald-100 bg-emerald-50 dark:bg-emerald-500/5'} p-3 rounded-xl transition-all`}>
                            <div className="flex gap-6">
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${Math.abs(totalScheduled - totalPrice) > 0.1 ? 'text-red-500' : 'text-emerald-500'}`}>Toplam Ödeme</span>
                                    <span className={`text-sm font-black ${Math.abs(totalScheduled - totalPrice) > 0.1 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(totalScheduled)} / {formatCurrency(totalPrice)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Alınan Ödeme</span>
                                    <span className="text-sm font-black text-green-700">
                                        {formatCurrency(totalPaidInForm)}
                                    </span>
                                </div>
                            </div>
                            {Math.abs(totalScheduled - totalPrice) > 0.1 && (
                                <span className="text-[10px] font-bold text-red-500 animate-pulse text-right">TOPLAM TUTAR EŞLEŞMİYOR!</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button type="button" onClick={() => setModal({ open: false, proposal: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={revisionModal.open}
                onClose={() => setRevisionModal({ open: false, proposal: null })}
                title="Revize Talepleri"
                size="md"
            >
                <div className="space-y-4">
                    {revisionModal.proposal?.revision_requests?.filter(r => r.status === 'PENDING').length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Bekleyen revize talebi bulunmuyor.</p>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {revisionModal.proposal?.revision_requests?.filter(r => r.status === 'PENDING').map(rev => (
                                <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-400 mb-1">{formatDate(rev.created_at)}</div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                                {rev.notes || 'Not belirtilmedi.'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => respondRevisionMutation.mutate({
                                                    proposalId: revisionModal.proposal.id,
                                                    revisionId: rev.id,
                                                    status: 'APPROVED'
                                                })}
                                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                title="Onayla"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => respondRevisionMutation.mutate({
                                                    proposalId: revisionModal.proposal.id,
                                                    revisionId: rev.id,
                                                    status: 'REJECTED'
                                                })}
                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Reddet"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setRevisionModal({ open: false, proposal: null })}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Teklifi Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.title}</span> başlıklı teklifi silmek istediğinize emin misiniz?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button
                            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                            disabled={deleteMutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
