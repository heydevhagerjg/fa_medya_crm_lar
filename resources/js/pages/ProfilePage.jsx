import { useState } from 'react'
import { useAuthStore } from '../stores/index.js'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { User, Lock, Save, Building, Monitor, Shield, Trash2, LogOut, CheckCircle, Smartphone, Globe } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ProfilePage() {
    const qc = useQueryClient()
    const { user, updateUser } = useAuthStore()
    const [nameForm, setNameForm] = useState({ name: user?.name || '' })
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
    const [savingName, setSavingName] = useState(false)
    const [savingPw, setSavingPw] = useState(false)

    const { data: sessions = [], isLoading: loadingSessions } = useQuery({
        queryKey: ['auth-sessions'],
        queryFn: () => api.get('/auth/sessions').then(r => r.data)
    })

    const revokeMutation = useMutation({
        mutationFn: (id) => api.delete(`/auth/sessions/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['auth-sessions'])
            toast.success('Oturum sonlandırıldı.')
        }
    })

    const revokeOthersMutation = useMutation({
        mutationFn: () => api.post('/auth/sessions/revoke-others'),
        onSuccess: () => {
            qc.invalidateQueries(['auth-sessions'])
            toast.success('Diğer tüm oturumlar kapatıldı.')
        }
    })

    const handleSaveName = async (e) => {
        e.preventDefault()
        setSavingName(true)
        try {
            const res = await api.patch('/auth/profile', { name: nameForm.name })
            updateUser(res.data)
            toast.success('Profil güncellendi.')
        } catch {
            toast.error('Güncelleme başarısız.')
        } finally {
            setSavingName(false)
        }
    }

    const handleChangePw = async (e) => {
        e.preventDefault()
        if (pwForm.password !== pwForm.password_confirmation) {
            toast.error('Şifreler eşleşmiyor.')
            return
        }
        setSavingPw(true)
        try {
            await api.post('/auth/change-password', pwForm)
            toast.success('Şifre değiştirildi.')
            setPwForm({ current_password: '', password: '', password_confirmation: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Şifre değiştirilemedi.')
        } finally {
            setSavingPw(false)
        }
    }

    const formatUA = (ua) => {
        if (ua.includes('iPhone') || ua.includes('Android')) return { icon: <Smartphone size={16} />, text: 'Mobil Cihaz' }
        if (ua.includes('Windows') || ua.includes('Macintosh')) return { icon: <Monitor size={16} />, text: 'Masaüstü' }
        return { icon: <Globe size={16} />, text: 'Bilinmeyen Cihaz' }
    }

    const formatDate = (date) => {
        if (!date) return 'Hiç kullanılmadı'
        return new Date(date).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={24} className="text-indigo-500" />
                    Profilim
                </h1>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white text-lg">{user?.name}</div>
                        <div className="text-gray-500 text-sm">{user?.email}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Building size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-400">{user?.tenant?.name || 'Firma'}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 ml-1">{user?.role}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSaveName} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                        <input
                            type="text"
                            value={nameForm.name}
                            onChange={e => setNameForm({ name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <button type="submit" disabled={savingName} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                        <Save size={16} />
                        {savingName ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Shield size={16} className="text-emerald-500" />
                        Aktif Oturumlar
                    </h3>
                    {sessions.length > 1 && (
                        <button
                            onClick={() => revokeOthersMutation.mutate()}
                            disabled={revokeOthersMutation.isPending}
                            className="text-[10px] text-red-500 hover:text-red-600 uppercase tracking-wider font-bold"
                        >
                            DİĞER TÜM OTURUMLARI KAPAT
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {loadingSessions ? (
                        <div className="text-gray-400 text-xs text-center py-4 italic">Oturumlar yükleniyor...</div>
                    ) : sessions.map(session => {
                        const info = formatUA(session.name);
                        return (
                            <div key={session.id} className={`p-3 rounded-xl border flex items-center justify-between ${session.is_current ? 'bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20' : 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.is_current ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                        {info.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            {info.text}
                                            {session.is_current && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">BU CİHAZ</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5" title={session.name}>
                                            Son Aktivite: {formatDate(session.last_used || session.created_at)}
                                        </div>
                                    </div>
                                </div>
                                {!session.is_current && (
                                    <button
                                        onClick={() => revokeMutation.mutate(session.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Oturumu Kapat"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-500" />
                    Şifre Değiştir
                </h3>
                <form onSubmit={handleChangePw} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mevcut Şifre</label>
                        <input
                            type="password"
                            value={pwForm.current_password}
                            onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Şifre</label>
                            <input
                                type="password"
                                value={pwForm.password}
                                onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                                required
                                minLength={8}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tekrar</label>
                            <input
                                type="password"
                                value={pwForm.password_confirmation}
                                onChange={e => setPwForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={savingPw} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                        <Lock size={16} />
                        {savingPw ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                </form>
            </div>
        </div>
    )
}
