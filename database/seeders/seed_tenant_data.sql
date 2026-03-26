-- Tenant bilgilerini doğrudan ekle/güncelle
INSERT INTO tenants (
    id, 
    name, 
    slug, 
    email, 
    phone, 
    address, 
    website, 
    logo, 
    storage_used, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'test-tenant-001',
    'FA Medya Yazılım Çözümleri',
    'fa-medya-yazilim-cozumleri',
    'iletisim@famedya.com',
    '+90 (212) 555-1234',
    'İstanbul, Türkiye',
    'https://www.famedya.com',
    NULL,
    0,
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    name = 'FA Medya Yazılım Çözümleri',
    email = 'iletisim@famedya.com',
    phone = '+90 (212) 555-1234',
    address = 'İstanbul, Türkiye',
    website = 'https://www.famedya.com',
    is_active = 1,
    updated_at = NOW();

