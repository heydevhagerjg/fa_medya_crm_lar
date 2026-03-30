import { Link } from 'react-router-dom'
import {
    ArrowUpRight,
    BarChart3,
    BellRing,
    Bot,
    CalendarCheck2,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    CreditCard,
    Database,
    FileCheck2,
    Files,
    Gauge,
    Layers3,
    LifeBuoy,
    ShieldCheck,
    Sparkles,
    TimerReset,
    TrendingUp,
    Users,
    Workflow,
    Wrench,
    ArrowRight,
} from 'lucide-react'
import PublicSiteShell from '../components/public/PublicSiteShell.jsx'

export default function LandingPage() {
    const modules = [
        {
            title: 'Müşteri 360 ve Segment',
            desc: 'Tüm geçmiş, notlar, gelir potansiyeli ve son temas bilgisi tek profilde birleşir.',
            icon: Users,
            tone: 'from-[#0f766e]/20 to-[#0f766e]/5 text-[#0f766e] border-[#0f766e]/20',
        },
        {
            title: 'Pipeline ve Süreç Motoru',
            desc: 'Durum bazlı otomasyon, görev dağıtımı ve SLA takibi ile ekibiniz tek ritimde çalışır.',
            icon: Workflow,
            tone: 'from-[#2563eb]/20 to-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/20',
        },
        {
            title: 'Randevu ve Saha Planlama',
            desc: 'Harita destekli rota, ekip uygunluğu ve kaynak planı tek takvimde senkronize olur.',
            icon: CalendarCheck2,
            tone: 'from-[#0ea5e9]/20 to-[#0ea5e9]/5 text-[#0284c7] border-[#0ea5e9]/20',
        },
        {
            title: 'Teklif, Sözleşme ve Dosya',
            desc: 'Onay akışları, versiyonlama ve imza süreci tek iş kartından yönetilir.',
            icon: Files,
            tone: 'from-[#b45309]/20 to-[#b45309]/5 text-[#b45309] border-[#b45309]/20',
        },
        {
            title: 'Tahsilat ve Finans Kontrolü',
            desc: 'Gelir-gider trendleri, geciken ödemeler ve kasa hareketleri anlık görünür.',
            icon: CreditCard,
            tone: 'from-[#16a34a]/20 to-[#16a34a]/5 text-[#15803d] border-[#16a34a]/20',
        },
        {
            title: 'Güvenlik, API ve Yedek',
            desc: 'Rol bazlı yetki, denetim kaydı, bulut yedek ve API kontrolleri tek panelde.',
            icon: ShieldCheck,
            tone: 'from-[#7c3aed]/20 to-[#7c3aed]/5 text-[#7c3aed] border-[#7c3aed]/20',
        },
    ]

    const stats = [
        { label: 'Aktif İş Kaydı', value: '12.4K', icon: Layers3 },
        { label: 'Aylık İşlem Hacmi', value: '2.1M', icon: TrendingUp },
        { label: 'Ortalama Yanıt Süresi', value: '4.8dk', icon: Clock3 },
        { label: 'Veri Yedek Başarısı', value: '%99.98', icon: Database },
    ]

    const flows = [
        {
            title: 'Müşteri Talebi Alınır',
            detail: 'Form, WhatsApp, telefon veya API talepleri tek havuza düşer.',
            icon: BellRing,
        },
        {
            title: 'Otomatik Görev ve Atama',
            detail: 'Kurala dayalı atama ile doğru ekip, doğru işi anında alır.',
            icon: Bot,
        },
        {
            title: 'Saha ve Finans Kapanış',
            detail: 'İş tamamlanır, teklif/ödeme kapanır, raporlar otomatik güncellenir.',
            icon: CircleDollarSign,
        },
    ]

    const trustItems = [
        { icon: FileCheck2, text: 'ISO uyumlu operasyon disiplini' },
        { icon: TimerReset, text: '7/24 izlenebilir log altyapısı' },
        { icon: LifeBuoy, text: 'Canlı onboarding ve teknik destek' },
    ]

    return (
        <PublicSiteShell activePage="landing">
            <section className="relative overflow-hidden rounded-[2rem] border border-[#c9c1b3] bg-[#fffaf2] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] sm:p-10">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-16 right-0 h-56 w-56 rounded-full bg-[#0f766e]/20 blur-3xl" />
                    <div className="absolute bottom-2 left-[-60px] h-44 w-44 rounded-full bg-[#0ea5e9]/20 blur-3xl" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,118,110,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,118,110,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
                </div>

                <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#99f6e4] bg-[#ccfbf1] px-4 py-1 text-xs font-black uppercase tracking-[0.19em] text-[#0f766e]">
                            <Sparkles size={14} /> Modern CRM Workspace
                        </div>
                        <h1 className="max-w-3xl text-4xl font-black leading-[1.06] text-[#0f172a] sm:text-6xl">
                            CRM değil,
                            <span className="mt-1 block text-[#0f766e]">işinizin canlı komuta merkezi.</span>
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-[#475569]">
                            {import.meta.env.VITE_APP_NAME}; satış, operasyon ve finans ekiplerini tek ritimde çalıştırır. Her talep,
                            her görev ve her ödeme aynı akışta görünür; kararlarınız rapora değil canlı veriye dayanır.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-7 py-4 text-base font-black text-white shadow-xl shadow-[#0f172a]/25 transition-transform hover:-translate-y-0.5 hover:bg-black">
                                Ücretsiz Deneme Başlat <ArrowUpRight size={17} />
                            </Link>
                            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0f766e]/30 bg-[#ecfeff] px-7 py-4 text-base font-black text-[#0f766e] transition-colors hover:bg-[#cffafe]">
                                Paketleri Karşılaştır <ArrowRight size={17} />
                            </Link>
                        </div>

                        <div className="mt-7 grid gap-2 text-sm font-semibold text-[#334155] sm:grid-cols-3">
                            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Kurulum 15 dakikada</span>
                            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Kredi kartı gerekmez</span>
                            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0f766e]" /> Canlı destek dahildir</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[#d8d2c7] bg-white/95 p-5 shadow-2xl shadow-[#0f172a]/10">
                        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#d8d2c7] bg-[#f8fafc] px-4 py-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#64748b]">Canlı Dashboard</p>
                                <p className="text-lg font-black text-[#0f172a]">Bugün 48 aktif süreç</p>
                            </div>
                            <Gauge className="text-[#0f766e]" size={22} />
                        </div>
                        <div className="space-y-3 rounded-2xl bg-[#0f172a] p-4 text-white">
                            {[
                                { label: 'Yeni Müşteri Talebi', owner: 'Satış', value: '12' },
                                { label: 'Saha Randevusu', owner: 'Operasyon', value: '27' },
                                { label: 'Tahsilat Bekleyen', owner: 'Finans', value: '9' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                    <div>
                                        <p className="text-sm font-bold">{item.label}</p>
                                        <p className="text-xs text-slate-300">{item.owner}</p>
                                    </div>
                                    <p className="rounded-lg bg-white/10 px-2 py-1 text-sm font-black">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-[#d8d2c7] bg-[#faf7f1] p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">Aylık Tahsilat</p>
                                <p className="mt-1 text-xl font-black text-[#0f172a]">₺1.94M</p>
                                <p className="text-xs font-semibold text-[#15803d]">+%24 Büyüme</p>
                            </div>
                            <div className="rounded-2xl border border-[#d8d2c7] bg-[#eff6ff] p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">SLA Uyum</p>
                                <p className="mt-1 text-xl font-black text-[#0f172a]">%97.2</p>
                                <p className="text-xs font-semibold text-[#2563eb]">Hedef üstü</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-[#d8d2c7] bg-white/80 p-5 backdrop-blur-sm">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f766e]/10 text-[#0f766e]">
                            <item.icon size={18} />
                        </div>
                        <p className="text-2xl font-black text-[#0f172a]">{item.value}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">{item.label}</p>
                    </article>
                ))}
            </section>

            <section className="mt-20" id="moduller">
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f766e]">Modül Ekosistemi</p>
                        <h2 className="mt-2 text-3xl font-black text-[#0f172a] sm:text-4xl">Parça parça değil, bütünsel çalışan modüller</h2>
                    </div>
                    <p className="max-w-xl text-sm font-semibold leading-relaxed text-[#64748b]">
                        Ziyaretçi kaydından kapanışa kadar tüm adımlar tek veri katmanı üzerinden ilerler; ekip değişse de bağlam kaybolmaz.
                    </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((module) => (
                        <article key={module.title} className="group rounded-3xl border border-[#d8d2c7] bg-[#fffdf8] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0f172a]/10">
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${module.tone}`}>
                                <module.icon size={22} />
                            </div>
                            <h3 className="text-xl font-black text-[#0f172a]">{module.title}</h3>
                            <p className="mt-3 text-sm font-medium leading-relaxed text-[#475569]">{module.desc}</p>
                            <div className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#0f766e] opacity-0 transition-opacity group-hover:opacity-100">
                                Modülü Keşfet <ArrowRight size={14} />
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mt-20 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start" id="guvence">
                <article className="rounded-[2rem] border border-[#0f766e]/30 bg-[#0f766e] p-8 text-white shadow-2xl sm:p-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Smart Workflow Canvas</p>
                    <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Müşteri yolculuğu bir bakışta, ekip yönetimi tek ekranda.</h2>
                    <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-emerald-100">
                        Zoho benzeri görünürlük, Bitrix benzeri ekip koordinasyonu ama daha sade bir operasyon diliyle.
                        Her departman aynı karttan çalışır, tekrar eden işler otomatik akar.
                    </p>
                    <div className="mt-7 space-y-3">
                        {flows.map((flow) => (
                            <div key={flow.title} className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
                                <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                                    <flow.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-black">{flow.title}</p>
                                    <p className="text-xs font-medium text-emerald-100">{flow.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-[2rem] border border-[#d8d2c7] bg-[#fffaf2] p-6 shadow-xl sm:p-8">
                    <p className="inline-flex items-center gap-2 rounded-full bg-[#ede9fe] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#6d28d9]">
                        <Wrench size={14} /> Operasyon Araçları
                    </p>
                    <h3 className="mt-4 text-2xl font-black text-[#0f172a]">Ekibinizin günlük komuta paneli</h3>
                    <div className="mt-6 space-y-3">
                        {[
                            { icon: BarChart3, title: 'Canlı KPI Takibi', text: 'Pipeline, tahsilat ve ekip verimi tek tabloda.' },
                            { icon: CalendarCheck2, title: 'Randevu Senkronu', text: 'Ekip ve kaynak çakışmaları otomatik engellenir.' },
                            { icon: ShieldCheck, title: 'Yetki ve Güvenlik', text: 'Rol bazlı erişim ve denetim kaydı standart gelir.' },
                        ].map((item) => (
                            <div key={item.title} className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f172a]/5 text-[#0f172a]">
                                    <item.icon size={17} />
                                </div>
                                <p className="text-sm font-black text-[#0f172a]">{item.title}</p>
                                <p className="mt-1 text-xs font-medium text-[#64748b]">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-16 rounded-[2rem] border border-[#d8d2c7] bg-white p-6 sm:p-8">
                <div className="grid gap-4 md:grid-cols-3">
                    {trustItems.map((item) => (
                        <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-[#eef2f7] bg-[#f8fafc] p-4">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f766e]/10 text-[#0f766e]">
                                <item.icon size={18} />
                            </div>
                            <p className="text-sm font-bold text-[#334155]">{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-20 overflow-hidden rounded-[2rem] border border-[#d8d2c7] bg-[#0f172a] p-8 text-center text-white sm:p-12">
                <div className="pointer-events-none absolute" />
                <div className="mx-auto max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Launch Fast. Scale Smart.</p>
                    <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Ekibinizi dağınık ekranlardan kurtarın.</h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-slate-300">
                        14 günlük denemeyi başlatın, canlı datanızla ilk gün KPI panosunu kurun, ikinci gün operasyon akışını otomatiğe alın.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#14b8a6] px-8 py-4 text-base font-black text-[#042f2e] transition-colors hover:bg-[#2dd4bf]">
                            Hemen Başla <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-transparent px-8 py-4 text-base font-bold text-slate-200 transition-colors hover:border-cyan-300 hover:text-cyan-200">
                            Mevcut Hesapla Giriş
                        </Link>
                    </div>
                </div>
            </section>
        </PublicSiteShell>
    )
}
