# Veriyi nereden alıyoruz?

> "Şu anda tam olarak web scraping yapmıyoruz ama yaptığımızın tam olarak ne
> olduğunu da bilmiyorum."

Bu belge o soruyu kapatmak için var. Dört ayrı yol kullanıyoruz; üçü açık web,
biri anahtarlı API. Hangisinin neyi verdiği, neyi VEREMEYECEĞİ aşağıda.

---

## Özet

| # | Yol | Yetki gerekiyor mu | Ne görür | Kod |
|---|-----|--------------------|----------|-----|
| 1 | **App Store vitrini** — `itunes.apple.com/lookup` (JSON) + `apps.apple.com` ürün sayfası (HTML) | Hayır | YAYINDAKİ sürüm: ad, açıklama, sürüm notu, ekran görüntüleri, kategori, yaş sınırı, puan, **IAP adları ve fiyatları** | [src/fetch/public-store.ts](../src/fetch/public-store.ts) |
| 2 | **iris/v1** — App Store Connect arayüzünün kendi JSON ucu, tarayıcı oturumuyla | Apple hesabına giriş (çerez) | HAZIRLANAN sürüm dâhil her şey + **Resolution Center red metinleri** | [extension/src/iris.js](../extension/src/iris.js), [extension/src/endpoints.js](../extension/src/endpoints.js), [extension/src/collector.js](../extension/src/collector.js) |
| 3 | **Resmi App Store Connect API** — `api.appstoreconnect.apple.com`, JWT | `.p8` anahtarı | Hazırlanan sürüm, metinler, görseller, IAP fiyatları | [src/fetch/asc.ts](../src/fetch/asc.ts) |
| 4 | **App Review Guidelines sayfası** — `developer.apple.com` (HTML) | Hayır | Apple'ın kural metninin tamamı (145 madde) | [src/corpus/guidelines.ts](../src/corpus/guidelines.ts), [scripts/scrape-guidelines.ts](../scripts/scrape-guidelines.ts) |

---

## 1 · Vitrin — gerçek kazıma, anahtarsız

İki açık kaynağı okuyoruz:

- **iTunes Lookup** (`itunes.apple.com/lookup?id=...`) düz JSON döndürüyor:
  ad, açıklama, sürüm, sürüm notu, ekran görüntüsü adresleri, kategori, yaş
  sınırı, dil listesi, puan. Yıllardır aynı ve belgeli.
- **Ürün sayfası** (`apps.apple.com/us/app/id...`) HTML. Lookup'ın vermediği
  tek şey burada: **uygulama içi satın alma adları ve fiyatları.** Sayfayı
  sunucu üretiyor, JavaScript çalıştırmaya gerek yok; `dt`/`dd` yapısını
  okuyoruz (sınıf adları her derlemede değiştiği için onlara yaslanmıyoruz).

```
npm run vitrin -- 6756182726
```

**Sınırı:** vitrin yalnızca **yayındaki** sürümü bilir. Denetimin asıl konusu
ise henüz gönderilmemiş sürüm. Yani bu yol App Store Connect'in yerine
geçemez. İki işi var:

1. Hiç anahtar yokken bile elde bir veri olması.
2. **Bağımsız doğrulama.** Fiyatı okuyamadığımızda `price=0` yazıyoruz; ürün
   vitrinde 24.99 ise elimizdeki veri yanlış demektir ve bunu kanıtla
   söyleyebiliyoruz (`crossCheckPrices`).

Vitrin sayfası bir üründe en çok **10** satın alma gösteriyor; daha fazlası
varsa bunu uyarı olarak yazıyoruz — sessizce kesmiyoruz.

## 2 · iris/v1 — "kazımaya en yakın" yol, ama HTML kazımıyoruz

Şu an ağırlıklı kullandığımız yol bu ve adı tam olarak şu: **App Store
Connect arayüzünün kendi kullandığı özel JSON API'sini, kullanıcının kendi
oturumuyla, kendi sekmesinin içinden çağırıyoruz.**

- Eklenti, ASC sekmesine `iris.js` + `collector.js` enjekte ediyor.
- İstekler aynı origin'den gidiyor, oturum çerezini tarayıcı kendisi taşıyor
  (çerez `httpOnly`, biz okuyamıyoruz — okumamıza gerek de yok).
- Dönen şey **JSON**, HTML değil. Yani ekran kazıma yapmıyoruz; ekranın
  arkasındaki veri ucunu çağırıyoruz.

Kazımanın avantajı (anahtar yok, kullanıcı bir şey kurmuyor) burada da var;
kırılganlığı da: `iris/v1` belgelenmiş bir sözleşme değil, Apple alan adını
haber vermeden değiştirebilir. Bu yüzden [belkiPatlarız.md](../belkiPatlarız.md)
R2 maddesi ve kanarya turu var: her çekimden önce uçların hâlâ beklediğimiz
alanları döndürüp döndürmediği yoklanıyor.

Bu yolun **tek başına verdiği** şey: Resolution Center yazışmaları, yani
Apple'ın gerçek red metinleri. Resmi API bunları hiç vermiyor — ders
sisteminin (`npm run learn`) beslendiği kaynak burası.

## 3 · Resmi API — `.p8` anahtarıyla

`api.appstoreconnect.apple.com`, JWT imzalı. Belgelenmiş ve sözleşmesi sabit.
Hazırlanan sürümü görüyor. Dezavantajı: kullanıcının anahtar oluşturup
`.env`'e koyması gerekiyor — ofisteki herkesin yapacağı bir şey değil,
eklentinin var olma sebebi de bu.

Fiyat okuma burada üç ayrı ucu gerektiriyor ve doğru uç yolları şunlar
(2026-08-21'de gerçek hesapta doğrulandı):

```
/v1/subscriptions/{id}/prices?include=subscriptionPricePoint&filter[territory]=USA
/v1/inAppPurchasePriceSchedules/{iapId}/manualPrices?include=inAppPurchasePricePoint&filter[territory]=USA
/v1/territories?limit=200          → para birimi
```

`/v1/inAppPurchases/{id}/iapPriceSchedule` **404 döner**, denemiyoruz.
`/v1/territories/{code}` (tekil) **403 döner**, liste ucunu kullanıyoruz.

## 4 · Yönerge sayfası — kural metninin kaynağı

`developer.apple.com/app-store/review/guidelines/` sayfasını çekip 145 maddeye
ayırıyoruz ve `data/apple-guidelines.json` olarak repoda tutuyoruz.

```
npm run guidelines          # yenile (fark raporu basar)
npm run madde -- 3.1.2      # Apple'ın o maddedeki kendi metni
npm run madde -- --ara subscription
```

Denetim koşarken ağa çıkmıyoruz: kural metni çekim anında gelseydi, Apple
sayfayı değiştirdiği gün denetimin dayandığı kural sessizce değişirdi. Repoda
duran dosya "hangi kural metnine göre denetlendi" sorusunun cevabı; parmak izi
(`digest`) ile iki çekim karşılaştırılabiliyor.

Bu metin iki yere gidiyor:
- Modele — kartın yanında, Apple'ın kendi cümlesi olarak
  ([src/check/prompt.ts](../src/check/prompt.ts) → `renderOfficialText`).
- Eklenti paketine gömülü hâli
  ([scripts/build-ext.ts](../scripts/build-ext.ts) → `guidelines.generated.ts`).

---

## Hangi veri hangi yoldan geliyor

| Veri | Vitrin (kazıma) | iris (eklenti) | Resmi API |
|------|:---------------:|:--------------:|:---------:|
| Uygulama adı, altyazı | yayındaki | ✔ | ✔ |
| Açıklama, sürüm notu | yayındaki | ✔ | ✔ |
| Anahtar kelimeler | ✘ | ✔ | ✔ |
| Ekran görüntüleri | yayındaki | ✔ | ✔ |
| Kategori, yaş sınırı | ✔ | ✔ | ✔ |
| IAP adı ve fiyatı | ✔ (ilk 10) | ✔ | ✔ |
| Abonelik dönemi, deneme | ✘ | ✔ | ✔ |
| Review notu, demo hesap | ✘ | ✔ | ✔ |
| **Red metinleri (Resolution Center)** | ✘ | **✔** | ✘ |
| **Hazırlanan (gönderilmemiş) sürüm** | ✘ | **✔** | **✔** |
| **Özel ürün sayfaları (metin + görsel)** | ✘ | **✔** | ✘ |
| Kullanıcı puanı ve yorum sayısı | ✔ | ✔ | ✘ |

**"Her şeyi kazımayla alalım" neden tam mümkün değil:** hazırlanan sürümün
metni ve görselleri hiçbir açık adreste yok. Apple onları yalnızca hesabın
sahibine gösteriyor. O yüzden anahtarsız yol (eklenti) da aslında hesaba
giriş gerektiriyor — sadece **anahtar** gerektirmiyor.

---

## Çekimi sınamak

```
npm test              # ağsız, saniyeler sürer — her değişiklikte
npm run test:fetch    # GERÇEK ağ: dört kaynağı da yoklar, ne aldığını yazar
```

`test:fetch` şunları ölçüyor:

1. Yönerge sayfası çekiliyor mu, kaç madde çıkıyor, repodaki kopya güncel mi.
2. Vitrin: her uygulama için hangi alanlar doldu, kaç IAP fiyatı okundu.
3. Resmi API: tam çekim, alan alan kapsam, kaç ürünün fiyatı okundu.
4. **Fiyat çapraz kontrolü:** resmi API'nin verdiği fiyatlarla vitrindeki
   fiyatlar karşılaştırılıyor. İki bağımsız kaynak aynı sayıyı söylemiyorsa
   test kırmızı yanıyor.
5. iris uç haritasının tutarlılığı (canlı yoklaması tarayıcıda, kanarya turu).

---

## Çekilen veri depoda nasıl duruyor

Apple'ın döndürdüğü JSON:API zarfı olduğu gibi saklanmıyor. Ölçüm: tek bir
uygulamanın ham çekimi **704 KB**, bunun **%76'sı** `links.self` /
`links.related` ve boş `relationships` — yani taşıma detayı. Depoya yazmadan
önce `src/dump/normalize.ts` (eklentide `GLNormalize`) bunu sadeleştiriyor:

- `links` **tamamen** atılır; yerine bölüm başına tek satır `_kaynak` teşhisi kalır.
- `attributes` düzleşir, `relationships` → `iliski: { ad: id }`.
- `null` / `""` / `[]` / `{}` atılır ama **adları** `_bos` listesine yazılır —
  "alan boş geldi" ile "alan hiç gelmedi" ayrı şeyler.
- `false` ve `"NONE"` **olduğu gibi kalır**: yaş beyanında "içerik yok" bir
  cevaptır, eksiklik değil.
- `included` sahibine gömülür, IAP fiyatı çekim anında çözülür.

Sonuç: aynı çekim **~60 KB**. Denetim sonucu değişmiyor (modele zaten yalnız
`Submission` gidiyordu), depo ve okunabilirlik kazanıyor.

Kayıtlar `sema` damgası taşır. Damgasız (eski) kayıtlar **okuma anında**
sadeleştirilir — yeniden çekim gerekmez, Apple'a fazladan tek istek gitmez.
Görüntüleyici → Ham veri → **"Depoyu sadeleştir"** aynı işi depoda kalıcı
yapar; geri alınamaz olduğu için önce onay sorar.

**Kota:** IndexedDB dolduğunda yazma sessizce düşüyordu ve çekim yeşil
görünüyordu. Artık iki kapı var: çekim başlamadan önce depo %80'i geçtiyse
uyarı, yazma düştüğünde ise ilgili bölüm `atlandı` listesine sebebiyle
birlikte yazılır.

**Maskeleme:** ham veri indiren her yol kişisel veriyi ve sırları maskeler
(`initiator`, e-posta, telefon, oturum anahtarları). Maskesiz tam kopyanın tek
yolu Yedek → **Tam yedek**; bilinçli ve ayrı bir düğme.
