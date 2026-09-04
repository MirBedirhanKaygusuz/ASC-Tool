# Ortak ders havuzu

Ofisin **paylaşılan red arşivi**. Bugüne kadar her makinede ayrı bir
`lessons/index.json` vardı: Ahmet'in işlediği red'i Ayşe göremiyor, ikisi aynı
red'den iki ayrı ders çıkarıyor ve proje öğrenmiyordu
(iç risk kaydında R10). Bu servis o dosyanın ortak hâli.

İki kap: **Postgres** (veri) ve **API** (`LessonStore` arayüzünü ağ üzerinden
konuşan ~400 satırlık tek dosya). Üçüncüsü isteğe bağlı: **Caddy** (HTTPS).

```
 npm run learn / lessons / check        Chrome eklentisi
        │  RemoteLessonStore (HTTP)            │  aynı sınıf, tarayıcı paketi
        └──────────────────┬───────────────────┘
                           ▼
                  api  (Node, tek dosya)
                           │
                           ▼
                  db   (Postgres)
                       ├─ lessons, reject_cases, lesson_vectors   ← sorgu
                       └─ blobs: bodies/*.md, rejects/*.txt        ← okuma
```

## Neden cluster / mikroservis değil

Sorulduğu için yazıyorum. Kubernetes cluster'ı ve mikroservis mimarisi gerçek
şeyler ama başka bir problemi çözüyorlar: **onlarca ekip, bağımsız dağıtım,
saniyede binlerce istek**. Buradaki yük ofisteki birkaç kişi, birkaç bin ders,
günde belki yüz istek. O ölçekte cluster kurmak, çözmediği bir sorunun bakım
maliyetini üstlenmek olurdu — ve o maliyet gerçek: node bakımı, ağ politikası,
sertifika dönüşü, sürüm yükseltmeleri.

Elindeki şey zaten mikroservis mimarisinin doğru dozu: **iki küçük, tek işi
olan servis** (LLM proxy'si `worker/`, ders havuzu burası), her biri ayrı
dağıtılıyor, ayrı düşüyor, ayrı yetkilendiriliyor. Büyürsen `docker compose`
dosyasından Kubernetes manifest'ine geçiş mekanik bir iş — bugün ödemen gereken
bir bedel değil.

## Kurulum

Sunucuda **Docker** ve **Docker Compose** yeterli. Başka bir şey kurulmuyor.

```bash
cd havuz
cp .env.example .env
```

`.env` içindeki üç değeri doldur:

```bash
openssl rand -hex 24      # → POSTGRES_PASSWORD
openssl rand -hex 32      # → HAVUZ_READ_TOKEN
openssl rand -hex 32      # → HAVUZ_WRITE_TOKEN
```

Sonra:

```bash
docker compose up -d
docker compose logs -f api      # "havuz ayakta: http://0.0.0.0:8787"
```

Şemayı API açılışta kendi uyguluyor ([../sql/lessons.sql](../sql/lessons.sql)).
Elle migration çalıştırman gereken bir adım yok; dosyanın her ifadesi yeniden
çalıştırılabilir, yani şema değişince `docker compose restart api` yeter.

Sınama:

```bash
curl -s localhost:8787/health
# {"ok":true,"db":true,"yetki":"yok"}

curl -s -H "x-gl-token: $HAVUZ_READ_TOKEN" localhost:8787/health
# {"ok":true,"db":true,"yetki":"okuma","dersler":0,"ornekler":0}
```

### İki belirteç, neden

| | kimde durur | ne yapabilir |
|---|---|---|
| `HAVUZ_READ_TOKEN` | ofisteki **herkeste** — eklenti ayarlarında, CLI'da | okur **+ ders onaylar / emekliye ayırır** |
| `HAVUZ_WRITE_TOKEN` | yalnız **red metinlerini işleyen** kişide | yukarıdakiler + ders açar, örnek ekler, vektör yazar |

**Onay neden herkeste.** Taslak dersi gören kişi, o red'i yaşayan kişi ve
denetimi koşturan kişi çoğu zaman farklı. Onayı yalnız yazma belirtecine
bağlamak havuzun tıkandığı yer oluyordu: onaylanmayan ders denetimi hiç
etkilemiyor, yani havuz öğrenmiyor.

**Bedeli gerçek:** bir dersi aktifleştirmek HERKESİN raporunu değiştirir. O
yüzden açılan tek şey `status` alanı. Okuma belirteci arşive içerik ekleyemez
ve var olanı **ezemez** — yapabildiği tek şey var olan bir dersin durumunu
çevirmek, o da geri alınabilir. Sızan bir belirteç kayıp veri üretemez.

Kısmak istersen: `router.js` içindeki `PATCH /lessons/:id` satırını
`GENEL_YOLLAR`dan `YAZMA_YOLLARI`na taşı. Başka hiçbir yer değişmez — eklenti
403'ü zaten "bu belirtecin durum değiştirme yetkisi yok" diye gösteriyor.

Sunucu iki belirteç aynıysa veya biri boşsa **açılmaz** — ayrımın sessizce
anlamsızlaşmasını engelleyen tek şey bu.

Bu bir yetkilendirme sistemi **değil**: kim olduğunu değil, neyi bildiğini
sorar. Kişi bazlı iz sürmek gerekirse (kim hangi dersi onayladı) ayrı bir iş.

### Ofis dışından erişim — HTTPS

Varsayılan bağlama `127.0.0.1`: havuz yalnız sunucunun kendisinden görünür.
Başka makinelerden erişilecekse **alan adı + TLS** kur, düz HTTP'ye açma —
belirteç ağda açık gider ve tarayıcı güvensiz adresleri engelleyebilir.

DNS'te alan adını sunucuya yönlendir, sonra `.env`:

```bash
HAVUZ_BIND=127.0.0.1              # api dışarı açılmıyor, Caddy önünde
HAVUZ_DOMAIN=havuz.sirketin.com
HAVUZ_EMAIL=sen@sirketin.com
```

```bash
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

Caddy sertifikayı Let's Encrypt'ten kendi alır ve kendi yeniler. Adres artık
`https://havuz.sirketin.com`; `api` artık kendi portunu yayınlamıyor, tek giriş
Caddy.

TLS neden ayrı dosya, Compose profili değil: Compose profil kapalıyken bile
**tüm** servislerin değişkenlerini çözüyor, yani Caddy'deki "alan adı zorunlu"
kontrolü profilin arkasında dursa bile normal `docker compose up`ı düşürüyordu.
Kontrolü gevşetmek yerine servisi ayırdık.

## Bağlanmak

### Terminal (`npm run learn`, `check`, `lessons`)

Depo kökündeki `.env`:

```bash
GREENLIGHT_STORE=havuz
HAVUZ_URL=https://havuz.sirketin.com
HAVUZ_TOKEN=<yazma belirteci — learn ders açacak>
```

### Chrome eklentisi

**Ayarlar → Ortak ders havuzu**: adres + **okuma** belirteci. "Bağlantıyı sına"
hem adresi hem belirteci doğrular.

Bağlıyken denetim iki şey kazanıyor: kural kartlarının yanına daha önce
yediğimiz red'ler de kanıt olarak giriyor, ve bulguların altında benzer gerçek
red örnekleri görünüyor. Eklenti havuza yalnız **okur** — çekim, denetim ve
dökümlerin hiçbiri havuza gitmez.

### Havuzda ne olduğunu görmek

**Menü → Ders havuzu.** Her dersin durumu (● aktif · ○ onay bekliyor ·
× emekli), belirtileri, gerçek red örnekleri ve uzun anlatımı orada. Ekranın
asıl işi sayı göstermek değil, her dersin **denetimde ne işe yaradığını**
söylemek:

| ekranda gördüğün | denetimde olan |
|---|---|
| `kart: apple-2.3.3-…` | o kartın model çağrısına kanıt olarak ekleniyor |
| `◆ uygulama içi` | listing'den görülemez; **elle kontrol** listesine giriyor, bulgu üretmez |
| `⚠ hiçbir karta bağlı değil` | kapsama boşluğu: bu yüzden reddedildik, kartımız yok |
| `○ onay bekliyor` | denetimi **etkilemiyor** — onaylanana kadar havuz ondan öğrenmiş sayılmaz |

Bu ayrımlar olmadan "havuz bağlı ama raporda hiçbir şey yok" durumu
açıklanamıyor — çoğu zaman sebep, derslerin in-app olması ya da onay
beklemesidir.

**Onaylamak:** her dersin altında düğmeler var. Taslakta `Onayla` / `Reddet`,
aktifte `Emekliye ayır`, emeklide `Yeniden onayla`. Hepsi geri alınabilir —
durum her zaman geri çevrilebiliyor. Terminal karşılığı:
`npm run lessons -- approve <id>` ve `-- retire <id>`.

## Eldeki dersleri taşımak

Havuz boş doğar. `.env`i değiştirmeden ÖNCE yereldekileri taşı:

```bash
HAVUZ_URL=... HAVUZ_TOKEN=<yazma> npm run lessons -- push --kuru   # önce prova
HAVUZ_URL=... HAVUZ_TOKEN=<yazma> npm run lessons -- push
```

Ders satırları, gövdeler, ham reject metinleri ve vektörler birlikte gider.
Tekrar çalıştırılabilir: havuzda zaten olan atlanır, kopya oluşmaz. Yerel
klasör **silinmez** — havuz beklendiği gibi çalışana kadar dursun.

## Yedek

Tek veritabanı, tek komut. Gövdeler ve ham reject metinleri de içinde:

```bash
docker compose exec -T db pg_dump -U greenlight greenlight | gzip > havuz-$(date +%F).sql.gz
```

Geri yükleme:

```bash
gunzip -c havuz-2026-09-02.sql.gz | docker compose exec -T db psql -U greenlight greenlight
```

**Bunu bir zamanlanmış işe bağla.** Ofisin red geçmişi tek makinede duruyor
artık; dağınık olmasının tek iyi yanı buydu.

## API

Tel biçimi camelCase — [`src/lessons/types.ts`](../src/lessons/types.ts)
arayüzünün aynısı. snake_case çevirisi yalnız sunucuda.

| | yol | belirteç |
|---|---|---|
| GET | `/health` | — (yetkiyi söyler) |
| GET | `/lessons?platform=&status=&guideline=&exclude=` | okuma |
| GET | `/lessons/:id` · `/lessons/:id/examples?limit=` | okuma |
| GET | `/examples` · `/vectors` · `/blob/<anahtar>` | okuma |
| POST | `/lessons` `{lesson, body}` · `/examples` `{example, raw}` | yazma |
| PATCH | `/lessons/:id` `{status}` | yazma |
| PUT | `/vectors` `{vectors}` | yazma |

`/v1` öneki de kabul edilir. İstemci: [`src/lessons/remote.ts`](../src/lessons/remote.ts)
— aynı sınıf hem Node'da hem tarayıcıda koşuyor.

## Dosyalar

| | |
|---|---|
| `router.js` | tüm uç noktalar. Postgres sürücüsü **yok** — `db` nesnesi enjekte ediliyor, bu yüzden veritabanı kurmadan test edilebiliyor |
| `server.js` | kablolama: pg havuzu, şema uygulama, HTTP sunucusu, kapanış |
| `docker-compose.yml` | db + api |
| `docker-compose.tls.yml` | üstüne bindirilen Caddy katmanı (alan adı + HTTPS) |
| `../sql/lessons.sql` | şema. API açılışta uygular |

Testler: `npm run test:core` içinde "havuz — istemci ↔ sunucu gidiş-dönüşü".
Gerçek `RemoteLessonStore`, gerçek `router.js` ve bellek içi bir Postgres
taklidi. Yetki kapıları, yol eşleşmesi, alan çevirisi ve hata kodları orada
kilitli.

## Gizlilik ve loglar

İstek gövdesi **loglanmaz** — yalnız yol ve hata mesajı. Apple'ın red
yazışmaları buradan geçiyor; sayaç tutmak başka, içeriği saklamak başka.
Postgres portu dışarı açılmıyor; veritabanına yalnız `api` erişiyor.
