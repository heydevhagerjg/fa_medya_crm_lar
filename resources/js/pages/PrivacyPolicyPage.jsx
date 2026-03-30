import { Lock } from 'lucide-react'
import LegalPageTemplate from '../components/public/LegalPageTemplate.jsx'

export default function PrivacyPolicyPage() {
    return (
        <LegalPageTemplate icon={Lock} title="Gizlilik Politikası" updatedAt="19 Mart 2026" activePage="privacy">
            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">1. Veri Toplama</h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                    {import.meta.env.VITE_APP_NAME}, kayıt sırasında adınız, e-posta adresiniz gibi temel bilgileri toplar. Ayrıca hizmetin sunulabilmesi için tarafınızca yüklenen müşteri verileri, dosyalar ve randevu kayıtları gibi iş verileri saklanır.
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">Bu veriler yalnızca sizin yetkiniz dahilinde ve platformun düzgün çalışması için kullanılır.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">2. Veri İşleme ve Amaç</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Toplanan veriler; kullanıcı deneyimini iyileştirmek, teknik sorunları çözümlemek, müşteri taleplerine yanıt vermek ve yasal yükümlülükleri yerine getirmek amacıyla işlenir. Veriler pazarlama amacıyla üçüncü taraflara satılmaz.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">3. Ödeme Verileri</h2>
                <p className="text-sm leading-relaxed text-[#475569]">Kredi kartı bilgileriniz doğrudan Paddle.com ödeme altyapısı tarafından işlenir. Veritabanımızda kart bilgileri tutulmaz; sadece ödeme onay bilgisi ve fatura detayları saklanır.</p>
                <p className="text-sm leading-relaxed text-[#475569]">Paddle, PCI-DSS uyumlu güvenli bir ödeme sistemidir.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-black uppercase text-[#0f172a]">4. Haklarınız</h2>
                <p className="text-sm leading-relaxed text-[#475569]">KVKK ve GDPR kapsamında verilerinizin silinmesini, güncellenmesini veya kopyalanmasını talep etme hakkına sahipsiniz. Hesabınızı sildiğinizde, yasal olarak tutulması gereken veriler dışındakiler kalıcı olarak silinir.</p>
            </section>
        </LegalPageTemplate>
    )
}
