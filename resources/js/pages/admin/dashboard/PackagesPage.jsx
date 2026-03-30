import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Box, Plus, Search, Trash2, Edit2, Check, X, Shield, HardDrive, Users, Briefcase, FileText, Calendar, Activity, Layers, Database, Save, CreditCard, Star, MessageSquare } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'
import Pagination from '../../../components/ui/Pagination.jsx'

const emptyPackage = {
    name: '',
    price: 0,
    trial_days: 14,
    paddle_product_id: '',
    paddle_price_id: '',
    personnel_limit: 0,
    customer_limit: 0,
    job_limit: 0,
    appointment_feature: false,
    appointment_limit: 0,
    service_tracking_feature: false,
    service_tracking_limit: 0,
    service_tracking_category_feature: true,
    service_tracking_category_limit: 0,
    proposal_feature: false,
    proposal_limit: 0,
    backup_feature: false,
    backup_limit: 0,
    services_section_feature: false,
    service_limit: 0,
    step_templates_feature: false,
    step_template_limit: 0,
    cash_register_limit: 0,
    api_key_feature: false,
    disk_usage_limit: 0,
    single_file_limit: 50,
    chat_feature: false,
    chat_limit: 0,
    group_chat_limit: 0,
    is_active: true,
    is_popular: false
}

export default function PackagesPage() {
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false, mode: 'create', package: null })
    const [form, setForm] = useState(emptyPackage)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()

    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['admin-packages'],
        queryFn: () => api.get('/admin/packages').then(r => r.data),
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.mode === 'create'
            ? api.post('/admin/packages', data)
            : api.put(`/admin/packages/${modal.package.id}`, data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-packages'])
            toast.success(modal.mode === 'create' ? 'Paket oluşturuldu.' : 'Paket güncellendi.')
            closeModal()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/packages/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-packages'])
            toast.success('Paket silindi.')
        },
        onError: () => toast.error('Paket silinemedi.'),
    })

    const syncMutation = useMutation({
        mutationFn: (id) => api.post(`/admin/packages/${id}/sync-tenants`),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Limitler senkronize edildi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Senkronizasyon hatası.'),
    })

    const openCreateModal = () => {
        setForm(emptyPackage)
        setModal({ open: true, mode: 'create', package: null })
    }

    const openEditModal = (pkg) => {
        setForm({ ...pkg })
        setModal({ open: true, mode: 'edit', package: pkg })
    }

    const closeModal = () => {
        setModal({ open: false, mode: 'create', package: null })
        setForm(emptyPackage)
    }

    const filtered = packages.filter(p => {
        const searchLower = (search || '').toString().toLowerCase()
        return (p.name || '').toString().toLowerCase().includes(searchLower)
    })
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Box size={24} className="text-blue-500" />
                        Sistem Paketleri
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tenantların seçebileceği üyelik paketleri</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/25"
                >
                    <Plus size={18} /> Yeni Paket Ekle
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Paket ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Box size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p>{search ? 'Aramayla eşleşen paket bulunamadı.' : 'Henüz paket tanımlanmamış.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse theme-table">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-4">Paket Adı</th>
                                    <th className="px-5 py-4">Fiyat</th>
                                    <th className="px-5 py-4">Personel/Müşteri/İş</th>
                                    <th className="px-5 py-4">Kota / Dosya Limiti</th>
                                    <th className="px-5 py-4">Durum</th>
                                    <th className="px-5 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(pkg => (
                                    <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{pkg.name}</div>
                                                {pkg.is_popular && <Star size={14} className="text-amber-500 fill-amber-500" strokeWidth={0} />}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">ID: {pkg.id}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">â‚º{pkg.price}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">/ aylık</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded">U: {pkg.personnel_limit === 0 ? 'âˆ' : pkg.personnel_limit}</span>
                                                <span className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 text-[10px] font-bold rounded">C: {pkg.customer_limit === 0 ? 'âˆ' : pkg.customer_limit}</span>
                                                <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded">J: {pkg.job_limit === 0 ? 'âˆ' : pkg.job_limit}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white font-bold">
                                                {pkg.disk_usage_limit === 0 ? 'âˆ' : pkg.disk_usage_limit + ' MB'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Tek Dosya: {pkg.single_file_limit} MB</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {pkg.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 text-[11px] font-bold uppercase tracking-wider">
                                                    <Check size={12} /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 text-[11px] font-bold uppercase tracking-wider">
                                                    <X size={12} /> Pasif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { if (confirm('Bu paketi kullanan TÜM firmaların limitlerini şu anki paket özellikleriyle güncellemek istediğinize emin misiniz?')) syncMutation.mutate(pkg.id) }}
                                                    disabled={syncMutation.isPending}
                                                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                                    title="Limitleri Firmalara Senkronize Et"
                                                >
                                                    <Activity size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
                                                </button>
                                                <button onClick={() => openEditModal(pkg)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteMutation.mutate(pkg.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal open={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Yeni Paket Oluştur' : 'Paketi Düzenle'} size="xl">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="max-h-[80vh] overflow-y-auto px-1 custom-scrollbar pb-4">
                    <div className="space-y-6">
                        {/* 1. Temel Bilgiler & Fiyatlandırma */}
                        <div className="bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5">
                            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Box size={16} /> 1. Temel Bilgiler & Fiyatlandırma
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Paket Adı *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="Örn: Gold Paket"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Fiyat (TL) *</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">â‚º</span>
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                            required
                                            className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-black text-blue-600"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Deneme (Gün)</label>
                                    <input
                                        type="number"
                                        value={form.trial_days}
                                        onChange={e => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-white dark:border-gray-700">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bu paketi satışa çıkar (Aktif)</span>
                                        <Switch checked={form.is_active} onChange={v => setForm({ ...form, is_active: v })} />
                                    </div>
                                    <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-100/50 dark:border-amber-500/20">
                                        <div className="flex items-center gap-2">
                                            <Star size={16} className="text-amber-500" />
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Popüler Åerit Göster</span>
                                        </div>
                                        <Switch checked={form.is_popular} onChange={v => setForm({ ...form, is_popular: v })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Paddle Entegrasyonu */}
                        <div className="bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5">
                            <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard size={16} /> 2. Paddle Ödeme Entegrasyonu
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Paddle Product ID</label>
                                    <input
                                        type="text"
                                        value={form.paddle_product_id}
                                        onChange={e => setForm({ ...form, paddle_product_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm"
                                        placeholder="pro_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Paddle Price ID</label>
                                    <input
                                        type="text"
                                        value={form.paddle_price_id}
                                        onChange={e => setForm({ ...form, paddle_price_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm"
                                        placeholder="pri_..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Genel Limitler */}
                        <div className="bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5">
                            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={16} /> 3. Genel Firma Limitleri (0 = Sınırsız)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><Users size={12} /> Personel</label>
                                    <input type="number" value={form.personnel_limit} onChange={e => setForm({ ...form, personnel_limit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><Users size={12} /> Müşteri</label>
                                    <input type="number" value={form.customer_limit} onChange={e => setForm({ ...form, customer_limit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><Briefcase size={12} /> İş Kaydı</label>
                                    <input type="number" value={form.job_limit} onChange={e => setForm({ ...form, job_limit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><HardDrive size={12} /> Toplam Kota (MB)</label>
                                    <input type="number" value={form.disk_usage_limit} onChange={e => setForm({ ...form, disk_usage_limit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><Layers size={12} /> Tek Dosya Limiti (MB)</label>
                                    <input type="number" value={form.single_file_limit} onChange={e => setForm({ ...form, single_file_limit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Modüller ve Alt Limitler */}
                        <div className="bg-purple-50/30 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-5">
                            <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Layers size={16} /> 4. Modül Erişimi & Özel Limitler
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: 'appointment', label: 'Randevu Modülü', icon: Calendar, color: 'blue' },
                                    { key: 'service_tracking', label: 'Hizmet Takibi', icon: Activity, color: 'green', extra: { key: 'service_tracking_category_limit', label: 'Kategori Limiti' } },
                                    { key: 'proposal', label: 'Teklif Modülü', icon: FileText, color: 'orange' },
                                    { key: 'backup', label: 'Yedekleme Sistemi', icon: Database, color: 'red' },
                                    { key: 'services_section', label: 'Hizmetler (Liste)', icon: Layers, color: 'indigo' },
                                    { key: 'step_templates', label: 'Adım Åablonları', icon: Layers, color: 'pink' },
                                    { key: 'chat', label: 'Sohbet Modülü', icon: MessageSquare, color: 'purple', extra: { key: 'group_chat_limit', label: 'Grup Limiti' } }
                                ].map(mod => {
                                    const featureKey = `${mod.key}_feature`;
                                    const limitKey = mod.key === 'services_section' ? 'service_limit' : 
                                                   (mod.key === 'step_templates' ? 'step_template_limit' : `${mod.key}_limit`);
                                    const active = form[featureKey];

                                    return (
                                        <div key={mod.key} className={`p-4 rounded-2xl border transition-all ${active ? 'bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-500/30 shadow-sm' : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <mod.icon size={18} className={active ? `text-${mod.color}-500` : 'text-gray-400'} />
                                                    <span className={`text-sm font-bold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{mod.label}</span>
                                                </div>
                                                <Switch checked={active} onChange={v => setForm({ ...form, [featureKey]: v })} />
                                            </div>
                                            {active && (
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Limit (0=Sınırsız)</label>
                                                        <input type="number" value={form[limitKey]} onChange={e => setForm({ ...form, [limitKey]: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm" />
                                                    </div>
                                                    {mod.extra && (
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{mod.extra.label}</label>
                                                            <input type="number" value={form[mod.extra.key]} onChange={e => setForm({ ...form, [mod.extra.key]: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {/* Diğer basit özellikler */}
                                <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Shield size={18} className="text-cyan-500" />
                                            <span className="text-sm font-bold">API Erişimi</span>
                                        </div>
                                        <Switch checked={form.api_key_feature} onChange={v => setForm({ ...form, api_key_feature: v })} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kasa Limiti</label>
                                            <input type="number" value={form.cash_register_limit} onChange={e => setForm({ ...form, cash_register_limit: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t border-gray-100 dark:border-gray-800 z-10">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-[2] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all">
                            {saveMutation.isPending ? 'Kaydediliyor...' : <><Save size={18} /> Paketi Kaydet ve Yayınla</>}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

function Switch({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-1'}`} />
        </button>
    )
}

