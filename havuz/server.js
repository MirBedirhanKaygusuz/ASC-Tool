/**
 * Ortak ders havuzu — SUNUCU KABLOSU.
 *
 * Bu dosyanın tek işi bağlamak: Postgres havuzunu açmak, şemayı uygulamak,
 * yönlendiriciyi bir HTTP sunucusuna takmak ve kapanışı düzgün yapmak.
 *
 * İŞ MANTIĞI BURADA DEĞİL, router.js'te — ve orada bilerek Postgres sürücüsü
 * yok. Sebep: yetki kapıları, yol eşleşmesi ve yanıt biçimleri gerçek bir
 * veritabanı kurmadan test edilebilsin (scripts/test-core.ts). Sürücüyü
 * yönlendiriciye gömseydik o sözleşmenin tek sınaması üretim olurdu.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { createRouter } from './router.js'

const PORT = Number(process.env.PORT ?? 8787)
const SEMA_YOLU = process.env.SCHEMA_PATH ?? new URL('./lessons.sql', import.meta.url).pathname

/**
 * Belirteçler ZORUNLU — sunucu onlarsız açılmaz.
 *
 * LLM proxy'sinde (worker/index.js) belirteç isteğe bağlıydı, çünkü orası
 * durumsuz bir boru: en kötü ihtimalle biri senin modelini bedava kullanır ve
 * fatura tavanı onu durdurur. BURASI ÖYLE DEĞİL. Burada şirketin red
 * yazışmaları, uygulama isimleri ve düzeltme geçmişi duruyor. "Varsayılan
 * açık, sonra kısarız" o veri için doğru varsayılan değil.
 */
const OKUMA = process.env.HAVUZ_READ_TOKEN ?? ''
const YAZMA = process.env.HAVUZ_WRITE_TOKEN ?? ''
if (!OKUMA || !YAZMA) {
  console.error(
    'HATA: HAVUZ_READ_TOKEN ve HAVUZ_WRITE_TOKEN zorunlu.\n' +
      'Üretmek için:  openssl rand -hex 32\n' +
      'İkisi FARKLI olmalı: okuma ofisteki herkeste, yazma yalnız red işleyende.',
  )
  process.exit(1)
}
if (OKUMA === YAZMA) {
  console.error(
    'HATA: okuma ve yazma belirteci aynı. Aynıysa okuma yetkisi vermek ' +
      'yazma yetkisi vermektir ve ayrımın hiçbir anlamı kalmaz.',
  )
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
})

/**
 * Yönlendiricinin gördüğü veritabanı yüzeyi: iki fonksiyon.
 *
 * `islem` işlem sarmalayıcısını TEK yerde tutuyor. Her uç noktada
 * begin/commit/rollback/release yazmak, er geç birinde `release()` unutulması
 * demekti — havuz sızıntısı da en sinsi hata sınıflarından biri: yükün
 * altında, saatler sonra, alakasız bir uçta patlar.
 */
const db = {
  sorgu: (text, params) => pool.query(text, params),
  async islem(fn) {
    const c = await pool.connect()
    try {
      await c.query('begin')
      const sonuc = await fn((text, params) => c.query(text, params))
      await c.query('commit')
      return sonuc
    } catch (e) {
      await c.query('rollback').catch(() => {})
      throw e
    } finally {
      c.release()
    }
  },
}

const sunucu = createServer(createRouter({ db, okuma: OKUMA, yazma: YAZMA }))

/**
 * Şemayı AÇILIŞTA uygula.
 *
 * Alternatif docker-entrypoint-initdb.d idi: yalnız BOŞ birimde koşar, yani
 * ilk kurulumdan sonra şema değişikliği elle migration ister ve er geç
 * unutulur. sql/lessons.sql'in her ifadesi yeniden çalıştırılabilir olduğu
 * için burada koşmak bedava: kap her yeniden başladığında şema tazelenir.
 */
async function semayiUygula() {
  const sql = await readFile(SEMA_YOLU, 'utf8')
  for (let deneme = 1; ; deneme++) {
    try {
      await pool.query(sql)
      return
    } catch (e) {
      // Compose'da API, Postgres'ten önce hazır olabiliyor. depends_on +
      // healthcheck bunu çoğunlukla çözüyor ama garanti değil.
      if (deneme >= 30) throw e
      console.log(`Postgres hazır değil (${e.code ?? e.message}), 2s sonra tekrar… (${deneme}/30)`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

semayiUygula()
  .then(() => sunucu.listen(PORT, () => console.log(`havuz ayakta: http://0.0.0.0:${PORT}`)))
  .catch((e) => {
    console.error(`Şema uygulanamadı: ${e.message}`)
    process.exit(1)
  })

// Kap durdurulurken açık bağlantıları kapat — yoksa Postgres tarafında bir
// süre ölü oturum kalır ve arka arkaya yeniden başlatmalar havuzu şişirir.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    sunucu.close(() => pool.end().then(() => process.exit(0)))
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
