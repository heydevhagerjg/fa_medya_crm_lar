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

### 8. Ödeme Sistemi (Paddle) Ayarları
Proje, abonelik ve plan limitleri için **Paddle** kullanır. `.env` dosyanıza Paddle anahtarlarınızı ekleyin. 

> [!TIP]
> **En Güncel Paddle Sandbox Bilgisi:**
> - Sandbox API Key'leri `_sdbx` içerir.
> - Client-side Token'lar `test_` ile başlar.
> - Sandbox Seller ID, canlı hesaptan farklıdır.

```env
# Paddle Ayarları
PADDLE_SELLER_ID=your_seller_id_here
PADDLE_CLIENT_SIDE_TOKEN=your_client_side_token_here
PADDLE_API_KEY=your_api_key_here
PADDLE_SANDBOX=true # Test için true yapın
```

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
