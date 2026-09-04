/**
 * Apple App Review Guidelines sayfasını çek, ayrıştır, `data/` altına yaz.
 *
 *   npm run guidelines            → ağdan çeker
 *   npm run guidelines -- --from x.html   → diskteki HTML'den üretir (test)
 *   npm run guidelines -- --dry   → yazmaz, yalnız ne olacağını söyler
 *
 * NEDEN AYRI KOMUT: bu veri denetim koşarken çekilmez. Kural metni çekim
 * anında ağdan gelseydi, Apple sayfayı değiştirdiği ya da ağ düştüğü gün
 * denetimin dayandığı kural sessizce değişirdi. Repoda duran dosya, "hangi
 * kural metnine göre denetlendi" sorusunun cevabıdır.
 *
 * YAZMADAN ÖNCE SAĞLAMA: ayrıştırıcı bozulursa çıktı "0 madde" olur ve eski
 * iyi dosyanın üstüne yazarsak kural kitabını sessizce kaybederiz. Bu yüzden
 * beklenen maddeler yoksa hata verip DOKUNMUYORUZ (belkiPatlarız R3).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import {
  GUIDELINES_PATH,
  GUIDELINES_URL,
  parseGuidelines,
  type GuidelineDoc,
} from '../src/corpus/guidelines.js'

/** Bunlar sayfada YOKSA ayrıştırma bozulmuştur — yıllardır duran maddeler. */
const BEKLENEN = ['1.1', '1.2', '2.1', '2.3.1', '2.3.3', '3.1.1', '3.1.2', '4.7', '5.1.1', '5.2']
const EN_AZ_MADDE = 100

/**
 * Apple developer sitesi tarayıcı dışı istemcilere 429 döndürebiliyor.
 * Tarayıcının gönderdiği başlıkların aynısını gönderiyoruz — kimlik
 * gizlemek için değil, sunucunun bot filtresine takılmamak için.
 */
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

export async function fetchGuidelinesHtml(url = GUIDELINES_URL): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60_000) })
  if (!res.ok) {
    throw new Error(
      `${url} → ${res.status}. ` +
        (res.status === 429
          ? 'Hız sınırı; birkaç dakika sonra tekrar dene.'
          : 'Sayfa taşınmış olabilir.'),
    )
  }
  const html = await res.text()
  if (!/App Review Guidelines/i.test(html)) {
    throw new Error('Gelen sayfa yönerge sayfasına benzemiyor — yönlendirme ya da hata sayfası.')
  }
  return html
}

/** Yazmadan önce: bu çıktı gerçekten yönerge kitabı mı? */
export function dogrula(doc: GuidelineDoc): string[] {
  const sorunlar: string[] = []
  const ids = new Set(doc.sections.map((s) => s.id))
  const eksik = BEKLENEN.filter((id) => !ids.has(id))
  if (eksik.length) sorunlar.push(`beklenen maddeler yok: ${eksik.join(', ')}`)
  if (doc.sections.length < EN_AZ_MADDE) {
    sorunlar.push(`yalnız ${doc.sections.length} madde çıktı (en az ${EN_AZ_MADDE} bekleniyor)`)
  }
  const bos = doc.sections.filter((s) => !s.text.trim() && !s.title.trim())
  if (bos.length) sorunlar.push(`${bos.length} madde bomboş: ${bos.slice(0, 5).map((s) => s.id).join(', ')}`)
  if (!doc.chapters.some((c) => c.number === '5')) sorunlar.push('bölüm başlıkları (1..5) eksik')
  return sorunlar
}

/** İki sürüm arasındaki fark — "Apple neyi değiştirdi" sorusunun cevabı. */
export function farklar(eski: GuidelineDoc | null, yeni: GuidelineDoc) {
  if (!eski) return { yeni: yeni.sections.map((s) => s.id), silinen: [], degisen: [] as string[] }
  const oncekiler = new Map(eski.sections.map((s) => [s.id, s]))
  const simdikiler = new Map(yeni.sections.map((s) => [s.id, s]))
  return {
    yeni: [...simdikiler.keys()].filter((id) => !oncekiler.has(id)),
    silinen: [...oncekiler.keys()].filter((id) => !simdikiler.has(id)),
    degisen: [...simdikiler.entries()]
      .filter(([id, s]) => oncekiler.has(id) && oncekiler.get(id)!.text !== s.text)
      .map(([id]) => id),
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const fromArg = argv.indexOf('--from')
  const dry = argv.includes('--dry')

  const html =
    fromArg >= 0
      ? await readFile(argv[fromArg + 1]!, 'utf8')
      : await fetchGuidelinesHtml()

  const doc = parseGuidelines(html, { retrievedAt: new Date().toISOString().slice(0, 10) })

  const sorunlar = dogrula(doc)
  if (sorunlar.length) {
    throw new Error(
      'Ayrıştırma sağlamayı geçemedi, dosyaya DOKUNULMADI:\n  - ' + sorunlar.join('\n  - '),
    )
  }

  let eski: GuidelineDoc | null = null
  try {
    eski = JSON.parse(await readFile(GUIDELINES_PATH, 'utf8')) as GuidelineDoc
  } catch {
    /* ilk çekim */
  }
  const fark = farklar(eski, doc)

  console.log(`kaynak      ${doc.url}`)
  console.log(`Apple tarihi ${doc.lastUpdated || '(sayfada yazmıyor)'}`)
  console.log(`madde       ${doc.sections.length} (${doc.chapters.length} bölüm)`)
  console.log(`karakter    ${doc.sections.reduce((n, s) => n + s.text.length, 0).toLocaleString('tr-TR')}`)
  console.log(`parmak izi  ${doc.digest}${eski ? (eski.digest === doc.digest ? ' (değişmemiş)' : ` (önceki ${eski.digest})`) : ''}`)
  if (eski) {
    console.log(`fark        +${fark.yeni.length} yeni, -${fark.silinen.length} silinen, ~${fark.degisen.length} değişen`)
    for (const id of [...fark.yeni, ...fark.silinen, ...fark.degisen].slice(0, 20)) {
      const tur = fark.yeni.includes(id) ? 'YENİ' : fark.silinen.includes(id) ? 'SİLİNDİ' : 'DEĞİŞTİ'
      console.log(`  ${tur.padEnd(8)} ${id}`)
    }
  }

  if (dry) {
    console.log('\n--dry: yazılmadı.')
    return
  }
  await mkdir('data', { recursive: true })
  await writeFile(GUIDELINES_PATH, JSON.stringify(doc, null, 2) + '\n')
  console.log(`\nyazıldı: ${GUIDELINES_PATH}`)
}

// Yalnız doğrudan çalıştırıldığında koş. `test-fetch.ts` bu dosyadan
// `fetchGuidelinesHtml`i içeri alıyor; koruma olmasaydı testi başlatmak
// sessizce bir çekim yapıp dosyayı da yeniden yazardı.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`\nHATA: ${(e as Error).message}`)
    process.exit(1)
  })
}
