import type { Report, Finding, LintFinding, ManualCheck } from '../types.js'

const W = { high: 30, medium: 10, low: 3 } as const

/** 0-100 risk skoru. Kesin ihlaller tam, "risk" bulguları yarım ağırlıkla sayılır. */
export function riskScore(lint: LintFinding[], findings: Finding[]): number {
  let s = 0
  for (const l of lint) s += W[l.severity]
  for (const f of findings) s += W[f.severity] * (f.outcome === 'violation' ? 1 : 0.5)
  return Math.min(100, Math.round(s))
}

/**
 * Aynı alan + aynı alıntı için birden fazla kart bulgu ürettiyse tek bulguda
 * topla. Aksi halde tek bir cümle rapora 3 kez düşer ve "listing başına
 * yanlış alarm" metriği şişer — kullanıcı da aracı gürültülü bulur.
 */
export function dedupeFindings(findings: Finding[]): Finding[] {
  const groups = new Map<string, Finding[]>()
  for (const f of findings) {
    const key = `${f.artifact}::${f.excerpt.trim().toLowerCase()}`
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  const rank = { high: 3, medium: 2, low: 1 } as const
  return [...groups.values()].map((g) => {
    const primary = [...g].sort((a, b) => rank[b.severity] - rank[a.severity])[0]!
    if (g.length === 1) return primary
    return { ...primary, ruleId: g.map((f) => f.ruleId).join(' + ') }
  })
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
    L.push('✅ Otomatik bulgu yok.')
    L.push('')
  }

  // Denetlenmeyeni raporda göstermek zorunlu: aksi halde "bulgu yok" ile
  // "bakılmadı" aynı görünür ve rapor yanlış güven verir.
  if (r.notChecked.length) {
    L.push(`## ⚠ Denetlenmedi (${r.notChecked.length})`)
    L.push('')
    L.push('_Bu kurallar ekran görüntüsü görmeden cevaplanamaz ve çalıştırılmadı._')
    L.push('_Vision destekli bir model kullan ya da görsel dosyalarını sağla._')
    L.push('')
    for (const id of r.notChecked) L.push(`- \`${id}\``)
    L.push('')
  }

  if (r.manual.length) {
    L.push(`## Elle doğrula (${r.manual.length})`)
    L.push('')
    L.push('_Bu maddeler listing içeriğinden görülemez — uygulamanın kendisinde kontrol edilmeli._')
    L.push('')
    for (const m of r.manual) L.push(...renderManual(m))
  }

  L.push('---')
  L.push(
    `Seçilen kural: ${r.stats.rulesSelected} · çalıştırılan: ${r.stats.rulesRun} · ` +
      `ham bulgu: ${r.stats.rawFindings} → alıntı doğrulama sonrası: ${r.stats.afterGrounding} → ` +
      `ikinci göz sonrası: ${r.stats.afterVerify}`,
  )

  return L.join('\n')
}

function renderManual(m: ManualCheck): string[] {
  return [
    `☐ **${m.why}** — \`${m.ruleId}\``,
    `   ${m.question}`,
    `   ↳ *${m.source.doc} ${m.source.section}*`,
    '',
  ]
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
