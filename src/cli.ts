#!/usr/bin/env node
// .env'i yükle. Node bunu kendiliğinden yapmaz; bağımlılık eklemeye de gerek
// yok — process.loadEnvFile yerleşik. Dosya yoksa sessizce geç.
try {
  process.loadEnvFile('.env')
} catch {
  /* .env yok — ortam değişkenleri doğrudan verilmiş olabilir */
}

import { writeFile, mkdir } from 'node:fs/promises'
import { loadFixture, fetchFromAppStoreConnect } from './fetch/index.js'
import {
  loadAppConfig, saveAppConfig, listAppConfigs, mergeMeta, META_KEYS,
  type AppMeta,
} from './fetch/app-meta.js'
import { META_FIELDS, META_GROUPS, metaFromArgs } from './meta-fields.js'
import { runLint } from './lint/index.js'
import { loadCorpus } from './corpus/index.js'
import { selectRules } from './check/select.js'
import { groundFindings } from './check/ground.js'
import { riskScore, renderMarkdown, dedupeFindings } from './report/index.js'
import { createProvider } from './llm/index.js'
import { createLessonStore, type Lesson } from './lessons/index.js'
import type { Report, Finding, RuleCard, ManualCheck, FindingExample } from './types.js'

const args = process.argv.slice(2)
const cmd = args[0]

async function main() {
  if (cmd === 'corpus') return cmdCorpus()
  if (cmd === 'check') return cmdCheck()
  if (cmd === 'learn') return cmdLearn()
  if (cmd === 'lessons') return cmdLessons()
  if (cmd === 'kapsam') return cmdKapsam()
  if (cmd === 'meta') return cmdMeta()
  if (cmd === 'yalanci-alarm') return cmdYalanciAlarm()
  if (cmd === 'kart-canlilik') return cmdKartCanlilik()
  if (cmd === 'yakalama') return cmdYakalama()
  if (cmd === 'madde') return cmdMadde()
  if (cmd === 'vitrin') return cmdVitrin()
  usage()
}

function usage() {
  console.log(`
Greenlight — Store Policy Checker

  npm run check -- --app <appId>     App Store Connect'ten canlı çek
  npm run check -- --fixture <path>  dosyadan oku

    --locale <kod>      denetlenecek dil (varsayılan: uygulamanın birincil dili)
    --territory <ülke>  fiyatların okunacağı ülke (varsayılan: USA)
    --no-llm            sadece kesin kontroller (LLM turu yok)
    --llm <backend>     ollama (varsayılan) | anthropic
    --model <ad>        ör. qwen3:8b, qwen2.5:14b
    --out <path>        rapor yolu (varsayılan out/report.md)

  npm run corpus        kural kitabını doğrula ve listele
  npm run corpus -- --yonerge
                        Apple'ın hangi maddesinde kart YOK — kapsama raporu

  npm run vitrin -- <appId> [--country us]
                        Herkese açık App Store vitrini — anahtar/oturum YOK.
                        Yayındaki sürümü ve IAP fiyatlarını gösterir.
                        Hazırlanan sürüm buradan GÖRÜNMEZ.

  npm run madde -- 2.3.3             Apple'ın o maddedeki KENDİ metni
  npm run madde -- --ara screenshot  metinde geçen maddeleri ara
  npm run madde                      bölüm ve madde listesi
                        Kaynak: data/apple-guidelines.json.
                        Yenilemek için: npm run guidelines

  npm run learn -- --paste [--app Glamio]     panodaki metni işle (macOS)
                       [--force]              girdi kontrolünü atla
  npm run learn -- <reject.txt>               tek dosya
  npm run learn -- --dir rejects/             klasördeki hepsi
  npm run kapsam                             geçmiş redler vs kural kitabı (tavan)
  npm run kapsam -- --yedek yedek.json       eklenti yedeğinden
  pbpaste | npm run learn -- --stdin          boru hattı

                        Ham red metnini ders olarak işler: yeni bir kalıpsa
                        yeni ders açar, bilinen bir kalıpsa mevcut dersin
                        örneği olarak ekler.

  npm run meta                       kayıtlı uygulama bilgilerini listele
  npm run meta -- --app <id> --ai-content --ugc
                        API'nin bilemediği alanları apps/<id>.json'a yaz.
                        Bayrakların tamamı: npm run meta -- --alanlar
                        check sırasında da aynı bayraklar geçerli (tek seferlik).

  npm run yalanci-alarm -- out/submission-<id>.json [...]
                        Kart bazında gürültü ölçümü: ham → alıntı doğrulama →
                        ikinci göz → tekrar. Model çağrısı yapar; ONAY ŞART:
                        --onayla eklenmeden yalnız maliyeti gösterir.
                        --llm/--model, --out ile kayıt yolu.
                        --kartlar a,b  yalnız o kartları koştur (tanı koşusu);
                        taban dosyası ezilmez, fark yalnız o kartlarda gösterilir.

  npm run kart-canlilik              her kart KENDİ ihlal örneğinde ateşliyor mu
                        1. aşama bedava (seçim), 2. aşama --onayla ile model.

  npm run yakalama                   kart, GERÇEKTEN reddedilen metinde ateşliyor mu
                        Girdi: ders havuzundaki red vakalarının alıntıları.
                        1. aşama bedava (seçim), 2. aşama --onayla ile model.

  npm run lessons                    dersleri listele
  npm run lessons -- approve <id>    taslak dersi aktifleştir
  npm run lessons -- retire <id>     dersi emekliye ayır
  npm run lessons -- reindex         eksik/bayat ders vektörlerini gömer
  npm run lessons -- push            yereldeki dersleri ortak havuza taşı
                        --kuru       hiçbir şey yazma, ne olacağını göster
`)
  process.exit(1)
}

async function cmdCorpus() {
  const { cards, version } = await loadCorpus()

  // "Apple'ın yazdığı hangi maddede kartımız yok?" — kural kitabının kendi
  // kapsama raporu. Red kapsama raporundan (npm run kapsam) ayrı bir soru.
  if (args.includes('--yonerge')) {
    const { loadGuidelines } = await import('./corpus/guidelines-node.js')
    const { guidelineCoverage } = await import('./eval/guideline-coverage.js')
    const doc = await loadGuidelines()
    const r = guidelineCoverage(doc, cards)
    const oran = Math.round(((r.kuralliMadde - r.bosluklar.length) / r.kuralliMadde) * 100)
    console.log(
      `Yönerge: ${doc.sections.length} madde (Apple: ${doc.lastUpdated}) · ` +
        `kural taşıyan: ${r.kuralliMadde}\n` +
        `Kart: ${r.toplamKart} · kartı olan madde: ${r.kuralliMadde - r.bosluklar.length} (%${oran})\n`,
    )
    if (r.bosluklar.length) {
      console.log(`Kartı olmayan ${r.bosluklar.length} madde:`)
      for (const b of r.bosluklar) console.log(`  ✗ ${b.id.padEnd(12)} ${b.title}`)
      console.log()
    }
    if (r.gecersizAtiflar.length) {
      console.log('Yönergede bulunamayan madde atıfları (yazım hatası ya da Apple kaldırmış):')
      for (const g of r.gecersizAtiflar) console.log(`  ⚠ ${g.kart} → ${g.madde}`)
      console.log()
    }
    console.log(
      'UYARI: bu bir KAPSAMA TAVANI, kalite ölçüsü değil. Maddede kart olması,\n' +
        'kartın o maddedeki her şeyi sorduğu anlamına gelmez — ve bu sayı ölçüt\n' +
        'hâline gelirse ince kart yazmaya iter.\n' +
        'DIŞARIYA GÖSTERİLECEK SAYI BU DEĞİL: "yediğim redlerin kaçını bilirdik"\n' +
        'sorusunu yalnızca `npm run kapsam` cevaplıyor.',
    )
    return
  }
  console.log(`Corpus sürümü: ${version}  (${cards.length} kart)\n`)
  for (const c of cards) {
    const flags = [c.scope, c.outcome, c.defaultSeverity].join('/')
    console.log(`  ${c.id.padEnd(42)} ${flags.padEnd(24)} ${c.source.doc} ${c.source.section}`)
  }
}

/**
 * Apple'ın madde metnini göster.
 *
 * NEDEN CLI'da: red mektubu "Guideline 2.3.3" diyor ve insan o an ne
 * yazdığını görmek istiyor. Tarayıcı açıp sayfada aramak yerine tek komut —
 * ve gösterilen metin, denetimin modele verdiği metnin AYNISI olmalı ki
 * "bana şunu gösterdi ama şuna göre denetledi" durumu doğmasın.
 */
async function cmdMadde() {
  const { loadGuidelines } = await import('./corpus/guidelines-node.js')
  const { findSection, sectionWithChildren } = await import('./corpus/guidelines.js')
  const doc = await loadGuidelines()
  const ara = flag('--ara')
  const ref = args.slice(1).find((a) => !a.startsWith('--') && a !== ara)

  console.log(`Apple App Review Guidelines · ${doc.lastUpdated} · ${doc.sections.length} madde`)
  console.log(`çekim: ${doc.retrievedAt} · parmak izi: ${doc.digest}\n`)

  if (ara) {
    const q = ara.toLowerCase()
    const hits = doc.sections.filter(
      (x) => x.text.toLowerCase().includes(q) || x.title.toLowerCase().includes(q),
    )
    console.log(`"${ara}" → ${hits.length} madde\n`)
    for (const h of hits) {
      const at = h.text.toLowerCase().indexOf(q)
      const snip = at < 0 ? h.title : h.text.slice(Math.max(0, at - 60), at + 100).replace(/\n/g, ' ')
      console.log(`  ${h.id.padEnd(10)} ${h.title || '—'}`)
      console.log(`             …${snip}…\n`)
    }
    return
  }

  if (!ref) {
    for (const c of doc.chapters) {
      console.log(`${c.number ? c.number + '.' : ''} ${c.title}`)
      for (const s of doc.sections.filter((x) => x.chapter === c.number && x.parent === c.number)) {
        console.log(`   ${s.id.padEnd(8)} ${s.title}`)
      }
    }
    return
  }

  const hit = findSection(doc, ref)
  if (!hit) {
    // Uydurma metin göstermektense boş dönmek doğrudur.
    console.error(`Madde bulunamadı: ${ref}. "npm run madde" ile listeye bak.`)
    process.exit(1)
  }
  console.log(`${hit.id} ${hit.title}   [${hit.chapterTitle}]`)
  console.log(hit.url + '\n')
  console.log(sectionWithChildren(doc, hit.id))
  if (hit.links.length) {
    console.log('\nBağlantılar:')
    for (const l of hit.links) console.log(`  - ${l.text}: ${l.href}`)
  }
}

/**
 * Vitrin çekimi — anahtarsız yol ne veriyor, gözle görülsün.
 *
 * Bu komut denetim yapmıyor; "elimizde anahtar yokken neyi biliyoruz"
 * sorusunun cevabını basıyor. Fiyat satırları özellikle önemli: ASC'den
 * okunamayan bir fiyatın gerçekte ne olduğunu buradan doğrulayabiliyoruz.
 */
async function cmdVitrin() {
  const appId = args.slice(1).find((a) => !a.startsWith('--')) ?? flag('--app')
  if (!appId) usage()
  const { fetchPublicListing } = await import('./fetch/public-store.js')
  const listing = await fetchPublicListing(appId!, { country: flag('--country') ?? 'us' })

  console.log(`${listing.name}  (${listing.bundleId})`)
  console.log(`${listing.url}\n`)
  console.log(`sürüm       ${listing.version}`)
  console.log(`satıcı      ${listing.sellerName}`)
  console.log(`kategori    ${listing.categories.join(', ')}`)
  console.log(`yaş sınırı  ${listing.ageRating}${listing.advisories.length ? ' — ' + listing.advisories.join('; ') : ''}`)
  console.log(`fiyat       ${listing.formattedPrice} (${listing.currency})`)
  console.log(`puan        ${listing.ratingAverage?.toFixed(2) ?? '—'} / ${listing.ratingCount ?? 0} oy`)
  console.log(`diller      ${listing.languages.join(', ')}`)
  console.log(`görseller   ${listing.screenshots.length} iPhone + ${listing.ipadScreenshots.length} iPad`)
  console.log(`açıklama    ${listing.description.length} karakter`)
  console.log(`sürüm notu  ${listing.releaseNotes.length} karakter`)

  console.log(`\nUygulama içi satın almalar (${listing.iaps.length})`)
  for (const p of listing.iaps) {
    console.log(`  ${p.name.padEnd(34)} ${p.priceText.padStart(10)}  ${p.price ?? '(okunamadı)'}`)
  }
  if (!listing.iaps.length) console.log('  (yok)')

  if (listing.warnings.length) {
    console.log('\nUyarılar')
    for (const w of listing.warnings) console.log(`  ⚠ ${w}`)
  }
  console.log(`\nkaynaklar: ${listing.sources.join(' , ')}`)
}

async function cmdCheck() {
  const fixture = flag('--fixture')
  const appId = flag('--app')
  if (!fixture && !appId) usage()

  // Mantığın tamamı check/run.ts'te — arayüz de aynı fonksiyonu çağırıyor.
  // Burası yalnızca bayrakları çevirip ilerlemeyi stderr'e basıyor.
  const { runAudit } = await import('./check/run.js')
  const { markdown } = await runAudit(
    {
      appId,
      fixture,
      locale: flag('--locale'),
      territory: flag('--territory'),
      metaOverrides: metaFromFlags(),
      noLlm: args.includes('--no-llm'),
      llmBackend: flag('--llm'),
      llmModel: flag('--model'),
      outPath: flag('--out') ?? 'out/report.md',
    },
    (e) => {
      const prefix = e.level === 'warn' ? '  ⚠ ' : e.level === 'detail' ? '     ' : '→ '
      console.error(prefix + e.text)
    },
  )
  console.error()
  console.log(markdown)
}

async function cmdLearn() {
  const all = await collectRejectTexts()
  if (!all.length) usage()

  const force = args.includes('--force')
  const inputs: typeof all = []
  for (const input of all) {
    const check = looksLikeReject(input.text)
    if (check.ok || force) {
      inputs.push(input)
      continue
    }
    console.error(`✗ ${input.label}: ${check.reason} — atlandı.`)
    console.error(`  ilk satır: ${input.text.trim().split('\n')[0]?.slice(0, 80)}`)
  }
  if (!inputs.length) {
    console.error()
    console.error('İşlenecek red metni yok.')
    console.error('Resolution Center mesajını KIRPMADAN kopyala; "Guideline", "Next Steps"')
    console.error('gibi başlıklar çıkarımı besliyor.')
    console.error('Kontrolü atlamak için: --force')
    process.exit(1)
  }

  const llm = await createProvider()
  const health = await llm.healthcheck()
  if (!health.ok) throw new Error(health.reason)

  const store = await createLessonStore()
  await store.healthcheck()
  const { cards } = await loadCorpus()
  const { ingestReject } = await import('./lessons/ingest.js')
  const { createEmbedder } = await import('./lessons/embed.js')
  const { reviewMode } = await import('./lessons/review.js')

  // Gömme istemcisi DÖNGÜ DIŞINDA kuruluyor: her metin için yeniden kurmak
  // bir şey bozmazdı ama vektör önbelleği de her seferinde sıfırdan okunurdu.
  const embedder = createEmbedder()
  const mod = reviewMode()

  console.error(
    `→ ${inputs.length} red metni işlenecek (${llm.name}/${llm.model}, depo: ${store.name})`,
  )
  console.error(
    `  eşleştirme: madde numarası` +
      (embedder ? ` + anlamsal (${embedder.name}/${embedder.model})` : ' (anlamsal KAPALI — VOYAGE_API_KEY yok)') +
      ` · ikinci tur: ${mod}`,
  )

  const drafts: string[] = []
  const gaps: string[] = []
  const inApp: string[] = []

  for (const [i, input] of inputs.entries()) {
    console.error(`\n[${i + 1}/${inputs.length}] ${input.label}`)
    let r
    try {
      r = await ingestReject(llm, store, input.text, cards, {
        appName: flag('--app'), embedder, reviewMode: mod,
      })
    } catch (e) {
      // Tek bozuk metin tüm partiyi düşürmesin — hangisi patladı, söyle ve devam et.
      console.error(`  ✗ işlenemedi: ${(e as Error).message}`)
      continue
    }

    console.log(r.kind === 'new-lesson' ? '✚ YENİ DERS' : '＋ MEVCUT DERSE ÖRNEK')
    console.log(`  id        ${r.lesson.id}`)
    console.log(`  madde     ${r.lesson.platform} ${r.lesson.guideline} · ${r.lesson.artifact ?? '—'}`)
    console.log(`  kapsam    ${r.lesson.scope}${r.lesson.scope === 'in-app' ? ' (listing denetimi göremez)' : ''}`)
    console.log(`  kart      ${r.lesson.ruleId ?? (r.lesson.scope === 'in-app' ? '— (aranmaz)' : '⚠ YOK')}`)
    console.log(`  gerekçe   ${r.matchReason}`)
    console.log(`  ders      ${r.extracted.summary}`)
    for (const sg of r.extracted.signals ?? []) console.log(`  belirti   ${sg}`)
    if (r.extracted.falsePositive) console.log(`  sayılmaz  ${r.extracted.falsePositive}`)

    // Aday havuzu: anlamsal arama gerçekten bir şey getirdi mi? Getirmediyse
    // de görünsün — "açtım ama işe yaramıyor" ile "kapalı" farklı şeyler.
    const havuz = [`${r.matching.exact} madde eşleşmesi`]
    if (r.matching.embedder) {
      havuz.push(
        r.matching.near.length
          ? `${r.matching.near.length} anlamsal (${r.matching.near.map((n) => `${n.id}@${n.score.toFixed(2)}`).join(', ')})`
          : '0 anlamsal',
      )
    }
    console.log(`  aday      ${havuz.join(' · ')}`)

    // İkinci turun izi. Sessizce düzeltilen alan, denetlenemeyen alandır.
    if (r.review.doubts.length || r.review.droppedExcerpt) {
      const ne = r.review.changed.length
        ? `düzeltti: ${r.review.changed.join(', ')}`
        : r.review.reviewed ? 'değişiklik yok' : 'koşmadı'
      console.log(`  2. tur    ${r.review.doubts.length} şüphe → ${ne}`)
      for (const d of r.review.doubts) console.log(`            · ${d.field}: ${d.reason}`)
      if (r.review.droppedExcerpt) {
        console.log(`  ⚠ alıntı  ham metinde bulunamadı, SİLİNDİ: "${r.review.droppedExcerpt.slice(0, 70)}"`)
      }
    }

    if (r.coverageGap && !gaps.includes(r.lesson.id)) gaps.push(r.lesson.id)
    if (r.lesson.scope === 'in-app' && !inApp.includes(r.lesson.id)) inApp.push(r.lesson.id)
    if (r.lesson.status === 'draft' && !drafts.includes(r.lesson.id)) drafts.push(r.lesson.id)
  }

  if (gaps.length) {
    console.log()
    console.log(`⚠ KAPSAMA BOŞLUĞU (${gaps.length}) — bu red'ler hiçbir kartla eşleşmiyor:`)
    for (const id of gaps) console.log(`   ${id}`)
    console.log('   Bunlar için kural kartı yazılmalı.')
  }
  if (inApp.length) {
    console.log()
    console.log(`◆ UYGULAMA İÇİ (${inApp.length}) — listing denetimi bunları yakalayamaz:`)
    for (const id of inApp) console.log(`   ${id}`)
    console.log('   Kart yazılmaz; onaylanırsa raporda elle kontrol maddesi olarak çıkar.')
  }
  if (drafts.length) {
    console.log()
    console.log(`${drafts.length} ders onay bekliyor. Denetimde kullanmak için:`)
    for (const id of drafts) console.log(`   npm run lessons -- approve ${id}`)
  }
}

/**
 * Girdi gerçekten bir red metni mi?
 *
 * Yapıştırma akışında yanlış şey kopyalamak sık: terminal çıktısı, boş pano,
 * alakasız metin. Kontrol etmezsek API çağrısı harcanır, model boş alanlarla
 * bir şeyler uydurur ve ortaya anlamsız bir ders çıkar.
 */
function looksLikeReject(text: string): { ok: true } | { ok: false; reason: string } {
  const t = text.trim()
  if (t.length < 80) return { ok: false, reason: `çok kısa (${t.length} karakter)` }

  // Kabuk çıktısı: komut istemi veya npm/tsx satırları
  if (/^\S+@\S+\s+.*%\s/m.test(t) || /^>\s*\S+@\d|\bnpm run\b/m.test(t)) {
    return { ok: false, reason: 'terminal çıktısına benziyor' }
  }

  const markers = [
    /guideline\s+\d/i, /app review/i, /resolution center/i, /we (noticed|found)/i,
    /your app/i, /next steps/i, /policy (violation|issue)/i, /rejected/i,
    /submission id/i, /google play/i, /developer policy/i, /uygulaman[ıi]z/i,
    /reddedil/i, /politika ihlali/i,
  ]
  const hits = markers.filter((re) => re.test(t)).length
  if (hits < 2) {
    return { ok: false, reason: 'red bildirimine özgü ifade bulunamadı' }
  }
  return { ok: true }
}

/**
 * Red metni üç yoldan gelebilir. Gerçek akış kopyala-yapıştır olduğu için
 * dosyaya kaydettirmek gereksiz sürtüşme — hangisini kullanırsan kullan,
 * ham metin depoya olduğu gibi yazılır, kaynak izi kaybolmaz.
 */
async function collectRejectTexts(): Promise<Array<{ label: string; text: string }>> {
  const { readFile, readdir } = await import('node:fs/promises')
  const { join } = await import('node:path')

  // 1) Panodan (macOS)
  if (args.includes('--paste')) {
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const { stdout } = await promisify(execFile)('pbpaste')
    if (!stdout.trim()) throw new Error('Pano boş.')
    return [{ label: 'pano', text: stdout }]
  }

  // 2) Boru hattından:  pbpaste | npm run learn -- --stdin
  if (args.includes('--stdin') || args[1] === '-') {
    const chunks: Buffer[] = []
    for await (const c of process.stdin) chunks.push(c as Buffer)
    const text = Buffer.concat(chunks).toString('utf8')
    if (!text.trim()) throw new Error('stdin boş.')
    return [{ label: 'stdin', text }]
  }

  // 3) Klasördeki tüm metinler (toplu işleme)
  const dir = flag('--dir')
  if (dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = entries.filter((e) => e.isFile() && /\.(txt|md)$/i.test(e.name))
    if (!files.length) throw new Error(`${dir} içinde .txt/.md yok.`)
    return Promise.all(
      files.map(async (f) => ({
        label: join(dir, f.name),
        text: stripBom(await readFile(join(dir, f.name), 'utf8')),
      })),
    )
  }

  // 4) Tek dosya
  const file = args[1]
  if (!file || file.startsWith('--')) return []
  return [{ label: file, text: stripBom(await readFile(file, 'utf8')) }]
}

/**
 * UTF-8 BOM'unu at.
 *
 * Eklenti indirdiği .txt'lere BOM koyuyor — koymazsa macOS metni Latin-1
 * sanıp bozuk gösteriyor. Ama BOM okurken kalırsa metnin ilk karakteri
 * görünmez bir işaret olur; "App:" satırı artık satır başında değildir ve
 * çıkarım kalıpları sessizce tutmaz.
 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

async function cmdLessons() {
  // push'tan ÖNCE hiçbir depo kurulmuyor: bu komutun kaynağı ve hedefi
  // sabit (yerel → havuz), GREENLIGHT_STORE'un ne dediğinden bağımsız.
  // Aksi hâlde havuza geçmiş biri taşımayı çalıştırdığında havuzdan havuza
  // kopyalamaya çalışırdı.
  if (args[1] === 'push') return cmdPush()

  const store = await createLessonStore()
  await store.healthcheck()
  const sub = args[1]

  if (sub === 'reindex') return cmdReindex(store)

  if (sub === 'approve' || sub === 'retire') {
    const id = args[2]
    if (!id) usage()
    await store.updateLessonStatus(id!, sub === 'approve' ? 'active' : 'retired')
    console.log(`${id} → ${sub === 'approve' ? 'active' : 'retired'}`)
    return
  }

  const lessons = await store.allLessons()
  if (!lessons.length) {
    console.log('Henüz ders yok. Ham bir red metnini işlemek için:')
    console.log('  npm run learn -- rejects/ornek.txt --app Glamio')
    return
  }
  console.log(`${lessons.length} ders (depo: ${store.name})\n`)
  for (const l of lessons) {
    const mark = l.status === 'active' ? '●' : l.status === 'draft' ? '○' : '×'
    const gap = l.ruleId || l.scope === 'in-app' ? '' : '  ⚠ kapsama boşluğu'
    const scope = l.scope === 'in-app' ? ' · ◆ in-app' : ''
    console.log(`${mark} ${l.id}`)
    console.log(`   ${l.platform} ${l.guideline}${scope} · ${l.exampleCount} örnek · kart: ${l.ruleId ?? '—'}${gap}`)
    console.log(`   ${l.summary}`)
    for (const sg of l.signals ?? []) console.log(`   · ${sg}`)
    console.log()
  }
  console.log('● aktif   ○ onay bekliyor   × emekli   ◆ uygulama içi (elle kontrol)')

  // Vektörsüz ders = anlamsal aramaya GÖRÜNMEZ ders. Sessiz kalırsa "açtım
  // ama hâlâ kopya açıyor" diye geri döner; sebebi burada görünsün.
  const { createEmbedder } = await import('./lessons/embed.js')
  const embedder = createEmbedder()
  if (!embedder) {
    console.log('\nAnlamsal eşleştirme KAPALI (VOYAGE_API_KEY yok) — yalnızca madde numarası eşleşiyor.')
    return
  }
  const vectored = new Set((await store.readVectors()).map((v) => v.lessonId))
  const eksik = lessons.filter((l) => l.status !== 'retired' && !vectored.has(l.id))
  if (eksik.length) {
    console.log(`\n⚠ ${eksik.length} dersin vektörü yok — anlamsal aramada görünmüyorlar.`)
    console.log('   npm run lessons -- reindex')
  }
}

/**
 * Vektörleri tamamla.
 *
 * `ensureVectors` eksik ve BAYAT olanları tek toplu çağrıda gömüyor; hepsi
 * güncelse tek bir ağ isteği bile atılmaz. Bu komut aslında bir kolaylık:
 * `learn` zaten kendi kendini onarıyor. Anahtarı sonradan ekleyip biriken
 * dersleri tek seferde görünür yapmak için var.
 */
async function cmdReindex(store: Awaited<ReturnType<typeof createLessonStore>>) {
  const { createEmbedder, ensureVectors } = await import('./lessons/embed.js')
  const embedder = createEmbedder()
  if (!embedder) {
    console.error('VOYAGE_API_KEY yok — gömülecek bir şey yok.')
    console.error('Anahtarsız kurulumda eşleştirme yalnızca madde numarasıyla çalışır.')
    process.exit(1)
  }

  const lessons = (await store.allLessons()).filter((l) => l.status !== 'retired')
  if (!lessons.length) {
    console.log('Ders yok.')
    return
  }

  const t0 = Date.now()
  const { embedded } = await ensureVectors(store, embedder!, lessons)
  console.log(
    `${lessons.length} ders · ${embedded} yeniden gömüldü · ${lessons.length - embedded} zaten güncel` +
      ` (${embedder!.model}, ${embedder!.dim} boyut, ${Math.round((Date.now() - t0) / 100) / 10}s)`,
  )
}

/**
 * `--ai-content` açar, `--no-ai-content` kapatır, hiçbiri yoksa dokunmaz.
 * Üçüncü hâl şart: "false" ile "bilinmiyor" farklı sonuçlar doğuruyor.
 *
 * Bayrak listesi `meta-fields.ts`ten geliyor; burada elle tutulan bir kopya
 * kaldığında yeni alanın bayrağı olmuyor ve kullanıcı terminalden o alanı
 * hiç dolduramıyordu.
 */
function metaFromFlags(): AppMeta {
  return metaFromArgs(args)
}

/** `npm run meta` çıktısında bayrakları göster — hangi alanı nasıl yazacağı. */
function metaFlagHelp(): string {
  return META_FIELDS.map((f) => `--${f.flag} / --no-${f.flag}  ${f.label}`).join('\n    ')
}

/**
 * Kapsam raporu — "geçmişte yediğim redlerin kaçını kural kitabı bilirdi?"
 *
 * Girdi: eklentinin ürettiği red metinleri (bir klasör dolusu .txt) ya da
 * eklentiden alınan yedek JSON'u.
 *
 * ÇIKTI BİR TAVANDIR, yakalama oranı değil. Kart yoksa o red KESİNLİKLE
 * yakalanmazdı; kart varsa yakalanmış OLABİLİR. Rapor bunu her yerde yazıyor
 * ve sen de yazmadan bu sayıyı kimseye gösterme.
 */
async function cmdKapsam() {
  const { readFile, readdir } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const { coverage, kapsamOrani } = await import('./eval/coverage.js')
  const { cards } = await loadCorpus()

  const yedek = flag('--yedek')
  const dir = flag('--dir') ?? 'rejects'
  let rejects: Array<{ id: string; guideline?: string | null; appName?: string; text?: string }> = []

  if (yedek) {
    // Eklentinin "Tam yedek" / "Paylaşılabilir kopya" dosyası.
    const veri = JSON.parse(await readFile(yedek, 'utf8'))
    if (!Array.isArray(veri?.rejects)) throw new Error(`${yedek}: içinde "rejects" dizisi yok.`)
    rejects = veri.rejects
  } else {
    // Klasördeki .txt'ler. Madde kodunu metnin kendisinden okuyoruz:
    // eklenti "Guideline: 2.3.3" satırını yazıyor.
    let entries: string[]
    try {
      entries = (await readdir(dir)).filter((f) => f.endsWith('.txt'))
    } catch {
      throw new Error(`${dir}/ okunamadı. Eklentiden "Hepsini indir (.txt)" ile dosyaları al ya da --yedek ver.`)
    }
    for (const f of entries) {
      const text = await readFile(join(dir, f), 'utf8')
      const m = /^\s*Guideline:?\s*([\d.]+)/im.exec(text)
      const ad = /^\s*(?:App|Uygulama):?\s*(.+)$/im.exec(text)?.[1]?.trim()
      rejects.push({ id: f, guideline: m?.[1] ?? '', appName: ad, text })
    }
  }

  const r = coverage(rejects, cards)
  const oran = kapsamOrani(r)

  console.log()
  console.log(`Kural kitabı: ${cards.length} kart`)
  console.log(`Red kaydı:    ${r.toplamRed}  (${r.kodlu} madde kodlu, ${r.kodsuz} kodsuz)`)
  console.log()
  console.log('  ⚠ BU BİR TAVANDIR, YAKALAMA ORANI DEĞİL.')
  console.log('    kart yok → o red KESİNLİKLE yakalanmazdı.')
  console.log('    kart var → yakalanmış OLABİLİR; kartın sorusu o somut soruna')
  console.log('               denk gelmeyebilir ve pek çok red listing\'den hiç görülmez')
  console.log('               (çöken build, çalışmayan demo hesap, uygulama içi akış).')
  console.log()
  if (oran !== null) {
    console.log(`Kapsam tavanı: %${oran}  (${r.kartiOlan}/${r.kodlu} kodlu red için en az bir kart var)`)
    console.log()
  }
  for (const u of r.uyarilar) console.log(`  ⚠ ${u}`)
  if (r.uyarilar.length) console.log()

  if (r.bosluklar.length) {
    console.log(`── BOŞLUK: kartı olmayan ${r.bosluklar.length} madde ──────────────────`)
    console.log('   (yol haritası: en çok red yediğinden başla)')
    console.log()
    for (const b of r.bosluklar) {
      console.log(`  ${b.madde.padEnd(8)} ${String(b.redSayisi).padStart(3)} red   ${b.uygulamalar.join(', ')}`)
      if (b.ornek) console.log(`           ${b.ornek}`)
      console.log()
    }
  }

  if (r.kapsananlar.length) {
    console.log('── Kartı olan maddeler ─────────────────────────────────────')
    for (const k of r.kapsananlar) {
      console.log(`  ${k.madde.padEnd(8)} ${String(k.redSayisi).padStart(3)} red   → ${k.kartlar.join(', ')}`)
    }
    console.log()
  }
}

/**
 * Yalancı alarm ölçümü.
 *
 * NEDEN ONAY ŞART: bu komut gerçek model çağrısı yapıyor ve parası harcanan
 * kişi kullanıcı. Onaysız koşuda yalnız NE KADAR çağrı yapılacağını
 * hesaplıyoruz — bütçeyi görmeden başlatmıyoruz.
 *
 * NEDEN BORU HATTINI TEKRAR KURMUYORUZ: ölçüm `runAudit`in ürettiği huni
 * üzerinden yapılıyor. İkinci bir kopya zamanla ayrışır ve hangi sonucun
 * doğru olduğu bilinmez.
 */
async function cmdYalanciAlarm() {
  const { readFile, writeFile, mkdir } = await import('node:fs/promises')
  const { loadFixture } = await import('./fetch/index.js')
  const { selectRules } = await import('./check/select.js')
  const {
    ornekSatiri, orneklemUyarilari, birlestirHuni, toplamHuni, gurultuAdaylari, karsilastir,
    esikSenaryolari,
  } = await import('./eval/false-positive.js')

  const kaynaklar = args.slice(1).filter((a) => !a.startsWith('--') && /\.json$/.test(a))
  if (!kaynaklar.length) {
    console.log('Kullanım: npm run yalanci-alarm -- out/submission-<id>.json [...]')
    console.log('Anlık görüntü üretmek bedava: npm run check -- --app <id> --no-llm')
    process.exit(1)
  }

  const { cards, version } = await loadCorpus()
  // Tanı koşusu: yalnız belirli kartlar. "Bu kart mı bozuk, model mi zayıf"
  // sorusunu 20 çağrıyla cevaplamak için — tam koşuyu tekrarlamadan.
  const kartFiltre = (flag('--kartlar') ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  const subs = await Promise.all(
    kaynaklar.map(async (k) => ({ kaynak: k, sub: await loadFixture(k) })),
  )
  const ornekler = subs.map(({ sub, kaynak }) => ornekSatiri(sub, kaynak))

  console.log('\nÖrneklem:')
  for (const o of ornekler) {
    console.log(
      `  ${o.appName} (${o.appId}) · ${o.category || 'kategori yok'} · ` +
        `${o.metinUzunlugu} krkt · ${o.ekran} ekran · ${o.iap} IAP`,
    )
    if (o.uyari) console.log(`     ⚠ ${o.uyari}`)
  }
  const uyarilar = orneklemUyarilari(ornekler)
  if (uyarilar.length) {
    console.log('\nÖrneklem uyarıları:')
    for (const u of uyarilar) console.log(`  ⚠ ${u}`)
  }

  // Maliyet: kaç kart modele gidecek. Verify turu bulgu başına 3 oy — kaç
  // bulgu çıkacağını önceden bilemeyiz, o yüzden aralık veriyoruz.
  let kartToplam = 0
  console.log('\nModele gidecek kart:')
  for (const { sub, kaynak } of subs) {
    const { llm } = selectRules(sub, cards)
    const kosacak = kartFiltre.length ? llm.filter((c) => kartFiltre.includes(c.id)) : llm
    kartToplam += kosacak.length
    const eksik = kartFiltre.filter((id) => !llm.some((c) => c.id === id))
    console.log(
      `  ${sub.appName}: ${kosacak.length} kart` +
        (kartFiltre.length ? ` (filtre: ${kartFiltre.length} istendi)` : '') +
        `  (${kaynak})`,
    )
    if (eksik.length) console.log(`     ⚠ bu listing'de seçilmeyen: ${eksik.join(', ')}`)
  }
  if (kartFiltre.length) {
    console.log(
      '\n⚠ FİLTRELİ KOŞU: sonuç tam denetim değil. Kayıt ayrı dosyaya yazılır,\n' +
        '  tam koşu tabanı (out/yalanci-alarm.json) EZİLMEZ; karşılaştırma yalnız\n' +
        '  bu kartlar üzerinden yapılır.',
    )
  }
  console.log(
    `\nToplam ${kartToplam} kart çağrısı + bulgu başına 3 doğrulama oyu.\n` +
      'Görsel kartlar ekran görüntüsü de gönderir; token maliyeti onlarda yüksek.',
  )

  if (!args.includes('--onayla')) {
    console.log('\nBu bir KURU KOŞU — hiçbir model çağrısı yapılmadı.')
    console.log('Gerçekten koşturmak için sonuna --onayla ekle.')
    return
  }

  const { runAudit } = await import('./check/run.js')
  const kosular: Array<{ app: string; huni: any[] }> = []
  let model = ''
  for (const { sub, kaynak } of subs) {
    console.log(`\n── ${sub.appName} denetleniyor ──`)
    const { report } = await runAudit(
      {
        fixture: kaynak,
        llmBackend: flag('--llm'),
        llmModel: flag('--model'),
        ...(kartFiltre.length ? { onlyRules: kartFiltre } : {}),
        outPath: `out/yalanci-alarm-${sub.appId}.md`,
      },
      (e) => {
        if (e.level !== 'detail') console.error(`  ${e.level === 'warn' ? '⚠' : '→'} ${e.text}`)
        if (e.level === 'step' && e.text.startsWith('model: ')) model = e.text.slice(7)
      },
    )
    kosular.push({ app: sub.appName, huni: report.huni ?? [] })
  }

  const kartlar = birlestirHuni(kosular)
  const toplam = toplamHuni(kartlar)
  const kosu = {
    tarih: new Date().toISOString(),
    corpusVersion: version,
    model,
    ornekler,
    toplam,
    kartlar,
    uyarilar,
  }

  // Filtreli koşu tabanı EZMEZ: kısmi bir ölçümü tam koşunun yerine yazmak,
  // sonraki karşılaştırmaların hepsini bozar.
  const outPath =
    flag('--out') ?? (kartFiltre.length ? 'out/yalanci-alarm-filtreli.json' : 'out/yalanci-alarm.json')
  const tabanPath = flag('--taban') ?? 'out/yalanci-alarm.json'
  let onceki: typeof kosu | null = null
  try {
    const ham = JSON.parse(await readFile(tabanPath, 'utf8'))
    // Filtreli koşuda tabanı da aynı kartlara indiriyoruz; yoksa "kayboldu"
    // diye 170 kart listelenir ve fark okunmaz hâle gelir.
    onceki = kartFiltre.length
      ? { ...ham, kartlar: ham.kartlar.filter((k: { ruleId: string }) => kartFiltre.includes(k.ruleId)) }
      : ham
  } catch {
    /* ilk koşu */
  }

  console.log('\n═══ Huni ═══')
  const oran = toplam.ham ? Math.round(((toplam.ham - toplam.kalan) / toplam.ham) * 100) : 0
  console.log(
    `ham ${toplam.ham} → alıntı doğrulama -${toplam.alintiDusen} → ikinci göz -${toplam.ikinciGozDusen}` +
      ` → tekrar -${toplam.tekrarDusen} → KALAN ${toplam.kalan}  (savunma %${oran}'ini eledi)`,
  )
  console.log('\nKart bazında (en çok üretip en az geçiren üstte):')
  for (const k of kartlar.slice(0, 20)) {
    console.log(
      `  ${k.ruleId.padEnd(42)} ham ${String(k.ham).padStart(2)} → kalan ${String(k.kalan).padStart(2)}` +
        `  (alıntı -${k.alintiDusen} · oy -${k.ikinciGozDusen} · tekrar -${k.tekrarDusen})`,
    )
  }
  const senaryolar = esikSenaryolari(kartlar)
  if (senaryolar.length) {
    console.log('\nİkinci göz eşiği (şu an 2 oy) farklı olsaydı kaç bulgu geçerdi:')
    for (const sn of senaryolar) {
      console.log(`  ${sn.esik}/3 oy → ${sn.gecen} bulgu${sn.esik === 2 ? '   ← şu anki eşik' : ''}`)
    }
    console.log('  (Kaçının DOĞRU olduğunu bu tablo söylemez — alıntılara bakmak gerekir.)')
  }

  const gurultu = gurultuAdaylari(kartlar)
  if (gurultu.length) {
    console.log(`\n⚠ Hiç geçemeyen ${gurultu.length} kart — gürültü adayı:`)
    for (const g of gurultu) {
      console.log(`  ${g.ruleId} (${g.ham} ham) — ${g.uygulamalar.join(', ')}`)
      for (const o of g.elenenOrnekler.slice(0, 2)) {
        console.log(`     ${o.asama}${o.oy ? ` ${o.oy}` : ''} [${o.locator}]: "${o.excerpt}"`)
      }
    }
  }

  if (onceki) {
    const farklar = karsilastir(onceki, kosu)
    console.log(
      `\n═══ Taban koşuyla fark (${tabanPath} · ${onceki.tarih.slice(0, 10)} · ` +
        `${onceki.model} · corpus ${onceki.corpusVersion}) ═══`,
    )
    if (onceki.model && onceki.model !== kosu.model) {
      console.log(`  NOT: modeller farklı — "${onceki.model}" → "${kosu.model}".`)
      console.log('  Fark kartın değil MODELİN farkı olabilir; ikisini karıştırma.')
    }
    if (!farklar.length) console.log('  değişiklik yok')
    for (const f of farklar.slice(0, 15)) {
      console.log(
        `  ${f.yon.padEnd(9)} ${f.ruleId.padEnd(42)} ham ${f.oncekiHam}→${f.simdikiHam} · kalan ${f.oncekiKalan}→${f.simdikiKalan}`,
      )
    }
  }

  await mkdir('out', { recursive: true })
  await writeFile(outPath, JSON.stringify(kosu, null, 2))
  console.log(`\n${outPath} yazıldı (corpus ${version}).`)
  console.log(
    'UYARI: bu bir YALANCI ALARM ORANI DEĞİL, bu örneklemin oranı. Elenen bulgu\n' +
      'savunmanın çalıştığını gösterir; savunmayı geçip yine de yanlış olanı\n' +
      'yalnız insan görebilir — yukarıdaki alıntılara bakmadan sayıyı kullanma.',
  )
}

/**
 * Kart canlılık taraması.
 *
 * İki aşama: (1) SEÇİM — kart kendi ihlal örneğinden kurulmuş listing'de
 * seçiliyor mu? Model yok, bedava, anında. (2) --onayla ile MODEL — seçilen
 * kartlar o örnekte gerçekten bulgu üretiyor mu?
 *
 * Birinci aşama tek başına değerli: kartın kendi örneği kendi prefilter'ından
 * ya da needs'inden geçemiyorsa o kart gerçek bir listing'de de hiç açılmaz.
 */
/**
 * Yakalama ölçümü — "kart, Apple'ın gerçekten reddettiği metinde ateşler miydi?"
 *
 * `kapsam` bir TAVAN ölçüyor (kart var mı), `kart-canlilik` kartın KENDİ
 * örneğinde ateşlediğini. Aradaki boşluk buydu ve README'nin "sırada ne var"
 * listesinin ilk maddesiydi. Girdi uydurma değil: ders havuzundaki gerçek red
 * vakalarının `excerpt` alanı — uygulamanın kendi metninden, Apple'ın işaret
 * ettiği parça.
 */
async function cmdYakalama() {
  const { createLessonStore } = await import('./lessons/index.js')
  const {
    yakalamaTaramasi, yakalamaOzeti, yakalamaSubmission,
  } = await import('./eval/detection.js')
  const { cards, version } = await loadCorpus()

  const store = await createLessonStore()
  const saglik = await store.healthcheck()
  if (!saglik.ok) throw new Error(`Ders deposu hazır değil: ${saglik.reason}`)

  // Vakanın kapsamı DERSTEN geliyor: in-app bir ders altındaki vaka listing
  // denetiminden ölçülemez ve bunu bilmeden ölçersek kartı, göremeyeceği bir
  // şeyi kaçırdığı için suçlarız.
  const dersler = new Map((await store.allLessons()).map((l) => [l.id, l]))
  const vakalar = (await store.allExamples()).map((c) => ({
    id: c.id,
    lessonId: c.lessonId,
    appName: c.appName,
    rejectedAt: c.rejectedAt,
    guideline: c.guideline,
    artifact: c.artifact,
    excerpt: c.excerpt ?? '',
    scope: dersler.get(c.lessonId)?.scope ?? 'listing',
  }))

  const satirlar = yakalamaTaramasi(vakalar, cards)
  const o = yakalamaOzeti(satirlar)

  console.log(
    `\nKural kitabı: ${cards.length} kart (corpus ${version})\n` +
      `Ders deposu: ${store.name} · ${o.toplam} red vakası\n`,
  )

  if (!o.toplam) {
    console.log(
      'Havuzda hiç red vakası yok. Ölçüm gerçek redlerle besleniyor:\n' +
        '  npm run learn -- --paste --app <UygulamaAdi>',
    )
    return
  }

  // ÖLÇÜLEMEYENLER ÖNCE. Sayıyı üste koyup "neyi ölçemedik"i altına yazmak,
  // ikincisinin okunmaması demekti (R22'de aynı karar).
  if (o.disarida.length) {
    console.log(`Ölçüm dışı ${o.sinanamaz} vaka:`)
    for (const d of o.disarida) console.log(`  ${String(d.adet).padStart(3)} × ${d.sebep}`)
    console.log()
  }

  if (!o.olculen) {
    console.log(
      'ÖLÇÜLEBİLİR VAKA YOK — bu bir sonuç değil, veri eksikliği.\n\n' +
        'Ölçüm için gereken: listing kapsamlı (in-app değil) ve ALINTISI olan\n' +
        'red vakaları. Alıntı, reddedilen metnin uygulamanın kendi kaydından\n' +
        'alınan parçası; çıkarım onu red metninden buluyor ve doğruluyor.\n\n' +
        'Havuzu besledikçe bu ölçüm anlam kazanır.',
    )
    return
  }

  console.log(
    `Ölçülen ${o.olculen} vaka:\n` +
      `  kart YOK      : ${o.kartYok}  (bu redler kesinlikle yakalanmazdı)\n` +
      `  kart seçildi  : ${o.secildi}  (modele sorulabilir)\n` +
      `  SEÇİLEMEDİ    : ${o.secilemedi}  (kart var ama açılmıyor)`,
  )

  const kartYok = satirlar.filter((s) => s.durum === 'kart-yok')
  if (kartYok.length) {
    console.log('\n⚠ Kapsama boşluğu — kart yazılmadan bu redler yakalanamaz:')
    for (const s of kartYok) {
      console.log(`  ✗ ${s.guideline.padEnd(10)} ${s.appName} (${s.rejectedAt ?? 'tarihsiz'})`)
      console.log(`      "${s.excerpt.slice(0, 90)}"`)
    }
  }

  const secilemedi = satirlar.filter((s) => s.durum === 'secilemedi')
  if (secilemedi.length) {
    console.log('\n⚠ Kart var ama gerçek alıntıda açılmıyor — kurulum sorunu:')
    for (const s of secilemedi) {
      console.log(`  ✗ ${s.guideline.padEnd(10)} ${s.adaylar.join(', ') || '(aday yok)'}`)
      console.log(`      sebep: ${s.sebep}`)
      console.log(`      "${s.excerpt.slice(0, 90)}"`)
    }
  }

  const secildi = satirlar.filter((s) => s.durum === 'secildi')
  if (!args.includes('--onayla')) {
    console.log(
      `\nBuraya kadar model çağrısı YOK. İkinci aşama (kart gerçek alıntıda\n` +
        `bulgu üretiyor mu) ${secildi.length} çağrı eder; koşturmak için --onayla ekle.`,
    )
    console.log(SINIR_NOTU)
    return
  }

  const { createProvider } = await import('./llm/index.js')
  const { runCheck } = await import('./check/check.js')
  const llm = await createProvider({ backend: flag('--llm'), model: flag('--model') })
  const llmSaglik = await llm.healthcheck()
  if (!llmSaglik.ok) throw new Error(`LLM hazır değil: ${llmSaglik.reason}`)
  console.log(`\nmodel: ${llm.name}/${llm.model}\n`)

  let atesleyen = 0
  for (const s of secildi) {
    const vaka = vakalar.find((v) => v.id === s.vakaId)!
    const adaylar = cards.filter((c) => s.adaylar.includes(c.id))
    const res = await runCheck(llm, yakalamaSubmission(vaka), adaylar, new Map(), () => {}, {})
    s.atesledi = res.findings.length > 0
    s.bulgu = res.findings[0]?.rationale
    if (s.atesledi) {
      atesleyen++
      console.log(`  ✓ ${s.guideline.padEnd(10)} ${s.adaylar.join(', ')}`)
    } else {
      console.log(`  ✗ ${s.guideline.padEnd(10)} ${s.adaylar.join(', ')} — bulgu ÜRETMEDİ`)
      console.log(`      "${s.excerpt.slice(0, 90)}"`)
    }
  }

  console.log(
    `\n${atesleyen}/${secildi.length} vakada kart gerçek alıntıda bulgu üretti.\n` +
      `Ölçülen ${o.olculen} vakanın tamamına göre: ${atesleyen}/${o.olculen}.`,
  )
  console.log(SINIR_NOTU)
}

/**
 * Bu not her koşuda basılıyor ve kapatılamıyor — R22'deki kararla aynı sebep:
 * yüzde gören insan onu "yakalama oranı" diye okuyor.
 */
const SINIR_NOTU =
  '\nNOT: bu RECALL DEĞİL. Alıntı listing\'in tamamı değil, kesilmiş bir\n' +
  'parçası; kart burada ateşleyip gerçek listing\'de ateşlemeyebilir, tersi de\n' +
  'mümkün. Tek yönlü kesin olan şu: ateşlemeyen kart o redi yakalamazdı.'

async function cmdKartCanlilik() {
  const { canlilikTaramasi, sentetikSubmission } = await import('./eval/card-liveness.js')
  const { cards, version } = await loadCorpus()
  const satirlar = canlilikTaramasi(cards)

  const secilemez = satirlar.filter((s) => s.durum === 'secilemedi')
  const sinanamaz = satirlar.filter((s) => s.durum === 'sinanamaz')
  const secilebilir = satirlar.filter((s) => s.durum === 'secilebilir')

  console.log(
    `\nKural kitabı: ${cards.length} kart (corpus ${version})\n` +
      `Modele giden kart: ${satirlar.length}\n` +
      `  seçilebilir : ${secilebilir.length}\n` +
      `  SEÇİLEMEDİ  : ${secilemez.length}\n` +
      `  sınanamaz   : ${sinanamaz.length} (görsel gerektiriyor)`,
  )

  if (secilemez.length) {
    console.log(
      `\n⚠ Kendi ihlal örneğinde bile seçilmeyen ${secilemez.length} kart.\n` +
        '  Bu kartlar gerçek bir listing\'de de açılmaz — soru değil, KURULUM hatası:',
    )
    for (const s of secilemez) {
      console.log(`  ✗ ${s.ruleId.padEnd(44)} ${s.sebep}`)
      console.log(`      örnek: "${(s.ornek ?? '').slice(0, 80)}"`)
    }
  }

  if (!args.includes('--onayla')) {
    console.log(
      '\nBuraya kadar model çağrısı YOK. İkinci aşama (kart örneğinde gerçekten\n' +
        `bulgu üretiyor mu) ${secilebilir.length} çağrı eder; koşturmak için --onayla ekle.`,
    )
    console.log(
      '\nNOT: bu sınama "recall iyi" demez. Örnekleri apaçık ihlal olsun diye biz\n' +
        'yazdık; geçmek yalnızca "ölü değil" anlamına gelir.',
    )
    return
  }

  const { createProvider } = await import('./llm/index.js')
  const { runCheck } = await import('./check/check.js')
  const llm = await createProvider({ backend: flag('--llm'), model: flag('--model') })
  const saglik = await llm.healthcheck()
  if (!saglik.ok) throw new Error(`LLM hazır değil: ${saglik.reason}`)
  console.log(`\nmodel: ${llm.name}/${llm.model}\n`)

  const olu: string[] = []
  let atesleyen = 0
  for (const s of secilebilir) {
    const card = cards.find((c) => c.id === s.ruleId)!
    const sub = sentetikSubmission(card)
    const res = await runCheck(llm, sub, [card], new Map(), () => {}, {})
    if (res.findings.length) {
      atesleyen++
    } else {
      olu.push(s.ruleId)
      console.log(`  ✗ ${s.ruleId} — kendi ihlal örneğinde bulgu ÜRETMEDİ`)
      console.log(`      "${(s.ornek ?? '').slice(0, 90)}"`)
    }
  }

  console.log(
    `\n${secilebilir.length} karttan ${atesleyen} tanesi kendi örneğinde ateşledi, ` +
      `${olu.length} tanesi ETMEDİ.`,
  )
  console.log(
    '\nAteşlemeyen kart, gerçek bir listing\'de de bu ihlali yakalamaz: sorusu\n' +
      'cevaplanamıyor ya da model onu uygulayamıyor demektir. Ateşleyenler için\n' +
      'bu sınama bir şey KANITLAMAZ — örnek kolay olsun diye yazıldı.',
  )
}

async function cmdMeta() {
  const appId = flag('--app')

  // Alan listesi: hangi soru ne demek, hangi bayrakla yazılır.
  if (args.includes('--alanlar')) {
    for (const g of META_GROUPS) {
      console.log(`\n${g.title} — ${g.hint}`)
      for (const f of META_FIELDS.filter((x) => x.group === g.id)) {
        console.log(`\n  --${f.flag} / --no-${f.flag}`)
        console.log(`     ${f.label}: ${f.tldr}`)
        console.log(`     ${f.what.replace(/\s+/g, ' ')}`)
        console.log(`     Açtığı kurallar: ${f.effect.replace(/\s+/g, ' ')}`)
      }
    }
    console.log('\nİşaretlenmeyen alan "bilinmiyor" kalır; o alana bakan kartlar denetime girmez.')
    return
  }

  if (!appId) {
    const configs = await listAppConfigs()
    if (!configs.length) {
      console.log('Kayıtlı uygulama bilgisi yok. Örnek:')
      console.log('  npm run meta -- --app 6756787539 --ai-content --ugc')
      console.log('\nAlanların tamamı ve ne anlama geldikleri:')
      console.log('    ' + metaFlagHelp())
      return
    }
    console.log(`${configs.length} uygulama (apps/):\n`)
    for (const c of configs) {
      const flags = META_KEYS.map((k) =>
        `${k}=${c.meta[k] === undefined ? '?' : c.meta[k]}`).join('  ')
      console.log(`  ${c.appId}  ${c.appName ?? ''}`)
      console.log(`     ${flags}`)
    }
    return
  }

  const patch = metaFromFlags()
  const existing = await loadAppConfig(appId)
  const merged: AppMeta = { ...existing?.meta }
  for (const key of META_KEYS) if (patch[key] !== undefined) merged[key] = patch[key]

  const path = await saveAppConfig({
    appId,
    appName: flag('--name') ?? existing?.appName,
    meta: merged,
  })
  console.log(`${path} yazıldı:`)
  for (const key of META_KEYS) {
    console.log(`  ${key} = ${merged[key] === undefined ? '(bilinmiyor)' : merged[key]}`)
  }
}

/**
 * Yereldeki dersleri ortak havuza taşı.
 *
 * NEDEN AYRI KOMUT: havuza geçmek `.env`de tek satır, ama o satırı
 * değiştirdiğin an eldeki dersler görünmez oluyor — yeni depo boş. Elle
 * kopyalanacak şey (index.json + bodies/ + rejects/ + vectors.json) tam da
 * insanın yarısını unutacağı türden. belkiPatlarız R10'un "eldeki veri yukarı
 * taşınır" sözü bu komut.
 *
 * TEKRAR ÇALIŞTIRILABİLİR: havuzda zaten olan atlanır. İki kişi aynı anda
 * taşısa da, biri yarıda kesip tekrar başlatsa da kopya oluşmaz.
 */
async function cmdPush() {
  const url = process.env.HAVUZ_URL
  const token = process.env.HAVUZ_TOKEN
  if (!url || !token) {
    throw new Error(
      'HAVUZ_URL ve HAVUZ_TOKEN gerekli. Yazma belirtecini kullan — okuma ' +
        'belirteci taşımaya yetmez. Kurulum: havuz/README.md',
    )
  }
  const kuru = args.includes('--kuru')

  const { LocalLessonStore } = await import('./lessons/local.js')
  const { RemoteLessonStore } = await import('./lessons/remote.js')
  const yerel = new LocalLessonStore(process.env.LESSONS_DIR ?? 'lessons')
  const havuz = new RemoteLessonStore(url, token)

  const sag = await havuz.healthcheck()
  if (!sag.ok) throw new Error(`havuz hazır değil: ${sag.reason}`)

  const dersler = await yerel.allLessons()
  const vakalar = await yerel.allExamples()
  const vektorler = await yerel.readVectors()
  if (!dersler.length) {
    console.log(`Yerelde ders yok (${process.env.LESSONS_DIR ?? 'lessons'}/). Taşınacak bir şey yok.`)
    return
  }

  // Havuzdaki mevcut kayıtları TEK seferde çek: ders başına bir sorgu atmak
  // yüz dersi yüz istek yapardı ve taşıma dakikalar sürerdi.
  const varOlanDers = new Set((await havuz.allLessons()).map((l) => l.id))
  const varOlanVaka = new Set((await havuz.allExamples()).map((e) => e.id))

  console.log(
    `yerel: ${dersler.length} ders, ${vakalar.length} vaka, ${vektorler.length} vektör\n` +
      `havuz: ${varOlanDers.size} ders, ${varOlanVaka.size} vaka` +
      (kuru ? '\n\n--kuru: hiçbir şey yazılmayacak\n' : '\n'),
  )

  let yeniDers = 0
  let atlananDers = 0
  for (const l of dersler) {
    if (varOlanDers.has(l.id)) { atlananDers++; continue }
    if (kuru) { console.log(`+ ders ${l.id}`); yeniDers++; continue }
    // Gövde de gidiyor: yalnız satırı taşımak, dersin uzun anlatımını
    // sessizce yerelde bırakırdı ve kimse fark etmezdi.
    await havuz.createLesson(l, await yerel.readBody(l))
    yeniDers++
    console.log(`+ ders ${l.id}`)
  }

  let yeniVaka = 0
  let atlananVaka = 0
  let oksuz = 0
  for (const c of vakalar) {
    if (varOlanVaka.has(c.id)) { atlananVaka++; continue }
    // Dersi havuzda olmayan vaka yazılamaz (foreign key). Bu yereldeki
    // bozuk bir kayıttır; sessizce düşürmek yerine say ve söyle.
    if (!varOlanDers.has(c.lessonId) && !dersler.some((l) => l.id === c.lessonId)) {
      oksuz++
      continue
    }
    if (kuru) { yeniVaka++; continue }
    await havuz.addExample(c, await yerel.readRaw(c))
    yeniVaka++
  }

  // Vektörler upsert: taşınmasalar da `npm run lessons -- reindex` yeniden
  // üretirdi, ama o Voyage'a para/kota harcardı. Taşımak bedava.
  const tasinacakVektor = vektorler.filter(
    (v) => varOlanDers.has(v.lessonId) || dersler.some((l) => l.id === v.lessonId),
  )
  if (!kuru && tasinacakVektor.length) await havuz.writeVectors(tasinacakVektor)

  console.log(
    `\n${kuru ? 'taşınacak' : 'taşındı'}: ${yeniDers} ders, ${yeniVaka} vaka, ` +
      `${tasinacakVektor.length} vektör\n` +
      `atlandı (havuzda zaten var): ${atlananDers} ders, ${atlananVaka} vaka` +
      (oksuz ? `\n⚠ ${oksuz} vaka atlandı: bağlı olduğu ders yerelde de yok (bozuk kayıt)` : ''),
  )
  if (!kuru) {
    console.log(
      '\nHavuza geçmek için .env:\n' +
        '  GREENLIGHT_STORE=havuz\n' +
        `  HAVUZ_URL=${url}\n` +
        '  HAVUZ_TOKEN=<belirtecin>\n' +
        'Yerel klasör SİLİNMEDİ — havuz beklendiği gibi çalışana kadar dursun.',
    )
  }
}

function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

main().catch((e) => {
  console.error(`\nHATA: ${e.message}`)
  process.exit(1)
})
