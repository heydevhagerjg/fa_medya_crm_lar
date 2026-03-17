import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Database, Plus, Search, Trash2, Users, UserPlus, Mail, Shield, ShieldCheck, Key } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'
import Pagination from '../../../components/ui/Pagination.jsx'

const emptyForm = { name: '' }
const emptyUserForm = { name: '', email: '', password: 'password123', role: 'USER' }

export default function TenantsPage() {
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState({ open: false })
    const [userModal, setUserModal] = useState({ open: false, tenant: null })
    const [addUserModal, setAddUserModal] = useState({ open: false, tenant: null })
    const [form, setForm] = useState(emptyForm)
    const [userForm, setUserForm] = useState(emptyUserForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
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

    const saveMutation = useMutation({
        mutationFn: (data) => api.post('/admin/tenants', data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Firma (Tenant) eklendi.')
            closeModal()
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

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/tenants/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-tenants'])
            toast.success('Firma (Tenant) silindi.')
            setDeleteConfirm(null)
        },
        onError: () => toast.error('Silinemedi.'),
    })

    const openModal = () => {
        setForm(emptyForm)
        setModal({ open: true })
    }

    const closeModal = () => {
        setModal({ open: false })
        setForm(emptyForm)
    }

    const openUserModal = async (tenant) => {
        setUserModal({ open: true, tenant })
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
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-500/25"
                >
                    <Plus size={18} /> Yeni Firma Ekle
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Firma ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
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
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left">Firma Adı</th>
                                    <th className="px-5 py-3 text-left">Slug</th>
                                    <th className="px-5 py-3 text-center">Kullanıcılar</th>
                                    <th className="px-5 py-3 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{tenant.name}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{tenant.slug}</td>
                                        <td className="px-5 py-4 text-sm text-center">
                                            <button 
                                                onClick={() => openUserModal(tenant)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                            >
                                                <Users size={14} />
                                                {tenant.users_count || 0} Kullanıcı
                                            </button>
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
                                                    onClick={() => setDeleteConfirm(tenant)} 
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" 
                                                    title="Sil"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </div>
                </form>
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
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        user.role === 'ADMIN' 
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
