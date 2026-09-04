import type { Submission, RuleCard } from '../types.js'
import type { Lesson } from '../lessons/index.js'
import type { Block } from '../llm/index.js'

export const CHECKER_SYSTEM = `Sen bir mağaza politikası denetçisisin. App Store ve Google Play listing'lerini, sana verilen TEK bir politika kuralına karşı denetliyorsun.

Kurallar:
- SADECE sana verilen kuralı uygula. Başka bir politika ihlali görsen bile raporlama.
- Her bulgu için, içerikten BİREBİR alıntı ver. Alıntıyı yeniden yazma, özetleme, düzeltme — kopyala.
- Emin değilsen bulgu üretme. Bu araç yalancı alarm üretirse kimse kullanmaz.
- Kartın "ihlal olmayan örnek" alanı sınırı belirler. Ona benzeyen bir şey ihlal değildir.
- Pazarlama dili tek başına ihlal değildir. İhlal, kuralın açıkça yasakladığı şeydir.
- İhlal yoksa boş liste döndür. Bu normal ve beklenen bir sonuçtur.
- Yalnızca JSON döndür. Açıklama, önsöz, markdown yok.
- rationale ve suggestedFix EN FAZLA 2 kısa cümle olsun. Tekrar etme, uzatma.`

export const FINDINGS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      // ALAN SIRASI ÖNEMLİ: şema grameri alanları bu sırayla ürettirir.
      // Kritik alanlar önce gelsin ki bir kesilme olursa en değerli kısım elde kalsın.
      //
      // maxLength ZORUNLU: sınırsız bir metin alanında küçük modeller tekrar
      // döngüsüne girip tüm çıktı bütçesini yakıyor ve JSON yarıda kesiliyor.
      // Bu, yerel modelde gözlemlenen 1 numaralı hata.
      items: {
        type: 'object',
        additionalProperties: false,
        // OpenAI katı şema modu properties'teki HER anahtarın required'da
        // olmasını ister; opsiyonellik nullable tiple ifade edilir.
        // Ollama da bu biçimi kabul ediyor — tek şema iki motoru da besliyor.
        required: ['artifact', 'excerpt', 'severity', 'suggestedFix', 'rationale', 'mediaId', 'iapId'],
        properties: {
          artifact: { type: 'string', maxLength: 40, description: 'description | subtitle | keywords | screenshots | iap ...' },
          excerpt: { type: 'string', maxLength: 300, description: 'İçerikten BİREBİR alıntı' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          suggestedFix: { type: 'string', maxLength: 200 },
          rationale: { type: 'string', maxLength: 300, description: 'En fazla 2 cümle' },
          mediaId: { type: ['string', 'null'], maxLength: 60, description: 'artifact=screenshots ise ekran görüntüsü id, değilse null' },
          iapId: { type: ['string', 'null'], maxLength: 80, description: 'artifact=iap ise paket id, değilse null' },
        },
      },
    },
  },
}

export const VERDICT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['violates', 'reason'],
  properties: {
    violates: { type: 'boolean' },
    reason: { type: 'string', maxLength: 200 },
  },
}

/**
 * SABİT ön ek. Her kural çağrısında birebir aynı olmalı — yerelde KV cache,
 * bulutta prompt cache buna dayanır. Buraya değişken hiçbir şey konmaz
 * (timestamp, sıra numarası, rastgele id yok).
 */
export function renderSubmissionText(sub: Submission): string {
  const lines: string[] = [
    `# DENETLENECEK LISTING`,
    `Platform: ${sub.platform}`,
    `Uygulama: ${sub.appName} (${sub.appId})`,
    `Kategori: ${sub.category} | Yaş sınıfı: ${sub.ageRating} | Dil: ${sub.locale}`,
    ``,
    `## Metin alanları`,
  ]
  for (const [k, v] of Object.entries(sub.text)) if (v) lines.push(`### ${k}\n${v}\n`)

  if (sub.iap.length) {
    lines.push(`## Uygulama içi satın alma / abonelikler`)
    for (const i of sub.iap) {
      const trial = i.freeTrial ? ` | ücretsiz deneme: ${i.freeTrial.duration}` : ''
      const dur = i.duration ? ` | dönem: ${i.duration}` : ''
      lines.push(`- id=${i.id} [${i.kind}] "${i.name}" — ${i.price} ${i.currency}${dur}${trial}`)
      if (i.description) lines.push(`  açıklama: ${i.description}`)
    }
    lines.push('')
  }

  lines.push(`## URL'ler`)
  for (const [k, v] of Object.entries(sub.urls)) if (v) lines.push(`- ${k}: ${v}`)
  lines.push('')
  lines.push(`## Review notları`)
  lines.push(sub.reviewNotes.notes ?? '(yok)')
  lines.push(`Demo hesap: ${sub.reviewNotes.demoAccount ? 'var' : 'YOK'}`)

  lines.push(...renderDeclarations(sub))

  return lines.join('\n')
}

/**
 * App Store Connect beyanları — modele BAĞLAM olarak.
 *
 * Neden gerekli: 5.1.1 kartı "açıklamadaki gizlilik iddiası beyanla çelişiyor
 * mu?" diye soruyor ama model beyanı GÖRMÜYORDU. Kart, sorusunu yapısal
 * olarak cevaplayamıyordu.
 *
 * Neden hepsi değil: hükmü KOD veren alanlar (ürün gönderim durumu, cihaz
 * aileleri) buraya girmez — onlar deterministik lint'in işi. Modele de
 * verirsek aynı sorun iki kez raporlanır ve model kodun kesin cevabını
 * "yorumlamaya" başlar.
 *
 * Kişisel veri hiç girmez: iletişim bilgisi zaten varlık olarak tutuluyor.
 *
 * ÇEKİLMEYEN de yazılır. "Bilmiyoruz" ile "yok" aynı şey değil; model
 * bilmediği bir konuda hüküm kurmasın diye açıkça söylüyoruz.
 */
export function renderDeclarations(sub: Submission): string[] {
  const d = sub.declarations
  if (!d) return []
  const out: string[] = ['', `## App Store Connect beyanları`]

  if (d.age) {
    const sinyal = Object.entries(d.age.sinyaller)
      .map(([k, v]) => (v === true ? k : `${k}=${v}`))
      .join(', ')
    out.push(
      `Yaş beyanı (${d.age.kaynak === 'surum' ? 'sürüm bazlı' : 'uygulama bazlı'}): ` +
        (sinyal || 'içerik işareti yok') +
        ` · ${d.age.noneSayisi} alan NONE` +
        (d.age.beyanEdilmemis.length ? ` · ${d.age.beyanEdilmemis.length} alan beyan edilmemiş` : '') +
        (d.age.ustunKilma ? ` · üstün kılma ${d.age.ustunKilma}` : ''),
    )
  } else {
    out.push('Yaş beyanı: ÇEKİLMEDİ — bu konuda hüküm kurma.')
  }

  if (d.privacy) {
    out.push(
      `Gizlilik etiketi: ${d.privacy.satirlar.length} satır` +
        (d.privacy.takip ? ' · KULLANICIYI TAKİP ETTİĞİNİ BEYAN ETMİŞ' : ' · takip beyanı yok') +
        (d.privacy.kimlikleBagli ? ' · veriler kimlikle bağlı' : ''),
    )
  } else {
    out.push('Gizlilik etiketi: ÇEKİLMEDİ — bu konuda hüküm kurma.')
  }

  if (d.icerikHaklari) {
    out.push(
      `Üçüncü taraf içerik: ${
        d.icerikHaklari === 'USES_THIRD_PARTY_CONTENT' ? 'KULLANIYOR beyanı' : 'kullanmıyor beyanı'
      }`,
    )
  }

  if (d.ozelSayfalar?.length) {
    out.push(
      `Özel ürün sayfası: ${d.ozelSayfalar.length} adet (${d.ozelSayfalar.slice(0, 5).map((s) => s.ad).join(', ')})` +
        ' — bu sayfaların metin ve görselleri bu denetime DAHİL DEĞİL.',
    )
  }

  return out
}

/**
 * DEĞİŞKEN son ek — cache sınırından sonra gelen tek şey.
 *
 * Dersler de buraya girer, sabit kısma DEĞİL: derse göre değişiyorlar ve
 * sabit kısma konsalardı her kural çağrısında cache kırılırdı.
 */
export function renderRuleCard(card: RuleCard, lessons: Lesson[] = [], officialText = ''): string {
  return [
    `# UYGULANACAK KURAL`,
    ``,
    `Kural id: ${card.id}`,
    `Kaynak: ${card.source.doc} ${card.source.section}`,
    ``,
    `## Kural`,
    card.ruleText.trim(),
    ``,
    ...renderOfficialText(card, officialText),
    ...renderFacts(card),
    `## Sana sorulan`,
    card.question.trim(),
    ``,
    `## İhlal SAYILAN örnek`,
    card.positiveExample,
    ``,
    `## İhlal SAYILMAYAN örnek`,
    card.negativeExample,
    ``,
    ...renderLessons(lessons),
    ...renderNotViolation(card),
    `Yalnızca yukarıdaki kurala göre değerlendir. İhlal yoksa {"findings": []} döndür.`,
  ].join('\n')
}

/**
 * Apple'ın KENDİ madde metni.
 *
 * Kart, kuralın bizim okumamızdır; bu blok Apple'ın yazdığıdır. İkisi ayrı
 * başlık altında duruyor çünkü çelişirlerse hangisinin kaynak olduğu
 * tartışmasız olmalı — ve kartı yazarken yaptığımız bir yorum hatası, modele
 * Apple'ın cümlesi de gittiği için sessizce geçmesin.
 *
 * ÜST SINIR VAR ama kırpma SESSİZ DEĞİL: 3.1.2 gibi maddeler alt maddeleriyle
 * 20 bin karakteri geçiyor ve çağrı başına o yükü taşımak hem pahalı hem
 * gereksiz. Kırptığımızda bunu yazıyoruz ve tam metnin adresini veriyoruz.
 */
export const OFFICIAL_TEXT_LIMIT = 6000

export function renderOfficialText(card: RuleCard, officialText: string): string[] {
  const metin = officialText.trim()
  if (!metin) return []
  const kirpildi = metin.length > OFFICIAL_TEXT_LIMIT
  return [
    `## Apple'ın kendi metni (${card.source.section})`,
    `(Doğrudan App Review Guidelines'tan. Terimleri bununla yorumla;`,
    ` sana sorulan soru yine aşağıdaki "Sana sorulan" bölümüdür.)`,
    ``,
    kirpildi ? metin.slice(0, OFFICIAL_TEXT_LIMIT) : metin,
    ...(kirpildi ? [``, `[Madde metni burada kırpıldı. Tamamı: ${card.source.url}]`] : []),
    ``,
  ]
}

/**
 * Dersler = bu kuralda GERÇEKTEN yaşanmış red'lerden çıkan kalıplar.
 * Kart politikanın ne dediğini söyler; ders pratikte neyin reddedildiğini.
 * Modele ikisini birlikte veriyoruz.
 */
export function renderLessons(lessons: Lesson[]): string[] {
  if (!lessons.length) return []
  return [
    `## Bu kuralda geçmişte yaşanmış red'ler`,
    `(Gerçek reviewer kararlarından çıkarıldı. Kuralın pratikte nasıl`,
    ` uygulandığını gösterir; kuralın YERİNE GEÇMEZ. Bir ders kuralın`,
    ` kapsamadığı bir şeyi yasaklıyorsa kural kazanır.)`,
    ``,
    ...lessons.flatMap((l) => [
      `- **${l.title}** — ${l.summary}`,
      // Özet "ne olduğunu" söylüyor, belirtiler "neye bakacağını". İkincisi
      // olmadan model dersi okuyor ama uygulayamıyordu.
      ...(l.signals?.length ? [`  Belirtiler: ${l.signals.join(' · ')}`] : []),
      // Kartın negativeExample'ının ders karşılığı. Onsuz ders, benzeyen ama
      // masum listing'lerde de ateşliyor — ve yalancı alarm, dersin
      // getirdiği isabetten daha pahalı.
      ...(l.falsePositive ? [`  SAYILMAZ: ${l.falsePositive}`] : []),
    ]),
    ``,
  ]
}

/** Bilgi kurallarında olguları modele veriyoruz — hatırlamasını beklemiyoruz. */
/**
 * "Bulgu üretme" kapısı — modelin gördüğü SON bloklardan biri.
 *
 * Muafiyet `question` içinde bir yan cümleyken gpt-4o-mini onu atlıyordu
 * (5 uygulamada 10 yalancı alarm, hepsi kartın kendi muafiyetine giren
 * ifadeler). Ayrı başlık + emir kipi + son konum: üçü de zayıf modelde
 * ölçülebilir fark yaratan ucuz müdahaleler.
 */
export function renderNotViolation(card: RuleCard): string[] {
  if (!card.notViolation?.length) return []
  return [
    `## BULGU ÜRETME — bunlar ihlal DEĞİLDİR`,
    `Aşağıdakilerden birine giren bir içerik için bulgu üretme, tereddüt etme:`,
    ...card.notViolation.map((n) => `- ${n}`),
    ``,
  ]
}

export function renderFacts(card: RuleCard): string[] {
  if (!card.facts?.length) return []
  return [`## Bu kuralı uygularken doğru kabul et`, ...card.facts.map((f) => `- ${f}`), ``]
}

/**
 * Modele kaç ekran görüntüsü gider.
 *
 * ESKİ KURAL YANLIŞTI: cihaz sınıfı başına 3. 16 görüntülü bir uygulamada
 * modele 6 tanesi gidiyordu (3 iPhone + 3 iPad) ve `2.3.3-screenshots-reflect-app`
 * kartı ÇOĞUNLUK sorusu soruyor: "ekran görüntülerinin çoğunluğu uygulamayı
 * kullanımda gösteriyor mu?" 8'in 3'üne bakarak çoğunluk hükmü kurulamaz.
 * AI Video tam bu maddeden reddedilmişti — kart, kendi sorusunu yapısal olarak
 * cevaplayamıyordu.
 *
 * YENİ KURAL: en zengin cihaz sınıfının TAMAMI (App Store zaten sınıf başına
 * 10 ile sınırlı), diğer sınıflar gönderilmez. Sebep: iPhone ve iPad
 * görselleri genelde aynı tasarımın kopyası; ikisini de göndermek maliyeti
 * ikiye katlayıp yeni bilgi getirmiyor. Bir sınıfın tamamı ise "çoğunluk"
 * sorusunu cevaplanabilir kılıyor.
 *
 * Modele hangi sınıfı gördüğü ve nelerin gösterilmediği açıkça söyleniyor —
 * göremediği şey hakkında hüküm kurmasın.
 */
const MAX_IMAGES = 10

export type ImageLoader = (path: string) => Promise<{ mime: string; b64: string } | null>

export async function submissionPrefix(
  sub: Submission,
  opts: { withImages: boolean; loadImage?: ImageLoader },
): Promise<Block[]> {
  const blocks: Block[] = [{ type: 'text', text: renderSubmissionText(sub) }]

  // Gönderimde HİÇ görsel yoksa görsel ön eki kurmanın anlamı yok: yükleyici
  // aramak da yok. Bu ayrım olmadan görselsiz bir submission + vision destekli
  // model her zaman hata veriyordu (kart canlılık koşusu bu yüzden patladı) —
  // oysa ortada yüklenecek bir şey yok, gizlenen bir görsel de yok.
  const gorselVar = sub.media.screenshots.length > 0 || !!sub.media.icon

  if (opts.withImages && gorselVar) {
    // Yükleyici ZORUNLU: sessizce görselsiz devam etmek, görsel kartlarının
    // "sorun yok" demesine yol açar — gürültülü hata her zaman daha iyi.
    if (!opts.loadImage) {
      throw new Error('submissionPrefix: withImages true ama görsel yükleyici verilmedi')
    }

    const byClass = new Map<string, typeof sub.media.screenshots>()
    for (const shot of sub.media.screenshots) {
      const key = shot.deviceClass ?? '-'
      byClass.set(key, [...(byClass.get(key) ?? []), shot])
    }
    // Sıralama: önce TELEFON sınıfları, sonra görüntü sayısı.
    //
    // Neden telefon önce: App Store'da kullanıcıların gördüğü asıl küme o, ve
    // Apple'ın red gerekçeleri de telefon ekranlarına atıf yapıyor. iPad'de
    // daha çok görsel olması, denetimin iPad'e bakmasını gerektirmez.
    const isPhone = (k: string) => /phone/i.test(k)
    const ranked = [...byClass.entries()].sort(
      (a, b) => Number(isPhone(b[0])) - Number(isPhone(a[0])) || b[1].length - a[1].length,
    )
    const [mainClass, mainShots] = ranked[0] ?? ['-', []]
    const chosen = mainShots.slice(0, MAX_IMAGES)

    if (chosen.length) {
      const others = ranked.slice(1).map(([k, v]) => `${k}: ${v.length}`)
      blocks.push({
        type: 'text',
        text:
          `[Gösterilen: ${mainClass} cihaz sınıfının ${chosen.length}/${mainShots.length} ekran görüntüsü. ` +
          (others.length
            ? `Gösterilmeyen sınıflar — ${others.join(', ')}. `
            : '') +
          'Hükmünü YALNIZCA gösterilenlere dayandır; gösterilmeyenler hakkında ' +
          'ne olumlu ne olumsuz hüküm kurma. "Çoğunluk" değerlendirmesi ' +
          'gösterilen küme içindir.]',
      })
    }

    for (const shot of chosen) {
      const img = await opts.loadImage(shot.path)
      if (!img) continue
      blocks.push({ type: 'text', text: `[Ekran görüntüsü id=${shot.id} sıra=${shot.order}]` })
      blocks.push({ type: 'image', mime: img.mime, base64: img.b64 })
    }
  }

  return blocks
}
