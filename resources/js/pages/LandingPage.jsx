import { Link } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Briefcase,
    CreditCard,
    ShieldCheck,
    CloudLightning,
    ArrowRight,
    CheckCircle2,
    BarChart3,
    Files,
    Database,
    Zap,
    Activity
} from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white selection:bg-indigo-500 selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo/small-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {import.meta.env.VITE_APP_NAME.toUpperCase()}
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-400">
                            <a href="#features" className="hover:text-indigo-600 transition-colors">Özellikler</a>
                            <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link>
                            <a href="#stats" className="hover:text-indigo-600 transition-colors">İstatistikler</a>
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

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/20 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-8 animate-fade-in">
                        <Zap size={14} /> Yeni Nesil CRM Deneyimi
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                        İşlerinizi Akıllıca <br /> <span className="text-indigo-600 dark:text-indigo-400">Yönetin ve Büyütün</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                        Müşteri ilişkileri, proje takibi, finansal veriler ve ekip yönetimi tek bir platformda. {import.meta.env.VITE_APP_NAME} ile verimliliğinizi ikiye katlayın.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group">
                            Hemen Başlayın <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                            Giriş Yap
                        </Link>
                    </div>

                    <div className="mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent z-10 h-full w-full" />
                        <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-[32px] border border-white dark:border-gray-800 shadow-2xl relative">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                                alt="Dashboard Preview"
                                className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner w-full object-cover h-[400px] sm:h-[600px]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl sm:text-5xl font-black mb-6">Her Şey Kontrolünüz Altında</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            Modern işletmelerin ihtiyacı olan tüm araçlar, kullanıcı dostu şık bir arayüzle sunuluyor.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: 'Hizmet Takibi (Kanban)', desc: 'İş süreçlerinizi görselleştirin. Sürükle-bırak özelliğiyle servis aşamalarını anlık olarak yönetin ve güncelleyin.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { title: 'Kapsamlı Müşteri Yönetimi', desc: 'Müşterilerinizin tüm geçmişini, aldığı hizmetleri ve ödeme detaylarını tek bir panelden kontrol edin.', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { title: 'Finansal Kontrol Merkezi', desc: 'Gelir-gider dengenizi koruyun. Kasa yönetimi ve detaylı finansal raporlarla işletmenizin nabzını tutun.', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { title: 'Profesyonel Teklif Sistemi', desc: 'Saniyeler içinde etkileyici teklifler hazırlayın. Müşteri onay sürecini dijital olarak takip edin.', icon: Files, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            { title: 'Randevu & Takvim Planlama', desc: 'Çakışan randevulara son verin. Ekipleriniz için organize edilmiş, akıllı bir takvim deneyimi yaşayın.', icon: LayoutDashboard, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                            { title: 'Ekip & Rol Yönetimi', desc: 'Personellerinize yetkiler atayın. Kimin hangi verilere erişebileceğini hassas bir şekilde belirleyin.', icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                            { title: 'Güvenli Bulut Yedekleme', desc: 'Verileriniz bizimle güvende. S3 altyapısı ile tüm bilgileriniz yedeklenmekte.', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { title: 'Dosya & Medya Depolama', desc: 'İşlerinizle ilgili fotoğraf ve belgeleri her zaman elinizin altında tutun. Hızlı erişim ve güvenli saklama.', icon: Files, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                            { title: 'Gelişmiş API Desteği', desc: 'Dış sistemlerle entegrasyon kurun. İşletmenizin verilerini kendi uygulamalarınızla senkronize edin.', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        ].map((feature, i) => (
                            <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                    <feature.icon className={feature.color} size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-600 rounded-[40px] p-12 sm:p-20 relative overflow-hidden text-center text-white">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8">
                            {[
                                { label: 'Mutlu Müşteri', value: '500+' },
                                { label: 'Tamamlanan İş', value: '10K+' },
                                { label: 'Güvenli Yedek', value: '%100' },
                                { label: 'Verimlilik Artışı', value: '%40' },
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="text-4xl sm:text-5xl font-black mb-2">{stat.value}</div>
                                    <div className="text-indigo-200 text-sm font-semibold uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 sm:py-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-gray-100 dark:border-gray-900 pt-20">
                    <h2 className="text-4xl sm:text-6xl font-black mb-8">İşinizi Bir Üst Seviyeye Taşımaya Hazır Mısınız?</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                        Binlerce başarılı işletme arasına katılın. Hemen ücretsiz hesabınızı oluşturun ve yönetime başlayın.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-500/20 active:scale-95">
                            Ücretsiz Denemeyi Başlat
                        </Link>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-400 dark:text-gray-600 text-sm font-semibold italic">
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Kredi Kartı Gerekmez</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Hemen Üye Ol</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Sınırsız Özellikler</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo/small-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-lg font-black text-gray-900 dark:text-white">{import.meta.env.VITE_APP_NAME.toUpperCase()}</span>
                    </Link>
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
