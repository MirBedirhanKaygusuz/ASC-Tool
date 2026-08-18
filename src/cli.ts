#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import { loadFixture } from './fetch/index.js'
import { runLint } from './lint/index.js'
import { loadCorpus } from './corpus/index.js'
import { selectRules } from './check/select.js'
import { groundFindings } from './check/ground.js'
import { riskScore, renderMarkdown } from './report/index.js'
import { createProvider } from './llm/index.js'
import type { Report, Finding, RuleCard } from './types.js'

const args = process.argv.slice(2)
const cmd = args[0]

async function main() {
  if (cmd === 'corpus') return cmdCorpus()
  if (cmd === 'check') return cmdCheck()
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
  const selected = selectRules(sub, cards)
  console.error(`→ kural: ${cards.length} karttan ${selected.length} tanesi geçerli`)

  // 3-5. Denetim + alıntı doğrulama + ikinci göz
  let findings: Finding[] = []
  let rulesRun = 0
  let raw = 0
  let afterGround = 0

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

      const res = await runCheck(llm, sub, selected, (done, total, ruleId, ms) => {
        console.error(`   [${done}/${total}] ${ruleId} (${Math.round(ms / 1000)}s)`)
      })
      rulesRun = res.stats.rulesRun
      raw = res.findings.length
      console.error(
        `→ denetim: ${raw} ham bulgu · ${Math.round(res.stats.ms / 1000)}s ` +
          `(ilk çağrı ${Math.round(res.stats.firstCallMs / 1000)}s, ort. ${Math.round(res.stats.avgCallMs / 1000)}s) ` +
          `· prefill ${res.stats.inputTokens} tok`,
      )

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
      findings = verified.kept
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

function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

main().catch((e) => {
  console.error(`\nHATA: ${e.message}`)
  process.exit(1)
})
