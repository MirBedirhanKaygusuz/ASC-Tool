import Anthropic from '@anthropic-ai/sdk'
import type { Submission, SubmissionText, RuleCard, Finding, ArtifactKind, Locator } from '../types.js'
import { CHECKER_SYSTEM, OUTPUT_CONFIG, submissionBlocks, renderRuleCard } from './prompt.js'

const MODEL = 'claude-opus-5'

export interface CheckStats {
  rulesRun: number
  cacheWriteTokens: number
  cacheReadTokens: number
  inputTokens: number
  outputTokens: number
}

/**
 * Denetim turu.
 *
 * TASARIM KARARI: iş birimi artifact değil, KURAL.
 * Her kural için ayrı bir çağrı yapıyoruz. Modele 30 kuralı birden vermek
 * dikkatini dağıtır ve recall'u düşürür. Tek kural = tek net soru.
 *
 * Submission sabit olduğu için prompt cache'e yazılıyor; N kural çağrısında
 * tekrar tekrar ucuza okunuyor.
 */
export async function runCheck(
  sub: Submission,
  rules: RuleCard[],
  opts: { concurrency?: number } = {},
): Promise<{ findings: Finding[]; stats: CheckStats }> {
  const client = new Anthropic()
  const blocks = await submissionBlocks(sub)

  const stats: CheckStats = {
    rulesRun: 0,
    cacheWriteTokens: 0,
    cacheReadTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
  }
  const findings: Finding[] = []

  // İlk çağrıyı tek başına yap: cache'i yazsın, sonrakiler okusun.
  const [first, ...rest] = rules
  if (!first) return { findings, stats }

  findings.push(...(await one(client, sub, blocks, first, stats)))

  const limit = opts.concurrency ?? 4
  for (let i = 0; i < rest.length; i += limit) {
    const batch = rest.slice(i, i + limit)
    const results = await Promise.all(batch.map((r) => one(client, sub, blocks, r, stats)))
    findings.push(...results.flat())
  }

  return { findings, stats }
}

async function one(
  client: Anthropic,
  sub: Submission,
  blocks: Anthropic.ContentBlockParam[],
  rule: RuleCard,
  stats: CheckStats,
): Promise<Finding[]> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: OUTPUT_CONFIG,
    system: CHECKER_SYSTEM,
    messages: [
      { role: 'user', content: blocks },
      { role: 'user', content: renderRuleCard(rule) },
    ],
  })

  stats.rulesRun++
  stats.inputTokens += res.usage.input_tokens ?? 0
  stats.outputTokens += res.usage.output_tokens ?? 0
  stats.cacheWriteTokens += res.usage.cache_creation_input_tokens ?? 0
  stats.cacheReadTokens += res.usage.cache_read_input_tokens ?? 0

  const text = res.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') return []

  let parsed: { findings?: RawFinding[] }
  try {
    parsed = JSON.parse(text.text)
  } catch {
    return []
  }

  return (parsed.findings ?? []).map((f) => toFinding(sub, rule, f))
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
    excerpt: raw.excerpt,
    rationale: raw.rationale,
    suggestedFix: raw.suggestedFix,
    confidence: 0, // verify turunda doldurulur
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
