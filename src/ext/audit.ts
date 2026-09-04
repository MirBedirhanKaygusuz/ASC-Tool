/**
 * Eklenti denetim giriş noktası.
 *
 * Bu dosya esbuild ile tek bir tarayıcı paketine derlenir (`npm run build:ext`)
 * ve `extension/src/audit.bundle.js` olarak eklentiye girer. Böylece denetim
 * mantığı TEK yerde kalır: terminaldeki `npm run check` ile eklentinin
 * çalıştırdığı kod aynı kaynaktan gelir, iki ayrı gerçeklik oluşmaz.
 *
 * NE YAPMAZ: model turu. LLM henüz eklentide yok (proxy adımı). Bu yüzden
 * modele gidecek kartlar "çalıştırılmadı" diye AÇIKÇA raporlanır. Sessizce
 * atlanıp raporun temiz görünmesi, bu projedeki en pahalı hata olurdu.
 */
import { META_FIELDS } from '../meta-fields.js'
import type { ElenenKart } from '../types.js'
import { submissionFromDump, type Dump, type MapOptions } from './submission-from-dump.js'
import { runLint } from '../lint/index.js'
import { selectRules } from '../check/select.js'
import { groundFindings } from '../check/ground.js'
import { riskScore, riskBreakdown, dedupeFindings, surumDurumu } from '../report/index.js'
import { OpenAICompatibleProvider } from '../llm/openai-compatible.js'
import type { ImageLoader } from '../check/prompt.js'
import { CORPUS } from './corpus.generated.js'
import { GUIDELINES } from './guidelines.generated.js'
import { sectionWithChildren } from '../corpus/guidelines.js'
import type { Finding, FindingExample, LintFinding, ManualCheck, RuleCard, Submission } from '../types.js'
import type { Lesson, LessonStore } from '../lessons/types.js'
import {
  coverage, normalizeSection, kartKapsiyorMu, kapsamOrani,
  type CoverageReport, type RejectRecord, type MaddeSatiri,
} from '../eval/coverage.js'

export interface ExtAuditOptions extends MapOptions {
  /** Gizlilik/destek adresleri canlı mı diye sınansın mı (izin gerekir). */
  probeUrls?: boolean
  /** Fiyatların hangi ülkeye göre doğrulanacağı (ASC kodu, ör. USA). */
  territory?: string
  /**
   * Ortak havuzdaki TÜM dersler (durum filtresiz).
   *
   * ÇAĞIRAN ÇEKER, bu dosya ağa çıkmaz. Sebep: denetim mantığı hem terminalde
   * hem tarayıcıda aynı kaynaktan koşuyor ve ikisinin ağ katmanı farklı
   * (birinde .env, ötekinde chrome.storage). Havuzu buradan çekseydik bu
   * dosya ya Node'a ya tarayıcıya bağlanırdı.
   *
   * Filtresiz gelmesi bilerek: taslak sayısı ve kapsama boşlukları da
   * raporlanıyor, ikisi de yalnız aktif dersler bakılarak görülemez.
   */
  dersler?: Lesson[]
  /**
   * Havuz yapılandırılmış ama ULAŞILAMADIYSA buraya sebebi yazılır ve
   * raporun uyarılarına girer. Sessiz kalmak en pahalı hata olurdu:
   * dersler devre dışıyken rapor, ders varmış gibi görünür.
   */
  dersUyarisi?: string
}

export interface ExtAuditResult {
  submission: Submission
  /** Eşlemede eksik kalanlar — raporda görünmek zorunda. */
  warnings: string[]
  lint: LintFinding[]
  manual: ManualCheck[]
  /** Modele gidecekti ama model yok: DENETLENMEDİ. */
  llmPending: Array<{ id: string; section: string; question: string }>
  /**
   * ÇALIŞMAYAN her kart, sebebiyle. `unknownMeta` bunun bir alt kümesi.
   *
   * Kural kitabı 175 karta çıkınca tipik denetimde kartların çoğu çalışmıyor
   * ve sebeplerinin ikisi kullanıcının düzeltebileceği türden: eksik beyan ve
   * YANLIŞ beyan. Sessiz kalmak denetimi olduğundan geniş gösterir.
   */
  elenen: ElenenKart[]
  selection: { corpus: number; aday: number; modele: number; elleKontrol: number }
  /** meta bilinmediği için elenen kartlar — "sorun yok" DEĞİL. */
  unknownMeta: Array<{ id: string; section: string; reason: string }>
  notChecked: string[]
  riskScore: number
  /**
   * Skorun neyden oluştuğu. Tek sayı "düzeldi mi" sorusunu cevaplamıyor;
   * "3 kesin ihlal → 1 kesin ihlal" cevaplıyor.
   */
  riskBreakdown: {
    ham: number
    kesinIhlal: number
    risk: number
    kesinKontrol: number
    yuksek: number
    orta: number
    dusuk: number
  }
  corpusVersion: string
  counts: { cards: number; lint: number; manual: number; pending: number }
  /**
   * Ortak havuzdan ne geldiği. Havuz bağlı değilse hepsi 0.
   *
   * Sayı olarak raporlanıyor çünkü "0 aktif ders" ile "havuz yok" farkı
   * kullanıcı için gerçek: ilki havuzun boş olduğunu, ikincisi bağlanmadığını
   * söyler. `bagli` bu ikisini ayırıyor.
   */
  dersOzeti: {
    bagli: boolean
    aktif: number
    inApp: number
    taslak: number
    /** rule_id'si olmayan aktif ders = hiçbir kartımızın kapsamadığı red. */
    bosluk: number
  }
}

/**
 * Dersleri denetimin kullandığı kovalara ayır.
 *
 * SAF FONKSİYON, AĞ YOK. `check/run.ts`teki aynı isimli mantığın eşi — ikisi
 * ayrışırsa terminalde ve panelde farklı ders seti denetime girer ve
 * hangisinin doğru olduğu bilinemez (belkiPatlarız R18).
 */
function dersleriAyir(dersler: Lesson[], platform: Submission['platform']) {
  const aktifTumu = dersler.filter((l) => l.status === 'active' && l.platform === platform)
  // in-app dersler listing metninden doğrulanamaz. Modele kanıt diye
  // verirsek elinde bakacak veri olmadan hüküm kurar — yalancı alarmın
  // kaynağı budur. Onlar elle kontrol listesine gider.
  const aktif = aktifTumu.filter((l) => l.scope !== 'in-app')
  const inApp = aktifTumu.filter((l) => l.scope === 'in-app')

  const byRule = new Map<string, Lesson[]>()
  for (const l of aktif) {
    if (!l.ruleId) continue
    byRule.set(l.ruleId, [...(byRule.get(l.ruleId) ?? []), l])
  }

  const elleKontrol: ManualCheck[] = inApp.map((l) => ({
    ruleId: l.ruleId ?? l.id,
    platform,
    question: `${l.title} — bu davranış uygulamada var mı?`,
    ruleText: l.summary,
    source: { doc: 'ders', section: l.guideline, url: `lessons/${l.id}`, retrievedAt: l.updatedAt },
    why:
      `Guideline ${l.guideline} altında daha önce bu yüzden reddedildik. ` +
      'Uygulama içi davranış: listing denetimi göremez, elle bakılmalı.',
  }))

  return {
    aktif,
    inApp,
    byRule,
    elleKontrol,
    taslak: dersler.filter((l) => l.status === 'draft').length,
    bosluk: dersler.filter(
      (l) => l.ruleId === null && l.status !== 'retired' && l.scope !== 'in-app',
    ).length,
  }
}

const META_LABEL: Record<string, string> = {
  // Elle işaretlenenler: tek kaynak src/meta-fields.ts. Elle yazılmış kopya
  // yeni alan eklendiğinde eksik kalıyordu ve eksik alan "bilgi eksik"
  // satırında adsız görünüyordu.
  ...Object.fromEntries(META_FIELDS.map((f) => [f.key, f.tldr.toLocaleLowerCase('tr')])),
  // Beyandan gelenler: kullanıcı girmiyor ama ÇEKİLMEMİŞ olabilir. O zaman
  // kart "koşul sağlanmadı" diye elenmez, "bilgi eksik" olarak görünür.
  declaresTracking: 'gizlilik etiketinde takip beyanı (çekilmemiş)',
  usesThirdPartyContent: 'üçüncü taraf içerik beyanı (çekilmemiş)',
  hasCustomProductPages: 'özel ürün sayfaları (çekilmemiş)',
  hasUnsubmittedProducts: 'ürün gönderim durumları (çekilmemiş)',
}

function missingMetaOf(sub: Submission, card: RuleCard): string {
  const w = card.appliesWhen ?? {}
  const eksik = (Object.keys(META_LABEL) as Array<keyof typeof META_LABEL>).filter(
    (k) => (w as any)[k] !== undefined && (sub.meta as any)[k] === undefined,
  )
  return eksik.map((k) => META_LABEL[k]).join(', ')
}

export async function audit(dump: Dump, opts: ExtAuditOptions = {}): Promise<ExtAuditResult> {
  const { submission, warnings } = submissionFromDump(dump, opts)

  const { bulgular: lint, denetlenmedi: lintDenetlenmedi } = await runLint(submission, {
    probe: opts.probeUrls !== false,
  })
  const { llm, manual, unknownMeta, elenen } = selectRules(submission, CORPUS.cards as RuleCard[])

  const manualChecks: ManualCheck[] = manual.map((c) => ({
    ruleId: c.id,
    platform: submission.platform,
    question: c.question,
    ruleText: c.ruleText,
    source: c.source,
    why: 'Mağaza kaydından görülemez; yayın öncesi elle kontrol edilmeli.',
  }))

  // Ortak havuzdan gelen dersler. Havuz bağlı değilse boş liste — denetim
  // eskisi gibi yalnız kartlarla koşar, hiçbir şey bozulmaz.
  const ders = dersleriAyir(opts.dersler ?? [], submission.platform)
  manualChecks.push(...ders.elleKontrol)

  // Veri olmadığı için çalışamayan kontroller: "temiz" değil "bakılmadı".
  const notChecked: string[] = [...lintDenetlenmedi]
  if (opts.probeUrls === false) {
    notChecked.push('Adreslerin canlı olup olmadığı sınanmadı (ağ izni verilmedi)')
  }

  // Fiyatı okunamayan ürün varsa herkese açık vitrinden doğrula.
  //
  // Aynı ağ iznine bağlı: izin yoksa doğrulama yapılmaz ve bu "denetlenmedi"
  // diye yazılır. Fiyatların hepsi okunduysa hiç ağa çıkılmaz — doğrulama
  // bedava değil, gerekmiyorsa yapılmaz.
  const { crossCheckMissingPrices } = await import('../check/price-crosscheck.js')
  const vitrin = await crossCheckMissingPrices(submission, {
    enabled: opts.probeUrls !== false,
    country: opts.territory,
  })
  lint.push(...vitrin.findings)
  notChecked.push(...vitrin.notChecked)
  if (!submission.media.screenshots.length) {
    notChecked.push('Görsel gerektiren kartlar: ekran görüntüsü yok')
  }

  return {
    submission,
    // Havuz yapılandırılmış ama ulaşılamadıysa rapor bunu SÖYLER. Sessizce
    // derssiz koşmak, raporu olduğundan güvenilir gösterirdi.
    warnings: opts.dersUyarisi ? [...warnings, opts.dersUyarisi] : warnings,
    lint,
    manual: manualChecks,
    llmPending: llm.map((c) => ({ id: c.id, section: c.source.section, question: c.question })),
    unknownMeta: unknownMeta.map((c) => ({
      id: c.id,
      section: c.source.section,
      reason: missingMetaOf(submission, c) || 'meta bilinmiyor',
    })),
    elenen,
    selection: {
      corpus: CORPUS.cards.length,
      aday: llm.length + manual.length + elenen.length,
      modele: llm.length,
      elleKontrol: manualChecks.length,
    },
    notChecked,
    // Model bulgusu olmadan hesaplanan skor EKSİKTİR; arayüz bunu söylüyor.
    riskScore: riskScore(lint, []),
    riskBreakdown: riskBreakdown(lint, []),
    corpusVersion: CORPUS.version,
    counts: {
      cards: CORPUS.cards.length,
      lint: lint.length,
      manual: manualChecks.length,
      pending: llm.length,
    },
    dersOzeti: {
      bagli: opts.dersler !== undefined,
      aktif: ders.aktif.length,
      inApp: ders.inApp.length,
      taslak: ders.taslak,
      bosluk: ders.bosluk,
    },
  }
}

// ---------------------------------------------------------------------------
// Model turu — proxy üzerinden
// ---------------------------------------------------------------------------

/**
 * Tarayıcı görsel yükleyicisi.
 *
 * Node sürümü diski kullanıyor (out/media altına önbellek). Tarayıcıda ne
 * dosya sistemi var ne de böyle bir önbelleğe gerek: Apple'ın imzalı URL'i
 * doğrudan çekiliyor. Aynı prompt kodunu iki ortamda kullanabilmemizin sebebi
 * yükleyicinin enjekte edilebilir olması.
 *
 * Görsel adresleri mzstatic.com gibi Apple alan adlarında; ağ izni verilmemişse
 * fetch düşer ve görsel kartlar "denetlenmedi" olur — sessizce "sorun yok"
 * DEMEZ.
 */
const browserImageLoader: ImageLoader = async (path) => {
  if (!/^https?:\/\//i.test(path)) return null
  try {
    const res = await fetch(path, { signal: AbortSignal.timeout(30_000) })
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    let binary = ''
    // btoa büyük dizide yığını taşırıyor; parça parça çevir.
    for (let i = 0; i < buf.length; i += 8192) {
      binary += String.fromCharCode(...buf.subarray(i, i + 8192))
    }
    const mime = res.headers.get('content-type')?.split(';')[0] ?? ''
    return { mime: mime.startsWith('image/') ? mime : 'image/png', b64: btoa(binary) }
  } catch {
    return null
  }
}

export interface ProxyConfig {
  /** Cloudflare Worker adresi, /v1 ile biter. */
  url: string
  /** İsteğe bağlı istemci belirteci (Worker'daki CLIENT_TOKEN ile aynı). */
  token?: string
  model?: string
  vision?: boolean
  /** Katı json_schema — gpt-4o-mini destekliyor, çıktı biçimini garantiler. */
  strictSchema?: boolean
  /** Görsel ayrıntısı: "low" ucuz ve genelde yeterli, "high" küçük puntoyu okur. */
  imageDetail?: 'low' | 'high' | 'auto'
}

export interface FullAuditOptions extends ExtAuditOptions {
  proxy: ProxyConfig
  onProgress?: (text: string) => void
  /**
   * Bulgulara "benzer gerçek red'ler" iliştirmek için havuz istemcisi.
   *
   * `Pick` ile daraltıldı: bu dosyanın havuzdan tek ihtiyacı örnekleri
   * okumak. Tüm arayüzü istemek, ileride yazma metotlarını da buradan
   * çağırmayı kolaylaştırırdı — denetimin havuza YAZMASI istemediğimiz bir şey.
   */
  havuz?: Pick<LessonStore, 'examplesFor'>
}

export interface FullAuditResult extends ExtAuditResult {
  findings: Finding[]
  modelRan: boolean
  modelError?: string
  /** Hangi cihaz sınıfı modele gitti, hangileri bilerek atlandı. */
  gorselNotu?: string
  stats: {
    rulesSelected: number
    rulesRun: number
    rawFindings: number
    afterGrounding: number
    afterVerify: number
    imagesUsed: number
    imagesTotal: number
    inputTokens: number
    outputTokens: number
    ms: number
  }
}

/**
 * Tam denetim: kesin kontroller + model turu + alıntı doğrulama + ikinci göz.
 *
 * SIRA `check/run.ts` İLE AYNI OLMALI. Aynı yapı taşlarını aynı sırayla
 * çağırıyoruz; farklı sırada çağırsak terminal ile eklenti farklı sonuç verir
 * ve hangisinin doğru olduğu bilinemez.
 */
export async function fullAudit(dump: Dump, opts: FullAuditOptions): Promise<FullAuditResult> {
  const base = await audit(dump, opts)
  const say = opts.onProgress ?? (() => {})

  const llm = new OpenAICompatibleProvider(
    opts.proxy.model ?? 'gpt-4o-mini',
    opts.proxy.url.replace(/\/+$/, ''),
    '', // anahtar YOK — proxy ekliyor
    opts.proxy.vision !== false,
    4,
    opts.proxy.strictSchema !== false,
    {
      label: 'proxy',
      keyless: true,
      clientToken: opts.proxy.token ?? '',
      imageDetail: opts.proxy.imageDetail ?? 'low',
    },
  )

  const empty = {
    rulesSelected: base.llmPending.length, rulesRun: 0, rawFindings: 0,
    afterGrounding: 0, afterVerify: 0, imagesUsed: 0,
    imagesTotal: base.submission.media.screenshots.length,
    inputTokens: 0, outputTokens: 0, ms: 0,
  }

  const health = await llm.healthcheck()
  if (!health.ok) {
    // Model çalışmadıysa bunu SÖYLE. Sessizce lint sonucunu döndürmek,
    // eksik denetimi tam sanmaya yol açar.
    return { ...base, findings: [], modelRan: false, modelError: health.reason, stats: empty }
  }

  const { runCheck } = await import('../check/check.js')
  const { verifyFindings } = await import('../check/verify.js')

  const cards = (CORPUS.cards as RuleCard[]).filter((c) => base.llmPending.some((p) => p.id === c.id))
  say(`${cards.length} kart modele soruluyor…`)

  // Dersler kartların YANINDA ek kanıt olarak modele giriyor: kart
  // politikanın ne dediğini taşır, ders pratikte nasıl reddedildiğini.
  const ders = dersleriAyir(opts.dersler ?? [], base.submission.platform)
  if (ders.aktif.length) say(`${ders.aktif.length} ders kartlara kanıt olarak ekleniyor…`)

  const res = await runCheck(
    llm, base.submission, cards, ders.byRule,
    (done, total, ruleId) => say(`[${done}/${total}] ${ruleId}`),
    {
      loadImage: browserImageLoader,
      // Apple'ın kendi madde metni pakete gömülü — denetim sırasında
      // Apple'ın sitesine gitmiyoruz (yavaş olurdu ve "hangi metne göre
      // denetlendi" sorusunun cevabı her çekimde değişirdi).
      guidelineText: (section) => sectionWithChildren(GUIDELINES, section),
    },
  )

  // Görsel kartı görselsiz çalıştırmak en tehlikeli sonucu üretir: model
  // "paywall yok" der, rapor TEMİZ görünür, oysa hiç bakılmamıştır.
  // Patlayan kartlar da "denetlenmedi" listesine girer. Sessizce düşselerdi
  // rapor o konulara BAKILDIĞINI ima ederdi — bu deponun bir numaralı yasağı.
  const notChecked = [
    ...base.notChecked,
    ...res.stats.skippedNoVision,
    ...res.stats.basarisiz.map((b) => `${b.id} — çalıştırılamadı: ${b.sebep}`),
  ]

  // "Gönderilmedi" ile "gönderilemedi" AYRI ŞEYLER.
  //
  // Modele tek cihaz sınıfının tamamı gidiyor; diğer sınıflar KASTEN
  // gönderilmiyor (aynı tasarımın kopyası, maliyeti ikiye katlıyor).
  // Bunu "denetlenmedi" diye yazmak yanlış alarm üretiyordu: kullanıcı
  // eksik denetim sanıyor, oysa tasarım gereği.
  const byClass = new Map<string, number>()
  for (const shot of base.submission.media.screenshots) {
    const k = shot.deviceClass ?? '-'
    byClass.set(k, (byClass.get(k) ?? 0) + 1)
  }
  const isPhone = (k: string) => /phone/i.test(k)
  const siralı = [...byClass.entries()].sort(
    (a, b) => Number(isPhone(b[0])) - Number(isPhone(a[0])) || b[1] - a[1],
  )
  const [anaSinif, anaSayi] = siralı[0] ?? ['-', 0]
  const digerler = siralı.slice(1)

  const gorselNotu =
    anaSayi === 0
      ? ''
      : `${anaSinif}: ${Math.min(res.stats.imagesUsed, anaSayi)}/${anaSayi} ekran görüntüsü modele gitti` +
        (digerler.length
          ? `. Diğer cihaz sınıfları (${digerler.map(([k, n]) => `${k}: ${n}`).join(', ')}) ` +
            'bilerek gönderilmedi — aynı tasarımın başka cihaz kopyası.'
          : '.')

  // Yalnız SEÇİLEN sınıfın görselleri eksik kaldıysa gerçek bir boşluk var.
  if (res.stats.imagesUsed < anaSayi) {
    notChecked.push(
      `${anaSinif} sınıfının ${anaSayi} görüntüsünden ${res.stats.imagesUsed} tanesi gönderilebildi — ` +
        'gerisi okunamadı.',
    )
  }

  say('alıntılar doğrulanıyor…')
  const grounded = groundFindings(base.submission, res.findings)

  say('ikinci göz…')
  const byId = new Map<string, RuleCard>(cards.map((r) => [r.id, r]))
  const verified = await verifyFindings(llm, base.submission, grounded.kept, byId)
  const findings = dedupeFindings(verified.kept)

  // Rapora gerçek red örneklerini iliştir — `check/run.ts` ile aynı iş.
  //
  // SONA bırakılıyor: eleme ve oylamadan sonra kalan bulgu sayısı ham
  // sayının çok altında; örnekleri önce çekseydik elenecek bulgular için de
  // havuza istek atardık.
  if (opts.havuz && ders.aktif.length) {
    for (const f of findings) {
      const examples: FindingExample[] = []
      for (const lessonId of f.lessonIds ?? []) {
        const lesson = ders.aktif.find((l) => l.id === lessonId)
        if (!lesson) continue
        try {
          for (const c of await opts.havuz.examplesFor(lessonId, 2)) {
            examples.push({
              lessonId, lessonTitle: lesson.title, appName: c.appName,
              rejectedAt: c.rejectedAt, guideline: c.guideline,
              excerpt: c.excerpt, reviewerText: c.reviewerText, resolution: c.resolution,
            })
          }
        } catch {
          // Örnek getirilemedi: bulgunun kendisi geçerli, yalnız süsü eksik.
          // Tüm denetimi düşürmek orantısız olurdu.
        }
      }
      if (examples.length) f.examples = examples
    }
  }

  return {
    ...base,
    findings,
    notChecked,
    modelRan: true,
    gorselNotu,
    // Skor artık model bulgularını da içeriyor.
    riskScore: riskScore(base.lint, findings),
    riskBreakdown: riskBreakdown(base.lint, findings),
    stats: {
      rulesSelected: cards.length,
      rulesRun: res.stats.rulesRun,
      rawFindings: res.findings.length,
      afterGrounding: grounded.kept.length,
      afterVerify: findings.length,
      imagesUsed: res.stats.imagesUsed,
      imagesTotal: res.stats.imagesTotal,
      inputTokens: res.stats.inputTokens,
      outputTokens: res.stats.outputTokens,
      ms: res.stats.ms,
    },
  }
}

/** Paketteki kural kitabının sürümü — kayıtlı raporun eskiyip eskimediğini anlamak için. */
// Elle işaretlenen alanların tanımı da pakete giriyor: yan panel kendi
// kopyasını tutmasın. Kopya tutulduğunda yeni alanlar orada HİÇ sorulmuyordu
// ve o alanlara bakan kartlar her denetimde "bilgi eksik" olarak düşüyordu.
export { META_FIELDS, META_GROUPS, META_KEYS } from '../meta-fields.js'
// Kesin kontrollerin madde çapası: rapor markdown'ında vardı, panelde yoktu.
// Aynı bilginin bir yüzeyde olup ötekinde olmaması, bu turda düzelttiğimiz
// hata sınıfının kendisi.
export { lintSection } from '../lint/sections.js'

export const CORPUS_VERSION = CORPUS.version
export { surumDurumu }
export { submissionFromDump }
export type { Dump }

/**
 * Red kapsama analizi. Eklenti de CLI de AYNI kodu kullanıyor — iki kopya
 * olsaydı "panelde %70, terminalde %55" diye bir şey çıkardı (R18).
 *
 * Kartlar zaten pakete gömülü; çağıran yalnız red kayıtlarını veriyor.
 */
export function coverageReport(rejects: RejectRecord[]): CoverageReport {
  return coverage(rejects, CORPUS.cards as RuleCard[])
}
export { normalizeSection as normalizeGuideline, kartKapsiyorMu, kapsamOrani }
export type { CoverageReport, RejectRecord, MaddeSatiri }
