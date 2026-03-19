# FA Medya CRM - Sıfır Kurulum Rehberi

Bu proje, bir Laravel 12.x tabanlı, çok kiracılı (Multi-tenant) CRM sistemidir. Aşağıdaki adımları sırasıyla takip ederek projeyi sıfırdan kurabilir ve çalıştırabilirsiniz.

## 🛠 Gereksinimler

Kuruluma başlamadan önce sisteminizde şunların yüklü olduğundan emin olun:
- **PHP 8.2 veya üzeri** (Önerilen: Herd veya Valet)
- **Composer** (PHP paket yöneticisi)
- **Node.js & NPM** (Frontend varlık yönetimi için)
- **MySQL veya MariaDB**

---

## 🚀 Hızlı Kurulum Adımları

### 1. Dosyaları Hazırlayın
Proje klasörüne terminal (PowerShell veya CMD) ile girin.

### 2. PHP Bağımlılıklarını Yükleyin
```bash
composer install
```

### 3. Frontend Bağımlılıklarını Yükleyin
```bash
npm install
```

### 4. Ortam Değişkenlerini Ayarlayın
`.env.example` dosyasını kopyalayıp `.env` olarak kaydedin:
```bash
cp .env.example .env
```
Ardından uygulama anahtarını (App Key) oluşturun:
```bash
php artisan key:generate
```

### 5. Veritabanını Yapılandırın
1. Bilgisayarınızda (HeidiSQL, phpMyAdmin veya terminal üzerinden) **`fa_medya_crm`** isminde bir boş veritabanı oluşturun.
2. `.env` dosyasını açın ve veritabanı ayarlarını yapın:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=fa_medya_crm
   DB_USERNAME=root
   DB_PASSWORD=
   ```

### 6. Migrasyon ve Seed (Veritabanı Başlatma)
Tabloları oluşturun ve varsayılan verileri (paketler, roller vb.) yükleyin:
```bash
php artisan migrate --seed
```
*Not: Eğer tablo hatası alırsanız `php artisan migrate:fresh --seed` komutunu kullanabilirsiniz.*

### 7. Storage (Dosya Sistemi) Bağlantısı
Resim ve dökümanların görüntülenebilmesi için link oluşturun:
```bash
php artisan storage:link
```

### 8. Ödeme Sistemi (Paddle v2) Ayarları

Proje, abonelik ve plan limitleri için **Paddle Billing (v2)** kullanır. Aşağıdaki adımları sırasıyla uygulayarak sistemi aktif hale getirin:

#### A. Dashboard Ayarları (Sandbox/Live)
1. **Developer Tools > Authentication** kısmından API Key ve Client-side Token oluşturun.
2. **Developer Tools > Notifications** kısmına gidin ve yeni bir **Webhook** (Notification Destination) ekleyin.
   - **URL:** `https://alanadiniz.com/paddle/webhook` (Lokal test için **Ngrok** adresi kullanmalısınız).
   - **Events:** En az şu olayları seçin:
     - `transaction.completed` (Ödemeler için kritik)
     - `subscription.created`
     - `subscription.updated`
     - `subscription.cancelled`
3. Eklediğiniz Webhook'un içine girerek en alttaki **Notification Secret** (pdl_ntf_...) değerini kopyalayın.

#### B. .env Yapılandırması
`.env` dosyanıza kopyaladığınız anahtarları ekleyin:

```env
# Paddle Temel Bilgiler (Sandbox için _sdbx ve test_ ile başlar)
PADDLE_SANDBOX=true # Canlıda false yapın
PADDLE_SELLER_ID=your_seller_id
PADDLE_CLIENT_SIDE_TOKEN=test_your_client_token
PADDLE_API_KEY=your_api_key_sdbx

# Webhook Doğrulaması (Kritik: Boş kalırsa abonelik aktifleşmez)
PADDLE_WEBHOOK_SECRET=pdl_ntf_your_secret_from_dashboard

# Uygulama Linki (Ödeme sonrası dönüş için)
FRONTEND_URL=https://alanadiniz.com
```

> [!IMPORTANT]
> **Önemli Not:** Paddle v2'de `Price ID`'ler `pri_` ile başlar. Veritabanındaki `packages` tablosundaki `paddle_price_id` alanlarının kullandığınız ortama (Sandbox veya Live) ait doğru Price ID'ler olduğundan emin olun.


---

## 💻 Çalıştırma

### Uygulamayı Başlatın
Yerel sunucuyu başlatmak için (Eğer Herd/Valet kullanmıyorsanız):
```bash
php artisan serve
```

### Frontend'i Derleyin
Vite (React/Vue/CSS) varlıklarını canlı izlemek için:
```bash
npm run dev
```

---

## 💡 Bilinmesi Gereken Önemli Notlar

- **Abonelik Kontrolü:** Proje her firmanın (tenant) paket limitlerini kontrol eder. Eğer `paddle_customers` tablosu eksik olursa sistem hata verir. Kurulumdan sonra `php artisan migrate` yapmayı unutmayın.
- **Admin Girişi:** Eğer ilk kurulumda bir admin kullanıcısı oluşturmadıysanız, `DatabaseSeeder.php` dosyasını inceleyerek varsayılan verilerle giriş yapabilirsiniz.

Başarılar! 🚀
