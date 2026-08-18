import type { Report, Finding, LintFinding } from '../types.js'

const W = { high: 30, medium: 10, low: 3 } as const

/** 0-100 risk skoru. Kesin ihlaller tam, "risk" bulguları yarım ağırlıkla sayılır. */
export function riskScore(lint: LintFinding[], findings: Finding[]): number {
  let s = 0
  for (const l of lint) s += W[l.severity]
  for (const f of findings) s += W[f.severity] * (f.outcome === 'violation' ? 1 : 0.5)
  return Math.min(100, Math.round(s))
}

export function renderMarkdown(r: Report): string {
  const L: string[] = []
  const band = r.riskScore >= 60 ? '🔴 YÜKSEK' : r.riskScore >= 25 ? '🟡 ORTA' : '🟢 DÜŞÜK'

  L.push(`# Greenlight — ${r.submission.appName} (${r.submission.platform})`)
  L.push('')
  L.push(`**Risk: ${band}** (${r.riskScore}/100) · ${r.submission.locale} · corpus \`${r.corpusVersion}\``)
  L.push(`_${r.generatedAt}_`)
  L.push('')

  if (r.lint.length) {
    L.push(`## Kesin kontroller (${r.lint.length})`)
    L.push('')
    for (const l of r.lint) {
      L.push(`${icon(l.severity)} **${l.artifact}** — ${l.message}`)
      L.push(`   ↳ *Düzelt:* ${l.suggestedFix}`)
      L.push(`   ↳ \`${l.checkId}\``)
      L.push('')
    }
  }

  const violations = r.findings.filter((f) => f.outcome === 'violation')
  const risks = r.findings.filter((f) => f.outcome === 'risk')

  if (violations.length) {
    L.push(`## İhlaller (${violations.length})`)
    L.push('')
    for (const f of violations) L.push(...renderFinding(f))
  }

  if (risks.length) {
    L.push(`## İnsan baksın (${risks.length})`)
    L.push('')
    for (const f of risks) L.push(...renderFinding(f))
  }

  if (!r.lint.length && !r.findings.length) {
    L.push('✅ Bulgu yok.')
    L.push('')
  }

  L.push('---')
  L.push(
    `Seçilen kural: ${r.stats.rulesSelected} · çalıştırılan: ${r.stats.rulesRun} · ` +
      `ham bulgu: ${r.stats.rawFindings} → alıntı doğrulama sonrası: ${r.stats.afterGrounding} → ` +
      `ikinci göz sonrası: ${r.stats.afterVerify}`,
  )

  return L.join('\n')
}

function renderFinding(f: Finding): string[] {
  const conf = f.trace?.verifyVotes
    ? ` · güven ${f.trace.verifyVotes.agree}/${f.trace.verifyVotes.total}`
    : ''
  return [
    `${icon(f.severity)} **${f.artifact}** — \`${f.ruleId}\`${conf}`,
    `   > ${f.excerpt.replace(/\n/g, ' ')}`,
    `   ${f.rationale}`,
    `   ↳ *Düzelt:* ${f.suggestedFix}`,
    '',
  ]
}

function icon(s: 'high' | 'medium' | 'low'): string {
  return s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '⚪'
}
