/**
 * ÇEKİM TESTİ — gerçek ağa çıkar, "hangi veriyi nereden alabiliyoruz"u ölçer.
 *
 *   npm run test:fetch                  hepsi
 *   npm run test:fetch -- --app 6756182726
 *   npm run test:fetch -- --no-asc      Apple anahtarına dokunma
 *
 * `npm test` bunu KOŞMAZ ve koşmamalı: o testler ağsız, saniyeler sürer ve
 * her değişiklikte çalışır. Burası ağa çıkıyor, Apple'ın hız sınırına tabi ve
 * sonucu bizim kodumuz kadar Apple'a da bağlı. İkisini karıştırmak, "testler
 * kırmızı" ile "Apple bugün 429 verdi"yi aynı kovaya koymak olurdu.
 *
 * NE SINANIYOR: dört kaynak, hangisi neyi veriyor.
 *   1. Apple yönergeleri  — açık web, kazıma. Kural metinlerinin kaynağı.
 *   2. Vitrin (Lookup + ürün sayfası) — açık web, kazıma. Anahtar YOK.
 *   3. App Store Connect resmi API — .p8 anahtarı ister. Hazırlanan sürümü
 *      SADECE bu görüyor.
 *   4. iris uçları — tarayıcı oturumu ister; burada koşamaz, yalnız uç
 *      haritasının tutarlılığı sınanır. Canlı yoklaması eklentinin kanaryası.
 */
import { readdir, readFile } from 'node:fs/promises'

try {
  process.loadEnvFile('.env')
} catch {
  /* .env yok — ortam değişkenleri doğrudan verilmiş olabilir */
}

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

let passed = 0
let failed = 0
let skipped = 0
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`)
  cond ? passed++ : failed++
}
const atla = (msg: string) => {
  console.log(`  – ${msg}`)
  skipped++
}
const suite = (name: string) => console.log(`\n${name}`)
const say = (msg: string) => console.log(`    ${msg}`)

/** Alan dolu mu — ve doluysa ne kadar. Rapor "var/yok" değil, ÖLÇÜ versin. */
const olc = (label: string, value: unknown): string => {
  if (Array.isArray(value)) return `${label}: ${value.length}`
  if (typeof value === 'string') return `${label}: ${value.length} krk`
  if (value === undefined || value === null || value === '') return `${label}: —`
  return `${label}: ${String(value)}`
}

async function appIds(): Promise<string[]> {
  const tek = flag('--app')
  if (tek) return [tek]
  try {
    const files = await readdir('apps')
    return files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
  } catch {
    return []
  }
}

// ===========================================================================
async function yonergeler() {
  suite('1 · Apple App Review Guidelines — açık web (kazıma)')
  const { fetchGuidelinesHtml } = await import('./scrape-guidelines.js')
  const { parseGuidelines } = await import('../src/corpus/guidelines.js')
  const { loadGuidelines } = await import('../src/corpus/guidelines-node.js')

  let html = ''
  try {
    html = await fetchGuidelinesHtml()
  } catch (e) {
    ok(false, `sayfa çekilemedi: ${(e as Error).message}`)
    return
  }
  ok(html.length > 50_000, `sayfa çekildi (${Math.round(html.length / 1024)} KB)`)

  const canli = parseGuidelines(html)
  ok(canli.sections.length >= 100, `${canli.sections.length} madde ayrıştırıldı`)
  ok(!!canli.lastUpdated, `Apple'ın yazdığı tarih: ${canli.lastUpdated}`)

  const kritik = ['1.1', '2.1', '2.3.1', '2.3.3', '3.1.1', '3.1.2', '3.1.2(a)', '4.7', '5.1.1', '5.2']
  const eksik = kritik.filter((id) => !canli.sections.some((s) => s.id === id))
  ok(eksik.length === 0, `en çok atıf alan maddeler yerinde${eksik.length ? ` (eksik: ${eksik.join(', ')})` : ''}`)

  // Asıl soru: repodaki kopya güncel mi? Değilse denetim ESKİ kurala göre
  // koşuyor demektir ve bunu bilmek zorundayız.
  try {
    const yerel = await loadGuidelines()
    if (yerel.digest === canli.digest) {
      ok(true, `repodaki kopya GÜNCEL (parmak izi ${yerel.digest})`)
    } else {
      ok(false, `repodaki kopya ESKİ — "npm run guidelines" çalıştır (yerel ${yerel.digest} ≠ canlı ${canli.digest})`)
      const yeni = canli.sections.filter((s) => !yerel.sections.some((y) => y.id === s.id))
      const degisen = canli.sections.filter((s) => {
        const y = yerel.sections.find((v) => v.id === s.id)
        return y && y.text !== s.text
      })
      say(`+${yeni.length} yeni madde, ~${degisen.length} değişen madde`)
      for (const s of [...yeni, ...degisen].slice(0, 10)) say(`  ${s.id} ${s.title}`)
    }
  } catch (e) {
    ok(false, `repoda yerel kopya yok: ${(e as Error).message}`)
  }
}

// ===========================================================================
async function vitrin(ids: string[]) {
  suite('2 · App Store vitrini — açık web, ANAHTARSIZ (kazıma)')
  if (!ids.length) {
    atla('uygulama kimliği yok (apps/ boş, --app da verilmedi)')
    return []
  }
  const { fetchPublicListing } = await import('../src/fetch/public-store.js')
  const sonuclar: Array<{ appId: string; listing: any }> = []

  for (const appId of ids) {
    let listing: any
    try {
      listing = await fetchPublicListing(appId)
    } catch (e) {
      const mesaj = (e as Error).message
      // "Vitrinde yok" bir ARIZA değil: uygulama henüz yayınlanmamış
      // olabilir ve bu beklenen durumdur. Kırmızı yakmak yanlış alarm olur.
      if (/vitrininde bulunamadı/.test(mesaj)) atla(`${appId}: yayında değil (vitrin yalnız yayındakini bilir)`)
      else ok(false, `${appId}: ${mesaj}`)
      continue
    }
    sonuclar.push({ appId, listing })
    ok(!!listing.name, `${appId} · ${listing.name || '(ad yok)'}`)
    say(
      [
        olc('sürüm', listing.version),
        olc('açıklama', listing.description),
        olc('sürüm notu', listing.releaseNotes),
        olc('görsel', listing.screenshots),
        olc('IAP', listing.iaps),
      ].join(' · '),
    )
    say([olc('kategori', listing.category), olc('yaş', listing.ageRating), olc('fiyat', listing.formattedPrice)].join(' · '))
    for (const w of listing.warnings) say(`⚠ ${w}`)
  }

  const fiyatli = sonuclar.filter((s) => s.listing.iaps.some((p: any) => p.price !== null))
  ok(
    fiyatli.length > 0,
    `IAP fiyatları anahtarsız okunabiliyor (${fiyatli.length}/${sonuclar.length} uygulamada)`,
  )
  return sonuclar
}

// ===========================================================================
async function asc(ids: string[], vitrinler: Array<{ appId: string; listing: any }>) {
  suite('3 · App Store Connect resmi API — .p8 anahtarı ile')
  if (args.includes('--no-asc')) {
    atla('--no-asc verildi')
    return
  }
  const eksikEnv = ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY_PATH'].filter((k) => !process.env[k])
  if (eksikEnv.length) {
    atla(`anahtar yapılandırılmamış (${eksikEnv.join(', ')}) — vitrin yolu yine de çalışıyor`)
    return
  }

  const { AscClient, ascConfigFromEnv, fetchSubmission } = await import('../src/fetch/asc.js')

  let client: InstanceType<typeof AscClient>
  try {
    client = new AscClient(ascConfigFromEnv())
  } catch (e) {
    ok(false, `anahtar okunamadı: ${(e as Error).message}`)
    return
  }

  let liste: Awaited<ReturnType<typeof client.list>>
  try {
    liste = await client.list('/apps?limit=200')
  } catch (e) {
    ok(false, `/apps: ${(e as Error).message}`)
    return
  }
  ok(liste.data.length > 0, `hesapta ${liste.data.length} uygulama görünüyor`)

  // Tek uygulamada TAM çekim: her alanın gerçekten geldiğini gör.
  const hedef = ids.find((id) => liste.data.some((a) => a.id === id)) ?? liste.data[0]?.id
  if (!hedef) {
    atla('çekilecek uygulama bulunamadı')
    return
  }

  const uyarilar: string[] = []
  let sub: Awaited<ReturnType<typeof fetchSubmission>>
  const t0 = Date.now()
  try {
    sub = await fetchSubmission(hedef, { onWarn: (m) => uyarilar.push(m) })
  } catch (e) {
    ok(false, `fetchSubmission(${hedef}): ${(e as Error).message}`)
    return
  }
  ok(true, `${hedef} · ${sub.appName} — tam çekim ${Math.round((Date.now() - t0) / 1000)} sn`)

  // Alan alan kapsam. "Çekildi" demek yetmez; hangi alan BOŞ döndü, denetimin
  // hangi kuralı körleşiyor demektir.
  const alanlar: Array<[string, unknown]> = [
    ['ad', sub.text.name],
    ['altyazı', sub.text.subtitle],
    ['açıklama', sub.text.description],
    ['anahtar kelime', sub.text.keywords],
    ['tanıtım metni', sub.text.promotionalText],
    ['yenilikler', sub.text.whatsNew],
    ['kategori', sub.category],
    ['yaş sınırı', sub.ageRating],
    ['ekran görüntüsü', sub.media.screenshots],
    ['ikon', sub.media.icon?.path],
    ['IAP', sub.iap],
    ['gizlilik URL', sub.urls.privacy],
    ['destek URL', sub.urls.support],
    ['review notu', sub.reviewNotes.notes],
  ]
  for (const [ad, deger] of alanlar) say(olc(ad, deger))

  const bosMetin = alanlar.filter(([, v]) => typeof v === 'string' && !v).map(([a]) => a)
  ok(bosMetin.length < alanlar.length / 2, `alanların çoğu doldu (boş: ${bosMetin.join(', ') || 'yok'})`)

  const fiyatsiz = sub.iap.filter((p) => !p.price)
  ok(
    sub.iap.length === 0 || fiyatsiz.length === 0,
    sub.iap.length === 0
      ? 'uygulamada IAP yok'
      : `${sub.iap.length} ürünün ${sub.iap.length - fiyatsiz.length} tanesinde fiyat okundu` +
          (fiyatsiz.length ? ` — okunamayan: ${fiyatsiz.map((p) => p.id).slice(0, 5).join(', ')}` : ''),
  )
  for (const u of uyarilar) say(`⚠ ${u}`)

  // ---- Çapraz kontrol: iki bağımsız kaynak aynı fiyatı mı söylüyor? ------
  const vit = vitrinler.find((v) => v.appId === hedef)
  if (!vit) {
    atla('bu uygulamanın vitrini çekilmediği için fiyat çapraz kontrolü yapılamadı')
    return
  }
  const { crossCheckPrices } = await import('../src/fetch/public-store.js')
  const kontrol = crossCheckPrices(
    sub.iap.map((p) => ({ name: p.name, price: p.price })),
    vit.listing.iaps,
  )
  if (!kontrol.length) {
    atla('ürün adları iki kaynakta eşleşmedi — çapraz kontrol atlandı (zorla eşleştirmiyoruz)')
    return
  }
  for (const k of kontrol) {
    say(`${k.verdict.padEnd(16)} ${k.productName}: ASC ${k.ours} · vitrin ${k.theirs}`)
  }
  const bozuk = kontrol.filter((k) => k.verdict !== 'uyuşuyor')
  ok(bozuk.length === 0, `fiyatlar iki bağımsız kaynakta uyuşuyor (${kontrol.length} ürün)`)
}

// ===========================================================================
async function irisHaritasi() {
  suite('4 · iris uçları — tarayıcı oturumu gerekiyor (burada yalnız harita sağlaması)')
  const kod = await readFile('extension/src/endpoints.js', 'utf8')
  const ctx = {
    appId: '123',
    iapId: 'i1',
    subGroupId: 'g1',
    versionId: 'v1',
    apps: [{ id: '123' }],
    app: { id: '123' },
  }
  // endpoints.js globalThis.__gl'e yazıyor; sahte bir global ile yükleyip
  // haritayı okuyoruz. Ağ yok — sınanan şey yolların ÜRETİLEBİLİRLİĞİ.
  const g: any = {}
  new Function('globalThis', kod).call({ ...g }, g)
  const uclar: any[] = g.__gl?.endpoints ?? []

  ok(uclar.length > 30, `${uclar.length} uç tanımlı`)
  // Uçların çoğu düz bir yol üretiyor; birkaçı (ör. red geçmişi taraması)
  // çok adımlı ve kendi `find` fonksiyonuyla geliyor. İkisi de geçerli —
  // hiçbiri olmayan bir uç ise kanaryada sessizce atlanır.
  const kimsesiz = uclar.filter((u) => typeof u.path !== 'function' && typeof u.find !== 'function')
  ok(kimsesiz.length === 0, `her ucun yol üreticisi ya da find'ı var${kimsesiz.length ? ` (eksik: ${kimsesiz.map((u) => u.id).join(', ')})` : ''}`)
  const bozuk = uclar.filter((u) => {
    if (typeof u.path !== 'function') return false
    try {
      const p = u.path(ctx)
      return p !== null && (typeof p !== 'string' || !p.startsWith('/'))
    } catch {
      return true
    }
  })
  ok(bozuk.length === 0, `yol üreticileri hata vermiyor${bozuk.length ? ` (${bozuk.map((u) => u.id).join(', ')})` : ''}`)
  const kanitsiz = uclar.filter((u) => !u.kanit)
  say(`${uclar.length - kanitsiz.length} uç sahada doğrulanmış, ${kanitsiz.length} tanesi tahmin`)
  say('canlı yoklama: eklentiyi aç → Kanarya turu (ASC sekmesinde oturum gerekiyor)')
}

// ===========================================================================
/**
 * Panel sayaçlarının BAĞIMSIZ doğrulaması.
 *
 * NEDEN VAR: panel "0 geri çekildi" gösterirken ASC'nin Activity tablosunda 5
 * "Developer Rejected" vardı. Sayaç sürümün ANLIK durumuna bakıyordu, geçmişe
 * değil — ve hiçbir test bunu yakalamıyordu çünkü tüm testler eklentinin kendi
 * verisini eklentinin kendi koduyla sınıyordu. Buradaki sağlama farklı: aynı
 * soruyu Apple'ın RESMİ API'sine soruyoruz. İki kapı ayrı cevap verirse
 * birimiz yanlışız ve bunu tahminle değil ölçümle öğreniyoruz.
 */
async function sayaclar(ids: string[]) {
  suite('5 · Panel sayaçları — resmi API ile çapraz sağlama')
  const { AscClient, ascConfigFromEnv } = await import('../src/fetch/asc.js')
  let client: InstanceType<typeof AscClient>
  try {
    client = new AscClient(ascConfigFromEnv())
  } catch (e) {
    atla(`resmi API yapılandırılmamış: ${(e as Error).message}`)
    return
  }
  const appId = ids[0]
  if (!appId) return atla('uygulama yok')

  const hepsi = async (path: string) => {
    const out: any[] = []
    let url: string | null = path
    for (let i = 0; url && i < 20; i++) {
      const p: any = await client.get(url)
      out.push(...(p.data ?? []))
      url = p.links?.next ?? null
    }
    return out
  }

  const versions = await hepsi(`/v1/apps/${appId}/appStoreVersions?limit=200`)
  ok(versions.length > 0, `${versions.length} sürüm (resmi API)`)

  // ANLIK DURUM SAYIMININ NEDEN ÇALIŞMADIĞININ KANITI: bu hesapta hiçbir sürüm
  // bugün reddedilmiş durumda değil, oysa geçmişte 3 Apple reddi var. Eski
  // sayaç tam bu yüzden 0 diyordu.
  const bugunRed = versions.filter((v: any) =>
    /^(REJECTED|METADATA_REJECTED|DEVELOPER_REJECTED)$/.test(String(v.attributes?.appVersionState ?? '')))
  say(`bugün reddedilmiş durumda olan sürüm: ${bugunRed.length} — red sayısı buradan ÇIKARILAMAZ`)
  ok(bugunRed.length < versions.length,
    'anlık durum ile geçmiş farklı şeyler — sayaç geçmişe bakmalı')

  const infos = await hepsi(`/v1/apps/${appId}/appInfos?limit=200`)
  const kunyeDili = infos[0]
    ? (await hepsi(`/v1/appInfos/${infos[0].id}/appInfoLocalizations?limit=200`)).length
    : 0
  const surumDili = versions[0]
    ? (await hepsi(`/v1/appStoreVersions/${versions[0].id}/appStoreVersionLocalizations?limit=200`)).length
    : 0
  say(`künye dili: ${kunyeDili} · yayındaki sürümün metin dili: ${surumDili}`)
  ok(kunyeDili > 0 && surumDili > 0, 'iki dil sayısı da okunabiliyor')
  // Bu ikisi AYRI sayılmazsa panel "17 dil" der ve denetimin 17 dil metni
  // okuduğu sanılır; oysa okuduğu metin sürüm dilinde.
  if (kunyeDili !== surumDili) {
    say(`AYRIŞIYOR — panel ikisini AYRI göstermeli (künye ${kunyeDili} ≠ metin ${surumDili})`)
  }

  const subs = await hepsi(`/v1/apps/${appId}/reviewSubmissions?limit=200`)
  say(`reviewSubmissions: ${subs.length} — ASC'nin Activity tablosundaki gönderim satırlarından AZ olabilir`)
  ok(subs.length >= 0, 'gönderim kaydı okunabiliyor')

  const cpp = await hepsi(`/v1/apps/${appId}/appCustomProductPages?limit=200`)
  say(`özel ürün sayfası: ${cpp.length}`)
  // Toplayıcının tavanı bunu kapsamalı; kapsamazsa sessizce eksik denetleriz.
  const kod = await readFile('extension/src/collector.js', 'utf8')
  const tavan = Number(/ozelSayfaTavani:\s*(\d+)/.exec(kod)?.[1] ?? 0)
  ok(tavan >= cpp.length,
    `özel sayfa tavanı (${tavan}) gerçek sayfa sayısını (${cpp.length}) kapsıyor`)

  const durumTavani = Number(/durumGecmisi:\s*(\d+)/.exec(kod)?.[1] ?? 0)
  ok(durumTavani >= versions.length,
    `durum geçmişi tavanı (${durumTavani}) sürüm sayısını (${versions.length}) kapsıyor — ` +
    'kapsamazsa red sayıları eksik çıkar')
}


// ===========================================================================
async function main() {
  console.log('ÇEKİM TESTİ — gerçek ağ. Apple hız sınırı uygular, sonuç ona da bağlıdır.')
  const ids = await appIds()
  await yonergeler()
  const vitrinler = await vitrin(ids)
  await asc(ids, vitrinler)
  await irisHaritasi()
  await sayaclar(ids)

  console.log(`\n${passed} geçti, ${failed} kaldı, ${skipped} atlandı`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(`\nHATA: ${(e as Error).message}`)
  process.exit(1)
})
