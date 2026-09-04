/**
 * Eklenti paketini üret.
 *
 * NEDEN DERLEME ADIMI VAR: denetim mantığı TypeScript'te ve tek kaynakta
 * durmalı. Kodu eklentiye elle kopyalasaydık iki gerçeklik oluşurdu —
 * terminaldeki `npm run check` ile eklentinin çalıştırdığı denetim zamanla
 * ayrışır ve hangisinin doğru olduğunu kimse bilmezdi.
 *
 * İki iş yapar:
 *   1. corpus/*.yaml → src/ext/corpus.generated.ts  (kural kitabı pakete gömülür)
 *   2. src/ext/audit.ts → extension/src/audit.bundle.js  (tek dosya, IIFE)
 *
 * Kullanıcı bu komutu ÇALIŞTIRMAZ. Çıktı repoda durur, ofis yalnız klasörü
 * kurar. Komut geliştirici içindir.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { build } from 'esbuild'
import { loadCorpus } from '../src/corpus/index.js'
import { loadGuidelines } from '../src/corpus/guidelines-node.js'

const OUT = 'extension/src/audit.bundle.js'
const PRICE_OUT = 'extension/src/iap-price.bundle.js'
const NORM_OUT = 'extension/src/normalize.bundle.js'
const HAVUZ_OUT = 'extension/src/havuz.bundle.js'
const GENERATED = 'src/ext/corpus.generated.ts'
const GUIDELINES = 'src/ext/guidelines.generated.ts'

async function main() {
  const { cards, version } = await loadCorpus()

  await mkdir('src/ext', { recursive: true })
  await writeFile(
    GENERATED,
    '// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: corpus/*.yaml\n' +
      '// Yeniden üretmek için: npm run build:ext\n' +
      "import type { RuleCard } from '../types.js'\n\n" +
      `export const CORPUS: { cards: RuleCard[]; version: string } = ${JSON.stringify(
        { cards, version },
        null,
        2,
      )}\n`,
  )
  console.log(`corpus gömüldü: ${cards.length} kart, sürüm ${version}`)

  // Apple'ın madde metinleri de pakete giriyor.
  //
  // NEDEN GÖMÜLÜ: eklenti denetimi tarayıcıda koşuyor, dosya sistemi yok ve
  // denetim sırasında Apple'ın sitesine gitmek istemiyoruz — hem yavaş, hem
  // "hangi metne göre denetlendi" sorusunun cevabı her çekimde değişirdi.
  // Bağlantıları atıyoruz: pakete 30 KB katıyorlar, modele hiç gitmiyorlar.
  const guidelines = await loadGuidelines()
  const slim = {
    lastUpdated: guidelines.lastUpdated,
    retrievedAt: guidelines.retrievedAt,
    digest: guidelines.digest,
    sections: guidelines.sections.map((s) => ({ id: s.id, title: s.title, text: s.text })),
  }
  await writeFile(
    GUIDELINES,
    '// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: data/apple-guidelines.json\n' +
      '// Yeniden üretmek için: npm run guidelines && npm run build:ext\n\n' +
      `export const GUIDELINES = ${JSON.stringify(slim, null, 2)} as const\n`,
  )
  console.log(
    `madde metinleri gömüldü: ${slim.sections.length} madde ` +
      `(Apple: ${slim.lastUpdated || '?'}, çekim: ${slim.retrievedAt || '?'})`,
  )

  const result = await build({
    entryPoints: ['src/ext/audit.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'GLAudit',
    // Eklenti Chrome'da koşuyor; eski tarayıcı desteği gereksiz yük.
    target: 'chrome120',
    platform: 'browser',
    outfile: OUT,
    legalComments: 'none',
    metafile: true,
  })

  const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0
  console.log(`paket: ${OUT} (${Math.round(bytes / 1024)} KB)`)

  // İkinci, küçük paket: fiyat çözücü.
  //
  // NEDEN AYRI: toplayıcı (collector.js) ASC SEKMESİNDE koşuyor, denetim
  // paketi ise görüntüleyici sayfasında. İki ayrı dünya; aynı fonksiyonu
  // çalışma anında paylaşamıyorlar. Paylaşamadıkları için de tek çare
  // KAYNAĞI paylaşmak: aynı TypeScript dosyası iki pakete de derleniyor.
  // Elle kopyalasaydık ikisi zamanla ayrışırdı — nitekim ayrışmıştı.
  const price = await build({
    entryPoints: ['src/iap-price.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'GLPrice',
    target: 'chrome120',
    platform: 'browser',
    outfile: PRICE_OUT,
    legalComments: 'none',
    metafile: true,
  })
  const priceBytes = Object.values(price.metafile.outputs)[0]?.bytes ?? 0
  console.log(`paket: ${PRICE_OUT} (${Math.round(priceBytes / 1024)} KB)`)

  // Üçüncü paket: döküm normalleştirici.
  //
  // Aynı kod iki yerde koşmak zorunda: toplayıcı YAZARKEN sadeleştiriyor,
  // görüntüleyici de eski (sema 1) kayıtları OKURKEN aynı şekle getiriyor.
  // İki ayrı kopya olsaydı eski ve yeni çekimler farklı şekilde okunur,
  // hangisinin doğru olduğunu kimse bilmezdi.
  const norm = await build({
    entryPoints: ['src/dump/normalize.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'GLNormalize',
    target: 'chrome120',
    platform: 'browser',
    outfile: NORM_OUT,
    legalComments: 'none',
    metafile: true,
  })
  const normBytes = Object.values(norm.metafile.outputs)[0]?.bytes ?? 0
  console.log(`paket: ${NORM_OUT} (${Math.round(normBytes / 1024)} KB)`)

  // Dördüncü paket: ortak ders havuzu istemcisi.
  //
  // AYNI SEBEP: havuzun sözleşmesini (hangi yol, hangi başlık, hangi alan
  // adı) iki kez yazmak istemiyoruz. Terminaldeki `npm run learn` ile
  // eklentinin denetimi AYNI TypeScript sınıfını kullanıyor; sunucu tarafı
  // değiştiğinde tek yer değişiyor. Elle kopyalanmış bir tarayıcı istemcisi
  // ilk şema değişikliğinde sessizce ayrışırdı.
  const havuz = await build({
    entryPoints: ['src/lessons/remote.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'GLHavuz',
    target: 'chrome120',
    platform: 'browser',
    outfile: HAVUZ_OUT,
    legalComments: 'none',
    metafile: true,
  })
  const havuzBytes = Object.values(havuz.metafile.outputs)[0]?.bytes ?? 0
  console.log(`paket: ${HAVUZ_OUT} (${Math.round(havuzBytes / 1024)} KB)`)

  // Node'a özgü bir şey sızdıysa paket tarayıcıda sessizce patlar; şimdi yakala.
  const { readFile } = await import('node:fs/promises')
  for (const dosya of [OUT, PRICE_OUT, NORM_OUT, HAVUZ_OUT]) {
    const code = await readFile(dosya, 'utf8')
    const sizinti = ['require(', 'node:fs', 'node:crypto', 'process.env'].filter((s) => code.includes(s))
    if (sizinti.length) {
      throw new Error(
        `${dosya} paketine Node'a özgü ifadeler sızmış: ${sizinti.join(', ')}. ` +
          'Tarayıcıda çalışmaz — import zincirini kontrol et.',
      )
    }
  }
  console.log('Node sızıntısı yok.')
}

main().catch((e) => {
  console.error(`\nHATA: ${e.message}`)
  process.exit(1)
})
