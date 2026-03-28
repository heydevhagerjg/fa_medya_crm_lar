import { Link } from 'react-router-dom'
import { LayoutDashboard, Shield } from 'lucide-react'

export default function TermsOfServicePage() {
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
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 uppercase">Kullanım <span className="text-indigo-600">Koşulları</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Son Güncelleme: 19 Mart 2026</p>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 mb-20">

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            1. Hizmet Sağlayıcı
                        </h2>

                        <p>
                            {import.meta.env.VITE_APP_NAME}, işletmeler için müşteri ilişkileri yönetimi (CRM), proje takibi ve finansal veri yönetimi sunan bir
                            SaaS (Software as a Service) platformudur. Hizmetler tamamen dijital ortamda sunulur ve herhangi bir fiziksel ürün teslimatı içermez.
                        </p>

                        <p>
                            {import.meta.env.VITE_APP_NAME} hizmeti <strong>Fatih Ateş</strong> tarafından işletilmektedir.
                        </p>

                    </section>


                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            2. Hesap ve Güvenlik
                        </h2>

                        <p>
                            Kullanıcılar, kayıt sırasında sağladıkları bilgilerin doğru ve güncel olmasından sorumludur.
                            Hesap güvenliğinin sağlanması (şifre gizliliği ve hesap erişimi dahil) kullanıcının sorumluluğundadır.
                        </p>

                        <p>
                            Hesabınızın izinsiz kullanıldığını fark etmeniz durumunda derhal bizimle iletişime geçmeniz gerekmektedir.
                        </p>

                    </section>


                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            3. Abonelik ve Ödemeler
                        </h2>

                        <p>
                            {import.meta.env.VITE_APP_NAME} hizmetleri abonelik modeli ile sunulmaktadır.
                        </p>

                        <p>
                            Tüm ödemeler ödeme sağlayıcımız olan <strong>Paddle</strong> üzerinden tahsil edilir. Paddle bu işlemlerde
                            <strong>Merchant of Record</strong> olarak görev yapar ve ödeme işlemleri, faturalandırma, vergi tahsilatı
                            ve iade süreçlerini yönetir.
                        </p>

                        <p>
                            Aboneliğinizi istediğiniz zaman hesap ayarlarınız üzerinden iptal edebilirsiniz. Abonelik iptal edildiğinde
                            mevcut fatura dönemi sonuna kadar hizmeti kullanmaya devam edebilirsiniz.
                        </p>

                    </section>


                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            4. İade Politikası
                        </h2>

                        <p>
                            Yeni kullanıcılar platformu test etmek için <strong>14 gün ücretsiz deneme</strong> süresinden yararlanabilir.
                            Deneme süresi boyunca herhangi bir ücret tahsil edilmez.
                        </p>

                        <p>
                            İlk ödeme gerçekleştikten sonra kullanıcılar <strong>3 gün</strong> içerisinde iade talebinde bulunabilir.
                            İade talepleri Paddle üzerinden işleme alınır ve ödeme kullanılan ödeme yöntemine geri gönderilir.
                        </p>

                        <p>
                            3 günlük iade süresi sona erdikten sonra yapılan ödemeler iade edilmez.
                        </p>

                    </section>


                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            5. Veri Güvenliği
                        </h2>

                        <p>
                            Kullanıcı verileri endüstri standartlarına uygun güvenlik önlemleri ile korunmaktadır.
                            Veriler güvenli sunucularda saklanmakta ve düzenli yedekleme sistemleri ile korunmaktadır.
                        </p>

                    </section>


                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            6. Koşul Değişiklikleri
                        </h2>

                        <p>
                            {import.meta.env.VITE_APP_NAME}, bu kullanım koşullarını zaman zaman güncelleme hakkını saklı tutar.
                            Güncellenmiş koşullar bu sayfada yayınlandığı tarihten itibaren geçerli sayılır.
                        </p>

                    </section>

                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo/small-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
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
