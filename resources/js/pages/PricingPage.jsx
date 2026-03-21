import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, LayoutDashboard, Zap, ShieldCheck, Globe, Activity } from 'lucide-react'
import api from '../lib/api'

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
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {import.meta.env.VITE_APP_NAME.toUpperCase()}
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-400">
                            <a href="/#features" className="hover:text-indigo-600 transition-colors">Özellikler</a>
                            <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link>
                            <a href="/#stats" className="hover:text-indigo-600 transition-colors">İstatistikler</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">
                                Giriş Yap
                            </Link>
                            <Link to="/register" className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95">
                                Ücretsiz Dene
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-32 sm:pt-48 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-6">
                        <Zap size={14} /> Şeffaf Fiyatlandırma
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                        SİZE UYGUN <span className="text-indigo-600 dark:text-indigo-400">PAKETİ SEÇİN</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Karmaşık ücretler yok. İhtiyacınıza en uygun paketi seçin ve işletmenizi hemen büyütmeye başlayın. Tüm paketlerde {packages.length > 0 ? packages[0].trial_days : 14} gün ücretsiz deneme!
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg, i) => (
                            <div key={pkg.id} className={`relative p-8 rounded-[40px] border flex flex-col transition-all duration-500 hover:scale-[1.02] ${i === 1 ? 'bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-500/40 text-white scale-[1.05] z-10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                                {i === 1 && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black uppercase rounded-full shadow-lg">
                                        Popüler Seçim
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className={`text-2xl font-black mb-2 ${i === 1 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        { Number(pkg.price) > 0 ? (
                                            <>
                                                <span className="text-4xl font-black tracking-tighter">₺{Number(pkg.price).toLocaleString('tr-TR')}</span>
                                                <span className={`text-sm font-bold opacity-70 ${i === 1 ? 'text-white' : 'text-gray-500'}`}>/ay</span>
                                            </>
                                        ) : (
                                            <span className="text-4xl font-black tracking-tighter text-green-500">Ücretsiz</span>
                                        )}
                                    </div>
                                    <p className={`mt-4 text-sm font-medium ${i === 1 ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {pkg.trial_days} gün ücretsiz deneme süresi. Kredi kartı gerekmeden tüm özellikleri keşfedin.
                                    </p>
                                </div>

                                <div className="space-y-4 mb-10 flex-1">
                                    <FeatureItem active={true} label={`${pkg.personnel_limit === 0 ? 'Sınırsız' : pkg.personnel_limit} Personel Limiti`} isLight={i === 1} />
                                    <FeatureItem active={true} label={`${pkg.customer_limit === 0 ? 'Sınırsız' : pkg.customer_limit} Müşteri Limiti`} isLight={i === 1} />
                                    <FeatureItem active={true} label={`${pkg.job_limit === 0 ? 'Sınırsız' : pkg.job_limit} Aktif İş Limiti`} isLight={i === 1} />
                                    <FeatureItem active={pkg.appointment_feature} label="Randevu Yönetimi" isLight={i === 1} />
                                    <FeatureItem active={pkg.service_tracking_feature} label="Hizmet Takibi" isLight={i === 1} />
                                    <FeatureItem active={pkg.proposal_feature} label="Teklif Yönetimi" isLight={i === 1} />
                                    <FeatureItem active={pkg.backup_feature} label="Bulut Yedekleme" isLight={i === 1} />
                                    <FeatureItem active={pkg.api_key_feature} label="API Erişimi" isLight={i === 1} />
                                    <FeatureItem active={true} label={pkg.disk_usage_limit === 0 ? 'Sınırsız Depolama' : `${pkg.disk_usage_limit} MB Depolama`} isLight={i === 1} />
                                </div>

                                <Link
                                    to={`/register?package=${pkg.id}`}
                                    className={`w-full py-4 rounded-2xl font-black text-center transition-all active:scale-95 ${i === 1 ? 'bg-white text-indigo-600 hover:bg-gray-50 shadow-xl shadow-black/10' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'}`}
                                >
                                    Hemen Başlat
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-center border-t border-gray-100 dark:border-gray-900 pt-20">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-[24px] mx-auto flex items-center justify-center text-blue-500">
                            <ShieldCheck size={32} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Güvenli Ödeme</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Paddle güvencesiyle tüm ödemeleriniz 256-bit SSL ile korunur.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-[24px] mx-auto flex items-center justify-center text-emerald-500">
                            <Globe size={32} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Gizli Ücret Yok</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">İptal etmek istediğinizde tek tıkla aboneliğinizi durdurabilirsiniz.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-[24px] mx-auto flex items-center justify-center text-purple-500">
                            <Activity size={32} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">7/24 Teknik Destek</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Tüm planlarda öncelikli e-posta ve canlı yardım desteği alırsınız.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-lg font-black text-gray-900 dark:text-white">{import.meta.env.VITE_APP_NAME.toUpperCase()}</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 text-sm font-medium">
                        © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. Tüm hakları saklıdır.
                    </div>
                    <div className="flex items-center gap-6 text-sm font-bold text-gray-600 dark:text-gray-400">
                        <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link>
                        <Link to="/tos" className="hover:text-indigo-600 transition-colors">Kullanım Koşulları</Link>
                        <Link to="/refund" className="hover:text-indigo-600 transition-colors">İade Politikası</Link>
                        <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Gizlilik Politikası</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureItem({ active, label, isLight }) {
    return (
        <div className={`flex items-center gap-3 text-sm font-bold ${!active ? 'opacity-30' : ''}`}>
            <CheckCircle2 size={18} className={active ? (isLight ? 'text-white' : 'text-indigo-500') : (isLight ? 'text-indigo-300' : 'text-gray-300')} />
            <span className={!active ? 'line-through decoration-2' : ''}>{label}</span>
        </div>
    )
}
