import { Link } from 'react-router-dom'
import { LayoutDashboard, Shield } from 'lucide-react'

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <LayoutDashboard className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {import.meta.env.VITE_APP_NAME.toUpperCase()}
                            </span>
                        </Link>
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

                <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400">
                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">1. Hizmet Tanımı</h2>
                        <p>{import.meta.env.VITE_APP_NAME}, işletmeler için müşteri ilişkileri, proje takibi ve finansal veri yönetimi sunan bir SaaS platformudur. Hizmetlerimiz dijital ortamda sunulmakta olup, herhangi bir fiziksel ürün teslimatı içermez.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">2. Hesap ve Güvenlik</h2>
                        <p>Kullanıcılar, kayıt sırasında verdikleri bilgilerin doğruluğundan sorumludur. Hesap güvenliğinin sağlanması (şifre gizliliği vb.) tamamen kullanıcının sorumluluğundadır. İzinsiz kullanım durumunda derhal tarafımıza bilgi verilmelidir.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">3. Abonelik ve Ödemeler</h2>
                        <p>Hizmetlerimiz abonelik modeliyle sunulur. Ödemeler Paddle.com üzerinden tahsil edilir. Belirlenen paket fiyatlarına vergiler (KDV vb.) dahil olabilir. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz; ancak aktif dönemin ücreti iade edilmez.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">4. Veri Güvenliği</h2>
                        <p>Verileriniz endüstri standartlarında şifrelenerek saklanır. Bulut yedekleme hizmetimiz (S3) verilerinizin güvenliğini sağlar. Kullanıcı verilerinin yedeklenmesi ve korunması için en iyi teknik imkanlar kullanılır.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">5. Koşul Değişiklikleri</h2>
                        <p>{import.meta.env.VITE_APP_NAME}, bu kullanım koşullarını dilediği zaman güncelleme hakkını saklı tutar. Güncellemeler bu sayfa üzerinden yayınlandığı andan itibaren geçerli sayılacaktır.</p>
                    </section>
                </div>
            </div>

            <footer className="mt-20 py-10 border-t border-gray-100 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">© 2026 {import.meta.env.VITE_APP_NAME.toUpperCase()} - TÜM HAKLARI SAKLIDIR.</p>
                </div>
            </footer>
        </div>
    )
}
