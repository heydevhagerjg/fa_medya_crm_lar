import { Link } from 'react-router-dom'
import {
    CalendarCheck2,
    Users,
    CreditCard,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Files,
    Database,
    Zap,
    Gauge,
    Boxes,
} from 'lucide-react'
import PublicSiteShell from '../components/public/PublicSiteShell.jsx'

export default function LandingPage() {
    const modules = [
        {
            title: 'Musteri 360 Panosu',
            desc: 'Musteri gecmisi, aktif isleri, notlari ve odeme durumu tek kartta gorunsun.',
            icon: Users,
            accent: 'bg-[#0f766e]/10 text-[#0f766e]',
        },
        {
            title: 'Saha Is Akislari',
            desc: 'Servis adimlarini kanban ile yonetin; ekibin hangi asamada oldugu anlik takip edilsin.',
            icon: Boxes,
            accent: 'bg-[#0ea5e9]/10 text-[#0ea5e9]',
        },
        {
            title: 'Randevu Planlama',
            desc: 'Takvim cakismalarini engelleyin, ekip ve kaynak planlamasini netlestirin.',
            icon: CalendarCheck2,
            accent: 'bg-[#2563eb]/10 text-[#2563eb]',
        },
        {
            title: 'Teklif ve Dosya Merkezi',
            desc: 'Teklifleri olusturun, PDF akisini yonetin, tum belgeleri guvenle arsivleyin.',
            icon: Files,
            accent: 'bg-[#b45309]/10 text-[#b45309]',
        },
        {
            title: 'Finans Kontrolu',
            desc: 'Tahsilat, gider ve kasa hareketlerini tek bakista gorup karar alin.',
            icon: CreditCard,
            accent: 'bg-[#16a34a]/10 text-[#16a34a]',
        },
        {
            title: 'Yedek ve Guvenlik',
            desc: 'Yetki modeli, API anahtari ve otomatik yedekleme ile veriyi koruyun.',
            icon: Database,
            accent: 'bg-[#7c3aed]/10 text-[#7c3aed]',
        },
    ]

    const highlights = [
        { label: 'Aktif Is Takibi', value: '10K+' },
        { label: 'Saha Operasyonu', value: '500+' },
        { label: 'Guvenli Yedek', value: '%100' },
        { label: 'Ortalama Verim', value: '%40' },
    ]

    return (
        <PublicSiteShell activePage="landing">
            <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#166534]">
                        <Zap size={14} /> Operasyon Odakli CRM
                    </div>
                    <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#0f172a] sm:text-6xl">
                        Ekibin Saha Islerini,
                        <span className="block text-[#0f766e]">Musteri Surecini ve Finansini</span>
                        Tek Merkezde Yonetin.
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#475569]">
                        {import.meta.env.VITE_APP_NAME}; servis, randevu, teklif, tahsilat ve dosya akislarini tek panelde toplar. Ekibiniz her adimi gecikmesiz gorur, siz de net raporla karar alirsiniz.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-7 py-4 text-base font-black text-white shadow-xl shadow-[#0f766e]/25 transition-colors hover:bg-[#115e59]">
                            Ucretsiz Denemeyi Baslat <ArrowRight size={18} />
                        </Link>
                        <Link to="/pricing" className="inline-flex items-center justify-center rounded-2xl border border-[#c9c1b3] bg-[#faf7f1] px-7 py-4 text-base font-bold text-[#334155] transition-colors hover:border-[#0f766e] hover:text-[#0f766e]">
                            Paketleri Incele
                        </Link>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-4 text-sm font-semibold text-[#475569]">
                        <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Kredi karti olmadan baslangic</span>
                        <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Hemen kurulum</span>
                        <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Roller ve yetkiler dahil</span>
                    </div>
                </div>

                <div className="rounded-4xl border border-[#d8d2c7] bg-[#faf7f1] p-5 shadow-xl shadow-[#334155]/10">
                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#d8d2c7] bg-white px-4 py-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">Canli Operasyon</p>
                            <p className="text-lg font-black text-[#0f172a]">Bugun 37 aktif is</p>
                        </div>
                        <Gauge className="text-[#0f766e]" size={22} />
                    </div>
                    <div className="space-y-3 rounded-2xl bg-[#0f172a] p-4 text-white">
                        {[
                            { step: 'Kayit Acildi', team: 'Saha Ekibi A', eta: '09:30' },
                            { step: 'Parca Bekleniyor', team: 'Teknik Ofis', eta: '11:10' },
                            { step: 'Musteri Onayi', team: 'Finans', eta: '13:00' },
                        ].map((item) => (
                            <div key={item.step} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-sm font-bold">{item.step}</p>
                                <p className="text-xs text-slate-300">{item.team} • ETA {item.eta}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-[#d8d2c7] bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">Aylik Tahsilat</p>
                        <p className="mt-1 text-2xl font-black text-[#0f172a]">₺1.280.000</p>
                        <p className="text-xs font-semibold text-[#0f766e]">Gecen aya gore +%18</p>
                    </div>
                </div>
            </section>

            <section className="mt-20" id="moduller">
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f766e]">Modul Seti</p>
                        <h2 className="mt-2 text-3xl font-black text-[#0f172a] sm:text-4xl">Isin her adimi icin baglantili ekranlar</h2>
                    </div>
                    <p className="max-w-xl text-sm font-semibold leading-relaxed text-[#64748b]">Musteri kabulunden teklife, saha operasyonundan tahsilata kadar tum akislar birbirini besleyecek sekilde tasarlandi.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((module) => (
                        <article key={module.title} className="rounded-3xl border border-[#d8d2c7] bg-[#faf7f1] p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1">
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${module.accent}`}>
                                <module.icon size={22} />
                            </div>
                            <h3 className="text-xl font-black text-[#0f172a]">{module.title}</h3>
                            <p className="mt-3 text-sm font-medium leading-relaxed text-[#475569]">{module.desc}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mt-20 rounded-4xl border border-[#0f766e]/30 bg-[#0f766e] p-8 text-white shadow-xl sm:p-12" id="guvence">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Olceklenebilir Altyapi</p>
                        <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Hizli ekipler, guvenli veri, net raporlama.</h2>
                        <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-emerald-100">
                            Rol bazli erisim, bulut yedek, log takibi ve API altyapisi ile operasyon buyurken kontrol sizde kalir.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-100">
                            <ShieldCheck size={16} /> Standartlarda guvenlik
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {highlights.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                                <p className="text-3xl font-black">{item.value}</p>
                                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-100">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-20 rounded-4xl border border-[#d8d2c7] bg-[#faf7f1] p-8 text-center sm:p-12">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-3xl font-black text-[#0f172a] sm:text-5xl">Operasyonunuzu tek panelde toplama zamani.</h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-[#475569]">
                        14 gunluk deneme ile ekibinizi sisteme alin, canli surecleri gormeye hemen baslayin.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center rounded-2xl bg-[#0f766e] px-8 py-4 text-base font-black text-white shadow-lg shadow-[#0f766e]/25 hover:bg-[#115e59]">
                            Hemen Basla
                        </Link>
                        <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-[#c9c1b3] bg-white px-8 py-4 text-base font-bold text-[#334155] hover:border-[#0f766e] hover:text-[#0f766e]">
                            Mevcut Hesapla Giris
                        </Link>
                    </div>
                </div>
            </section>
        </PublicSiteShell>
    )
}
