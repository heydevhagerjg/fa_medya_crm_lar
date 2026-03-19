import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/index.js'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import { Briefcase, Mail, Lock, User, Building, Eye, EyeOff, UserPlus, Check, Info } from 'lucide-react'

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', tenant_name: '', package_id: '' })
    const [packages, setPackages] = useState([])
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/auth/packages').then(r => setPackages(r.data)).catch(() => toast.error('Paketler yüklenemedi.'))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.package_id) {
            toast.error('Lütfen bir paket seçiniz.')
            return
        }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4 py-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-2xl relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                            <Briefcase size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
                        <p className="text-gray-400 text-sm mt-1">Yeni bir tenant ve paket ile başlayın</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
                                <div key={key} className={key === 'tenant_name' ? 'md:col-span-2' : ''}>
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
                        </div>

                        {/* Package Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Info size={16} className="text-indigo-400" /> Bir Plan Seçiniz *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {packages.map(pkg => (
                                    <div 
                                        key={pkg.id}
                                        onClick={() => setForm(p => ({ ...p, package_id: pkg.id }))}
                                        className={`cursor-pointer group relative p-4 rounded-2xl border transition-all duration-200 ${
                                            form.package_id === pkg.id 
                                            ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20' 
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        {form.package_id === pkg.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-indigo-600">
                                                <Check size={14} />
                                            </div>
                                        )}
                                        <div className={`text-sm font-bold mb-1 ${form.package_id === pkg.id ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                                            {pkg.name}
                                        </div>
                                        <div className={`text-[10px] space-y-1 ${form.package_id === pkg.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                                            <div className="flex justify-between"><span>Personel:</span> <span>{pkg.personnel_limit}</span></div>
                                            <div className="flex justify-between"><span>Müşteri:</span> <span>{pkg.customer_limit}</span></div>
                                            <div className="flex justify-between"><span>İş:</span> <span>{pkg.job_limit}</span></div>
                                            <div className="flex justify-between"><span>Kasa:</span> <span>{pkg.cash_register_limit}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !form.package_id}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={20} /> Kayıt Ol ve Başla</>}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-white/5">
                        <p className="text-gray-400 text-sm">
                            Hesabınız var mı?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">Giriş yapın</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
