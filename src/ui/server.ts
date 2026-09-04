// .env'i yükle — cli.ts'teki ile aynı sebep: Node bunu kendiliğinden yapmaz
// ve ASC anahtarı oradan geliyor. import'lardan ÖNCE olmalı.
try {
  process.loadEnvFile('.env')
} catch {
  /* .env yok — ortam değişkenleri doğrudan verilmiş olabilir */
}

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { AscClient, ascConfigFromEnv } from '../fetch/asc.js'
import { loadAppConfig, saveAppConfig, META_KEYS, type AppMeta } from '../fetch/app-meta.js'
import { META_FIELDS, META_GROUPS } from '../meta-fields.js'
import { createLessonStore } from '../lessons/index.js'
import type { Lesson } from '../lessons/types.js'

/**
 * Yerel arayüz.
 *
 * Çerçeve, derleme adımı ve bağımlılık yok — projenin geri kalanıyla aynı
 * çizgi. Sunucu yalnızca ince bir kabuk: bütün iş mantığı check/run.ts ve
 * lessons/ içinde, buradan sadece çağrılıyor. Böylece terminal ile arayüz
 * ayrı davranışlara kaymıyor.
 *
 * Yalnızca 127.0.0.1'e bağlanır: App Store Connect anahtarıyla konuşan bir
 * süreç, ağdaki başka makinelere açılmamalı.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

function json(res: ServerResponse, body: unknown, status = 200) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(payload)
}

async function readBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

/** ASC uygulama listesi + apps/{id}.json'daki elle girilmiş alanlar. */
async function listApps() {
  const client = new AscClient(ascConfigFromEnv())
  const { data } = await client.list('/apps?limit=200')
  return Promise.all(
    data.map(async (a) => {
      const config = await loadAppConfig(a.id)
      const meta: AppMeta = config?.meta ?? {}
      return {
        id: a.id,
        name: String(a.attributes?.name ?? a.id),
        bundleId: String(a.attributes?.bundleId ?? ''),
        primaryLocale: String(a.attributes?.primaryLocale ?? ''),
        meta,
        // Arayüz eksikleri işaretleyebilsin: hangi alan hâlâ boş?
        missing: META_KEYS.filter((k) => meta[k] === undefined),
      }
    }),
  )
}

/** Denetimi SSE ile akıt: kullanıcı 40 saniye boş ekrana bakmasın. */
async function streamAudit(req: IncomingMessage, res: ServerResponse, appId: string) {
  const url = new URL(req.url!, 'http://localhost')
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const { runAudit } = await import('../check/run.js')
    const result = await runAudit(
      {
        appId,
        locale: url.searchParams.get('locale') ?? undefined,
        territory: url.searchParams.get('territory') ?? undefined,
        noLlm: url.searchParams.get('noLlm') === '1',
        outPath: `out/report-${appId}.md`,
      },
      (e) => send('progress', e),
    )
    send('done', { report: result.report, metaSources: result.metaSources })
  } catch (e) {
    send('error', { message: (e as Error).message })
  }
  res.end()
}

async function lessonPayload(store: Awaited<ReturnType<typeof createLessonStore>>, lesson: Lesson) {
  return {
    lesson,
    body: await store.readBody(lesson),
    examples: await store.examplesFor(lesson.id, 20),
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, 'http://localhost')
  const path = url.pathname

  if (path === '/' || path === '/index.html') {
    const html = await readFile(join(HERE, 'index.html'), 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  if (path === '/api/apps' && req.method === 'GET') {
    return json(res, await listApps())
  }

  // Alan tanımları: arayüz bunları kendi içinde tutmuyor, buradan alıyor.
  if (path === '/api/meta-fields') {
    return json(res, { groups: META_GROUPS, fields: META_FIELDS })
  }

  const metaMatch = path.match(/^\/api\/apps\/([^/]+)\/meta$/)
  if (metaMatch && req.method === 'PUT') {
    const appId = metaMatch[1]!
    const body = await readBody(req)
    const existing = await loadAppConfig(appId)
    const meta: AppMeta = { ...existing?.meta }
    for (const key of META_KEYS) {
      // null = "bilinmiyor'a geri dön". undefined = dokunma.
      if (body.meta?.[key] === null) delete meta[key]
      else if (typeof body.meta?.[key] === 'boolean') meta[key] = body.meta[key]
    }
    await saveAppConfig({ appId, appName: body.appName ?? existing?.appName, meta })
    return json(res, { ok: true, meta })
  }

  const auditMatch = path.match(/^\/api\/audit\/([^/]+)$/)
  if (auditMatch) return streamAudit(req, res, auditMatch[1]!)

  const reportMatch = path.match(/^\/api\/report\/([^/]+)$/)
  if (reportMatch) {
    try {
      const raw = await readFile(`out/report-${reportMatch[1]}.json`, 'utf8')
      return json(res, JSON.parse(raw))
    } catch {
      return json(res, { empty: true })
    }
  }

  // --- Red geçmişi ---------------------------------------------------------
  if (path === '/api/rejects' && req.method === 'GET') {
    const store = await createLessonStore()
    await store.healthcheck()
    const [examples, lessons] = await Promise.all([store.allExamples(), store.allLessons()])
    const byId = new Map(lessons.map((l) => [l.id, l]))
    return json(
      res,
      examples.map((e) => {
        const lesson = byId.get(e.lessonId)
        return {
          ...e,
          lessonTitle: lesson?.title ?? '(ders silinmiş)',
          lessonScope: lesson?.scope ?? 'listing',
          lessonStatus: lesson?.status ?? 'draft',
          ruleId: lesson?.ruleId ?? null,
        }
      }),
    )
  }

  const rawMatch = path.match(/^\/api\/rejects\/([^/]+)\/raw$/)
  if (rawMatch && req.method === 'GET') {
    const store = await createLessonStore()
    await store.healthcheck()
    const example = (await store.allExamples()).find((e) => e.id === decodeURIComponent(rawMatch[1]!))
    if (!example) return json(res, { error: 'vaka bulunamadı' }, 404)
    return json(res, { text: await store.readRaw(example) })
  }

  // Snippet çıktısını arayüzden işle — terminale gitmeden ders çıkar.
  if (path === '/api/rejects' && req.method === 'POST') {
    const body = await readBody(req)
    const text = String(body.text ?? '').trim()
    if (!text) return json(res, { error: 'metin boş' }, 400)

    const [{ createProvider }, { loadCorpus }, { ingestReject }] = await Promise.all([
      import('../llm/index.js'),
      import('../corpus/index.js'),
      import('../lessons/ingest.js'),
    ])
    const llm = await createProvider()
    const health = await llm.healthcheck()
    if (!health.ok) return json(res, { error: `LLM hazır değil: ${health.reason}` }, 503)

    const store = await createLessonStore()
    await store.healthcheck()
    const { cards } = await loadCorpus()
    const result = await ingestReject(llm, store, text, cards, {
      appName: body.appName ? String(body.appName) : undefined,
    })
    return json(res, {
      kind: result.kind,
      lesson: result.lesson,
      example: result.example,
      coverageGap: result.coverageGap,
      matchReason: result.matchReason,
    })
  }

  if (path === '/api/lessons' && req.method === 'GET') {
    const store = await createLessonStore()
    await store.healthcheck()
    return json(res, await store.allLessons())
  }

  const lessonMatch = path.match(/^\/api\/lessons\/([^/]+)$/)
  if (lessonMatch && req.method === 'GET') {
    const store = await createLessonStore()
    await store.healthcheck()
    const lesson = await store.findLesson(decodeURIComponent(lessonMatch[1]!))
    if (!lesson) return json(res, { error: 'ders bulunamadı' }, 404)
    return json(res, await lessonPayload(store, lesson))
  }

  const statusMatch = path.match(/^\/api\/lessons\/([^/]+)\/status$/)
  if (statusMatch && req.method === 'PUT') {
    const body = await readBody(req)
    const status = body.status as Lesson['status']
    if (!['draft', 'active', 'retired'].includes(status)) {
      return json(res, { error: 'geçersiz durum' }, 400)
    }
    const store = await createLessonStore()
    await store.healthcheck()
    await store.updateLessonStatus(decodeURIComponent(statusMatch[1]!), status)
    return json(res, { ok: true })
  }

  json(res, { error: 'bulunamadı' }, 404)
}

const port = Number(process.env.GREENLIGHT_UI_PORT ?? 4321)

createServer((req, res) => {
  handle(req, res).catch((e) => {
    // Sunucu hatası sessizce yutulmasın: arayüz kırmızı kutuda gösterebilsin.
    if (!res.headersSent) json(res, { error: (e as Error).message }, 500)
    else res.end()
  })
}).listen(port, '127.0.0.1', () => {
  console.log(`Greenlight arayüzü:  http://127.0.0.1:${port}`)
})
