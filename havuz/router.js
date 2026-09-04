/**
 * Ortak ders havuzu — YÖNLENDİRİCİ.
 *
 * NE İŞE YARIYOR: bugüne kadar her makinede ayrı bir `lessons/index.json`
 * vardı. Ahmet'in işlediği red'i Ayşe göremiyor, ikisi aynı red'den iki ayrı
 * ders çıkarıyor ve proje öğrenmiyordu (belkiPatlarız R10). Bu servis o
 * dosyanın ortak hâli.
 *
 * TEK İŞİ VAR: `LessonStore` arayüzünü ağ üzerinden konuşmak. Çıkarım,
 * eşleştirme, prompt, kural kartı — hiçbiri burada değil; onlar `src/`
 * altındaki TypeScript'te ve hem CLI'a hem eklentiye aynı kaynaktan
 * derleniyor. Buraya iş mantığı taşırsak iki gerçeklik oluşur ve hangisinin
 * doğru öğrendiği bilinemez. `worker/index.js` ile aynı ilke.
 *
 * NEDEN server.js'TEN AYRI: burada Postgres sürücüsü YOK — veritabanına
 * `db` nesnesi üzerinden erişiliyor. Böylece yetki kapıları, yol eşleşmesi ve
 * yanıt biçimleri gerçek bir Postgres kurmadan test edilebiliyor
 * (scripts/test-core.ts, "havuz: istemci ↔ sunucu gidiş-dönüşü"). Sürücüyü
 * buraya gömseydik bu sözleşmenin tek sınaması üretim olurdu.
 *
 * TEL BİÇİMİ camelCase: API bizim, Postgres'in değil. snake_case ↔ camelCase
 * çevirisi YALNIZCA burada yapılır. İstemcide ikinci bir çeviri katmanı
 * olsaydı ikisi zamanla ayrışırdı.
 *
 * NE LOGLAMAZ: istek gövdesini, ders metnini, reject metnini. Sayaç tutmak
 * başka, içeriği saklamak başka — Apple'ın red yazışmaları buradan geçiyor.
 */
import { timingSafeEqual } from 'node:crypto'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, OPTIONS',
  'access-control-allow-headers': 'content-type, x-gl-token',
  'access-control-max-age': '86400',
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...CORS })
  res.end(JSON.stringify(body))
}

function metin(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...CORS })
  res.end(body)
}

/**
 * Sabit süreli karşılaştırma.
 *
 * `a === b` doğru belirteci karakter karakter sızdırır: yanlış eşleşmede
 * hemen döner, doğru önekte biraz daha uzun sürer. Ölçülebilir bir fark ve
 * ölçmek için gereken tek şey bir döngü.
 */
function belirtecEsit(gelen, beklenen) {
  const a = Buffer.from(String(gelen ?? ''))
  const b = Buffer.from(String(beklenen ?? ''))
  if (!b.length || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const GOVDE_TAVANI = 5 * 1024 * 1024 // 5 MB: en uzun reject metni bunun binde biri

function govde(req) {
  return new Promise((resolve, reject) => {
    let boyut = 0
    const parcalar = []
    req.on('data', (c) => {
      boyut += c.length
      if (boyut > GOVDE_TAVANI) {
        reject(Object.assign(new Error('gövde çok büyük'), { http: 413 }))
        req.destroy()
        return
      }
      parcalar.push(c)
    })
    req.on('end', () => {
      const ham = Buffer.concat(parcalar).toString('utf8')
      if (!ham) return resolve({})
      try {
        resolve(JSON.parse(ham))
      } catch {
        reject(Object.assign(new Error('gövde JSON değil'), { http: 400 }))
      }
    })
    req.on('error', reject)
  })
}

// --- Satır ↔ nesne çevirisi (TEK yer) ---------------------------------------

const iso = (v) => (v instanceof Date ? v.toISOString() : String(v ?? ''))

const dersten = (r) => ({
  id: r.id,
  ruleId: r.rule_id ?? null,
  platform: r.platform,
  guideline: r.guideline,
  // Eski satırlarda kolon yoktu — listing varsaymak güvenli taraf: kartsız
  // ders boşluk olarak GÖRÜNÜR, sessizce kapsam dışına düşmez.
  scope: r.scope ?? 'listing',
  title: r.title,
  summary: r.summary,
  signals: r.signals ?? [],
  falsePositive: r.false_positive ?? null,
  artifact: r.artifact ?? null,
  severity: r.severity,
  status: r.status,
  bodyKey: r.body_key,
  exampleCount: r.example_count ?? 0,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
})

const vakadan = (r) => ({
  id: r.id,
  lessonId: r.lesson_id,
  appName: r.app_name,
  platform: r.platform,
  // `date` kolonu: Date nesnesi olarak gelir, YYYY-MM-DD'ye indiriyoruz.
  // Saat dilimi eklemek "9 Kasım'da reddedildi"yi 8 Kasım yapabilir.
  rejectedAt: r.rejected_at ? iso(r.rejected_at).slice(0, 10) : null,
  guideline: r.guideline,
  artifact: r.artifact ?? null,
  excerpt: r.excerpt ?? '',
  reviewerText: r.reviewer_text,
  resolution: r.resolution ?? null,
  rawKey: r.raw_key,
  status: r.status,
  createdAt: iso(r.created_at),
})

// --- Uç noktalar -------------------------------------------------------------

async function dersleriListele(db, req, res, _m, url) {
  const kosul = []
  const arg = []
  const q = url.searchParams
  if (q.get('platform')) { arg.push(q.get('platform')); kosul.push(`platform = $${arg.length}`) }
  if (q.get('status')) { arg.push(q.get('status')); kosul.push(`status = $${arg.length}`) }
  if (q.get('guideline')) { arg.push(q.get('guideline')); kosul.push(`guideline = $${arg.length}`) }
  // candidatesFor'un ihtiyacı: emekliler hariç. `status=` ile aynı şey değil —
  // orada draft ve active'in İKİSİ birden isteniyor.
  if (q.get('exclude')) { arg.push(q.get('exclude')); kosul.push(`status <> $${arg.length}`) }
  const where = kosul.length ? `where ${kosul.join(' and ')}` : ''
  const { rows } = await db.sorgu(`select * from lessons ${where} order by created_at`, arg)
  json(res, 200, { lessons: rows.map(dersten) })
}

async function dersBul(db, req, res, m) {
  const { rows } = await db.sorgu('select * from lessons where id = $1', [m[1]])
  if (!rows.length) return json(res, 404, { error: 'ders bulunamadı' })
  json(res, 200, { lesson: dersten(rows[0]) })
}

async function dersinOrnekleri(db, req, res, m, url) {
  // Tavan: çağıran 10.000 isterse de vermeyiz. Rapora en fazla birkaç örnek
  // giriyor; sınırsız limit tek istekle tüm arşivi çekmenin kolay yolu olurdu.
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 3) || 3, 50)
  const { rows } = await db.sorgu(
    'select * from reject_cases where lesson_id = $1 order by rejected_at desc nulls last limit $2',
    [m[1], limit],
  )
  json(res, 200, { examples: rows.map(vakadan) })
}

async function tumVakalar(db, req, res) {
  const { rows } = await db.sorgu(
    'select * from reject_cases order by coalesce(rejected_at, created_at::date) desc',
    [],
  )
  json(res, 200, { examples: rows.map(vakadan) })
}

async function vektorleriOku(db, req, res) {
  const { rows } = await db.sorgu('select * from lesson_vectors', [])
  json(res, 200, {
    vectors: rows.map((r) => ({
      lessonId: r.lesson_id, model: r.model, dim: r.dim, hash: r.hash, vec: r.embedding ?? [],
    })),
  })
}

async function blobOku(db, req, res, m) {
  const key = decodeURIComponent(m[1])
  const { rows } = await db.sorgu('select content from blobs where key = $1', [key])
  // Boş gövde HATA DEĞİL: yerel depo da okunamayan gövdede '' döndürüyor ve
  // çağıran taraf buna göre yazılmış. 404 fırlatmak denetimi düşürürdü —
  // eksik bir gövde yüzünden tüm raporu kaybetmek orantısız.
  metin(res, 200, rows[0]?.content ?? '')
}

/** Gövde ve satır TEK İŞLEMDE: yarısı yazılmış kayıt kalmasın. */
const blobYaz = (sorgu, key, icerik, tur) =>
  sorgu(
    `insert into blobs (key, content, content_type) values ($1, $2, $3)
     on conflict (key) do update set content = excluded.content,
       content_type = excluded.content_type, updated_at = now()`,
    [key, String(icerik ?? ''), tur],
  )

async function dersYarat(db, req, res) {
  const { lesson, body } = await govde(req)
  if (!lesson?.id) return json(res, 400, { error: 'lesson.id yok' })
  if (!lesson.bodyKey) return json(res, 400, { error: 'lesson.bodyKey yok' })

  // Eski Supabase+R2 yolunda bu mümkün değildi: önce R2'ye yazılıyor, sonra
  // satır atılıyordu ve satır patlarsa ortada sahipsiz bir gövde kalıyordu.
  // Tek veritabanına geçmenin bedava kazancı.
  await db.islem(async (sorgu) => {
    await blobYaz(sorgu, lesson.bodyKey, body, 'text/markdown')
    await sorgu(
      `insert into lessons (id, rule_id, platform, guideline, scope, title, summary, signals,
         false_positive, artifact, severity, status, body_key, example_count, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
               coalesce($15::timestamptz, now()), coalesce($16::timestamptz, now()))`,
      [
        lesson.id, lesson.ruleId ?? null, lesson.platform, lesson.guideline,
        lesson.scope ?? 'listing', lesson.title, lesson.summary, lesson.signals ?? [],
        lesson.falsePositive ?? null, lesson.artifact ?? null, lesson.severity,
        lesson.status ?? 'draft', lesson.bodyKey, lesson.exampleCount ?? 0,
        lesson.createdAt || null, lesson.updatedAt || null,
      ],
    )
  })
  json(res, 201, { ok: true, id: lesson.id })
}

async function dersDurumu(db, req, res, m) {
  const { status } = await govde(req)
  // Şemadaki check kısıtı zaten koruyor ama hata mesajı Postgres'in olurdu.
  // Kapıda söylemek, sebebi arayan kişiye doğru cümleyi veriyor.
  if (!['draft', 'active', 'retired'].includes(status)) {
    return json(res, 400, { error: `geçersiz durum: ${status} (draft|active|retired)` })
  }
  const { rowCount } = await db.sorgu(
    'update lessons set status = $1, updated_at = now() where id = $2',
    [status, m[1]],
  )
  if (!rowCount) return json(res, 404, { error: `Ders bulunamadı: ${m[1]}` })
  json(res, 200, { ok: true })
}

async function vakaEkle(db, req, res) {
  const { example, raw } = await govde(req)
  if (!example?.id) return json(res, 400, { error: 'example.id yok' })
  if (!example.rawKey) return json(res, 400, { error: 'example.rawKey yok' })

  await db.islem(async (sorgu) => {
    await blobYaz(sorgu, example.rawKey, raw, 'text/plain')
    await sorgu(
      `insert into reject_cases (id, lesson_id, app_name, platform, rejected_at, guideline,
         artifact, excerpt, reviewer_text, resolution, raw_key, status, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, coalesce($13::timestamptz, now()))`,
      [
        example.id, example.lessonId, example.appName, example.platform,
        example.rejectedAt || null, example.guideline, example.artifact ?? null,
        example.excerpt ?? '', example.reviewerText, example.resolution ?? null,
        example.rawKey, example.status ?? 'draft', example.createdAt || null,
      ],
    )
  })
  // example_count tetikleyici ile güncelleniyor (sql/lessons.sql)
  json(res, 201, { ok: true, id: example.id })
}

async function vektorYaz(db, req, res) {
  const { vectors } = await govde(req)
  if (!Array.isArray(vectors) || !vectors.length) return json(res, 200, { ok: true, yazilan: 0 })

  await db.islem(async (sorgu) => {
    for (const v of vectors) {
      await sorgu(
        `insert into lesson_vectors (lesson_id, model, dim, hash, embedding, updated_at)
         values ($1,$2,$3,$4,$5, now())
         on conflict (lesson_id) do update set
           model = excluded.model, dim = excluded.dim, hash = excluded.hash,
           embedding = excluded.embedding, updated_at = now()`,
        [v.lessonId, v.model, v.dim, v.hash, v.vec ?? []],
      )
    }
  })
  json(res, 200, { ok: true, yazilan: vectors.length })
}

// İki tablo, çünkü kapı kontrolü tek yerde ve GÖZLE doğrulanabilir olmalı.
// Tek tabloda `yazarMi: true` bayrağıyla tutulsaydı, unutulan bir bayrak
// yazma ucunu herkese açardı.
//
// GENEL = geçerli herhangi bir belirteç yeter (okuma da, yazma da).
// YAZMA = yalnız yazma belirteci.

const GENEL_YOLLAR = [
  ['GET', /^\/lessons$/, dersleriListele],
  ['GET', /^\/lessons\/([^/]+)$/, dersBul],
  ['GET', /^\/lessons\/([^/]+)\/examples$/, dersinOrnekleri],
  ['GET', /^\/examples$/, tumVakalar],
  ['GET', /^\/vectors$/, vektorleriOku],
  ['GET', /^\/blob\/(.+)$/, blobOku],

  /**
   * Durum değişikliği (onayla / emekliye ayır) BİLEREK herkese açık.
   *
   * Onay ekiple birlikte yapılan bir iş: taslak dersi gören kişi, o red'i
   * yaşayan kişi ve denetimi koşturan kişi çoğu zaman farklı. Onayı yalnız
   * yazma belirtecine bağlamak, ders havuzunun tıkandığı yer olurdu —
   * onaylanmayan ders denetimi hiç etkilemiyor, yani havuz öğrenmiyor.
   *
   * BUNUN BEDELİ GERÇEK ve küçümsenmemeli: bir dersi aktifleştirmek
   * HERKESİN raporunu değiştirir. O yüzden açılan tek şey bu: `status`
   * alanı. Ders yaratmak, vaka eklemek, gövde yazmak ve vektör basmak
   * yazma belirtecinde KALIYOR. Sızan bir okuma belirteci arşive içerik
   * ekleyemez ve var olanı EZEMEZ — yalnız var olan bir dersin durumunu
   * çevirebilir; o da geri çevrilebilir bir işlem.
   *
   * Kısmak istersen: bu satırı YAZMA_YOLLARI'na taşı, başka hiçbir yer
   * değişmez (eklenti 403'ü zaten düzgün gösteriyor).
   */
  ['PATCH', /^\/lessons\/([^/]+)$/, dersDurumu],
]

const YAZMA_YOLLARI = [
  ['POST', /^\/lessons$/, dersYarat],
  ['POST', /^\/examples$/, vakaEkle],
  ['PUT', /^\/vectors$/, vektorYaz],
]

/**
 * Postgres'in kısıt hataları KULLANICI hatasıdır, sunucu hatası değil.
 * 500 döndürseydik istemci "havuz bozuk" der ve gerçek sebebi (aynı id,
 * geçersiz severity, olmayan ders) hiç görmezdik.
 */
function pgDurumu(e) {
  if (e.code === '23505') return [409, `zaten var: ${e.detail ?? e.message}`]
  if (e.code === '23503') return [400, `bağlı kayıt yok: ${e.detail ?? e.message}`]
  if (e.code === '23514') return [400, `geçersiz değer: ${e.detail ?? e.message}`]
  if (e.code === '23502') return [400, `zorunlu alan boş: ${e.column ?? e.message}`]
  return null
}

/**
 * @param db      { sorgu(text, params), islem(fn) } — Postgres erişimi
 * @param okuma   okuma belirteci: okur + ders durumunu değiştirir
 * @param yazma   yazma belirteci: yukarıdakiler + ders/vaka/vektör yazar
 */
export function createRouter({ db, okuma, yazma }) {
  /** 'yok' | 'okuma' | 'yazma' */
  const yetki = (req) => {
    const t = req.headers['x-gl-token']
    if (belirtecEsit(t, yazma)) return 'yazma'
    if (belirtecEsit(t, okuma)) return 'okuma'
    return 'yok'
  }

  return async function istegiIsle(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      return res.end()
    }

    const url = new URL(req.url, 'http://havuz.invalid')
    // '/v1' önekiyle de girilebilsin: adresi ayarlara yapıştıran kişi
    // hangisini yazdığını hatırlamak zorunda kalmasın. LLM proxy'sinde de
    // aynı tolerans var.
    const yol = url.pathname.replace(/^\/v1/, '') || '/'
    const rol = yetki(req)

    try {
      // /health belirteçsiz açık: Docker'ın healthcheck'i belirteç taşıyamaz.
      // Karşılığında hiçbir veri sızdırmıyor — yalnız "ayakta mıyım" ve
      // "gönderdiğin belirteç ne işe yarıyor". İkincisi olmadan yanlış
      // belirteci ilk gerçek çağrıda öğrenirsin, o da genelde bir denetimin
      // ortasıdır.
      if (yol === '/' || yol === '/health') {
        try {
          const r = await db.sorgu('select count(*)::int as dersler from lessons', [])
          const sayim =
            rol === 'yok'
              ? {}
              : {
                  dersler: r.rows[0].dersler,
                  ornekler: (await db.sorgu('select count(*)::int as n from reject_cases', []))
                    .rows[0].n,
                }
          return json(res, 200, { ok: true, db: true, yetki: rol, ...sayim })
        } catch (e) {
          return json(res, 503, { ok: false, db: false, yetki: rol, error: e.message })
        }
      }

      for (const [yontem, kalip, isle] of YAZMA_YOLLARI) {
        const m = yol.match(kalip)
        if (!m) continue
        if (req.method !== yontem) continue
        if (rol !== 'yazma') return json(res, 403, { error: 'yazma belirteci gerekli' })
        return await isle(db, req, res, m, url)
      }

      for (const [yontem, kalip, isle] of GENEL_YOLLAR) {
        const m = yol.match(kalip)
        if (!m) continue
        if (req.method !== yontem) continue
        if (rol === 'yok') return json(res, 403, { error: 'geçersiz belirteç' })
        return await isle(db, req, res, m, url)
      }

      // Yol tanınıyor ama yöntem yanlışsa 404 yanıltıcı olurdu: "böyle bir uç
      // yok" der, oysa var ve yalnız fiil hatalı.
      const yolVar = [...GENEL_YOLLAR, ...YAZMA_YOLLARI].filter(([, k]) => k.test(yol))
      if (yolVar.length) {
        return json(res, 405, {
          error: `bu yolda yalnız ${[...new Set(yolVar.map(([y]) => y))].join(', ')}`,
        })
      }
      json(res, 404, { error: `bilinmeyen yol: ${yol}` })
    } catch (e) {
      const pgd = pgDurumu(e)
      if (pgd) return json(res, pgd[0], { error: pgd[1] })
      if (e.http) return json(res, e.http, { error: e.message })
      // Gövde LOGLANMAZ — yalnız yol ve hata. Red yazışmaları buradan geçiyor.
      console.error(JSON.stringify({ at: new Date().toISOString(), yol, hata: e.message }))
      json(res, 500, { error: e.message })
    }
  }
}

export { CORS, GOVDE_TAVANI }
