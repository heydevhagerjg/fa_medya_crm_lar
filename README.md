# Famedya CRM

Famedya CRM; dijital ajanslar, yazılım ofisleri ve genel müşteri-iş takibine ihtiyaç duyan her türlü işletme için baştan sona özenle hazırlanmış modern bir Müşteri İlişkileri Yönetimi (CRM) sistemidir. Tüm finansal ve operasyonel süreçlerinizi tek ekrandan verimli bir şekilde yönetebilmenizi sağlar.

## 🚀 Öne Çıkan Özellikler

Sisteme entegre ettiğimiz başlıca özellikler şunlardır:

- **Gelişmiş Dashboard:** Günlük iş istatistikleriniz, aylık gelir/gider bazında net kazancınız, bekleyen tahsilatlarınız hepsi tek bir ekranda derlenir. Ek olarak üst kısımdaki hızlı işlem menüsü sayesinde anında "Yeni İş", "Yeni Müşteri", "Yeni Tahsilat" gibi eylemleri tek tıkla başlatabilirsiniz.
- **Dinamik Hizmet ve Özel Alan (Custom Field) Yapısı:** 
  - Sunduğunuz her hizmete (Web Tasarım, SEO, Danışmanlık vb.) ayrı ayrı özel dinamik alanlar atayabilirsiniz.
  - İş detaylarında sağdan açılan şık bir yan panel aracılığıyla bu özel alanları doldurabilir, anında güncelleyebilirsiniz.
  - Eğer bir iş için o hizmete ait doldurulmamış özel alanlar varsa, sistem sizi küçük bir bildirim rozetiyle doğrudan işin içinde sayı vererek uyarır.
- **Müşteri ve İş Yönetimi:** 
  - Müşteri profillerini, iş durumlarını (Hazırlanıyor, İptal, Tamamlandı vb.) kolayca takip edin. 
  - Liste görünümlerinde en son eklenen müşterileriniz ve işleriniz (ID ve tarih sırasına göre) standart olarak en üstte yer alır; güncel verilere anında erişirsiniz.
- **Gelir ve Gider Takibi:** Şirketinize giren nakit/kredi kartı ödemeleri ve yaptığınız masrafları kasa bazlı olarak kategorize edin ve tutun.
- **Gelişmiş Randevu ve Takvim Yönetimi:**
  - **Dinamik Aciliyet (Urgency) Sistemi:** Dashboard üzerindeki randevular kalan sürelerine göre görsel olarak farklılaşır (>6 saat: Beyaz, <6 saat: Yumuşak Sarı Parlama, <1.5 saat: Hızlı Sarı Uyarı, Gecikmiş: Kırmızı Alarm).
  - **Kalıcı Takvim Görünümleri:** Takvimi "Bugün", "Bu Hafta" veya "Bu Ay" olarak filtreleyebilir, bu tercihinizi tarayıcı kapatılsa dahi koruyabilirsiniz.
  - **URL Tabanlı Modal Erişimi:** Her randevunun kendine özel bir URL kimliği vardır; sayfayı yenileseniz (F5) bile açık olan randevu düzenleme ekranı anında geri gelir.
  - **İnteraktif Navigasyon:** Randevuların içindeki müşteri isimlerine tıklayarak doğrudan müşteri detayına gidebilir, randevu listelerini "Bekleyenler Önce" olacak şekilde akıllıca sıralanmış halde görebilirsiniz.
- **Gelişmiş Yedekleme ve İmport Doğrulama Sistemi:** 
  - Ayarlar sayfasından veritabanınızı tüm dosyalarıyla beraber tek bir tıkla içeriğini eksiksiz koruyarak JSON formatında dışa aktarabilirsiniz.
  - Yedekten geri dönme işlemleri sırasında orijinalliği bozmamak adına orijinal kayıt ve güncellenme tarihleri (created_at, updated_at) tamamen korunur.
  - Yedeğin manipüle edilmesini veya farklı kişilerin kendi verilerini sisteminize yüklemesini engellemek için **"Özel İmport Key"** (İçe Aktarma Anahtarı) güvenlik duvarı mevcuttur. Çıkartılan her json dosyası size ait şifrelenmiş bir anahtar taşır ve veritabanıyla eşleşmeyen hiçbir veri içeri alınmaz. Bu key kayıtlarını ayarlar sayfasından şeffafça yönetebilirsiniz.
- **Özelleştirilebilir S3 Depolama:** Sisteme yüklediğiniz proje/müşteri dosyalarını direkt kendi AWS S3, Cloudflare R2 veya benzeri s3 uyumlu bulut platformlarınıza aktarabilirsiniz. Bunun için modüle ait Access Key ve Secret Key bilgilerini arayüzden girmeniz ve test etmeniz yeterli.
- **Multi-tenancy (Çoklu Kiracı):** Kurduğunuz tek bir sistem üstünden birbirinden tamamen izole şekilde farklı şirket ve şube hesapları barındırabilirsiniz.

## 🛠️ Kullanılan Teknolojiler

Proje, güncel web mimarileri kullanılarak tam performanslı olarak çalışacak biçimde inşa edildi:

- **Backend:** Laravel 12 (PHP 8.2+) tabanlı RESTful API.
- **Frontend:** React 19 ve Vite altyapılı SPA (Single Page Application).
- **Arayüz (UI) / Tasarım:** Modern bir görünüm için Tailwind CSS 4, Headless UI bileşenleri, Lucide ikon setleri ve React Hot Toast bildirimleri kullanıldı.
- **State & Veri Yönetimi:** Axios, Zustand ve tüm request trafiğimizi önbellekleyip optimize eden React Query (TanStack v5).
- **Database:** MySQL / PostgreSQL tam destekli.

## 📋 Sunucu Gereksinimleri

- **PHP:** ^8.2 veya üzeri
- **Node.js:** ^18.x npm ile
- **Veritabanı:** MySQL 8+, MariaDB veya PostgreSQL
- **PHP Eklentileri:** OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Fileinfo

## ⚙️ Kurulum Adımları

Projeyi kendi sunucunuza kolayca kurmak için şu adımları takip edin:

1. **Projeyi sunucunuza çekin ve klasöre girin:**
   ```bash
   git clone <repository-url>
   cd famedya-crm
   ```

2. **Backend (Laravel) paketlerini kurun ve ayar dosyasını (env) oluşturun:**
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Veritabanınızı PHPMyAdmin veya konsoldan oluşturduktan sonra içerideki `.env` dosyasına DB_ değerlerinizi girin. Sonra veritabanı tablolarını ayağa kaldırın:**
   ```bash
   php artisan migrate
   ```

4. **Frontend kütüphanelerini yükleyip projeyi derleyin:**
   ```bash
   npm install
   
   # Sistemi yayına (Canlı ortama / Prodüksiyona) hazırlamak için
   npm run build
   
   # Veya lokal bilgisayarınızda geliştirme yapmak / çalışmak isterseniz
   npm run dev
   ```

5. **PHP sunucusunu test amaçlı lokalden ayağa kaldırın:**
   ```bash
   php artisan serve
   ```
Artık ayarladığınız domain veya `localhost:8000` üzerinden sisteme giriş yapabilir, kiracılar oluşturabilir ve CRM'i arayüzünden kişiselleştirmeye başlayabilirsiniz.

### 🛠️ Plesk Laravel Toolkit ile Kurulum (Canlı Ortam)

Plesk panelinizde **Laravel Toolkit** eklentisi yüklüyse, projeyi yayına almak için şu adımları izleyin:

1.  **Git Bağlantısı:**
    *   Plesk panelinde alan adınızın altında **Git** veya **Laravel** ikonuna tıklayın.
    *   **Install Application** diyerek GitHub deponuzu bağlayın.
    *   **Public Directory** kısmını `public` olarak ayarlayın.

2.  **Ortam Değişkenleri (.env):**
    *   Laravel Toolkit arayüzünde **Environment** veya **Edit .env** kısmına gelin.
    *   Lokaldeki `.env` içeriğinizi buraya kopyalayın ve canlı ortam bilgilerine göre güncelleyin:
        *   `APP_ENV=production`
        *   `APP_DEBUG=false`
        *   `APP_URL=https://siteniz.com`
        *   `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` bilgilerini Plesk'te oluşturduğunuz veri tabanına göre girin.

3.  **Composer ve Veritabanı:**
    *   Toolkit arayüzünde **Install** butonuna basarak `composer install` çalıştırın.
    *   **Run Artisan Command** kısmından şu komutları sırayla çalıştırın:
        *   `key:generate` (Anahtar yoksa)
        *   `migrate --force` (Tabloları oluşturur)
        *   `storage:link` (Dosya erişimi için)

4.  **Frontend Build (Kritik Adım):**
    *   Proje React+Vite yapısında olduğu için sunucuda derlenmesi gerekir.
    *   Plesk **Terminal** aracını açın veya SSH ile bağlanıp ana dizinde şu komutları çalıştırın:
        ```bash
        npm install
        npm run build
        ```
    *   Bu işlem sonunda `public/build` klasörü oluşacak ve arayüz erişilebilir hale gelecektir.

### ⏱️ Otomatik Yedekleme İçin Cron Job (Zamanlanmış Görev) Kurulumu

Sistemin AWS S3'e tenant bazlı tam otomatik yedeklerini ("Örn: her gece saat 03:00'te") arka planda alabilmesi için sunucunuzda Laravel zamanlayıcısını (Scheduler) aktif etmeniz gerekmektedir.

**Standart Linux/Ubuntu Sunucular (SSH ile):**
Terminalden `crontab -e` komutunu çalıştırın ve en alta şu satırı ekleyin:
```bash
* * * * * cd /projenin/bulundugu/dizin && php artisan schedule:run >> /dev/null 2>&1
```

**Plesk Panel Üzerinden (SSH Erişimi Olmayanlar İçin):**
1. Plesk panelinizde ilgili alan adının ayarlarından **Zamanlanmış Görevler (Scheduled Tasks)** bölümüne girin.
2. **Görev Ekle (Add Task)** butonuna basın.
3. **Görev Türü (Task type):** `PHP betiğini çalıştır (Run a PHP script)` olarak seçin.
4. **Betik Yolu (Script path):** Projenizin içindeki `artisan` dosyasını seçin veya yazın (Örn: `httpdocs/famedya-crm/artisan` veya `httpdocs/artisan`).
5. **Bağımsız Değişkenlerle (with arguments):** Kutuya `schedule:run` yazın.
6. **Çalıştırma zamanı (Run):** `Cron stiline göre (Cron style)` seçeneğini seçip kutuya `* * * * *` yazın ve kaydedin.
7. _Önemli: Kuyruk komutunun da dönmesi için aynı adımlarla yeni bir görev daha ekleyin (Fakat argüman kısmına `queue:work --stop-when-empty` yazarak her 1 veya 5 dakikada çalışmasını sağlayın)._

Kısa Aşama;

- Bir PHP komut dosyasını çalıştır
- domain.com/artisan / schedule:run
- Cron stili : * * * * *

## 📡 API Uç Noktaları (Endpoints)

Sistemdeki temel API rotaları aşağıdaki gibidir. Bütün rotalar (public auth haricinde) Sanctum token'ı ile çalışır.

### 🔐 Kimlik Doğrulama (Auth)
| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| **POST** | `/auth/register` | Yeni kullanıcı/kiracı kaydı oluşturur. |
| **POST** | `/auth/login` | Sisteme giriş yapar ve token döner. |
| **GET** | `/auth/me` | Giriş yapmış kullanıcının profil bilgilerini getirir. |
| **POST** | `/auth/logout` | Mevcut oturumu kapatır (token silinir). |

### 📊 Temel Çekirdek Modüller (Dashboard, İşler, Müşteriler)
| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| **GET** | `/dashboard/stats` | Dashboard üzerindeki gelişmiş istatistik verilerini getirir. |
| **GET/POST/PUT** | `/customers` | Müşterileri listeler, detaylarını getirir, düzenler. |
| **GET/POST/PUT** | `/jobs` | Sistemdeki iş kayıtlarını listeler ve düzenler. |
| **GET/POST/PUT** | `/appointments` | Randevuları listeler, detaylarını getirir ve yönetir. |
| **PATCH** | `/jobs/{id}/status` | Sadece belirli bir işin durumunu günceller. |
| **POST/PATCH** | `/steps` | İşler için belirlenen adım/workflow oluşturur veya durum günceller. |
| **GET** | `/files` | Sisteme yüklenmiş tüm dosya eklerini getirir. |
| **POST/DELETE** | `/jobs/{id}/files` | İşe özel dosya ekler veya mevcut dosyayı siler. |

### 💰 Finans (Tahsilat & Masraf)
| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| **GET/POST/PUT** | `/payments` | Ödeme ve tahsilat işlemlerini yönetir. |
| **GET/POST/PUT** | `/expenses` | Masraf / gider eklentilerini yönetir. |

### ⚙️ Ayarlar & Sistem (Yedekler, S3, Tanımlamalar)
| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| **GET** | `/logs` | Sistemde yapılan tüm işlemlerin geçmiş aktivite logunu listeler. |
| **GET** | `/settings/backup/export` | Sistemin veritabanı yedeğini JSON olarak indirir ve S3'e kaydeder. |
| **POST** | `/settings/backup/import` | İmzalanmış JSON yedek dosyasından sistemi geri yükler. |
| **GET** | `/settings/backup/s3/list` | Buluttaki mevcut (önceki) yedekleri listeler. |
| **POST** | `/settings/backup-keys` | Özel İmport Key veritabanı şifreleri ekler. |
| **GET/POST/PUT** | `/settings/services` | Dinamik hizmetleri ve hizmet özel alanlarını ayarlardan yönetir. |
| **GET/POST/PUT** | `/settings/statuses` | İşler için kullanılan etiketleri ve durumları (Hazırlanıyor vs) yönetir. |
| **PUT** | `/settings/tenant` | Güncel kiracı / AWS S3 depolama ayarlarını kaydeder. |
| **POST** | `/settings/tenant/test` | Girilen AWS S3 depolama ayarlarını test eder. |

---

*Geliştiren: Fa Medya*
