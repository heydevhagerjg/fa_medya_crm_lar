import { FileCode, Shield, Users, Briefcase, CreditCard, Settings } from 'lucide-react'

export default function ApiDocsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileCode className="text-indigo-500" />
                    API Dokümantasyonu
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Famedya CRM'in arka ucunda çalışan temel API servislerini nasıl kullanacağınıza dair yöntem ve parametre bilgileri.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="prose prose-indigo dark:prose-invert max-w-none">
                    <p className="mb-6">
                        Uygulamanın genel bir özelliği olarak yetki gerektiren her rotada <strong>Bearer Token</strong> gönderilmesi zorunludur.
                    </p>

                    {/* Auth Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            <Shield className="text-purple-500" size={24} /> 1. Yetkilendirme (Auth) İşlemleri
                        </h2>
                        <p className="mb-4">Öncelikle sisteme giriş (Login) yapıp API rotalarını kullanabilmek için size ait benzersiz bir Token çekmeniz gereklidir. Gelen bu Token'i bir sonraki tüm sorgularda Header'a (<code>Authorization: Bearer BURAYA_TOKEN</code>) yerleştirmeyi unutmayın.</p>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kayıt Ol (Register)</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Seçtiğiniz plana/kiralama durumuna göre sıfırdan sistemde bir şirket/proje profili oluşturur.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/auth/register</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "name": "Şirketim LTD.",
  "email": "yonetim@sirketim.com",
  "password": "GucluSifre123"
}`}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Giriş Yap (Login)</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Oluşturulan veya varolan kullanıcı adı ve şifreyle sisteme giriş yapmayı dener.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/auth/login</code>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">İstek (Request)</div>
                                        <div className="bg-gray-950 rounded-lg p-4 h-full overflow-x-auto">
                                            <pre className="text-sm text-green-400 font-mono">
                                                {`{
  "email": "yonetim@sirketim.com",
  "password": "GucluSifre123"
}`}
                                            </pre>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Başarılı Yanıt (Response 200)</div>
                                        <div className="bg-gray-950 rounded-lg p-4 h-full overflow-x-auto">
                                            <pre className="text-sm text-blue-400 font-mono">
                                                {`{
  "user": {
      "id": 1,
      "name": "Şirketim Yetkili",
      "email": "yonetim@sirketim.com"
  },
  "token": "4|u87a..."
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customers Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            <Users className="text-blue-500" size={24} /> 2. Müşteri (Customer) Yönetimi
                        </h2>
                        <p className="mb-4">Firmanıza kayıtlı kullanıcı veya kurum profil (Müşteri/Firma) kartlarını kontrol edebildiğiniz noktalardır.</p>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tüm Müşterileri Getir</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Mevcut müşterileri sayfalar halinde JSON listesi biçiminde getirir.</p>
                                <div className="flex gap-2 mb-3 items-center flex-wrap">
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">GET</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/customers</code>
                                    <span className="text-sm text-gray-500">?page=1&per_page=10 (Opsiyonel)</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Yeni Müşteri Oluştur</h3>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/customers</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "type": "individual", // veya "corporate"
  "name": "Ahmet Yılmaz", // veya firma adı
  "email": "iletisim@ahmet.com",
  "phone": "+905554443322",
  "tax_number": "1234567890", // zorunlu değil
  "address": "İstanbul, Türkiye"
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Jobs Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            <Briefcase className="text-orange-500" size={24} /> 3. İş (Job, Proje) Yönetimi
                        </h2>
                        <p className="mb-4">Sistemdeki müşterilere bağladığınız aktif ya da tamamlanmış tüm çalışma ve servis paketlerini barındırır.</p>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Yeni İş Ekleme</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Sistemde önceden kurulu olan bir Hizmeti (<code>service_id</code>) var olan bir Müşteriye (<code>customer_id</code>) atar.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/jobs</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "customer_id": 14,
  "service_id": 2, // Yazılım, SEO vb. hizmet id'si
  "title": "E-Ticaret Web Sitesi",
  "total_price": 45000,
  "start_date": "2026-04-01",
  "end_date": "2026-05-15",
  "status_id": 1 // Statü: Başlamadı / Devam Ediyor vb.
}`}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">İş Durumunu Değiştirme</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Sadece statüyü (Tamamlandı, İptal vs) güncel tutmak için kullanılır.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-500 text-xs font-bold rounded">PATCH</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/jobs/{"{id}"}/status</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "status_id": 3
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finans Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            <CreditCard className="text-emerald-500" size={24} /> 4. Finans (Ödemeler & Giderler)
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Yeni Tahsilat Ekle (Gelir)</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Müşterinin işinin fiyatı üzerinden yapılan parçalı ya da tam tahsilatları girmenizi sağlar.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/payments</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "job_id": 25,
  "amount": 15000,
  "payment_type": "kredi_karti", // 'nakit', 'havale', 'kredi_karti'
  "payment_date": "2026-03-04",
  "cash_register_id": 1, // Kasa bağlantısı (Örn: İş Bankası TR12)
  "description": "Ön peşinat ödemesi"
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            <Settings className="text-gray-600 dark:text-gray-400" size={24} /> 5. Ayarlar ve Güvenlik İşlemleri
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AWS S3 Ayarlarını Güncelle</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Firma dosyalarını ve CRM yedeklerini sunucu yerine S3'e yüklemek isteyen kiracıların AWS (vey Cloudflare R2 vs.) yetkilendirme bilgisini günceller.</p>
                                <div className="flex gap-2 mb-3 items-center">
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-500 text-xs font-bold rounded">PUT</span>
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/settings/tenant</code>
                                </div>
                                <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-sm text-green-400 font-mono">
                                        {`{
  "aws_access_key_id": "AKIA...",
  "aws_secret_access_key": "M5Xv...",
  "aws_region": "eu-central-1",
  "aws_bucket_name": "famedya-backups-bucket"
}`}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tüm Yedeği Al (Export) & Verileri Sıfırla (Reset)</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Şirketinizin tüm müşteri, proje, dosya, rapor, log ve faturalarını sistemden yedek olarak çekebilir veya komple sistemi sıfırlayabilirsiniz.</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">GET</span>
                                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/settings/backup/export</code>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">POST</span>
                                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400">/api/settings/backup/reset</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
