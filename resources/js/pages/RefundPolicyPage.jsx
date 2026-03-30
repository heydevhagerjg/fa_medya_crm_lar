import { CreditCard } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function RefundPolicyPage() {
    return (
        <LegalPageTemplate icon={CreditCard} title="İade Politikası" updatedAt="19 Mart 2026" activePage="terms">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Hizmetin Niteliği</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME} internet üzerinden sunulan bir yazılım hizmetidir (Software as a Service - SaaS). Platforma erişim abonelik modeli ile sağlanır.
                    {import.meta.env.VITE_APP_NAME} üzerinden yapılan tüm ödemeler, ödeme altyapı sağlayıcımız olan Paddle tarafından tahsil edilir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Paddle bu işlemlerde Merchant of Record olarak görev yapar ve ödeme, faturalandırma, vergi ve iade süreçlerini yönetir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Ücretsiz Deneme Süresi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Yeni kullanıcılar platformu test edebilmek için <strong>14 gün ücretsiz deneme</strong> süresinden yararlanabilir. Deneme süresi boyunca herhangi bir ücret tahsil edilmez.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanıcılar deneme süresi sona ermeden önce aboneliklerini iptal edebilir. Bu durumda ücretlendirme yapılmaz.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. İade Politikası</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Deneme süresi sona erdikten sonra abonelik ücretli döneme geçer ve ödeme Paddle üzerinden tahsil edilir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">İlk ödeme sonrasında kullanıcılar <strong>3 gün</strong> içinde iade talebinde bulunabilir. Bu sürede yapılan talepler Paddle üzerinden işleme alınır ve ödeme kullanılan ödeme yöntemine geri gönderilir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">3 günlük iade süresi sonrasında yapılan ödemeler iade edilmez.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. Abonelik İptali</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanıcılar istedikleri zaman aboneliklerini hesap ayarları üzerinden iptal edebilir. İptal sonrasında mevcut fatura dönemi sonuna kadar hizmet kullanılabilir, ancak bir sonraki dönem için tahsilat yapılmaz.</p>
            </section>
        </LegalPageTemplate>
    )
}
