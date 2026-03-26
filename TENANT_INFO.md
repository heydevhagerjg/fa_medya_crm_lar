# Firma Bilgileri Depolama - tenants Tablosu

## Tablo Yapısı

```sql
CREATE TABLE tenants (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- İşletme/Firma Adı (Company Name)
    slug VARCHAR(255) UNIQUE,                -- URL-friendly slug
    email VARCHAR(255);                      -- Kurumsal E-posta ✨ NEW
    phone VARCHAR(20);                       -- Telefon Numarası ✨ NEW
    address TEXT;                            -- İşletme Adresi ✨ NEW
    website VARCHAR(255);                    -- Web Sitesi URL ✨ NEW
    logo VARCHAR(255);                       -- Logo URL (S3)
    storage_used BIGINT DEFAULT 0,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Test Verisi

| Alan | Değer |
|------|-------|
| ID | `test-tenant-001` |
| Name | FA Medya Yazılım Çözümleri |
| Email | iletisim@famedya.com |
| Phone | +90 (212) 555-1234 |
| Address | İstanbul, Türkiye |
| Website | https://www.famedya.com |
| Logo | (S3'te yüklenecek) |

## Seed Dosyaları

1. **TenantSeeder.php** - Otomatik seeder (Eloquent ORM kullanır)
2. **seed_tenant_data.sql** - SQL script (direkt insert)

## Kullanım

### Option 1: Laravel Seeder ile
```bash
php artisan db:seed --class=TenantSeeder
```

### Option 2: SQL Script ile
```bash
mysql -u root -p famedya_crm < database/seeders/seed_tenant_data.sql
```

### Option 3: API ile (Manual)
PUT `/api/settings/general-info`
```json
{
    "name": "FA Medya Yazılım Çözümleri",
    "email": "iletisim@famedya.com",
    "phone": "+90 (212) 555-1234",
    "address": "İstanbul, Türkiye",
    "website": "https://www.famedya.com"
}
```

