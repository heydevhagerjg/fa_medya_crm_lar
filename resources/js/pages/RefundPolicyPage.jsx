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
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">1. İade ve Cayma Hakkı</h2>
                        <p>{import.meta.env.VITE_APP_NAME} bir dijital servis (SaaS) sunmaktadır. Mesafeli Sözleşmeler Yönetmeliği uyarınca; "elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler" cayma hakkının istisnası kapsamındadır. Bu sebeple, abonelik başlatıldıktan sonra yapılan ödemeler kural olarak iade edilmez.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">2. Ücretsiz Deneme (Trial) Süresi</h2>
                        <p>Kullanıcılarımıza platformu test etmeleri için her pakette ücretsiz deneme süresi sunulur. Bu süre zarfında herhangi bir ücret tahsil edilmez ve abonelik istenildiği zaman herhangi bir yükümlülük olmaksızın iptal edilebilir. Bu sürenin sona ermesinin ardından yapılacak olan ilk ödeme, kullanıcının onayı ile gerçekleşmiş sayılır.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">3. Abonelik İptali</h2>
                        <p>Kullanıcılar, "Ayarlar &gt; Abonelik" sayfası üzerinden istedikleri zaman aboneliklerini iptal edebilirler. İptal işlemi, o anki fatura döneminin sonuna kadar kullanım hakkını devam ettirir, ancak bir sonraki dönem için yeni bir tahsilat yapılmaz.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">4. Teknik Hatalar ve Kesintiler</h2>
                        <p>Sistem kaynaklı ağır bir teknik hata veya hizmetin sunulmasını engelleyen süreklilik arz eden kesintiler durumunda, iade talepleriniz ekibimiz tarafından titizlikle değerlendirilir. Haklı bulunan talepler, Paddle üzerinden 7 iş günü içinde işleme alınacaktır.</p>
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
