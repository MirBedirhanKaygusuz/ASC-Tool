import type { Submission, SubmissionText, RuleCard, Finding, ArtifactKind, Locator } from '../types.js'
import type { LlmProvider } from '../llm/index.js'
import { CHECKER_SYSTEM, FINDINGS_SCHEMA, submissionPrefix, renderRuleCard } from './prompt.js'

export interface CheckStats {
  rulesRun: number
  /** Yanıtı yarıda kesilen çağrı sayısı — bulgu sessizce kaybolur, uyar. */
  truncated: number
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
  onProgress?: (done: number, total: number, ruleId: string, ms: number) => void,
): Promise<{ findings: Finding[]; stats: CheckStats }> {
  const prefix = await submissionPrefix(sub, { withImages: llm.supportsVision })

  const stats: CheckStats = {
    rulesRun: 0, truncated: 0, unparsable: 0,
    inputTokens: 0, outputTokens: 0, cachedTokens: 0,
    ms: 0, firstCallMs: 0, avgCallMs: 0,
  }
  const findings: Finding[] = []
  const t0 = Date.now()

  const queue = [...rules]
  const workers = Math.max(1, llm.concurrency)

  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const rule = queue.shift()
        if (!rule) return
        const got = await one(llm, sub, prefix, rule, stats)
        findings.push(...got)
        onProgress?.(stats.rulesRun, rules.length, rule.id, stats.ms)
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
  stats: CheckStats,
): Promise<Finding[]> {
  const res = await llm.complete({
    system: CHECKER_SYSTEM,
    prefix,
    suffix: renderRuleCard(rule),
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
  return parsed.findings.map((f) => toFinding(sub, rule, f))
}

interface RawFinding {
  artifact: string
  mediaId?: string
  iapId?: string
  excerpt: string
  rationale: string
  suggestedFix: string
  severity: 'high' | 'medium' | 'low'
}

function toFinding(sub: Submission, rule: RuleCard, raw: RawFinding): Finding {
  return {
    ruleId: rule.id,
    platform: sub.platform,
    severity: raw.severity ?? rule.defaultSeverity,
    outcome: rule.outcome,
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
