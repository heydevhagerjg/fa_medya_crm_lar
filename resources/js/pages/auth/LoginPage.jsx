import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import { Briefcase, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', form)
            setAuth(data.user, data.token)
            toast.success(`Hoş geldiniz, ${data.user.name}!`)
            navigate('/dashboard')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Giriş başarısız.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[32px] p-10 shadow-2xl overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 transform rotate-3 hover:rotate-0 transition-transform duration-500 mb-6">
                            <Briefcase size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{import.meta.env.VITE_APP_NAME}</h1>
                        <p className="text-gray-500 text-sm mt-2 font-medium">Lütfen bilgilerinizi giriniz</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-posta</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    placeholder="ornek@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Şifre</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/30 mt-4 overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative flex items-center gap-3">
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><LogIn size={20} /> GİRİŞ YAP</>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Hesabınız yok mu?{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 font-bold underline underline-offset-4">
                                Hemen Kaydolun
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
