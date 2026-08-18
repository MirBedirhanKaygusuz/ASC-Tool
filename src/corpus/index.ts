import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { parse as parseYaml } from 'yaml'
import { RuleCardSchema } from './schema.js'
import type { RuleCard } from '../types.js'

const CORPUS_DIR = 'corpus'

export interface Corpus {
  cards: RuleCard[]
  /** Rapora yazılır — "kural yenilendi, tekrar tara" ancak bununla diff'lenebilir. */
  version: string
}

export async function loadCorpus(dir = CORPUS_DIR): Promise<Corpus> {
  const files = await walk(dir)
  const cards: RuleCard[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const raw = await readFile(file, 'utf8')
    const parsed = parseYaml(raw)
    const result = RuleCardSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(
        `Bozuk rule card: ${file}\n` +
          result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'),
      )
    }
    if (seen.has(result.data.id)) {
      throw new Error(`Tekrarlanan rule card id: ${result.data.id} (${file})`)
    }
    seen.add(result.data.id)
    cards.push(result.data as RuleCard)
  }

  cards.sort((a, b) => a.id.localeCompare(b.id))
  const version = createHash('sha256')
    .update(cards.map((c) => `${c.id}@${c.version}`).join('|'))
    .digest('hex')
    .slice(0, 12)

  return { cards, version }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const out: string[] = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else if (e.name.endsWith('.yaml') || e.name.endsWith('.yml')) out.push(full)
  }
  return out
}
