import { randomUUID } from 'node:crypto'
import type { LlmProvider } from '../llm/index.js'
import type { Lesson, RejectCase, LessonStore, Extracted } from './types.js'
import type { Platform, RuleCard } from '../types.js'
import { reviewExtraction, reviewMode, type Doubt, type ReviewField, type ReviewMode } from './review.js'
import {
  createEmbedder, ensureVectors, lessonText, nearestLessons, vectorHash,
  type Embedder, type NearMatch,
} from './embed.js'

export type { Extracted } from './types.js'

/**
 * Ham reject metni → ders.
 *
 * DÖRT adım, her biri ayrı sebeple ayrı:
 *   1) ÇIKARIM     — metinden yapılandırılmış alanlar.
 *   2) TEKRAR BAKMA — çıkarımı bedava kontrollerden geçir; şüphe varsa
 *      yalnızca şüpheli alanları modele yeniden sor (review.ts). Uydurma
 *      alıntının derse, oradan rapora sızmasını burası kesiyor.
 *   3) EŞLEŞTİRME  — bu yeni bir ders mi, mevcut dersin örneği mi?
 *      Aday havuzu KOD ile daralır, karar modele bırakılır. Tüm dersleri
 *      modele sormak hem pahalı hem hatalı olurdu.
 *   4) VEKTÖRLEME  — yeni dersin gömmesi yazılır ki BİR SONRAKİ red onu
 *      anlamca bulabilsin.
 *
 * ADAY HAVUZU İKİ KAYNAKTAN:
 *   a) madde numarası birebir eşleşenler — deterministik taban,
 *   b) anlamca yakın olanlar (VOYAGE_API_KEY varsa).
 * (b) olmadan, aynı kalıbı "2.3.3" yerine "2.3.1" diye yazan bir red mevcut
 * derse bağlanamıyor ve kopya ders açıyordu. Anahtar yoksa (a) tek başına
 * çalışır; hiçbir şey bozulmaz.
 *
 * Üretilen her ders `draft` doğar. Onaylanana kadar denetimi etkilemez —
 * hatalı bir çıkarımın sessizce rapor davranışını değiştirmesini engeller.
 */

const EXTRACT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'platform', 'guideline', 'scope', 'title', 'artifact', 'excerpt', 'reviewerText',
    'severity', 'summary', 'signals', 'falsePositive', 'rootCause',
    'resolution', 'appName', 'rejectedAt',
  ],
  properties: {
    platform: { type: 'string', enum: ['apple', 'google'] },
    scope: {
      type: 'string', enum: ['listing', 'in-app'],
      description:
        'Red mağaza KAYDINA mı yoksa uygulamanın DAVRANIŞINA mı bakıyor? ' +
        'listing ÖRNEK: açıklamada olmayan özellik, ekran görüntüsü arayüzü göstermiyor, ' +
        'keyword ihlali, IAP ürün açıklaması. ' +
        'in-app ÖRNEK: ilk açılışta rating istemek, sandbox\'ta çalışmayan satın alma, ' +
        'çöken ekran, hesap silme akışının bulunmaması. ' +
        'Kural: reviewer\'ın gördüğü şey App Store sayfasında mı duruyor (listing), ' +
        'yoksa uygulamayı çalıştırınca mı ortaya çıkıyor (in-app)?',
    },
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
    resolution: { type: ['string', 'null'], maxLength: 300, description: 'Next Steps bölümünde ne isteniyorsa, yoksa null' },
    appName: { type: ['string', 'null'], maxLength: 80, description: 'Metinde geçiyorsa, yoksa null' },
    rejectedAt: { type: ['string', 'null'], maxLength: 20, description: 'YYYY-MM-DD, yazmıyorsa null' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    summary: { type: 'string', maxLength: 300, description: 'Bu red kalıbının 1-2 cümlelik dersi. Gelecekte bunu nasıl yakalarız.' },
    // --- Detay alanları -----------------------------------------------------
    // Özet "ne olduğunu" söylüyor; denetleyen modele asıl gereken "neye
    // bakayım" ve "ne zaman bakmayayım". Özeti uzatmak yerine ayrı alanlar:
    // prompt'a madde madde girerler ve gömme metnini de bunlar besler.
    signals: {
      type: 'array', maxItems: 4,
      items: { type: 'string', maxLength: 160 },
      description:
        'Bu kalıbı BAŞKA bir uygulamanın listing\'inde yakalayacak somut belirtiler. ' +
        'ÖRNEK: "aciklamada \'certified doctors\' gibi insan uzman iddiasi var" / ' +
        '"ekran goruntuleri pazarlama gorseli, uygulama arayuzu yok". ' +
        'Bu uygulamaya ozel ad, fiyat, tarih YAZMA — kalibi yaz.',
    },
    falsePositive: {
      type: ['string', 'null'], maxLength: 200,
      description:
        'Benzeyip de ihlal SAYILMAYAN durum. ÖRNEK: "iddia ekran goruntusunde ' +
        'gorunuyorsa sorun yok". Emin degilsen null.',
    },
    rootCause: {
      type: ['string', 'null'], maxLength: 200,
      description: 'Bu red NEDEN oldu — altta yatan sebep. Gövdeye yazılır, denetime girmez.',
    },
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

export interface IngestResult {
  kind: 'new-lesson' | 'example-added'
  lesson: Lesson
  example: RejectCase
  extracted: Extracted
  /** Ders hiçbir karta bağlanamadıysa: kapsama boşluğu. */
  coverageGap: boolean
  matchReason: string
  /** İkinci turun ne yaptığı — sessiz kalmasın, denetlenebilir olsun. */
  review: {
    doubts: Doubt[]
    reviewed: boolean
    changed: ReviewField[]
    /** Ham metinde bulunamadığı için silinen uydurma alıntı. */
    droppedExcerpt: string | null
  }
  /** Aday havuzu nereden geldi. Anlamsal arama kapalıysa embedder=false. */
  matching: {
    embedder: string | false
    exact: number
    /** Yalnızca anlamsal olarak bulunan adaylar ve skorları. */
    near: Array<{ id: string; guideline: string; score: number }>
  }
}

export async function ingestReject(
  llm: LlmProvider,
  store: LessonStore,
  rawText: string,
  cards: RuleCard[],
  opts: { appName?: string; embedder?: Embedder | null; reviewMode?: ReviewMode } = {},
): Promise<IngestResult> {
  const ilk = await extract(llm, rawText)
  if (opts.appName) ilk.appName = opts.appName

  // --- 2. TEKRAR BAKMA ------------------------------------------------------
  // Şüphe yoksa hiç çağrı yapılmaz; maliyeti tetikleyen şey ilk çıkarımın
  // kendi zayıflığı oluyor. `extracted` bundan sonra düzeltilmiş hâldir.
  const review = await reviewExtraction(llm, ilk, rawText, opts.reviewMode ?? reviewMode())
  const extracted = review.extracted
  const reviewOut = {
    doubts: review.doubts,
    reviewed: review.reviewed,
    changed: review.changed,
    droppedExcerpt: review.droppedExcerpt,
  }

  // --- 3. ADAY HAVUZU: numara eşleşmesi + anlamsal yakınlık -----------------
  const embedder = opts.embedder !== undefined ? opts.embedder : createEmbedder()
  const exact = await store.candidatesFor(extracted.platform, extracted.guideline)
  const exactIds = new Set(exact.map((c) => c.id))
  const near = await yakinAdaylar(store, embedder, extracted, exactIds)

  const candidates = [...exact, ...near.map((n) => n.lesson)]
  const skorlar = new Map(near.map((n) => [n.lesson.id, n.score]))
  const match = candidates.length
    ? await matchLesson(llm, extracted, candidates, skorlar)
    : null

  const matching = {
    embedder: embedder ? `${embedder.name}/${embedder.model}` : (false as const),
    exact: exact.length,
    near: near.map((n) => ({ id: n.lesson.id, guideline: n.lesson.guideline, score: n.score })),
  }

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
        coverageGap: lesson.ruleId === null && lesson.scope !== 'in-app',
        matchReason: match.reason,
        review: reviewOut,
        matching,
      }
    }
  }

  // Yeni ders. Karta bağlamayı dene; bağlanamazsa KAPSAMA BOŞLUĞU.
  // in-app red'lerde kart aramıyoruz: listing denetiminin yakalayabileceği
  // bir şey değil, dolayısıyla kartsızlığı da bir eksiklik değil.
  const ruleId = extracted.scope === 'in-app' ? null : linkToCard(extracted, cards)
  const existingIds = new Set((await store.allLessons()).map((l) => l.id))
  const lessonId = makeLessonId(extracted, existingIds)
  const lesson: Lesson = {
    id: lessonId,
    ruleId,
    platform: extracted.platform,
    guideline: extracted.guideline,
    scope: extracted.scope,
    title: titleFor(extracted),
    summary: extracted.summary,
    signals: extracted.signals ?? [],
    falsePositive: extracted.falsePositive ?? null,
    artifact: (extracted.artifact || null) as Lesson['artifact'],
    severity: extracted.severity,
    status: 'draft', // onaya kadar denetimi etkilemez
    bodyKey: `bodies/${lessonId}.md`,
    exampleCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await store.createLesson(lesson, renderBody(lesson, extracted, reviewOut))
  const example = buildCase(caseId, lesson.id, extracted, now)
  await store.addExample(example, rawText)

  // Yeni dersin vektörü HEMEN yazılıyor: yazılmazsa bir sonraki red bu dersi
  // anlamca bulamaz ve aynı kalıp için ikinci bir kopya açılır — tam olarak
  // önlemeye çalıştığımız şey. Gömme patlarsa ders yine de kaydedilmiş olur;
  // eksik vektör bir sonraki koşuda `ensureVectors` ile kendini toparlar.
  if (embedder) {
    try {
      const text = lessonText(lesson)
      await store.writeVectors([{
        lessonId: lesson.id,
        model: embedder.model,
        dim: embedder.dim,
        hash: vectorHash(text, embedder.model, embedder.dim),
        vec: (await embedder.embed([text], 'document'))[0]!,
      }])
    } catch {
      // Sessiz geçmiyoruz: matching.embedder dolu ama vektör yok durumunu
      // `lessons -- reindex` kapatır. Ders kaydı bundan etkilenmemeli.
    }
  }

  return {
    kind: 'new-lesson',
    lesson, example, extracted,
    coverageGap: ruleId === null && extracted.scope === 'listing',
    matchReason: match?.reason ?? 'benzer mevcut ders yok',
    review: reviewOut,
    matching,
  }
}

/**
 * Anlamca yakın dersler — numara eşleşmesinin KAÇIRDIKLARI.
 *
 * Gömme kapalıysa veya ağ patlarsa boş döner: eşleştirme numara tabanına
 * geriler, ingest DURMAZ. Bir red metnini işleyememek, kopya ders açmaktan
 * daha kötü.
 */
async function yakinAdaylar(
  store: LessonStore,
  embedder: Embedder | null,
  e: Extracted,
  exclude: ReadonlySet<string>,
): Promise<NearMatch[]> {
  if (!embedder) return []
  try {
    return await nearestLessons(store, embedder, sorguMetni(e), {
      platform: e.platform,
      exclude,
      topK: Number(process.env.LESSON_MATCH_TOPK ?? 5),
      minScore: Number(process.env.LESSON_MATCH_MIN ?? 0.55),
    })
  } catch {
    return []
  }
}

/**
 * Yeni vakanın sorgu metni — dersin gömme metniyle SİMETRİK.
 *
 * Aynı alanlar, aynı sıra: `lessonText` ders tarafında ne veriyorsa burada
 * vakanın karşılığı veriliyor. Asimetrik olsaydı skorlar sistematik olarak
 * düşer ve eşiği elle aşağı çekmek zorunda kalırdık.
 */
function sorguMetni(e: Extracted): string {
  return [
    e.title,
    e.artifact ? `Alan: ${e.artifact}` : '',
    e.summary,
    ...(e.signals ?? []),
  ].filter(Boolean).join('\n')
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
      'reviewerText ise her zaman doludur.\n\n' +
      'SCOPE en kritik alan: reviewer\'ın şikayet ettiği şey App Store sayfasında ' +
      'duruyorsa listing, ancak uygulamayı çalıştırınca görünüyorsa in-app.\n\n' +
      'SIGNALS ve SUMMARY bu uygulamaya değil KALIBA ait: başka bir uygulamada ' +
      'aynı hatayı yakalayacak biçimde yaz. Uygulama adı, ürün adı, fiyat gibi ' +
      'tekil ayrıntılar girmesin — o ayrıntılar excerpt alanında zaten duruyor.\n' +
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
  if (j.scope !== 'in-app') j.scope = 'listing'
  j.artifact = normalizeArtifact(j.artifact)
  j.title = tidyTitle(j.title)
  // Şema `signals`ı zorunlu kılıyor ama katı json_schema desteklemeyen uçlarda
  // alan hiç gelmeyebiliyor. `undefined` bir dizi, ilerideki her `.join`i
  // patlatır — burada bir kez normalleştirip bir daha düşünmüyoruz.
  j.signals = Array.isArray(j.signals) ? j.signals.map((x) => String(x).trim()).filter(Boolean) : []
  j.falsePositive = j.falsePositive?.trim() || null
  j.rootCause = j.rootCause?.trim() || null
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
  /** Anlamsal skorlar. Yalnızca gömme ile bulunan adaylarda dolu. */
  skorlar: ReadonlyMap<string, number> = new Map(),
): Promise<{ lessonId: string | null; reason: string }> {
  const list = candidates
    .map((c) => {
      const skor = skorlar.get(c.id)
      // Nereden geldiğini modele SÖYLÜYORUZ. Söylemezsek farklı maddeden
      // gelen bir adayı "madde tutuyor" sanıp gereksiz güvenle eşleştirir.
      const kaynak = skor === undefined
        ? 'madde birebir aynı'
        : `anlamca yakın (skor ${skor.toFixed(2)}), madde FARKLI olabilir`
      return [
        `- id: ${c.id}`,
        `  madde: ${c.guideline} · alan: ${c.artifact ?? '—'} · ${kaynak}`,
        `  başlık: ${c.title}`,
        `  ders: ${c.summary}`,
        ...(c.signals?.length ? [`  belirtiler: ${c.signals.join(' · ')}`] : []),
      ].join('\n')
    })
    .join('\n')

  const res = await llm.complete({
    system:
      'Yeni bir red vakasının, mevcut bir red DERSİNİN başka bir örneği mi ' +
      'yoksa yeni bir kalıp mı olduğuna karar verirsin.\n\n' +
      'ÖLÇÜT: aynı DÜZELTME ikisini de çözer mi?\n' +
      '  Çözer   → aynı ders, o dersin id\'sini döndür.\n' +
      '  Çözmez  → yeni kalıp, "none" döndür.\n\n' +
      'MADDE NUMARASI DELİL DEĞİL — iki yönde de:\n' +
      '  Aynı numarayı paylaşmaları eşleştiğini göstermez; bir madde altında ' +
      'birbirinden bağımsız birçok kalıp olur.\n' +
      '  Farklı numarada olmaları da eşleşmediğini göstermez; aynı hata ' +
      'reviewer\'a göre farklı maddeden yazılabiliyor. Zaten bu yüzden ' +
      'anlamca yakın adaylar da listeye giriyor.\n' +
      'Bakacağın tek şey DÜZELTMENİN aynı olup olmadığı.\n\n' +
      'Anlamsal skor bir ipucudur, karar değil: yüksek skor konunun yakın ' +
      'olduğunu söyler, aynı düzeltmeyi gerektirdiğini söylemez.\n' +
      'Emin değilsen "none" de — yeni ders açmak, iki farklı kalıbı ' +
      'birbirine karıştırmaktan iyidir.\n' +
      'Yalnızca JSON döndür.',
    prefix: [{
      type: 'text',
      text:
        `# YENİ VAKA\nMadde: ${e.guideline}\nAlan: ${e.artifact}\n` +
        `Reviewer: ${e.reviewerText}\nAlıntı: ${e.excerpt}\n` +
        `Ders: ${e.summary}\n` +
        (e.signals?.length ? `Belirtiler: ${e.signals.join(' · ')}\n` : '') +
        `Gereken düzeltme: ${e.resolution ?? '(belirtilmemiş)'}\n\n` +
        `# MEVCUT DERSLER (aday)\n${list}`,
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

/**
 * Ders gövdesi — İNSANIN okuduğu tam anlatım.
 *
 * Prompt'a giren şey bu değil (o `summary` + `signals`). Buraya çıkarımın
 * tamamı yazılıyor: kök sebep, ham alıntı, ikinci turun ne değiştirdiği.
 * Bir dersi onaylayıp onaylamayacağına bakan kişinin, kararı vermek için
 * ham reject dosyasını açmak zorunda kalmaması gerekiyor.
 */
function renderBody(lesson: Lesson, e: Extracted, review?: IngestResult['review']): string {
  return [
    `# ${lesson.title}`,
    ``,
    `- **Ders id:** \`${lesson.id}\``,
    `- **Platform:** ${lesson.platform}`,
    `- **Madde:** ${lesson.guideline}`,
    `- **Kapsam:** ${lesson.scope === 'in-app' ? 'in-app — listing denetimi göremez, elle kontrol' : 'listing'}`,
    `- **Bağlı kart:** ${lesson.ruleId ?? (lesson.scope === 'in-app' ? '— (in-app, kart aranmaz)' : '⚠ YOK — kapsama boşluğu')}`,
    `- **Alan:** ${lesson.artifact ?? '(belirsiz)'}`,
    `- **Ağırlık:** ${lesson.severity}`,
    ``,
    `## Ders`,
    e.summary,
    ``,
    ...(e.signals?.length
      ? [`## Neye bakılacak`, ...e.signals.map((sg) => `- ${sg}`), ``]
      : []),
    ...(e.falsePositive
      ? [`## Ne zaman SAYILMAZ`, e.falsePositive, ``]
      : []),
    ...(e.rootCause ? [`## Kök sebep`, e.rootCause, ``] : []),
    `## Reviewer ne dedi`,
    e.reviewerText,
    ``,
    ...(e.excerpt ? [`## Reddedilen metin`, `> ${e.excerpt}`, ``] : []),
    ...(e.resolution ? [`## Apple ne istedi (Next Steps)`, e.resolution, ``] : []),
    ...renderReviewNote(review),
    `---`,
    `_Otomatik üretildi, durum: draft. Onaylamak için:_`,
    `\`npm run lessons -- approve ${lesson.id}\``,
  ].join('\n')
}

/**
 * İkinci turun izi.
 *
 * Onaylayan kişi "bu alanı model mi düzeltti" sorusunu sorabilmeli. Sessizce
 * düzeltilen bir alan, hiç düzeltilmemiş kadar denetlenemez olurdu.
 */
function renderReviewNote(review?: IngestResult['review']): string[] {
  if (!review || (!review.doubts.length && !review.droppedExcerpt)) return []
  return [
    `## Çıkarım denetimi`,
    ...review.doubts.map((d) => `- şüphe · **${d.field}** — ${d.reason}`),
    ...(review.changed.length
      ? [`- ikinci tur şu alanları değiştirdi: ${review.changed.join(', ')}`]
      : review.reviewed
        ? [`- ikinci tur koştu, değişiklik yapmadı`]
        : [`- ikinci tur koşmadı (LESSON_REVIEW=off)`]),
    ...(review.droppedExcerpt
      ? [`- ⚠ alıntı SİLİNDİ (ham metinde bulunamadı): \`${review.droppedExcerpt.slice(0, 120)}\``]
      : []),
    ``,
  ]
}
