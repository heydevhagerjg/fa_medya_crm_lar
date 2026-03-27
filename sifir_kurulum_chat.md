# Famedya CRM - Chat Modülü (Reverb / WebSocket) Sıfır Kurulum ve Canlıya Alma Rehberi

Bu belge, yerel ortamda kusursuzca çalışan Laravel Reverb destekli Chat Modülü'nü ve gerçek zamanlı iletişimi (WebSocket), üretim ortamı olan **Ubuntu Sunucu (VPS)** veya **Plesk Panel (Shared/VPS)** üzerine başarıyla devreye almak için adım adım bir kontrol listesidir. 

---

## 1. İlk Etap: `.env` ve Gerekli Yapılandırma
Yerel geliştirme ortamında tarayıcıların karışık içerik politikaları (Mixed Content) ile engellenmemesi için test domainlerinde HTTP olarak ayarlamalar yaptık. **Ancak gerçek canlı ortam (Prod) kesinlikle `https` üzerinden çalışmalı ve WebSocket için `wss://` zorunludur.** Şifreli WSS istekleri de güvenli port olan `443`'ten gitmelidir.

Canlı (Production) sunucunuzdaki `.env` dosyası aşağıdaki WebSocket kısımlarına sahip olmalıdır:

```env
# ARKA PLANDA REVERB PORTU (ŞİFRESİZ KISIM)
REVERB_HOST="0.0.0.0"
REVERB_PORT="8080"
REVERB_SCHEME="https"

# KÖPRÜYÜ KURACAK VITE ORTAM DEĞİŞKENLERİ (TARAYICININ OKUDUĞU)
VITE_REVERB_APP_KEY="i4sgtovxclzlz4djd5wu"
VITE_REVERB_HOST="famedya.com"    # <-- Burası canlı domain adresiniz olacak (Örn: fa-medya.com)
VITE_REVERB_PORT="443"            # <-- WSS şifreli iletişim sağlanan standart port!
VITE_REVERB_SCHEME="https"        # <-- Artık tarayıcı WSS deneyecek
```

> **Önemli:** Değişkenleri canlı sunucunun ortamına girdikten sonra, mutlaka bir kere terminalden `npm run build` diyerek veya projeyi taşıyarak derlenmiş halini yayına alın.

---

## 2. Nginx Reverse Proxy (WSS İsteklerini Yönlendirme)
Tarayıcılar `wss://famedya.com/app/...` üzerinden şifreli port olan `443`'e istek atarlar. Ancak Reverb, sunucunun arkasında `8080`'i dinliyor durumdadır. Nginx'in gelen 443 TCP paketlerini alıp, bir WebSocket (WSS) trafiği olduğunu anlayarak 8080'e ulaştırması gerekir.

Aşağıdaki Nginx konfigürasyonunu sitenizin vhost (site config) dosyasına eklemelisiniz.

### Eğer PLESK Kullanıyorsanız (Çok Kolay):
1. Plesk panelinizden sitenizin kontrol paneline / ana menüsüne girin.
2. **"Apache ve nginx Ayarları (Apache & nginx Settings)"** sekmesine tıklayın.
3. Sayfanın en altına inin ve **"Ek nginx direktifleri (Additional nginx directives)"** boş metin kutusunu bulun.
4. Oraya tam olarak şu kod bloğunu yapıştırın ve Kaydet tuşuna basın:

```nginx
location /app {
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Scheme $scheme;
    proxy_set_header SERVER_PORT $server_port;
    proxy_set_header REMOTE_ADDR $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_addrs;
    proxy_set_header Upgrade $http_upgrade; # Websocket protokol ayrıştırıcısı
    proxy_set_header Connection "Upgrade";

    proxy_pass http://127.0.0.1:8080; # Plesk trafiği alıp Reverb'e sızdıracak
}
```

Plesk anında Nginx sunucusunu yeniden başlatarak konfigürasyonu etkin edecektir.

---

## 3. Reverb Daemon'ı (Servisi) Açık Tutma 
Canlı ortamda terminal arayüzündeki `php artisan reverb:start` penceresinden çıkış yapınca sunucunuzun çökmemesi, yeniden başlasa bile hayatına devam etmesi gerekir. 

Bunun için bir arka plan yöneticisi kullanmak zorunludur:

### Ubuntu VPS İçin (Supervisor)
`/etc/supervisor/conf.d/reverb.conf` isminde bir dosya açıp şu ayarları verin:
```ini
[program:famedya-reverb]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/famedya/artisan reverb:start
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/famedya/storage/logs/reverb.log
```
Dosyayı oluşturduktan sonra `supervisorctl update` ve `supervisorctl start famedya-reverb:*` diyerek sonsuza dek başlatın.

### Plesk Panel Kullanıcıları İçin
Plesk'te doğrudan Supervisor terminalinden girmek yerine çok daha profesyonel bir panel vardır.
1. Ana Gelişmiş Ayarlar (Root yetkisi ile) veya Plesk Marketindeki **"Eklentiler" (Extensions)** menüsüne gidin.
2. Arama kısmından resmi ve ücretsiz olan **"Supervisor"** eklentisini kurun.
3. Gelen yeni arayüzde bir "Program Ekle" deyin ve hedef olarak `artisan reverb:start` emrini verecek dizini belirtin.
4. Başlatın ve panel kendi arkasında bunu yönetmeye devam eder!

> **Alternatif Plesk Cron Yöntemi:** Eğer eklenti kurulamıyorsa, Plesk'teki "Zamanlanmış Görevler (Cron Jobs)" sekmesinde *Her Dakika (Every Minute)* çalışacak şekilde şu komutu verebilirsiniz:
`/usr/bin/flock -n /tmp/reverb.lock /opt/plesk/php/8.x/bin/php /var/www/vhosts/famedya.com/httpdocs/artisan reverb:start`

---

## 4. Kuyruklar, Performans ve Optimizasyon
Test ederken anlık görüntüleyebilmek için `MessageCreated` Event'imizi senkron çalıştırmıştık veya Queue driver olarak `.env`'de `sync` seçili kalmıştı. Canlı yayına girildiğinde eş zamanlı aynı sohbete giren onlarca insan sunucuyu kasmasın diye performansı asenkron kuyruğa taşıyın.

1. `MessageCreated` event sınıfınızın içindeki interface'leri `ShouldBroadcast` olarak ayarladığınıza emin olun (Mevcutta ShouldBroadcastNow yapmadıysanız harika).
2. `.env` yapılandırmasını düzeltin: `QUEUE_CONNECTION=database` *(Veya varsa redis).*
3. Tıpkı Supervisor üzerinden Reverb'ü canlı tuttuğumuz gibi `php artisan queue:work` emrini de Plesk Laravel Toolkit'in **"Kuyruklar (Queues)"** ekranından veya Supervisor'dan ayakta tutun!
4. Ubuntu'da eş zamanlı en fazla "1000" kişi açık kalabildiği için sunucu konfigürasyonunuzdan `ulimit -n 10000` tarzı **Maksimum Açık Dosya(TCP Soket)** sınırını canlıya geçerken yükseltmeyi aklınızın bir köşesinde bulundurun. Not alın.

## İpucu (Mobil App Geliştirmesi)
Mimariyi API temelli tasarladığımız için, ileride React Native veya Flutter ile bir iOS/Android uygulaması geliştirmeye karar verirsek, mobilde CORS denen bir kavram veya "Mixed Content" browser dayatması olmadığı için: Özel bir Webhook servisi veya proxy sunucu kurmadan, doğrudan `.env`'deki Reverb IP ve Portumuzla doğrudan Pusher SDK ile mobil sohbete hatasızca entegre olabilirsiniz!
