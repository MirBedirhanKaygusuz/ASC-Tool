import { randomUUID } from 'node:crypto'
import type { LlmProvider } from '../llm/index.js'
import type { Lesson, RejectCase, LessonStore } from './types.js'
import type { Platform, RuleCard } from '../types.js'

/**
 * Ham reject metni → ders.
 *
 * İki adım, ikisi de ayrı sebeple ayrı:
 *   1) ÇIKARIM — metinden yapılandırılmış alanlar. Temiz bir görev, model iyi yapar.
 *   2) EŞLEŞTİRME — bu yeni bir ders mi, mevcut dersin örneği mi?
 *      Aday havuzu KOD ile daralır (platform + madde), karar modele bırakılır.
 *      Tüm dersleri modele sormak hem pahalı hem hatalı olurdu.
 *
 * Üretilen her ders `draft` doğar. Onaylanana kadar denetimi etkilemez —
 * hatalı bir çıkarımın sessizce rapor davranışını değiştirmesini engeller.
 */

const EXTRACT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['platform', 'guideline', 'title', 'artifact', 'excerpt', 'reviewerText', 'severity', 'summary'],
  properties: {
    platform: { type: 'string', enum: ['apple', 'google'] },
    guideline: { type: 'string', maxLength: 40, description: 'YALNIZCA madde numarası, ör. "2.3.3". Başlık metnini ekleme.' },
    title: { type: 'string', maxLength: 60, description: 'Red KALIBININ kısa etiketi. 3-6 kelime, bir başlık gibi. ÖRNEK: "Ekran goruntuleri arayuz gostermiyor" / "Paywall EULA baglantisi yok". YASAK: "We noticed that..." gibi reviewer cumlesini kopyalamak.' },
    artifact: { type: 'string', maxLength: 40, description: 'description | screenshots | keywords | iap | reviewNotes | urls | ageRating | icon' },
    // İki alan sürekli karışıyordu: model reviewer cümlesini excerpt'e
    // yazıp reviewerText'i boş bırakıyordu. Ayrımı örnekle netleştiriyoruz.
    excerpt: {
      type: 'string', maxLength: 400,
      description: 'UYGULAMANIN KENDİ metninden alıntı — genelde red metninde tırnak içinde geçer. ÖRNEK: "live 24/7 consultation with certified dermatologists". Reviewer cümlesi DEĞİL. Böyle bir alıntı yoksa boş bırak.',
    },
    reviewerText: {
      type: 'string', minLength: 20, maxLength: 400,
      description: 'REVIEWER ne dedi. ÖRNEK: "Screenshots do not sufficiently reflect the app in use." Bu alan asla boş kalmaz.',
    },
    resolution: { type: 'string', maxLength: 300, description: 'Next Steps bölümünde ne isteniyorsa' },
    appName: { type: 'string', maxLength: 80 },
    rejectedAt: { type: 'string', maxLength: 20, description: 'YYYY-MM-DD, yazmıyorsa boş' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    summary: { type: 'string', maxLength: 300, description: 'Bu red kalıbının 1-2 cümlelik dersi. Gelecekte bunu nasıl yakalarız.' },
  },
}

/**
 * lessonId ZORUNLU ve adaylardan enum.
 *
 * Önceki sürümde opsiyoneldi: model "evet aynı ders" diyor ama id vermiyordu,
 * kod da yeni ders açıyordu. Enum ile model geçersiz bir id ÜRETEMEZ —
 * kısıtlı decode bunu dil bilgisi seviyesinde garanti eder.
 */
function matchSchema(candidateIds: string[]): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['lessonId', 'reason'],
    properties: {
      lessonId: {
        type: 'string',
        enum: [...candidateIds, 'none'],
        description: 'Eşleşen dersin id\'si, ya da yeni kalıpsa "none".',
      },
      reason: { type: 'string', maxLength: 200 },
    },
  }
}

export interface Extracted {
  platform: Platform
  guideline: string
  title: string
  artifact: string
  excerpt: string
  reviewerText: string
  resolution?: string
  appName?: string
  rejectedAt?: string
  severity: 'high' | 'medium' | 'low'
  summary: string
}

export interface IngestResult {
  kind: 'new-lesson' | 'example-added'
  lesson: Lesson
  example: RejectCase
  extracted: Extracted
  /** Ders hiçbir karta bağlanamadıysa: kapsama boşluğu. */
  coverageGap: boolean
  matchReason: string
}

export async function ingestReject(
  llm: LlmProvider,
  store: LessonStore,
  rawText: string,
  cards: RuleCard[],
  opts: { appName?: string } = {},
): Promise<IngestResult> {
  const extracted = await extract(llm, rawText)
  if (opts.appName) extracted.appName = opts.appName

  // Aday havuzunu KOD daraltır: aynı platform + aynı madde.
  const candidates = await store.candidatesFor(extracted.platform, extracted.guideline)
  const match = candidates.length ? await matchLesson(llm, extracted, candidates) : null

  const now = new Date().toISOString()
  const caseId = randomUUID()

  if (match?.lessonId) {
    const lesson = await store.findLesson(match.lessonId)
    if (lesson) {
      const example = buildCase(caseId, lesson.id, extracted, now)
      await store.addExample(example, rawText)
      return {
        kind: 'example-added',
        lesson, example, extracted,
        coverageGap: lesson.ruleId === null,
        matchReason: match.reason,
      }
    }
  }

  // Yeni ders. Karta bağlamayı dene; bağlanamazsa KAPSAMA BOŞLUĞU.
  const ruleId = linkToCard(extracted, cards)
  const existingIds = new Set((await store.allLessons()).map((l) => l.id))
  const lessonId = makeLessonId(extracted, existingIds)
  const lesson: Lesson = {
    id: lessonId,
    ruleId,
    platform: extracted.platform,
    guideline: extracted.guideline,
    title: titleFor(extracted),
    summary: extracted.summary,
    artifact: (extracted.artifact || null) as Lesson['artifact'],
    severity: extracted.severity,
    status: 'draft', // onaya kadar denetimi etkilemez
    bodyKey: `bodies/${lessonId}.md`,
    exampleCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await store.createLesson(lesson, renderBody(lesson, extracted))
  const example = buildCase(caseId, lesson.id, extracted, now)
  await store.addExample(example, rawText)

  return {
    kind: 'new-lesson',
    lesson, example, extracted,
    coverageGap: ruleId === null,
    matchReason: match?.reason ?? 'aynı madde için mevcut ders yok',
  }
}

// ---------------------------------------------------------------------------

async function extract(llm: LlmProvider, rawText: string): Promise<Extracted> {
  const res = await llm.complete({
    system:
      'Sen mağaza red bildirimlerini yapılandıran bir asistansın. Sana ham bir ' +
      'App Store / Google Play red metni verilir; alanları çıkarırsın.\n' +
      'Metinde olmayan bir şeyi UYDURMA — yoksa alanı boş bırak.\n\n' +
      'İKİ ALANI KARIŞTIRMA:\n' +
      '  reviewerText = reviewer\'ın kendi cümlesi (sorunu anlatan)\n' +
      '  excerpt      = uygulamanın kendi metninden alıntı (tırnak içindeki)\n' +
      'Red metninde tırnak içinde bir uygulama metni yoksa excerpt boş kalır; ' +
      'reviewerText ise her zaman doludur.\n' +
      'Yalnızca JSON döndür.',
    prefix: [{ type: 'text', text: `# HAM RED METNİ\n\n${rawText}` }],
    suffix: 'Alanları çıkar.',
    schema: EXTRACT_SCHEMA,
    maxTokens: 1024,
    temperature: 0,
  })
  const j = res.json as Extracted | null
  if (!j?.guideline) {
    throw new Error(`Red metninden alan çıkarılamadı. Ham yanıt: ${res.raw.slice(0, 200)}`)
  }
  // Madde numarasını modele bırakmıyoruz. "2.3.3 - Performance - Accurate
  // Metadata" gibi bir değer eşleştirmeyi bozar: aynı maddenin iki farklı
  // yazımı iki ayrı ders açar ve karta bağlanamaz.
  j.guideline = normalizeGuideline(j.guideline, rawText)
  j.artifact = normalizeArtifact(j.artifact)
  j.title = tidyTitle(j.title)
  return j
}

/**
 * Model "App Description", "Screenshots", "screenshot" gibi serbest yazıyor.
 * Bilinen alan adlarına indirgemezsek ders id'sine boşluk/büyük harf sızar ve
 * aynı alan için birden çok ders açılır.
 */
const ARTIFACT_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/screen ?shot|ekran/i, 'screenshots'],
  [/preview|video/i, 'previewVideo'],
  [/icon|ikon/i, 'icon'],
  [/subtitle|alt ?ba/i, 'subtitle'],
  [/keyword|anahtar/i, 'keywords'],
  [/promo/i, 'promotionalText'],
  [/what.?s ?new|yenilik/i, 'whatsNew'],
  [/short ?desc/i, 'shortDescription'],
  [/desc|açıklama|aciklama/i, 'description'],
  [/in.?app|purchase|subscription|iap|abonelik/i, 'iap'],
  [/review ?note|demo|sign.?in/i, 'reviewNotes'],
  [/url|link|privacy ?policy|support/i, 'urls'],
  [/age|yaş|yas|rating/i, 'ageRating'],
  [/categor|kategori/i, 'category'],
  [/^name$|title|isim/i, 'name'],
]

export function normalizeArtifact(raw: string): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  for (const [re, canonical] of ARTIFACT_ALIASES) if (re.test(v)) return canonical
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/** "2.3.3 - Performance - Accurate Metadata" → "2.3.3" */
export function normalizeGuideline(value: string, rawText: string): string {
  const fromValue = value.match(/\d+(?:\.\d+)*(?:\([a-z]+\))?/i)
  if (fromValue) return fromValue[0]
  // Model alanı boş/bozuk bıraktıysa ham metinden yakala
  const fromRaw = rawText.match(/Guideline\s+(\d+(?:\.\d+)*(?:\([a-z]+\))?)/i)
  return fromRaw?.[1] ?? value.trim()
}

/** Reviewer cümlesi başlık olarak kullanılmaz — kısalt, noktayı at. */
function tidyTitle(t: string): string {
  const first = t.split(/[.\n]/)[0]!.trim()
  const words = first.split(/\s+/)
  return (words.length > 9 ? words.slice(0, 9).join(' ') : first).replace(/[.,;:]$/, '')
}

async function matchLesson(
  llm: LlmProvider,
  e: Extracted,
  candidates: Lesson[],
): Promise<{ lessonId: string | null; reason: string }> {
  const list = candidates
    .map((c) => `- id: ${c.id}\n  başlık: ${c.title}\n  ders: ${c.summary}`)
    .join('\n')

  const res = await llm.complete({
    system:
      'Yeni bir red vakasının, mevcut bir red DERSİNİN başka bir örneği mi ' +
      'yoksa yeni bir kalıp mı olduğuna karar verirsin.\n\n' +
      'ÖLÇÜT: aynı DÜZELTME ikisini de çözer mi?\n' +
      '  Çözer   → aynı ders, o dersin id\'sini döndür.\n' +
      '  Çözmez  → yeni kalıp, "none" döndür.\n\n' +
      'Aynı madde numarasını paylaşmaları hiçbir şey ifade etmez; bir madde ' +
      'altında birbirinden bağımsız birçok kalıp olur.\n' +
      'Emin değilsen "none" de — yeni ders açmak, iki farklı kalıbı ' +
      'birbirine karıştırmaktan iyidir.\n' +
      'Yalnızca JSON döndür.',
    prefix: [{
      type: 'text',
      text:
        `# YENİ VAKA\nMadde: ${e.guideline}\nAlan: ${e.artifact}\n` +
        `Reviewer: ${e.reviewerText}\nAlıntı: ${e.excerpt}\n` +
        `Gereken düzeltme: ${e.resolution ?? '(belirtilmemiş)'}\n\n` +
        `# MEVCUT DERSLER (aynı madde)\n${list}`,
    }],
    suffix: 'Karar ver.',
    schema: matchSchema(candidates.map((c) => c.id)),
    maxTokens: 512,
    temperature: 0,
  })
  const j = res.json as { lessonId?: string; reason?: string } | null
  const id = j?.lessonId
  // Enum'a rağmen savunma: dönen id gerçekten adaylar arasında mı?
  const valid = id && id !== 'none' && candidates.some((c) => c.id === id) ? id : null
  return { lessonId: valid, reason: j?.reason ?? '(gerekçe yok)' }
}

/**
 * Dersi bir karta bağla.
 *
 * Madde numarası tek başına yetmiyor: aynı maddede birden fazla kart olabilir
 * (2.3.3 altında hem "özellik kanıtı" hem "ekran görüntüsü arayüzü" kartı var).
 * O yüzden önce maddeye göre daralt, sonra ARTIFACT'e göre seç.
 */
function linkToCard(e: Extracted, cards: RuleCard[]): string | null {
  const usable = cards.filter(
    (c) => (c.platform === e.platform || c.platform === 'both') && c.outcome !== 'manual',
  )
  const sameSection = usable.filter(
    (c) =>
      c.source.section === e.guideline ||
      e.guideline.startsWith(c.source.section + '.') ||
      c.source.section.startsWith(e.guideline + '.'),
  )
  if (!sameSection.length) return null
  if (sameSection.length === 1) return sameSection[0]!.id

  // Birden fazla aday: kartın baktığı alanlar red'in alanını içeriyor mu?
  const byArtifact = sameSection.filter(
    (c) => e.artifact && (c.needs as readonly string[]).includes(e.artifact),
  )
  if (byArtifact.length) {
    // Yalnızca o alana bakan kart, çok alana bakandan daha isabetli.
    return byArtifact.sort((a, b) => a.needs.length - b.needs.length)[0]!.id
  }
  return sameSection[0]!.id
}

/**
 * Ders id'si KARARLI alanlardan üretilir: platform + madde + alan.
 * Başlıktan üretmek kırılgandı — model başlığı her seferinde farklı yazınca
 * aynı kalıp için farklı id'ler çıkıyordu.
 */
function makeLessonId(e: Extracted, taken: ReadonlySet<string>): string {
  const base = `lesson-${e.platform}-${e.guideline.replace(/[^0-9.a-z()]/gi, '')}-${e.artifact || 'genel'}`
  if (!taken.has(base)) return base
  // Aynı platform+madde+alan için ikinci bir KALIP: sıra numarası ekle.
  for (let n = 2; n < 100; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
  return `${base}-${randomUUID().slice(0, 6)}`
}

/** Reviewer kalıp cümlesi başlık olarak kullanılamaz. */
const REVIEWER_BOILERPLATE =
  /^(we |your app|your screenshots|the app|during (our )?review|upon review|thank you|performance|safety|design|business|legal)\b/i

function titleFor(e: Extracted): string {
  if (e.title && !REVIEWER_BOILERPLATE.test(e.title)) return e.title
  // Model reviewer cümlesini kopyalamış: alandan türet.
  const where = e.artifact || 'listing'
  return `${e.guideline} · ${where}`
}

function buildCase(id: string, lessonId: string, e: Extracted, now: string): RejectCase {
  return {
    id,
    lessonId,
    appName: e.appName ?? '(bilinmiyor)',
    platform: e.platform,
    rejectedAt: e.rejectedAt || null,
    guideline: e.guideline,
    artifact: (e.artifact || null) as RejectCase['artifact'],
    excerpt: e.excerpt ?? '',
    reviewerText: e.reviewerText,
    resolution: e.resolution || null,
    rawKey: `rejects/${id}.txt`,
    status: 'draft',
    createdAt: now,
  }
}

function renderBody(lesson: Lesson, e: Extracted): string {
  return [
    `# ${lesson.title}`,
    ``,
    `- **Ders id:** \`${lesson.id}\``,
    `- **Platform:** ${lesson.platform}`,
    `- **Madde:** ${lesson.guideline}`,
    `- **Bağlı kart:** ${lesson.ruleId ?? '⚠ YOK — kapsama boşluğu'}`,
    `- **Alan:** ${lesson.artifact ?? '(belirsiz)'}`,
    ``,
    `## Ders`,
    e.summary,
    ``,
    `## Reviewer ne dedi`,
    e.reviewerText,
    ``,
    ...(e.resolution ? [`## Neyle geçti`, e.resolution, ``] : []),
    `---`,
    `_Otomatik üretildi, durum: draft. Onaylamak için:_`,
    `\`npm run lessons -- approve ${lesson.id}\``,
  ].join('\n')
}
