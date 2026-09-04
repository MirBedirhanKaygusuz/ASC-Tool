import type { Submission, SubmissionText, RuleCard, Finding, ArtifactKind, Locator } from '../types.js'
import type { LlmProvider } from '../llm/index.js'
import { CHECKER_SYSTEM, FINDINGS_SCHEMA, submissionPrefix, renderRuleCard, type ImageLoader } from './prompt.js'
import type { Lesson } from '../lessons/index.js'

export interface CheckStats {
  rulesRun: number
  /** Yanıtı yarıda kesilen çağrı sayısı — bulgu sessizce kaybolur, uyar. */
  truncated: number
  /** Görsel gerektirdiği halde görsel olmadığı için ÇALIŞTIRILMAYAN kartlar. */
  skippedNoVision: string[]
  /** Çağrısı patlayan kartlar. Rapora "DENETLENMEDİ" diye girer, sessiz kalmaz. */
  basarisiz: Array<{ id: string; sebep: string }>
  /** Modele giden görsel / listingdeki toplam. Eşit değilse rapor uyarır. */
  imagesUsed: number
  imagesTotal: number
  /** JSON parse edilemeyen çağrı sayısı. */
  unparsable: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  ms: number
  /** İlk çağrı prefill'i içerir; sonrakiler cache'ten okur. Farkı görmek için. */
  firstCallMs: number
  avgCallMs: number
}

/**
 * Denetim turu.
 *
 * İş birimi KURAL. Her kural için ayrı çağrı: modele 30 kuralı birden vermek
 * dikkatini dağıtır ve recall'u düşürür.
 *
 * Çağrılar SIRALI gider (provider.concurrency yerelde 1). Sezgiye aykırı ama
 * doğru: paralel istek hem tek GPU'yu böler hem prefix KV cache'ini kırar.
 * Sabit prefix sayesinde 2. çağrıdan itibaren submission yeniden prefill
 * edilmez — asıl hızlanma oradan gelir.
 */
export async function runCheck(
  llm: LlmProvider,
  sub: Submission,
  rules: RuleCard[],
  /** Kural id'sine göre gruplanmış aktif dersler. Kart yoksa boş geçilir. */
  lessonsByRule: Map<string, Lesson[]> = new Map(),
  onProgress?: (done: number, total: number, ruleId: string, ms: number) => void,
  /**
   * Tarayıcıda dosya sistemi yok; görsel yükleyici ve madde metni oradan
   * enjekte edilir. `guidelineText` verilmezse denetim yine koşar — Apple'ın
   * kendi metni prompt'a girmez, kart tek başına kullanılır.
   */
  opts: { loadImage?: ImageLoader; guidelineText?: (section: string) => string } = {},
): Promise<{ findings: Finding[]; stats: CheckStats }> {
  // İKİ ön ek, tek değil.
  //
  // Görseller ön eke girince çağrı başına ~17k token oluyor. Tek ön ek
  // kullanınca bu yük görsel İSTEMEYEN kartlara da biniyordu: 12 kart × 17k =
  // dakikalık token limitinin üstü, denetim 429 ile düşüyordu. Oysa görseli
  // yalnızca 4 kart istiyor. Ayırınca hem limit altında kalıyoruz hem de iki
  // ön ek de kendi içinde sabit kaldığı için prompt cache bozulmuyor.
  const textPrefix = await submissionPrefix(sub, { withImages: false, loadImage: opts.loadImage })
  const visionPrefix = llm.supportsVision
    ? await submissionPrefix(sub, { withImages: true, loadImage: opts.loadImage })
    : textPrefix
  const imagesInPrefix = visionPrefix.filter((b) => b.type === 'image').length
  const prefixFor = (r: RuleCard) => (needsVision(r) ? visionPrefix : textPrefix)

  const stats: CheckStats = {
    rulesRun: 0, truncated: 0, unparsable: 0, skippedNoVision: [], basarisiz: [],
    imagesUsed: imagesInPrefix, imagesTotal: sub.media.screenshots.length,
    inputTokens: 0, outputTokens: 0, cachedTokens: 0,
    ms: 0, firstCallMs: 0, avgCallMs: 0,
  }
  const findings: Finding[] = []
  const t0 = Date.now()

  /** Uzun sağlayıcı hatalarını okunur tek satıra indir. */
  const kisaHata = (e: unknown): string => {
    const m = String((e as Error)?.message ?? e)
    if (/429/.test(m)) {
      const lim = /Limit (\d+)/.exec(m)?.[1]
      return `oran sınırı (429)${lim ? ` — hesabın dakikalık token sınırı ${lim}` : ''}`
    }
    if (/timeout|aborted/i.test(m)) return 'zaman aşımı'
    return m.slice(0, 160)
  }

  // Görsel gerektiren bir kartı görsel olmadan çalıştırmak, en tehlikeli
  // sonucu üretir: model "paywall ekranı yok" der, rapor TEMİZ görünür, ama
  // aslında hiç bakılmamıştır. Çalıştırmak yerine açıkça atlıyoruz.
  const runnable: RuleCard[] = []
  for (const r of rules) {
    if (needsVision(r) && imagesInPrefix === 0) stats.skippedNoVision.push(r.id)
    else runnable.push(r)
  }

  const queue = [...runnable]
  const workers = Math.max(1, llm.concurrency)

  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const rule = queue.shift()
        if (!rule) return
        // TEK KART TÜM DENETİMİ ÖLDÜRMEZ.
        //
        // Burası try/catch'siz olduğu için bir kartın çağrısı patlayınca
        // `Promise.all` reddediyor ve denetimin TAMAMI düşüyordu. Sahada
        // oran sınırı (429) sekiz denemeyi de tüketti ve kullanıcı hiçbir
        // şey alamadı — 13 kart başarıyla koşmuş olmasına rağmen.
        //
        // Yarım rapor, hiç rapor olmamasından iyidir; YETER Kİ neyin
        // çalışmadığı görünsün. Patlayan kart `basarisiz`e yazılıyor ve
        // rapora "DENETLENMEDİ" diye giriyor (belkiPatlarız R2/R3).
        try {
          const got = await one(
            llm, sub, prefixFor(rule), rule,
            lessonsByRule.get(rule.id) ?? [],
            opts.guidelineText?.(rule.source.section) ?? '',
            stats,
          )
          findings.push(...got)
        } catch (e) {
          stats.basarisiz.push({ id: rule.id, sebep: kisaHata(e) })
        }
        onProgress?.(stats.rulesRun, runnable.length, rule.id, stats.ms)
      }
    }),
  )

  stats.ms = Date.now() - t0
  stats.avgCallMs = stats.rulesRun ? Math.round(stats.ms / stats.rulesRun) : 0
  return { findings, stats }
}

async function one(
  llm: LlmProvider,
  sub: Submission,
  prefix: Awaited<ReturnType<typeof submissionPrefix>>,
  rule: RuleCard,
  lessons: Lesson[],
  /** Apple'ın bu maddedeki kendi metni. Boşsa bloka hiç girmez. */
  officialText: string,
  stats: CheckStats,
): Promise<Finding[]> {
  const res = await llm.complete({
    system: CHECKER_SYSTEM,
    prefix,
    suffix: renderRuleCard(rule, lessons, officialText),
    schema: FINDINGS_SCHEMA,
    maxTokens: 2048,
    temperature: 0, // denetim deterministik olsun
  })

  if (stats.rulesRun === 0) stats.firstCallMs = res.usage.ms
  stats.rulesRun++
  stats.inputTokens += res.usage.inputTokens
  stats.outputTokens += res.usage.outputTokens
  stats.cachedTokens += res.usage.cachedTokens
  if (res.truncated) stats.truncated++

  const parsed = res.json as { findings?: RawFinding[] } | null
  if (!parsed?.findings) {
    // Boş sonuç ile BOZUK sonuç aynı şey değil. Ayırmazsak "model bir şey
    // bulamadı" sanıp asıl hatayı (kesilme / geçersiz JSON) hiç görmeyiz.
    if (res.raw.trim().length > 0) stats.unparsable++
    return []
  }
  return parsed.findings.map((f) => ({
    ...toFinding(sub, rule, f),
    lessonIds: lessons.map((l) => l.id),
  }))
}

/**
 * Kart görsel içeriğe bakmadan anlamlı çalışabilir mi?
 *
 * `every` DEĞİL `some`. Bu satır sahada 15 bulgunun 13'ünü uydurdu.
 *
 * Eski kural "kartın BÜTÜN ihtiyaçları görsel olsun" diyordu. Karışık kartlar
 * — metin VE ekran görüntüsü isteyenler — bu testi geçemiyor ve görselsiz
 * prompt alıyordu. Ama soruları görsele bakmayı şart koşuyor:
 *
 *   "…o özelliğin ekran görüntülerinde hiçbir izi yok mu?"
 *
 * Model ekran görüntüsünü GÖRMEDEN bu soruya "izi yok" diye cevap veriyordu.
 * Gerçek bir denetimde `apple-2.3.3-feature-not-evidenced` tek başına yedi
 * uydurma bulgu üretti ("bu özelliğin kanıtı yok" — oysa uygulamanın altı
 * ekran görüntüsü vardı ve modele hiç gösterilmemişti). Risk skoru 100'e
 * dayandı ve rapor okunamaz hâle geldi.
 *
 * Ders daha genel: bir kart bir artifact'i `needs` içinde SAYIYORSA o
 * artifact'i GÖRMELİ. Görmediğinde sessizce yanlış cevap veriyor — ne hata
 * fırlatıyor ne de "bakamadım" diyor (belkiPatlarız R2, R20).
 *
 * Maliyet: beş kart daha görsel prompt'una geçiyor. Görseller paylaşılan
 * ön ekte ve prompt cache'ten okunuyor; doğru cevabın yanında bu bedel yok
 * denecek kadar az.
 */
function needsVision(card: RuleCard): boolean {
  if (card.requiresVision) return true
  const visual: ReadonlyArray<string> = ['screenshots', 'icon', 'previewVideo']
  return card.needs.some((n) => visual.includes(n))
}

interface RawFinding {
  artifact: string
  mediaId?: string | null
  iapId?: string | null
  excerpt: string
  rationale: string
  suggestedFix: string
  severity: 'high' | 'medium' | 'low'
}

function toFinding(sub: Submission, rule: RuleCard, raw: RawFinding): Finding {
  return {
    ruleId: rule.id,
    platform: sub.platform,
    // ŞİDDET KARTIN, MODELİN DEĞİL.
    //
    // Eskiden `raw.severity ?? rule.defaultSeverity` idi, yani modelin dediği
    // kazanıyordu. Sahada model 15 bulgunun 15'ine de "high" dedi — kartların
    // yarısı "medium" olarak kalibre edilmiş olmasına rağmen. O sinyal bilgi
    // taşımıyor, yalnızca skoru şişiriyordu.
    //
    // Kavramsal olarak da doğrusu bu: şiddet KURALA dair bir politika kararı,
    // örneğe dair değil. Onu maddeyi okuyup kartı yazan kişi belirler. Modelin
    // işi "bu kural çiğnenmiş mi", "bu kural ne kadar ciddi" değil.
    severity: rule.defaultSeverity,
    outcome: rule.outcome === 'manual' ? 'risk' : rule.outcome, // manual kart buraya hiç gelmez
    artifact: raw.artifact as ArtifactKind,
    locator: toLocator(raw),
    excerpt: raw.excerpt ?? '',
    rationale: raw.rationale ?? '',
    suggestedFix: raw.suggestedFix ?? '',
    confidence: 0,
  }
}

const TEXT_FIELDS = [
  'name', 'subtitle', 'shortDescription', 'description',
  'keywords', 'promotionalText', 'whatsNew',
] as const satisfies ReadonlyArray<keyof SubmissionText>

function toLocator(raw: RawFinding): Locator {
  if (raw.mediaId) return { type: 'image', mediaId: raw.mediaId }
  if (raw.iapId) return { type: 'iap', iapId: raw.iapId }
  const field = TEXT_FIELDS.find((f) => f === raw.artifact)
  if (field) return { type: 'text', field }
  return { type: 'field', field: raw.artifact }
}
