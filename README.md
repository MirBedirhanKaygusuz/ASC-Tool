# Greenlight — Store Policy Checker

App Store / Google Play listing'lerini **göndermeden önce** politika kurallarına
karşı denetler. Her bulgu gerçek bir politika maddesine atıfla ve önerilen
düzeltmeyle gelir.

## Kurulum

```bash
brew install ollama
ollama serve &            # arka planda çalışsın
ollama pull qwen3:8b

npm install
cp .env.example .env
```

Model **yereldedir** — bulut API'si ve anahtar gerekmez.

## Kullanım

```bash
npm run corpus                                                    # kural kitabını listele
npm run check -- --fixture fixtures/glamio-apple.json --no-llm    # sadece kesin kontroller
npm run check -- --fixture fixtures/glamio-apple.json             # tam denetim (yerel model)
npm run check -- --fixture fixtures/glamio-apple.json --model qwen2.5:14b
```

Rapor `out/report.md` (okunur) ve `out/report.json` (eval için) olarak yazılır.

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

## Model: yerel

Case "maliyeti düşürmek için yerel LLM tercih edilebilir" diyor. Boru hattı bir
sağlayıcı arayüzü ([src/llm/types.ts](src/llm/types.ts)) konuşur; motor takılıp
çıkarılabilir. Varsayılan Ollama.

Bulut sağlayıcı ([src/llm/anthropic.ts](src/llm/anthropic.ts)) arayüzün arkasında
duruyor ama **varsayılan değil** ve anahtar yoksa hiç devreye girmiyor. İki iş için:
vision (yerel görsel modelleri ince yazı okumada zayıf, case hibrit'e izin veriyor)
ve "yerel model ne kaybettiriyor" sorusunu aynı eval'de ölçmek.

### Yerelde değişen üç şey

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
sıcaklık 0.7 ve farklı seed ile oy topluyor.

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

En kritik iki alan:
- `question` — modele sorulacak **tek net soru**. "İhlal ara" değil, daraltılmış
  bir soru. Yargılanamayan kuralı yargılanabilir hale getiren şey budur.
- `negativeExample` — ihlal **sayılmayan** örnek. Yalancı alarma karşı en etkili
  alan, zorunlu.

`corpus/apple/3.1.2-subscription-disclosure.yaml` cross-scope örneği olarak bak.

## Durum

| | Durum |
|---|---|
| Lint katmanı (6 kontrol) | ✅ çalışıyor |
| Rule card şeması + loader | ✅ çalışıyor |
| Kural seçimi | ✅ çalışıyor |
| LLM sağlayıcı arayüzü (ollama + bulut) | ✅ çalışıyor |
| Checker + prefix cache | ✅ çalışıyor (yerel) |
| Ground (alıntı doğrulama) | ✅ çalışıyor |
| Verify (ikinci göz, 3 oy) | ✅ çalışıyor (yerel) |
| Rapor (md + json) | ✅ çalışıyor |
| Kural kitabı | 🟡 3/30 kart |
| App Store Connect fetch | ⬜ [src/fetch/index.ts](src/fetch/index.ts) — API key bekliyor |
| Play Developer API fetch | ⬜ aynı |
| Eval harness | ⬜ gerçek red kayıtları bekliyor |
| Vision (ekran görüntüsü) | 🟡 kod hazır; vision modeli + gerçek görsel dosyası gerekiyor |

## Bloke olan işler ve neden

| İş | Ne gerekiyor | Not |
|---|---|---|
| Gerçek listing çekme | App Store Connect API key (.p8 + issuer + key id) | Gelene kadar fixture ile çalışıyoruz |
| Play tarafı | Play Developer API service account JSON | — |
| **Eval harness** | **Gerçek geçmiş red kayıtları** | **API'den GELMİYOR.** Apple'ın red gerekçeleri Resolution Center'da mesaj olarak durur, ASC API vermez. Elle çıkarılacak: hangi app, tarih, hangi madde, reviewer ne yazmış, hangi düzeltmeyle geçmiş. Bu olmadan aracın işe yarayıp yaramadığı **ölçülemez**. |
| Kural kitabının sırası | Yukarıdaki red kayıtları | Hangi kartın önce yazılacağını gerçek red frekansı belirlemeli, tahmin değil |
