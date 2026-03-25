import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Shield, ShieldCheck, User, Loader2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function UsersTab() {
    const qc = useQueryClient()
    const { user: currentUser } = useAuthStore()
    const [modal, setModal] = useState({ open: false, user: null })
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER', roleId: '' })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [highlightId, setHighlightId] = useState(null)

    useEffect(() => {
        const h = new URLSearchParams(window.location.search).get('highlight')
        if (h) {
            setHighlightId(h)
            setTimeout(() => {
                const el = document.getElementById(`user-${h}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 500)
            setTimeout(() => setHighlightId(null), 3500)
        }
    }, [window.location.search])

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/settings/users').then(r => r.data)
    })

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/settings/roles').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.user
            ? api.put(`/settings/users/${modal.user.id}`, data)
            : api.post('/settings/users', data),
        onSuccess: () => {
            qc.invalidateQueries(['users'])
            toast.success(modal.user ? 'Kullanıcı güncellendi.' : 'Kullanıcı eklendi.')
            setModal({ open: false, user: null })
            setForm({ name: '', email: '', password: '', role: 'USER', roleId: '' })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/users/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['users'])
            toast.success('Kullanıcı silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.')
    })

    const openModal = (user = null) => {
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            password: '',
            role: user?.role || 'USER',
            roleId: user?.roles?.[0]?.id || ''
        })
        setModal({ open: true, user })
    }

    const safeUsers = Array.isArray(users) ? users : (users?.data && Array.isArray(users.data) ? users.data : [])
    const safeRoles = Array.isArray(roles) ? roles : (roles?.data && Array.isArray(roles.data) ? roles.data : [])

    const adminUsers = safeUsers.filter(u => u.role === 'ADMIN')
    const sortedRoles = [...safeRoles].sort((a, b) => (b.permissions?.length || 0) - (a.permissions?.length || 0))
    const nonAdminUsers = safeUsers.filter(u => u.role !== 'ADMIN')

    const roleGroups = sortedRoles.map(r => ({ ...r, users: [] }))
    const unassignedUsers = []

    nonAdminUsers.forEach(u => {
        if (u.roles && u.roles.length > 0) {
            const matchedGroup = roleGroups.find(rg => rg.id === u.roles[0].id)
            if (matchedGroup) matchedGroup.users.push(u)
            else unassignedUsers.push(u)
        } else {
            unassignedUsers.push(u)
        }
    })

    const renderUserCard = (u) => {
        const isHighlighted = highlightId && String(highlightId) === String(u.id);

        return (
            <div
                key={u.id}
                id={`user-${u.id}`}
                className={
                    isHighlighted
                        ? "bg-[#905EFC]/10 dark:bg-[#905EFC]/10 border-2 border-[#905EFC] rounded-xl p-4 flex items-center justify-between group shadow-lg ring-4 ring-[#905EFC]/20 transition-all"
                        : "bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-[#905EFC]/50 transition-all shadow-sm"
                }
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1A1A2E] dark:text-white flex items-center gap-2 truncate">
                            {u.name}
                            {u.role === 'ADMIN' && <ShieldCheck size={14} className="text-[#905EFC]" title="Yönetici" />}
                        </div>
                        <div className="text-xs text-[#9097A6] dark:text-[#9097A6] truncate">{u.email}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${u.role === 'ADMIN' ? 'bg-[#905EFC]/10 dark:bg-[#905EFC]/10 text-[#905EFC]' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'}`}>
                                {u.role === 'ADMIN' ? 'Yetkili' : 'Personel'}
                            </span>
                            {u.roles?.map(r => (
                                <span key={r.id} className="text-[10px] px-1.5 py-0.5 bg-[#E5E9F0] dark:bg-white/5 text-[#9097A6] rounded font-bold uppercase flex items-center gap-1">
                                    <Shield size={10} /> {r.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    {u.role !== 'ADMIN' && (
                        <button onClick={() => openModal(u)} className="p-2 text-[#9097A6] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 size={16} />
                        </button>
                    )}
                    {u.id !== currentUser?.id && u.role !== 'ADMIN' && (
                        <button onClick={() => setDeleteConfirm(u)} className="p-2 text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-medium text-[#9097A6] uppercase tracking-wider">Kullanıcı Listesi (Hiyerarşik)</h2>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#905EFC]/20">
                    <Plus size={16} /> Kullanıcı Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-[#9097A6]"><Loader2 className="animate-spin mx-auto" size={32} /></div>
            ) : (
                <div className="space-y-8">
                    {adminUsers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white mb-3 border-b border-[#E5E9F0] dark:border-white/5 pb-2 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-amber-500" />
                                Firma Yetkilileri (Tam Yetkili)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {adminUsers.map(u => renderUserCard(u))}
                            </div>
                        </div>
                    )}

                    {roleGroups.map(role => {
                        if (role.users.length === 0) return null
                        return (
                            <div key={role.id}>
                                <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white mb-3 border-b border-[#E5E9F0] dark:border-white/5 pb-2 flex items-center gap-2">
                                    <Shield size={16} className="text-[#905EFC]" />
                                    {role.name}
                                    <span className="text-[10px] font-normal text-[#9097A6] bg-[#E5E9F0] dark:bg-white/5 px-2 py-0.5 rounded-full">{role.permissions?.length || 0} Yetki</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {role.users.map(u => renderUserCard(u))}
                                </div>
                            </div>
                        )
                    })}

                    {unassignedUsers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white mb-3 border-b border-[#E5E9F0] dark:border-white/5 pb-2 flex items-center gap-2">
                                <User size={16} className="text-[#9097A6]" />
                                Özel Rolü Olmayanlar (Temel Personeller)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unassignedUsers.map(u => renderUserCard(u))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Modal open={modal.open} onClose={() => setModal({ open: false, user: null })} title={modal.user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Ad Soyad</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white" placeholder="Ahmet Yılmaz" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#9097A6] mb-1.5">E-posta</label>
                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white" placeholder="ahmet@firma.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#9097A6] mb-1.5">{modal.user ? 'Yeni Şifre (Boş bırakılabilir)' : 'Şifre'}</label>
                        <input type="password" required={!modal.user} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Temel Yetki</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white">
                                <option value="ADMIN">Firma Yetkilisi</option>
                                <option value="USER">Personel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Özel Rol</label>
                            <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white">
                                <option value="">Rol Seçilmedi</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, user: null })} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-white transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kullanıcıyı Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Kullanıcıyı Sil">
                <div className="space-y-4">
                    <p className="text-[#9097A6] dark:text-[#9097A6]">
                        <span className="font-semibold text-[#1A1A2E] dark:text-white">{deleteConfirm?.name}</span> isimli kullanıcıyı silmek istediğinize emin misiniz?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-white transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
