import { useState } from 'react'
import { useAuthStore } from '../stores/index.js'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { User, Lock, Save, Building } from 'lucide-react'

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore()
    const [nameForm, setNameForm] = useState({ name: user?.name || '' })
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
    const [savingName, setSavingName] = useState(false)
    const [savingPw, setSavingPw] = useState(false)

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
                    <div>
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
