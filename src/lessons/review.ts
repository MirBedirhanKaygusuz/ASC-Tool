import type { LlmProvider } from '../llm/index.js'
import type { Extracted } from './types.js'

/**
 * Çıkarımın İKİNCİ TURU — "tekrar bakma".
 *
 * Denetim boru hattındaki desenin aynısı, aynı sebeple:
 *   ground.ts  → alıntı gerçekten metinde var mı? Bedava, LLM yok.
 *   verify.ts  → şüpheli kalanı ikinci göz okur.
 *
 * Çıkarım tarafında bu hiç yoktu ve maliyeti sessizdi: model reviewer'ın
 * cümlesini `excerpt`e yazdığında, o uydurma alıntı DERSE giriyor, oradan
 * rapora "örnek reject" diye basılıyordu. Kullanıcı Apple'ın yazdığını
 * sandığı bir cümleyi okuyordu.
 *
 * VERİMLİLİK: ikinci tur HER ZAMAN koşmaz. Önce bedava kontroller şüphe
 * üretir; şüphe yoksa çağrı da yok. Şüphe varsa modele yalnızca ŞÜPHELİ
 * ALANLAR sorulur — tam bir yeniden çıkarım değil. Tipik temiz bir red
 * metninde ek maliyet sıfırdır.
 */

export type ReviewMode = 'auto' | 'always' | 'off'

export function reviewMode(): ReviewMode {
  const v = (process.env.LESSON_REVIEW ?? 'auto').toLowerCase()
  return v === 'always' || v === 'off' ? v : 'auto'
}

/** İncelenebilir alanlar. Şema bunlardan dinamik kuruluyor. */
const REVIEWABLE = [
  'guideline', 'scope', 'artifact', 'excerpt', 'reviewerText',
  'summary', 'signals', 'falsePositive', 'severity',
] as const

export type ReviewField = (typeof REVIEWABLE)[number]

export interface Doubt {
  field: ReviewField
  reason: string
}

/**
 * Bedava kontroller. Hiçbiri alanı DEĞİŞTİRMEZ — yalnızca şüphe üretir.
 *
 * Ayrım kasıtlı: heuristik soruyu sorar, kararı ham metni gören model verir.
 * Heuristiğin kendi başına düzeltme yapması, sessizce yanlış düzeltmesi
 * demekti.
 */
export function groundExtraction(e: Extracted, rawText: string): Doubt[] {
  const doubts: Doubt[] = []
  const ham = norm(rawText)

  // 1. Uydurma alıntı — en pahalı hata, en ucuz kontrol.
  if (e.excerpt?.trim() && !ham.includes(norm(e.excerpt))) {
    doubts.push({
      field: 'excerpt',
      reason: 'excerpt ham metinde birebir geçmiyor — uydurulmuş ya da reviewer cümlesi olabilir',
    })
  }

  // 2. Reviewer cümlesi paraphrase edilebilir; birebir arama fazla katı olur.
  //    Kelime örtüşmesi düşükse metinden gelmiyor demektir.
  if (overlap(e.reviewerText, rawText) < 0.6) {
    doubts.push({
      field: 'reviewerText',
      reason: 'reviewerText ham metinle yeterince örtüşmüyor',
    })
  }

  // 3. Madde numarası metinde hiç geçmiyorsa `normalizeGuideline` tahmin
  //    yürütmüş olabilir. Yanlış numara dersi yanlış karta bağlar.
  if (e.guideline && !new RegExp(`\\b${escapeRe(e.guideline)}`).test(rawText)) {
    doubts.push({ field: 'guideline', reason: `"${e.guideline}" ham metinde geçmiyor` })
  }

  // 4. Belirtisiz ders, denetleyen modele "neye bakayım"ı söylemiyor.
  if (!e.signals?.length) {
    doubts.push({ field: 'signals', reason: 'hiç belirti çıkarılmamış' })
  }

  // 5. Özet reviewer cümlesinin kopyasıysa ders GENELLEŞMEMİŞ demektir:
  //    bir sonraki uygulamada işe yaramaz.
  if (overlap(e.summary, e.reviewerText) > 0.8) {
    doubts.push({
      field: 'summary',
      reason: 'özet reviewer cümlesinin kopyası — kalıba genellenmemiş',
    })
  }

  if (!e.artifact?.trim()) {
    doubts.push({ field: 'artifact', reason: 'alan belirlenmemiş' })
  }

  // 6. SCOPE'un bedava kontrolü yok ama en pahalı alan: in-app işaretlenen
  //    ders prompt'a HİÇ girmez, elle kontrol listesine düşer. Yanlışsa
  //    denetim o kalıbı bir daha asla yakalamaz. İşaretler ters yöne
  //    bakıyorsa soruyu sordurmaya değer.
  const listingVar = LISTING_MARKERS.test(rawText)
  const inAppVar = IN_APP_MARKERS.test(rawText)
  if (e.scope === 'listing' && inAppVar && !listingVar) {
    doubts.push({ field: 'scope', reason: 'metin uygulama içi davranıştan söz ediyor, listing işareti yok' })
  } else if (e.scope === 'in-app' && listingVar && !inAppVar) {
    doubts.push({ field: 'scope', reason: 'metin mağaza kaydından söz ediyor, uygulama içi işaret yok' })
  }

  return doubts
}

const LISTING_MARKERS =
  /screenshot|app description|app name|subtitle|keyword|promotional text|metadata|preview (image|video)|product page|app store page|privacy policy url|support url/i

const IN_APP_MARKERS =
  /\bcrash|\bbug\b|sandbox|blank screen|did not load|unable to (complete|sign|log|access)|when we (tapped|selected|launched|opened)|upon launch|force.?(quit|close)|account deletion|freez/i

/**
 * Şema YALNIZCA şüpheli alanları içerir.
 *
 * Tam yeniden çıkarım daha kolay yazılırdı ama iki bedeli var: modelin doğru
 * bulduğu alanları da yeniden üretmesi (bozma riski) ve gereksiz token. Dar
 * şema, `matchSchema`daki kısıtlı decode fikrinin aynısı — model kapsam
 * dışına ÇIKAMAZ.
 */
function reviewSchema(fields: ReviewField[]): Record<string, unknown> {
  const all: Record<ReviewField, unknown> = {
    guideline: { type: 'string', maxLength: 40, description: 'YALNIZCA madde numarası, ör. "2.3.3".' },
    scope: { type: 'string', enum: ['listing', 'in-app'] },
    artifact: { type: 'string', maxLength: 40, description: 'description | screenshots | keywords | iap | reviewNotes | urls | ageRating | icon' },
    excerpt: {
      type: 'string', maxLength: 400,
      description: 'UYGULAMANIN kendi metninden BİREBİR alıntı. Ham metinde tırnak içinde yoksa BOŞ STRING döndür — uydurma.',
    },
    reviewerText: { type: 'string', maxLength: 400, description: 'Reviewer ne dedi — ham metinden.' },
    summary: { type: 'string', maxLength: 300, description: 'Kalıbın 1-2 cümlelik dersi. Bu uygulamaya özel değil, GENEL olsun.' },
    signals: {
      type: 'array', maxItems: 4,
      items: { type: 'string', maxLength: 160 },
      description: 'Bu kalıbı BAŞKA bir listing\'de yakalayacak somut belirtiler.',
    },
    falsePositive: { type: ['string', 'null'], maxLength: 200, description: 'Benzeyip de ihlal SAYILMAYAN durum, yoksa null' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
  }
  const properties: Record<string, unknown> = { degisenler: { type: 'array', items: { type: 'string' }, maxItems: 12 } }
  for (const f of fields) properties[f] = all[f]
  return {
    type: 'object',
    additionalProperties: false,
    required: [...fields, 'degisenler'],
    properties,
  }
}

export interface ReviewResult {
  extracted: Extracted
  doubts: Doubt[]
  /** İkinci tur gerçekten koştu mu? */
  reviewed: boolean
  /** Değişen alan adları. Boşsa model ilk çıkarımı onaylamış. */
  changed: ReviewField[]
  /** Ham metinde bulunamadığı için TEMİZLENEN alıntı. Sessiz kalmasın. */
  droppedExcerpt: string | null
}

/**
 * Çıkarımı tekrar gözden geçir.
 *
 * `auto` (varsayılan) → yalnızca şüphe varsa çağrı.
 * `always`            → şüphe olmasa da çekirdek alanları gözden geçir.
 * `off`               → çağrı yok; bedava kontroller yine koşar ve uydurma
 *                       alıntı yine temizlenir.
 */
export async function reviewExtraction(
  llm: LlmProvider,
  e: Extracted,
  rawText: string,
  mode: ReviewMode = reviewMode(),
): Promise<ReviewResult> {
  const doubts = groundExtraction(e, rawText)
  const out: Extracted = { ...e }
  const changed: ReviewField[] = []
  let reviewed = false

  // `always` modunda şüphe yoksa bile en kırılgan alanları sorarız: scope
  // yanlışsa ders prompt'a hiç girmez, özet genellenmemişse hiç işe yaramaz.
  const fields = uniq(
    mode === 'always'
      ? [...doubts.map((d) => d.field), 'scope' as const, 'summary' as const, 'signals' as const]
      : doubts.map((d) => d.field),
  )

  if (mode !== 'off' && fields.length) {
    reviewed = true
    const duzeltme = await askReview(llm, e, rawText, fields, doubts)
    for (const f of fields) {
      if (uygula(out, f, duzeltme[f])) changed.push(f)
    }
  }

  // İkinci turdan sonra ALIŞTIYI YENİDEN DOĞRULA. Model "düzelttim" deyip
  // yine uydurabilir; o zaman alanı boşaltıyoruz. Uydurma bir alıntının
  // rapora "örnek reject" diye basılması, alıntısız bir dersten kötüdür.
  let droppedExcerpt: string | null = null
  if (out.excerpt?.trim() && !norm(rawText).includes(norm(out.excerpt))) {
    droppedExcerpt = out.excerpt
    out.excerpt = ''
  }

  return { extracted: out, doubts, reviewed, changed, droppedExcerpt }
}

async function askReview(
  llm: LlmProvider,
  e: Extracted,
  rawText: string,
  fields: ReviewField[],
  doubts: Doubt[],
): Promise<Record<string, unknown>> {
  const supheler = doubts.length
    ? doubts.map((d) => `- ${d.field}: ${d.reason}`).join('\n')
    : '- (otomatik kontroller şüphe bulmadı; yine de gözden geçir)'

  const res = await llm.complete({
    system:
      'Bir red metninden yapılmış çıkarımı DENETLERSİN. Önünde ham metin, ilk ' +
      'çıkarım ve otomatik kontrollerin işaretlediği şüpheler var.\n\n' +
      'KURALLAR:\n' +
      '- Ham metinde KARŞILIĞI OLMAYAN hiçbir şey yazma. Alıntı bulamıyorsan ' +
      'boş string döndür; uydurmak en ağır hatadır.\n' +
      '- İlk çıkarım doğruysa AYNI değeri döndür. Değiştirmek için değiştirme.\n' +
      '- summary ve signals BU uygulamaya değil, KALIBA ait olmalı: başka bir ' +
      'uygulamada aynı hatayı yakalayacak biçimde yaz. Uygulama adı, ürün adı ' +
      've fiyat gibi tekil ayrıntılar girmesin.\n' +
      '- scope: reviewer\'ın şikayet ettiği şey App Store sayfasında duruyorsa ' +
      'listing, ancak uygulamayı çalıştırınca görünüyorsa in-app.\n' +
      '- degisenler: gerçekten değiştirdiğin alanların adları.\n' +
      'Yalnızca JSON döndür.',
    prefix: [{ type: 'text', text: `# HAM RED METNİ\n\n${rawText}` }],
    suffix:
      `# İLK ÇIKARIM\n${JSON.stringify(pick(e, fields), null, 2)}\n\n` +
      `# ŞÜPHELER\n${supheler}\n\n` +
      `Yalnızca şu alanları döndür: ${fields.join(', ')}`,
    schema: reviewSchema(fields),
    maxTokens: 900,
    temperature: 0,
  })

  return (res.json as Record<string, unknown> | null) ?? {}
}

// --- yardımcılar -----------------------------------------------------------

function pick(e: Extracted, fields: ReviewField[]): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  for (const f of fields) o[f] = e[f]
  return o
}

/**
 * Düzeltmeyi TEK alana uygula. Değişiklik olduysa true.
 *
 * Tek tek yazılmış olması gereksiz görünüyor ama iki iş yapıyor: derleyici
 * `Extracted`in şeklini koruyor VE modelin döndürdüğü tipi doğruluyoruz.
 * Toplu bir `Object.assign` ile şema dışı bir değer (ör. scope yerine
 * "unknown" string'i) sessizce derse girerdi — kısıtlı decode'un uçtaki
 * karşılığı yoksa doğrulama bize kalıyor.
 */
function uygula(out: Extracted, field: ReviewField, v: unknown): boolean {
  const metin = typeof v === 'string' ? v.trim() : null

  switch (field) {
    case 'guideline':
      if (!metin || metin === out.guideline) return false
      out.guideline = metin
      return true
    case 'scope':
      if ((v !== 'listing' && v !== 'in-app') || v === out.scope) return false
      out.scope = v
      return true
    case 'severity':
      if ((v !== 'high' && v !== 'medium' && v !== 'low') || v === out.severity) return false
      out.severity = v
      return true
    case 'artifact':
      if (!metin || metin === out.artifact) return false
      out.artifact = metin
      return true
    case 'excerpt':
      // Boş string GEÇERLİ bir düzeltme: "alıntı yok" demenin yolu bu.
      if (typeof v !== 'string' || v.trim() === out.excerpt.trim()) return false
      out.excerpt = v.trim()
      return true
    case 'reviewerText':
      if (!metin || metin === out.reviewerText) return false
      out.reviewerText = metin
      return true
    case 'summary':
      if (!metin || metin === out.summary) return false
      out.summary = metin
      return true
    case 'falsePositive':
      // null GEÇERLİ: "benzeyen masum durum aklıma gelmiyor".
      if (v !== null && !metin) return false
      if ((metin ?? null) === out.falsePositive) return false
      out.falsePositive = metin ?? null
      return true
    case 'signals': {
      if (!Array.isArray(v)) return false
      const temiz = v.map((x) => String(x).trim()).filter(Boolean)
      if (!temiz.length || JSON.stringify(temiz) === JSON.stringify(out.signals)) return false
      out.signals = temiz
      return true
    }
  }
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)]
}

/** ground.ts'teki norm ile aynı — tırnak ve boşluk farkını tolere et. */
function norm(s: string): string {
  return (s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * `a`nın kelimelerinin ne kadarı `b`de geçiyor? 0-1.
 *
 * Birebir arama paraphrase'i eler, hiç aramamak uydurmayı kaçırır. Kelime
 * örtüşmesi ikisinin arası: model cümleyi kısaltabilir, ama kelimeleri
 * metinden gelmek zorunda.
 */
export function overlap(a: string, b: string): number {
  const kelimeler = norm(a).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3)
  if (!kelimeler.length) return 0
  const hedef = new Set(norm(b).split(/[^\p{L}\p{N}]+/u))
  return kelimeler.filter((w) => hedef.has(w)).length / kelimeler.length
}
