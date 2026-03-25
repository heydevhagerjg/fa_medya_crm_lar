import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Key, Loader2, Save, FileCode, ChevronDown, ChevronUp, Activity, AlertCircle } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import { useAuthStore } from '../../stores/index.js'
import { Link } from 'react-router-dom'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'

export default function ApiKeysTab() {
    const { user } = useAuthStore()
    const isApiKeyDisabled = user?.tenant?.plan_api_key_feature === false || user?.tenant?.plan_api_key_feature === 0

    if (isApiKeyDisabled) {
        return <PlanRestrictionView featureName="API" />
    }

    const qc = useQueryClient()
    const [name, setName] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState([])
    const [showConfirm, setShowConfirm] = useState(null)
    const [editingKey, setEditingKey] = useState(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const modules = [
        { id: 'jobs', label: 'İşler (Jobs)' },
        { id: 'customers', label: 'Müşteriler (Customers)' },
        { id: 'appointments', label: 'Randevular (Appointments)' },
        { id: 'finance', label: 'Finans (Kasalar)' },
        { id: 'expenses', label: 'Giderler (Expenses)' },
        { id: 'files', label: 'Dosyalar (Files)' },
        { id: 'dashboard', label: 'Dashboard / İstatistik' },
        { id: 'auth', label: 'Kullanıcı İşlemleri (Auth)' },
        { id: 'settings', label: 'Ayarlar' },
        { id: 'logs', label: 'Loglar' },
    ]

    const actions = [
        { id: 'read', label: 'Oku', color: 'blue' },
        { id: 'write', label: 'Yaz (Ekle)', color: 'green' },
        { id: 'update', label: 'Güncelle', color: 'amber' },
        { id: 'delete', label: 'Sil', color: 'red' },
    ]

    const { data: keys = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => api.get('/settings/api-keys').then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: (data) => editingKey
            ? api.put(`/settings/api-keys/${editingKey.id}`, data)
            : api.post('/settings/api-keys', data),
        onSuccess: () => {
            qc.invalidateQueries(['api-keys'])
            toast.success(editingKey ? 'API anahtarı güncellendi.' : 'API anahtarı oluşturuldu.')
            resetForm()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const resetForm = () => {
        setName('')
        setExpiresAt('')
        setSelectedPermissions([])
        setEditingKey(null)
        setIsFormOpen(false)
    }

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/api-keys/${id}`),
        onSuccess: () => { qc.invalidateQueries(['api-keys']); toast.success('Anahtar silindi.'); setShowConfirm(null) },
    })

    const copyKey = (key) => {
        navigator.clipboard.writeText(key)
        toast.success('Kopyalandı!')
    }

    const handleEdit = (k) => {
        setEditingKey(k)
        setName(k.name || '')
        setExpiresAt(k.expires_at ? k.expires_at.split('T')[0] : '')
        setSelectedPermissions(k.permissions || [])
        setIsFormOpen(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const togglePermission = (moduleId, actionId) => {
        const perm = `${moduleId}:${actionId}`
        setSelectedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        )
    }

    const toggleAllModule = (moduleId) => {
        const modulePerms = actions.map(a => `${moduleId}:${a.id}`)
        const hasAll = modulePerms.every(p => selectedPermissions.includes(p))

        if (hasAll) {
            setSelectedPermissions(prev => prev.filter(p => !modulePerms.includes(p)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms])])
        }
    }

    return (
        <div className="space-y-4">
            <div className={`bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/5 rounded-xl p-5 space-y-5 transition-all duration-300 ${isFormOpen ? 'ring-2 ring-[#905EFC]/20 shadow-lg' : ''}`}>
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                >
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white flex items-center gap-2">
                            {editingKey ? <Edit2 size={16} className="text-amber-500" /> : <Plus size={16} className="text-[#905EFC]" />}
                            {editingKey ? 'API Anahtarını Düzenle' : 'Yeni Granüler API Anahtarı Oluştur'}
                        </h3>
                        {!isFormOpen && (
                            <p className="text-[10px] text-[#9097A6] mt-1">Granüler yetkilere sahip yeni bir anahtar tanımlamak için tıklayın.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.role === 'ADMIN' && (
                            <Link
                                to="/api-docs"
                                onClick={(e) => e.stopPropagation()}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] dark:text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all"
                            >
                                <FileCode size={12} /> Dökümantasyon
                            </Link>
                        )}
                        <div className="p-1 rounded-lg bg-[#F4F5F7] dark:bg-white/5 group-hover:bg-[#E5E9F0] dark:group-hover:bg-white/10 transition-colors">
                            {isFormOpen ? <ChevronUp size={16} className="text-[#9097A6]" /> : <ChevronDown size={16} className="text-[#9097A6]" />}
                        </div>
                    </div>
                </div>

                {isFormOpen && (
                    <div className="space-y-5 pt-4 border-t border-[#E5E9F0] dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Anahtar Adı</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Mobil Entegrasyon" className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#905EFC]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9097A6] mb-1.5">Son Geçerlilik Tarihi (Opsiyonel)</label>
                                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#905EFC]" />
                            </div>
                        </div>

                        <div className="overflow-hidden border border-[#E5E9F0] dark:border-white/5 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] text-[10px] uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-2">Modül</th>
                                        {actions.map(a => <th key={a.id} className="px-4 py-2 text-center">{a.label}</th>)}
                                        <th className="px-4 py-2 text-right">Tümü</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E9F0] dark:divide-white/5">
                                    {modules.map(m => (
                                        <tr key={m.id} className="hover:bg-[#F4F5F7] dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#1A1A2E] dark:text-white text-xs">{m.label}</td>
                                            {actions.map(a => (
                                                <td key={a.id} className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(`${m.id}:${a.id}`)}
                                                        onChange={() => togglePermission(m.id, a.id)}
                                                        className="rounded border-[#E5E9F0] text-[#905EFC] focus:ring-[#905EFC]"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllModule(m.id)}
                                                    className="text-[10px] text-[#905EFC] hover:text-[#905EFC] font-bold"
                                                >
                                                    {actions.every(a => selectedPermissions.includes(`${m.id}:${a.id}`)) ? 'Temizle' : 'Tümü'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            {editingKey && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2.5 border border-[#E5E9F0] dark:border-white/10 text-[#9097A6] dark:text-[#9097A6] rounded-xl text-sm font-semibold hover:bg-[#F4F5F7] dark:hover:bg-white/10 transition-all"
                                >
                                    İptal
                                </button>
                            )}
                            <button
                                onClick={() => saveMutation.mutate({ name, permissions: selectedPermissions, expires_at: expiresAt || null })}
                                disabled={saveMutation.isPending}
                                className="px-6 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#905EFC]/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingKey ? 'Değişiklikleri Kaydet' : 'Anahtarı Oluştur'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {keys.map(k => (
                    <div key={k.id} className="bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/5 rounded-xl p-4 transition-all hover:border-[#E5E9F0] dark:hover:border-white/10 shadow-sm relative group">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#1A1A2E] dark:text-white">{k.name || 'Adsız Anahtar'}</span>
                                    {k.expires_at && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${new Date(k.expires_at) < new Date()
                                            ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                            : 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                            }`}>
                                            {new Date(k.expires_at) < new Date() ? 'Süresi Doldu' : `SKT: ${new Date(k.expires_at).toLocaleDateString('tr-TR')}`}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-stretch gap-2">
                                    <button onClick={() => copyKey(k.key)} className="flex-1 group/key flex items-center gap-2 font-mono text-[13px] text-[#1A1A2E] hover:text-[#905EFC] transition-colors bg-[#F4F5F7] dark:bg-white/5 p-2 rounded-lg" title="Kopyalamak için tıklayın">
                                        <span className="truncate flex-1">{k.key}</span>
                                        <Activity size={12} className="opacity-0 group-hover/key:opacity-100 transition-opacity" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {!k.permissions || k.permissions.length === 0 ? (
                                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg font-semibold border border-amber-100 dark:border-amber-500/20">Full Admin Access (Tüm Yetkiler)</span>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {modules.filter(m => k.permissions.some(p => p.startsWith(m.id + ':'))).map(m => (
                                                <div key={m.id} className="p-2 border border-[#E5E9F0] dark:border-white/5 rounded-lg bg-[#F4F5F7] dark:bg-white/5">
                                                    <div className="text-[9px] font-bold text-[#9097A6] uppercase mb-1">{m.label}</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {actions.filter(a => k.permissions.includes(`${m.id}:${a.id}`)).map(a => (
                                                            <span key={a.id} className="text-[8px] px-1.5 py-0.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 text-[#9097A6] dark:text-[#9097A6] rounded uppercase">{a.label}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="text-[10px] text-[#9097A6] flex items-center gap-3">
                                    <span>Son Kullanım: {k.last_used ? new Date(k.last_used).toLocaleString('tr-TR') : 'Henüz kullanılmadı'}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <span>ID: {k.id.split('-')[0]}...</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleEdit(k)}
                                    className="p-2.5 rounded-xl text-[#9097A6] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-100 dark:hover:border-amber-500/20"
                                    title="Düzenle"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => setShowConfirm(k)}
                                    className="p-2.5 rounded-xl text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                                    title="Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={!!showConfirm} onClose={() => setShowConfirm(null)} title="API Anahtarını Sil">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl flex gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>Bu API anahtarını sildiğinizde, bu anahtarı kullanan tüm dış servislerin erişimi anında kesilecektir. Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirm(null)} className="flex-1 px-4 py-3 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-semibold hover:bg-[#F4F5F7] dark:hover:bg-white/10 transition-colors">Vazgeç</button>
                        <button onClick={() => deleteMutation.mutate(showConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
