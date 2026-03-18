import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Box, Plus, Search, Trash2, Edit2, Check, X, Shield, HardDrive, Users, Briefcase, FileText, Calendar, Activity, Layers, Database, Save } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'
import Pagination from '../../../components/ui/Pagination.jsx'

const emptyPackage = {
    name: '',
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
    is_active: true
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

    const filtered = packages.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
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
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-4">Paket Adı</th>
                                    <th className="px-5 py-4">Personel/Müşteri/İş</th>
                                    <th className="px-5 py-4">Kota</th>
                                    <th className="px-5 py-4">Durum</th>
                                    <th className="px-5 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(pkg => (
                                    <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{pkg.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">ID: {pkg.id}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded">U: {pkg.personnel_limit}</span>
                                                <span className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 text-[10px] font-bold rounded">C: {pkg.customer_limit}</span>
                                                <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded">J: {pkg.job_limit}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {pkg.disk_usage_limit >= 1024 
                                                ? (pkg.disk_usage_limit / 1024).toFixed(1) + ' GB' 
                                                : pkg.disk_usage_limit + ' MB'
                                            }
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
                                                    onClick={() => { if(confirm('Bu paketi kullanan TÜM firmaların limitlerini şu anki paket özellikleriyle güncellemek istediğinize emin misiniz?')) syncMutation.mutate(pkg.id) }} 
                                                    disabled={syncMutation.isPending}
                                                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                                    title="Limitleri Firmalara Senkronize Et"
                                                >
                                                    <Activity size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
                                                </button>
                                                <button onClick={() => openEditModal(pkg)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { if(confirm('Silmek istediğinize emin misiniz?')) deleteMutation.mutate(pkg.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
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
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                    {/* Temel Bilgiler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Paket Adı *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                placeholder="Örn: Gold Paket"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <Users size={14} /> Personel Limiti
                            </label>
                            <input
                                type="number"
                                value={form.personnel_limit}
                                onChange={e => setForm({ ...form, personnel_limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <Users size={14} className="text-green-500" /> Müşteri Limiti
                            </label>
                            <input
                                type="number"
                                value={form.customer_limit}
                                onChange={e => setForm({ ...form, customer_limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <Briefcase size={14} className="text-orange-500" /> İş Limiti
                            </label>
                            <input
                                type="number"
                                value={form.job_limit}
                                onChange={e => setForm({ ...form, job_limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <HardDrive size={14} className="text-red-500" /> Disk Kotası (MB)
                            </label>
                            <input
                                type="number"
                                value={form.disk_usage_limit}
                                onChange={e => setForm({ ...form, disk_usage_limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Layers size={18} className="text-purple-500" /> Modül Özellikleri & Limitleri
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Randevu */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-500" /> Randevu Feature
                                    </span>
                                    <Switch checked={form.appointment_feature} onChange={v => setForm({...form, appointment_feature: v})} />
                                </div>
                                {form.appointment_feature && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Randevu Limiti</label>
                                        <input type="number" value={form.appointment_limit} onChange={e => setForm({...form, appointment_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Hizmet Takip */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <Activity size={16} className="text-green-500" /> Hizmet Takibi
                                    </span>
                                    <Switch checked={form.service_tracking_feature} onChange={v => setForm({...form, service_tracking_feature: v})} />
                                </div>
                                {form.service_tracking_feature && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Takip Limiti</label>
                                            <input type="number" value={form.service_tracking_limit} onChange={e => setForm({...form, service_tracking_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Takip Kategori Limiti</label>
                                            <input type="number" value={form.service_tracking_category_limit || 0} onChange={e => setForm({...form, service_tracking_category_limit: parseInt(e.target.value) || 0})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Teklif */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <FileText size={16} className="text-red-500" /> Teklif Modülü
                                    </span>
                                    <Switch checked={form.proposal_feature} onChange={v => setForm({...form, proposal_feature: v})} />
                                </div>
                                {form.proposal_feature && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Teklif Limiti</label>
                                        <input type="number" value={form.proposal_limit} onChange={e => setForm({...form, proposal_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Yedekleme */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <Database size={16} className="text-yellow-500" /> Yedekleme
                                    </span>
                                    <Switch checked={form.backup_feature} onChange={v => setForm({...form, backup_feature: v})} />
                                </div>
                                {form.backup_feature && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Yedek Limiti</label>
                                        <input type="number" value={form.backup_limit} onChange={e => setForm({...form, backup_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Hizmetler Bölümü */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <Layers size={16} className="text-indigo-500" /> Hizmetler Bölümü
                                    </span>
                                    <Switch checked={form.services_section_feature} onChange={v => setForm({...form, services_section_feature: v})} />
                                </div>
                                {form.services_section_feature && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Hizmet Tanım Limiti</label>
                                        <input type="number" value={form.service_limit} onChange={e => setForm({...form, service_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Adım Şablonları */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <Layers size={16} className="text-pink-500" /> Adım Şablonları
                                    </span>
                                    <Switch checked={form.step_templates_feature} onChange={v => setForm({...form, step_templates_feature: v})} />
                                </div>
                                {form.step_templates_feature && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Şablon Limiti</label>
                                        <input type="number" value={form.step_template_limit} onChange={e => setForm({...form, step_template_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Diğerleri */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Kasa Limiti</label>
                                    <input type="number" value={form.cash_register_limit} onChange={e => setForm({...form, cash_register_limit: parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm mb-3" />
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-sm font-semibold flex items-center gap-2">
                                            <Shield size={16} className="text-cyan-500" /> API Anahtarı Özelliği
                                        </span>
                                        <Switch checked={form.api_key_feature} onChange={v => setForm({...form, api_key_feature: v})} />
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between">
                                    <span className="text-sm font-semibold">Paket Aktiflik Durumu</span>
                                    <Switch checked={form.is_active} onChange={v => setForm({...form, is_active: v})} />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-2 flex gap-3 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            {saveMutation.isPending ? 'Kaydediliyor...' : <><Save size={18} /> Paketi Kaydet</>}
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
