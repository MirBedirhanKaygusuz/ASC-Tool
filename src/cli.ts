#!/usr/bin/env node
// .env'i yükle. Node bunu kendiliğinden yapmaz; bağımlılık eklemeye de gerek
// yok — process.loadEnvFile yerleşik. Dosya yoksa sessizce geç.
try {
  process.loadEnvFile('.env')
} catch {
  /* .env yok — ortam değişkenleri doğrudan verilmiş olabilir */
}

import { writeFile, mkdir } from 'node:fs/promises'
import { loadFixture } from './fetch/index.js'
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
  usage()
}

function usage() {
  console.log(`
Greenlight — Store Policy Checker

  npm run check -- --fixture <path> [seçenekler]

    --no-llm            sadece kesin kontroller (LLM turu yok)
    --llm <backend>     ollama (varsayılan) | anthropic
    --model <ad>        ör. qwen3:8b, qwen2.5:14b
    --out <path>        rapor yolu (varsayılan out/report.md)

  npm run corpus        kural kitabını doğrula ve listele

  npm run learn -- --paste [--app Glamio]     panodaki metni işle (macOS)
  npm run learn -- <reject.txt>               tek dosya
  npm run learn -- --dir rejects/             klasördeki hepsi
  pbpaste | npm run learn -- --stdin          boru hattı

                        Ham red metnini ders olarak işler: yeni bir kalıpsa
                        yeni ders açar, bilinen bir kalıpsa mevcut dersin
                        örneği olarak ekler.

  npm run lessons                    dersleri listele
  npm run lessons -- approve <id>    taslak dersi aktifleştir
  npm run lessons -- retire <id>     dersi emekliye ayır
`)
  process.exit(1)
}

async function cmdCorpus() {
  const { cards, version } = await loadCorpus()
  console.log(`Corpus sürümü: ${version}  (${cards.length} kart)\n`)
  for (const c of cards) {
    const flags = [c.scope, c.outcome, c.defaultSeverity].join('/')
    console.log(`  ${c.id.padEnd(42)} ${flags.padEnd(24)} ${c.source.doc} ${c.source.section}`)
  }
}

async function cmdCheck() {
  const fixture = flag('--fixture')
  if (!fixture) usage()
  const noLlm = args.includes('--no-llm')
  const outPath = flag('--out') ?? 'out/report.md'

  const sub = await loadFixture(fixture!)
  console.error(`→ ${sub.appName} (${sub.platform}, ${sub.locale})`)

  // 1. Kesin kontroller — LLM yok
  const lint = await runLint(sub)
  console.error(`→ lint: ${lint.length} bulgu`)

  // 2. Kural seçimi
  const { cards, version } = await loadCorpus()
  const { llm: selected, manual: manualCards } = selectRules(sub, cards)
  console.error(
    `→ kural: ${cards.length} karttan ${selected.length} tanesi modele gidecek` +
      `, ${manualCards.length} tanesi elle kontrol maddesi`,
  )

  const manual: ManualCheck[] = manualCards.map((c) => ({
    ruleId: c.id, platform: sub.platform, question: c.question.trim(),
    ruleText: c.ruleText.trim(), source: c.source,
    why: c.tags.includes('checklist') ? c.ruleText.split('.')[0]!.trim() : c.id,
  }))

  // Dersler: kartların yanında ek kanıt. Yalnızca status=active olanlar.
  const store = await createLessonStore()
  await store.healthcheck()
  const allLessons = await store.allLessons()
  const active = allLessons.filter((l) => l.status === 'active' && l.platform === sub.platform)
  const draftCount = allLessons.filter((l) => l.status === 'draft').length
  const coverageGaps = allLessons.filter((l) => l.ruleId === null && l.status !== 'retired').map((l) => l.id)

  const lessonsByRule = new Map<string, Lesson[]>()
  for (const l of active) {
    if (!l.ruleId) continue
    lessonsByRule.set(l.ruleId, [...(lessonsByRule.get(l.ruleId) ?? []), l])
  }
  console.error(
    `→ ders: ${active.length} aktif` +
      (draftCount ? `, ${draftCount} onay bekliyor` : '') +
      (coverageGaps.length ? `, ⚠ ${coverageGaps.length} kapsama boşluğu` : ''),
  )

  // 3-5. Denetim + alıntı doğrulama + ikinci göz
  let findings: Finding[] = []
  let rulesRun = 0
  let raw = 0
  let afterGround = 0
  let notChecked: string[] = []

  if (!noLlm && selected.length) {
    const llm = await createProvider({ backend: flag('--llm'), model: flag('--model') })
    const health = await llm.healthcheck()
    if (!health.ok) {
      console.error(`→ LLM turu atlanıyor: ${health.reason}`)
    } else {
      console.error(
        `→ model: ${llm.name}/${llm.model} · eşzamanlılık ${llm.concurrency}` +
          `${llm.supportsVision ? ' · vision açık' : ' · vision kapalı (metin-only)'}`,
      )

      const { runCheck } = await import('./check/check.js')
      const { verifyFindings } = await import('./check/verify.js')

      const res = await runCheck(llm, sub, selected, lessonsByRule, (done, total, ruleId, ms) => {
        console.error(`   [${done}/${total}] ${ruleId} (${Math.round(ms / 1000)}s)`)
      })
      rulesRun = res.stats.rulesRun
      raw = res.findings.length
      console.error(
        `→ denetim: ${raw} ham bulgu · ${Math.round(res.stats.ms / 1000)}s ` +
          `(ilk çağrı ${Math.round(res.stats.firstCallMs / 1000)}s, ort. ${Math.round(res.stats.avgCallMs / 1000)}s) ` +
          `· prefill ${res.stats.inputTokens} tok`,
      )
      if (res.stats.skippedNoVision.length) {
        console.error(
          `   ⚠ ${res.stats.skippedNoVision.length} görsel kartı ÇALIŞTIRILMADI ` +
            `(vision kapalı veya görsel dosyası yok) — bu konular DENETLENMEDİ:`,
        )
        for (const id of res.stats.skippedNoVision) console.error(`     · ${id}`)
      }
      notChecked = res.stats.skippedNoVision
      if (res.stats.truncated || res.stats.unparsable) {
        console.error(
          `   ⚠ ${res.stats.truncated} çağrı yarıda kesildi, ` +
            `${res.stats.unparsable} yanıt parse edilemedi — bu çağrıların bulguları KAYIP. ` +
            `Model çıktı bütçesini aşıyor.`,
        )
      }

      const grounded = groundFindings(sub, res.findings)
      afterGround = grounded.kept.length
      if (grounded.dropped.length) {
        console.error(`→ alıntı doğrulama: ${grounded.dropped.length} uydurma bulgu elendi`)
        for (const d of grounded.dropped) {
          console.error(`   ✗ ${d.ruleId}: "${d.excerpt.slice(0, 60)}..."`)
        }
      }

      const byId = new Map<string, RuleCard>(selected.map((r) => [r.id, r]))
      const verified = await verifyFindings(llm, sub, grounded.kept, byId)
      if (verified.dropped.length) {
        console.error(`→ ikinci göz: ${verified.dropped.length} zayıf bulgu elendi`)
      }
      findings = dedupeFindings(verified.kept)

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

  const report: Report = {
    submission: {
      appId: sub.appId, appName: sub.appName,
      platform: sub.platform, locale: sub.locale,
    },
    generatedAt: new Date().toISOString(),
    corpusVersion: version,
    riskScore: riskScore(lint, findings),
    lint,
    findings,
    manual,
    notChecked,
    lessons: { active: active.length, draft: draftCount, coverageGaps },
    stats: {
      rulesSelected: selected.length,
      rulesRun,
      rawFindings: raw,
      afterGrounding: afterGround,
      afterVerify: findings.length,
    },
  }

  const md = renderMarkdown(report)
  await mkdir('out', { recursive: true })
  await writeFile(outPath, md)
  await writeFile(outPath.replace(/\.md$/, '.json'), JSON.stringify(report, null, 2))

  console.error(`→ rapor: ${outPath}\n`)
  console.log(md)
}

async function cmdLearn() {
  const inputs = await collectRejectTexts()
  if (!inputs.length) usage()

  const llm = await createProvider()
  const health = await llm.healthcheck()
  if (!health.ok) throw new Error(health.reason)

  const store = await createLessonStore()
  await store.healthcheck()
  const { cards } = await loadCorpus()
  const { ingestReject } = await import('./lessons/ingest.js')

  console.error(
    `→ ${inputs.length} red metni işlenecek (${llm.name}/${llm.model}, depo: ${store.name})`,
  )

  const drafts: string[] = []
  const gaps: string[] = []

  for (const [i, input] of inputs.entries()) {
    console.error(`\n[${i + 1}/${inputs.length}] ${input.label}`)
    let r
    try {
      r = await ingestReject(llm, store, input.text, cards, { appName: flag('--app') })
    } catch (e) {
      // Tek bozuk metin tüm partiyi düşürmesin — hangisi patladı, söyle ve devam et.
      console.error(`  ✗ işlenemedi: ${(e as Error).message}`)
      continue
    }

    console.log(r.kind === 'new-lesson' ? '✚ YENİ DERS' : '＋ MEVCUT DERSE ÖRNEK')
    console.log(`  id        ${r.lesson.id}`)
    console.log(`  madde     ${r.lesson.platform} ${r.lesson.guideline} · ${r.lesson.artifact ?? '—'}`)
    console.log(`  kart      ${r.lesson.ruleId ?? '⚠ YOK'}`)
    console.log(`  gerekçe   ${r.matchReason}`)
    console.log(`  ders      ${r.extracted.summary}`)

    if (r.coverageGap && !gaps.includes(r.lesson.id)) gaps.push(r.lesson.id)
    if (r.lesson.status === 'draft' && !drafts.includes(r.lesson.id)) drafts.push(r.lesson.id)
  }

  if (gaps.length) {
    console.log()
    console.log(`⚠ KAPSAMA BOŞLUĞU (${gaps.length}) — bu red'ler hiçbir kartla eşleşmiyor:`)
    for (const id of gaps) console.log(`   ${id}`)
    console.log('   Bunlar için kural kartı yazılmalı.')
  }
  if (drafts.length) {
    console.log()
    console.log(`${drafts.length} ders onay bekliyor. Denetimde kullanmak için:`)
    for (const id of drafts) console.log(`   npm run lessons -- approve ${id}`)
  }
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
        text: await readFile(join(dir, f.name), 'utf8'),
      })),
    )
  }

  // 4) Tek dosya
  const file = args[1]
  if (!file || file.startsWith('--')) return []
  return [{ label: file, text: await readFile(file, 'utf8') }]
}

async function cmdLessons() {
  const store = await createLessonStore()
  await store.healthcheck()
  const sub = args[1]

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
    const gap = l.ruleId ? '' : '  ⚠ kapsama boşluğu'
    console.log(`${mark} ${l.id}`)
    console.log(`   ${l.platform} ${l.guideline} · ${l.exampleCount} örnek · kart: ${l.ruleId ?? '—'}${gap}`)
    console.log(`   ${l.summary}`)
    console.log()
  }
  console.log('● aktif   ○ onay bekliyor   × emekli')
}

function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

main().catch((e) => {
  console.error(`\nHATA: ${e.message}`)
  process.exit(1)
})
