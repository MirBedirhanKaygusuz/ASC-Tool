# Greenlight eklentisi

App Store Connect verisini **tarayıcı oturumuyla** çeker. Kullanıcının API
anahtarı girmesi, konsola snippet yapıştırması ya da terminalde komut
çalıştırması gerekmez.

## Kurulum (bir kez, makine başına)

1. Bu klasörü kalıcı bir yere koy (Masaüstü'ne değil — silinirse eklenti ölür).
2. Chrome → adres çubuğuna `chrome://extensions`
3. Sağ üstten **Geliştirici modu**'nu aç.
4. **Paketlenmemiş öğe yükle** → bu `extension/` klasörünü seç.
5. Araç çubuğunda yeşil onay simgesi görünür. Sabitlemek istersen puzzle
   simgesine tıklayıp iğneyi işaretle.

Chrome her açılışta "geliştirici modundaki eklentileri devre dışı bırakın"
diye bir balon gösterir. **"Devre dışı bırak" deme** — eklenti kapanır.
Kapattıysan aynı adımlarla yeniden yükle.

## Kullanım

1. Bir sekmede App Store Connect'e giriş yapmış ol.
2. Eklenti simgesine tıkla → **yan panel** sağda açılır.

**Tek yüzey var: panel.** Çekim, uygulama listesi, beyanlar, denetim raporu,
denetim geçmişi, red arşivi, ham veri, çekim günlüğü, yedek, ayarlar — hepsi
orada. Tam sayfa görüntüleyici v0.8.0'da **kaldırıldı**.

Panel bir açılır kutu (popup) değil: sekme değiştirsen de kalır, çekim
sürerken App Store Connect'e bakmaya devam edebilirsin.

Gezinme yığın: **liste → uygulama → denetim**. Üst soldaki ok bir adım geri
alır, üst sağdaki ☰ arşiv/yedek/ayarlar menüsünü açar. 340 pikselde sekme
şeridi okunmuyor, o yüzden sekme değil yığın.

Açık ASC sekmesi yoksa eklenti kendisi açar.

> Yan panel Chrome 114 ile geldi. Daha eski bir Chrome'daysan simge paneli
> değil doğrudan tam sayfayı açar (belkiPatlarız R17).

## Ne yapıyor (v0.8.0)

**Her şeyi çek** → hesaptaki tüm uygulamalar, listing bilgileri, sürüm geçmişi,
ekran görüntüleri, abonelik/ürün ve **red yazışmaları** çekilir; hepsi
tarayıcının kendi deposuna (IndexedDB) yazılır. Veri makineden çıkmaz.

**Menü (☰)** → arşiv işleri: denetim geçmişi, red metinleri (`npm run learn`'ün
beklediği biçimde, tek tuşla indirilebilir), ham JSON, çekim günlüğü, yedek
alma ve ayarlar.

Uygulama başına yaklaşık bir dakika sürer (istekler arasında 0,8 sn bekleme
var — bunu hızlandırma, belkiPatlarız R1). Çekim sürerken App Store Connect
sekmesini kapatma.

Hacim varsayılan olarak dardır: metinler son 3 sürüm ve birincil dil için,
build'ler yalnız ikon için, tanıtım teklifleri sınırlı çekilir. Tek uygulamada
111 build ve 17 dil gördük; filtresiz çekim Apple'a yüzlerce istek demek.

**Denetle** → panelde uygulamayı aç, "Denetle"ye bas. Rapor panelde açılır;
istersen aynı raporu tam sayfada da açabilirsin. Çekilen döküm `Submission`'a
eşlenir, kesin kontroller (lint) çalışır, kural kitabından hangi kartların
geçerli olduğu hesaplanır. **App Store Connect API anahtarı gerekmez.**

**Raporlar kaydedilir.** Her denetim IndexedDB'ye yazılır; uygulamayı tekrar
açtığında son rapor doğrudan gelir, model ikinci kez çalışmaz ve para gitmez.
"Yeniden denetle" açıkça istediğinde koşar.

Eski raporlar da durur: uygulama ekranında ve Menü → Denetim geçmişi'nde.
Asıl değeri karşılaştırmada — "geçen ay risk 62'ydi, düzelttik, şimdi 28".

**Rapor dışa aktarılır**: Markdown (ekibe göndermek için), JSON (makine için)
ve panoya kopyalama. Üç çıktı da **maskelidir** — inceleme demo hesabının
şifresi `submission.review.demoAccount.pass` içinde düz metin duruyor ve
maskesiz gönderilse rapor paylaşan herkes onu da paylaşırdı.

Ayarlar'da Worker adresi doluysa model turu da burada koşar: kartlar ve ekran
görüntüleri senin Cloudflare Worker'ından geçip modele gider (`worker/README.md`).
Adres boşsa yalnız kesin kontroller çalışır ve rapor en üstte "bu rapor
eksiktir" der — modele gidecek kartlar tek tek listelenir. Eksikliği gizleyip
temiz skor göstermek en pahalı hata olurdu.

OpenAI anahtarı **eklentide durmaz**; yalnız Worker'ın gizli değişkeninde
durur. Eklenti hiçbir `Authorization` başlığı göndermez.

### Geliştirici: paketi yeniden üret

Denetim mantığı `src/` altındaki TypeScript'ten derleniyor:

```bash
npm run build:ext     # corpus/*.yaml + src/ext/audit.ts → extension/src/audit.bundle.js
npm run test:ext      # derler ve tarayıcısız testleri koşar
```

Kullanıcı bu komutları çalıştırmaz; çıktı repoda durur.

### Eksikler gizlenmez

Okunamayan her uç ve şüpheli her yanıt kaydedilir ve arayüzde uygulama
kartında görünür. "Çekildi" ile "okunamadı" karışırsa buradaki hiçbir sayı
güvenilmez olur.

## Kanarya turu (Uçları yokla)

**Hiçbir şey toplamıyor ve hiçbir şey kaydetmiyor.** Yalnızca App Store
Connect'in ~30 ucunu birer kez çağırıp şunu ölçüyor: uç yaşıyor mu, kaç kayıt
dönüyor, hangi alan adlarıyla cevap veriyor.

Sebep: uçların yarısı tahmin. Resmi API'nin kaynak isimlerinden türetildiler,
`iris/v1`'de aynı isimle var oldukları garanti değil. Körlemesine 600 satır
toplayıcı yazıp sonra alan adlarının tutmadığını görmek, bu beş dakikalık
turdan çok daha pahalı.

Bitince **Raporu panoya kopyala** → sohbete yapıştır. Toplayıcı o rapora göre
yazılacak.

Rapor gizlenmiş çıkar: `password`/`secret`/`token` içeren alanlar `‹gizlendi›`
olur, uzun değerler kırpılır. Yine de göndermeden önce bir göz at.

## Sınırlar ve riskler

Hepsi projenin iç risk kaydında (32 madde, depo dışında).
Özellikle:

- İstekler sıralı ve aralarında 800 ms var. **Bunu hızlandırma** (R1).
- Apple `429` dönerse tur kendini durdurur. O gün bir daha çalıştırma.
- Birden çok takımın varsa yalnızca **seçili takım** okunur (R6).
- Çekim sırasında ASC sekmesini kapatma (R7).

## Dosyalar

| Dosya | İş |
|---|---|
| `manifest.json` | izinler, giriş noktaları |
| `background.js` | service worker — sekmeyi bulur, kodu enjekte eder, durumu saklar |
| `sidepanel.html/js` | **tek yüzey** — her ekran burada |
| `ui/app.css` | tasarım sistemi |
| `ui/audit-run.js` | denetimi çalıştırır (döküm toplama, ayarlar, ağ izni) |
| `ui/report.js` | raporu çizer **ve** Markdown'a döker |
| `src/iris.js` | istek çekirdeği: throttle, 429'da durma, sayfalama |
| `src/endpoints.js` | **uç haritası** — neyin çekileceğinin tek kaynağı |
| `src/canary.js` | uçları yoklayan tur |
| `src/collector.js` | **toplayıcı** — grafı gezer, ham veriyi ve red metinlerini üretir |
| `src/store.js` | IndexedDB deposu (yarın Supabase olacak arayüz) |
| `src/audit.bundle.js` | `src/ext/audit.ts`'ten derlenen denetim motoru — **elle düzenleme** |
| `src/iap-price.bundle.js` | fiyat zincirini çözen ortak kod — **elle düzenleme** |
| `test/run.mjs` | tarayıcısız testler — `npm run test:ext` |

`popup.html/js` v0.6.0'da silindi: simgeye basınca açılan kutuda üç düğme
vardı, ikisi zaten seni tam sayfaya götürüyordu. Yerini yan panel aldı.

`viewer.html/js` v0.8.0'da silindi. Yarım hâl kendi hatasını üretmişti:
panelde başlattığın çekim tam sayfada görünmüyordu, çünkü ikisi ayrı sayfaydı
ve durum birinden ötekine akmıyordu. Senkronlamak yerine kaynağı kaldırdık —
tek yüzeyde senkronlanacak bir şey yok (belkiPatlarız R18).
