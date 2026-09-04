# Greenlight — Store Policy Checker

App Store / Google Play listing'lerini **göndermeden önce** politika kurallarına
karşı denetler. Her bulgu gerçek bir politika maddesine atıfla ve önerilen
düzeltmeyle gelir.

İki yüzü var:

| | Kim kullanır | Ne gerekir |
|---|---|---|
| **[Chrome eklentisi](extension/) — asıl ürün** | Ofisteki herkes | Açık bir App Store Connect oturumu. API anahtarı, snippet, terminal yok. |
| CLI (`npm run check`) | Kural kitabını geliştiren | Node + repo |

Eklenti App Store Connect verisini tarayıcı oturumuyla çeker, denetler ve
raporu yan panelde gösterir. Kurulum: [extension/README.md](extension/README.md).

**Birine denemesi için vermek** (projeyi paylaşmadan):

```bash
npm run paket        # dist/greenlight-<sürüm>.zip
```

Yalnız o zip gönderilir. İçinde kurulum notu (`KURULUM.md`) var; `src/`,
`corpus/`, `worker/`, `.env` ve imza anahtarı **girmez**. Betik önce paketleri
yeniden derliyor (eski paketle dağıtmak, karşının düzeltilmiş bir hatayı
yeniden yaşaması demek) ve sır/Node sızıntısı bulursa zip üretmiyor.

Bilinen kırılma noktaları ve neden öyle yapıldığı: **[belkiPatlarız.md](belkiPatlarız.md)**.
Yeni bir şey eklemeden önce oradaki R2 ve R3'ü oku — bu projenin bütün
mimarisi o iki maddeden çıktı.

## CLI kurulumu

```bash
npm install
cp .env.example .env
```

Model seçimi `.env` ile: yerel Ollama (varsayılan, bedava) ya da
OpenAI-uyumlu bir uç. Eklenti tarafında model **senin Cloudflare
Worker'ından** geçer, anahtar orada durur (bkz. [worker/README.md](worker/README.md)).

## Kullanım

```bash
npm run corpus                                                    # kural kitabını listele
npm run corpus -- --yonerge                                       # Apple'ın hangi maddesinde kart YOK
npm run meta -- --alanlar                                         # elle işaretlenen alanlar ne demek
npm run check -- --fixture fixtures/glamio-apple.json --no-llm    # sadece kesin kontroller
npm run check -- --fixture fixtures/glamio-apple.json             # tam denetim (yerel model)
npm run check -- --fixture fixtures/glamio-apple.json --model qwen2.5:14b
```

Rapor `out/report.md` (okunur) ve `out/report.json` (eval için) olarak yazılır.

### Veri ve kural metni

```bash
npm run vitrin -- 6756182726     # herkese açık App Store vitrini (anahtar YOK)
npm run guidelines               # Apple'ın kural metnini çek/yenile (145 madde)
npm run madde -- 3.1.2           # Apple'ın o maddedeki kendi metni
npm run madde -- --ara subscription
npm run test:fetch               # gerçek ağ: hangi veriyi nereden alabiliyoruz
```

### Araç işe yarıyor mu — iki ayrı soru

```bash
npm run kapsam                          # "yediğim redlerin kaçını bilirdik" (rejects/)
npm run kapsam -- --yedek yedek.json    # eklenti yedeğinden

# tersi: "kaç tane uydurdu" — kart bazında gürültü ölçümü
npm run yalanci-alarm -- out/submission-<id>.json out/submission-<id2>.json
npm run yalanci-alarm -- out/submission-<id>.json --onayla   # gerçekten koşar
```

Tanı koşusu: `--kartlar apple-2.3.7-keyword-misuse,apple-5.2-third-party-brand-in-text`
yalnız o kartları koşturur (ör. "bu kart mı bozuk, model mi zayıf" sorusunu
20 çağrıyla cevaplamak için). Filtreli koşu tam koşu tabanını **ezmez**, ayrı
dosyaya yazar, farkı yalnız o kartlar üzerinden gösterir ve rapora "KISMİ KOŞU"
uyarısı basar.

`yalanci-alarm` **model çağrısı yapar**; `--onayla` olmadan yalnız örneklemi ve
kaç çağrı yapılacağını gösterir. Ölçtüğü şey kart bazında huni: ham bulgu →
alıntı doğrulama → ikinci göz → tekrar eleme. Aradığı imza, çok bulgu üretip
savunmadan hiç geçemeyen kartlar — onlar gürültü kaynağı. Sonuç
`out/yalanci-alarm.json`'a `corpusVersion` ve tarihle yazılır; ikinci koşu
birinciyle otomatik karşılaştırılır (tek seferlik sayı değil, regresyon).

Örneklem hakkında iki uyarı komutun kendisinde: kırpılmış `fixtures/` dosyaları
oranı iyimser gösterir (model uyduracak metin bulamaz) ve örneklemdeki
uygulamaların ortak beyan profili (ör. hepsi "AI içerik üretiyor") çıktıya
yazılır — sayı genel bir oran değil, o profilin oranıdır.

### Kartlar ölü mü — örneklem dar olduğunda

```bash
npm run kart-canlilik              # bedava: kart kendi ihlal örneğinde seçiliyor mu
npm run kart-canlilik -- --onayla  # model: o örnekte gerçekten bulgu üretiyor mu
```

Yalancı alarm ölçümü yalnız ÇALIŞAN kartları görüyor: beş AI uygulamasında 173
kartın ~25'i seçiliyor, kalanı (kumar, VPN, kredi, çocuk) hiç tetiklenmiyor.
Portföyün tamamı aynı türdeyse bu boşluk başka uygulama ekleyerek kapanmıyor.
Bu komut her kartı KENDİ `positiveExample`'ından kurulmuş sentetik bir
listing'e karşı çalıştırır.

Geçmek "recall iyi" demek **değil** — örnekler apaçık ihlal olsun diye yazıldı;
geçmek yalnızca "ölü değil" demek. Başarısızlık ise tek anlamlı: kart, ihlal
diye yazdığımız cümlede bile açılmıyorsa gerçek listing'de hiç açılmaz.
İlk taramada böyle bir kart çıktı (3.2.2(ix) kredi: kendi örneği kendi
prefilter'ından geçmiyordu) ve `npm run test:core` artık bu sınıfı kilitliyor.

Anlık görüntü üretmek bedava: `npm run check -- --app <id> --no-llm` model
çağrısı yapmadan `out/submission-<id>.json` yazar.

"Geçmişte yediğim redlerin kaçını kural kitabı bilirdi?" sorusunu elle
etiketleme olmadan cevaplıyor: Apple'ın red yazışması hangi maddeden geldiğini
söylüyor, kartlar da madde numarasına çapalı.

**Çıktı bir TAVAN, yakalama oranı değil.** Kart yoksa o red kesinlikle
yakalanmazdı; kart varsa yakalanmış *olabilir*. Pek çok red listing'den hiç
görülmez (çöken build, çalışmayan demo hesap, uygulama içi akış).

Asıl değeri **boşluk listesi**: kartı olmayan maddeler, en çok red yediğinden
başlayarak. Yol haritası orada. Aynı ekran eklentide de var (Menü → Kapsam).

Hangi verinin hangi yoldan geldiği: [docs/VERI-KAYNAKLARI.md](docs/VERI-KAYNAKLARI.md).

## Boru hattı

```
fetch → normalize → LINT → select → check → ground → verify → report
                     │       │        │        │        │
                     │       │        │        │        └─ ikinci göz, asimetrik, 3 oy
                     │       │        │        └─ uydurma alıntıyı ele (kod, LLM yok)
                     │       │        └─ kural başına 1 LLM çağrısı
                     │       └─ hangi kartlar geçerli (düz filtre, RAG yok)
                     └─ LLM'siz kesin kontroller
```

## Model

Sağlayıcı arayüzü ([src/llm/types.ts](src/llm/types.ts)) motoru soyutluyor;
`.env` ile değişiyor. Üç seçenek:

| Backend | Ne zaman | Vision | Eşzamanlılık |
|---|---|---|---|
| `openai` | **varsayılan** — gpt-4o-mini | ✅ | 4 |
| `ollama` | maliyetsiz yerel geliştirme | modele bağlı | 1 |
| `anthropic` | kalite tavanı ölçümü | ✅ | 4 |

`openai` backend'i her OpenAI-uyumlu uca çalışır (LM Studio, vLLM, başka
sağlayıcılar) — değişen sadece `OPENAI_BASE_URL` ve `OPENAI_MODEL`.

### gpt-4o-mini neyi açıyor

Yerel `qwen3:8b` metin-only olduğu için **5 görsel kartı çalıştırılamıyordu**
(paywall EULA / fiyat / restore, Apple ile giriş, ekran görüntüsü uyumu).
gpt-4o-mini görsel okuyabildiği için `OPENAI_VISION=1` bunları açıyor —
ama gerçek ekran görüntüsü dosyaları da gerekiyor.

Ayrıca katı `json_schema` desteklediği için `OPENAI_STRICT_SCHEMA=1` ile
çıktı biçimi dil bilgisi seviyesinde garanti altına alınıyor.

## Yerel model notları

Boru hattı bir sağlayıcı arayüzü ([src/llm/types.ts](src/llm/types.ts)) konuşur;
motor takılıp çıkarılabilir. **CLI'ın varsayılanı `ollama`** (`.env` →
`GREENLIGHT_LLM`), çünkü kural kitabını geliştirirken yüzlerce çağrı atılıyor
ve bedava olması gerekiyor.

**Eklenti bunu kullanmıyor.** Orada model çağrıları kullanıcının Cloudflare
Worker'ından geçiyor ve gpt-4o-mini'ye gidiyor: ofisteki kimse Ollama
kurmayacak, üstelik görsel kartları yerel modelde çalışmıyor.

Aşağıdakiler yalnızca yerel modelle çalışırken geçerli — ama ölçülerek
öğrenildi, o yüzden duruyorlar.

### Ollama kullanırken değişen şeyler

**1. `num_ctx` — en sinsi hata.**
Ollama'nın varsayılan bağlamı küçüktür ve fazlasını **sessizce keser**. Bizim
submission ~15-20K token; ayarlanmazsa kuralın bakması gereken metnin yarısı
modele hiç ulaşmaz, hata da vermez. `.env` içinde `OLLAMA_NUM_CTX=32768`.

**2. Eşzamanlılık 1.**
Bulutta paralel çağrı bedava hızdı. Yerelde tersi: paralel istekler tek GPU'yu
böler *ve* prefix KV cache'ini birbirine kırdırır. Sıralı gitmek daha hızlı.

**3. Maliyet para değil, saniye.**
İlk çağrı submission'ı prefill eder (yavaş), sonrakiler aynı prefix'i KV
cache'ten okur (hızlı). Bu yüzden "submission sabit / kural değişken" tasarımı
yerelde buluttan **daha** kritik. `--fixture` koşusu ilk/ortalama çağrı süresini
ayrı ayrı raporlar, farkı görebilesin diye.

**4. Doğrulama oyları sıcaklık ister.**
`temperature: 0`'da üç oy da birebir aynı çıkar, oylama boşa gider. Verify turu
sıcaklık 0.5 ve farklı seed ile oy topluyor.

**5. Sınırsız metin alanı = tekrar döngüsü.**
Şema JSON'u zorlar ama string uzunluğunu bağlamazsa küçük model `rationale`
içinde aynı cümleyi tekrarlayıp tüm çıktı bütçesini yakıyor, JSON yarıda
kesiliyor, bulgu **sessizce kayboluyor**. Ölçüldü: 2048 token yandı, 1 bulgu
kayboldu, süre 91s. Düzeltme: şemada `maxLength`, `repeat_penalty`, ve kesilme
sayacı (`⚠ N çağrı yarıda kesildi`). Süre 91s → 9s.

## Kuralların iki türü

Yerel modelde ölçerken çıktı: kurallar tek cins değil.

**Muhakeme kuralı** — model dili yorumlar (abartılı iddia, abonelik ifşası).
qwen3:8b bunları iyi yapıyor, 3/3 güvenle.

**Bilgi kuralı** — dünyaya dair olgu gerektirir (rakip marka adı, ünlü kimliği,
tescilli isim). Yerel model bu olguları **bilmiyor** ve sessizce "sorun yok"
diyor. Ölçülen örnek: `facetune,remini,faceapp` anahtar kelimelerine
doğrulayıcı üç oyda da *"rakip marka adı içermiyor"* dedi.

Çözüm kartın `facts` alanı: kuralı uygularken doğru kabul edilecek olgular
karta yazılır, modelin hatırlamasına güvenilmez. Aynı kart `facts` ile 3/3
güvenle geçiyor. Bilgi gerektiren her yeni kartta bu alan doldurulmalı.

## Teşhis araçları

```bash
npm run dbg                                   # seçilebilir kuralları listele
npm run dbg -- apple-2.3.7-keyword-misuse     # tek kuralın ham LLM çıktısı
npm run dbg:verify -- apple-2.3.7-keyword-misuse   # doğrulama oylarını tek tek göster
```

Bir kural beklendiği gibi çalışmıyorsa sıra: önce `dbg` (checker buluyor mu?),
bulmuyorsa kart sorunu; buluyorsa `dbg:verify` (doğrulayıcı mı eliyor?).

## Üç tasarım kararı

**1. İş birimi artifact değil, KURAL.**
Modele 30 kuralı birden vermiyoruz — dikkati dağılır, recall düşer. Her kural
için ayrı çağrı yapıyoruz: tek net soru, tek net cevap. Yan faydası: bir kural
birden fazla artifact'e aynı anda bakabiliyor (`scope: cross`) — abonelik ifşası
metin + IAP + ekran görüntüsünü birlikte değerlendirmeyi gerektirir.

**2. Submission sabit, kural değişken → prompt cache.**
Submission (metinler + ekran görüntüleri, ~15-20K token) her çağrıda aynı.
Sonuna `cache_control` koyuyoruz: bir kez yazılıyor, N kural çağrısında ucuza
okunuyor. `usage.cache_read_input_tokens` sıfır geliyorsa cache kırılmıştır.

**3. Yalancı alarm iki filtreyle eleniyor.**
- `ground` — modelin verdiği alıntı metinde birebir var mı? Yoksa at. Kod, bedava.
- `verify` — ikinci model, **ilk denetçinin gerekçesini görmeden**, sadece kural +
  alıntıyı görüp karar verir. "Emin değilsen ihlal değil" diye promptlanır.
  Güven skoru 3 oyun uyuşma oranıdır — modelin kendi beyanı değil (kalibre değil).

## Yeni kural nasıl eklenir

`corpus/{apple|google|shared}/` altına bir YAML. Şema: [src/corpus/schema.ts](src/corpus/schema.ts).

En kritik üç alan:
- `question` — modele sorulacak **tek net soru**. "İhlal ara" değil, daraltılmış
  bir soru. Yargılanamayan kuralı yargılanabilir hale getiren şey budur.
- `negativeExample` — ihlal **sayılmayan** örnek. Yalancı alarma karşı en etkili
  alan, zorunlu.
- `notViolation` — bulgu üretilmeyecek durumların açık listesi. Buraya **ölçümde
  görülen** yalancı alarmlar yazılır, tahmin edilenler değil. Prompt bunu
  örneklerden sonra, cevap talimatından hemen önce ayrı bir "BULGU ÜRETME"
  kapısı olarak basıyor: muafiyet `question` içinde bir yan cümleyken
  gpt-4o-mini onu atlıyordu (5 listing, 14 ham bulgu, sıfır survivor).

`corpus/apple/3.1.2-subscription-disclosure.yaml` cross-scope örneği olarak bak.

Kartı DARALTMANIN iki yolu var; ikisi de kontrol listesini gürültüden korur:

- `appliesWhen` — koşul sağlanmazsa kart hiç çalışmaz. Elle işaretlenen alanların
  tanımı tek yerde: [src/meta-fields.ts](src/meta-fields.ts). Oraya alan eklemek
  arayüzü, eklentiyi, komut satırı bayrağını ve şemayı birden günceller.
  `hasSubscription` / `hasIap` / `hasPreviewVideo` ise submission'dan **türetilir**,
  kimse işaretlemez.
- `prefilter` — konu listing metninde hiç geçmiyorsa kartı açma. Modele giden
  kartlarda yalnız salt-metin kartlarda güvenli; **elle kontrol** kartlarında her
  zaman uygulanır (VPN maddesi yalnız VPN'den söz eden listing'de çıksın diye).
  **Dikkat:** eşleşme düz `includes` — birebir metin, anlam değil. Kural kitabı
  büyüdükçe recall'un ana kolu burası oldu; konu başka kelimelerle anlatılıyorsa
  kart açılmaz. Bu yüzden elenen kartlar sessizce kaybolmuyor: `selectRules`
  onları sebebiyle döndürüyor ve rapor "Bu denetim neyi kapsamadı" bölümünde
  aranan kelimelerle birlikte yazıyor.

Yeni bir alan eklersen `npm run test:core` "sorulan her beyan bir kartı
tetiklemeli" testinde patlar: soru soruluyor ama hiçbir kuralı etkilemiyorsa
o soru kullanıcıya yalan söyler.

## Skor nasıl okunur

Raporun tepesindeki hüküm **sürekli skordan gelmiyor**, engelleyici sorun
sayısından geliyor: kesin kontrollerin yüksek bulguları + ikinci gözden geçmiş
*kesin ihlal ve yüksek* bulgular, **kural başına tek** sayılarak. Eşik bir —
Apple tek bir sebeple reddediyor.

Sebebi ölçümde görüldü: 1 yüksek + 7 orta bulgusu olan uygulama ile 3 yüksek
bulgusu olan uygulama aynı 76'yı alıyordu. 0-100'lük bir eğri "yayına çıkar mı"
sorusunu cevaplayamıyor; sorun sayısı cevaplıyor.

Skor duruyor ama ikincil: bir **öncelik** aracı, olasılık değil. Aynı kuraldan
gelen ikinci bulgu çeyrek ağırlıkla sayılır (lint'te de, kartlarda da) — üç
üründe aynı fiyat hatası tek bir düzeltmedir.

## Durum

| | Durum |
|---|---|
| Lint katmanı (25 kesin kontrol, 9 dosya) | ✅ abonelik dönemi (3.1.2(a)) karttan lint'e taşındı: ölçüm 7 yalancı alarm gösterdi, deterministik karşılaştırma sıfır |
| Rule card şeması + loader | ✅ |
| Kural seçimi (beyan + artifact filtreleri) | ✅ |
| LLM sağlayıcı arayüzü (ollama / openai / anthropic) | ✅ |
| Checker + prefix cache | ✅ |
| Ground (alıntı doğrulama) | ✅ |
| Verify (ikinci göz, 3 oy) | ✅ |
| Rapor (md + json) | ✅ |
| **Chrome eklentisi** — çekim, denetim, rapor, arşiv | ✅ |
| App Store Connect'ten veri çekme | ✅ tarayıcı oturumuyla, **anahtarsız** |
| Vision (ekran görüntüsü) | ✅ gerçek görseller eklenti üzerinden modele gidiyor |
| Red arşivi + ders çıkarma (`npm run learn`) | ✅ |
| Denetim geçmişi + dışa aktarma | ✅ |
| Raporun "neyi kapsamadık" bölümü | ✅ çalışmayan her kart sebebiyle: beyan eksik / beyanla elendi / veri yok / konu geçmiyor |
| Kural kitabı | ✅ 173 kart — yönergenin kural taşıyan 127 maddesinin tamamında en az bir kart (%100) (`npm run corpus -- --yonerge`; test bunu kilitliyor) |
| Kapsam raporu (`npm run kapsam` + panelde) | ✅ hangi maddeleri kaçırdığımız ölçülüyor |
| Yalancı alarm ölçümü (`npm run yalanci-alarm`) | ✅ ilk koşu yapıldı (5 listing, gpt-4o-mini): ham 101 → kalan 48, savunmanın %66'sı ikinci gözden geliyor |
| Kart canlılık taraması (`npm run kart-canlilik`) | ✅ ölü kart sınıfı test altında; 43 kart sınanabilir, 9'u görsel olduğu için sınanamıyor |
| Yakalama ölçümü (`npm run yakalama`) — "kart bu redi GERÇEKTEN yakalar mıydı" | 🟡 ölçüm yazıldı ve testli; **veri bekliyor** — havuzdaki redlerin listing kapsamlı ve alıntılı olması gerekiyor |
| Play Developer API fetch | ⬜ Faz 2 |
| **Ortak ders havuzu** — Docker + Postgres, kendi sunucunda | ✅ CLI ve eklenti aynı havuzu okuyor ([havuz/README.md](havuz/README.md)) |
| Artımlı çekim | ⬜ her çekim baştan alıyor (R12) |

## Sırada ne var

| İş | Ne gerekiyor | Neden bekliyor |
|---|---|---|
| **Yakalama ölçümünü besle** | Listing kapsamlı, alıntılı red vakaları | `npm run yakalama` yazıldı: red vakasının alıntısından sentetik listing kurup kartın seçilip seçilmediğine, `--onayla` ile gerçekten bulgu üretip üretmediğine bakıyor. Bugün havuzdaki 2 red de `in-app` ve alıntısız, yani ölçüm "0 ölçülebilir vaka" diyor — sonuç değil, veri eksikliği. Havuz beslendikçe anlam kazanıyor. |
| Tam listing anlık görüntüsü | Redin ALINDIĞI ANDAKİ listing | Yakalama ölçümü alıntıyla çalışıyor — listing'in kesilmiş bir parçası. Gerçek recall için redin yaşandığı andaki listing'in tamamı gerekiyor; bugünkü listing çoktan düzeltilmiş oluyor. |
| Çekim arşivinin ortak deposu | Sunucu kararı | Ders havuzu ortaklaştı (`havuz/`), ama HAM ÇEKİMLER hâlâ her makinede ayrı IndexedDB'de. Arayüz (`GLStore`) baştan bu geçiş için soyutlanmıştı; havuz aynı deseni izleyebilir. |
| Artımlı çekim | — | Her çekim hesabın tamamını baştan alıyor; Apple'a gereksiz yük (R1) ve dakikalar. |
| `.p8` çapraz doğrulama | ASC API anahtarı | R3'ün panzehiri: aynı uygulama iki kaynaktan çekilip alanlar karşılaştırılacak. Yalnız geliştirme için; kullanıcı hiç görmeyecek. |
| Play tarafı | Play Developer API service account | Faz 2. |
| Kural kitabının sırası | Yukarıdaki red kayıtları | Hangi kartın önce yazılacağını gerçek red frekansı belirlemeli, tahmin değil |
