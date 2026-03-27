import { Link } from 'react-router-dom'
import { LayoutDashboard, Lock } from 'lucide-react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white pb-20 selection:bg-indigo-500 selection:text-white">
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

            <div className="pt-32 sm:pt-48 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 font-bold">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 uppercase">Gizlilik <span className="text-indigo-600">Politikası</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Son Güncelleme: 19 Mart 2026</p>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 mb-20">
                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">1. Veri Toplama</h2>
                        <p>{import.meta.env.VITE_APP_NAME}, kayıt sırasında adınız, e-posta adresiniz gibi temel bilgileri toplar. Ayrıca hizmetin sunulabilmesi için tarafınızca yüklenen müşteri verileri, dosyalar ve randevu kayıtları gibi iş verilerini saklarız. Bu veriler yalnızca sizin yetkiniz dahilinde ve platformun düzgün çalışması için kullanılır.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">2. Veri İşleme ve Amaç</h2>
                        <p>Topladığımız verileri; kullanıcı deneyimini iyileştirmek, teknik sorunları çözmek, müşteri taleplerine yanıt vermek ve yasal yükümlülüklerimizi yerine getirmek amacıyla işleriz. Verileriniz hiçbir şekilde üçüncü taraflara pazarlama amacıyla satılmaz.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">3. Ödeme Verileri</h2>
                        <p>Kredi kartı bilgileriniz doğrudan Paddle.com ödeme altyapısı tarafından işlenir. Bizim veritabanımızda kart bilgileriniz tutulmaz; sadece ödeme onay bilgisi ve fatura detayları saklanır. Paddle, PCI-DSS uyumlu güvenli bir ödeme sistemidir.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">4. Haklarınız</h2>
                        <p>KVKK ve GDPR kapsamında; verilerinizin silinmesini, güncellenmesini veya kopyalanmasını talep etme hakkına sahipsiniz. Hesabınızı sildiğiniz takdirde, yasal olarak tutulması gereken veriler dışındaki tüm verileriniz kalıcı olarak silinir.</p>
                    </section>
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
