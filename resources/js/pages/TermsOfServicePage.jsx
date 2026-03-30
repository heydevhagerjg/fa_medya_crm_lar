import { Shield } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function TermsOfServicePage() {
    return (
        <LegalPageTemplate icon={Shield} title="Kullanım Koşulları" updatedAt="19 Mart 2026" activePage="terms">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Hizmet Sağlayıcı</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME}, işletmeler için müşteri ilişkileri yönetimi (CRM), proje takibi ve finansal veri yönetimi sunan bir SaaS platformudur.
                    Hizmetler tamamen dijital ortamda sunulur ve fiziksel ürün teslimatı içermez.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME} hizmeti <strong>Fatih Ateş</strong> tarafından işletilmektedir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Hesap ve Güvenlik</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    Kullanıcılar, kayıt sırasında sağladıkları bilgilerin doğru ve güncel olmasından sorumludur. Hesap güvenliğinin sağlanması (şifre gizliliği ve hesap erişimi dahil) kullanıcının sorumluluğundadır.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Hesabınızın izinsiz kullanıldığını fark ettiğinizde derhal bizimle iletişime geçmeniz gerekir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. Abonelik ve Ödemeler</h2>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME} hizmetleri abonelik modeli ile sunulur.</p>
                <p className="text-sm leading-relaxed text-[#475569]">
                    Tüm ödemeler ödeme sağlayıcımız olan <strong>Paddle</strong> üzerinden tahsil edilir. Paddle bu işlemlerde <strong>Merchant of Record</strong> olarak görev yapar ve ödeme işlemleri, faturalandırma, vergi tahsilatı ve iade süreçlerini yönetir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Aboneliğinizi istediğiniz zaman hesap ayarlarınızdan iptal edebilirsiniz. İptal sonrasında mevcut fatura dönemi sonuna kadar hizmet kullanımı devam eder.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. İade Politikası</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Yeni kullanıcılar platformu test etmek için <strong>14 gün ücretsiz deneme</strong> süresinden yararlanabilir. Deneme süresi boyunca ücret tahsil edilmez.</p>
                <p className="text-sm leading-relaxed text-[#475569]">İlk ödeme sonrasında kullanıcılar <strong>3 gün</strong> içinde iade talebinde bulunabilir. İade talepleri Paddle üzerinden işleme alınır.</p>
                <p className="text-sm leading-relaxed text-[#475569]">3 günlük iade süresi sonrasında yapılan ödemeler iade edilmez.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">5. Veri Güvenliği</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanıcı verileri endüstri standartlarına uygun güvenlik önlemleri ile korunur. Veriler güvenli sunucularda saklanır ve düzenli yedekleme sistemleri ile korunur.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">6. Koşul Değişiklikleri</h2>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME}, bu kullanım koşullarını zaman zaman güncelleme hakkını saklı tutar. Güncellenmiş koşullar bu sayfada yayınlandığı tarihten itibaren geçerli olur.</p>
            </section>
        </LegalPageTemplate>
    )
}
