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

```bash
npm run learn -- rejects/kayit.txt --app Glamio   # ham red metnini işle
npm run lessons                                    # dersleri listele
npm run lessons -- approve <ders-id>               # taslağı aktifleştir
npm run lessons -- retire <ders-id>                # emekliye ayır
```

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

| | Yerel (bugün) | Bulut |
|---|---|---|
| İndeks | `lessons/index.json` | Supabase `lessons`, `reject_cases` |
| Ders gövdesi | `lessons/bodies/{id}.md` | R2 `lessons/{id}.md` |
| Ham reject | `lessons/rejects/{id}.txt` | R2 `rejects/{id}.txt` |

Geçiş: `.env` içinde `GREENLIGHT_STORE=supabase` + anahtarlar. Şema
[sql/lessons.sql](../sql/lessons.sql). Kod değişmez —
[src/lessons/types.ts](../src/lessons/types.ts) arayüzü ikisini de karşılıyor.

Ayrım neden: Supabase'e *"apple/2.3.3 için aktif dersler"* diye sorarsın
(küçük, indeksli); R2'den *seçtiklerini* okursun (büyük, nadiren okunur, ucuz).

## Çıkarımda dikkat edilen iki alan

`excerpt` ve `reviewerText` sürekli karışıyordu — model reviewer cümlesini
alıntı alanına yazıp reviewer alanını boş bırakıyordu.

- `reviewerText` — reviewer'ın kendi cümlesi. **Asla boş kalmaz** (`minLength`).
- `excerpt` — uygulamanın kendi metninden alıntı, red metninde genelde tırnak
  içinde. Yoksa boş kalır.

Ayrıca `guideline` modele bırakılmıyor: `"2.3.3 - Performance - Accurate
Metadata"` gibi bir değer eşleştirmeyi bozardı, regex ile `2.3.3`'e indirgeniyor.
`artifact` da bilinen alan adlarına normalize ediliyor.
