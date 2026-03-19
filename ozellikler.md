# FA MEDYA CRM - SİSTEM ÖZELLİKLERİ VE TEKNİK ANALİZİ

Bu doküman, `fa_medya_crm_laravel` projesinde halihazırda uygulanmış olan tüm modüllerin ve teknik özelliklerin detaylı bir özetini içermektedir. Sistem, modern bir Restful API mimarisi (Laravel) ve çoklu kiracı (multi-tenancy) modeli üzerine inşa edilmiştir. 

## 1. Kimlik Doğrulama ve Yetkilendirme (Authentication & Authorization)
Sistem, `Laravel Sanctum` alt yapısı ile token bazlı kimlik denetimi ve `Spatie Permission` paketi ile detaylı rol/yetki mekanizması sağlamaktadır.
* **Kullanıcı Yönetimi:** API üzerinden kullanıcı kayıt (register) ve giriş (login) operasyonları.
* **Profil ve Oturum Kontrolü:** Parola değiştirme, profil bilgileri güncelleme, mevcut aktif oturumları (sessions) görüntüleme ve istenildiğinde "diğer tüm oturumları kapat" (revoke-others) işlemi.
* **Rol ve Yetki Yönetimi (RBAC):** Yetkilendirilmiş yöneticiler (Admin) tarafından sistemdeki dinamik rol ve yetkilerin oluşturulması, kullanıcılara atanması (Role & Permission CRUD).  

## 2. Çoklu Kiracı Mimarisi (Multi-Tenancy)
Yazılımın SaaS (Software as a Service) olarak kullanılabilmesine olanak tanıyan mimari özelliklerdir.
* **Super Admin Yönetimi:** Tenant'lardan bağımsız `/admin` rotaları üzerinden sadece sisteme hükmeden yöneticilerin girdiği bir arayüz bulunur. 
* **Tenant (Firma) İşlemleri:** Super admin tarafından yeni tenant (organizasyon) ekleme, silme ve görüntüleme.
* **Firmaya Kullanıcı Atama:** Yeni veya mevcut tenant'lara kullanıcı (owner/kullanıcı) bağlama işlemi.
* **Kiracı Ayarları (Tenant Settings):** Her firmanın kendine özel dosya depolama vb. entegrasyon ayarlarını girmesi ve bunların bağlantı testlerinin (Test Connection) yapılabilmesi.

## 3. Müşteri İlişkileri Yönetimi (Customer Management)
* **Müşteri CRUD:** Sisteme müşteri ekleme, güncelleme, detay görüntüleme ve silme. Tüm iş ve finans modülleri doğrudan müşteri kayıtları etrafında şekillenir.

## 4. İş ve Proje Takibi (Job Tracking / CRM)
Müşteriler adına açılan işlerin statüleri, dökümanları ve süreç geçişleri yönetilir. 
* **İş Yönetimi (Jobs):** Müşterilere yeni projelendirme (Job) ataması, detay girişi ve sıralama (reorder).
* **Statü ve Aşama Yönetimi (Job Statuses):** İş süreçleri için "Bekliyor", "İşlemde", "Tamamlandı" gibi dinamik iş statüleri tanımlayabilme ve sıralama (drag & drop reorder için rotalar).
* **İş Adımları (Job Steps):** Bir iş projesinin yürütülmesi esnasında geçilmesi gereken alt adımların belirlenmesi ve güncellenmesi.
* **Makro/Şablon İşlemleri (Step Templates):** Sıklıkla yapılan standart projeler için önceden tanımlanmış iş adımı şablonları tasarlanması ve bu şablonların tek tıkla mevcut bir işe atanması (`applyTemplate`).
* **Dosya Transferleri ve Bulut (Job Files):** Projelere ait döküman, resim, sözleşme vs. dosyalarının sunucuya veya S3 bucket'a yüklenmesi, proxy ile güvenli bir şekilde indirilmesi ve yönetilmesi.

## 5. Finans ve Ön Muhasebe (Finance & Pre-Accounting)
Kasa, gelir ve gider akışlarının tutulduğu temel finansal takip işlemleri.
* **Kasa Yönetimi (Cash Registers):** Sisteme "Merkez Kasa", "Banka 1" vs. gibi çoklu kasa/hesap tanımlamaları.
* **Ödeme Tahsilatları (Payments):** Müşterilerden veya işlerden (job) gelen gelirlerin seçili kasaya makbuz veya evrak ile tahsilat işlemlerinin CRUD operasyonları.
* **Gider Yönetimi (Expenses):** Ofis içi, personel bazlı vb. para çıkışlarının kayıt edilmesi. 
* **Gider Kategorileri:** Gider kalemlerinin sınıflandırılması (Yemek, Ulaşım, Fatura vs.) için kategori yönetimi işlemi. 

## 6. Ajanda ve Randevu Sistemi (Appointment System)
* **Randevu İşlemleri:** Müşteri bazlı veya potansiyel müşteri takibi amaçlı takvim etkinlikleri / randevu tanımlama işlemleri.
* **Konu Başlıkları (Appointment Titles):** Randevuların türlerinin (Toplantı, Keşif, Sunum vb.) dinamik olarak tanımlanıp randevu sırasında seçilebilmesi.

## 7. Hizmet Takibi ve Abonelikler (Service Tracking - Kanban)
Sürekli veya periyodik (örnek: aylık bakım, yıllık yenileme) verilen servislerin takibinin yapıldığı modüldür.
* **Hizmet Katalogu ve Kategoriler (Services & Categories):** Firmanın sunduğu kalıcı abonelik hizmetlerinin kategori ve tür bazlı listesi.
* **Periyodik Takip (Service Trackings):** Sözleşmeli işlerin kayıt altına alınması; bunların "aktif edilmesi (activate)", "iptal edilmesi (cancel)", veya tamamlanması (complete).
* **Gecikmiş İşlemler (Catch-Up):** Tarihi geçmiş periyodik görevlerin toplu ve akıllı olarak günümüz tarihine yaklaştırılması veya tamamlanması mantığı.
* **Takip Logları (Service Tracking Logs):** Bir abonelik/hizmet işleminin o anki ilerleyiş logu, aşama onaylamaları. 

## 8. Sistem Ayarları ve Ekstra Modüller
* **Dinamik Veri Alanları (Custom Fields):** Sistem (veritabanı şeması dahilindeki modeller incelendiğinde) kullanıcılara belirli formlar üstüne ekstra "Özel Alanlar" (Custom Field / Custom Field Value) açma yeteneği sağlar.
* **API Key Yönetimi:** Sistemin dış uygulamalarla haberleşebilmesi adına sadece Adminlerin üretebildiği entegrasyon anahtarları. 
* **Sistem Günlükleri (Activity Logs):** Veritabanında model bazlı yapılan ekleme, silme veya değişiklik işlemlerinin sistem yöneticileri (Admin) tarafından denetlenebilmesi için kayıt tutan denetim izi mekanizması (`/logs`). 
* **Dashboard İstatistikleri:** Uygulama giriş sayfasında gösterilen sayısal metrik ve analiz uçları.

## 9. Veri Güvenliği, Yedekleme ve AWS Entegrasyonu (Backup Management)
* **Manuel İçeri-Dışarı Aktarım:** Tüm sistem verisinin dışa aktarılması (export) , geri dönülmesi (import) veya veritabanının isteğe bağlı sıfırlanması işlemleri (reset). 
* **Bulut Depolama (S3) Yedekleri:** S3 compatible bulut servislerine otomatik/manuel yedek gönderilmesi. Arşivlenen bu AWS S3 yedeklerinin API üstünden listelenmesi (`listS3Backups`) ve doğrudan sistem üstünden indirtilmesi.
* **Güvenli Anahtarlar (Backup Keys):** Yedek işlemleri için güvenlik duvarı rolü üstlenen manuel üretim şifreler/anahtarların yönetimi ve silinmesi işlemleri.
