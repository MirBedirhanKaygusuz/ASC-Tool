# belkiPatlarız.md

Chrome eklentisiyle App Store Connect'ten veri çekme işinin **bilinen kırılma
noktaları**. Amaç korkutmak değil: her riski önceden yazıp, *nasıl anlayacağımızı*
ve *ne yapacağımızı* baştan kararlaştırmak. Sürprizin maliyeti riskin kendisinden
yüksek.

Her madde şu düzende: **ne** · **neden** · **nasıl anlarız** · **ne yaparız**.

Ciddiyet ölçüsü tek soruya bakıyor: *patlarsa fark eder miyiz?*
Sessizce yanlış veri üreten bir hata, gürültüyle çöken bir hatadan **her zaman
daha pahalıdır** — bu dosyadaki sıralama da ona göre.

| # | Risk | Ciddiyet | Fark eder miyiz? |
|---|---|---|---|
| R1 | Apple hesabına zarar (hız sınırı / şüpheli trafik) | **YÜKSEK** | Evet, geç |
| R2 | iris alan adı sessizce değişir → boş veri | **YÜKSEK** | **Hayır** ← en tehlikeli |
| R3 | Eşleme hatası → denetim yanlış "temiz" der | **YÜKSEK** | **Hayır** |
| R4 | Demo hesap şifresi ham döküme sızar | **YÜKSEK** | Hayır |
| R5 | iris ucu komple gider (404/403) | ORTA | Evet, hemen |
| R6 | Oturum düşer / 2FA / yanlış takım | ORTA | Evet, hemen |
| R7 | MV3 service worker uzun çekimde ölür | ORTA | Evet |
| R8 | IndexedDB silinir → veri gider | ORTA | Evet, geç |
| R9 | Unpacked eklenti kaybolur / kapatılır | ORTA | Evet |
| R10 | Ofiste veri dağınıklığı (herkeste ayrı kopya) | ORTA | Hayır |
| R11 | Sayfalama eksik → geçmişin bir kısmı gelmez | ORTA | **Hayır** |
| R12 | Çekim çok uzun sürer, kullanıcı bırakır | DÜŞÜK | Evet |
| R13 | Apple'ın kullanım şartları | DÜŞÜK-belirsiz | Hayır |
| R14 | Arayüz kilitlenir, kullanıcının çıkışı kalmaz | ORTA | Evet, anında |
| R15 | Model maliyeti kontrolsüz büyür / anahtar sızar | **YÜKSEK** | Faturada, geç |
| R16 | Süs netliği aşındırır → eksik veri fark edilmez | ORTA | **Hayır** |
| R17 | Yan panel API'si yok (Chrome < 114) → simge ölü | DÜŞÜK | Evet, anında |
| R18 | İki yüzey ayrışır → iki farklı sonuç | ORTA | **Hayır** |
| R19 | Denetim raporu kaybolur → para, geçmiş ve kanıt gider | ORTA | Evet, geç |
| R20 | Yalancı alarm → uyarı listesi okunmaz olur | ORTA | **Hayır** |
| R21 | Sorulan beyan hiçbir kuralı tetiklemiyor | ORTA | **Hayır** |
| R22 | Kapsam sayısı "yakalama oranı" diye okunur | ORTA | **Hayır** |
| R24 | Kart, `needs` dediği veriyi GÖRMEDEN yargılıyor | **YÜKSEK** | **Hayır** |
| R25 | Skor tavana yapışıyor → ilerleme ölçülemiyor | ORTA | Hayır |
| R26 | Kayıtlı rapor bugünün şablonuyla TAZE görünüyor | **YÜKSEK** | **Hayır** |
| R27 | Rapor listing'in yayında olduğunu söylemiyor | ORTA | **Hayır** |
| R28 | Tek kartın hatası TÜM denetimi düşürüyor | **YÜKSEK** | Evet, anında |
| R29 | Dakikalık token kotası (TPM) doluyor | **YÜKSEK** | Evet, anında |
| R30 | Tek sorun N bulgu olarak sayılıp skoru şişiriyor | ORTA | **Hayır** |
| R31 | Kart, modelin bilmediği olguyu vermiyor → saçma öneri | ORTA | Evet, gözle |
| R32 | İki kart aynı işi yapıyor → rapor tekrara düşüyor | DÜŞÜK-ORTA | Evet, gözle |
| R23 | Dağıtılan paket sızdırır ya da eskidir | ORTA | Hayır / geç |

---

## R1 · Apple hesabına zarar — hız sınırı, kilit, şüpheli trafik

**Ne.** `iris/v1` Apple'ın kendi arayüzünün kullandığı iç API. Normalde saniyede
bir-iki istek görür. Biz "her şeyi çek" dediğimizde tek oturumdan yüzlerce istek
gidecek. Aşırıya kaçarsa: `429 Too Many Requests`, geçici IP/hesap kısıtı, en
kötü senaryoda hesabın incelemeye takılması.

**Neden ciddi.** Kaybedilen şey kod değil, **App Store Connect hesabı**. Bu
projenin var oluş sebebi o hesap. Hiçbir veri o riske değmez.

**Nasıl anlarız.** `429` yanıtı, ani `403`'ler, ASC arayüzünün tarayıcıda
yavaşlaması/oturumun atması.

**Ne yaparız.**
- İstekler **sıralı**, aralarında **800 ms** bekleme. Paralel istek yok. (Mevcut
  `asc-grab.js` de bu kuralla çalışıyor, aylardır sorun çıkarmadı.)
- İlk `429`'da **çekim tamamen durur**. Yeniden denemez, yavaşlamaz — durur ve
  "Apple hız sınırı verdi, bugün bir daha çekme" der.
- **Artımlı çekim**: ilk turdan sonra yalnız değişenler alınır. İkinci çekim
  yüzlerce değil onlarca istek olur.
- Aynı anda iki sekmede/iki kişide çekim yapılmaz (eklenti kilitler).
- "Her şey" varsayılan değil: ekran görüntüsü ve kullanıcı yorumu gibi ağır uçlar
  kapalı gelir, isteyen açar.

---

## R2 · iris alan adı sessizce değişir — en tehlikeli madde

**Ne.** Uç `200 OK` döner, JSON gelir, ama `attributes.reasons` artık
`attributes.rejectionReasons` olmuştur. Kodumuz `undefined` görür, boş dizi
üretir, hiçbir hata fırlatmaz.

**Neden ciddi.** Ekranda şunu görürsün:

> Housify: 0 red bulundu.

Sen bunu "bu uygulama hiç reddedilmemiş" diye okursun. Gerçekte 12 red vardır.
Ders deposuna hiçbiri girmez, denetim o kalıpları bilmez, rapor "temiz" der.
**Hiçbir yerde hata log'lanmaz** — teknik olarak hata olmadı, sadece boş bir dizi.

Bu zaten bir kez başımıza geldi; kodda yara izi duruyor:

```js
const raw = attrs.reasons ?? attrs.reviewRejectionReasons   // asc-grab.js
```

**Nasıl anlarız.** Kendiliğinden anlamayız. Anlamak için kod yazmak gerekir.

**Ne yaparız.**
- `200` yeterli sayılmaz: **beklenen anahtar var mı** diye bakılır. Yoksa sonuç
  "boş" değil **"şüpheli"** işaretlenir.
- Sonuçlar üç kovaya ayrılır ve arayüzde üçü de gösterilir:
  `çekildi` / `gerçekten boş` / `okunamadı`. Üçüncü kova doluyken hiçbir ekran
  "temiz" demez.
- **Ham JSON olduğu gibi saklanır.** Alan adı değiştiğinde arşivden yeniden
  üretiriz — Apple'a tek istek daha gitmez.
- Kanarya turu: çekimden önce uçların hâlâ beklenen alanları döndürdüğü yoklanır.
- Sıfır sonuçlu bir alan, bir önceki çekimde doluysa **alarm** verir
  ("geçen sefer 12 red vardı, şimdi 0 — bir şey değişmiş olabilir").

---

## R3 · Eşleme hatası — denetim yanlış "temiz" der

**Ne.** iris verisi bizim `Submission` tipimize çevrilirken bir alan yanlış yere
bağlanır: örneğin `promotionalText` boş gelir, `keywords` yanlış dilden okunur,
`price` sıfır kalır.

**Neden ciddi.** Denetim boş alanı ihlal görmez. Rapor "sorun yok" der, uygulama
gider ve reddedilir. Projenin tek işi bunu engellemekti.

**Nasıl anlarız.** Kendiliğinden anlamayız — bu yüzden R2 ile aynı sınıfta.

**Ne yaparız.**
- **Çapraz doğrulama:** aynı uygulama hem `.p8` resmi API'sinden hem iris'ten
  çekilir, alanlar karşılaştırılır. İkisi uyuşana kadar eşleme bitmiş sayılmaz.
  (Bu, `.p8`'i geliştirme sırasında tutmamızın tek sebebi. Ofis kullanıcısı
  hiç görmeyecek.)
- Boş metin alanı "boş" değil **"okunamadı"** sayılır; rapor bunu ayrı listeler
  — projede zaten var olan `notChecked` mantığı.
- Şu an çalışan `npm run check` çıktısıyla eklentinin çıktısı aynı uygulamada
  karşılaştırılır. Fark varsa eklenti yayınlanmaz.

---

## R4 · Demo hesap şifresi ham döküme sızar

**Ne.** `appStoreReviewDetail` içinde `demoAccountName` ve `demoAccountPassword`
düz metin duruyor. "Her şeyi çek" dediğimizde bu da geliyor. Ham döküm dışa
aktarılıp paylaşılırsa şifre paylaşılmış olur.

**Nasıl anlarız.** Anlamayız — dosyayı kimse açıp okumaz.

**SESSİZ AÇIK (2026-08-21'de kapatıldı).** Desen `password` arıyordu ama
`Submission.review.demoAccount` şifreyi **`pass`** anahtarıyla taşıyor —
desene uymuyordu. Yani denetim raporunu dışa aktaran herkes inceleme demo
hesabının şifresini de gönderiyordu. Desen kısa olduğu için gözden kaçmıştı.
Artık `^pass$` ve `^pwd$` de kapsanıyor; `demoAccountName` ve `user` kişisel
veri sayılıyor. Test bunu doğrudan sınıyor.

**Ne yaparız.**
- Kanarya raporunda ve dışa aktarılan JSON'da `/password|secret|token|key/i`
  eşleşen alanlar `‹gizlendi›` ile değiştirilir.
- **Denetim raporu dışa aktarımı (Markdown/JSON/pano) her zaman maskelidir.**
  Maskesiz tek yol bilinçli ve etiketli: Menü → Yedek → "Tam yedek".
- Şifre yalnızca yerel depoda, denetimin ihtiyacı olduğu yerde tutulur.
- "Dışa aktar" düğmesi iki sürüm sunar: **paylaşılabilir** (gizlenmiş) ve
  **tam yedek** (uyarı metniyle).

---

## R5 · iris ucu komple gider

**Ne.** `404`, `403`, uç adı değişmiş ya da kaldırılmış. Özellikle yeni
ekleyeceğim uçlar için gerçek bir olasılık: `appEvents`, `appCustomProductPages`,
`appStoreVersionExperimentsV2`, `appPriceSchedule`, `customerReviews` — bunları
senin hesabında hiç çağırmadım, adlarını resmi API'nin kaynak isimlerinden
türetiyorum.

**Neden hafif.** Gürültülü kırılma. Fark ederiz, düzeltiriz.

**Ne yaparız.** Her uç ayrı `try` içinde. Patlayan uç `atlandı[]` listesine
yazılır, diğerleri devam eder. Arayüz "şu 3 uç okunamadı" der. Kritik uçlar
(`apps`, `appStoreVersions`, `resolutionCenterThreads`) patlarsa çekim durur —
onlarsız üretilen veri yanıltıcı olur.

---

## R6 · Oturum düşer, 2FA, yanlış takım

**Ne.** ASC oturumu çekim ortasında düşebilir. Ya da kullanıcının birden çok
takımı (provider) vardır ve eklenti yanlış takımın uygulamalarını çeker.

**Nasıl anlarız.** Ani `401`/`403` yığını, ya da beklenen uygulamanın listede
olmaması.

**Ne yaparız.**
- Çekim öncesi `/olympus/v1/session` okunur: kullanıcı ve **takım adı** ekranda
  yazar. Yanlışsa kullanıcı görür.
- Birden çok takım varsa uyarır: "3 takımın var, şu an X seçili. Diğerleri için
  ASC'de takım değiştirip tekrar çek."
- Ortada `401` gelirse çekim durur, o ana kadar toplanan **saklanır**, "oturumun
  düştü, giriş yapıp kaldığı yerden devam et" denir.

---

## R7 · MV3 service worker ölür

**Ne.** Chrome, boşta duran service worker'ı ~30 saniyede kapatır. Uzun çekim
ortasında kapanırsa iş yarıda kalır.

**Ne yaparız.** İşi service worker değil, **sayfaya enjekte edilen kod** yürütür
(bugünkü snippet gibi) — o, sekme açık olduğu sürece yaşar. Service worker yalnız
mesaj taşır ve her mesaj onu zaten diri tutar. Ayrıca her uygulama bitince veri
diske yazılır: kesinti olsa bile o ana kadarki iş durur.

**Yan etki:** çekim sırasında **ASC sekmesi kapatılmamalı**. Arayüz bunu yazacak,
kapatılırsa "yarıda kaldı, devam et" diyecek.

---

## R8 · IndexedDB silinir

**Ne.** Veri eklentinin IndexedDB'sinde. Kullanıcı eklentiyi kaldırırsa, Chrome
profilini sıfırlarsa ya da "site verilerini temizle" derse gider.

**Ne yaparız.** İlk sürümde **Dışa/İçe aktar** düğmeleri olacak. Supabase gelene
kadar yedek bu. Ayrıca uzun süre yedek alınmadıysa arayüz hatırlatır.

---

## R9 · Unpacked eklenti kaybolur ya da kapatılır

**Ne.** Paketlenmemiş eklenti diskteki klasöre bağlı. Klasör taşınır/silinirse
eklenti ölür. Chrome her açılışta "geliştirici modundaki eklentileri devre dışı
bırak" uyarısı gösterir; biri "tamam" derse eklenti kapanır. Kurumsal politika
geliştirici modunu tamamen kapatmış olabilir.

**Ne yaparız.** Klasör sabit ve makul bir yere kurulur (Masaüstü değil), kurulum
adımları `extension/README.md`'de yazılı olur. Uyarı balonunun ne olduğu ofise
bir kez anlatılır. Kalıcı çözüm mağazaya "listelenmemiş" yayın — şimdilik
kapsam dışı, kod değişmeden yapılabilir.

---

## R10 · Ofiste veri dağınıklığı

**Ne.** Yerel depolamada herkesin kendi kopyası olur. Ahmet'in çektiği red
geçmişini Ayşe göremez; ikisi aynı red'i ayrı ayrı işler, iki ayrı ders çıkar.

**Neden sinsi.** Kimse hata görmez — sadece proje öğrenmez. Aynı red iki kez
yaşanır.

**Ne yaparız.** DERS TARAFI ÇÖZÜLDÜ (`havuz/`): ortak havuz kendi sunucunda
Docker + Postgres olarak koşuyor. Terminaldeki `learn`/`check` ve eklentinin
denetimi aynı ders setini okuyor; `learn`ün aday havuzu artık ofisin tamamını
görüyor, yani aynı red'den iki ders çıkmıyor — ikinci kişi birincinin dersine
örnek ekliyor. Geçiş `.env`de üç satır (`GREENLIGHT_STORE=havuz`), eldeki veri
`npm run lessons -- push` ile taşınıyor. Arayüzün arkasında yazılmış olması
(`LessonStore`) bunu tek dosyalık bir iş yaptı; kurulum
[havuz/README.md](havuz/README.md).

**Kalan yarı.** HAM ÇEKİMLER hâlâ her makinede ayrı IndexedDB'de: Ahmet'in
çektiği listing dökümünü Ayşe göremiyor. Ders havuzu bunu kısmen kapatıyor
(öğrenilen kalıp ortak) ama "aynı uygulamayı iki kişi ayrı ayrı çekiyor"
duruyor. Köprü hâlâ dışa/içe aktarma.

**Havuzun kendi riski.** Ortak depo tek arıza noktası da demek: sunucu düşerse
kimse ders göremez. Bu yüzden yerel depo KALDIRILMADI (`GREENLIGHT_STORE=local`
hâlâ çalışıyor) ve havuza ulaşılamadığında denetim durmuyor — yalnız kartlarla
koşuyor ve raporda "ortak ders havuzuna ulaşılamadı" yazıyor. Sessizce derssiz
koşmak, raporu olduğundan güvenilir gösterirdi. İkinci risk yedek: ofisin red
geçmişi artık tek makinede, `npm run havuz:yedek` bir zamanlanmış işe bağlanmalı.

---

## R11 · Sayfalama eksik kalır

**Ne.** iris sayfalı döner (`links.next`). Takip edilmezse ilk 20-50 kayıt gelir,
gerisi sessizce düşer. "Uygulamanın 40 sürümü var" yerine 20 görürsün.

**Neden sinsi.** Hata yok, eksik veri var. R2 ile aynı aile.

**Ne yaparız.** `links.next` her yerde takip edilir (kod zaten böyle). Ek olarak:
sayfa sayısı ve toplam kayıt sayısı raporlanır, `meta.paging.total` ile toplanan
sayı karşılaştırılır, tutmuyorsa **şüpheli** işaretlenir.

---

## R12 · Çekim uzun sürer

**Ne.** 800 ms × yüzlerce istek. 5 uygulamanın tam geçmişi birkaç dakika.
Kullanıcı sekmeyi kapatır, iş yarıda kalır.

**Ne yaparız.** İlerleme çubuğu ve "kaç uygulama kaldı" göstergesi. Uygulama
bazında kayıt (yarıda kalan iş kaybolmaz). Ağır uçlar varsayılan kapalı.
İkinci çekimden itibaren artımlı.

---

## R13 · Apple'ın kullanım şartları

**Ne.** `iris/v1` dokümante edilmemiş bir iç API. Kendi hesabının verisini kendi
oturumunla okuyorsun — tarayıcının zaten yaptığı şeyin aynısı. Yine de Apple'ın
"otomatik erişim" maddeleri kesin bir zemin sunmuyor.

**Ne yaparız.** Trafiği tarayıcının doğal davranışına yakın tut (R1'deki bütün
kurallar aynı zamanda buranın da cevabı). Toplu/agresif tarama yok, sadece kendi
hesabın, sadece kullanıcı tıkladığında. Bir gün Apple bu yolu kapatırsa `.p8`
resmi API'si listing için ayakta kalır — kaybedilen yalnız red geçmişi olur
(ki resmi API'de zaten hiç yok).

---

## R14 · Arayüz kilitlenir, çıkış yolu kalmaz

**Ne.** Bir durum bayrağı ("çalışıyor") düğmeyi kapatır ve bayrak yanlış
kalırsa kullanıcı hiçbir şey yapamaz. 2026-08-20'de tam olarak bu oldu:
eşzamanlı durum yazımları birbirini ezdi, tur bittiği halde `running` true
kaldı, düğme sonsuza kadar kapandı.

**Neden ciddi.** Veri kaybı yok ama ürün ölür. Kullanıcının elinde tek bir
düğme varsa, o düğmenin çalışmadığı an ürün yok demektir.

**Ne yaparız.**
- **Hiçbir bayrak tek çıkış yolu olamaz.** Düğme her koşulda tıklanabilir;
  tıklama turu baştan başlatır, eski tur kendini iptal eder (`runId`).
- Durum yazımları tek bir sıradan geçer — eşzamanlı "oku-değiştir-yaz" yok.
- Takılma dedektörü: 45 saniye sessizlikte arayüz "takılmış görünüyor" der.
- Popup, sayfada gerçekten hangi kod sürümünün koştuğunu gösterir; "eklentiyi
  yenilemeyi unutmak" görünmez bir hata olmaktan çıkar.

---

## R15 · Model maliyeti ve anahtar

**Ne.** Denetim uygulama başına onlarca model çağrısı yapıyor (kart başına bir
çağrı + doğrulama oylaması). Döngüye giren bir hata ya da eklentiyi keşfeden
biri, gecede aylık bütçeyi yakabilir. Anahtar eklentiye gömülseydi, klasörü
açan herkes görürdü ve sızdığında haberin bile olmazdı.

**Nasıl anlarız.** Faturada — yani geç.

**Ne yaparız.**
- Anahtar yalnızca Cloudflare Worker'da. Eklenti `Authorization` başlığı
  göndermiyor (testle bağlı).
- Worker'da günlük istek tavanı. Ama KV nihai tutarlı: sayaç **yaklaşıktır**,
  yarışta birkaç istek fazla geçebilir.
- **Kesin tavan OpenAI hesabındaki harcama sınırıdır.** Tek gerçek durdurucu
  odur; Worker'ınki ilk fren.
- Deterministik çağrılar (`temperature 0`) 6 saat önbellekte. Aynı denetimi
  tekrar koşmak para ödetmiyor. Doğrulama oylaması (`temperature > 0`)
  önbelleğe ALINMAZ — alınsaydı üç oy aynı yanıt olur ve ikinci göz anlamını
  yitirirdi.
- Önbellek isabeti günlük tavandan düşmez: bedava olan şey kotadan sayılmaz.
- Origin ve istemci belirteci kontrolü **kimlik doğrulama değildir** (Origin
  `curl` ile uydurulabilir, belirteç eklentinin içinde durur). Rastgele bulan
  birini engeller, kararlı birini değil. Tavanlar bu yüzden asıl savunma.

---

## R16 · Süs netliği aşındırır

**Ne.** Bu arayüzün en önemli işi kötü haber vermek: "3 uç okunamadı",
"fiyat okunamadı", "bu rapor eksiktir". Bu cümleler kullanıcının kararını
değiştiren cümleler. Tasarım ya da üslup onların önüne geçtiğinde gerçek bir
zarar oluşuyor — kullanıcı eksik bir raporu tam sanıyor. Bu, R2 ve R3'ün
arayüzden gelen versiyonu: veri yanlış değil, **verinin eksik olduğu mesajı**
yanlış anlaşılıyor.

İki yoldan olabiliyor:

1. **Üslupla.** Uyarıyı esprili bir etikete gizlemek ("Sabıka temiz.
   Şimdilik.") — kullanıcı onu ciddiye almıyor.
2. **Görsel gürültüyle.** Uyarı satırını kutuların, çerçevelerin, kabartmaların
   arasında kaybetmek — kullanıcı onu hiç görmüyor.

**Nasıl anlarız.** Kendiliğinden anlamayız. Kimse "şu uyarıyı fark etmedim"
demez; sadece yanlış karar verir. Yalnızca gözle yakalanır — o yüzden kural
yazılı.

**Ne yaparız.**

- Veri kalitesi bildiren satır **düz** yazılır: şaka yok, ikon yok, arka plan
  yok. Sol kenarda renkli bir çizgi ve renkli metin, o kadar (`.note.bad`).
- Renk **bilgi taşır, süs değildir**: kırmızı = gerçek problem, amber =
  bilinmiyor, yeşil = temiz. Dördüncü bir renk yok.
- Üç durumlu beyan düğmelerinde "Bilmiyorum" birinci sınıf seçenek ve ne
  anlama geldiği **açıkça** yazılı: o kartlar denetime girmez.
- Eksik veri, ana tabloda ayrı bir kolonda durur (`Veri`) — ayrıntıya girmeden
  hangi uygulamanın eksik çekildiği görünür.

**Tasarım geçmişi (iki kez yanlış yapıldı).** Bu madde teorik değil:

| Deneme | Ne oldu |
|---|---|
| "Genel amaçlı temiz" — yuvarlak kart, soluk palet, bol boşluk | İşliyordu ama karaktersizdi; 20 uygulama 20 ekran boyu sürüyordu, karşılaştırma imkânsızdı |
| 90'lar masaüstü taklidi (`win95.css`) | Kostüm gibi durdu, okumayı zorlaştırdı, uyarı satırları süslü etiketlere gizlendi. **Geri alındı.** |
| Süssüz tablo (elektronik tablo görünümü) | Yoğunluk doğruydu ama çıplaktı; hiyerarşi yoktu, her şey aynı ağırlıkta okunuyordu. **Geri alındı.** |
| Bugünkü (`app.css`) | Modern ama kostümsüz: trafik ışığı paleti (yeşil geçti / amber bilinmiyor / kırmızı red), yükselti kartı zeminden ayırır, geçiş tıklamanın kaydedildiğini söyler |

Kural o yüzden şu: bir stil kararı ya **daha fazla bilgi gösterir**, ya **bir
uyarıyı daha görünür kılar**, ya da **neyin tıklanabilir olduğunu söyler**.
Üçünü de yapmıyorsa gerekçesi yok demektir.

Renk bu üründe anlam taşıyor ve dördüncü bir dekoratif renk yok:

| Renk | Anlamı | Nerede |
|---|---|---|
| Yeşil | geçti / güvenli / birincil eylem | skor < 35, "tam" durumu, ana düğme |
| Amber | **bilinmiyor** ya da orta risk | eksik uç, "bu rapor eksiktir", orta bulgu |
| Kırmızı | red sebebi / kesin problem | Apple reddi, yüksek bulgu, okunamayan uç |

---

## R17 · Yan panel API bağımlılığı

**Ne.** v0.6.0 popup'ı sildi, yerine `chrome.sidePanel` koydu. Bu API Chrome
114 ile geldi (Mayıs 2023). Daha eski bir Chrome'da `chrome.sidePanel`
tanımsızdır; manifest'teki `side_panel` girdisi yok sayılır ve
`action.default_popup` da olmadığı için **simgeye basınca hiçbir şey olmaz**.
Kullanıcı için bu "eklenti bozuk" demektir.

**Nasıl anlarız.** Anında — ama yalnızca o makinede. Ofiste tek bir eski
Chrome varsa onu kullanan kişi eklentiyi kırık sanır ve muhtemelen sana
söylemez.

**Ne yaparız.**
- `background.js` açılışta `chrome.sidePanel?.setPanelBehavior` var mı diye
  bakar. Varsa simge paneli açar.
- **Yoksa** `chrome.action.onClicked` ile `sidepanel.html` bir SEKMEDE açılır.
  Sayfa bağımsız çalışıyor: panel API'si olmasa da her iş görülüyor, sadece
  App Store Connect'in yanında değil ayrı sekmede. Çalışmayan bir düğme,
  eksik bir özellikten kötüdür.
- Test her iki yolu da bağlıyor: `sidePanel` varken sekme-açan geri düşme yolu
  **kurulmuyor** (yoksa simge hem panel açar hem sekme).
- Panel açılmıyorsa kullanıcıya söylenecek şey: Chrome sürümünü kontrol et
  (`chrome://version`), 114'ten eskiyse güncelle.

---

## R18 · İki yüzey ayrışır

**Ne.** Bir dönem eklentinin iki yüzeyi vardı: yan panel ve tam sayfa
görüntüleyici. Aynı veriyi iki ayrı sayfa gösteriyordu ve aralarında hiçbir
durum akışı yoktu.

**Nasıl patladı (2026-08-21).** Kullanıcı panelde çekim başlattı, tam sayfaya
geçti — orada hiçbir şey görünmüyordu. Çekim çalışıyordu ama sayfa bunu
bilmiyordu. Kullanıcının makul yorumu: "bozuk". İkinci kez başlatması işleri
daha da kötüleştirirdi (Apple'a çift yük, R1).

**Karar: yüzeyi senkronlamak yerine KALDIRDIK.** İki sayfayı `chrome.storage`
üzerinden canlı senkronlamak mümkündü ama yanlış cevaptı — hata sınıfını
kapatmıyor, yönetiyordu. Bugün tek yüzey var: `sidepanel.html`. Senkronlanacak
bir şey kalmadı.

**Aynı riskin kalan hâli: KOD ayrışması.** Yüzey tek ama denetimi çalıştıran
ve raporu çizen kod hâlâ ayrı dosyalarda. İki yere kopyalansaydı zamanla
ayrışırdı: biri düzeltilir, öteki unutulur, aynı uygulama için farklı skorlar
çıkardı. Kullanıcı hangisine inanacağını bilemez ve **ikisine de inanmaz**.

**Ne yaparız.**
- Denetimi çalıştıran kod TEK dosyada: `extension/ui/audit-run.js` (`GLRun`).
  Döküm toplama, `DUMP_SECTIONS`, ayar okuma, ağ izni, model turu.
- Raporu çizen VE metne döken kod TEK dosyada: `extension/ui/report.js`
  (`GLReport.render` + `GLReport.markdown`). Ekranda gördüğün rapor ile
  gönderdiğin dosya aynı yerden çıkıyor.
- Sayfa bu modülleri yüklemek zorunda ve **sıra testle bağlı**: eksik ya da
  yanlış sıralı bir `<script>` etiketi testi kırmızı yakar. Bu hatayı bir kez
  yaşadık — panel sessizce açıldı, "Denetle"ye basınca `GLRun is not defined`
  dedi. Yani hata, kullanıcının en çok ihtiyaç duyduğu anda ortaya çıkıyordu.
- **Maskeleme kuralı iki yerde:** `src/store.js` ve `src/canary.js`. Kanarya
  ASC sayfasına enjekte edildiği için depoyu import edemiyor; kopya zorunlu.
  Test iki deseni **karakter karakter** karşılaştırıyor.

---

## R19 · Denetim raporu kaybolur

**Ne.** Denetim sonucu uzun süre yalnızca bellekte durdu. Panel kapanınca
rapor uçuyordu.

**Neden ciddi — üç ayrı zarar.**

1. **Para.** Rapora tekrar bakmak istemek modeli yeniden çalıştırıyordu.
   Kullanıcı "sadece bakacaktım" derken uygulama başına onlarca model çağrısı
   ödüyordu (R15).
2. **Karşılaştırma imkânsızdı.** Ürünün asıl vaadi "düzelttin mi, düzeldi mi"
   sorusuna cevap vermek. Geçmiş yoksa cevap da yok.
3. **Kanıt yok.** "Bu sürümü denetledik, skor 28'di" diyemiyorduk.

**Ne yaparız.**
- `audits` deposu (IndexedDB, `keyPath: 'id'`, `appId` indeksli). Kayıt
  **tüm sonucu** taşıyor — özet saklayıp raporu atmak cazip ama yanlış:
  rapor bir daha çizilemez ve dışa aktarılamaz olurdu.
- id = `appId::zaman`. Her koşu ayrı kayıt; üzerine yazsaydık geçmiş diye bir
  şey kalmazdı.
- **Depo sürümü 2'ye çıktı.** `VERSION` artmasaydı `onupgradeneeded`
  çalışmaz, mevcut kullanıcıda depo hiç oluşmaz ve yazma sessizce patlardı.
  Test `VERSION >= 2` diye bakıyor.
- Yazma başarısız olursa **söylenir**. Kullanıcı "kaydedildi" sanıp paneli
  kapatırsa rapor gider; sessiz kalmak burada en pahalı seçenek.
- Denetim ekranı kayıt varken **kendiliğinden koşmaz**. Model ancak
  "Yeniden denetle" açıkça istendiğinde çalışır.
- Kayıtlar büyük; sınırsız büyürse kota dolar ve ÇEKİM yazımları sessizce
  düşer. Budama var (uygulama başına son 5) ama **kullanıcı isteğiyle**
  çalışıyor — kimse geçmişini habersiz kaybetmemeli.
- Yedek dosyası denetimleri de taşıyor (`export version 2`). Eski (v1)
  dosyalar hâlâ okunuyor: eksik anahtar atlanıyor, hata verilmiyor.

**Dışa aktarma MASKELİ.** Rapor `submission.review.demoAccount.pass` içinde
inceleme demo hesabının şifresini taşıyor. Bkz. R4 — desen bu yüzden
genişletildi.

---

## R20 · Yalancı alarm — R2'nin ikiz kardeşi

**Ne.** Bu dosyanın en pahalı maddesi R2: eksiği gizleme. Ama tersi de aynı
yere varıyor. Uyarı listesine sorun olmayan şeyler doldurursan liste okunmaz
olur; içine düşen GERÇEK uyarı da görülmez. Sonuç yine aynı — eksik veriyle
"sorun yok" sanmak.

**Nasıl patladı (2026-08-21, Housify AI).** Panel "Şüpheli yanıtlar (5)"
diyordu. Beşinin beşi de şüpheli değildi:

| Satır | Aslında ne |
|---|---|
| `builds: bilerek ilk 3 kayıt alındı (toplam 35)` | ayarlardaki hacim tavanı |
| `subOffers: bilerek ilk 30 kayıt alındı (toplam 175)` | ayarlardaki hacim tavanı |
| `subscriptions: 30 teklif satırı 1 tekil teklife indi` | sadeleştirme izi |
| `iapPrices: çalışan yol: /iris/v2/…` | tanı izi |
| `iapPrices: 3 üründen 3 tanesinin fiyatı okundu` | **tam başarı** |

Sonuncusu maddenin özeti: tam başarı, uyarı listesinde. Kullanıcı "5 şüpheli"
görüp aracın bozuk olduğunu düşünüyor; birkaç kez böyle olunca listeye hiç
bakmıyor. O gün gerçek bir uyarı düşse görmeyecek.

Bu tuzağa bir kez daha düşülmüştü ve kodda yara izi duruyor: fiyat okuma
sırasında ürün başına "çözülemedi" düşüyordu, çizelgeden okunan fiyat o
satırları geri almıyordu — "10 şüphelinin 6'sı yalancı alarmdı". O sefer
belirti düzeltildi, sınıf düzeltilmedi.

**Nasıl anlarız.** Kendiliğinden anlamayız. Kimse "bu uyarıyı ciddiye almadım"
demez. Ancak listeye gerçekten bakan biri fark eder.

**Ne yaparız.** `app.supheli` artık üç kova taşıyor ve her kayıt `tur`
alanıyla etiketleniyor:

| `tur` | Anlamı | Arayüzde |
|---|---|---|
| `supheli` | Beklenmedik. Veri yanlış ya da eksik olabilir. **Varsayılan.** | "Şüpheli yanıtlar" — amber |
| `sinir` | Bilerek. Hacim tavanı devreye girdi; sayılar "en az" demek. | "Bilerek sınırlandı" — nötr |
| `not` | Tanı izi. Hangi yol çalıştı, ne kadarı okundu. | "Çekim notları" — nötr |

- **Emin değilsen `supheli` bırak.** Fazla uyarmak, eksik uyarmaktan iyidir —
  ama "fazla uyarmak" varsayılan olmalı, alışkanlık değil.
- Özet satırı ile alarm satırı AYRI: "3 üründen 3'ü okundu" bir `not`;
  okunamayan ürün varsa o ayrıca ve `supheli` olarak yazılıyor.
- Etiketsiz eski kayıtlar `supheli` sayılıyor. Metinden ayıklamıyoruz;
  yeniden çekince doğru etiketi alıyorlar.
- Çekim özeti de yalnız gerçek şüpheliyi sayıyor.

---

## R21 · Sorulan beyan hiçbir kuralı tetiklemiyor

**Ne.** Arayüz kullanıcıya dört soru soruyor: giriş gerekiyor mu, üçüncü taraf
giriş var mı, AI içerik üretiyor mu, kullanıcı içeriği var mı. Bir soru hiçbir
kartı ve hiçbir lint kontrolünü tetiklemiyorsa **o soru yalandır**: kullanıcı
cevaplıyor, hiçbir şey değişmiyor, ama cevapladığı için o konunun
denetlendiğini sanıyor.

**Nasıl patladı (2026-08-25'te bulundu).** `generatesAiContent` aylarca
soruldu ve **sıfır** kart tetikledi. Bir AI uygulaması "AI içerik üretiyor:
Evet" işaretliyor, denetim AI'a dair tek kural çalıştırmıyor, rapor temiz
görünüyordu. Aynı durum `hasUserGeneratedContent` için de kısmen geçerliydi:
yalnız bir lint (yaş sınırı) vardı, hiç LLM kartı yoktu.

Bu R3'ün kural kitabında açılmış hâli. R3 "eşleme hatası → denetim yanlış
temiz der" diyor; burada eşleme doğru, **kural yok**. Sonuç aynı.

**Neden fark edilmez.** Rapor "AI ile ilgili kural bulunamadı" demiyor —
hiçbir şey demiyor. Yokluk sessizdir; kullanıcı da sorduğu soruya cevap
verdiği için kapsamın genişlediğini varsayıyor. Beyan kutusu, kapsam
genişliğinin görsel vaadi hâline geliyor.

**Ne yaparız.**
- `scripts/test-core.ts` her beyanı tarıyor: **kart YA DA lint** tetiklemek
  zorunda. Tetiklemiyorsa test kırmızı yanıyor. Yeni bir beyan eklenirse ya
  kartı da eklenir ya da soru sorulmaz.
- Kontrol iki yolu birden sayıyor. `requiresLogin` bugün kart tetiklemiyor
  (4.8 `hasThirdPartyLogin`'e taşındı) ama "giriş varsa demo hesap zorunlu"
  lint'ini tetikliyor — yalnız kartlara baksaydık testin kendisi yalancı
  alarm üretirdi (R20).
- Aynı test her Apple kartının **gerçek bir maddeye** atıf yaptığını da
  doğruluyor. Uydurma atıf, uydurma bulgudan beterdir: kullanıcı gidip o
  maddeyi okuyamaz ve aracın tamamına olan güveni gider.

**Yan karar — `hasThirdPartyLogin` neden ayrıldı.** 4.8 (Apple ile Giriş)
yalnızca üçüncü taraf/sosyal giriş sunanları bağlıyor; yalnızca e-posta+şifre
ile giriş yaptıran uygulama muaf. Tek `requiresLogin` bayrağına bağlıyken o
kart her giriş isteyen uygulamada koşuyordu: boşuna model çağrısı **ve**
yalancı alarm riski (R20). Soru yalnızca "giriş gerekiyor: Evet" işaretliyse
görünüyor — gereksiz soru da gürültüdür.

---

## R22 · Kapsam sayısı "yakalama oranı" diye okunur

**Ne.** `npm run kapsam` ve panelin Kapsam ekranı tek bir yüzde üretiyor:
geçmiş redlerin kaçının atıf yaptığı madde için elimizde kart var. Bu sayı
bir **TAVAN**. Ama yüzde işareti gördüğü an insan onu başarı oranı diye
okuyor: "%80 kapsam" → "%80'ini yakalarız".

**Neden yanlış.**

| Sonuç | Ne demek |
|---|---|
| Kart YOK | O red **kesinlikle** yakalanmazdı. Bu bilgi kesin ve değerli. |
| Kart VAR | Yakalanmış **olabilir**. Kartın sorusu o somut soruna denk gelmeyebilir. |

Üstelik pek çok red listing'den hiç görülmez: çöken build, çalışmayan demo
hesap, uygulama içi bir akış. Onlar için kart olması hiçbir şey ifade etmiyor.

**Neden ciddi.** Bu sayı bir toplantıda söylenecek türden. "Aracımız redlerin
%80'ini yakalıyor" cümlesi kurulduğu an, ürün olduğundan iyi görünüyor ve
kimse boşluk listesine bakmıyor. Yani metrik, düzeltmesi gereken şeyi
gizliyor — R2'nin ölçüm katmanındaki hâli.

**Ne yaparız.**
- Adı **kapsam**, "yakalama" değil. Hiçbir yerde "detection" ya da "başarı"
  yazmıyor.
- Uyarı sayıdan ÖNCE geliyor ve kapatılamıyor. Sayıyı üste koyup uyarıyı
  altına yazmak, uyarının okunmaması demekti.
- Paydada **yalnız madde kodlu redler** var. Kodsuz redleri paydaya koymak,
  "bilinmiyor"u "kapsanmıyor" saymak olurdu; sayıları ayrı gösteriyoruz.
- Eşleşme **tek yönlü**: kart daha genel olabilir (`1.2` kartı `1.2.1` redini
  kapsar), daha özel olamaz (`2.3.3` kartı `2.3` redini kapsamaz). 2.3
  altında 2.3.1'den 2.3.12'ye bambaşka kurallar var; birini yazmış olmak
  ötekini bilmek değil. Ters yönü kabul etseydik araç kendini olduğundan iyi
  gösterirdi — bu depoda en yasak şey bu. Testle bağlı.
- Ekranın asıl çıktısı yüzde değil **boşluk listesi**: kartı olmayan
  maddeler, en çok red yediğinden başlayarak. Yüzde bir özet, yol haritası
  o liste.

**İlk koşuda işe yaradı (2026-08-26).** Depodaki iki gerçek red kaydında
kapsam %50 çıktı. Boşluk: **5.6.3 — kullanıcıdan ilk açılışta puan istemek.**
Kartı yoktu, yazıldı (`apple-5.6.3-rating-prompt-timing`), kapsam %100'e
çıktı. Döngü tam olarak böyle işlemeli: rapor boşluğu gösterir, kart yazılır,
boşluk kapanır. Yüzdenin tek işi seni o listeye bakmaya itmek.

---

## R23 · Dağıtılan paket sızdırır ya da eskidir

**Ne.** Eklentiyi denemesi için birine veriyorsun. İki yoldan yanlış gider:

1. **Sızıntı.** `extension/` klasörünü elle zipleyip göndermek; içinde imza
   anahtarı, `.env` ya da bir yere yapıştırılmış bir API anahtarı kalmışsa
   gitmiş olur. Projenin tamamını göndermek daha da kötüsü: `src/`, red
   arşivi, Worker yapılandırması.
2. **Eskilik.** `src/*.bundle.js` derlenmiş dosyalar. Derlemeyi unutup
   gönderirsen karşı taraf DÜZELTİLMİŞ bir hatayı yeniden yaşar ve sana
   "bende oluyor" diye döner. Sen kendi makinende tekrar edemezsin.

**Ne yaparız.** `npm run paket` (`scripts/paket.ts`). Elle ziplemek yok.

- Önce `build:ext` koşuyor; çıktısında "Node sızıntısı yok" görmezse durur.
- `test/` ve geliştirici `README.md`'si pakete GİRMEZ (projeye ait dosyalara
  bağlantı veriyorlar, karşı tarafta kırık).
- Kopyanın ÜSTÜNDE tarama: `.pem/.p8/.key/.env/.crx` dosyası, özel anahtar
  başlığı, `sk-…` biçimli anahtar, `Authorization: Bearer …`, ve tarayıcıda
  patlayacak Node kalıntısı (`require(`, `node:fs`, `process.env`).
- Herhangi biri bulunursa **zip üretilmez**. Uyarıp devam etmek, uyarıyı
  görmemekle aynı şey.
- Karşı taraf için `KURULUM.md` üretiliyor: kurulum, veri nereye gidiyor,
  Apple'a yük kuralı ve **"rapor eksik olabileceğini söyler"** bölümü.

**Sınamadan koruma yazma.** İlk yazdığım desen `\bsk-[A-Za-z0-9]{20,}` idi ve
gerçek bir OpenAI anahtarını (`sk-proj-…`) **kaçırıyordu**: "proj" dört
karakterde tireye çarpıyor, desen tutmuyordu. Sahte anahtar koyup denemeseydim
koruma orada durduğu hâlde hiçbir şey yapmıyor olacaktı. Güvenlik kontrolünün
en kötü hâli budur — çünkü ona güvenip elle bakmayı bırakıyorsun. Her iki
koruma da (yasak dosya + yasak metin) sahte örnekle sınandı ve paketi
durdurduğu görüldü.

**Desen dar tutuluyor.** `manifest.json` içindeki `key` alanı base64 bir AÇIK
anahtar ve paylaşılması gerekiyor — eklenti kimliğini sabitliyor. "Uzun base64
gördüm" gibi bir kural onu da engellerdi.

---

## R24 · Kart, `needs` dediği veriyi görmeden yargılıyor

**Ne.** Bir kural kartı `needs: [description, subtitle, screenshots]` diyor ama
modele ekran görüntüsü hiç gönderilmiyor. Kartın sorusu ise görsele bakmayı
şart koşuyor: *"…o özelliğin ekran görüntülerinde hiçbir izi yok mu?"*

Model görmediği şey için **"izi yok"** diyor. Hata fırlatmıyor, "bakamadım"
demiyor — kendinden emin, gerekçeli, alıntılı bir bulgu üretiyor.

**Nasıl patladı (2026-08-26).** Gerçek bir denetimde 15 bulgunun **13'ü** bu
yoldan geldi. Tek bir kart (`apple-2.3.3-feature-not-evidenced`) yedi uydurma
bulgu üretti: "bu özelliğin kanıtı yok" — oysa uygulamanın altı ekran
görüntüsü vardı ve modele hiç gösterilmemişti. Risk skoru tavana dayandı,
rapor okunamaz hâle geldi ve kullanıcı haklı olarak "skoru çok yüksek
vermemiş mi?" diye sordu.

**Sebep tek satırdı:**

```ts
return card.needs.length > 0 && card.needs.every((n) => visual.includes(n))
```

`every` — yani kartın BÜTÜN ihtiyaçları görsel olmalıydı. Karışık kartlar
(metin **ve** ekran görüntüsü isteyenler) bu testi geçemiyordu. Beş kart bu
durumdaydı ve beşi de sahada yanlış cevap veriyordu.

**Neden R2/R3 sınıfı.** Sessiz değil, GÜRÜLTÜLÜ yanlış. Ama sonuç aynı yere
çıkıyor: rapora güven gidiyor. Üstelik yanlış yönü daha da kötü — kullanıcı
gerçek bulguları da yalancı alarm sanıp raporu kapatıyor (R20).

**Ne yaparız.**
- `some` — kart bir artifact'i `needs` içinde SAYIYORSA onu GÖRECEK.
- Kural yazılı: **`needs` bir sözleşmedir.** İçindeki her artifact modele
  ulaşmalı; ulaşmıyorsa kart o soruyu soramaz.
- Test kural kitabının tamamını tarıyor: ekran görüntüsü isteyip görmeyen
  kart kalırsa kırmızı yanıyor. Tek tek kartları düzeltmek yerine sınıfı
  kapattık.
- Maliyet arttı (beş kart daha görsel prompt'una geçti) ve bu kabul edildi.
  Görseller paylaşılan ön ekte, prompt cache'ten okunuyor; yanlış cevabın
  bedeli yanında hiç kalır.

---

## R25 · Skor tavana yapışıyor, ilerleme ölçülemiyor

**Ne.** Risk skoru `min(100, ağırlıklı toplam)` idi. Sahada ham toplam **350**
çıktı ve ekranda 100 yazdı.

**Neden ciddi.**

- Beş sorunu olan uygulama ile elli sorunu olan **aynı** görünüyordu.
- Sorunların üçünü düzeltmek skoru **kıpırdatmıyordu**. Denetim geçmişini
  (R19) tam da "düzeldi mi" sorusuna cevap versin diye eklemiştik; sabit 100
  o soruyu cevaplanamaz kılıyordu.
- 100 rakamı "daha kötüsü olamaz" diye okunuyor. Öyle bir şey yok.

**Ne yaparız.**
- Doyan ama **tıkanmayan** eğri: `100 × (1 − e^(−toplam/70))`, 99'da durur.
  Her yeni bulgu skoru artırır, artış yukarı doğru azalır.

  | ham toplam | 30 | 70 | 150 | 350 |
  |---|---|---|---|---|
  | skor | 35 | 63 | 88 | 99 |

- **99, 100 değil.** 99 gören kişi eğrinin tıkandığını bilsin.
- Asıl çözünürlük `riskBreakdown` içinde: kaç kesin ihlal, kaç risk, kaç
  kesin kontrol, ham toplam. Rapor da geçmiş listesi de bunları gösteriyor.
  **İlerleme skordan değil bu sayılardan okunur** ve rapor bunu yazıyor.
- Test gerçekçi aralıkta (1-12 bulgu) her kademenin ayırt edildiğini
  doğruluyor: 19 → 35 → 47 → 66 → 82 → 92.

**Yan düzeltme — şiddet kartın, modelin değil.** Aynı raporda model 15
bulgunun **15'ine** de "high" dedi; kartların yarısı "medium" olarak kalibre
edilmişti. `severity: raw.severity ?? rule.defaultSeverity` satırı modelin
dediğini üste koyuyordu. O sinyal bilgi taşımıyor, yalnızca skoru şişiriyordu.
Kavramsal olarak da doğrusu bu: şiddet KURALA dair bir politika kararıdır,
örneğe dair değil — onu maddeyi okuyup kartı yazan kişi belirler. Modelin işi
"bu kural çiğnenmiş mi", "bu kural ne kadar ciddi" değil.

---

## R26 · Kayıtlı rapor taze görünüyor

**Ne.** Denetim sonuçları kaydediliyor (R19) ve sonradan **bugünün** şablonuyla
çiziliyor, dışa aktarılıyor. Şablon güncel, **sayılar eski**. Rapor hangi kodun
ürünü olduğunu söylemiyor.

**Nasıl patladı (2026-09-02).** 13:54'te eski motorla üretilmiş bir denetim,
günler sonra yeni şablonla Markdown'a aktarıldı. Ortaya kendi kendisiyle
çelişen bir belge çıktı:

> Risk skoru = … yukarı doğru basıklaşan bir eğriden geçer ve **100'e hiç
> ulaşmaz**.
>
> **Risk skoru: 100/100**

Açıklama yeni koddan, sayı eski koddan. Kullanıcı bunu bana "bu skor mantıklı
mı" diye sordu — yani belge onu yanılttı. Bu, R19'u eklerken açtığım bir
kapıydı: kalıcılık kazandık, tazelik bilgisini kaybettik.

**Ne yaparız.**
- Her kayda **`motorSurum`** (eklenti sürümü) yazılıyor; `corpusVersion` zaten
  vardı ama karşılaştırılmıyordu.
- Rapor çizilirken ikisi de bugünkülerle karşılaştırılıyor. Fark varsa raporun
  EN ÜSTÜNDE, kapatılamaz bir kutu: *"Bu rapor eski bir sürümle üretildi"* —
  ve hangi sürümden hangisine gidildiği yazıyor.
- Yanında **"Şimdiki sürümle yeniden denetle"** düğmesi.

**Aynı turda çıkan ikinci hata: "Yeniden denetle" HİÇBİR ŞEY YAPMIYORDU.**
Düğme ekranı yeniden açıyordu, ekran da kayıtlı raporu bulup aynısını
gösteriyordu. Kullanıcı basıyor, aynı sayıları görüyor, aracın takıldığını
sanıyor. Tek kullanımlık bir `DENETIM_TAZELE` bayrağı eklendi: bayrak açıkken
kayıt atlanıyor, sonraki açılışta yine kayıttan geliniyor (model boşuna para
yakmasın). İkisi de testle bağlı.

---

## R27 · Rapor, listing'in yayında olduğunu söylemiyor

**Ne.** Araç, Apple'ın inceleyip **onayladığı** ve şu an **yayında olan** bir
listing'i denetleyip "15 felaket problemli şey" diyordu — ve listing'in
yayında olduğunu hiçbir yerde yazmıyordu. Veri elimizdeydi
(`declarations.surum.durum = READY_FOR_DISTRIBUTION`) ve hiç kullanılmıyordu.

**Neden ciddi.** Okuyan haklı olarak aracın saçmaladığını düşünüyor ve
raporun tamamını atıyor — içindeki GERÇEK bulgular dahil. Yalancı alarmın
(R20) bir üst katmanı: burada bulgular değil, raporun ÇERÇEVESİ yanlış.

**Ne YAPMIYORUZ.** "Apple onayladı, demek ki sorun yok" DEMİYORUZ. Apple
tutarlı denetlemiyor; bu sefer geçen bir şey bir dahakine takılabiliyor,
onaylanmış uygulamalar sonradan kaldırılabiliyor. Bulguları yumuşatmak
aracın varlık sebebini yok ederdi.

**Ne yaparız.** Durumu söyleyip **nasıl okunacağını** yazıyoruz, çünkü iki
farklı soru soruluyor:

| Listing hâli | Rapor neyi cevaplıyor |
|---|---|
| Yayında / onaylandı | "Sonraki gönderimde ne başımıza gelir?" |
| Gönderilmedi / taslak | "Göndermeden önce neyi düzeltmeliyim?" |
| Reddedildi | "Neyi düzeltip yeniden göndereceğim?" |

- Kutu skordan **ÖNCE** geliyor; sonra gelseydi okunmazdı.
- `DEVELOPER_REJECTED` ile `REJECTED` ayrı okunuyor: "sen geri çektin, Apple
  reddetmedi". Bu ayrım zaten sayaçlarda vardı, artık raporda da var.
- Tanınmayan durum kodu **uydurulmuyor**: "bu durum kodu tanınmıyor" yazıyor.

---

## R28 · Tek kartın hatası tüm denetimi düşürüyor

**Ne.** Kartlar `Promise.all` içinde paralel koşuyordu ve `one()` çağrısı
try/catch dışındaydı. Bir kartın çağrısı patlayınca `Promise.all` reddediyor,
`runCheck` fırlatıyor, `fullAudit` fırlatıyor ve panel **"Denetim çalışmadı"**
diyordu.

**Nasıl patladı (2026-09-02).** OpenAI oran sınırı (429) bir kartta sekiz
yeniden denemeyi de tüketti. **13 kart başarıyla koşmuştu** — kullanıcı
hiçbirini görmedi. Elde tam bir lint raporu, 13 kartlık model turu ve 8 elle
kontrol maddesi vardı; hepsi çöpe gitti.

**Kural.** Yarım rapor, hiç rapor olmamasından iyidir — **yeter ki neyin
çalışmadığı görünsün.** Bu, R2'nin olumlu yüzü: eksiği gizleme, ama eksik
diye her şeyi de atma.

**Ne yaparız.**
- Kart çağrısı try/catch içinde. Patlayan kart `stats.basarisiz`'e sebebiyle
  yazılıyor, döngü devam ediyor.
- Patlayan kartlar raporun **DENETLENMEDİ** listesine giriyor. Sessizce
  düşselerdi rapor o konulara bakıldığını ima ederdi.
- Hata mesajı okunur hâle getiriliyor: 300 karakterlik sağlayıcı gövdesi
  yerine "oran sınırı (429) — hesabın dakikalık token sınırı 200000".
- CLI de aynı listeyi basıyor.

---

## R29 · Dakikalık token kotası (TPM) doluyor

**Ne.** OpenAI hesap başına dakikalık token sınırı uyguluyor. Sahada
`gpt-4o-mini` için **200.000 TPM**. Denetim 74 saniyede **382.545** token
harcadı — dakikada ~310 bin. Sınır kaçınılmaz olarak doluyor.

**Bunu ben kötüleştirdim.** R24'ü düzeltirken görsel alan kart sayısını 5'ten
10'a çıkardım. Doğru bir düzeltmeydi (kart göremediği ekran görüntüsü hakkında
hüküm veremez) ama token akışını da artırdı ve TPM'i düşünmedim. Maliyeti
hesapladım, HIZI hesaplamadım.

**Neden yeniden deneme yetmedi.** Vardı ve iyiydi: 8 deneme, üstel bekleme,
`retry-after` başlığını okuma. Ama hepsi 429'u YEDİKTEN SONRA çalışıyor —
yani kotayı zaten doldurmuş oluyorduk. Reddedilen istek de kotadan sayılıyor,
dolayısıyla yeniden denemek yangına körükle gidiyordu.

**Ne yaparız — vali.**
- Her çağrı **göndermeden önce** son 60 saniyede harcanan tokena bakıyor.
  Kota dolacaksa pencere kayana kadar bekliyor. 429 yemiyoruz, önlüyoruz.
- **Kendi kendini ayarlıyor.** Her hesabın sınırı farklı ve kullanıcı bunu
  bilmek zorunda değil. OpenAI 429 gövdesinde sınırı yazıyor
  (`Limit 200000`); ilk 429'da oradan okunup vali `%85`ine daraltılıyor.
- **Yalnız aşağı çekiyor.** Yukarı çekseydik yüksek kotalı bir hesapta
  hızlanırdık, ama şirket kurulumunda **aynı hesabı birden çok kişi
  kullanıyor** ve ikisi birden kotayı doldururdu. Güvenli taraf yavaş taraftır.
- Varsayılan 180 bin: ölçülen denetim (~382 bin token) ~2 dakikada biter.

**Şirket kurulumunda bu madde büyür.** TPM hesap başınadır, kişi başına değil.
Beş kişi aynı anda denetim koşarsa hepsi aynı 200 bini paylaşır. Vali her
tarayıcıda ayrı çalıştığı için bunu göremez — R1'in model tarafındaki ikizi.
Çare aynı: aynı anda hep birlikte koşmayın. Kalıcı çözüm kotayı Worker'da
tutmak (KV sayacı), bugün bağlı değil.

---

## R30 · Tek sorun N kez sayılıyor

**Ne.** Bir kural birden çok kez bulgu üretince skor her birini tam ağırlıkla
sayıyordu. Sahada `apple-3.1.2-subscription-disclosure` **dört kez** düştü —
abonelik başına bir kez — ve `4 × 30 = 120` puan yazdı, ham toplamın neredeyse
yarısı. Oysa ortada **tek** bir sorun var: listing metni abonelik şartlarını
yazmıyor. O metni bir kez düzeltince dördü birden kapanıyor.

**Neden ciddi.** Skor "uygulama ne kadar riskli"nin değil, **"model ne kadar
çok cümle yazdı"nın** ölçüsü hâline geliyor. Konuşkan bir model skoru
yükseltiyor, sessiz bir model düşürüyor — ikisi de uygulama hakkında hiçbir
şey söylemiyor. Üstelik skor tavana yapışıyor (R25 yine devreye giriyor).

**Ne yaparız — azalan ağırlık.** Aynı kuraldan gelen ilk bulgu tam, sonrakiler
**dörtte bir** sayılıyor.

| | eski | yeni |
|---|---|---|
| Aynı kuraldan 4 yüksek ihlal | 120 | **52,5** |
| Farklı 4 kuraldan 4 yüksek ihlal | 120 | **120** |

Sıfır değil dörtte bir: tekrar yine bir şey ifade ediyor (sorun daha çok yerde
görünüyor, reviewer'ın gözüne çarpma ihtimali artıyor) ama düzeltmesi tek.

Sahadaki rapor: ham **260 → 185**, skor **98 → 93**. Kart düzeltmeleriyle
birlikte 157'ye, skor 89'a iniyor; üç kesin ihlal kapatılırsa **62**. Yani
skor artık ilerlemeyi gösteriyor.

---

## R31 · Kart, modelin bilmediği olguyu vermiyor

**Ne.** Model dünyaya dair olguları hatırlamaz. Kart o olguyu `facts` alanında
vermezse model uydurur ya da saçmalar — ve bunu kendinden emin bir dille yapar.

**Nasıl patladı (2026-09-02).** Yaş sınırı kartı, zaten **17+** olan bir
uygulamaya şunu önerdi:

> "Increase the age rating to **12+** or higher to match the content."

İki kat saçma: 17+ Apple'ın **en yüksek** derecesi (yükseltilecek yer yok) ve
12+ ondan **daha düşük**. Kartta Apple'ın derece merdiveni (4+, 9+, 12+, 17+)
hiç yazmıyordu.

Bu, README'de zaten yazılı olan **"bilgi kuralı"** ayrımının unutulmuş hâli:
muhakeme kuralları modelin dil yeteneğiyle çalışır, bilgi kuralları
çalışmaz — olgu karta yazılmalı.

**Ne yaparız.**
- Karta merdiven olgu olarak eklendi ve "17+ EN YÜKSEK derecedir, zaten 17+
  olan uygulamada bulgu ÜRETME" emri soruya kondu.
- Öneri yazarken **mevcut dereceden yukarı** basamak seçmesi isteniyor.
- Test kartın bu olguları taşıdığını doğruluyor.
- Genel kural taramaya bağlandı: hiçbir kart "her ürün için ayrı bildir"
  dememeli — liste hâlindeki bir varlık için "her X'e ayrı bulgu" demek tek
  sorunu N kez saydırır (R30).

**Yeni kart yazarken sor:** bu kuralı uygulamak için modelin bilmesi gereken
bir OLGU var mı? (marka adları, derece merdivenleri, tarih sınırları, para
birimleri) Varsa `facts`'e yaz; hatırlamasına güvenme.

---

## R32 · İki kart aynı işi yapıyor

**Ne.** Aynı maddeye (2.3.3) yazılmış iki kart, sınırları çizilmediği için
aynı soruyu sormaya başladı:

| Kart | Ne sormalıydı | Ne sordu |
|---|---|---|
| `feature-not-evidenced` | Uygulama yapamayacağı bir işi mi vaat ediyor? | "Bu özelliği ekran görüntülerinde göremiyorum" |
| `screenshots-reflect-app` | Görselde uygulama arayüzü var mı? | (doğru soru) |

Sahada birincisi **üç** bulgu üretti ve üçü de aslında ikincinin bulgusuydu:
görseller pazarlama kompozisyonu, arayüz yok. Kök sebep tek, rapor dört satır.

Üstelik bulgular yanlıştı: uygulamanın **adı** "AI Video, Face Swap: Editor".
Yüz değiştirme, adı ve kategorisiyle zaten kanıtlanmış bir özellik; ekran
görüntüsünde ayrıca göstermesi gerekmiyor.

**Ne yaparız.**
- Kartın sorusu "yapamayacağı işi vaat ediyor mu"ya daraltıldı ve
  "yalnızca ekran görüntüsünde göremiyorsan bulgu ÜRETME" emri kondu.
- Komşu kart **adıyla** anılıyor: sınır kartın içinde yazılı.
- Olgu eklendi: uygulamanın kendi adı, alt başlığı, kategorisi ve uygulama
  içi ürünleri o özellik için KANITTIR (R31'in aynısı — model bunu bilmiyor).

**Kural.** Aynı maddeye ikinci bir kart yazarken sınırı iki tarafta da açıkça
yaz. "Model nasılsa ayırt eder" varsayımı tutmuyor: iki soru birbirine
benzediğinde model ikisini de aynı soru sayıyor ve rapor tekrara düşüyor —
skoru da şişiriyor (R30).

---

## Şunu görürsen dur

- **`429`** → o gün bir daha çekme.
- Bir önceki çekimde dolu olan bir bölüm **birden boşaldıysa** → alan adı
  değişmiş olabilir, ham arşive bak.
- Rapor "sorun yok" diyor ama **"okunamadı" listesi doluysa** → o rapor temiz
  değil, eksik.
- Eklenti **beklenmedik bir izin** istiyorsa (yeni bir alan adı, yeni yetki) →
  kurma, önce sor.

## Karar günlüğü

| Karar | Neden | Vazgeçilirse |
|---|---|---|
| iris/v1 (DOM kazıma değil) | Yapısal JSON, sayfalama var, kırılganlığı düşük | DOM kazıma 3-4 kat kod, her arayüz güncellemesinde kırılır |
| Tarayıcı oturumu (`.p8` değil) | Kullanıcı anahtar girmesin; red geçmişi resmi API'de yok | `.p8`: her kullanıcıya kurulum + eksik veri |
| Unpacked kurulum | Ofis içi, mağaza incelemesi gereksiz | Mağaza: 5 $, inceleme, gizlilik beyanı |
| IndexedDB (şimdilik) | Sunucu yok, komut yok, anahtar yok | Supabase: ortak hafıza, ama kurulum senin üstünde |
| Ham JSON'u sakla | Alan adı değişince yeniden çekmeden onar | Yeniden çekim = Apple'a yeni yük (R1) |

---

## Hangi madde koda bağlandı

Bu dosya iyi niyet listesi olmasın: aşağıdaki davranışlar `npm run test:ext`
ile her koşuda doğrulanıyor. Bozulurlarsa test kırmızı yanar.

| Madde | Bağlandığı davranış | Test |
|---|---|---|
| R1 | 429 gelince **kalıcı** durma, sonraki hiçbir isteği atmama | ✓ |
| R1 | İstekler arası 800 ms | ✓ |
| R2 | `200` yeterli değil: beklenen alan yoksa **şüpheli** | ✓ |
| R2 | İki isimden biri kabul (`reasons` \| `reviewRejectionReasons`) | ✓ |
| R2 | **boş** ile **kırık** ayrı etiket | ✓ |
| R4 | Şifre/token maskeleme, rapora sızmama | ✓ |
| R5 | Kırık uç turu düşürmüyor, zincir kopunca gerisi atlanıyor | ✓ |
| R5 | **403 ≠ 401**: tek bir "izin yok" turu kesmiyor | ✓ |
| R6 | HTML yanıtı = oturum düşmesi teşhisi; çoklu takım uyarısı | ✓ |
| R6 | 401 anında, üst üste üç 403 ise seri olarak oturum ölümü sayılıyor | ✓ |
| R11 | `meta.paging.total` ile gelen sayının karşılaştırılması | ✓ |
| R14 | Eşzamanlı yazımlar birbirini ezmiyor, `running` geri dönmüyor | ✓ |
| R14 | Eski turun gecikmiş mesajı yenisini bozmuyor | ✓ |
| R14 | Arayüz betikleri açılışta hatasız yükleniyor (duman testi) | ✓ |
| R15 | Anahtar eklentiye girmiyor; proxy ekliyor | ✓ |
| R15 | Proxy ölüyse model turu "çalışmadı" diye raporlanıyor | ✓ |
| R17 | Simge tıklaması yan paneli açacak şekilde ayarlanıyor | ✓ |
| R17 | `sidePanel` varken sekme-açan geri düşme yolu KURULMUYOR | ✓ |
| R4 | Demo hesap şifresi (`pass`) maskeleniyor | ✓ |
| R4 | `store.js` ve `canary.js` maskeleme desenleri birebir aynı | ✓ |
| R18 | `DUMP_SECTIONS` ortak modülde ve dolu | ✓ |
| R18 | Sayfa ortak modüllerin hepsini yüklüyor | ✓ |
| R18 | Ortak modüller bağımlılık sırasında yükleniyor | ✓ |
| R19 | `audits` deposu tanımlı ve DB sürümü artırılmış | ✓ |
| R19 | Yedek denetimleri dışa/içe aktarıyor | ✓ |
| R19 | Rapor dışa aktarımı maskeden geçiyor (Markdown + JSON) | ✓ |
| R19 | Kaydedilemeyen rapor kullanıcıya bildiriliyor | ✓ |
| R20 | Sahadaki beş yalancı alarmın hiçbiri "şüpheli" kovasında değil | ✓ |
| R20 | Gerçek uyarılar şüpheli kalıyor (ayırmak ≠ susturmak) | ✓ |
| R20 | Etiketsiz/tanınmayan kayıtlar şüpheli sayılıyor | ✓ |
| R20 | Fiyat özeti not, okunamayan ürün ayrı ve şüpheli | ✓ |
| R21 | Sorulan her beyan bir kartı ya da lint'i tetikliyor | ✓ |
| R21 | Her Apple kartı gerçek bir maddeye atıf yapıyor | ✓ |
| R21 | Modele giden her kartta olumlu+olumsuz örnek var | ✓ |
| R22 | ÖZEL kart GENEL redi kapsamıyor (kapsam şişirilmiyor) | ✓ |
| R22 | Kardeş maddeler birbirini kapsamıyor | ✓ |
| R22 | Oranın paydası KODLU redler; kodsuzlar ayrı sayılıyor | ✓ |
| R22 | Kodsuz ve mükerrer kayıtlar için uyarı üretiliyor | ✓ |
| R24 | `needs` içinde tek görsel artifact yeterli (`some`) | ✓ |
| R24 | Kural kitabında ekran görüntüsü isteyip görmeyen kart yok | ✓ |
| R25 | Skor monoton, 99'da durur, gerçekçi aralıkta ayırt eder | ✓ |
| R25 | Şiddet kartın `defaultSeverity`'sinden geliyor | ✓ |
| R26 | Kayda motor ve kural kitabı sürümü yazılıyor | ✓ |
| R26 | Sürüm değiştiyse rapor "eski" diye uyarıyor | ✓ |
| R26 | "Yeniden denetle" kaydı atlayıp gerçekten koşuyor | ✓ |
| R27 | Onaylı listing "sonraki risk" diye çerçeveleniyor | ✓ |
| R27 | Onay bir GARANTİ diye sunulmuyor | ✓ |
| R27 | Geri çekme ile Apple reddi karıştırılmıyor | ✓ |
| R28 | Kart çağrısı try/catch içinde, döngü devam ediyor | ✓ |
| R28 | Patlayan kart DENETLENMEDİ listesine giriyor | ✓ |
| R29 | Her çağrı göndermeden ÖNCE valiye soruyor | ✓ |
| R29 | 60 saniyelik kayan pencere doğru sayıyor | ✓ |
| R29 | 429 gövdesinden gerçek sınır öğreniliyor, yalnız aşağı | ✓ |
| R29 | base64 görseller token sanılmıyor (718 KB → ~5.5 bin token) | ✓ |
| R29 | Pencere boşken istek geçiriliyor, çökmüyor | ✓ |
| R29 | Vali durumu `static` — kota hesap başına | ✓ |
| R30 | Aynı kuralın tekrarı azalan ağırlıkla sayılıyor | ✓ |
| R30 | Farklı kurallar tam ağırlıkla sayılıyor | ✓ |
| R31 | Yaş kartı derece merdivenini olgu olarak taşıyor | ✓ |
| R31 | Hiçbir kart "her ürün için ayrı bildir" demiyor | ✓ |
| R32 | Özellik kartı komşu kartı adıyla anıp sınırı çiziyor | ✓ |
| R32 | "Ekran görüntüsünde göremiyorum" gerekçesi yasaklı | ✓ |
| — | Aynı kural + aynı gerekçe tek bulguya iniyor, alıntılar korunuyor | ✓ |

| R1 | Hacim sınırları (build/dil/teklif) çekimde uygulanıyor | ✓ |
| R2 | Yol kurulmuyor, Apple'ın `links.related` adresi kullanılıyor | ✓ |
| R5 | Okunamayan uç `atlandi[]`'ye yazılıyor, çekim sürüyor | ✓ |
| R8 | Dışa/içe aktarma (tam ve maskeli kopya) | ✓ |

| R3 | Okunamayan her alan `warnings`'e yazılıyor, raporda görünüyor | ✓ |
| R3 | Ağ izni yokken adres "ölü" değil "denetlenmedi" sayılıyor | ✓ |

Henüz koda bağlanmamış olanlar:
R3 (çapraz doğrulama — `.p8` çıktısıyla karşılaştırma),
R7 (yarıda kalan çekimin sürdürülmesi), R10 (ortak hafıza),
R12 (artımlı çekim — bugün her çekim baştan alıyor).

**R16 kasten bağlanamaz.** "Bu uyarı göze çarpıyor mu" sorusunu test soramaz;
onu ancak gözle yakalarız. R16'nın savunması testte değil kuralın kendisinde:
veri kalitesi satırı düz kalır. Arayüze yeni metin ya da yeni stil ekleyen
herkes o maddeyi bir kez okumalı.

---

## Saha notları

Gerçek çekimlerde öğrenilenler. Tahminleri buraya taşıdıkça R2 küçülüyor.

### 2026-09-02 · rapor nihayet okunabilir hâle geldi

Aynı uygulamada üç tur:

| | bulgu | skor | ham |
|---|---|---|---|
| başlangıç | 15 | 100 | 350 |
| görsel + şiddet + skor düzeltmesi | 12 | 98 | 260 |
| azalan ağırlık + kart düzeltmeleri | **8** | **89** | 157,5 |

Elenen yedi bulgunun hepsi uydurmaydı ve her birinin ayrı bir sebebi vardı:

- **7 bulgu** — kart, `needs` dediği ekran görüntüsünü görmüyordu (R24)
- **3 bulgu** — tek sorun ürün başına sayılıyordu (R30)
- **1 bulgu** — yaş kartı Apple'ın derece merdivenini bilmiyordu (R31)
- **3 bulgu** — iki kart aynı işi yapıyordu (R32)

Kalan sekizin hepsi savunulabilir. En değerlisi `apple-5.2.1-ai-likeness`:
listing "Morph into famous personalities, red-carpet stars, and pop-culture
icons" diyor — izinsiz benzerlik vaadi, gerçek bir IP riski, ve uygulamanın
yayında olması bunu geçersiz kılmıyor.

**Genel ders.** Yalancı alarmların hiçbiri "model kötü" diye açıklanamazdı.
Dördü de ALTYAPININ hatasıydı: kartın veriyi görmemesi, sayımın çift olması,
olgunun verilmemesi, iki kartın çakışması. Model her seferinde eline verilen
şeyle tutarlı davrandı. Bir LLM boru hattında bulgu kalitesini, prompt'u
değiştirmeden önce **kartın ne gördüğünü ve ne bildiğini** kontrol et.

### 2026-09-02 · valinin kendisi 9 kartı düşürdü

TPM valisini (R29) ekledim ve **kendisi bir kırılma sebebi oldu**. Sahadaki
koşuda 14 karttan 9'u şu hatayla düştü:

```
Cannot read properties of undefined (reading 't')
```

**İki hata üst üste.**

1. **Tahmin 34 kat şişikti.** `JSON.stringify(body).length / 4` yazmıştım.
   Görseller gövdeye **base64** olarak giriyor: altı ekran görüntüsü 718 KB
   ediyor ve formül bunu **184.872 token** sanıyordu. Oysa görselin token
   maliyeti boyutuna bağlı değil — `detail:low` için görsel başına ~85 token.
   Gerçek değer **5.472**.
2. **Boş pencerede çökme.** Tahmin bütçeyi (180 bin) aştığı için vali hiçbir
   zaman izin vermiyor, bekleme dalına düşüyor ve orada `pencere[0].t`
   okuyordu — pencere boştu.

**Düzeltme.**
- Tahmin base64 yükünü metinden ayırıyor, görseli sabit maliyetle sayıyor.
- Pencere boşken istek **geçiriliyor**: tek bir istek bütün bütçeden büyükse
  bölemeyiz, beklemek sonsuz döngü demek.
- Vali durumu artık **`static`** — kota HESAP başına, denetim başına değil.
  Örnek düzeyinde olsaydı art arda iki uygulama denetlemek pencereyi
  sıfırlar ve kotayı hemen yeniden doldururdu.

**R28 kendini kanıtladı.** Aynı sürümde eklediğim "tek kart tüm denetimi
öldürmez" kuralı olmasaydı bu hata yine **"Denetim çalışmadı"** ile
sonuçlanacaktı. Onun yerine denetim tamamlandı, 5 kart koştu, iki gerçek bulgu
çıktı ve **çöken dokuz kart sebebiyle birlikte raporda listelendi**. Hatayı
kullanıcı değil, raporun kendisi gösterdi.

**Ders.** Bir koruma eklerken o korumanın kendisi yeni bir kırılma noktasıdır.
Vali, 429'u önlemek için eklendi ve 429'dan daha çok kart düşürdü. Yeni
eklenen her savunma, savunduğu şey kadar dikkatle sınanmalı — özellikle
tahmin/kestirim yapan bir savunma.

### 2026-08-26 · kapsam raporu ilk boşluğunu buldu

Depodaki iki gerçek red kaydı kural kitabına karşı ölçüldü:

| Madde | Red | Kart |
|---|---|---|
| 2.1 | 1 | `apple-2.1-coming-soon-placeholder`, `apple-2.1-launch-crash` |
| **5.6.3** | 1 | **yok** |

5.6.3 — "uygulama, kullanıcı değerini anlamaya fırsat bulmadan ilk açılışta
puan istiyor". Developer Code of Conduct kapsamında ve bugüne kadar kural
kitabında karşılığı yoktu; yani o red bir daha gelse **kesinlikle**
kaçırırdık.

Kart yazıldı (`apple-5.6.3-rating-prompt-timing`, elle kontrol — davranış
build'in içinde, listing'den görülemez). Kapsam %50 → %100.

İki red az bir örneklem; bu sayı hiçbir şey kanıtlamıyor. Değerli olan sayı
değil, **döngünün çalıştığını görmek**: rapor boşluğu gösterdi, kart yazıldı,
boşluk kapandı. Ne kadar çok red arşivlenirse liste o kadar işe yarar.

### 2026-08-25 · sorulan üç sorudan biri hiçbir şey yapmıyordu

**Ne bulundu.** Arayüz "AI içerik üretiyor mu?" diye soruyordu ve bu cevap
**sıfır** kural tetikliyordu. Kural kitabında `generatesAiContent` koşuluna
bakan tek kart yoktu. Yani bir AI uygulaması "Evet" işaretliyor, denetim AI'a
dair hiçbir şey çalıştırmıyor, rapor temiz görünüyordu.

Boru hattı baştan sona doğruydu — `types.ts`, `schema.ts`, `select.ts`,
`submission-from-dump.ts`, CLI bayrağı, arayüz kutusu. Eksik olan tek şey
kartlardı. En sinsi hâli bu: her parça çalışıyor, zincir bir yere varmıyor.

**Ne yapıldı.** Dört kart yazıldı, hepsi Apple'ın kendi metnine çapalı:

| Kart | Madde | Tür |
|---|---|---|
| `apple-1.2-ai-output-is-ugc` | 1.2 | elle kontrol |
| `apple-1.2-ugc-safeguards` | 1.2 | elle kontrol |
| `apple-5.2.1-ai-likeness-claims` | 5.2.1 | modele gider |
| `apple-2.3.1-ai-not-in-review-notes` | 2.3.1 | modele gider |

En önemlisi ilki: **App Review, kullanıcının girdisinden üretilen içeriği
kullanıcı içeriği sayar.** "Bizde UGC yok, biz üretiyoruz" savunması kabul
görmüyor. Yüz değiştirme ve görsel üretme uygulamalarında en sık gelen red bu.

**Kalıcı önlem R21'de:** artık her beyanın bir kartı ya da lint'i tetiklediği
testle bağlı. Yeni beyan eklenirse ya kartı da eklenir ya da soru sorulmaz.

### 2026-08-25 · `--ai-content` sessizce yutuluyordu

**Ne bulundu.** CLI'da meta bayrakları yalnızca `--app` verildiğinde
uygulanıyordu; `--fixture` modunda `mergeMeta` hiç çağrılmıyordu. Yazdığın
`--ai-content` hiçbir şey yapmıyor ve **hiçbir uyarı da çıkmıyordu**.

Birim testi bunu yakalayamazdı: `mergeMeta` doğru çalışıyordu, sorun
çağrılmamasıydı. O yüzden test uçtan uca — CLI gerçekten koşturuluyor ve
çıktıda `hasThirdPartyLogin=true(bayrak)` aranıyor.

**Testin kendi tuzağı.** İlk hâli `new URL('..', import.meta.url).pathname`
ile çalışma dizinini buluyordu. Bu deponun yolunda boşluk ve Türkçe harf var
("adsız klasör"); `pathname` onları yüzde-kodluyor, cwd yanlış çıkıyor ve test
kendi kusurunu kod hatası gibi gösteriyordu. `fileURLToPath` şart.

### 2026-08-21 · red sayısı uydurma çıktı (Housify AI)

**Ne görüldü.** Panel "5 Apple reddi" yazıyordu. ASC'nin Activity tablosunda
gerçek sayı **3**:

| Sürüm | Olay | Tarih |
|---|---|---|
| 1.1.1 | Rejected (Apple) | 15 Ağu 2026 |
| 1.1.1 | Developer Rejected | 13 Ağu 2026 |
| 1.0 | Rejected (Apple) | 30 Oca 2026 |
| 1.0 | Rejected (Apple) | 28 Oca 2026 |

**Sebep.** Toplayıcı doğru sayıyordu. Hata yalnızca gösterimdeydi: arayüz
**iki farklı birimi topluyordu**.

```js
const apple = (s.appleReddi ?? 0) + (s.redler ?? 0)   // 3 + 2 = 5
```

- `appleReddi` — Apple'ın reddettiği **sürüm** sayısı (durum geçmişi olayı)
- `redler` — Resolution Center yazışmalarından çıkarılan red **metni** sayısı

Bunlar aynı şey değil: tek bir red birden çok metin üretebilir, eski redlerin
yazışması hiç olmayabilir. Toplamları hiçbir soruya cevap vermiyor.

**Neden R2/R3 sınıfı.** Sayı hatalı değil, **uydurma**. Eksik sayının eksik
olduğunu bilirsin; uydurma sayıya inanırsın. "5 kez reddedilmişiz" diye bir
toplantıya girilir.

**Ne yapıldı.**
- Üç büyüklük ayrı kutucuklarda: **Apple reddi**, **Geri çekildi**,
  **Red metni**. Toplama yok.
- `undefined` artık "0" değil **"?"** yazılıyor. Durum geçmişi okunamadıysa
  ya da kayıt eski bir eklenti sürümünden kaldıysa sayı BİLİNMİYOR demektir;
  "0" yazmak "hiç reddedilmemiş" diye okunur.
- Durum geçmişi kısmen okunduysa sayının başına **≥** konuyor.
- Test gerçek Housify verisiyle bağlandı: eski kodu geri koyunca
  `Apple reddi 3 bekleniyor — geldi: 5` diye kırılıyor.

**İkinci bulgu — aynı ekranın "Şüpheli yanıtlar (5)" listesi.** Beşi de
şüpheli değildi; ayrıntısı R20'de.

**Yan bulgu — etiket de veri kalitesidir.** Aynı ekranda "1 dil" yazıyordu.
Sayı doğru ama etiket eksikti: o sayı **künye** dili (ad/altyazı/kategori),
sürüm açıklama metninin dili değil. Bu ayrım toplayıcıda zaten yapılmıştı ama
arayüzde kaybolmuştu. Bütün sayaçlara ne saydıklarını yazan açıklama eklendi.

### 2026-08-20 · ilk kanarya turu

**Doğrulandı** (artık tahmin değil): `/olympus/v1/session`, `/iris/v1/apps`,
`/iris/v1/apps/{id}`, `.../appInfos?include=…`, `.../appInfoLocalizations`.
Alan adları beklediğimizden geniş çıktı — `apps` 29 alan döndürüyor
(`contentRightsDeclaration`, `isOrEverWasMadeForKids`, `storeUrl`,
`streamlinedPurchasingEnabled` gibi bugün kullanmadığımız ama işimize
yarayacak alanlar dahil).

**Yeni bilgi:** `appInfoLocalizations` içinde `privacyChoicesUrl` ve
`privacyPolicyText` de var; bugünkü `fetch/asc.ts` yalnız `privacyPolicyUrl`
okuyor.

**Kırılma:** `/iris/v1/ageRatingDeclarations/{id}` → **403**. iris bu kaynağı
doğrudan id ile vermiyor; yalnızca `appInfos?include=ageRatingDeclaration`
üzerinden geliyor. Kod ona göre değişti.

**Kanaryanın kendi hatası:** her 403 "oturum düştü" sayılıp tur kesiliyordu —
32 uçtan yalnız 6'sı denendi. Bu, tam olarak R5'in ("kırık uç turu
düşürmesin") kendi kimlik-doğrulama kodumuzdaki ihlaliydi. Ders: *tolerans
kuralı en çok, kuralı yazan kodun kendisinde unutuluyor.*

**İkinci hata (sessiz olanı):** enjekte edilen kod "zaten yüklüyse atlama"
koruması kullanıyordu. Eklenti güncellendiğinde sayfada ESKİ sürüm kalır ve
düzeltme hiç çalışmaz; üstelik hiçbir hata görünmez — teşhisi en zor tür.
Artık koşulsuz yeniden tanımlanıyor, dinleyici eskisi kaldırılarak takılıyor.

### 2026-08-20 · ikinci tur — arayüz kilitlendi

Kullanıcı ikinci turu başlatamadı: düğme "Yokluyor…" durumunda takıldı.

**Sebep kanaryada değil, service worker'daydı.** Her mesaj için
"durumu oku → değiştir → yaz" yapılıyordu. Mesajlar saniyede birkaç tane
geldiği için yazımlar birbirini eziyordu: `gl:canary:done` "running:false"
yazdıktan sonra, ondan önce okumuş olan bir `gl:probe` yazımı "running:true"yu
geri getiriyordu. Klasik kayıp güncelleme (lost update) yarışı.

Düzeltme iki katmanlı, çünkü tek katman yetmez:
1. **Yarışı bitir** — bütün yazımlar tek promise zincirinden geçiyor, her
   güncelleme durumu zincirin içinde okuyor.
2. **Kilitlenmeyi imkânsız kıl** — düğme artık hiçbir koşulda kapanmıyor.
   Yarış bir daha olsa bile kullanıcı sıkışmaz. *Doğru kod yazmak yetmez;
   kod yanlışken bile çıkışı olan arayüz gerekir.*

Test, eski koda geri konulduğunda 5 iddiadan 5'i düşüyor — yani boş değil.

### 2026-08-20 · üçüncü tur — ilişki grafiği çıktı

46 uç, 37 istek, 29 saniye. Kırık uç yok; iki `403` (`appPriceSchedule`,
`appAvailabilityV2` — doğrudan okunamıyor, `ageRatingDeclarations` gibi).

**En değerli çıktı uçların kendisi değil, `ilişkiler:` listesi oldu.** Apple her
kaynağın nereye bağlandığını söylüyor; artık uç adı TAHMİN ETMİYORUZ, graftan
okuyoruz. R2'nin yarısı böylece kapandı.

Graftan çıkan ve denetimi doğrudan güçlendirecek üç uç:

| Uç | Ne verir | Bugün ne yapıyoruz |
|---|---|---|
| `dataUsages` | App Privacy etiketleri | **hiç okumuyoruz** — 5.1.1/5.1.2 redleri kör |
| `endUserLicenseAgreement` | özel EULA | okumuyoruz — 3.1.2 paywall kuralı eksik çalışıyor |
| `iapPriceSchedule` | IAP fiyatı | `fetch/asc.ts` hepsine `price=0` diyor ("priceless") |

Ayrıca: `resolutionCenterThreads` uygulamanın DOĞRUDAN ilişkisi — gönderim
başına filtre atmaya gerek yok. `appStoreVersionStateChanges` sürüm durum
geçmişini veriyor. `subscriptionPricePoints` fiyatı `proceeds` ve `currency`
ile birlikte döndürüyor.

**Hacim uyarısı (R12):** tek bir aboneliğin `introductoryOffers` kaydı 175
adet, 9 sayfa çıktı. Toplayıcıda bu uç ülke/tarih filtresiz çekilirse tek
uygulama yüzlerce istek eder.

**Gizlemede aşırıya kaçmışım:** `/token/` kalıbı `iconAssetToken`'ı da
maskeledi. Gereksiz gizleme teşhis için gereken veriyi yok ediyor; kalıp
daraltıldı (R4 hâlâ yerinde — `demoAccountPassword` gizli kalıyor).

**Yöntem düzeltmesi:** kanarya artık doğru sekmeyi kullanıcının açmasına
bağlı değil. Hesaptaki uygulamaları tek istekle tarayıp **red geçmişi olanı**
seçiyor. "Kullanıcı doğru şeyi yapsın" diye kurulan her adım, er geç
yapılmadığı için kırılır.

### 2026-08-20 · dördüncü tur — kanarya bitti

51 istek, 58 saniye. Kanarya doğru uygulamayı kendi buldu (yazışma sayısı:
Dance AI 0, Housify 1, Glamio 0, AI Video 2 → AI Video seçildi).

**Red zinciri gerçek veriyle DOĞRULANDI** — projenin en kritik parçası:
`resolutionCenterThreads` → `resolutionCenterMessages` (`messageBody` HTML,
2040 karakter) → `reviewRejections` (`reasons`, ek dosyalarla birlikte).
`threadType: REJECTION_REVIEW_SUBMISSION` ile red yazışmaları diğerlerinden
ayrılabiliyor. Not: thread'in `state` alanı `null` geliyor — ona güvenme,
`threadType` ve `lastMessageResponseDate` kullan.

**Hacim gerçeği (R1/R12).** Tek uygulamada: 12 sürüm, **17 dil**, 111 build
(5 sayfa), 12 ekran görüntüsü, 10 gönderim, 9 özel ürün sayfası. Başka bir
uygulamada 175 tanıtım teklifi. "Her şeyi çek" filtresiz yazılırsa uygulama
başına yüzlerce istek eder. Toplayıcı varsayılanları buna göre daraltıldı.

**Kırık kalanlar:** `iapPriceSchedule`, `iapPricePoints`,
`appStoreReviewScreenshot` → 404. Yol tahminim yanlış (`/inAppPurchases/{id}/`
yerine başka bir kök olmalı). `appStoreVersionSubmission` → 404 (yayınlanmış
sürümde bu kayıt yok, beklenen). `appPriceSchedule` ve `appAvailabilityV2` →
403, doğrudan okunamıyor.

**Yeni ders — yol tahmin etmeyi bırak.** JSON:API her ilişki için `related`
linki verebiliyor. Veriyorsa toplayıcı adresi kendi kurmaz, Apple'ın verdiği
linkten gider. 404'lerin tamamı yol tahmininden çıktı; bu, R2'nin en büyük
parçasını kapatır.

**`expect: []` bir güvenlik açığıydı.** `dataUsages` 14 kayıt döndürdü ve
kanarya "tamam" dedi — oysa kayıtların İÇİ boştu (veri `include` ile geliyor).
Beklenti listesi boş olduğu için ağ devreye girmemişti. Artık "kayıt var ama
tek alan yok" durumu, beklenti tanımlı olmasa bile kendiliğinden **şüpheli**.

**R4 gerçekten sızdı.** Rapor, bir iş arkadaşının adını, telefonunu ve
e-postasını sohbete taşıdı (`appStoreReviewDetail`, `betaAppReviewDetail`,
`appStoreVersionStateChanges.initiator`, `customerReviews.reviewerNickname`).
Maske yalnızca şifre kalıbına bakıyordu. Kişisel veri için ayrı bir kova
eklendi. Ders: *"sır" ile "kişisel veri" ayrı şeyler; ikincisi daha çok yerde
ve daha sessiz duruyor.*

### 2026-08-20 · toplayıcı yazıldı

Kanaryanın haritası koda döküldü. Uygulama başına 20 bölüm ham JSON + red
metinleri IndexedDB'ye iniyor. Üç kural koda gömüldü: yol tahmin etme
(`links.related`), boş ile okunamadıyı ayır, hacmi dar tut.

**Kendi hatam, kayda geçsin:** bir düzeltmeyi (URL birleştirme) dosyaya
toplu regex ile uygulamaya çalıştım; regex `.` ile satır sonlarını da eşleyince
parantez dengesini beş yerde bozdu ve sonraki iki yamada daha da bozuldu.
Kurtaran şey testlerdi — her adımda hangi çağrının kırıldığını söylediler.
Ders: *çok satırlı kod dönüşümünü regex'e yaptırma; ya elle yaz ya baştan
üret.* Sözdizimi kontrolü + testler olmasaydı bu hata kullanıcıya giderdi.

**Neden `q()` diye bir yardımcı var:** Apple'ın verdiği `related` linki kendi
sorgusunu taşıyabiliyor. `path + '?limit=200'` yapıştırmak iki soru işareti
üretir ve uç 400 döner. Adresi biz kurmadığımız için biçimi hakkında varsayım
da yapamayız — testte bu senaryo var.

### 2026-08-20 · ilk gerçek çekim — 6 red metni

İki uygulamadan 6 red çıktı. Biçim doğru: tek mesajdaki iki madde ayrı
dosyalar oldu (Housify 2.1(b) + 5.6.3, aynı mesaj), geliştirici yanıtı doğru
maddeye bağlandı, `Version reviewed` ve `Review Device` preamble'dan çekildi.

Üç sorun çıktı, ikisi gerçek hata:

**1. Madde belirtmeyen geliştirici yanıtı sessizce düşüyordu.** Yanıt
indeksleme yalnız "Guideline X" başlığı olan blokları topluyordu. Geliştirici
düz metin yazdığında (sahada sık) yanıt hiçbir yere bağlanmıyor ve kayboluyordu.
Kaybedilen şey dersin *"neyle geçtik"* alanı — `suggestedFix`'i gerçekçi yapan
tek bilgi. Artık düşmüyor: hangi maddeye ait olduğunu bilemediğimiz için tüm
maddelere **"genel, madde belirtilmemiş"** etiketiyle giriyor. Yanlış atıf,
kayıp bilgiden iyidir — ve etiket sayesinde model de bunu biliyor.

**2. Aynı gün + aynı madde = aynı dosya adı.** İki red üst üste yazabilirdi.
Dosya adına mesaj kimliğinin ilk 6 karakteri eklendi.

**3. Kodlama — dosya doğru, okuyan yanlış.** Metinler `gerekÃ§esi`,
`GeliÅtirici` diye göründü. Bit düzeyinde bakınca: `ı` = `C4 B1` → `Ä±`,
`ş` = `C5 9F` → `Å` + görünmez bayt, `—` = `E2 80 94` → `â` + iki görünmez
bayt. Bunlar **Latin-1 olarak okunmuş geçerli UTF-8'in** imzası; dosyanın
kendisi bozuk değil. Yine de her okuyucunun doğru tahmin etmesini beklemek
kırılgan: indirilen .txt'lere artık UTF-8 BOM konuyor. Karşılığında `learn`
tarafında BOM temizleniyor — kalırsa metnin ilk karakteri görünmez bir işaret
olur ve "App:" satırı artık satır başında olmaz.

### 2026-08-20 · anahtarsız denetim

Çekilen döküm artık `Submission`'a eşleniyor ve denetim eklentinin içinde
çalışıyor. `.p8` anahtarı, `.env`, terminal — hiçbiri gerekmiyor.

**Tek kaynak korundu.** Denetim mantığı kopyalanmadı: `src/` TypeScript'i
esbuild ile `extension/src/audit.bundle.js`'e derleniyor (`npm run build:ext`,
56 KB, 20 kural kartı gömülü). Terminaldeki `npm run check` ile eklentinin
çalıştırdığı kod aynı kaynaktan gelir. Kopyalasaydık ikisi zamanla ayrışır ve
hangisinin doğru olduğunu kimse bilemezdi. Derleme, pakete `require(`,
`node:fs`, `process.env` sızarsa hata verip duruyor.

Ortak tablolar (yaş sınırı, cihaz sınıfı, dönem sözlüğü) `fetch/apple-tables.ts`
altında toplandı — aynı sebep: iki kopya, biri güncellenir öteki unutulur.

**Yeni tuzak, yakalandı:** `lint/urls.ts` adresleri fetch ile sınıyor ve hata
alınca "ölü" diyor. Tarayıcıda ağ erişimi kullanıcı iznine bağlı; izin
yokken her fetch düşer ve ÇALIŞAN adresler "ölü" raporlanırdı — bir denetim
aracı için mümkün olan en kötü hata. Sınama artık opsiyonel; izin yoksa
yapılmıyor ve rapor bunu **denetlenmedi** diye yazıyor. İzin de kurulumda
değil, kullanıcı denetime bastığında isteniyor: kurulum ekranında "tüm
sitelere erişebilir" yazması ofiste haklı olarak güveni sarsar.

**İkinci tuzak:** çekim özeti uygulama kaydının üzerine yazıyordu; elle
girilen `meta` (ör. "AI içerik üretiyor mu" — App Store Connect bunu hiç
söylemiyor) her yeni çekimde silinirdi ve o kartlar bir daha hiç çalışmazdı.
Depo artık `meta`yı koruyor.

**Raporun dürüstlüğü:** model turu eklentide henüz yok. Bu yüzden rapor en
üstte "BU RAPOR EKSİKTİR" diyor ve modele gidecek kartları tek tek listeliyor.
Eksikliği gizleyip temiz bir skor göstermek, bu projede yapılabilecek en pahalı
hata olurdu.

### 2026-08-21 · LLM proxy

Model çağrıları Cloudflare Worker'dan geçiyor. Worker **aptal**: prompt, şema,
kural kartı orada değil — yalnız anahtarı ekliyor, tavanı uyguluyor,
deterministik yanıtları önbelleğe alıyor. Prompt mantığını oraya taşımak
`build:ext` ile kaçındığımız şeyi geri getirirdi: terminal ile eklentinin
denetimi ayrışır.

**Paket temizliği zorlandı.** `prompt.ts` görsel yüklemek için `node:fs`
kullanıyordu ve bu, dosyayı tarayıcı paketine sokulamaz hale getiriyordu.
Yükleyici artık enjekte ediliyor (`ImageLoader`); Node sürümü
`check/image-node.ts`, tarayıcı sürümü `ext/audit.ts` içinde. Aynı şekilde
`OPENAI_IMAGE_DETAIL` sağlayıcının içinde `process.env`'den okunuyordu —
ortam okuma fabrikanın işi, sağlayıcı yalnız değeri alır. İkisini de
`build:ext`'teki sızıntı denetimi yakaladı; olmasaydı paket derlenir ama
tarayıcıda sessizce patlardı.

**Görselsiz devam etmek artık hata veriyor.** `submissionPrefix` görsel istendi
ama yükleyici verilmediyse fırlatıyor. Eskiden sessizce görselsiz devam
edebilirdi — görsel kartlarının "sorun yok" demesinin en kolay yolu buydu.

**Testin yakaladığı tasarım hatası:** önbellek isabeti günlük tavandan
düşüyordu. Sağlayıcıya hiç gitmeyen, para ödetmeyen bir çağrının kotayı
yakması saçma; aynı denetimi ikinci kez koşmak günlük hakkı bitirirdi. Sıra
düzeltildi: önce önbellek, sonra sayaç.

### 2026-08-21 · dağıtılan klasöre özel anahtar koymuşum

Eklenti kimliğini sabitlemek için bir anahtar çifti ürettim ve özel anahtarı
`extension/.signing-key.pem` olarak **eklenti klasörünün içine** yazdım.
Chrome yüklerken uyardı: "Bu uzantıda anahtar dosyası var."

Uyarı yerindeydi. `extension/` ofise dağıtılan klasör; içine özel anahtar
koymak onu dağıtmak demek. `.gitignore`'a eklemiştim — depoya girmesini
engelledi ama asıl riski (klasörün elden ele gitmesi) hiç kapatmadı.

Anahtar `.extension-signing-key.pem` olarak proje köküne taşındı. Ders:
*gitignore bir sırrı gizlemez, yalnızca depodan uzak tutar. Sırrın nerede
DURDUĞU ayrı bir sorudur.*

### 2026-08-21 · ilk gerçek denetim iki eksik gösterdi

Model turu çalıştı (3 kart, 3 ham bulgu → 2 doğrulanmış). Ama iki alanda
veri eksikti ve ikisi de benim hatamdı.

**1. IAP fiyatları okunmuyordu — yanlış teşhis yüzünden.** Kanaryada
`/iris/v1/inAppPurchases/{id}/iapPriceSchedule` 404 dönmüştü ve ben bunu
"iris bu ucu vermiyor" diye kaydedip fiyatları `price=0` bırakmıştım.
Oysa 404'ün sebebi ucun yokluğu değil, **yolu benim uydurmamdı**. Kaynağın
kendi `links.related` adresi zaten duruyordu. Kendi yazdığım kuralı
("yol tahmin etme") kendi kodumda uygulamayı unutmuşum — R5'te olduğu gibi:
*tolerans kuralı en çok, kuralı yazan kodun kendisinde unutuluyor.*
Fallback koymadım: ilişki linki yoksa yol kurmayı denemiyoruz.

**2. 16 ekran görüntüsünden yalnız 6'sı modele gidiyordu.** Kural "cihaz
sınıfı başına 3" idi. Ama `2.3.3-screenshots-reflect-app` kartı ÇOĞUNLUK
sorusu soruyor: "ekran görüntülerinin çoğunluğu uygulamayı kullanımda
gösteriyor mu?" 8'in 3'üne bakarak çoğunluk hükmü kurulamaz — kart kendi
sorusunu **yapısal olarak** cevaplayamıyordu. AI Video tam bu maddeden
reddedilmişti.

Yeni kural: en zengin cihaz sınıfının tamamı (en fazla 10), diğer sınıflar
gönderilmiyor. iPhone ve iPad görselleri genelde aynı tasarımın kopyası;
ikisini de göndermek maliyeti ikiye katlayıp yeni bilgi getirmiyordu. Modele
hangi sınıfı gördüğü ve nelerin gösterilmediği açıkça yazılıyor.

**Bir de kozmetik ama yanıltıcı bir hata:** rapor
`apple-3.1.2 + apple-3.1.2` yazıyordu. `dedupeFindings` birleşen bulguların
id'lerini tekilleştirmeden birleştiriyordu; okuyan "iki ayrı kural ihlal
edilmiş" sanıyordu.

**Kendi çalışma hatam, üçüncü kez:** bir düzeltmeyi dosyaya indeks/regex ile
uygulayıp dört fonksiyonu sildim. `git`'ten geri aldım. Aynı hatayı üçüncü
kez yaptım — kural artık net: *çok satırlı kod dönüşümünü asla kör dilimleme
ile yapma; ya hedefi tam metniyle eşleştir ya dosyayı baştan üret.*

### 2026-08-21 · arayüz açılışta patlıyordu

`viewer.js` yüklenirken `Cannot access 'AYAR_KEY' before initialization`
veriyordu: açılış çağrılarını (`loadStats`, `loadApps`, `ayarlariYukle`)
dosyanın ortasına koymuşum, kullandıkları `const` ise altında tanımlıydı.
Fonksiyon bildirimi yukarı taşınır, `const` taşınmaz.

**Neden fark edilmedi:** `node --check` bunu YAKALAMAZ — kod geçerli JS.
Yalnız çalıştırmak yakalar. Eklentinin arayüz dosyaları o güne dek hiç
koşturulmamıştı; testler mantığı sınıyordu, açılışı değil.

Eklendi: sahte DOM ile `viewer.js` ve `popup.js` bir kez yükleniyor, açılışta
başlayan async işler de dinleniyor. Hatalı sürümle sınandı, kırmızı yanıyor.

Ders: *"sözdizimi doğru" ile "yüklenince patlamıyor" ayrı iddialar; ikincisini
sınamak için dosyayı bir kez çalıştırmak gerekiyor.*

### 2026-08-21 · "eksik" sanılan iki şey — biri gerçekten eksikti

**Ekran görüntüleri: davranış doğruydu, MESAJ yanlıştı.** 12 görüntüden 6'sı
modele gidiyordu ve rapor bunu "gerisi görülmedi" diye **Denetlenmedi**
listesine yazıyordu. Oysa 12 görüntü iki cihaz sınıfına bölünmüştü ve seçilen
sınıfın TAMAMI gitmişti; diğer sınıf bilerek atlanıyor (aynı tasarımın başka
cihaz kopyası, maliyeti ikiye katlıyor, yeni bilgi getirmiyor).

Ders: *"gönderilmedi" ile "gönderilemedi" ayrı şeylerdir ve raporda ayrı
görünmek zorundadır.* İkisini aynı kovaya koymak, bu projenin kaçınmaya
çalıştığı hatanın tersi: yanlış alarm. Kullanıcı eksik denetim sanıp veriye
güvenmiyor.

Ayrıca sıralama düzeltildi: artık TELEFON sınıfı tercih ediliyor. iPad'de daha
çok görsel olması denetimin iPad'e bakmasını gerektirmez — App Store'da
kullanıcının gördüğü ve Apple'ın red gerekçelerinin atıf yaptığı küme telefon.

**IAP fiyatları: uyarı kendi teşhisini koymuyordu.** "Fiyatı okunamadı" diyor
ama nedenini söylemiyordu, kullanıcı da bana sormak zorunda kalıyordu. Artık
ayırıyor: fiyat bölümü çekimde hiç yoksa "eski çekim, yeniden çek" diyor;
çekilmiş ama okunamamışsa "Okunamayan uçlar listesine bak" diyor.

Ders: *bir uyarı, okuyanın "neden?" diye sormasına yol açıyorsa eksik
yazılmıştır.*

### 2026-08-21 · Apple reddi ile geliştirici geri çekmesi karışıyordu

**Gerçek hata.** Red metni üretici şöyle diyordu: "Apple mesajı varsa onları
al, YOKSA hepsini al." Sonuç: Apple'ın hiç yazmadığı bir yazışmada
geliştiricinin kendi notu, `=== Apple'ın red gerekçesi ===` başlığıyla derse
dönüşüyordu. Geliştiricinin bir hatayı düzeltmek için geri çektiği
(DEVELOPER_REJECTED) gönderimler, Apple reddi gibi sayılıyordu.

İkisi bambaşka şey: biri *"Apple bunu kabul etmedi"*, öteki *"biz vazgeçtik"*.
Karıştırırsak ders deposu Apple'ın hiç söylemediği şeyleri "red kalıbı" diye
öğrenir — denetimin dayandığı kanıt bozulur.

Düzeltme: yalnızca Apple'ın yazdıkları red sayılıyor. Apple mesajı olmayan
yazışma **sessizce atlanmıyor**, `şüpheli` listesine "burada red aramadık"
diye giriyor. Red metnine `Kaynak: Apple App Review` satırı eklendi. Sürüm
sayıları da ayrıldı: `reddedilen sürüm` ve `geliştirici geri çekti` artık
farklı sayaçlar.

Ders: *"veri yoksa eldekiyle idare et" fallback'i, veri türünü değiştiriyorsa
fallback değil sessiz veri bozulmasıdır.*

### 2026-08-21 · IAP fiyatı: üçüncü deneme, bu kez tahmin yok

İki kez yanlış teşhis koydum. Önce "iris bu ucu vermiyor" dedim (oysa yolu
ben uydurmuştum). Sonra "`links.related` üzerinden giderim" dedim — o da her
zaman gelmiyor, ve gelmeyince fiyat bölümü hiç üretilmedi.

Üçüncü yaklaşım tahmine dayanmıyor: birkaç aday yol **sırayla deneniyor**,
ilk tutan öğreniliyor ve kalan ürünlerde yalnız o kullanılıyor; çalışan yol
çekim günlüğüne yazılıyor. Ayrıca ürün listesi önce `include=iapPriceSchedule`
ile isteniyor — tutarsa ürün başına istek hiç gerekmiyor. İnclude'u tanımayan
bir uç TÜM ürün listesini düşürebileceği için başarısızlıkta sade sürümle
tekrar deneniyor.

**Az kalsın sessiz veri bozulması yapıyordum:** include yolunda fiyatlar tek
havuzda, tüm ürünler karışık geliyor. "Havuzdaki ilk fiyatı al" demek her
ürüne aynı fiyatı yazmak olurdu — hem de hiçbir uyarı üretmeden. Artık
ilişki zinciri (`ürün → çizelge → fiyat → fiyat noktası`) izleniyor;
izlenemezse fiyat **null** kalıyor ve "okunamadı" deniyor. Test bunu iki
ürünlü karışık havuzla sınıyor.

Ders: *bir havuzdan "ilk uyanı al" demek, havuzda birden çok sahip varsa
veri bozmaktır. Kimlik zinciri izlenemiyorsa doğru cevap null'dır.*

### 2026-08-21 · fiyatlar: iki ayrı yerde aynı hata, ikisi de sessizdi

Kullanıcı "ürün fiyatlarında sıkıntı var" dedi. Çekim günlüğünde şu yazıyordu:
`iapPrices: fiyat çizelgesi include ile geldi — ürün başına istek atılmadı`.
Cümle doğruydu, sonuç yanlıştı. Üç ayrı hata çıktı:

**1. Include'un KABUĞU fiyat sanılıyordu.** Toplayıcı "havuzda
`iapPriceSchedules` tipinde bir kayıt var mı" diye bakıyordu. Vardı — ama
Apple çizelgenin kabuğunu gönderip fiyat noktasını göndermiyor. Zincir
(ürün → çizelge → fiyat → fiyat noktası) havuzda kopuk kalıyordu. Toplayıcı
"geldi" deyip ürün başına istek atmıyor, eşleyici aynı veriden fiyatı
okuyamıyor, rapor her ürüne `price=0` yazıyordu.

Testi doğru soru soracak biçimde değiştirdim: "kayıt var mı" değil, **"fiyat
okunabiliyor mu"**. Testi yapan kod, eşleyicinin kullandığı kodun aynısı
(`src/iap-price.ts`, eklentiye `GLPrice` olarak enjekte ediliyor). İki ayrı
kopya olsaydı yine ayrışırlardı — nitekim ayrışmışlardı.

**2. Resmi API tek seferlik ürünlerin fiyatını HİÇ okumuyordu.** Kodda
"v2 fiyat çizelgesi ayrı bir ağaç; şimdilik okumuyoruz" yazıyordu ve her
tüketilebilir ürüne 0 yazılıyordu. Doğru uç `/v1/inAppPurchases/{id}/iapPriceSchedule`
değil (404 döner), şu:
`/v1/inAppPurchasePriceSchedules/{iapId}/manualPrices?include=inAppPurchasePricePoint&filter[territory]=USA`.

**3. Abonelikte YANLIŞ fiyat yazılıyordu — en sinsi olanı.** `limit=1` ile tek
kayıt isteyip havuzdaki ilk fiyat noktasını alıyorduk. Apple bir abonelik için
iki kayıt döndürüyor: eski abonelere **korunan** fiyat (`preserved: true`) ve
yeni müşterinin ödediği fiyat. İlki geliyordu. Weekly Pack raporda 5.99
görünüyordu, App Store'da 14.99'du. Yearly Pack ise Monthly'nin fiyatını
gösteriyordu. Hiçbir uyarı yoktu: sayı doluydu, sadece yanlıştı.

Artık `preserved` olanlar eleniyor, `startDate`i bugünü geçmeyen en yeni kayıt
seçiliyor, fiyat noktası havuzdan değil **seçilen kaydın kendi ilişkisinden**
okunuyor. İleri tarihli fiyata düşmek zorunda kalırsak bunu yazıyoruz.

**Nasıl yakalandı:** `npm run test:fetch` yazdım — gerçek ağa çıkıp dört
kaynağı da yoklayan bir çekim testi. Kritik parçası şu: resmi API'den okunan
fiyatlarla **herkese açık App Store vitrininden** kazınan fiyatları
karşılaştırıyor. Vitrin bağımsız bir kaynak; ikisi aynı sayıyı söylemiyorsa
elimizdeki veri yanlış demektir. Düzeltmeden önce 11 üründen 5'i okunuyordu ve
okunanların 3'ü yanlıştı; sonra 11/11 okundu ve 10 üründe iki kaynak birebir
uyuştu.

Ders: *fiyat gibi tek sayılık alanlarda "boş" hatası gürültülüdür, "dolu ama
yanlış" hatası sessizdir. Sessiz olanı ancak İKİNCİ BİR KAYNAK yakalar.*

### 2026-08-21 · Apple'ın kural metni artık repoda

Kartlar (`corpus/*.yaml`) Apple'ın kuralını bizim cümlelerimizle özetliyordu.
Özet, denetimin dayandığı kanıt olamaz: kartı yazarken yaptığımız her yorum
hatası modele "Apple şöyle diyor" diye gidiyordu.

`developer.apple.com/app-store/review/guidelines/` sayfası çekilip 145 maddeye
ayrıldı (`data/apple-guidelines.json`, `npm run guidelines`). Modele artık
kartın yanında Apple'ın **kendi metni** de gidiyor; `npm run madde -- 3.1.2`
ile terminalden de okunuyor.

Ayrıştırıcıda iki karar: (a) sayfa iskeleti tanınmazsa hata veriyoruz, boş
çıktıyla eski iyi dosyanın üstüne YAZMIYORUZ; (b) `id="3.1.2a"` biçimindeki
harfli alt maddeler `3.1.2(a)` diye normalleştiriliyor — red mektupları onları
o yazılışla anıyor ve en çok atıf alan maddeler onlar.

Ders: *kaynağın kendi metnini saklamak, o metni özetleyen her şeyden daha
uzun ömürlüdür.*
