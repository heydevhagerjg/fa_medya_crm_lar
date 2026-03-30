import { Shield } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function TermsOfServicePage() {
    return (
        <LegalPageTemplate icon={Shield} title="Kullanim Kosullari" updatedAt="19 Mart 2026" activePage="terms">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Hizmet Saglayici</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME}, isletmeler icin musteri iliskileri yonetimi (CRM), proje takibi ve finansal veri yonetimi sunan bir SaaS platformudur.
                    Hizmetler tamamen dijital ortamda sunulur ve fiziksel urun teslimati icermez.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME} hizmeti <strong>Fatih Ates</strong> tarafindan isletilmektedir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Hesap ve Guvenlik</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    Kullanicilar, kayit sirasinda sagladiklari bilgilerin dogru ve guncel olmasindan sorumludur. Hesap guvenliginin saglanmasi (sifre gizliligi ve hesap erisimi dahil) kullanicinin sorumlulugundadir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Hesabinizin izinsiz kullanildigini fark ettiginizde derhal bizimle iletisime gecmeniz gerekir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. Abonelik ve Odemeler</h2>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME} hizmetleri abonelik modeli ile sunulur.</p>
                <p className="text-sm leading-relaxed text-[#475569]">
                    Tum odemeler odeme saglayicimiz olan <strong>Paddle</strong> uzerinden tahsil edilir. Paddle bu islemlerde <strong>Merchant of Record</strong> olarak gorev yapar ve odeme islemleri, faturalandirma, vergi tahsilati ve iade sureclerini yonetir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Aboneliginizi istediginiz zaman hesap ayarlarinizdan iptal edebilirsiniz. Iptal sonrasinda mevcut fatura donemi sonuna kadar hizmet kullanimi devam eder.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. Iade Politikasi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Yeni kullanicilar platformu test etmek icin <strong>14 gun ucretsiz deneme</strong> suresinden yararlanabilir. Deneme suresi boyunca ucret tahsil edilmez.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Ilk odeme sonrasinda kullanicilar <strong>3 gun</strong> icinde iade talebinde bulunabilir. Iade talepleri Paddle uzerinden isleme alinir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">3 gunluk iade suresi sonrasinda yapilan odemeler iade edilmez.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">5. Veri Guvenligi</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kullanici verileri endustri standartlarina uygun guvenlik onlemleri ile korunur. Veriler guvenli sunucularda saklanir ve duzenli yedekleme sistemleri ile korunur.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">6. Kosul Degisiklikleri</h2>
                <p className="text-sm leading-relaxed text-[#475569]">{import.meta.env.VITE_APP_NAME}, bu kullanim kosullarini zaman zaman guncelleme hakkini sakli tutar. Guncellenmis kosullar bu sayfada yayinlandigi tarihten itibaren gecerli olur.</p>
            </section>
        </LegalPageTemplate>
    )
}
