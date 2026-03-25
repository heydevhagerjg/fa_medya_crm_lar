import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Shield, Loader2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'

export default function RolesTab() {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, role: null })
    const [form, setForm] = useState({ name: '', permissions: [] })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/settings/roles').then(r => r.data)
    })

    const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => api.get('/settings/permissions').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.role
            ? api.put(`/settings/roles/${modal.role.id}`, data)
            : api.post('/settings/roles', data),
        onSuccess: () => {
            qc.invalidateQueries(['roles'])
            toast.success('Rol kaydedildi.')
            setModal({ open: false, role: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/roles/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['roles'])
            toast.success('Rol silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.')
    })

    const openModal = (role = null) => {
        setForm({
            name: role?.name || '',
            permissions: role?.permissions?.map(p => p.name) || []
        })
        setModal({ open: true, role })
    }

    const handleToggle = (permName) => {
        setForm(p => {
            const exists = p.permissions.includes(permName)
            if (exists) return { ...p, permissions: p.permissions.filter(n => n !== permName) }
            return { ...p, permissions: [...p.permissions, permName] }
        })
    }

    const groupedPermissions = Array.isArray(allPermissions) ? allPermissions.reduce((acc, p) => {
        const [group] = p.name.split('.')
        if (!acc[group]) acc[group] = []
        acc[group].push(p)
        return acc
    }, {}) : {}

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-[#9097A6] uppercase tracking-wider">Rol Listesi</h2>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#905EFC]/20">
                    <Plus size={16} /> Rol Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesLoading ? (
                    <div className="col-span-full py-12 text-center text-[#9097A6]"><Loader2 className="animate-spin mx-auto" size={32} /></div>
                ) : roles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[#9097A6] bg-white dark:bg-[#111111] border border-dashed border-[#E5E9F0] dark:border-white/5 rounded-xl">
                        Henüz rol oluşturulmamış.
                    </div>
                ) : roles.map(r => (
                    <div key={r.id} className="bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/5 rounded-xl p-4 flex flex-col group hover:border-[#905EFC]/50 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-[#1A1A2E] dark:text-white flex items-center gap-2">
                                <Shield size={16} className="text-[#905EFC]" />
                                {r.name}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(r)} className="p-1.5 text-[#9097A6] hover:text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                                <button onClick={() => setDeleteConfirm(r)} className="p-1.5 text-[#9097A6] hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {r.permissions.length === 0 ? (
                                <span className="text-[10px] text-[#9097A6] italic">Yetki verilmemiş</span>
                            ) : (
                                r.permissions.slice(0, 5).map(p => (
                                    <span key={p.id} className="text-[9px] px-1.5 py-0.5 bg-[#E5E9F0] dark:bg-white/5 text-[#9097A6] dark:text-[#9097A6] rounded capitalize">
                                        {p.name.replace('.', ' ')}
                                    </span>
                                ))
                            )}
                            {r.permissions.length > 5 && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] rounded">
                                    +{r.permissions.length - 5} daha
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, role: null })} title={modal.role ? 'Rolü Düzenle' : 'Yeni Rol Ekle'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Rol Adı</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#905EFC] text-[#1A1A2E] dark:text-white" placeholder="Örn: Muhasebe, Saha Personeli" />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-medium text-[#9097A6] uppercase tracking-tighter">İşlem Yetkileri (Granüler)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin min-h-[100px]">
                            {permsLoading ? (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-[#9097A6]">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs">Yetkiler yükleniyor...</span>
                                </div>
                            ) : Object.keys(groupedPermissions).length === 0 ? (
                                <div className="col-span-full py-12 text-center text-[#9097A6] bg-[#F4F5F7]/50 dark:bg-[#111111]/50 rounded-xl border border-dashed border-[#E5E9F0] dark:border-white/5">
                                    Yetki bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.
                                </div>
                            ) : (
                                Object.entries(groupedPermissions).map(([group, perms]) => (
                                    <div key={group} className="border border-[#E5E9F0] dark:border-white/5 rounded-xl p-3 bg-[#F4F5F7]/30 dark:bg-gray-950/20">
                                        <div className="text-[11px] font-bold text-[#9097A6] uppercase mb-2 border-b border-[#E5E9F0] dark:border-white/5 pb-1">{group}</div>
                                        <div className="space-y-2">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 cursor-pointer group/item">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.permissions.includes(p.name)}
                                                        onChange={() => handleToggle(p.name)}
                                                        className="rounded border-[#E5E9F0] dark:border-white/10 text-[#905EFC] focus:ring-[#905EFC] bg-white dark:bg-white/5"
                                                    />
                                                    <span className="text-xs text-[#9097A6] dark:text-[#9097A6] group-hover/item:text-[#1A1A2E] dark:group-hover/item:text-gray-200 capitalize">
                                                        {p.name.split('.')[1]?.replace('_', ' ') || p.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, role: null })} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-white transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Rolü Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Rolü Sil">
                <div className="space-y-4">
                    <p className="text-[#9097A6] dark:text-[#9097A6]"><span className="font-semibold">{deleteConfirm?.name}</span> rolünü silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-white transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
