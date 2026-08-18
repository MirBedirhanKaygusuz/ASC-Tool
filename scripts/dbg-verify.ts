/** Bir kuralın bulgularını doğrulama turundan geçirir ve her oyu tek tek gösterir. */
import { loadFixture } from '../src/fetch/index.js'
import { loadCorpus } from '../src/corpus/index.js'
import { selectRules } from '../src/check/select.js'
import { groundFindings } from '../src/check/ground.js'
import { createProvider } from '../src/llm/index.js'
import { runCheck } from '../src/check/check.js'
import { VERDICT_SCHEMA } from '../src/check/prompt.js'

const ruleId = process.argv[2]!
const sub = await loadFixture('fixtures/glamio-apple.json')
const { cards } = await loadCorpus()
const rule = selectRules(sub, cards).find((r) => r.id === ruleId)!
const llm = await createProvider()

const { findings } = await runCheck(llm, sub, [rule])
const { kept } = groundFindings(sub, findings)
console.log(`${findings.length} ham bulgu, ${kept.length}'i alıntı doğrulamasından geçti\n`)

for (const f of kept) {
  console.log(`── "${f.excerpt.slice(0, 70)}..." [${f.artifact}]`)
  for (let v = 0; v < 3; v++) {
    const prompt = [
      `## Kural`, rule.ruleText.trim(), ``,
      `## Bu kurala göre İHLAL SAYILMAYAN bir örnek`, rule.negativeExample, ``,
      `## Değerlendirilecek içerik`, `Alan: ${f.artifact}`, `İçerik: "${f.excerpt}"`, ``,
      `Bu içerik yukarıdaki kuralı ihlal ediyor mu?`,
      `Emin değilsen violates=false döndür.`,
    ].join('\n')
    const res = await llm.complete({
      system:
        'Sen bir politika hakemisin. Varsayılan cevabın "ihlal değil"dir. ' +
        'Yalnızca kuralın açıkça yasakladığı bir durum varsa ihlal dersin. ' +
        'Şüphe ihlal aleyhine yorumlanır. Yalnızca JSON döndür.',
      prefix: [{ type: 'text', text: prompt }],
      suffix: 'Kararını ver.',
      schema: VERDICT_SCHEMA, maxTokens: 512, temperature: 0.7, seed: 1000 + v,
    })
    const j = res.json as { violates?: boolean; reason?: string } | null
    console.log(`   oy${v}: ${j?.violates ? 'İHLAL' : 'temiz '}  — ${j?.reason ?? '(parse edilemedi)'}`)
  }
  console.log()
}
