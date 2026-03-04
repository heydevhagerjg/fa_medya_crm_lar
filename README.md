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

---

*Geliştiren: Fa Medya*
