import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, LayoutDashboard, Zap, ShieldCheck, Globe, Activity, ChevronRight } from 'lucide-react'
import api from '../lib/api'

const features = [
    { key: 'personnel_limit', label: 'Personel Limiti', type: 'numeric' },
    { key: 'customer_limit', label: 'Müşteri Limiti', type: 'numeric' },
    { key: 'job_limit', label: 'Aktif İş Limiti', type: 'numeric' },
    { key: 'appointment_feature', label: 'Randevu Yönetimi', type: 'boolean' },
    { key: 'service_tracking_feature', label: 'Hizmet Takibi', type: 'boolean' },
    { key: 'proposal_feature', label: 'Teklif Yönetimi', type: 'boolean' },
    { key: 'backup_feature', label: 'Bulut Yedekleme', type: 'boolean' },
    { key: 'api_key_feature', label: 'API Erişimi', type: 'boolean' },
    { key: 'chat_feature', label: 'Sohbet Modülü', type: 'boolean' },
    { key: 'chat_limit', label: 'Sohbet Limiti', type: 'numeric' },
    { key: 'group_chat_limit', label: 'Grup Sohbeti Limiti', type: 'numeric' },
    { key: 'disk_usage_limit', label: 'Depolama Alanı', type: 'numeric', suffix: ' MB' },
]

export default function PricingPage() {
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/auth/packages')
            .then(res => {
                setPackages(res.data.filter(p => p.is_active))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white pb-20 selection:bg-indigo-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo/small-logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {import.meta.env.VITE_APP_NAME.toUpperCase()}
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
                            <a href="/#features" className="hover:text-indigo-600 transition-colors">Özellikler</a>
                            <Link to="/pricing" className="text-indigo-600">Fiyatlandırma</Link>
                            <a href="/#stats" className="hover:text-indigo-600 transition-colors">İstatistikler</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">Giriş Yap</Link>
                            <Link to="/register" className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Hemen Başlat</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-32 sm:pt-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
                        <Zap size={14} /> Şeffaf Karşılaştırma
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
                        PAKETLERİ <span className="text-indigo-600">KARŞILAŞTIRIN</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                        İhtiyaçlarınıza en uygun paketi seçin. Tüm paketlerde 14 gün ücretsiz deneme imkanı.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="relative bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-[32px] overflow-hidden shadow-2xl">
                        {/* Comparison Table */}
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        {/* Sticky Top-Left Corner */}
                                        <th className="sticky left-0 z-30 w-[280px] min-w-[220px] p-8 bg-white dark:bg-[#0b0f1a] border-r border-b border-gray-100 dark:border-gray-800 text-left shadow-[4px_0_12px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)]">
                                            <div className="text-sm font-black text-gray-400 uppercase tracking-widest">ÖZELLİKLER</div>
                                        </th>

                                        {packages.map((pkg, idx) => (
                                            <th key={pkg.id} className={`w-[280px] min-w-[220px] p-8 border-b border-gray-100 dark:border-gray-800 text-center relative ${pkg.is_popular ? 'bg-indigo-600/5' : ''}`}>
                                                {pkg.is_popular && (
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black uppercase rounded-b-xl shadow-lg">
                                                        Popüler
                                                    </div>
                                                )}
                                                <div className="text-2xl font-black text-gray-900 dark:text-white mb-2 truncate px-2">{pkg.name}</div>
                                                <div className="flex items-baseline justify-center gap-1 mb-4">
                                                    {Number(pkg.price) > 0 ? (
                                                        <>
                                                            <span className="text-3xl font-black tracking-tighter">₺{Number(pkg.price).toLocaleString('tr-TR')}</span>
                                                            <span className="text-xs font-bold text-gray-500">/ay</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-3xl font-black tracking-tighter text-emerald-500 uppercase">Ücretsiz</span>
                                                    )}
                                                </div>
                                                <Link
                                                    to={`/register?package=${pkg.id}`}
                                                    className={`inline-flex items-center gap-2 w-full justify-center py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 ${pkg.is_popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                >
                                                    HEMEN BAŞLAT <ChevronRight size={14} />
                                                </Link>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {features.map((feature, fIdx) => (
                                        <tr key={feature.key} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            {/* Sticky Left Column with Feature Name */}
                                            <td className="sticky left-0 z-20 p-5 px-8 bg-white dark:bg-[#0b0f1a] border-r border-gray-100 dark:border-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.15)] opacity-100">
                                                {feature.label}
                                            </td>

                                            {packages.map((pkg, idx) => {
                                                const value = pkg[feature.key];
                                                return (
                                                    <td key={`${pkg.id}-${feature.key}`} className={`p-5 border-b border-gray-100 dark:border-gray-800 text-center ${idx % 2 === 1 ? 'bg-gray-50/30 dark:bg-white/5' : ''}`}>
                                                        {feature.type === 'boolean' ? (
                                                            value ? (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500">
                                                                    <Check size={18} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500/50">
                                                                    <X size={18} strokeWidth={3} />
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className={`text-base font-black ${value === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {value === 0 ? 'Sınırsız' : `${value}${feature.suffix || ''}`}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    {/* Additional Trial Row */}
                                    <tr className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="sticky left-0 z-20 p-5 px-8 bg-white dark:bg-[#0b0f1a] border-r border-gray-100 dark:border-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.15)] opacity-100">
                                            Deneme Süresi
                                        </td>
                                        {packages.map((pkg, idx) => (
                                            <td key={`${pkg.id}-trial`} className={`p-5 border-b border-gray-100 dark:border-gray-800 text-center text-sm font-bold text-gray-500 ${idx % 2 === 1 ? 'bg-gray-50/30 dark:bg-white/5' : ''}`}>
                                                {pkg.trial_days} Gün Ücretsiz
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                )}

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-center border-t border-gray-200 dark:border-gray-800 pt-20">
                    {[
                        { icon: ShieldCheck, title: 'Güvenli Ödeme', text: 'Paddle güvencesiyle tüm ödemeleriniz 256-bit SSL ile korunur.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { icon: Globe, title: 'Gizli Ücret Yok', text: 'İstediğiniz zaman tek tıkla aboneliğinizi dondurabilir veya iptal edebilirsiniz.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { icon: Activity, title: '7/24 Teknik Destek', text: 'Tüm planlarda öncelikli e-posta ve canlı yardım desteği alırsınız.', color: 'text-purple-500', bg: 'bg-purple-500/10' }
                    ].map((item, i) => (
                        <div key={i} className="space-y-4">
                            <div className={`w-16 h-16 ${item.bg} rounded-[24px] mx-auto flex items-center justify-center ${item.color}`}>
                                <item.icon size={32} />
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight">{item.title}</h4>
                            <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-20 py-12 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo/small-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-lg font-black text-gray-900 dark:text-white uppercase">{import.meta.env.VITE_APP_NAME}</span>
                    </div>
                    <div className="text-gray-500 text-sm font-medium">
                        © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. Tüm hakları saklıdır.
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <Link to="/tos" className="hover:text-indigo-600 transition-colors">ŞARTLAR</Link>
                        <Link to="/refund" className="hover:text-indigo-600 transition-colors">İADE</Link>
                        <Link to="/privacy" className="hover:text-indigo-600 transition-colors">GİZLİLİK</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
