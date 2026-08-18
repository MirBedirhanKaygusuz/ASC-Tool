/** Tek bir kuralı yerel modele sorup ham çıktıyı gösterir. Teşhis aracı. */
import { loadFixture } from '../src/fetch/index.js'
import { loadCorpus } from '../src/corpus/index.js'
import { selectRules } from '../src/check/select.js'
import { CHECKER_SYSTEM, FINDINGS_SCHEMA, submissionPrefix, renderRuleCard } from '../src/check/prompt.js'

const ruleId = process.argv[2]
const fixture = process.argv[3] ?? 'fixtures/glamio-apple.json'

const sub = await loadFixture(fixture)
const { cards } = await loadCorpus()
const selected = selectRules(sub, cards)

if (!ruleId) {
  console.log('kullanım: npx tsx scripts/dbg.ts <ruleId> [fixture]')
  console.log('geçerli kurallar:'); for (const r of selected) console.log('  ' + r.id)
  process.exit(0)
}
const rule = selected.find((r) => r.id === ruleId)
if (!rule) { console.error(`kural seçilmedi/yok: ${ruleId}`); process.exit(1) }

const prefix = await submissionPrefix(sub, { withImages: false })
const prefixText = prefix.map((b) => (b.type === 'text' ? b.text : '')).join('\n')

const t0 = Date.now()
const res = await fetch('http://localhost:11434/api/chat', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    model: process.env.OLLAMA_MODEL ?? 'qwen3:8b',
    stream: false, think: false, format: FINDINGS_SCHEMA, keep_alive: '30m',
    options: { num_ctx: 32768, temperature: 0.2, repeat_penalty: 1.15, repeat_last_n: 128, seed: 42, num_predict: 1024 },
    messages: [
      { role: 'system', content: CHECKER_SYSTEM },
      { role: 'user', content: prefixText },
      { role: 'user', content: renderRuleCard(rule) },
    ],
  }),
})
const d = (await res.json()) as any
console.log(`# ${rule.id}`)
console.log(`süre ${Math.round((Date.now() - t0) / 1000)}s · prefill ${d.prompt_eval_count} tok · üretilen ${d.eval_count} tok` +
            `${d.eval_count >= 1024 ? '  ⚠ KESİLDİ' : ''}`)
console.log(d.message?.content)
