import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { setAdminAuth } = useAdminStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/admin/login', { email, password })
            setAdminAuth(data.user, data.token)
            toast.success('Giriş başarılı!')
            navigate('/admin/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Giriş başarısız.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-red-500/20">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Paneli</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">
                            Sistem yönetimi için burayı kullanın.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-posta</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-gray-900 dark:text-white"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Şifre</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Giriş Yap'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
