# Ders sistemi

Kart **politikanın ne dediğini** taşır. Ders **pratikte nasıl reddedildiğini**.
İkisi birlikte modele gider.

## Akış

```
─────────────────── DENETİM ───────────────────

 Submission ──┬─► corpus/*.yaml      kartlar (politika)
              │
              └─► aktif dersler      dersler (gerçek red'ler)  ──► UYARI RAPORU
                  + örnek reject'ler                                bulgular
                                                                  + örnek red'ler

─────────────────── ÖĞRENME ───────────────────

 Ham reject ──► çıkarım ──► aynı platform+madde adayları
                              │
                              └─► "aynı DÜZELTME ikisini de çözer mi?"
                                    evet → mevcut dersin ÖRNEĞİ
                                    hayır → YENİ ders (draft)
```

## Kullanım

### Red metnini işleme — dört giriş yolu

```bash
# 1. Panodan. Resolution Center'dan kopyala, çalıştır. En hızlısı.
npm run learn -- --paste --app Glamio

# 2. Klasördeki hepsi. Birikmiş kayıtlar için.
npm run learn -- --dir rejects/ --app Glamio

# 3. Tek dosya.
npm run learn -- rejects/2025-11-glamio.txt --app Glamio

# 4. Boru hattı.
pbpaste | npm run learn -- --stdin --app Glamio
```

Hangisini kullanırsan kullan **ham metin depoya olduğu gibi yazılır** —
çıkarım sonradan iyileştiğinde aynı metni yeniden işleyebilirsin, kaynak izi
kaybolmaz.

Metni kırpma, olduğu gibi yapıştır: `Guideline`, `Submission ID`,
`Review date`, `Next Steps` başlıkları çıkarımı besliyor.

### Dersleri yönetme

```bash
npm run lessons                        # listele (● aktif ○ taslak × emekli)
npm run lessons -- approve <ders-id>   # taslağı aktifleştir
npm run lessons -- retire <ders-id>    # emekliye ayır
npm run lessons -- push                # yereldekileri ortak havuza taşı
npm run lessons -- push --kuru         # prova: ne taşınacağını göster, yazma
```

Yeni dersler **taslak** doğar ve onaylanana kadar denetimi etkilemez.

### `learn` ne yapıyor

```
ham metin
  │
  ├─ 1. ÇIKARIM      madde, platform, alan, reviewer cümlesi, alıntı,
  │                  düzeltme, özet  → yapılandırılmış alanlar
  │
  ├─ 2. ADAY HAVUZU  aynı platform + aynı madde dersleri  (kod, LLM yok)
  │
  ├─ 3. KARAR        "aynı düzeltme ikisini de çözer mi?"
  │                    evet → mevcut dersin ÖRNEĞİ
  │                    hayır → YENİ ders
  │
  ├─ 4. KART BAĞI    madde + alan eşleşen kart aranır
  │                    bulunamazsa → ⚠ kapsama boşluğu
  │
  └─ 5. YAZ          ders (draft) + örnek + ham metin depoya
```

Toplu işlemede bozuk bir metin partiyi düşürmez — hangisinin patladığını
söyler ve devam eder.

## Dört tasarım kararı

**1. Yeni ders `draft` doğar.** Onaylanana kadar denetimi etkilemez. Hatalı bir
çıkarımın sessizce rapor davranışını değiştirmesini engelleyen tek koruma bu —
kartlardaki ilkeyle aynı.

**2. Ders karta bağlanır, ama bağsız da olabilir.** `rule_id = null` olan ders
= *"bu yüzden reddedildik ama hiçbir kartımız kapsamıyor"*. Kapsama boşluğunu
otomatik alarma çevirir; raporun başlığında sayılır.

**3. Aday havuzunu kod daraltır, kararı model verir.** Tüm dersleri modele
sormak hem pahalı hem hatalı olurdu. Önce `platform + guideline` ile filtre,
sonra model karar verir. Ve kararı **kısıtlı**: `lessonId` şemada adayların
enum'u — model geçersiz bir id üretemez.

Eşleştirme ölçütü *"aynı madde mi"* değil, **"aynı düzeltme ikisini de çözer mi"**.
Bir madde altında birbirinden bağımsız birçok kalıp olur.

**4. Ders id'si kararlı alanlardan üretilir** (`platform + madde + alan`),
başlıktan değil. Başlıktan üretilince model başlığı her seferinde farklı yazıp
aynı kalıp için farklı id'ler açıyordu.

## Depo

| | Yerel | Ortak havuz |
|---|---|---|
| İndeks | `lessons/index.json` | Postgres `lessons`, `reject_cases` |
| Ders gövdesi | `lessons/bodies/{id}.md` | Postgres `blobs` anahtar `bodies/{id}.md` |
| Ham reject | `lessons/rejects/{id}.txt` | Postgres `blobs` anahtar `rejects/{id}.txt` |
| Vektörler | `lessons/vectors.json` | Postgres `lesson_vectors` |

Geçiş: `.env` içinde `GREENLIGHT_STORE=havuz` + `HAVUZ_URL` + `HAVUZ_TOKEN`.
Eldeki dersleri taşımak: `npm run lessons -- push`. Kurulum ve mimari:
[havuz/README.md](../havuz/README.md). Şema
[sql/lessons.sql](../sql/lessons.sql). Kod değişmez —
[src/lessons/types.ts](../src/lessons/types.ts) arayüzü ikisini de karşılıyor.

**Sorgulanan ile okunan ayrı tutuluyor** ama artık ayrı SİSTEMDE değil: satır
tabloları küçük ve indeksli (*"apple/2.3.3 için aktif dersler"* orada koşar),
gövdeler `blobs` içinde ve yalnız gerektiğinde okunuyor. Ayrım anahtar
düzeyinde korunduğu için (`body_key`, `raw_key`) gövdeler yarın bir nesne
deposuna taşınırsa değişen tek şey API'nin blob katmanı olur.

## Ortak havuz — ne değişiyor

Yerel depoda her makinenin kendi kopyası var: Ahmet'in işlediği red'i Ayşe
göremiyor, ikisi aynı red'den iki ayrı ders çıkarıyor ve proje öğrenmiyor
(iç risk kaydında R10). Havuz bağlıyken:

- `learn` yeni bir red'i işlerken **aday havuzu ofisin tamamını görüyor** —
  ekip arkadaşının açtığı derse örnek olarak eklenir, kopya ders açılmaz.
- Denetim (terminalde ve **eklentide**) aynı aktif ders setini kullanıyor.
- Onay herkeste: terminalden `npm run lessons -- approve <id>`, eklentide
  **Menü → Ders havuzu** altındaki düğmeler. Onaylanan ders herkesin
  denetimine girer. Bu yüzden yeni dersin `draft` doğması ortak havuzda daha da
  kritik — hatalı bir çıkarım artık yalnız çıkaranın raporunu değil,
  herkesinkini değiştirebilirdi. Karar geri alınabilir: durum her zaman geri
  çevrilebiliyor.

Eklenti havuza yalnız **okur**. Havuza yazan tek şey terminaldeki `learn`.
Havuz kapalıysa denetim durmaz, yalnız kartlarla koşar ve raporda bunu yazar.

Havuzun içeriğini görmek: terminalde `npm run lessons`, eklentide
**Menü → Ders havuzu**. İkisi de aynı şeyi gösteriyor — dersin durumu,
belirtileri, gerçek red örnekleri ve denetimde ne işe yaradığı.

## Çıkarımda dikkat edilen iki alan

`excerpt` ve `reviewerText` sürekli karışıyordu — model reviewer cümlesini
alıntı alanına yazıp reviewer alanını boş bırakıyordu.

- `reviewerText` — reviewer'ın kendi cümlesi. **Asla boş kalmaz** (`minLength`).
- `excerpt` — uygulamanın kendi metninden alıntı, red metninde genelde tırnak
  içinde. Yoksa boş kalır.

Ayrıca `guideline` modele bırakılmıyor: `"2.3.3 - Performance - Accurate
Metadata"` gibi bir değer eşleştirmeyi bozardı, regex ile `2.3.3`'e indirgeniyor.
`artifact` da bilinen alan adlarına normalize ediliyor.
