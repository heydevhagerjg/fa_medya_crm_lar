import { Link } from 'react-router-dom'
import { LayoutDashboard, CreditCard } from 'lucide-react'

export default function RefundPolicyPage() {
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
                        <CreditCard size={32} />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 uppercase">İade <span className="text-indigo-600">Politikası</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Son Güncelleme: 19 Mart 2026</p>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400">

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            1. Hizmetin Niteliği
                        </h2>

                        <p>
                            {import.meta.env.VITE_APP_NAME} internet üzerinden sunulan bir yazılım hizmetidir
                            (Software as a Service – SaaS). Platforma erişim abonelik modeli ile sağlanmaktadır.
                            {import.meta.env.VITE_APP_NAME} üzerinden yapılan tüm ödemeler, ödeme altyapı sağlayıcımız
                            olan Paddle tarafından tahsil edilmektedir. Paddle bu işlemlerde Merchant of Record
                            olarak görev yapar ve ödeme, faturalandırma, vergi ve iade süreçlerini yönetir.
                        </p>

                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            2. Ücretsiz Deneme Süresi
                        </h2>

                        <p>
                            Yeni kullanıcılar platformu test edebilmek için <strong>14 gün ücretsiz deneme</strong> süresinden
                            yararlanabilir. Deneme süresi boyunca herhangi bir ücret tahsil edilmez.
                        </p>

                        <p>
                            Kullanıcılar deneme süresi sona ermeden önce aboneliklerini iptal edebilirler.
                            Bu durumda herhangi bir ücretlendirme yapılmaz.
                        </p>

                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            3. İade Politikası
                        </h2>

                        <p>
                            Deneme süresi sona erdikten sonra abonelik ücretli döneme geçer ve ödeme Paddle
                            üzerinden tahsil edilir.
                        </p>

                        <p>
                            İlk ödeme gerçekleştikten sonra kullanıcılar <strong>3 gün</strong> içerisinde iade talebinde
                            bulunabilirler. Bu süre içerisinde yapılan iade talepleri Paddle üzerinden işleme alınır
                            ve ödeme kullanılan ödeme yöntemine geri gönderilir.
                        </p>

                        <p>
                            3 günlük iade süresi sona erdikten sonra yapılan ödemeler iade edilmez.
                        </p>

                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">
                            4. Abonelik İptali
                        </h2>

                        <p>
                            Kullanıcılar istedikleri zaman aboneliklerini hesap ayarları üzerinden iptal edebilirler.
                            Abonelik iptal edildiğinde mevcut fatura döneminin sonuna kadar hizmet kullanılmaya
                            devam edebilir, ancak bir sonraki dönem için yeni bir tahsilat yapılmaz.
                        </p>

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
