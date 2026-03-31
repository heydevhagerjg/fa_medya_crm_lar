import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Database, Plus, Search, Trash2, Users, UserPlus, Mail, Shield, ShieldCheck, Key, Briefcase, Layers, Check, FolderOpen, ChevronRight, XCircle, Download, Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'
import Pagination from '../../../components/ui/Pagination.jsx'
import axios from 'axios'

const emptyForm = { name: '', package_id: '', s3_config_id: '', admin_name: '', admin_email: '', admin_password: '' }
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
    const [backupsModal, setBackupsModal] = useState({ open: false, tenant: null })
    const [statusForm, setStatusForm] = useState({ is_active: true, suspension_message: '' })
    const [form, setForm] = useState(emptyForm)
    const [limitForm, setLimitForm] = useState({})
    const [userForm, setUserForm] = useState(emptyUserForm)
    const [importModal, setImportModal] = useState(false)
    const [importForm, setImportForm] = useState({ name: '', package_id: '', s3_config_id: '', file: null, admin_name: '', admin_email: '', admin_password: '' })
    const [importProgress, setImportProgress] = useState(0)
    const [importStatus, setImportStatus] = useState(null) // 'uploading' | 'processing' | 'done' | 'error'
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
        refetchInterval: (query) => {
            const data = query.state.data;
            return data?.some(t => t.is_restoring) ? 3000 : false;
        }
    })

    const cancelImportMutation = useMutation({
        mutationFn: (id) => api.post(`/admin/tenants/${id}/cancel-import`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('İptal talebi gönderildi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
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
        mutationFn: async (data) => {
            setImportStatus('uploading')
            setImportProgress(0)

            try {
                let s3Path = null;
                
                // 1. Get Signed URL from Backend
                const { data: signedData } = await api.post('/admin/tenants/import/signed-url', {
                    filename: data.file.name,
                    file_type: data.file.type
                })

                // 2. Upload directly to S3 (Bypass Nginx/PHP limits)
                // Note: We removed Content-Type header to match the backend signature (more flexible)
                await axios.put(signedData.upload_url, data.file, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        setImportProgress(percentCompleted)
                    }
                })

                s3Path = signedData.s3_path
                setImportStatus('processing')
                setImportProgress(100)

                // 3. Finalize Import via Backend
                return api.post('/admin/tenants/import', {
                    name: data.name,
                    package_id: data.package_id,
                    s3_config_id: data.s3_config_id,
                    admin_name: data.admin_name,
                    admin_email: data.admin_email,
                    admin_password: data.admin_password,
                    s3_path: s3Path
                })
            } catch (error) {
                setImportStatus('error')
                throw error
            }
        },
        onSuccess: (res) => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('İşlem başlatıldı! Yeni firma oluşturuldu ve yedek aktarma süreci arka planda devam ediyor.')
            setImportModal(false)
            setImportForm({ name: '', package_id: '', s3_config_id: '', file: null, admin_name: '', admin_email: '', admin_password: '' })
            setImportStatus(null)
            setImportProgress(0)
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || err.message || 'Yükleme başarısız.')
            setImportStatus('error')
        },
    })

    function ProgressCell({ tenant }) {
        const { data: progress } = useQuery({
            queryKey: ['import-progress', tenant.id],
            queryFn: () => api.get(`/admin/tenants/${tenant.id}/import-progress`).then(r => r.data),
            enabled: !!tenant.is_restoring,
            refetchInterval: 3000
        })

        if (!progress) return <div className="animate-pulse h-2 bg-gray-100 dark:bg-gray-800 rounded-full w-24 mx-auto" />

        return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
                <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-blue-600 dark:text-blue-400 uppercase truncate max-w-[100px]">{progress.message || 'Yükleniyor...'}</span>
                    <span>%{progress.progress || 0}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress.progress || 0}%` }}
                    />
                </div>
                <button 
                    onClick={() => {
                        if(window.confirm('Bu yükleme işlemini iptal etmek istediğinize emin misiniz? Veritabanı temizlenecektir.')) {
                            cancelImportMutation.mutate(tenant.id)
                        }
                    }}
                    className="text-[9px] font-black text-red-500 hover:text-red-700 underline uppercase text-left"
                >
                    Yüklemeyi İptal Et
                </button>
            </div>
        )
    }

    const rejectBackupMutation = useMutation({
        mutationFn: (tenantId) => api.post(`/admin/tenants/${tenantId}/reject-backup-request`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Yedekleme talebi reddedildi.')
        },
        onError: () => toast.error('Hata oluştu.')
    })

    const handleExport = async (tenant) => {
        const loadingToast = toast.loading(`${tenant.name} için yedekleme başlatılıyor...`)
        try {
            await api.post(`/admin/tenants/${tenant.id}/backup`)
            toast.success('Yedekleme işlemi arka planda başlatıldı. "Yedekler" modalı üzerinden takip edebilirsiniz.', { id: loadingToast })
            qc.invalidateQueries(['admin-tenant-backups', tenant.id])
            qc.invalidateQueries(['admin-tenants'])
        } catch (err) {
            toast.error('Yedekleme başlatılırken bir hata oluştu.', { id: loadingToast })
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
        .filter(c => {
            const searchLower = (search || '').toString().toLowerCase()
            return (c.name || '').toString().toLowerCase().includes(searchLower)
        })
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
                        <table className="w-full text-left border-collapse border-spacing-0 theme-table">
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
                                    <th className="px-5 py-4">Firma Adı</th>
                                    <th className="px-5 py-4">Paket</th>
                                    <th className="px-5 py-4 text-center">Özellikler</th>
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
                                                {tenant.is_restoring ? (
                                                     <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold flex items-center gap-1 animate-pulse">
                                                        <Loader2 size={10} className="animate-spin" /> YÜKLENİYOR
                                                     </span>
                                                ) : tenant.is_active ? (
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
                                            {tenant.is_restoring ? (
                                                <div className="text-xs text-gray-400 italic">Yedek aktarılıyor...</div>
                                            ) : (
                                                <div
                                                    onClick={() => setPkgModal({ open: true, tenant })}
                                                    className="cursor-pointer inline-flex flex-col"
                                                >
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">{tenant.package?.name || 'Paket Tanımlanmamış'}</span>
                                                    <span className="text-[9px] text-gray-400">Değiştirmek için tıkla</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {tenant.is_restoring ? (
                                                    <ProgressCell tenant={tenant} />
                                                ) : (
                                                    <>
                                                        {tenant.backup_requested && (
                                                            <div className="flex flex-col items-center gap-1 group/req">
                                                                <div className="animate-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-200 dark:border-red-500/20 shadow-sm whitespace-nowrap">
                                                                    <AlertCircle size={12} className="animate-bounce" /> YEDEK TALEBİ
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if(window.confirm(`${tenant.name} firmasının yedek talebini reddetmek istediğinize emin misiniz?`)) {
                                                                            rejectBackupMutation.mutate(tenant.id)
                                                                        }
                                                                    }}
                                                                    className="text-[9px] font-black text-red-500 hover:text-red-700 underline uppercase transition-all opacity-0 group-hover/req:opacity-100"
                                                                >
                                                                    Talebi Reddet
                                                                </button>
                                                            </div>
                                                        )}
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
                                                            onClick={() => setBackupsModal({ open: true, tenant })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 transition-colors"
                                                        >
                                                            <Database size={14} /> Yedekler
                                                        </button>
                                                        <button
                                                            onClick={() => setS3Modal({ open: true, tenant })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                                                        >
                                                            <FolderOpen size={14} /> S3 {tenant.s3_config?.name ? tenant.s3_config.name : "Atanmamış"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {!tenant.is_restoring && (
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
                                            )}
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

                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Yönetici Bilgileri</div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yönetici Ad Soyad *</label>
                            <input
                                type="text"
                                value={form.admin_name}
                                onChange={e => setForm({ ...form, admin_name: e.target.value })}
                                required
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Örn: Ahmet Yılmaz"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yönetici E-posta *</label>
                                <input
                                    type="email"
                                    value={form.admin_email}
                                    onChange={e => setForm({ ...form, admin_email: e.target.value })}
                                    required
                                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="admin@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yönetici Åifre *</label>
                                <input
                                    type="password"
                                    value={form.admin_password}
                                    onChange={e => setForm({ ...form, admin_password: e.target.value })}
                                    required
                                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                />
                            </div>
                        </div>
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
                            <FeatureToggle label="Adım Åablonları" checked={limitForm.plan_step_templates_feature} onChange={v => setLimitForm({ ...limitForm, plan_step_templates_feature: v })} />
                            {limitForm.plan_step_templates_feature && <LimitInput label="Åablon Limiti" value={limitForm.plan_step_template_limit} onChange={v => setLimitForm({ ...limitForm, plan_step_template_limit: v })} />}
                        </div>

                        <div className="space-y-4">
                            <FeatureToggle label="Sohbet Modülü" checked={limitForm.plan_chat_feature} onChange={v => setLimitForm({ ...limitForm, plan_chat_feature: v })} />
                            {limitForm.plan_chat_feature && (
                                <>
                                    <LimitInput label="Sohbet Limiti" value={limitForm.plan_chat_limit} onChange={v => setLimitForm({ ...limitForm, plan_chat_limit: v })} />
                                    <LimitInput label="Grup Limiti" value={limitForm.plan_group_chat_limit} onChange={v => setLimitForm({ ...limitForm, plan_group_chat_limit: v })} />
                                    <LimitInput label="Aylık Görüşme Dk" value={limitForm.plan_call_minutes_limit} onChange={v => setLimitForm({ ...limitForm, plan_call_minutes_limit: v })} />
                                </>
                            )}
                        </div>

                        <FeatureToggle label="API Anahtarı Özelliği" checked={limitForm.plan_api_key_feature} onChange={v => setLimitForm({ ...limitForm, plan_api_key_feature: v })} />
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 flex gap-3 border-t dark:border-gray-800 pb-2">
                        <button type="button" onClick={() => setLimitModal({ open: false, tenant: null })} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
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
                                <div className="text-[10px] text-gray-400 mt-1 mb-3">U: {p.personnel_limit === 0 ? 'âˆ' : p.personnel_limit} | C: {p.customer_limit === 0 ? 'âˆ' : p.customer_limit} | J: {p.job_limit === 0 ? 'âˆ' : p.job_limit}</div>

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
                            <Key size={14} className="text-gray-400" /> Åifre
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
            <Modal open={importModal} onClose={() => (importStatus === 'processing' || !importMutation.isPending) && setImportModal(false)} title="Yedekten Firma Oluştur (Full Import)" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); importMutation.mutate(importForm) }} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                            Bu işlem CLI'daki <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">custom:import</code> komutunun web versiyonudur. Yedek dosyanız doğrudan S3'e yüklenir ve ardından arka planda içe aktarma işlemi başlatılır.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Firma Bilgileri</label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Firma Adı *</label>
                                    <input
                                        type="text"
                                        value={importForm.name}
                                        onChange={e => setImportForm({ ...importForm, name: e.target.value })}
                                        required
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Örn: Yedeği Geri Yüklenen Firma"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Paket *</label>
                                    <select
                                        value={importForm.package_id}
                                        onChange={e => setImportForm({ ...importForm, package_id: e.target.value })}
                                        required
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Paket Seçiniz</option>
                                        {packages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">S3 Yapılandırması</label>
                                    <select
                                        value={importForm.s3_config_id}
                                        onChange={e => setImportForm({ ...importForm, s3_config_id: e.target.value })}
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Otomatik Seçilsin (Rastgele Aktif)</option>
                                        {s3Configs.map(s => (
                                            <option key={s.id} value={s.id}>{s.name || s.aws_bucket_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-2">
                             <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Admin Kullanıcı Bilgileri</label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/30 dark:bg-gray-900/20">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad *</label>
                                    <input
                                        type="text"
                                        value={importForm.admin_name}
                                        onChange={e => setImportForm({ ...importForm, admin_name: e.target.value })}
                                        required
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Tenant Yöneticisi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta *</label>
                                    <input
                                        type="email"
                                        value={importForm.admin_email}
                                        onChange={e => setImportForm({ ...importForm, admin_email: e.target.value })}
                                        required
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="admin@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Åifre *</label>
                                    <input
                                        type="password"
                                        value={importForm.admin_password}
                                        onChange={e => setImportForm({ ...importForm, admin_password: e.target.value })}
                                        required
                                        disabled={importMutation.isPending}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                    />
                                </div>
                             </div>
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Yedek Dosyası</label>
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={e => setImportForm({ ...importForm, file: e.target.files[0] })}
                                    required
                                    disabled={importMutation.isPending}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                />
                                <div className={`p-8 border-2 border-dashed rounded-3xl text-center transition-all ${importForm.file ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-gray-200 dark:border-gray-800 hover:border-red-400 dark:hover:border-red-500/30 bg-white dark:bg-gray-900'}`}>
                                    <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${importForm.file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                        <Upload size={24} />
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                        {importForm.file ? importForm.file.name : 'Yedek Dosyasını (.zip) Seçin'}
                                    </div>
                                    <p className="text-xs text-gray-500">Dosyayı buraya sürükleyin veya tıklayın</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {importMutation.isPending && (
                        <div className="mt-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {importStatus === 'uploading' ? 'S3\'e Doğrudan Yükleniyor...' : 'Arka Plan İşlemi Başlatılıyor...'}
                                    </span>
                                </div>
                                <span className="text-sm font-black text-red-500">{importProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-red-600 transition-all duration-300 ease-out"
                                    style={{ width: `${importProgress}%` }}
                                />
                            </div>
                            <div className="mt-2 text-[10px] text-gray-500 font-medium flex justify-between items-center px-1">
                                <span>PHP/Nginx limitleri bypass ediliyor...</span>
                                <span>Büyük dosyalar için uygundur</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
                        <button 
                            type="button" 
                            disabled={importMutation.isPending && importStatus !== 'processing'}
                            onClick={() => setImportModal(false)} 
                            className="flex-1 px-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {importStatus === 'processing' ? 'Kapat' : 'İptal'}
                        </button>
                        <button 
                            type="submit" 
                            disabled={importMutation.isPending || !importForm.file} 
                            className="flex-[2] px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-red-500/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            {importMutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Lütfen Bekleyin
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Yüklemeyi ve İçe Aktarmayı Başlat
                                </>
                            )}
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
            <TenantBackupsModal
                open={backupsModal.open}
                tenant={backupsModal.tenant}
                onClose={() => setBackupsModal({ open: false, tenant: null })}
            />
        </div>
    )
}

function LimitInput({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    value={value || 0}
                    onChange={e => onChange(parseInt(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white transition-all focus:border-red-500/30"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {value === 0 ? <span className="text-blue-500 text-[10px] font-bold">Limit Yok</span> : <Shield size={12} className="text-gray-400" />}
                </div>
            </div>
        </div>
    )
}

function FeatureToggle({ label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
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

function UserListModal({ open, tenant, onClose }) {
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-tenant-details', tenant?.id],
        queryFn: () => api.get(`/admin/tenants/${tenant.id}`).then(r => r.data.users),
        enabled: !!tenant?.id && open,
    })

    return (
        <Modal open={open} onClose={onClose} title={`${tenant?.name} - Kullanıcı Listesi`} size="lg">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="py-8 text-center text-gray-400">Yükleniyor...</div>
                ) : users.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        Bu firmaya ait henüz kullanıcı bulunmuyor.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {users.map(user => (
                            <div key={user.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 font-bold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate" title={user.name}>{user.name}</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</div>
                                    <div className="mt-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${user.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {user.role}
                                        </span>
                                    </div>
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

function TenantBackupsModal({ open, tenant, onClose }) {
    const qc = useQueryClient()
    const { data: backups = [], isLoading } = useQuery({
        queryKey: ['admin-tenant-backups', tenant?.id],
        queryFn: () => api.get(`/admin/tenants/${tenant.id}/backups`).then(r => r.data),
        enabled: !!tenant?.id && open,
        refetchInterval: (query) => {
            const data = query?.state?.data;
            const isProcessing = Array.isArray(data) && data.some(b => b.status === 'processing' || b.status === 'pending');
            return isProcessing ? 2000 : 5000;
        }
    })

    const { mutate: cancelBackup } = useMutation({
        mutationFn: (id) => api.post(`/admin/tenants/backups/${id}/cancel`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenant-backups', tenant?.id])
            toast.success('Yedekleme iptal edildi.')
        },
        onError: () => toast.error('İptal işlemi başarısız.')
    })

    const { mutate: deleteBackup } = useMutation({
        mutationFn: (id) => api.delete(`/admin/tenants/backups/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenant-backups', tenant?.id])
            toast.success('Yedek kaydı silindi.')
        },
        onError: () => toast.error('Silme işlemi başarısız.')
    })

    const handleDelete = (id) => {
        if (window.confirm('Bu yedek kaydını (varsa dosyasını da) silmek istediğinize emin misiniz?')) {
            deleteBackup(id)
        }
    }

    const handleCancel = (id) => {
        if (window.confirm('Bu yedekleme işlemini iptal etmek istediğinize emin misiniz?')) {
            cancelBackup(id)
        }
    }

    const handleDownload = async (backup) => {
        const toastId = toast.loading('İndirme hazırlanıyor...');
        try {
            const res = await api.get(`/admin/tenants/backups/${backup.id}/signed-url`);
            if (res.data.url) {
                window.open(res.data.url, '_blank');
                toast.success('İndirme başladı.', { id: toastId });
            }
        } catch (err) {
            toast.error('İndirme bağlantısı oluşturulamadı.', { id: toastId });
        }
    }

    const formatSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Modal open={open} onClose={onClose} title={`${tenant?.name} - Yedek Listesi`} size="lg">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="py-8 text-center text-gray-400">Yükleniyor...</div>
                ) : backups.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        Bu firmaya ait henüz yerel yedek bulunmuyor.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {backups.map(backup => (
                            <div key={backup.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${backup.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                            backup.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' :
                                                'bg-blue-50 dark:bg-blue-500/10 text-blue-600 animate-pulse'
                                        }`}>
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            {backup.filename || 'Hazırlanıyor...'}
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${backup.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                                                    backup.status === 'failed' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                                                        'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                                                }`}>
                                                {backup.status === 'completed' ? 'TAMAMLANDI' :
                                                    backup.status === 'failed' ? 'HATA' :
                                                        backup.status === 'processing' ? `İÅLENİYOR (${backup.progress}%)` : 'BEKLENİYOR'}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                            {new Date(backup.created_at).toLocaleString('tr-TR')} â€¢ {formatSize(backup.size)}
                                        </div>
                                        {(backup.status === 'processing' || (backup.status === 'pending' && backup.progress > 0)) && (
                                            <div className="space-y-1.5 mt-2">
                                                {backup.real_time_message && (
                                                    <div className="text-[10px] text-blue-500 font-mono italic truncate" title={backup.real_time_message}>
                                                        Anlık: {backup.real_time_message}
                                                    </div>
                                                )}
                                                <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-500"
                                                        style={{ width: `${backup.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {backup.error && (
                                            <div className="text-[10px] text-red-500 mt-1 font-mono italic">
                                                {backup.error}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(backup.status === 'processing' || backup.status === 'pending') && (
                                        <button onClick={() => handleCancel(backup.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="İptal">
                                            <X size={18} />
                                        </button>
                                    )}
                                    {backup.status === 'completed' && backup.has_file && (
                                        <button onClick={() => handleDownload(backup)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all" title="İndir">
                                            <Download size={18} />
                                        </button>
                                    )}
                                    {backup.status !== 'processing' && backup.status !== 'pending' && (
                                        <button onClick={() => handleDelete(backup.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Sil">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
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

