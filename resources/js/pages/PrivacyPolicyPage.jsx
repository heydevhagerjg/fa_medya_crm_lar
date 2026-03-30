import { Lock } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function PrivacyPolicyPage() {
    return (
        <LegalPageTemplate icon={Lock} title="Gizlilik Politikasi" updatedAt="19 Mart 2026" activePage="privacy">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Veri Toplama</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME}, kayit sirasinda adiniz, e-posta adresiniz gibi temel bilgileri toplar. Ayrica hizmetin sunulabilmesi icin tarafinizca yuklenen musteri verileri, dosyalar ve randevu kayitlari gibi is verileri saklanir.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Bu veriler yalnizca sizin yetkiniz dahilinde ve platformun duzgun calismasi icin kullanilir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Veri Isleme ve Amac</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Toplanan veriler; kullanici deneyimini iyilestirmek, teknik sorunlari cozumlemek, musteri taleplerine yanit vermek ve yasal yukumlulukleri yerine getirmek amaciyla islenir. Veriler pazarlama amaciyla ucuncu taraflara satilmaz.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. Odeme Verileri</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kredi karti bilgileriniz dogrudan Paddle.com odeme altyapisi tarafindan islenir. Veritabanimizda kart bilgileri tutulmaz; sadece odeme onay bilgisi ve fatura detaylari saklanir.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Paddle, PCI-DSS uyumlu guvenli bir odeme sistemidir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. Haklariniz</h2>
                <p className="text-sm leading-relaxed text-[#475569]">KVKK ve GDPR kapsaminda verilerinizin silinmesini, guncellenmesini veya kopyalanmasini talep etme hakkina sahipsiniz. Hesabinizi sildiginizde, yasal olarak tutulmasi gereken veriler disindakiler kalici olarak silinir.</p>
            </section>
        </LegalPageTemplate>
    )
}
