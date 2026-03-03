import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import { Briefcase, Mail, Lock, User, Building, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', tenant_name: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.password_confirmation) {
            toast.error('Şifreler eşleşmiyor.')
            return
        }
        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', form)
            setAuth(data.user, data.token)
            toast.success('Hesap başarıyla oluşturuldu!')
            navigate('/dashboard')
        } catch (err) {
            const errors = err.response?.data?.errors
            if (errors) {
                Object.values(errors).flat().forEach(msg => toast.error(msg))
            } else {
                toast.error(err.response?.data?.message || 'Kayıt başarısız.')
            }
        } finally {
            setLoading(false)
        }
    }

    const fields = [
        { key: 'tenant_name', label: 'Firma / Tenant Adı', icon: Building, type: 'text', placeholder: 'Şirket Adı' },
        { key: 'name', label: 'Ad Soyad', icon: User, type: 'text', placeholder: 'Adınız Soyadınız' },
        { key: 'email', label: 'E-posta', icon: Mail, type: 'email', placeholder: 'ornek@email.com' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                            <Briefcase size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
                        <p className="text-gray-400 text-sm mt-1">Yeni tenant ile başlayın</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                                <div className="relative">
                                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Şifre</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Şifre Tekrarı</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={18} /> Kayıt Ol</>}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Hesabınız var mı?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Giriş yapın</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
