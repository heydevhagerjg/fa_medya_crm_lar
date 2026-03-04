import { FileCode, Shield, Users, Briefcase, CreditCard, Settings, Calendar, ListChecks, FileText, Database, Activity } from 'lucide-react'

export default function ApiDocsPage() {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <FileCode className="text-indigo-500" size={32} />
                        API Dokümantasyonu
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                        Famedya CRM altyapısını dış sistemlerle entegre etmek veya mobil uygulama üzerinden yönetmek için kullanabileceğiniz tüm endpoint listesi.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. AUTH SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                            <Shield className="text-purple-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">1. Yetkilendirme (Auth) & Profil</h2>
                    </div>

                    <div className="space-y-4">
                        <EndpointItem
                            method="POST"
                            path="/api/auth/login"
                            label="Giriş Yap"
                            desc="E-posta ve şifre ile token alır."
                            req={`{ "email": "...", "password": "..." }`}
                        />
                        <EndpointItem
                            method="POST"
                            path="/api/auth/register"
                            label="Kayıt Ol"
                            desc="Yeni bir kiracı/şirket profili oluşturur."
                            req={`{ "name": "...", "email": "...", "password": "..." }`}
                        />
                        <EndpointItem
                            method="GET"
                            path="/api/auth/me"
                            label="Profil Bilgileri"
                            desc="Giriş yapmış kullanıcının detaylarını döner."
                            auth
                        />
                        <EndpointItem
                            method="PATCH"
                            path="/api/auth/profile"
                            label="Profil Güncelle"
                            desc="Kullanıcı adı ve e-postasını değiştirir."
                            req={`{ "name": "Yeni İsim", "email": "yeni@mail.com" }`}
                            auth
                        />
                        <EndpointItem
                            method="POST"
                            path="/api/auth/change-password"
                            label="Şifre Değiştir"
                            req={`{ "current_password": "...", "password": "...", "password_confirmation": "..." }`}
                            auth
                        />
                    </div>
                </section>

                {/* 2. CUSTOMERS SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                            <Users className="text-blue-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">2. Müşteri (Customer) Yönetimi</h2>
                    </div>

                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/api/customers"
                            label="Müşteri Listesi"
                            desc="Tüm müşterileri getirir (Sayfalama: ?page=1)."
                            auth
                        />
                        <EndpointItem
                            method="POST"
                            path="/api/customers"
                            label="Yeni Müşteri"
                            req={`{ "type": "corporate|individual", "name": "...", "phone": "...", "email": "..." }`}
                            auth
                        />
                        <EndpointItem
                            method="GET"
                            path="/api/customers/{id}"
                            label="Müşteri Detayı"
                            desc="Müşterinin işleri ve ödemeleriyle beraber tüm detayını döner."
                            auth
                        />
                        <EndpointItem
                            method="PUT"
                            path="/api/customers/{id}"
                            label="Müşteri Düzenle"
                            auth
                        />
                        <EndpointItem
                            method="DELETE"
                            path="/api/customers/{id}"
                            label="Müşteri Sil"
                            auth
                        />
                    </div>
                </section>

                {/* 3. JOBS SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                            <Briefcase className="text-orange-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">3. İş (Job, Proje) Yönetimi</h2>
                    </div>

                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/api/jobs"
                            label="İş Listesi"
                            desc="Sistemdeki tüm işleri statüleriyle beraber getirir."
                            auth
                        />
                        <EndpointItem
                            method="POST"
                            path="/api/jobs"
                            label="Yeni İş Ekle"
                            req={`{ "customer_id": 1, "service_id": 2, "title": "...", "total_price": 5000 }`}
                            auth
                        />
                        <EndpointItem
                            method="PATCH"
                            path="/api/jobs/{id}/status"
                            label="Statü Güncelle"
                            desc="İşin sadece durumunu (Hazırlanıyor vs) değiştirir."
                            req={`{ "status_id": 3 }`}
                            auth
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <EndpointItem method="GET" path="/api/jobs/{id}" label="İş Detayı" auth />
                            <EndpointItem method="DELETE" path="/api/jobs/{id}" label="İşi Sil" auth />
                        </div>
                    </div>
                </section>

                {/* 4. APPOINTMENTS SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                            <Calendar className="text-rose-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">4. Randevu (Appointment) Yönetimi</h2>
                    </div>

                    <div className="space-y-4">
                        <EndpointItem
                            method="GET"
                            path="/api/appointments"
                            label="Randevuları Sırala"
                            desc="Takvimdeki aktivite ve görüşmeleri listeler."
                            auth
                        />
                        <EndpointItem
                            method="POST"
                            path="/api/appointments"
                            label="Randevu Planla"
                            req={`{ "customer_id": 1, "title": "...", "start_time": "2026-03-04 10:00", "status": "PENDING" }`}
                            auth
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <EndpointItem method="PUT" path="/api/appointments/{id}" label="Düzenle" auth />
                            <EndpointItem method="DELETE" path="/api/appointments/{id}" label="Sil" auth />
                            <EndpointItem method="GET" path="/api/settings/appointment-titles" label="Başlık Önerileri" auth />
                        </div>
                    </div>
                </section>

                {/* 5. FINANS SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                            <CreditCard className="text-emerald-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">5. Finans (Tahsilatlar & Giderler)</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Tahsilatlar (Gelir)</h4>
                                <EndpointItem
                                    method="POST"
                                    path="/api/payments"
                                    req={`{ "job_id": 1, "amount": 1000, "payment_type": "CASH", "cash_register_id": 1 }`}
                                    auth
                                />
                                <EndpointItem method="GET" path="/api/payments" auth />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Giderler (Expenses)</h4>
                                <EndpointItem
                                    method="POST"
                                    path="/api/expenses"
                                    req={`{ "title": "Kira", "amount": 5000, "category_id": 1, "cash_register_id": 1 }`}
                                    auth
                                />
                                <EndpointItem method="GET" path="/api/expenses" auth />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. ADVANCED SECTION */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <Settings className="text-gray-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">6. Gelişmiş Ayarlar & Sistem</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-700 dark:text-gray-300">
                                <Database size={16} className="text-indigo-500" /> Yedekleme
                            </h4>
                            <ul className="text-xs space-y-2 text-gray-500">
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">GET</code> /api/settings/backup/export</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">POST</code> /api/settings/backup/import</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">GET</code> /api/settings/backup/s3/list</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-700 dark:text-gray-300">
                                <ListChecks size={16} className="text-emerald-500" /> Tanımlamalar
                            </h4>
                            <ul className="text-xs space-y-2 text-gray-500">
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">POST</code> /api/settings/services</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">POST</code> /api/settings/statuses</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">POST</code> /api/settings/cash-registers</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-700 dark:text-gray-300">
                                <Activity size={16} className="text-amber-500" /> Sistem
                            </h4>
                            <ul className="text-xs space-y-2 text-gray-500">
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">GET</code> /api/logs (Aktivite Logları)</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">PUT</code> /api/settings/tenant (S3 Ayarları)</li>
                                <li><code className="bg-gray-50 dark:bg-gray-800 px-1">POST</code> /api/settings/api-keys</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

function EndpointItem({ method, path, label, desc, req, auth = false }) {
    return (
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all hover:border-indigo-500/30 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight 
                            ${method === 'GET' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                                method === 'POST' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                    method === 'PUT' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                        method === 'PATCH' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' :
                                            'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}
                        >
                            {method}
                        </span>
                        <code className="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/5 px-2 py-0.5 rounded-lg border border-pink-100 dark:border-pink-500/10">
                            {path}
                        </code>
                        {auth && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                                <Shield size={10} /> Bearer
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                        {desc && <span className="text-xs text-gray-500 dark:text-gray-400">— {desc}</span>}
                    </div>
                </div>
            </div>
            {req && (
                <div className="mt-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Örnek Parametreler (JSON)</div>
                    <div className="bg-gray-950 rounded-xl p-4 overflow-x-auto ring-1 ring-white/10 shadow-inner">
                        <pre className="text-[13px] text-green-400/90 font-mono leading-relaxed">
                            {req}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    )
}
