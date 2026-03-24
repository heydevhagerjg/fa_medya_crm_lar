# Famedya CRM Proje Özellikleri

Famedya CRM, modern işletmelerin müşteri, iş, teklif ve finans süreçlerini uçtan uca yönetebilmeleri için tasarlanmış, bulut tabanlı (SaaS) bir kurumsal Kaynak Planlama (ERP) ve Müşteri İlişkileri Yönetimi (CRM) platformudur.

## 1. Ana Mimari ve SaaS Altyapısı
*   **Multi-tenant (Çoklu Kiracı):** Tek bir yazılım örneği üzerinden binlerce farklı firmanın (tenant) verilerinin birbirine karışmadan çalışmasını sağlayan mimari.
*   **Bağımsız Veritabanı Mantığı:** Her firmanın kullanıcıları, müşterileri ve tüm verileri izole edilmiştir.
*   **Beyaz Etiketleme (White-Labeling):** Her firma kendi logosunu yükleyebilir ve arayüzü kişiselleştirebilir.
*   **Abonelik ve Plan Yönetimi:** Paddle entegrasyonu ile esnek paket tanımlama, deneme süreci, limit yönetimi ve otomatik faturalandırma.
*   **Erişim Kısıtlama Sistemi:** Paket özelliklerine göre (İş sayısı, personel limiti, API erişimi vb.) otomatik özellik açma/kapatma.

## 2. Müşteri (CRM) Yönetimi
*   **Hızlı Müşteri Kaydı:** Ad, telefon, e-posta ve özel notlarla müşteri portföyü oluşturma.
*   **Müşteri Geçmişi:** Müşteriye bağlı geçmiş işleri, ödemeleri ve randevuları tek ekranda görüntüleme.
*   **İletişim Yönetimi:** Tek tıkla arama veya e-posta gönderme kısayolları (arayüz üzerinden).
*   **Gelişmiş Arama ve Filtreleme:** İsim, telefon veya e-posta ile anlık filtreleme.

## 3. İş ve Proje Takibi
*   **Esnek İş Akışları:** İşleri aşama aşama (Kanban veya Liste görünümü) takip edebilme.
*   **Kanban Panosu:** Sürükle-bırak yöntemiyle iş durumlarını güncelleme (Hazırlanıyor, Onay Bekliyor, Tamamlandı vb.).
*   **İş Adımları ve Checklist:** Her iş için özel alt görevler (adımlar) tanımlama ve tamamlanma oranını izleme.
*   **Personel Atama:** İşleri belirli personellere zimmetleme ve sorumluluk takibi.
*   **İş Bazlı Notlar:** Proje sürecindeki önemli detayları tarih bazlı not alma.

## 4. Teklif Yönetimi (Proposals)
*   **Dijital Teklif Hazırlama:** Ürün/hizmet kalemleri, KDV hesaplamaları ve genel indirimlerle profesyonel teklifler oluşturma.
*   **Online Teklif Onayı:** Müşterilere gönderilen özel link üzerinden tekliflerin dijital olarak incelenmesi ve onaylanması.
*   **Hızlı İş Dönüşümü:** Onaylanan tekliflerin tek tıkla gerçek bir "İş" kaydına dönüştürülmesi ve finansal verilerin otomatik aktarımı.
*   **Teklif Durum Takibi:** Taslak, gönderildi, kabul edildi ve reddedildi süreçlerinin yönetimi.

## 5. Finans ve Muhasebe Yönetimi
*   **Kasa ve Hesap Yönetimi:** Birden fazla kasa (Nakit, Banka vb.) tanımlama ve bakiye takibi.
*   **Ödeme ve Tahsilat:** İş bazlı parçalı ödeme alma, taksitlendirme ve geçmiş tahsilatların raporlanması.
*   **Gider Takibi:** İşletme giderlerini kategorize etme (Kira, Maaş, Vergi vb.) ve kâr-zarar analizi.
*   **Kâr-Zarar Özeti:** Dashboard üzerinden anlık toplam gelir, gider ve net bakiye takibi.
*   **Dekont Yönetimi:** Ödemelere dijital dekont/belge ekleme.

## 6. Randevu ve Takvim Sistemi
*   **Gelişmiş Takvim Görünümü:** Günlük, haftalık ve aylık bazda randevu takibi.
*   **Müşteri Bağlantılı Randevular:** Randevuları doğrudan müşteri kartlarıyla ilişkilendirme.
*   **Kritik Uyarılar:** Yaklaşan ve geciken randevular için görsel uyarılar ve geri sayım araçları.

## 7. Periyodik Hizmet Takibi
*   **Otomatik Döngüler:** Bakım, abonelik veya periyodik kontroller için (Günlük, Haftalık, Aylık, Yıllık) otomatik takip oluşturma.
*   **Gelecek İşlem Tahmini:** Gelecek servis tarihlerini otomatik hesaplama ve hatırlatma.
*   **Hizmet Geçmişi:** Yapılan tüm periyodik işlemlerin geçmiş günlüğünü tutma.

## 8. Dosya ve Doküman Yönetimi
*   **Amazon S3 Entegrasyonu:** Dosyaların güvenli bulut depolama alanlarında saklanması.
*   **Firma Bazlı Bağımsız Depolama:** Her firmanın kendi S3 bilgilerini bağlayarak verilerini kendi bulutunda saklayabilme imkanı.
*   **İş Bazlı Dosya Yükleme:** Her işe özel doküman, fotoğraf ve belge ekleme.
*   **Çöp Kutusu Sistemi:** Yanlışlıkla silinen dosyaları geri getirebilme ve 30 gün sonra otomatik kalıcı temizlik.

## 9. Personel ve Yetki Yönetimi
*   **Rol Bazlı Yetkilendirme:** Admin, Personel gibi rollere göre detaylı izin tanımlama (Oku, Yaz, Sil, Düzenle).
*   **Personel Performans Takibi:** Hangi işin kimin üzerinde olduğunu ve tamamlanma durumlarını izleme.

## 10. API ve Entegrasyon
*   **Granüler API Anahtarları:** Dış sistemlerle entegrasyon için modül bazlı yetkilendirilmiş API key oluşturma.
*   **Gelişmiş API Dokümantasyonu:** Yazılımcılar için sistem içinden erişilebilen canlı dokümantasyon.

## 11. Güvenlik ve Yedekleme
*   **Oturum Güvenliği:** Modern JWT/Sanctum tabanlı kimlik doğrulama.
*   **Otomatik Sistem Yedekleme:** Her gece tüm sistemin (Dosyalar + DB) tam yedeğinin alınması.
*   **Veri İzolasyonu:** Kiracı (Tenant) bazlı veri ayrıştırma ve güvenlik katmanları.

---
*Bu belge Famedya CRM projesinin güncel teknik ve fonksiyonel kapsamını ifade etmektedir.*
