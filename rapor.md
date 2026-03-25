# 📊 Famedya CRM - Proje Analiz Raporu

## 1. Proje Türü ve Amacı

**Famedya CRM**, dijital ajanslar, yazılım ofisleri ve müşteri & proje yönetimine ihtiyaç duyan her işletme için tasarlanmış modern, **çok kiracılı (multi-tenant) Müşteri İlişkileri Yönetim (CRM) sistemidir.** Finansal ve operasyonel süreçleri tek bir birleşik platformda toplar.

**Temel Kullanım Alanları:**
- Müşteri ve proje yönetimi
- Finansal takip (faturalar, ödemeler, giderler)
- Randevu ve takvim yönetimi
- Hizmet teslimat takibi
- Müşteriye özel teklif yönetimi (müşteri portalı)
- Rol tabanlı erişim kontrolü ile ekip işbirliği
- Yedekleme/geri yükleme ve veri aktarımı

---

## 2. Teknoloji Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Backend Framework** | Laravel (PHP) | 12.0 |
| **PHP Versiyonu** | PHP | ^8.2+ |
| **Frontend Framework** | React | 19.2.4 |
| **Build Aracı** | Vite | 7.0.0 |
| **CSS Framework** | Tailwind CSS | 4.2.1 |
| **UI Bileşenleri** | Headless UI | 2.2.9 |
| **İkonlar** | Lucide React | 0.576.0 |
| **State Yönetimi** | Zustand | 5.0.11 |
| **Veri Çekme** | Axios + React Query (TanStack) | 1.13.6 + 5.90.21 |
| **Routing** | React Router | 7.13.1 |
| **Animasyonlar** | Framer Motion | 12.34.5 |
| **Bildirimler** | React Hot Toast | 2.6.0 |
| **Sürükle & Bırak** | dnd-kit | 6.3.1 |
| **Tarih İşleme** | date-fns | 4.1.0 |
| **Veritabanı** | MySQL 8+ / PostgreSQL | — |
| **Ödeme** | Paddle (Laravel Cashier) | 2.8 |
| **Dosya Yükleme** | AWS S3 / Cloudflare R2 (Flysystem) | — |
| **PDF Oluşturma** | DomPDF | 3.1 |
| **Görsel İşleme** | Intervention Image | 1.5 |
| **Yedekleme** | Spatie Backup | 10.2 |
| **Yetkilendirme** | Spatie Permission | 7.2 |
| **API Kimlik Doğrulama** | Laravel Sanctum | 4.3 |

**Mimari:** Ayrıştırılmış SPA + RESTful API
- Backend yalnızca API olarak çalışır (`routes/api.php`)
- Frontend, Blade şablonu üzerinden sunulan tek sayfalık (SPA) React uygulamasıdır (`app.blade.php`)

---

## 3. Dizin Yapısı

```
app/
├── Http/Controllers/
│   ├── Admin/              (Yedekleme, Kiracı yönetimi vb.)
│   └── Api/
│       ├── AuthController, CustomerController, JobController, PaymentController
│       ├── ExpenseController, AppointmentController, ProposalController
│       └── Settings/       (Hizmet, Rol, İzin yönetimi vb.)
├── Models/                 (35+ model)
├── Jobs, Mail, Services, Traits, Observers, Providers
│
resources/
├── js/
│   ├── pages/              (DashboardPage, CustomersPage, JobsPage vb.)
│   ├── components/
│   │   ├── layout/         (DashboardLayout, AdminLayout)
│   │   └── ui/             (Modal, Pagination, PlanRestrictionView)
│   ├── stores/             (useAuthStore, useAdminStore, useThemeStore)
│   ├── lib/                (api.js - Axios sarmalayıcı, utils.js)
│   ├── App.jsx             (Ana routing + ProtectedRoute/PublicRoute)
│   └── main.jsx            (React giriş noktası)
├── css/
│   └── app.css             (Tailwind imports + özel animasyonlar)
└── views/
    ├── app.blade.php       (Ana SPA şablonu)
    ├── emails/             (E-posta şablonları)
    └── pdf/                (PDF şablonları)

routes/
├── web.php                 (SPA catch-all route)
├── api.php                 (Kapsamlı REST API)
└── console.php
```

---

## 4. UI Katmanı

### Blade Şablonları
- **`app.blade.php`** — Ana SPA şablonu (`<div id="root">` React kök elementi, Vite entegrasyonu, Paddle ödeme scripti)
- **`emails/`** — İşlem e-posta şablonları
- **`pdf/`** — PDF oluşturma şablonları

### React Sayfaları (23+ sayfa)

| Kategori | Sayfalar |
|----------|----------|
| **Çekirdek İş** | DashboardPage, CustomersPage, CustomerDetailPage, JobsPage, JobDetailPage, PaymentsPage, ExpensesPage, ProposalsPage |
| **Özellikler** | AppointmentsPage, ServiceTrackingPage, KanbanPage, FilesPage, BackupPage |
| **Kimlik Doğrulama** | LoginPage, RegisterPage |
| **Admin** | AdminLoginPage, AdminTenantsPage, AdminPackagesPage, AdminSettingsPage, AdminBackupPage |
| **Pazarlama** | LandingPage, PricingPage, TermsOfServicePage, RefundPolicyPage, PrivacyPolicyPage |
| **Ayarlar** | SettingsPage, ProfilePage, ApiDocsPage, LogsPage |

### CSS ve Stil

- **Framework:** Tailwind CSS 4 (Vite eklentisi ile sıfır runtime CSS)
- **Tema Sistemi:**
  - Karanlık mod desteği (`.dark` sınıf stratejisi)
  - Zustand `useThemeStore` ile tema geçişi
  - `localStorage`'a (`crm-theme`) kaydedilir
- **Renkler:**
  - Primary: `#905efc` (mor)
  - Success: `#1ED2A7` (teal)
  - Dark Arkaplan: `#0A0A0A` (bg-gray-950)
- **Yazı Tipi:** Plus Jakarta Sans (Google Fonts)
- **Özel Animasyonlar:**
  - `animate-pulse-yellow-soft` — Yumuşak sarı parıltı (6+ saat uyarısı)
  - `animate-pulse-yellow-hard` — Sert sarı nabız (<6 saat)
  - `animate-pulse-red-hard` — Kırmızı alarm (<1,5 saat veya gecikmiş)

### Bileşen Kütüphaneleri

| Kütüphane | Kullanım |
|-----------|----------|
| **Headless UI** | Erişilebilir UI primitifleri (Combobox, Listbox vb.) |
| **Lucide Icons** | 580+ SVG ikon |
| **React Hot Toast** | Sağ üst bildirim toastları |
| **Framer Motion** | Sayfa geçişleri ve animasyonlar |

---

## 5. Temel Modeller / Varlıklar (35 model)

| Model | Açıklama |
|-------|----------|
| **User** | Ekip üyesi kimlik doğrulama ve yetkilendirme |
| **Admin** | Sistem yönetimi için süper admin |
| **Tenant** | Çok kiracılı izolasyon (şirket/hesap) |
| **Customer** | Müşteri kişisi (ad, telefon, e-posta, notlar) |
| **JobCrm** | Durum, fiyatlandırma ve özel alanlara sahip proje/görev |
| **JobStep** | Bir iş içindeki iş akışı adımları (alt görevler) |
| **JobStatus** | İş durum kategorileri |
| **Service** | Hizmet teklifleri (özel alanlarla birlikte) |
| **CustomField / CustomFieldValue** | Hizmet başına dinamik alanlar |
| **Proposal** | Müşteri teklifi (kalemler ve taksitler) |
| **ProposalInstallment** | Teklifler için ödeme takvimi |
| **Payment** | Gelir takibi |
| **Expense** | Harcama takibi |
| **CashRegister** | Finansal işlemler için kasa/hesap |
| **Appointment** | Urgency durumlarına sahip takvim etkinliği |
| **ServiceTracking** | Tekrarlayan hizmet takibi (örn. aylık bakım) |
| **Workflow** | Otomasyon kuralları |
| **ActivityLog** | Tüm kullanıcı eylemlerinin denetim kaydı |
| **ApiKey** | Harici entegrasyonlar için API kimlik doğrulaması |
| **Package** | Abonelik planları (admin) |
| **TenantBackup** | Veritabanı yedekleme kayıtları |
| **Role / Permission** | Spatie Permission ile RBAC |

---

## 6. Route'lar ve Controller'lar

### Web Route'ları (`routes/web.php`)
```php
Route::get('/{any?}', ...) → view('app')  // SPA catch-all
```

### API Route'ları (`routes/api.php`) — RESTful

**Genel Erişim:**
- `POST /auth/register`, `POST /auth/login`
- `GET /auth/packages`
- `GET /public/proposals/{uuid}` — Müşteri teklif görünümü
- `POST /public/proposals/{uuid}/respond` — Müşteri onayı

**Korumalı Endpoint'ler (Sanctum):**

| Kaynak | Endpoint |
|--------|----------|
| Müşteriler | `/customers` |
| İşler | `/jobs`, `/jobs/{id}/steps`, `/jobs/{id}/files` |
| Ödemeler | `/payments` |
| Giderler | `/expenses` |
| Teklifler | `/proposals` |
| Randevular | `/appointments` |
| Hizmet Takibi | `/service-trackings` |
| Dosyalar | `/files` |
| Ayarlar | `/settings/services`, `/settings/users`, `/settings/roles` vb. |
| Yedekleme | `/settings/backup/*` |
| Dashboard | `/dashboard/stats` |

---

## 7. UI Desenleri ve Tema

### Tasarım Sistemi

| Özellik | Değer |
|---------|-------|
| **Birincil Renk** | `#905efc` (mor) |
| **Başarı Rengi** | `#1ED2A7` (teal) |
| **Uyarı/Hata** | Turuncu / Kırmızı |
| **Yazı Tipi** | Plus Jakarta Sans, 14px taban |
| **Köşe Yarıçapı** | xl / 2xl / 3xl / 4xl özel değerler |

### Etkileşim Desenleri

| Desen | Uygulama |
|-------|----------|
| **Sidebar Navigasyon** | Daraltılabilir, izin tabanlı menü filtreleme |
| **Tema Geçişi** | Güneş/Ay ikonu, anlık karanlık mod |
| **Veri Tabloları** | Sayfalandırılmış listeler, sıralama/filtreleme |
| **Modallar** | URL tabanlı durum (`/jobs/{id}?modal=steps`) |
| **Yan Paneller** | Sağdan kayan düzenleme çekmecesi |
| **Kanban Tahtası** | dnd-kit ile sürükle-bırak sütunlar |
| **Takvim** | Aciliyet tabanlı renk durumlarına sahip etkileşimli takvim |
| **Toast Bildirimleri** | Sağ üst köşe, 3 saniyelik süre |
| **Yükleme Durumları** | Skeleton yükleyiciler, spinner katmanlar |
| **İzin Bazlı UI** | İzin yoksa menü öğeleri gizlenir |

### Randevu Aciliyet Sistemi

| Durum | Görsel |
|-------|--------|
| >6 saat | Beyaz arka plan (normal) |
| 1,5 – 6 saat | Yumuşak sarı parıltı nabzı |
| <1,5 saat veya gecikmiş | Kırmızı uyarı nabzı |

---

## 8. Ek Özellikler

| Özellik | Durum |
|---------|-------|
| Sanctum token tabanlı API kimlik doğrulaması | ✅ |
| Spatie Permission ile RBAC | ✅ |
| Türkçe arayüz (tr-TR tarih/para birimi biçimi) | ✅ |
| Tam karanlık mod desteği (kalıcı) | ✅ |
| React Query ile gerçek zamanlı güncellemeler | ✅ |
| JSON şifreli yedekleme/geri yükleme | ✅ |
| AWS S3 / Cloudflare R2 bulut depolama | ✅ |
| DomPDF ile PDF oluşturma | ✅ |
| Paddle entegrasyonu (SaaS abonelik) | ✅ |
| Tam etkinlik denetim kaydı | ✅ |
| Yerleşik API dokümantasyonu sayfası | ✅ |
| Çok kiracılı veri izolasyonu | ✅ |
