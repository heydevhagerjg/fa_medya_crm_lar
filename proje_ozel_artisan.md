# Proje Özel Artisan Komutları

Bu dosya, projenin ihtiyaçları doğrultusunda sonradan eklenen özel artisan komutlarını ve kullanım detaylarını içerir.

---

## 🚀 İnteraktif Firma İçe Aktarım (Custom Import)
Bu komut, büyük boyutlu yedekleme dosyalarını (ZIP) terminal üzerinden **interaktif** bir şekilde (kullanıcıya sorarak) sisteme yüklemek için kullanılır.

### 🔌 Komut
```bash
php artisan custom:import
```

### 📋 Nasıl Kullanılır?
Komutu çalıştırdığınızda sistem size şu soruları soracaktır:
1. **Dosya Yolu**: Yedek ZIP dosyasının bilgisayarınızdaki tam yolu (Örn: `C:\yedek.zip`).
2. **Firma İsmi**: Yeni firmanın (Tenant) adı.
3. **Yönetici Bilgileri**: Firma için bir admin hesabı oluşturmak üzere (Ad Soyad, E-posta, Şifre).
4. **Paket Seçimi**: Sistemde yüklü paketler listelenir, birinin ID numarasını girmeniz istenir.

**Özellikleri:**
- Nginx/Tarayıcı limitlerine takılmaz (600 MB+ dosyalar için idealdir).
- S3 bağlantısını otomatik atar.
- ZIP içindeki verileri import ederken kullanıcıları temizler, ancak sonunda sizin girdiğiniz admin hesabını oluşturur.

---

## 🛠️ Temizlik ve Bakım Komutları

### Atık Dosya Temizliği
`CleanupTrash.php`:
```bash
php artisan app:cleanup-trash
```
*   **İşlevi:** Sistemdeki silinmiş/geçersiz geçici dosyaları S3'ten temizler.

---

## 💎 Diğer Özel Komutlar
*   `php artisan app:auto-backup-tenants`: Tüm firmaların yedeğini sırayla S3'e yükler.
*   `php artisan app:global-tenant-backup`: Global sistem yedeği oluşturur.
