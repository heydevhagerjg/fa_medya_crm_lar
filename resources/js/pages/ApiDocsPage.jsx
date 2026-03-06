import { FileCode, Shield, Users, Briefcase, CreditCard, Settings, Calendar, ListChecks, FileText, Database, Activity, Code, Terminal, Key, Info, LayoutDashboard, Share2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ApiDocsPage() {
    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500 rounded-xl text-white">
                            <FileCode size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Özel API Dokümantasyonu
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                        Famedya CRM altyapısını dış sistemlerle entegre etmek için oluşturduğunuz API anahtarlarını nasıl kullanacağınızı ve yeteneklerini buradan öğrenebilirsiniz.
                    </p>
                </div>
                <Link to="/settings/api-keys" className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all">
                    <Key size={18} /> API Anahtarlarını Yönet
                </Link>
            </div>

            {/* QUICK START / CORE INFO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                            <Key size={160} />
                        </div>
                        <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield size={24} className="text-indigo-500" /> API Anahtarı ile Yetkilendirme
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Ayarlar sayfasından oluşturduğunuz API anahtarını kullanırken, her isteğin header bölümüne <code>X-Api-Key</code> parametresini eklemelisiniz.
                            Bu yöntem, standart Bearer token sisteminden bağımsız çalışır ve statik entegrasyonlar için idealdir.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">HTTP Header Örneği</div>
                                <code className="text-sm font-mono text-pink-600 dark:text-pink-400 break-all">
                                    X-Api-Key: fa_live_589e0df4e86c43be...
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/50 to-purple-600/50" />
                        <div className="relative">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                                <Activity size={24} /> API Temel Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <div className="text-xs font-bold text-indigo-100/60 uppercase tracking-widest mb-2">Base URL</div>
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 font-mono text-sm border border-white/10">
                                        {window.location.origin}/api
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-indigo-100/60 uppercase tracking-widest mb-2">İçerik Tipi</div>
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 font-mono text-sm border border-white/10">
                                        application/json
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-3xl">
                        <h4 className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm mb-3">
                            <AlertTriangle size={18} /> Granüler İzinler
                        </h4>
                        <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed space-y-2">
                            API anahtarlarınız <strong>"Fine-grained Access Control"</strong> sistemine sahiptir. Bir anahtar sadece izin verdiğiniz modüllerde ve verdiğiniz aksiyonlarda çalışır.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {['read', 'write', 'update', 'delete'].map(action => (
                                <div key={action} className="px-2 py-1 bg-white dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase text-center">
                                    {action}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl h-full flex flex-col justify-center">
                        <h4 className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm mb-3">
                            <Info size={18} /> Güvenlik Notu
                        </h4>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                            API anahtarlarınızı asla frontend kodlarınızda (JavaScript/React) paylaşmayın. Her zaman sunucu taraflı iletişim tercih edin.
                        </p>
                    </div>
                </div>
            </div>

            {/* ENDPOINT CATEGORIES */}
            <div className="grid grid-cols-1 gap-12 mt-12 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800">

                {/* 1. DASHBOARD & STATS */}
                <section>
                    <SectionHeader icon={LayoutDashboard} color="blue" title="Dashboard & İstatistik" />
                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/dashboard/stats"
                            label="Genel İstatistikler"
                            desc="İş sayıları, ödeme toplamları ve aktiflik durumlarını döner."
                            perm="dashboard:read"
                        />
                    </div>
                </section>

                {/* 2. AUTH & USER */}
                <section>
                    <SectionHeader icon={Shield} color="purple" title="Kullanıcı İşlemleri (Auth)" />
                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/auth/me"
                            label="Profil Bilgileri"
                            desc="Anahtarın bağlı olduğu kullanıcı bilgilerini döner."
                            perm="auth:read"
                        />
                        <EndpointItem
                            method="PATCH"
                            path="/auth/profile"
                            label="Profil Güncelle"
                            desc="Kullanıcı adı ve e-posta bilgilerini günceller."
                            perm="auth:update"
                            req={`{\n  "name": "Yeni İsim",\n  "email": "api-user@mail.com"\n}`}
                        />
                    </div>
                </section>

                {/* 3. CUSTOMER MANAGEMENT */}
                <section>
                    <SectionHeader icon={Users} color="indigo" title="Müşteri Yönetimi" />
                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/customers"
                            label="Müşteri Listesi"
                            desc="Tüm müşterileri getirir (Sayfalama: ?page=1)."
                            perm="customers:read"
                        />
                        <EndpointItem
                            method="POST"
                            path="/customers"
                            label="Yeni Müşteri"
                            desc="Sisteme yeni bir müşteri kaydı ekler."
                            perm="customers:write"
                            req={`{\n  "name": "Müşteri Adı",\n  "phone": "05...",\n  "email": "test@mail.com"\n}`}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <EndpointItem method="GET" path="/customers/{id}" label="Müşteri Detay" perm="customers:read" />
                            <EndpointItem method="PUT" path="/customers/{id}" label="Düzenle" perm="customers:update" />
                        </div>
                    </div>
                </section>

                {/* 4. JOB & PROJECTS */}
                <section>
                    <SectionHeader icon={Briefcase} color="orange" title="İş / Proje Yönetimi" />
                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/jobs"
                            label="İş Listesi"
                            desc="Tüm işleri listeler."
                            perm="jobs:read"
                        />
                        <EndpointItem
                            method="POST"
                            path="/jobs"
                            label="Yeni İş Oluştur"
                            desc="Müşteriye bağlı profesyonel iş kaydı oluşturur."
                            perm="jobs:write"
                            req={`{\n  "customerId": 1,\n  "title": "API Entegrasyonu",\n  "totalPrice": 5000\n}`}
                        />
                        <EndpointItem method="GET" path="/jobs/{id}" label="İş Detayı" perm="jobs:read" />
                    </div>
                </section>

                {/* 5. FINANS SECTION */}
                <section>
                    <SectionHeader icon={CreditCard} color="emerald" title="Finansal İşlemler" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tahsilatlar</h4>
                            <EndpointItem method="GET" path="/payments" label="Liste" perm="finance:read" />
                            <EndpointItem method="POST" path="/payments" label="Ekle" perm="finance:write" req={`{\n  "jobId": 1,\n  "amount": 2000,\n  "cashRegisterId": 1\n}`} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Giderler</h4>
                            <EndpointItem method="GET" path="/expenses" label="Liste" perm="expenses:read" />
                            <EndpointItem method="POST" path="/expenses" label="Ekle" perm="expenses:write" />
                        </div>
                    </div>
                </section>

                {/* 6. FILES & DOCUMENTS */}
                <section>
                    <SectionHeader icon={FileText} color="rose" title="Dosya Yönetimi" />
                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/files"
                            label="Dosya Listesi"
                            desc="Yüklenmiş dosyaların listesi."
                            perm="files:read"
                        />
                        <EndpointItem
                            method="POST"
                            path="/files"
                            label="Dosya Yükle"
                            desc="Yeni bir dosya yükler (multipart/form-data)."
                            perm="files:write"
                        />
                    </div>
                </section>

                {/* CODE EXAMPLES */}
                <div className="pt-12 border-t border-gray-100 dark:border-gray-800">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8">Hızlı Kod Örnekleri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <Terminal size={18} /> cURL
                            </div>
                            <div className="bg-gray-950 rounded-[2rem] p-6 shadow-2xl ring-1 ring-white/10">
                                <pre className="text-sm font-mono text-indigo-300 leading-relaxed overflow-x-auto">
                                    {`curl -X GET "${window.location.origin}/api/jobs" \\
  -H "X-Api-Key: SİZİN_API_ANAHTARINIZ" \\
  -H "Content-Type: application/json"`}
                                </pre>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <Code size={18} /> JavaScript
                            </div>
                            <div className="bg-gray-950 rounded-[2rem] p-6 shadow-2xl ring-1 ring-white/10">
                                <pre className="text-sm font-mono text-emerald-300 leading-relaxed overflow-x-auto">
                                    {`fetch('${window.location.origin}/api/jobs', {
  headers: {
    'X-Api-Key': 'SİZİN_API_ANAHTARINIZ'
  }
}).then(res => res.json())`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SectionHeader({ icon: Icon, title, color }) {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-500',
        indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500',
        rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
    }
    return (
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className={`p-3 rounded-2xl ${colors[color]}`}>
                <Icon size={28} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{title}</h2>
        </div>
    )
}

function EndpointItem({ method, path, label, desc, req, perm }) {
    return (
        <div className="p-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl transition-all hover:border-indigo-500/30 group">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider 
                            ${method === 'GET' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                                method === 'POST' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                    method === 'PUT' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                        method === 'PATCH' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' :
                                            'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}
                        >
                            {method}
                        </span>
                        <code className="text-[13px] font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/5 px-2.5 py-1 rounded-xl border border-pink-100 dark:border-pink-500/10">
                            /api{path}
                        </code>
                        {perm && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <Share2 size={12} /> {perm}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-base font-bold text-gray-900 dark:text-white">{label}</div>
                        {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
                    </div>
                </div>
            </div>
            {req && (
                <div className="mt-6">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Parametreler (JSON)</div>
                    <div className="bg-gray-950 rounded-2xl p-5 overflow-x-auto ring-1 ring-white/10 shadow-inner">
                        <pre className="text-xs text-green-400/90 font-mono leading-relaxed">
                            {req}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    )
}
