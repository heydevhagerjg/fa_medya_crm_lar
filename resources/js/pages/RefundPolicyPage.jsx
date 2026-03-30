import { CreditCard } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function RefundPolicyPage() {
    return (
        <LegalPageTemplate icon={CreditCard} title="Iade Politikasi" updatedAt="19 Mart 2026" activePage="terms">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Hizmetin Niteligi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME} internet uzerinden sunulan bir yazilim hizmetidir (Software as a Service - SaaS). Platforma erisim abonelik modeli ile saglanir.
                    {import.meta.env.VITE_APP_NAME} uzerinden yapilan tum odemeler, odeme altyapi saglayicimiz olan Paddle tarafindan tahsil edilir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Paddle bu islemlerde Merchant of Record olarak gorev yapar ve odeme, faturalandirma, vergi ve iade sureclerini yonetir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Ucretsiz Deneme Suresi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Yeni kullanicilar platformu test edebilmek icin <strong>14 gun ucretsiz deneme</strong> suresinden yararlanabilir. Deneme suresi boyunca herhangi bir ucret tahsil edilmez.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanicilar deneme suresi sona ermeden once aboneliklerini iptal edebilir. Bu durumda ucretlendirme yapilmaz.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. Iade Politikasi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Deneme suresi sona erdikten sonra abonelik ucretli doneme gecer ve odeme Paddle uzerinden tahsil edilir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Ilk odeme sonrasinda kullanicilar <strong>3 gun</strong> icinde iade talebinde bulunabilir. Bu surede yapilan talepler Paddle uzerinden isleme alinir ve odeme kullanilan odeme yontemine geri gonderilir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">3 gunluk iade suresi sonrasinda yapilan odemeler iade edilmez.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. Abonelik Iptali</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanicilar istedikleri zaman aboneliklerini hesap ayarlari uzerinden iptal edebilir. Iptal sonrasinda mevcut fatura donemi sonuna kadar hizmet kullanilabilir, ancak bir sonraki donem icin tahsilat yapilmaz.</p>
            </section>
        </LegalPageTemplate>
    )
}
