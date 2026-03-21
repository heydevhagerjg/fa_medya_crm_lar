import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Database, Plus, Search, Trash2, Users, UserPlus, Mail, Shield, ShieldCheck, Key, Briefcase, Layers, Check, FolderOpen, ChevronRight, XCircle, Download, Upload } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'
import Pagination from '../../../components/ui/Pagination.jsx'

const emptyForm = { name: '', package_id: '', s3_config_id: '' }
const emptyUserForm = { name: '', email: '', password: 'password123', role: 'USER' }

export default function TenantsPage() {
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false })
    const [userModal, setUserModal] = useState({ open: false, tenant: null })
    const [addUserModal, setAddUserModal] = useState({ open: false, tenant: null })
    const [limitModal, setLimitModal] = useState({ open: false, tenant: null })
    const [pkgModal, setPkgModal] = useState({ open: false, tenant: null })
    const [s3Modal, setS3Modal] = useState({ open: false, tenant: null })
    const [statusModal, setStatusModal] = useState({ open: false, tenant: null })
    const [statusForm, setStatusForm] = useState({ is_active: true, suspension_message: '' })
    const [form, setForm] = useState(emptyForm)
    const [limitForm, setLimitForm] = useState({})
    const [userForm, setUserForm] = useState(emptyUserForm)
    const [importModal, setImportModal] = useState(false)
    const [importForm, setImportForm] = useState({ name: '', package_id: '', file: null })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const qc = useQueryClient()

    useEffect(() => {
        setCurrentPage(1)
    }, [search])

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['admin-tenants'],
        queryFn: () => api.get('/admin/tenants').then(r => r.data),
    })

    const { data: packages = [] } = useQuery({
        queryKey: ['admin-packages'],
        queryFn: () => api.get('/admin/packages').then(r => r.data),
    })

    const { data: s3Configs = [] } = useQuery({
        queryKey: ['admin-s3-configs'],
        queryFn: () => api.get('/admin/settings').then(r => r.data),
    })

    const saveMutation = useMutation({
        mutationFn: (data) => api.post('/admin/tenants', data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Firma (Tenant) eklendi.')
            closeModal()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const limitMutation = useMutation({
        mutationFn: (data) => api.put(`/admin/tenants/${limitModal.tenant.id}/limits`, data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Limitler güncellendi.')
            setLimitModal({ open: false, tenant: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const pkgMutation = useMutation({
        mutationFn: (package_id) => api.put(`/admin/tenants/${pkgModal.tenant.id}/change-package`, { package_id }),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Paket başarıyla değiştirildi ve limitler senkronize edildi.')
            setPkgModal({ open: false, tenant: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const giftMutation = useMutation({
        mutationFn: (package_id) => api.post(`/admin/tenants/${pkgModal.tenant.id}/gift-package`, { package_id }),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Paket sınırsız süreyle tanımlandı.')
            setPkgModal({ open: false, tenant: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const addUserMutation = useMutation({
        mutationFn: ({ tenantId, data }) => api.post(`/admin/tenants/${tenantId}/users`, data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            qc.invalidateQueries(['admin-tenant-details', addUserModal.tenant?.id])
            toast.success('Kullanıcı eklendi.')
            setAddUserModal({ open: false, tenant: null })
            setUserForm(emptyUserForm)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const statusMutation = useMutation({
        mutationFn: (data) => api.put(`/admin/tenants/${statusModal.tenant.id}/status`, data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Firma durumu güncellendi.')
            setStatusModal({ open: false, tenant: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/tenants/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Firma (Tenant) silindi.')
            setDeleteConfirm(null)
        },
        onError: () => toast.error('Silinemedi.'),
    })

    const s3UpdateMutation = useMutation({
        mutationFn: ({ tenantId, s3_config_id }) => api.put(`/admin/tenants/${tenantId}/s3-config`, { s3_config_id }),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('S3 Yapılandırması güncellendi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => api.post('/admin/tenants/bulk-delete', { ids }),
        onSuccess: (res) => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success(res.data.message)
            setSelectedIds([])
            setShowBulkDeleteConfirm(false)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.'),
    })

    const importMutation = useMutation({
        mutationFn: (data) => {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('package_id', data.package_id)
            formData.append('file', data.file)
            return api.post('/admin/tenants/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Yedek başarıyla yüklendi ve aktarıldı.')
            setImportModal(false)
            setImportForm({ name: '', package_id: '', file: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Yükleme başarısız.'),
    })

    const handleExport = async (tenant) => {
        const loadingToast = toast.loading(`${tenant.name} için yedek hazırlanıyor...`)
        try {
            const response = await api.get(`/admin/tenants/${tenant.id}/backup`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${tenant.name.replace(/\s+/g, '_')}_full_backup.zip`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Yedek başarıyla indirildi.', { id: loadingToast })
        } catch (err) {
            toast.error('Yedek oluşturulurken bir hata oluştu.', { id: loadingToast })
        }
    }

    const openModal = () => {
        setForm(emptyForm)
        setModal({ open: true })
    }

    const closeModal = () => {
        setModal({ open: false })
        setForm(emptyForm)
    }

    const openLimitModal = (tenant) => {
        setLimitForm({ ...tenant })
        setLimitModal({ open: true, tenant })
    }

    const openUserModal = async (tenant) => {
        setUserModal({ open: true, tenant })
    }

    const openStatusModal = (tenant) => {
        setStatusForm({
            is_active: tenant.is_active,
            suspension_message: tenant.suspension_message || ''
        })
        setStatusModal({ open: true, tenant })
    }

    const filtered = tenants
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Database size={24} className="text-red-500" />
                        Firmalar (Tenants)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tenants.length} firma kayıtlı</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        <Upload size={18} /> Yedek Yükle (Import)
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-500/25"
                    >
                        <Plus size={18} /> Yeni Firma Ekle
                    </button>
                </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Firma ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 px-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 pl-1">{selectedIds.length} Firma Seçildi</span>
                        <div className="h-4 w-px bg-red-200 dark:bg-red-500/30 mx-2"></div>
                        <button
                            onClick={() => setShowBulkDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-500/20"
                        >
                            <Trash2 size={14} /> Seçilenleri Sil
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                            title="Seçimi Kaldır"
                        >
                            <XCircle size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Database size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{search ? 'Aramayla eşleşen firma bulunamadı.' : 'Henüz firma yok.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border-spacing-0">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                            checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(paginatedData.map(t => t.id))
                                                } else {
                                                    setSelectedIds([])
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-5 py-4">Firma Adı / S3</th>
                                    <th className="px-5 py-4">Mevcut Paket</th>
                                    <th className="px-5 py-4 text-center">Limitler/Kullanıcılar</th>
                                    <th className="px-5 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(tenant => (
                                    <tr key={tenant.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${selectedIds.includes(tenant.id) ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                checked={selectedIds.includes(tenant.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(prev => [...prev, tenant.id])
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => id !== tenant.id))
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-gray-900 dark:text-white font-bold">{tenant.name}</div>
                                                {tenant.is_active ? (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center gap-1">
                                                        AKTİF
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-bold flex items-center gap-1">
                                                        ASKIDA
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{tenant.slug}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div
                                                onClick={() => setPkgModal({ open: true, tenant })}
                                                className="cursor-pointer inline-flex flex-col"
                                            >
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">{tenant.package?.name || 'Paket Tanımlanmamış'}</span>
                                                <span className="text-[9px] text-gray-400">Değiştirmek için tıkla</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openLimitModal(tenant)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 transition-colors"
                                                >
                                                    <Shield size={14} /> Limitler
                                                </button>
                                                <button
                                                    onClick={() => openUserModal(tenant)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition-colors"
                                                >
                                                    <Users size={14} /> {tenant.users_count || 0}
                                                </button>
                                                <button
                                                    onClick={() => setS3Modal({ open: true, tenant })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    <FolderOpen size={14} /> S3 {tenant.s3_config?.name ? tenant.s3_config.name : "Atanmamış"}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setAddUserModal({ open: true, tenant })}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                                                    title="Kullanıcı Ekle"
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleExport(tenant)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    title="Tam Yedek Al (JSON + Dosyalar)"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button onClick={() => openStatusModal(tenant)} className="p-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all" title="Durum & Engelleme">
                                                    <Shield size={18} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(tenant)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Sil">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} />
                    </div>
                )}
            </div>

            {/* Add Tenant Modal */}
            <Modal open={modal.open} onClose={closeModal} title={'Yeni Firma (Tenant) Ekle'}>
                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma Adı *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Paketi *</label>
                        <select
                            value={form.package_id}
                            onChange={e => setForm({ ...form, package_id: e.target.value })}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">Paket Seçiniz</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">S3 Yapılandırması (Opsiyonel)</label>
                        <select
                            value={form.s3_config_id}
                            onChange={e => setForm({ ...form, s3_config_id: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">Otomatik Ata (Rastgele Aktif)</option>
                            {s3Configs.map(s3 => (
                                <option key={s3.id} value={s3.id}>{s3.name} {!s3.is_active && '(Pasif)'}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                            {saveMutation.isPending ? 'Ekleniyor...' : 'Firma Oluştur'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Limit Modal */}
            <Modal open={limitModal.open} onClose={() => setLimitModal({ open: false, tenant: null })} title={`${limitModal.tenant?.name} - Özel Limit Düzenleme`} size="xl">
                <form onSubmit={e => { e.preventDefault(); limitMutation.mutate(limitForm) }} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="sm:col-span-3 pb-2 border-b dark:border-gray-800">
                            <h3 className="text-sm font-bold flex items-center gap-2"><Briefcase size={16} /> Temel Kapasiteler</h3>
                        </div>
                        <LimitInput label="Personel Limiti" value={limitForm.plan_personnel_limit} onChange={v => setLimitForm({ ...limitForm, plan_personnel_limit: v })} />
                        <LimitInput label="Müşteri Limiti" value={limitForm.plan_customer_limit} onChange={v => setLimitForm({ ...limitForm, plan_customer_limit: v })} />
                        <LimitInput label="İş Limiti" value={limitForm.plan_job_limit} onChange={v => setLimitForm({ ...limitForm, plan_job_limit: v })} />
                        <LimitInput label="Kasa Limiti" value={limitForm.plan_cash_register_limit} onChange={v => setLimitForm({ ...limitForm, plan_cash_register_limit: v })} />
                        <LimitInput label="Disk Kotası (MB)" value={limitForm.plan_disk_usage_limit} onChange={v => setLimitForm({ ...limitForm, plan_disk_usage_limit: v })} />
                        <LimitInput label="Tek Dosya Limiti (MB)" value={limitForm.plan_single_file_limit} onChange={v => setLimitForm({ ...limitForm, plan_single_file_limit: v })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                        <div className="sm:col-span-2 pb-2 border-b dark:border-gray-800">
                            <h3 className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> Modül Özellikleri</h3>
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Randevu Modülü" checked={limitForm.plan_appointment_feature} onChange={v => setLimitForm({ ...limitForm, plan_appointment_feature: v })} />
                            {limitForm.plan_appointment_feature && <LimitInput label="Randevu Limiti" value={limitForm.plan_appointment_limit} onChange={v => setLimitForm({ ...limitForm, plan_appointment_limit: v })} />}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Hizmet Takibi" checked={limitForm.plan_service_tracking_feature} onChange={v => setLimitForm({ ...limitForm, plan_service_tracking_feature: v })} />
                            {limitForm.plan_service_tracking_feature && (
                                <>
                                    <LimitInput label="Takip Limiti" value={limitForm.plan_service_tracking_limit} onChange={v => setLimitForm({ ...limitForm, plan_service_tracking_limit: v })} />
                                    <LimitInput label="Takip Kategori Limiti" value={limitForm.plan_service_tracking_category_limit} onChange={v => setLimitForm({ ...limitForm, plan_service_tracking_category_limit: v })} />
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Teklif Modülü" checked={limitForm.plan_proposal_feature} onChange={v => setLimitForm({ ...limitForm, plan_proposal_feature: v })} />
                            {limitForm.plan_proposal_feature && <LimitInput label="Teklif Limiti" value={limitForm.plan_proposal_limit} onChange={v => setLimitForm({ ...limitForm, plan_proposal_limit: v })} />}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Yedekleme Özelliği" checked={limitForm.plan_backup_feature} onChange={v => setLimitForm({ ...limitForm, plan_backup_feature: v })} />
                            {limitForm.plan_backup_feature && <LimitInput label="Yedek Limiti" value={limitForm.plan_backup_limit} onChange={v => setLimitForm({ ...limitForm, plan_backup_limit: v })} />}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Hizmetler Bölümü" checked={limitForm.plan_services_section_feature} onChange={v => setLimitForm({ ...limitForm, plan_services_section_feature: v })} />
                            {limitForm.plan_services_section_feature && <LimitInput label="Hizmet Limiti" value={limitForm.plan_service_limit} onChange={v => setLimitForm({ ...limitForm, plan_service_limit: v })} />}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Adım Şablonları" checked={limitForm.plan_step_templates_feature} onChange={v => setLimitForm({ ...limitForm, plan_step_templates_feature: v })} />
                            {limitForm.plan_step_templates_feature && <LimitInput label="Şablon Limiti" value={limitForm.plan_step_template_limit} onChange={v => setLimitForm({ ...limitForm, plan_step_template_limit: v })} />}
                        </div>

                        <FeatureToggle label="API Anahtarı Özelliği" checked={limitForm.plan_api_key_feature} onChange={v => setLimitForm({ ...limitForm, plan_api_key_feature: v })} />
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 flex gap-3 border-t dark:border-gray-800 pb-2">
                        <button type="button" onClick={() => setLimitModal({ open: false, tenant: null })} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium">İptal</button>
                        <button type="submit" disabled={limitMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                            {limitMutation.isPending ? 'Kaydediliyor...' : 'Limitleri Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Change Package Modal */}
            <Modal open={pkgModal.open} onClose={() => setPkgModal({ open: false, tenant: null })} title={`${pkgModal.tenant?.name} - Paket Değiştir`}>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Yeni bir paket seçtiğinizde, firmanın tüm mevcut limitleri seçilen paketin varsayılan değerleri ile <span className="text-red-500 font-bold underline">güncellenecektir</span>.
                    </p>
                    <div className="space-y-3">
                        {packages.map(p => (
                            <div
                                key={p.id}
                                className={`p-4 rounded-2xl border-2 transition-all ${pkgModal.tenant?.package_id === p.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                    : 'border-gray-100 dark:border-gray-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">{p.name}</span>
                                    {pkgModal.tenant?.package_id === p.id && <ShieldCheck size={16} className="text-blue-500" />}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 mb-3">U: {p.personnel_limit === 0 ? '∞' : p.personnel_limit} | C: {p.customer_limit === 0 ? '∞' : p.customer_limit} | J: {p.job_limit === 0 ? '∞' : p.job_limit}</div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => pkgMutation.mutate(p.id)}
                                        disabled={pkgMutation.isPending || giftMutation.isPending}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white`}
                                    >
                                        Normal Ata
                                    </button>
                                    <button
                                        onClick={() => giftMutation.mutate(p.id)}
                                        disabled={pkgMutation.isPending || giftMutation.isPending}
                                        className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-purple-500/10"
                                    >
                                        {giftMutation.isPending ? '...' : 'Sınırsız Yap'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setPkgModal({ open: false, tenant: null })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium">İptal</button>
                </div>
            </Modal>

            {/* Add User Modal */}
            <Modal open={addUserModal.open} onClose={() => setAddUserModal({ open: false, tenant: null })} title={`${addUserModal.tenant?.name} - Kullanıcı Ekle`}>
                <form onSubmit={(e) => { e.preventDefault(); addUserMutation.mutate({ tenantId: addUserModal.tenant.id, data: userForm }) }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Users size={14} className="text-gray-400" /> Ad Soyad
                        </label>
                        <input
                            type="text"
                            required
                            value={userForm.name}
                            onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                            placeholder="Ahmet Yılmaz"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" /> E-posta
                        </label>
                        <input
                            type="email"
                            required
                            value={userForm.email}
                            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                            placeholder="ahmet@firma.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Key size={14} className="text-gray-400" /> Şifre
                        </label>
                        <input
                            type="text"
                            required
                            value={userForm.password}
                            onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Shield size={14} className="text-gray-400" /> Yetki
                        </label>
                        <select
                            value={userForm.role}
                            onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                        >
                            <option value="ADMIN">Firma Yöneticisi</option>
                            <option value="USER">Personel</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setAddUserModal({ open: false, tenant: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={addUserMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {addUserMutation.isPending ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* S3 Modal */}
            <Modal open={s3Modal.open} onClose={() => setS3Modal({ open: false, tenant: null })} title={`${s3Modal.tenant?.name} - S3 Yapılandırması`}>
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl">
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Mevcut Bağlantı</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <Database size={16} className="text-blue-500" />
                            {s3Modal.tenant?.s3_config?.name || 'Atanmamış'}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Bağlantı Ayarları</label>
                            {s3Modal.tenant?.s3_config_id && (
                                <button
                                    onClick={() => s3UpdateMutation.mutate({ tenantId: s3Modal.tenant.id, s3_config_id: null })}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                >
                                    <XCircle size={12} /> S3 Yetkisini Al
                                </button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
                            {s3Configs.map(s3 => (
                                <button
                                    key={s3.id}
                                    onClick={() => s3UpdateMutation.mutate({ tenantId: s3Modal.tenant.id, s3_config_id: s3.id })}
                                    disabled={s3UpdateMutation.isPending}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group ${s3Modal.tenant?.s3_config_id === s3.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                        : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/20'
                                        }`}
                                >
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{s3.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s3.aws_region} - {s3.aws_bucket_name}</div>
                                    </div>
                                    {s3Modal.tenant?.s3_config_id === s3.id ? (
                                        <Check size={18} className="text-blue-500" />
                                    ) : (
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setS3Modal({ open: false, tenant: null })} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                        Kapat
                    </button>
                </div>
            </Modal>

            {/* User List Modal */}
            <UserListModal
                open={userModal.open}
                tenant={userModal.tenant}
                onClose={() => setUserModal({ open: false, tenant: null })}
            />

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Firmayı Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.name}</span> isimli firmayı silmek istediğinize emin misiniz? Bu firmaya ait tüm kullanıcılar ve veriler de etkilenecektir (Veritabanı yapısına bağlı olarak).
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Status & Suspension Modal */}
            <Modal open={statusModal.open} onClose={() => setStatusModal({ open: false, tenant: null })} title="Firma Durumu ve Erişim Yönetimi">
                <form onSubmit={(e) => { e.preventDefault(); statusMutation.mutate(statusForm) }} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={statusForm.is_active}
                                onChange={e => setStatusForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">Hesap Aktif</div>
                                <div className="text-xs text-gray-500">Hesabı kapatırsanız tüm kullanıcıların erişimi anında kesilir.</div>
                            </div>
                        </label>
                    </div>

                    {!statusForm.is_active && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Erişim Engeli Mesajı (Müşteriye Gösterilecek)</label>
                            <textarea
                                value={statusForm.suspension_message}
                                onChange={e => setStatusForm(prev => ({ ...prev, suspension_message: e.target.value }))}
                                placeholder="Örn: Ödeme gecikmesi nedeniyle hesabınız geçici olarak dondurulmuştur. Lütfen bizimle iletişime geçin."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <p className="mt-1 text-xs text-gray-500 italic">Mesaj girilmezse varsayılan sistem mesajı gösterilir.</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setStatusModal({ open: false, tenant: null })} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">İptal</button>
                        <button type="submit" disabled={statusMutation.isPending} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                            {statusMutation.isPending ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Backup Modal */}
            <Modal open={importModal} onClose={() => setImportModal(false)} title="Yedekten Firma Oluştur (Full Import)">
                <form onSubmit={(e) => { e.preventDefault(); importMutation.mutate(importForm) }} className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            Bu işlem, yüklediğiniz <b>ZIP</b> yedeğindeki tüm verileri ve dosyaları sisteme aktararak <b>yeni bir firma</b> oluşturur.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Firma Adı *</label>
                        <input
                            type="text"
                            value={importForm.name}
                            onChange={e => setImportForm({ ...importForm, name: e.target.value })}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Örn: Yedeği Geri Yüklenen Firma"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Paket *</label>
                        <select
                            value={importForm.package_id}
                            onChange={e => setImportForm({ ...importForm, package_id: e.target.value })}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">Paket Seçiniz</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yedek Dosyası (.zip) *</label>
                        <input
                            type="file"
                            accept=".zip"
                            onChange={e => setImportForm({ ...importForm, file: e.target.files[0] })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setImportModal(false)} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">İptal</button>
                        <button type="submit" disabled={importMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                            {importMutation.isPending ? 'Aktarılıyor...' : 'Yüklemeyi Başlat'}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Bulk Delete Confirm Modal */}
            <Modal open={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} title="Toplu Firma Silme" size="sm">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full mx-auto text-red-600 dark:text-red-400">
                        <Trash2 size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-900 dark:text-white font-bold mb-1">
                            Seçilen firmaları silmek istediğinize emin misiniz?
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-4 mt-2 leading-relaxed">
                            <span className="font-bold text-red-600">{selectedIds.length} adet</span> firma KALICI olarak silinecek. Bu işlem firmaya ait tüm verileri, kullanıcıları ve ayarları ortadan kaldırır.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowBulkDeleteConfirm(false)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                            disabled={bulkDeleteMutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {bulkDeleteMutation.isPending ? 'Siliniyor...' : 'Evet, Hepsini Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function UserListModal({ open, tenant, onClose }) {
    const { data: details, isLoading } = useQuery({
        queryKey: ['admin-tenant-details', tenant?.id],
        queryFn: () => api.get(`/admin/tenants/${tenant.id}`).then(r => r.data),
        enabled: !!tenant?.id && open
    })

    return (
        <Modal open={open} onClose={onClose} title={`${tenant?.name} - Kullanıcı Listesi`}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="py-8 text-center text-gray-400">Yükleniyor...</div>
                ) : details?.users?.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        Bu firmaya ait henüz kullanıcı yok.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {details?.users?.map(user => (
                            <div key={user.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 text-sm font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            {user.name}
                                            {user.role === 'ADMIN' && <ShieldCheck size={14} className="text-red-500" title="Yönetici" />}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN'
                                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600'
                                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    Kapat
                </button>
            </div>
        </Modal>
    )
}

function LimitInput({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            <input
                type="number"
                value={value || 0}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
        </div>
    )
}

function FeatureToggle({ label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-1'}`} />
            </button>
        </div>
    )
}
