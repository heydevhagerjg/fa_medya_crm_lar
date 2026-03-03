# Famedya CRM

Famedya CRM, ajanslar ve işletmeler için modern, hızlı ve kullanıcı dostu bir müşteri ilişkileri yönetimi (CRM) sistemidir. Bu uygulama, müşterilerinizi, iş süreçlerinizi, ödemelerinizi ve masraflarınızı tek bir platformdan yönetmenize olanak tanır.

## 🚀 Özellikler

- **Gelişmiş Dashboard:** İş istatistiklerini, bekleyen ödemeleri ve güncel durumları anlık olarak takip edin.
- **Çoklu Kiracı (Multi-tenancy) Desteği:** Tek bir kurulum üzerinden birden fazla organizasyonu veya şubeyi birbirinden bağımsız olarak yönetin.
- **Müşteri Yönetimi:** Müşteri kayıtlarını oluşturun, detaylı bilgilerini saklayın ve tüm iş geçmişlerini görüntüleyin.
- **İş ve Proje Takibi:**
    - İş durumlarını (Hazırlanıyor, Onaylandı, Tamamlandı vb.) yönetin.
    - Her iş için özel adımlar (Workflow) ve görevler tanımlayın.
    - İş dosyalarını yükleyin ve organize edin.
- **Finansal Yönetim:**
    - **Ödemeler (Gelir):** Gelen ödemeleri kaydedin ve takip edin.
    - **Masraflar (Gider):** İşletme masraflarını kategorize edin ve raporlayın.
    - **Kasa Yönetimi:** Farklı kasa ve banka hesaplarını yönetin.
- **Sistem Özellikleri:**
    - **Rol ve Yetkilendirme:** Kullanıcılara farklı yetki seviyeleri tanımlayın.
    - **Aktivite Logları:** Sistem üzerindeki tüm işlemleri izleyin.
    - **Yedekleme ve Aktarma:** Verilerinizi dışa aktarın veya mevcut verilerinizi sisteme dahil edin.
    - **API Anahtarı:** Dış entegrasyonlar için güvenli API anahtarları oluşturun.

## 🛠️ Teknolojiler

- **Backend:** [Laravel 12](https://laravel.com/) (PHP 8.2+)
- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand), [React Query](https://tanstack.com/query/latest)
- **Database:** MySQL / PostgreSQL
- **Diğer:** Lucide Icons, Headless UI, React Hot Toast

## 📋 Gereksinimler

- **PHP:** ^8.2
- **Node.js:** ^18.x veya daha yeni
- **Composer:** PHP bağımlılıkları için
- **Veritabanı:** MySQL, MariaDB veya PostgreSQL
- **PHP Eklentileri:** OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, GD (Görsel işleme için)

## ⚙️ Kurulum

1. **Projeyi Klonlayın:**
   ```bash
   git clone <repository-url>
   cd famedya-crm
   ```

2. **PHP Bağımlılıklarını Yükleyin:**
   ```bash
   composer install
   ```

3. **Frontend Bağımlılıklarını Yükleyin:**
   ```bash
   npm install
   ```

4. **Ortam Dosyasını Yapılandırın:**
   `.env.example` dosyasını `.env` olarak kopyalayın ve veritabanı bilgilerinizi düzenleyin.
   ```bash
   cp .env.example .env
   ```

5. **Uygulama Anahtarını Oluşturun:**
   ```bash
   php artisan key:generate
   ```

6. **Veritabanı Migrasyonlarını Çalıştırın:**
   ```bash
   php artisan migrate
   ```

7. **Frontend Varlıklarını Derleyin:**
   ```bash
   # Geliştirme aşaması için
   npm run dev

   # Prodüksiyon aşaması için
   npm run build
   ```

8. **Sunucuyu Başlatın:**
   ```bash
   php artisan serve
   ```

---

*Geliştiren: Fa Medya*
