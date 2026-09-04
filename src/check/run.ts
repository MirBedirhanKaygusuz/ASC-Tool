import { writeFile, mkdir } from 'node:fs/promises'
import { loadFixture, fetchFromAppStoreConnect } from '../fetch/index.js'
import { loadAppConfig, mergeMeta, META_KEYS, type AppMeta } from '../fetch/app-meta.js'
import { runLint } from '../lint/index.js'
import { loadCorpus } from '../corpus/index.js'
import { selectRules, kosulEtiketi } from './select.js'
import { groundFindings } from './ground.js'
import { hesaplaHuni } from './huni.js'
import { riskScore, riskBreakdown, renderMarkdown, dedupeFindings } from '../report/index.js'
import { createProvider } from '../llm/index.js'
import { createLessonStore, type Lesson } from '../lessons/index.js'
import type {
  Report, Finding, RuleCard, ManualCheck, FindingExample, Submission, KartHunisi,
} from '../types.js'

/**
 * Denetim boru hattı — TEK kaynak.
 *
 * Daha önce bu mantık cli.ts içinde gömülüydü. Arayüz de aynı işi yapacağı
 * için buraya taşındı: iki front-end iki ayrı kopyaya bakarsa zamanla
 * ayrışır ve "aynı uygulamayı iki yerden denetledim, iki farklı rapor aldım"
 * durumu doğar. İlerleme bildirimi callback ile dışarı veriliyor; terminal
 * stderr'e yazar, arayüz SSE ile akıtır.
 */

export type ProgressLevel = 'step' | 'detail' | 'warn'

export interface ProgressEvent {
  level: ProgressLevel
  text: string
}

export type OnProgress = (event: ProgressEvent) => void

export interface AuditInput {
  /** Canlı çekim. fixture ile birlikte verilirse bu kazanır. */
  appId?: string
  /** Dosyadan okuma — anahtar yokken ve testte kullanılır. */
  fixture?: string
  locale?: string
  territory?: string
  /** apps/{id}.json'u ezen tek seferlik değerler. */
  metaOverrides?: AppMeta
  noLlm?: boolean
  /**
   * Yalnız bu kart id'leri modele gitsin — tanı koşuları için.
   *
   * Ölçüm amaçlı: "şu dört kartı daha güçlü modelle koştur" gibi. Filtre
   * uygulanan koşu rapora `selection.filtre` olarak yazılıyor; kimse onu tam
   * denetim sanmasın.
   */
  onlyRules?: string[]
  llmBackend?: string
  llmModel?: string
  /** Markdown raporun yazılacağı yol. JSON'u aynı ada .json olarak yazılır. */
  outPath?: string
}

export interface AuditResult {
  report: Report
  submission: Submission
  markdown: string
  /** Her meta alanının nereden geldiği: api | dosya | bayrak | bilinmiyor. */
  metaSources: Record<string, string>
  /** Yazılan dosyalar. */
  files: { markdown: string; json: string; snapshot?: string }
}

export async function runAudit(input: AuditInput, onProgress: OnProgress = () => {}): Promise<AuditResult> {
  const step = (text: string) => onProgress({ level: 'step', text })
  const detail = (text: string) => onProgress({ level: 'detail', text })
  const warn = (text: string) => onProgress({ level: 'warn', text })

  const outPath = input.outPath ?? 'out/report.md'
  const metaSources: Record<string, string> = {}
  let snapshotPath: string | undefined

  // --- 0. Girdi -------------------------------------------------------------
  const sub = input.appId
    ? await fetchFromAppStoreConnect(input.appId, {
        locale: input.locale,
        territory: input.territory,
        onWarn: warn,
      })
    : await loadFixture(input.fixture!)

  // API'nin bilemediği alanlar: kayıtlı dosya ve komut satırı bayrakları.
  //
  // BU BLOK BİR ZAMANLAR `if (input.appId)` İÇİNDEYDİ ve fixture modunda hiç
  // çalışmıyordu. Sonuç: `--ai-content` yazıyordun, hiçbir şey olmuyordu ve
  // hiçbir uyarı da çıkmıyordu — bayrak sessizce yutuluyordu. Fixture da bir
  // Submission kaynağı; kullanıcının niyeti her iki yolda da aynı.
  const config = input.appId ? await loadAppConfig(input.appId) : null
  const merged = mergeMeta(sub.meta, config?.meta, input.metaOverrides ?? {})
  sub.meta = merged.meta
  Object.assign(metaSources, merged.sources)
  step('meta: ' + META_KEYS.map((k) => `${k}=${sub.meta[k] ?? '?'}(${merged.sources[k]})`).join(' '))
  const unknown = META_KEYS.filter((k) => merged.sources[k] === 'bilinmiyor')
  if (unknown.length) {
    warn(
      `${unknown.length} alan bilinmiyor (${unknown.join(', ')}) — bu koşullara bakan kartlar elenir. ` +
        (input.appId
          ? `Doldurmak için: npm run meta -- --app ${input.appId} --ugc --no-ads …  ` +
            '(alanların tamamı: npm run meta -- --alanlar)'
          : 'Doldurmak için bayrak ekle; alanların tamamı: npm run meta -- --alanlar'),
    )
  }

  if (input.appId) {
    // Canlı çekim tekrar edilebilir olmalı: aynı girdiyle raporu yeniden
    // üretebilmek için anlık görüntüyü diske bırakıyoruz.
    snapshotPath = `out/submission-${input.appId}.json`
    await mkdir('out', { recursive: true })
    await writeFile(snapshotPath, JSON.stringify(sub, null, 2))
    step(`anlık görüntü: ${snapshotPath}`)
  }
  step(`${sub.appName} (${sub.platform}, ${sub.locale})`)

  // --- 1. Kesin kontroller — LLM yok ----------------------------------------
  const { bulgular: lint, denetlenmedi: lintDenetlenmedi } = await runLint(sub)
  step(
    `lint: ${lint.length} bulgu` +
      (lintDenetlenmedi.length ? ` · ${lintDenetlenmedi.length} kontrol veri olmadığı için çalışmadı` : ''),
  )
  for (const satir of lintDenetlenmedi) warn(satir)

  // Fiyatı okunamayan ürün varsa herkese açık vitrinden doğrula. Ağa YALNIZ
  // gerektiğinde çıkar; hepsi okunduysa tek istek atılmaz.
  const { crossCheckMissingPrices } = await import('./price-crosscheck.js')
  const vitrin = await crossCheckMissingPrices(sub, { country: input.territory })
  if (vitrin.findings.length) {
    lint.push(...vitrin.findings)
    step(`vitrin doğrulaması: ${vitrin.findings.length} fiyat bulgusu`)
  }
  for (const satir of vitrin.notChecked) warn(satir)

  // --- 2. Kural seçimi ------------------------------------------------------
  const { cards, version } = await loadCorpus()
  const secim = selectRules(sub, cards)
  const { manual: manualCards, unknownMeta, elenen } = secim
  let selected = secim.llm
  if (input.onlyRules?.length) {
    const istenen = new Set(input.onlyRules)
    const oncesi = selected.length
    selected = selected.filter((c) => istenen.has(c.id))
    warn(
      `--kartlar filtresi: ${oncesi} karttan ${selected.length} tanesi koşacak. ` +
        'BU TAM DENETİM DEĞİL — sonuç raporu kısmi bir koşudur.',
    )
    const bulunamayan = [...istenen].filter((id) => !secim.llm.some((c) => c.id === id))
    if (bulunamayan.length) {
      warn(`İstenen ama bu listing'de seçilmeyen kart: ${bulunamayan.join(', ')}`)
    }
  }
  const sayi = (sebep: string) => elenen.filter((e) => e.sebep === sebep).length
  step(
    `kural: ${cards.length} karttan ${selected.length} tanesi modele gidecek` +
      `, ${manualCards.length} tanesi elle kontrol maddesi` +
      `, ${elenen.length} tanesi çalışmayacak ` +
      `(konu geçmiyor ${sayi('konu-gecmiyor')} · beyanla elendi ${sayi('beyanla-elendi')} · ` +
      `veri yok ${sayi('veri-yok')} · ⚠ beyan eksik ${sayi('meta-bilinmiyor')} · ` +
      `⚠ beyan çekilmedi ${sayi('beyan-cekilmedi')})`,
  )
  // Terminale yalnız DÜZELTİLEBİLİR olanları döküyoruz: eksik beyan ve
  // kullanıcının "hayır" cevabı. "Konu geçmiyor" uzun kuyruk — 75 satır
  // ekranı doldurup asıl uyarıları gömüyordu; tam listesi raporda duruyor.
  for (const e of elenen) {
    if (e.sebep !== 'konu-gecmiyor' && e.sebep !== 'veri-yok') {
      detail(`${e.sebep}: ${e.id} — ${e.detay}`)
    }
  }
  const kuyruk = elenen.filter((e) => e.sebep === 'konu-gecmiyor' || e.sebep === 'veri-yok')
  if (kuyruk.length) detail(`${kuyruk.length} kartın tam listesi raporun "Bu denetim neyi kapsamadı" bölümünde`)

  const manual: ManualCheck[] = manualCards.map((c) => ({
    ruleId: c.id, platform: sub.platform, question: c.question.trim(),
    ruleText: c.ruleText.trim(), source: c.source,
    why: c.tags.includes('checklist') ? c.ruleText.split('.')[0]!.trim() : c.id,
  }))

  // --- Dersler: kartların yanında ek kanıt ----------------------------------
  const store = await createLessonStore()
  await store.healthcheck()
  const allLessons = await store.allLessons()
  const activeAll = allLessons.filter((l) => l.status === 'active' && l.platform === sub.platform)
  // in-app dersler listing metninden doğrulanamaz. Modele kanıt diye verirsek
  // elinde bakacak veri olmadan hüküm kurar — yalancı alarmın kaynağı budur.
  const active = activeAll.filter((l) => l.scope !== 'in-app')
  const inAppLessons = activeAll.filter((l) => l.scope === 'in-app')
  const draftCount = allLessons.filter((l) => l.status === 'draft').length
  const coverageGaps = allLessons
    .filter((l) => l.ruleId === null && l.status !== 'retired' && l.scope !== 'in-app')
    .map((l) => l.id)

  for (const l of inAppLessons) {
    manual.push({
      ruleId: l.ruleId ?? l.id,
      platform: sub.platform,
      question: `${l.title} — bu davranış uygulamada var mı?`,
      ruleText: l.summary,
      source: { doc: 'ders', section: l.guideline, url: `lessons/${l.id}`, retrievedAt: l.updatedAt },
      why: `Guideline ${l.guideline} altında daha önce bu yüzden reddedildik. ` +
        'Uygulama içi davranış: listing denetimi göremez, elle bakılmalı.',
    })
  }

  const lessonsByRule = new Map<string, Lesson[]>()
  for (const l of active) {
    if (!l.ruleId) continue
    lessonsByRule.set(l.ruleId, [...(lessonsByRule.get(l.ruleId) ?? []), l])
  }
  step(
    `ders: ${active.length} aktif` +
      (inAppLessons.length ? `, ${inAppLessons.length} in-app (elle kontrol)` : '') +
      (draftCount ? `, ${draftCount} onay bekliyor` : '') +
      (coverageGaps.length ? `, ⚠ ${coverageGaps.length} kapsama boşluğu` : ''),
  )

  // --- 3-5. Denetim + alıntı doğrulama + ikinci göz -------------------------
  let findings: Finding[] = []
  let rulesRun = 0
  let raw = 0
  let afterGround = 0
  let notChecked: string[] = []
  let huni: KartHunisi[] = []

  if (!input.noLlm && selected.length) {
    const llm = await createProvider({ backend: input.llmBackend, model: input.llmModel })
    const health = await llm.healthcheck()
    if (!health.ok) {
      warn(`LLM turu atlanıyor: ${health.reason}`)
    } else {
      step(
        `model: ${llm.name}/${llm.model} · eşzamanlılık ${llm.concurrency}` +
          `${llm.supportsVision ? ' · vision açık' : ' · vision kapalı (metin-only)'}`,
      )

      const { runCheck } = await import('./check.js')
      const { verifyFindings } = await import('./verify.js')

      const { nodeImageLoader } = await import('./image-node.js')

      // Apple'ın kendi madde metni. Dosya yoksa denetim DURMAZ; kart tek
      // başına kullanılır ve kullanıcı bunu uyarı olarak görür — sessizce
      // "sanki metin varmış gibi" davranmak, hangi metne göre denetlendiğini
      // belirsiz bırakırdı.
      let guidelineText: ((section: string) => string) | undefined
      try {
        const { loadGuidelines } = await import('../corpus/guidelines-node.js')
        const { sectionWithChildren } = await import('../corpus/guidelines.js')
        const doc = await loadGuidelines()
        guidelineText = (section) => sectionWithChildren(doc, section)
        detail(`madde metinleri: ${doc.sections.length} madde (Apple: ${doc.lastUpdated})`)
      } catch (e) {
        warn(`Apple madde metinleri okunamadı — kartlar tek başına kullanılacak. ${(e as Error).message}`)
      }

      const res = await runCheck(
        llm, sub, selected, lessonsByRule,
        (done, total, ruleId, ms) => detail(`[${done}/${total}] ${ruleId} (${Math.round(ms / 1000)}s)`),
        { loadImage: nodeImageLoader, guidelineText },
      )
      rulesRun = res.stats.rulesRun
      raw = res.findings.length
      step(
        `denetim: ${raw} ham bulgu · ${Math.round(res.stats.ms / 1000)}s ` +
          `(ilk çağrı ${Math.round(res.stats.firstCallMs / 1000)}s, ort. ${Math.round(res.stats.avgCallMs / 1000)}s) ` +
          `· prefill ${res.stats.inputTokens} tok`,
      )
      if (res.stats.skippedNoVision.length) {
        warn(
          `${res.stats.skippedNoVision.length} görsel kartı ÇALIŞTIRILMADI ` +
            `(vision kapalı veya görsel dosyası yok) — bu konular DENETLENMEDİ: ` +
            res.stats.skippedNoVision.join(', '),
        )
      }
      if (res.stats.imagesUsed < res.stats.imagesTotal) {
        warn(
          `${res.stats.imagesTotal} ekran görüntüsünden ${res.stats.imagesUsed} tanesi modele gitti — ` +
            'gerisi görülmedi. Görsel kartların hükmü eksik veriye dayanıyor olabilir.',
        )
      }
      notChecked = [
        ...res.stats.skippedNoVision,
        ...res.stats.basarisiz.map((b) => `${b.id} — çalıştırılamadı: ${b.sebep}`),
      ]
      if (res.stats.basarisiz.length) {
        warn(
          `${res.stats.basarisiz.length} kart çalıştırılamadı: ` +
            res.stats.basarisiz.map((b) => `${b.id} (${b.sebep})`).join(', '),
        )
      }
      if (res.stats.truncated || res.stats.unparsable) {
        warn(
          `${res.stats.truncated} çağrı yarıda kesildi, ` +
            `${res.stats.unparsable} yanıt parse edilemedi — bu çağrıların bulguları KAYIP. ` +
            'Model çıktı bütçesini aşıyor.',
        )
      }

      const grounded = groundFindings(sub, res.findings)
      afterGround = grounded.kept.length
      if (grounded.dropped.length) {
        step(`alıntı doğrulama: ${grounded.dropped.length} uydurma bulgu elendi`)
        for (const d of grounded.dropped) detail(`✗ ${d.ruleId}: "${d.excerpt.slice(0, 60)}..."`)
      }

      const byId = new Map<string, RuleCard>(selected.map((r) => [r.id, r]))
      const verified = await verifyFindings(llm, sub, grounded.kept, byId)
      if (verified.dropped.length) step(`ikinci göz: ${verified.dropped.length} zayıf bulgu elendi`)
      findings = dedupeFindings(verified.kept)

      // Kart bazında huni: hangi kart üretip savunmadan geçemiyor. Toplam
      // sayılar ("12 ham → 3 kaldı") bunu gizliyor; yalancı alarm ölçümünün
      // ve hata ayıklamanın ihtiyacı olan kırılım bu.
      huni = hesaplaHuni({
        ham: res.findings,
        alintiDusen: grounded.dropped,
        ikinciGozDusen: verified.dropped,
        kalan: findings,
        kartlar: selected,
      })
      const gurultulu = huni.filter((h) => h.ham >= 3 && h.kalan === 0)
      if (gurultulu.length) {
        warn(
          `${gurultulu.length} kart bulgu üretti ama HİÇBİRİ savunmayı geçmedi ` +
            `(${gurultulu.map((h) => `${h.ruleId}:${h.ham}`).join(', ')}) — gürültü adayı.`,
        )
      }

      // Rapora gerçek red örneklerini iliştir.
      for (const f of findings) {
        const examples: FindingExample[] = []
        for (const lessonId of f.lessonIds ?? []) {
          const lesson = active.find((l) => l.id === lessonId)
          if (!lesson) continue
          for (const c of await store.examplesFor(lessonId, 2)) {
            examples.push({
              lessonId, lessonTitle: lesson.title, appName: c.appName,
              rejectedAt: c.rejectedAt, guideline: c.guideline,
              excerpt: c.excerpt, reviewerText: c.reviewerText, resolution: c.resolution,
            })
          }
        }
        if (examples.length) f.examples = examples
      }
    }
  }

  // Kesin kontrollerin madde çapasını rapora göm: arayüzler lint tablosunu
  // ayrıca yüklemesin, JSON'u okuyan da dayanağı görsün.
  const { lintSection } = await import('../lint/sections.js')
  for (const l of lint) {
    const sec = lintSection(l.checkId)
    if (sec) (l as { section?: string }).section = sec
  }

  const report: Report = {
    submission: {
      appId: sub.appId, appName: sub.appName,
      platform: sub.platform, locale: sub.locale,
    },
    generatedAt: new Date().toISOString(),
    corpusVersion: version,
    riskScore: riskScore(lint, findings),
    riskBreakdown: riskBreakdown(lint, findings),
    lint,
    findings,
    manual,
    notChecked: [...notChecked, ...lintDenetlenmedi, ...vitrin.notChecked],
    huni,
    lessons: { active: active.length, draft: draftCount, coverageGaps },
    // Beyanlar ve seçim muhasebesi rapora giriyor: "kaç kural çalıştı" tek
    // başına kapsam gibi okunuyor, oysa asıl bilgi ÇALIŞMAYANLARDA.
    beyan: META_KEYS.map((k) => ({
      alan: k,
      etiket: kosulEtiketi(k),
      deger: sub.meta[k] ?? null,
      kaynak: merged.sources[k] ?? 'bilinmiyor',
    })),
    selection: {
      corpus: cards.length,
      aday: selected.length + manualCards.length + elenen.length,
      modele: selected.length,
      calisti: rulesRun,
      // KART sayısı — `manual` dizisi kartların yanına in-app derslerden gelen
      // maddeleri de alıyor. Onları da sayarsak modele+elle+elenen toplamı
      // aday sayısını aşıyor ve muhasebe tutmuyordu.
      elleKontrol: manualCards.length,
      elenen,
      ...(input.onlyRules?.length ? { filtre: selected.map((c) => c.id) } : {}),
    },
    stats: {
      rulesSelected: selected.length,
      rulesRun,
      rawFindings: raw,
      afterGrounding: afterGround,
      afterVerify: findings.length,
    },
  }

  const markdown = renderMarkdown(report)
  const jsonPath = outPath.replace(/\.md$/, '.json')
  await mkdir('out', { recursive: true })
  await writeFile(outPath, markdown)
  await writeFile(jsonPath, JSON.stringify(report, null, 2))
  step(`rapor: ${outPath}`)

  return {
    report,
    submission: sub,
    markdown,
    metaSources,
    files: { markdown: outPath, json: jsonPath, snapshot: snapshotPath },
  }
}
