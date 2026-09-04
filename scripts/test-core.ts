/**
 * Çekirdek testler — `src/` altındaki saf mantık.
 *
 * Eklenti testleri (`extension/test/run.mjs`) düz Node ESM ile koşuyor ve
 * TypeScript'i içeri alamıyor. Burası tsx ile koşar; ikisi birlikte
 * `npm test` altında.
 */
import { readFile } from 'node:fs/promises'
import { dedupeFindings, riskScore } from '../src/report/index.js'
import {
  parseGuidelines, findSection, sectionWithChildren, htmlToText, decodeEntities,
} from '../src/corpus/guidelines.js'
import { loadGuidelines } from '../src/corpus/guidelines-node.js'
import { loadCorpus } from '../src/corpus/index.js'
import {
  priceFromPool, priceFromSchedule, pickCurrentPrice, priceFromRecords,
} from '../src/iap-price.js'
import {
  parseStorePage, parsePriceText, parseLookup, crossCheckPrices,
} from '../src/fetch/public-store.js'
import { submissionPrefix, renderRuleCard, OFFICIAL_TEXT_LIMIT } from '../src/check/prompt.js'
import type { Finding, LintFinding, MediaRef, RuleCard, Submission } from '../src/types.js'

/**
 * GERÇEK fetch — sahteyle değiştirilmeden önce.
 *
 * Aşağıdaki vitrin testleri `globalThis.fetch`i değiştiriyor. Eskiden geri
 * koymuyorlardı ve sonraki her test sessizce sahte ağla koşuyordu: gerçek bir
 * HTTP sunucusuna bağlanan havuz testi, sunucu ayaktayken bile "ulaşılamadı"
 * diyordu. Sahtenin ömrü kendi bloğuyla sınırlı olmalı.
 */
const GERCEK_FETCH = globalThis.fetch

let passed = 0
let failed = 0
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`)
  cond ? passed++ : failed++
}

const finding = (over: Partial<Finding> = {}): Finding => ({
  ruleId: 'apple-3.1.2-subscription-disclosure',
  platform: 'apple',
  severity: 'high',
  outcome: 'violation',
  artifact: 'iap',
  locator: { type: 'field', field: 'iap' },
  excerpt: 'Weekly Pack — 14.99 USD',
  rationale: 'gerekçe',
  suggestedFix: 'düzelt',
  confidence: 1,
  ...over,
})

console.log('\nreport/index.ts — dedupeFindings')
{
  // 2026-08-21 sahada görüldü: aynı kart aynı alıntıda iki bulgu üretince
  // rapor "apple-3.1.2 + apple-3.1.2" yazıyordu.
  const out = dedupeFindings([finding(), finding({ rationale: 'başka gerekçe' })])
  ok(out.length === 1, 'aynı alıntıdaki iki bulgu tek bulguya iniyor')
  ok(out[0]!.ruleId === 'apple-3.1.2-subscription-disclosure', 'aynı kart id\'si TEKRARLANMIYOR')

  const iki = dedupeFindings([finding(), finding({ ruleId: 'apple-2.3.1-hidden-features' })])
  ok(iki[0]!.ruleId.includes(' + '), 'FARKLI kartlar birleşince ikisi de yazılıyor')

  // 2026-09-02 sahada görüldü: `apple-3.1.2-subscription-disclosure` DÖRT kez
  // düştü. Dördünün gerekçesi harfiyen aynıydı — "The subscription details are
  // not explicitly stated in the listing" — yalnız alıntıları farklıydı, çünkü
  // kart abonelik başına bir bulgu üretiyor. Okuyan dört ayrı sorun sanıyor,
  // skor da dört kat sayıyor. Oysa tek eksiklik var.
  //
  // Bu test ESKİDEN "farklı alıntılar ayrı bulgu kalıyor" diyordu. Saha o
  // inancı çürüttü: gerekçe aynıysa sorun da aynıdır, düzeltmesi de aynıdır.
  const ayniGerekce = dedupeFindings([finding(), finding({ excerpt: 'Yearly Pack — 59.99 USD' })])
  ok(ayniGerekce.length === 1,
    'aynı kural + aynı gerekçe tek bulguya iniyor (alıntılar farklı olsa da)')
  ok(/Yearly Pack/.test(ayniGerekce[0]!.excerpt) && ayniGerekce[0]!.excerpt.includes('\n— '),
    'birleşen bulgunun BÜTÜN alıntıları korunuyor — her biri kanıt, atılamaz')

  // Asıl koruma bu: gerekçe FARKLIYSA ayrı kalmalı. Aksi halde iki ayrı sorun
  // tek satıra iner ve biri sessizce kaybolur.
  const farkliGerekce = dedupeFindings([
    finding(),
    finding({ excerpt: 'Yearly Pack — 59.99 USD', rationale: 'fiyat metinle çelişiyor' }),
  ])
  ok(farkliGerekce.length === 2, 'gerekçe farklıysa ayrı bulgu kalıyor — sorunlar birbirini yutmuyor')

  const karisik = dedupeFindings([finding({ severity: 'low' }), finding({ severity: 'high' })])
  ok(karisik[0]!.severity === 'high', 'birleşmede en ağır önem derecesi korunuyor')

  const dersli = dedupeFindings([finding({ lessonIds: ['a'] }), finding({ lessonIds: ['b'] })])
  ok(dersli[0]!.lessonIds?.length === 2, 'ders bağları birleşiyor (gerçek red örnekleri düşmüyor)')
}

console.log('\nreport/index.ts — riskScore')
{
  const lint: LintFinding[] = []
  ok(riskScore(lint, []) === 0, 'bulgu yoksa skor 0')
  ok(riskScore(lint, [finding()]) > 0, 'yüksek bulgu skoru yükseltiyor')
  ok(riskScore(lint, [finding()]) <= 100, 'skor 100 üstüne çıkmıyor')
}

console.log('\ncheck/prompt.ts — modele giden ekran görüntüleri')
{
  const shots = (deviceClass: string, n: number): MediaRef[] =>
    Array.from({ length: n }, (_, i) => ({ id: `${deviceClass}-${i}`, path: `https://x/${deviceClass}/${i}.png`, deviceClass, order: i + 1 }))

  const subWith = (screenshots: MediaRef[]): Submission => ({
    platform: 'apple', appId: '1', appName: 'T', locale: 'en-US', category: 'Utilities', ageRating: '4+',
    text: {}, media: { screenshots }, iap: [], urls: {}, reviewNotes: {}, meta: {},
    source: { kind: 'manual', fetchedAt: '' },
  })

  const yukle = async () => ({ mime: 'image/png', b64: 'AAA' })
  const say = (blocks: Awaited<ReturnType<typeof submissionPrefix>>) =>
    blocks.filter((b) => b.type === 'image').length
  const notOf = (blocks: Awaited<ReturnType<typeof submissionPrefix>>) =>
    blocks.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n')

  // Sahada görülen durum: 16 görüntü, 2 sınıf. Eski kural 6 tanesini
  // gönderiyordu ve 2.3.3 kartı "çoğunluk" sorusunu cevaplayamıyordu.
  const iki = await submissionPrefix(subWith([...shots('iphone_6_7', 8), ...shots('ipad_pro_12_9', 8)]),
    { withImages: true, loadImage: yukle })
  ok(say(iki) === 8, `en zengin sınıfın TAMAMI gidiyor (${say(iki)}/8), diğer sınıf gönderilmiyor`)
  ok(/ipad_pro_12_9: 8/.test(notOf(iki)), 'gönderilmeyen sınıf modele AÇIKÇA söyleniyor')
  ok(/8\/8/.test(notOf(iki)), 'kaçta kaçının gösterildiği yazıyor — "çoğunluk" hükmü kurulabilsin')

  // Telefon sınıfı, iPad'de daha çok görsel olsa bile tercih edilmeli:
  // App Store'da kullanıcının gördüğü ve Apple'ın red gerekçelerinin atıf
  // yaptığı küme telefon.
  const tercih = await submissionPrefix(subWith([...shots('ipad_pro_12_9', 9), ...shots('iphone_6_7', 4)]),
    { withImages: true, loadImage: yukle })
  ok(/iphone_6_7 cihaz sınıfının 4\/4/.test(notOf(tercih)), 'iPad daha kalabalık olsa bile TELEFON sınıfı seçiliyor')

  const cok = await submissionPrefix(subWith(shots('iphone_6_7', 14)), { withImages: true, loadImage: yukle })
  ok(say(cok) === 10, `tek sınıfta bile üst sınır var (${say(cok)}/14)`)

  let hata = ''
  try {
    await submissionPrefix(subWith(shots('iphone_6_7', 3)), { withImages: true })
  } catch (e) {
    hata = (e as Error).message
  }
  ok(/yükleyici verilmedi/.test(hata), 'yükleyici yoksa SESSİZCE görselsiz devam etmiyor, hata veriyor')
}


// ===========================================================================
console.log('\ncorpus/guidelines.ts — Apple madde metinlerinin ayrıştırılması')
// ===========================================================================
{
  // Fikstür GERÇEK sayfadan kırpıldı (fixtures/guidelines-sample.html).
  // Elle yazılmış sahte HTML, Apple'ın işaretlemesindeki tuhaflıkları
  // (iç içe <li>, boş <span> çapası, "3.1.2a" gibi harfli numaralar)
  // taşımadığı için ayrıştırıcıyı sınamaz — yalnız kendini sınar.
  const html = await readFile('fixtures/guidelines-sample.html', 'utf8')
  const doc = parseGuidelines(html, { retrievedAt: '2026-08-21' })
  const id = (x: string) => doc.sections.find((s) => s.id === x)

  ok(!!id('1.1') && !!id('1.1.4'), 'üst madde ve alt maddeler ayrı kayıt oluyor')
  ok(id('1.1')!.title === 'Objectionable Content', 'başlık numaradan ayrılıyor')
  ok(id('1.1.4')!.title === '', 'alt maddede uydurma başlık üretilmiyor')
  ok(
    id('1.1')!.text.startsWith('Apps should not include content'),
    'üst maddenin metni kendi giriş cümlesi',
  )
  ok(
    !id('1.1')!.text.includes('Defamatory'),
    'alt maddenin metni üst maddeye SIZMIYOR (sızsaydı aynı metin iki kez modele giderdi)',
  )
  ok(id('1.1.4')!.text.includes('pornographic'), 'alt maddenin kendi metni yerinde')
  ok(
    id('1')!.title === 'Safety' && !id('1')!.text.startsWith('1. Safety'),
    'bölüm başlığı metinden çıkarılıp kendi alanına alınıyor',
  )
  ok(id('1.1.2')!.parent === '1.1' && id('1.1')!.parent === '1', 'üst madde bağı kuruluyor')
  ok(id('1.1.2')!.chapterTitle === 'Safety', 'madde hangi bölümde olduğunu biliyor')

  // Apple harfli alt maddeleri `id="3.1.2a"` diye yazıyor, metinde ve red
  // mektuplarında "3.1.2(a)" diye geçiyor. En çok atıf alan maddeler bunlar.
  ok(!!id('3.1.2(a)'), 'harfli alt madde (3.1.2a → 3.1.2(a)) yakalanıyor')
  ok(id('3.1.2(a)')!.title === 'Permissible uses', 'harfli maddenin başlığı okunuyor')
  ok(id('3.1.2(a)')!.parent === '3.1.2', 'harfli maddenin üstü doğru')

  ok(doc.lastUpdated === 'June 8, 2026', 'Apple\'ın "Last Updated" tarihi okunuyor')
  ok(doc.sections.every((s) => s.url.includes('#' + s.id)), 'her maddenin doğrulanabilir adresi var')
  ok(doc.sections.some((s) => s.id === 'introduction'), 'numarasız düzyazı bölümleri de alınıyor')

  // Sayfa iskeleti değişirse SESSİZ BOŞ ÇIKTI en tehlikelisi: eski iyi
  // dosyanın üstüne yazarsak kural kitabını kaybederiz.
  let hata = ''
  try {
    parseGuidelines('<html><body>bomboş</body></html>')
  } catch (e) {
    hata = (e as Error).message
  }
  ok(/içerik bloğu bulunamadı/.test(hata), 'tanınmayan sayfada sessizce boş dönmüyor, HATA veriyor')

  // Arama: red mektubu "Guideline 5.1.1(i)" der, kart "3.1.2" der.
  ok(findSection(doc, 'Guideline 1.1.4')?.id === '1.1.4', '"Guideline" öneki ayıklanıyor')
  ok(findSection(doc, '3.1.2(a)')?.id === '3.1.2(a)', 'harfli madde birebir bulunuyor')
  ok(findSection(doc, '1.1.9')?.id === '1.1', 'olmayan alt madde ÜST maddeye düşüyor')
  ok(findSection(doc, '9.9') === null, 'hiç yoksa null — uydurma metin gösterilmiyor')

  const tam = sectionWithChildren(doc, '3.1.2')
  ok(
    tam.includes('Permissible uses') && tam.includes('3.1.2(c)'),
    'madde metni harfli alt maddeleriyle birlikte veriliyor (yarısı gizlenmiyor)',
  )
  ok(sectionWithChildren(doc, '1.1').includes('Defamatory'), 'numaralı alt maddeler de ekleniyor')

  ok(decodeEntities('App&nbsp;Store &amp; &#8217;') === 'App Store & ’', 'HTML varlıkları çözülüyor')
  ok(htmlToText('<li>bir</li><li>iki</li>') === 'bir\niki', 'madde imleri birbirine yapışmıyor')
}

// ===========================================================================
console.log('\ndata/apple-guidelines.json — repodaki kural kitabının sağlaması')
// ===========================================================================
{
  // Ayrıştırıcının çalışması yetmez: REPODAKİ dosya gerçekten dolu mu?
  // "npm run guidelines" bozuk bir çıktı yazdıysa burası kırmızı yanar.
  let doc: Awaited<ReturnType<typeof loadGuidelines>> | null = null
  try {
    doc = await loadGuidelines()
  } catch {
    /* dosya yok — aşağıdaki ilk test bunu söyler */
  }
  ok(!!doc, 'data/apple-guidelines.json var (yoksa: npm run guidelines)')
  if (doc) {
    const eksik = ['1.1', '2.1', '2.3.1', '2.3.3', '3.1.1', '3.1.2', '4.7', '5.1.1', '5.2'].filter(
      (x) => !doc!.sections.some((s) => s.id === x),
    )
    ok(eksik.length === 0, `en çok atıf alan maddelerin hepsi var (eksik: ${eksik.join(', ') || 'yok'})`)
    ok(doc.sections.length >= 100, `${doc.sections.length} madde çekilmiş (en az 100 bekleniyor)`)
    ok(doc.sections.every((s) => s.text.trim() || s.title.trim()), 'bomboş madde yok')
    ok(!!doc.lastUpdated && !!doc.retrievedAt, 'hangi tarihli metin, ne zaman çekilmiş — ikisi de kayıtlı')
    ok(
      sectionWithChildren(doc, '2.3.3').includes('Screenshots should show the app in use'),
      'madde metni gerçekten Apple\'ın cümlesi',
    )
  }
}

// ===========================================================================
console.log('\niap-price.ts — fiyat zinciri (toplayıcı ve eşleyici AYNI kodu kullanır)')
// ===========================================================================
{
  const havuz = [
    { id: 'schedA', type: 'inAppPurchasePriceSchedules', relationships: { manualPrices: { data: [{ id: 'pA' }] } } },
    { id: 'pA', type: 'inAppPurchasePrices', relationships: { inAppPurchasePricePoint: { data: { id: 'ppA' } } } },
    { id: 'ppA', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '1.99', currency: 'USD' } },
    { id: 'schedB', type: 'inAppPurchasePriceSchedules', relationships: { manualPrices: { data: [{ id: 'pB' }] } } },
    { id: 'pB', type: 'inAppPurchasePrices', relationships: { inAppPurchasePricePoint: { data: { id: 'ppB' } } } },
    { id: 'ppB', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '9.99', currency: 'USD' } },
  ]
  const urun = (id: string, sched: string) => ({ id, relationships: { iapPriceSchedule: { data: { id: sched } } } })

  ok(priceFromPool(urun('A', 'schedA'), havuz)?.price === 1.99, 'ürün KENDİ zincirinden fiyatını alıyor')
  ok(priceFromPool(urun('B', 'schedB'), havuz)?.price === 9.99, 'karışık havuzda ikinci ürün karışmıyor')
  ok(priceFromPool({ id: 'C' }, havuz) === null, 'çizelge ilişkisi olmayan üründe null')

  // 2026-08-21'de sahada olan: Apple çizelgenin KABUĞUNU gönderiyor, fiyat
  // noktasını göndermiyor. Toplayıcı buna "fiyat geldi" derse ürün başına
  // istek atmıyor, eşleyici okuyamıyor, rapor sessizce 0 yazıyor.
  const kabuk = [{ id: 'schedA', type: 'inAppPurchasePriceSchedules', attributes: {} }]
  ok(
    priceFromPool(urun('A', 'schedA'), kabuk) === null,
    'KABUK çizelge "fiyat geldi" saymıyor — sessiz sıfırın kaynağı buydu',
  )

  ok(
    priceFromSchedule({ included: [{ attributes: { customerPrice: '4.99', currency: 'USD' } }] })?.price === 4.99,
    'ürün başına çekilen çizelgeden fiyat okunuyor',
  )
  ok(priceFromSchedule(undefined) === null, 'çizelge yoksa null')
  ok(priceFromSchedule({ included: [] }) === null, 'boş çizelgede uydurma fiyat üretilmiyor')
}

// ===========================================================================
console.log('\nfetch/public-store.ts — anahtarsız vitrin (web scraping)')
// ===========================================================================
{
  const html = await readFile('fixtures/store-page-sample.html', 'utf8')
  const { iaps, info, warnings } = parseStorePage(html)

  ok(iaps.length === 10, `vitrin sayfasından ${iaps.length} ürün okundu`)
  ok(iaps[0]!.name === 'BeauifAi Pro Trial' && iaps[0]!.price === 14.99, 'ürün adı ve fiyatı eşleşiyor')
  ok(iaps.every((p) => p.price !== null), 'fiyatların hepsi sayıya çevrildi')
  ok(!!info['Age Rating'] && !!info['Seller'], 'bilgi tablosu (satıcı, yaş sınırı) okunuyor')
  ok(warnings.length === 0, 'sağlam sayfada gereksiz uyarı yok')

  // Bölümün yokluğu "ürün yok" DEMEK DEĞİL — ayrıştırıcı bozulunca da öyle
  // görünür. İkisini ayırt edemiyoruz, o yüzden söylüyoruz.
  const bos = parseStorePage('<html><dl></dl></html>')
  ok(bos.iaps.length === 0 && bos.warnings.length > 0, 'IAP bölümü yoksa sessizce "ürün yok" denmiyor')

  ok(parsePriceText('$14.99') === 14.99, 'ABD biçimi fiyat')
  ok(parsePriceText('14,99 €') === 14.99, 'Avrupa biçimi fiyat (virgül ondalık)')
  ok(parsePriceText('₺1.299,00') === 1299, 'binlik ayracı olan fiyat')
  ok(parsePriceText('$1,299.00') === 1299, 'ters yazılmış binlik ayracı')
  ok(parsePriceText('Free') === 0, '"Free" sıfır fiyat')
  ok(parsePriceText('') === null, 'boş metinde null — 0 yazmıyoruz')

  const listing = parseLookup({
    trackName: 'Glamio',
    description: 'x',
    version: '1.1.2',
    primaryGenreName: 'Photo & Video',
    genres: ['Photo & Video', 'Lifestyle'],
    trackContentRating: '4+',
    price: 0,
    currency: 'USD',
    screenshotUrls: ['a', 'b'],
    languageCodesISO2A: ['EN'],
    userRatingCount: 51,
  })
  ok(listing.name === 'Glamio' && listing.categories?.length === 2, 'Lookup alanları eşleniyor')
  ok(listing.ageRating === '4+' && listing.screenshots?.length === 2, 'yaş sınırı ve görseller alınıyor')

  // Çapraz kontrol: elimizdeki fiyat 0 ise gerçekten bedava mı, okuyamadık mı?
  const kontrol = crossCheckPrices(
    [
      { name: 'Standard Pack', price: 0 },
      { name: 'Small Pack', price: 4.99 },
      { name: 'Yearly Offer', price: 19.99 },
    ],
    iaps,
  )
  ok(
    kontrol.find((k) => k.productName === 'Standard Pack')?.verdict === 'bizde okunamadı',
    '0 yazdığımız ürün vitrinde ücretliyse "okunamadı" deniyor',
  )
  ok(kontrol.find((k) => k.productName === 'Small Pack')?.verdict === 'uyuşuyor', 'doğru fiyat uyuşuyor sayılıyor')
  ok(
    kontrol.find((k) => k.productName === 'Yearly Offer')?.verdict === 'ÇELİŞİYOR',
    'farklı fiyat çelişki olarak işaretleniyor',
  )
  ok(
    crossCheckPrices([{ name: 'Olmayan Ürün', price: 1 }], iaps).length === 0,
    'adı tutmayan ürün ZORLA eşleştirilmiyor (yanlış ürüne yanlış fiyat yazılmaz)',
  )
}

// ===========================================================================
console.log('\ncheck/prompt.ts — Apple madde metninin prompt\'a girişi')
// ===========================================================================
{
  const kart = {
    id: 'apple-2.3.3-screenshots-reflect-app',
    source: { doc: 'Apple App Review Guidelines', section: '2.3.3', url: 'https://x/#2.3.3', retrievedAt: '2026-08-18' },
    ruleText: 'Bizim özetimiz.',
    question: 'Soru?',
    positiveExample: 'a',
    negativeExample: 'b',
  } as unknown as RuleCard

  const metinsiz = renderRuleCard(kart, [])
  ok(!/Apple'ın kendi metni/.test(metinsiz), 'madde metni yoksa boş başlık basılmıyor')

  const metinli = renderRuleCard(kart, [], 'Screenshots should show the app in use.')
  ok(/Apple'ın kendi metni \(2\.3\.3\)/.test(metinli), 'madde metni kendi başlığı altında veriliyor')
  ok(/Screenshots should show the app in use/.test(metinli), 'Apple\'ın cümlesi prompt\'a giriyor')
  ok(/Bizim özetimiz/.test(metinli), 'kartın kendi metni de duruyor — biri ötekinin yerine geçmiyor')

  const uzun = renderRuleCard(kart, [], 'x'.repeat(OFFICIAL_TEXT_LIMIT + 500))
  ok(uzun.includes('kırpıldı'), 'çok uzun madde kırpılıyor ama SESSİZCE değil')
  ok(uzun.includes('https://x/#2.3.3'), 'kırpılınca tam metnin adresi veriliyor')
}


// ===========================================================================
console.log('\niap-price.ts — bugün geçerli fiyat hangisi')
// ===========================================================================
{
  // 2026-08-21, gerçek hesapta görülen kayıtlar: Apple aynı ürün için iki
  // fiyat döndürüyor. "İlkini al" demek, eski abonelere korunan fiyatı
  // rapora yazmaktı — Weekly Pack 5.99 göründü, App Store'da 14.99'du.
  const korunmus = { id: 'p1', attributes: { startDate: null, preserved: true }, relationships: { subscriptionPricePoint: { data: { id: 'pp1' } } } }
  const guncel = { id: 'p2', attributes: { startDate: '2026-08-06', preserved: false }, relationships: { subscriptionPricePoint: { data: { id: 'pp2' } } } }
  const havuz = [
    { id: 'pp1', type: 'subscriptionPricePoints', attributes: { customerPrice: '5.99' } },
    { id: 'pp2', type: 'subscriptionPricePoints', attributes: { customerPrice: '14.99' } },
  ]

  ok(pickCurrentPrice([korunmus, guncel])?.record.id === 'p2', 'korunmuş (preserved) fiyat elenip güncel fiyat seçiliyor')
  ok(
    priceFromRecords([korunmus, guncel], havuz, 'subscriptionPricePoint')?.price === 14.99,
    'fiyat noktası SEÇİLEN kaydın ilişkisinden okunuyor (havuzdan ilki değil)',
  )

  // İleri tarihli fiyat değişikliği: bugünü geçmeyen en yenisi geçerlidir.
  const eski = { id: 'a', attributes: { startDate: '2026-01-01' } }
  const yeni = { id: 'b', attributes: { startDate: '2026-08-06' } }
  const gelecek = { id: 'c', attributes: { startDate: '2026-12-01' } }
  ok(
    pickCurrentPrice([eski, gelecek, yeni], '2026-08-21')?.record.id === 'b',
    'yürürlükteki en yeni fiyat seçiliyor, ileri tarihli olan seçilmiyor',
  )

  const sadeceGelecek = pickCurrentPrice([gelecek], '2026-08-21')
  ok(sadeceGelecek?.record.id === 'c', 'hepsi ileri tarihliyse en yakını alınıyor')
  ok(/yürürlüğe giriyor/.test(sadeceGelecek?.note ?? ''), 'ileri tarihli fiyat SESSİZCE bugünkü fiyat sayılmıyor')

  const yalnizKorunmus = pickCurrentPrice([korunmus])
  ok(yalnizKorunmus?.record.id === 'p1', 'başka kayıt yoksa korunmuş fiyat kullanılıyor')
  ok(/preserved/.test(yalnizKorunmus?.note ?? ''), 'korunmuş fiyata düşüldüğü söyleniyor')

  ok(pickCurrentPrice([]) === null, 'kayıt yoksa null')
  ok(priceFromRecords([korunmus], [], 'subscriptionPricePoint') === null, 'fiyat noktası havuzda yoksa uydurma fiyat yok')
}


// ===========================================================================
console.log('\ncheck/check.ts — madde metni gerçekten modele gidiyor mu')
// ===========================================================================
{
  // renderRuleCard'ın doğru metni üretmesi yetmez: `runCheck` onu çağırırken
  // madde metnini GEÇİRMEZSE hiçbir test kırmızı yanmadan özellik ölür.
  // Burada sahte bir sağlayıcıyla modele giden gerçek istek yakalanıyor.
  const gorulen: string[] = []
  const sahteLlm = {
    name: 'test',
    model: 'test',
    supportsVision: false,
    concurrency: 1,
    async healthcheck() {
      return { ok: true }
    },
    async complete(req: { suffix: string }) {
      gorulen.push(req.suffix)
      return {
        json: { findings: [] },
        raw: '{"findings":[]}',
        usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, ms: 1 },
      }
    },
  }

  const kart = {
    id: 'apple-2.3.3-screenshots-reflect-app',
    platform: 'apple',
    source: { doc: 'Apple App Review Guidelines', section: '2.3.3', url: 'https://x/#2.3.3', retrievedAt: '2026-08-18' },
    tags: ['metadata'],
    scope: 'single',
    needs: ['description'],
    question: 'Soru?',
    ruleText: 'Bizim özetimiz.',
    positiveExample: 'a',
    negativeExample: 'b',
    outcome: 'violation',
    defaultSeverity: 'high',
    version: 1,
  } as unknown as RuleCard

  const sub = JSON.parse(await readFile('fixtures/glamio-apple.json', 'utf8')) as Submission
  const { runCheck } = await import('../src/check/check.js')
  await runCheck(sahteLlm as any, sub, [kart], new Map(), undefined, {
    guidelineText: (section) => `[${section}] Screenshots should show the app in use.`,
  })

  ok(gorulen.length === 1, 'kural modele soruldu')
  ok(/Apple'ın kendi metni/.test(gorulen[0] ?? ''), 'madde metni bloğu istekte var')
  ok(/Screenshots should show the app in use/.test(gorulen[0] ?? ''), 'Apple\'ın cümlesi gerçekten modele gidiyor')
  ok(/\[2\.3\.3\]/.test(gorulen[0] ?? ''), 'kartın madde numarasıyla sorulmuş (yanlış maddenin metni gitmiyor)')

  // Madde metni verilmezse denetim DURMAMALI — kart tek başına çalışır.
  gorulen.length = 0
  await runCheck(sahteLlm as any, sub, [kart], new Map())
  ok(gorulen.length === 1 && !/Apple'ın kendi metni/.test(gorulen[0]!), 'metin yokken denetim yine koşuyor')
}


// ===========================================================================
console.log('\ncheck/price-crosscheck.ts — okunamayan fiyatı bağımsız kaynakla doğrula')
// ===========================================================================
{
  const { crossCheckMissingPrices } = await import('../src/check/price-crosscheck.js')
  const sayfa = await readFile('fixtures/store-page-sample.html', 'utf8')

  const urun = (name: string, price: number) =>
    ({ id: name, kind: 'consumable', name, description: '', price, currency: 'USD' }) as any
  const subWith = (iap: any[]): Submission =>
    ({
      platform: 'apple', appId: '6756182726', appName: 'Glamio', locale: 'en-US',
      category: 'Photo & Video', ageRating: '4+',
      text: { name: 'Glamio' }, media: { screenshots: [] }, iap,
      urls: {}, reviewNotes: {}, meta: {},
    }) as any

  // Vitrin fikstürü: Lookup JSON + gerçek ürün sayfası HTML'i.
  let istekler: string[] = []
  const sahteAg = (opts: { lookupOk?: boolean } = {}) => {
    istekler = []
    globalThis.fetch = (async (url: any) => {
      const u = String(url)
      istekler.push(u)
      if (u.includes('itunes.apple.com')) {
        if (opts.lookupOk === false) return { ok: false, status: 503, text: async () => '' } as any
        return {
          ok: true, status: 200,
          text: async () => JSON.stringify({
            resultCount: 1,
            results: [{ trackName: 'Glamio', currency: 'USD', trackViewUrl: 'https://apps.apple.com/us/app/id6756182726' }],
          }),
        } as any
      }
      return { ok: true, status: 200, text: async () => sayfa } as any
    }) as any
  }

  // 1) Hepsi okunduysa AĞA ÇIKMA. Doğrulama bedava değil; gerekmiyorsa yapılmaz.
  sahteAg()
  const temiz = await crossCheckMissingPrices(subWith([urun('Small Pack', 4.99)]))
  ok(istekler.length === 0, 'fiyatların hepsi okunduysa tek istek bile atılmıyor')
  ok(temiz.findings.length === 0 && temiz.notChecked.length === 0, 'gereksiz uyarı üretilmiyor')

  // 2) 0 yazdığımız ürün vitrinde ÜCRETLİ → sessiz "bedava" varsayımı yakalanır.
  sahteAg()
  const sifir = await crossCheckMissingPrices(subWith([urun('Standard Pack', 0)]))
  const bulgu = sifir.findings.find((f) => f.checkId === 'lint-price-unreadable-but-live')
  ok(!!bulgu, 'fiyatı 0 okunan ürün vitrinde ücretliyse bulgu üretiliyor')
  ok(/14\.99/.test(bulgu?.message ?? ''), 'bulgu vitrindeki gerçek fiyatı KANIT olarak yazıyor')

  // 3) İki kaynak da sayı söylüyor ama farklı — sıfırdan daha sinsi hata.
  sahteAg()
  const celiski = await crossCheckMissingPrices(subWith([urun('Small Pack', 0), urun('Yearly Offer', 19.99)]))
  ok(celiski.findings.some((f) => f.checkId === 'lint-price-store-mismatch'),
    'ASC ile vitrin farklı fiyat söylüyorsa çelişki bulgusu üretiliyor')

  // 4) Doğrulama kapalıysa: bulgu yok ama SESSİZ de değil.
  const kapali = await crossCheckMissingPrices(subWith([urun('Standard Pack', 0)]), { enabled: false })
  ok(kapali.findings.length === 0 && /okunamadı/.test(kapali.notChecked[0] ?? ''),
    'doğrulama kapalıyken bulgu uydurulmuyor ama "denetlenmedi" yazılıyor')

  // 5) Vitrin düşerse denetim düşmez; "temiz" de denmez.
  sahteAg({ lookupOk: false })
  const dusuk = await crossCheckMissingPrices(subWith([urun('Standard Pack', 0)]))
  ok(dusuk.findings.length === 0 && dusuk.notChecked.length > 0,
    'vitrin erişilemezse hata yutulmuyor, "denetlenmedi" olarak raporlanıyor')

  // 6) Adı tutmayan ürün ZORLA eşleştirilmiyor (yanlış ürüne yanlış fiyat).
  sahteAg()
  const eslesmez = await crossCheckMissingPrices(subWith([urun('Hic Olmayan Urun', 0)]))
  ok(eslesmez.findings.length === 0 && /eşleşmedi/.test(eslesmez.notChecked.join(' ')),
    'vitrinde eşleşmeyen ürün için hüküm kurulmuyor, sebebi yazılıyor')

  // Sahte ağ BURADA bitiyor. Sızarsa sonraki testler gerçek ağa çıktığını
  // sanarken sahteyle konuşur ve hatayı kendi kodlarında arar.
  globalThis.fetch = GERCEK_FETCH
}

// ===========================================================================
console.log('\nfetch/apple-tables.ts — ASC ülke kodu → vitrin kodu')
// ===========================================================================
{
  const { storefrontOf } = await import('../src/fetch/apple-tables.js')
  ok(storefrontOf('USA') === 'us', 'USA → us ("usa" olsaydı vitrin 404 verirdi)')
  ok(storefrontOf('TUR') === 'tr', 'TUR → tr')
  ok(storefrontOf('gb') === 'gb', 'iki harfli kod olduğu gibi kabul ediliyor')
  ok(storefrontOf('XYZ') === undefined, 'bilinmeyen kodda uydurma üretilmiyor')
  ok(storefrontOf(undefined) === undefined, 'kod yoksa undefined')
}


// ===========================================================================
console.log('\ndump/normalize.ts — taşıma zarfını at, bilgiyi tut')
// ===========================================================================
{
  const { normalizeRecord, normalizeSection, hamKayit, isNormalized, SEMA } =
    await import('../src/dump/normalize.js')

  const kayit = {
    type: 'apps',
    id: '674',
    attributes: {
      name: 'AI Video',
      contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
      removed: false,
      grnNumber: null,
      accessibilityUrl: null,
      sku: '',
    },
    relationships: {
      appInfos: { links: { self: 'https://x/self', related: 'https://x/related' } },
      builds: { links: { related: 'https://x/b' } },
      primaryCategory: { data: { type: 'appCategories', id: 'PHOTO_AND_VIDEO' }, links: { self: 'https://x/c' } },
      appScreenshots: { data: [{ id: 's1' }, { id: 's2' }] },
    },
    links: { self: 'https://appstoreconnect.apple.com/iris/v1/apps/674' },
  }

  const kopya = JSON.parse(JSON.stringify(kayit))
  const n = normalizeRecord(kayit, { iliskiAdlari: true }) as any

  // MUTASYONSUZ OLMAK ZORUNDA: toplayıcı gezinirken canlı kayıttan
  // `links.related` okuyor (relPath). Kaydı yerinde değiştirseydik yol
  // uydurmaya dönerdik — kanaryadaki 404'lerin sebebi buydu.
  ok(JSON.stringify(kayit) === JSON.stringify(kopya), 'girdi kaydı DEĞİŞTİRİLMİYOR (relPath canlı kayıttan okuyor)')

  ok(n.links === undefined && JSON.stringify(n).includes('appstoreconnect') === false,
    'links tamamen atıldı — depodan link okuyan tek bir kod yolu yok')
  ok(n.id === '674' && n.tip === 'apps', 'kimlik ve tip korunuyor')
  ok(n.name === 'AI Video', 'attributes üste çıktı (attrs() sarmalayıcısı gerekmiyor)')
  ok(n.removed === false, 'false KALIYOR — "beyan edildi ve hayır" bilgi taşır')
  ok(n.contentRightsDeclaration === 'DOES_NOT_USE_THIRD_PARTY_CONTENT', '5.2 için gereken beyan duruyor')
  ok(n.grnNumber === undefined && n._bos?.includes('grnNumber'),
    'null atıldı ama ADI tutuldu: "alan boş" ile "alan hiç gelmedi" ayrı haber')
  ok(n.iliski?.primaryCategory === 'PHOTO_AND_VIDEO', 'ilişki tek kimliğe indi')
  ok(Array.isArray(n.iliski?.appScreenshots) && n.iliski.appScreenshots.length === 2, 'çoğul ilişki kimlik dizisine indi')
  ok(n._iliski?.sayi === 2 && n._iliski.adlar.includes('builds'),
    'yalnız adres taşıyan ilişkilerin sayısı ve adı tutuluyor (R2: yeni uç açıldı mı)')

  // Ad çarpışması: attributes içinde `id` gelirse sessizce üstüne yazamayız.
  const carpisan = normalizeRecord({ id: '1', type: 't', attributes: { id: 'BASKA', tip: 'x', ok: 1 } }) as any
  ok(carpisan.id === '1' && carpisan._alanlar?.id === 'BASKA', 'ad çarpışmasında alan kaybolmuyor, _alanlar altına kaçıyor')

  // IDEMPOTENCY: okuma anındaki sadeleştirme buna dayanıyor.
  const birKez = normalizeSection('app', kayit).data
  const ikiKez = normalizeSection('app', birKez).data
  ok(JSON.stringify(birKez) === JSON.stringify(ikiKez), 'norm(norm(x)) === norm(x) — iki kez uygulanınca veri bozulmuyor')
  ok(hamKayit(kayit) && !hamKayit(birKez), 'ham/sade ayrımı yapılabiliyor')
  ok(isNormalized([birKez]) && !isNormalized([kayit]), 'dizi için de ayrım çalışıyor')
  ok(SEMA === 2, 'şema sürümü damgalanıyor')
}

// ===========================================================================
console.log('\ndump/normalize.ts — bölüme özel damıtma')
// ===========================================================================
{
  const { normalizeSection, redSayilari } = await import('../src/dump/normalize.js')

  // Yaş beyanı: 20 satır NONE/false var ve KALIYORLAR. Atsaydık "beyan
  // edilmiş ve içerik yok" ile "beyan edilmemiş" ayırt edilemezdi ve yaş
  // tutarlılık kontrolü sessizce "temiz" derdi.
  const yas = normalizeSection('ageRating', {
    type: 'ageRatingDeclarations', id: 'a1',
    attributes: { userGeneratedContent: true, gambling: false, contests: 'NONE', kidsAgeBand: null },
  }).data as any
  ok(yas.userGeneratedContent === true && yas.gambling === false && yas.contests === 'NONE',
    'yaş beyanında false ve "NONE" korunuyor')
  ok(yas._bos?.includes('kidsAgeBand'), 'null beyan adı olarak tutuluyor')

  // Gizlilik etiketi: anlamın tamamı ilişki kimliğinde; included yalnız
  // {deleted:false} taşıyan 15 kayıt — taşıma detayı.
  const gizlilik = normalizeSection('dataUsages', {
    data: [{
      type: 'appDataUsages', id: 'd1',
      relationships: {
        category: { data: { id: 'CRASH_DATA' } },
        grouping: { data: { id: 'DIAGNOSTICS' } },
        purpose: { data: null },
        dataProtection: { data: { id: 'DATA_USED_TO_TRACK_YOU' } },
      },
    }],
    included: [{ type: 'appDataUsageCategories', id: 'CRASH_DATA', attributes: { deleted: false } }],
  }).data as any
  ok(gizlilik.length === 1 && gizlilik[0].kategori === 'CRASH_DATA' && gizlilik[0].grup === 'DIAGNOSTICS',
    'gizlilik etiketi düz satıra indi')
  ok(gizlilik[0].koruma === 'DATA_USED_TO_TRACK_YOU',
    'TAKİP beyanı korunuyor — 5.1.2 ATT kontrolünün tek dayanağı bu')
  ok(gizlilik[0].amac === undefined, 'boş ilişki satıra yazılmıyor')

  // Review iletişim: değer değil VARLIK (R4 — ham indirmelere sızmasın).
  const rd = normalizeSection('reviewDetail', {
    type: 'appStoreReviewDetails', id: 'r1',
    attributes: {
      contactFirstName: 'Batuhan', contactLastName: 'K', contactEmail: 'a@b.c', contactPhone: '+90',
      demoAccountName: 'demo@x', demoAccountPassword: 'sifre', demoAccountRequired: true, notes: 'not',
    },
  }).data as any
  ok(rd.iletisim?.ad === true && rd.iletisim?.eposta === true, 'iletişim VARLIK olarak tutuluyor')
  ok(rd.contactEmail === undefined && !JSON.stringify(rd).includes('a@b.c'), 'iletişim DEĞERİ saklanmıyor (R4)')
  ok(rd.demoAccountPassword === 'sifre', 'demo hesap KALIYOR — placeholder lint\'i ona bakıyor')

  // Durum geçmişi: red sayılarının TEK doğru kaynağı. `initiator` bir e-posta
  // adresi ve sayımda kullanılmıyor — 2025 kayıtlarında Apple'ın satırlarında
  // zaten boş geliyor, ona güvenen bir sayım o reddleri kaçırırdı.
  const sc = normalizeSection('stateChanges', [
    { versionId: 'v0', versionString: '2.0.0', olaylar: [
      { type: 'x', id: '1', attributes: { appVersionState: 'REJECTED', date: '2026-08-11', initiator: 'kisi@sirket.com' } },
      { type: 'x', id: '2', attributes: { appVersionState: 'DEVELOPER_REJECTED', date: '2026-08-10', initiator: 'kisi@sirket.com' } },
    ] },
  ]).data as any
  ok(sc[0].surum === '2.0.0' && sc[0].olaylar[0].durum === 'REJECTED', 'geçmiş sürüm sürüm tutuluyor')
  ok(!JSON.stringify(sc).includes('kisi@sirket.com'), 'initiator (e-posta) atılıyor — R4')
  ok(redSayilari(sc).apple === 1 && redSayilari(sc).geriCekilen === 1,
    'Apple reddi ile geliştiricinin geri çekmesi AYRI sayılıyor')
  ok(!JSON.stringify(sc).includes('@sirket.com'), 'initiator e-postası atıldı (R4)')

  // Teklifler: Apple ülke başına bir satır döndürüyor; 175 kopya tek satıra.
  const abone = normalizeSection('subscriptions', [{
    id: 's1', productId: 'p', name: 'Weekly', period: 'ONE_WEEK', state: 'APPROVED',
    price: { customerPrice: '14.99', currency: 'USD' },
    offers: Array.from({ length: 175 }, () => ({ offerMode: 'PAY_AS_YOU_GO', duration: 'ONE_WEEK', numberOfPeriods: 1, startDate: '2026-08-05' })),
    locales: [{ type: 'subscriptionLocalizations', id: 'l', attributes: { locale: 'en-US', name: 'Weekly Pack' } }],
  }])
  const a0 = (abone.data as any)[0]
  ok(a0.teklifler.length === 1 && a0.teklifler[0].adet === 175,
    'aynı teklifin 175 ülke kopyası tek satıra indi, sayısı korundu')
  ok(abone.notlar.some((n) => /175 teklif satırı/.test(n)), 'tekilleştirme SESSİZ değil, çekim günlüğüne yazılıyor')
  ok(a0.diller[0].locale === 'en-US', 'abonelik metinleri düzleşti')

  // Ürünler: fiyat toplama anında çözülüyor; eşleyici zincir yürütmüyor.
  const urunler = normalizeSection('iaps', {
    data: [{
      type: 'inAppPurchases', id: 'A',
      attributes: { productId: 'urun.a', inAppPurchaseType: 'CONSUMABLE', state: 'MISSING_METADATA' },
      relationships: {
        iapPriceSchedule: { data: { id: 'schedA' } },
        inAppPurchaseLocalizations: { data: [{ id: 'l1' }] },
      },
    }],
    included: [
      { id: 'l1', type: 'inAppPurchaseLocalizations', attributes: { locale: 'en-US', name: '30 Kredi' } },
      { id: 'schedA', type: 'inAppPurchasePriceSchedules', relationships: { manualPrices: { data: [{ id: 'pA' }] } } },
      { id: 'pA', type: 'inAppPurchasePrices', relationships: { inAppPurchasePricePoint: { data: { id: 'ppA' } } } },
      { id: 'ppA', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '2.99', currency: 'USD' } },
    ],
  }).data as any
  ok(urunler.data[0].fiyat?.tutar === 2.99, 'ürün fiyatı toplama anında çözüldü')
  ok(urunler.data[0].diller[0].name === '30 Kredi', 'ürün metni ürünün içine gömüldü')
  ok(urunler.data[0].state === 'MISSING_METADATA',
    '2.1(b) için gereken gönderim durumu korunuyor')

  // Çözülemeyen fiyat: sessiz sıfır YOK, ham kayıt + sebep.
  const cozulmez = normalizeSection('iapPrices', [
    { iapId: 'B', productId: 'urun.b', data: [{ type: 'inAppPurchasePriceSchedules', id: 'B' }], included: [] },
  ])
  const c0 = (cozulmez.data as any)[0]
  ok(c0.fiyat === null && !!c0.not && !!c0.ham, 'fiyat çözülemezse null + sebep + ham kayıt saklanıyor')
  ok(cozulmez.notlar.length === 1, 'çözülemeyen fiyat çekim günlüğüne düşüyor')

  // Yazışmalar: gövde metni HAZİNE, kim yazdığı gömülüyor.
  const yaz = normalizeSection('threads', [{
    thread: { type: 'resolutionCenterThreads', id: 't1', attributes: { threadType: 'REJECTION_REVIEW_SUBMISSION', createdDate: '2026-08-07' } },
    messages: [{ type: 'm', id: 'm1', attributes: { messageBody: 'Guideline 2.1(b)', createdDate: '2026-08-07' }, relationships: { fromActor: { data: { id: 'APPLE' } } } }],
    included: [{ type: 'actors', id: 'APPLE', attributes: { actorType: 'APPLE' } }],
    rejections: [{ type: 'reviewRejections', id: 'r', attributes: { reasons: [{ reasonSection: '2.1', reasonCode: '2.1.0', reasonDescription: 'App Completeness' }] } }],
  }]).data as any
  ok(yaz[0].mesajlar[0].govde === 'Guideline 2.1(b)', 'red metni korunuyor — projenin hazinesi')
  ok(yaz[0].mesajlar[0].kim === 'APPLE', 'mesajı kimin yazdığı included yerine mesajın içinde')
  ok(yaz[0].redler[0].kod === '2.1.0', 'Apple\'ın yapısal red kodu korunuyor')

  // Bölüme özel kuralı olmayan her şey jenerik yoldan geçer.
  const bilinmeyen = normalizeSection('yepyeniBolum', [{ type: 'x', id: '1', attributes: { a: 1 }, links: { self: 'u' } }]).data as any
  ok(bilinmeyen[0].a === 1 && bilinmeyen[0].links === undefined,
    'tanınmayan bölüm de sadeleşiyor — yeni bölüm kod değiştirmeden çalışıyor')
}

// ===========================================================================
console.log('\ndump/normalize.ts — gerçek çekim üzerinde ölçüm')
// ===========================================================================
{
  const { normalizeSection } = await import('../src/dump/normalize.js')
  // Gerçek bir `app` kaydının %94'ü linkti (16.7 KB'ın 15.7'si).
  const iliskiler: Record<string, any> = {}
  for (let i = 0; i < 70; i++) {
    iliskiler[`iliski${i}`] = {
      links: {
        self: `https://appstoreconnect.apple.com/iris/v1/apps/674/relationships/iliski${i}`,
        related: `https://appstoreconnect.apple.com/iris/v1/apps/674/iliski${i}`,
      },
    }
  }
  const ham = { type: 'apps', id: '674', attributes: { name: 'X', bundleId: 'com.x' }, relationships: iliskiler, links: { self: 'https://x' } }
  const hamBoyut = JSON.stringify(ham).length
  const sadeBoyut = JSON.stringify(normalizeSection('app', ham).data).length
  ok(sadeBoyut < hamBoyut / 2,
    `70 ilişkili kayıt yarıdan fazla küçüldü (${hamBoyut} → ${sadeBoyut} bayt)`)
}


// ===========================================================================
console.log('\nlint — beyana dayanan kesin kontroller')
// ===========================================================================
{
  const { checkIapState, checkTrialClaim } = await import('../src/lint/iap-state.js')
  const { checkPrivacyClaims, checkAgeDeclaration } = await import('../src/lint/declarations.js')
  const { checkDeviceFamilies, checkCoverage } = await import('../src/lint/device.js')

  const sub = (over: any = {}): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US',
      category: 'Photo & Video', ageRating: '17+',
      text: {}, media: { screenshots: [] }, iap: [], urls: {}, reviewNotes: {}, meta: {},
      ...over,
    }) as any
  const kod = (r: any) => r.bulgular.map((b: any) => b.checkId)

  // --- 2.1(b): gönderilmemiş ürün — bu hesabın SON reddi -------------------
  const gonderilmemisUrun = checkIapState(sub({
    text: { description: 'Yearly Pack ile sınırsız erişim.' },
    iap: [{ id: 'com.x.yearly', kind: 'subscription', name: 'Yearly Pack', description: '', price: 59.99, currency: 'USD' }],
    declarations: {
      urunDurumlari: [{ id: 'com.x.yearly', durum: 'MISSING_METADATA', sonrakiSurumleGonder: false, incelemede: false }],
      gecmisRedler: [{ madde: '2.1', kod: '2.1.0', aciklama: 'App Completeness' }],
    },
  }))
  ok(kod(gonderilmemisUrun).includes('lint-iap-not-submitted'), 'gönderilmemiş ürün yakalanıyor (2.1(b))')
  ok(gonderilmemisUrun.bulgular[0].severity === 'high',
    'ürün listing metninde anılıyorsa ağırlık yüksek — Apple tam bu gerekçeyle reddetti')
  ok(/daha önce tam bu sebeple/.test(gonderilmemisUrun.bulgular[0].message),
    'bulgu kendi kanıtını taşıyor: bu uygulama aynı maddeden reddedilmiş')

  const onayli = checkIapState(sub({
    declarations: { urunDurumlari: [{ id: 'a', durum: 'APPROVED' }, { id: 'b', durum: 'MISSING_METADATA', sonrakiSurumleGonder: true }] },
  }))
  ok(onayli.bulgular.length === 0,
    'APPROVED ve "sonraki sürümle gönder" işaretli ürünler tetiklemiyor')

  const durumYok = checkIapState(sub({ declarations: {} }))
  ok(durumYok.bulgular.length === 0 && /denetlenmedi/.test(durumYok.denetlenmedi[0] ?? ''),
    'ürün durumu çekilmemişse bulgu uydurulmuyor, "denetlenmedi" yazılıyor')

  // --- Deneme vaadi ama teklif yok ----------------------------------------
  const abonelik = (over: any = {}) =>
    ({ id: 'com.x.w', kind: 'subscription', name: 'Weekly Pack', description: '', price: 9.99, currency: 'USD', ...over })

  const adDeneme = checkTrialClaim(sub({ iap: [abonelik({ name: 'Weekly Pack (Trial)' })] }))
  ok(kod(adDeneme).includes('lint-trial-claimed-but-no-offer') && adDeneme.bulgular[0].severity === 'high',
    'ürün ADINDA deneme vaadi + tanımlı teklif yok → yüksek (gerçek red: weeklytrial)')
  ok(/Offer Code/.test(adDeneme.bulgular[0].suggestedFix),
    'mesaj kendi karşı-örneğini yazıyor: promosyon koduyla verilen deneme burada görünmez')

  const metinDeneme = checkTrialClaim(sub({
    text: { description: 'Start your 3-day free trial today.' }, iap: [abonelik()],
  }))
  ok(metinDeneme.bulgular[0]?.severity === 'medium', 'yalnız metinde geçen iddia orta ağırlık')

  const gercekDeneme = checkTrialClaim(sub({
    text: { description: 'free trial' },
    iap: [abonelik({ freeTrial: { duration: 'P3D' } })],
  }))
  ok(gercekDeneme.bulgular.length === 0, 'tanımlı deneme varsa tetiklenmiyor')
  ok(checkTrialClaim(sub({ text: { description: 'trial version of the editor' }, iap: [abonelik()] })).bulgular.length === 0,
    '"trial" kelimesi tek başına yetmiyor — yakınında free/ücretsiz aranıyor')

  // --- ATT / gizlilik çelişkisi -------------------------------------------
  const takipVar = {
    satirlar: [{ kategori: 'CRASH_DATA', grup: 'DIAGNOSTICS', koruma: 'DATA_USED_TO_TRACK_YOU' }],
    takip: true, kimlikleBagli: false,
  }
  const celiski = checkPrivacyClaims(sub({
    text: { description: 'Your data stays yours. We do not track you.' },
    declarations: { privacy: takipVar },
  }))
  ok(kod(celiski).includes('lint-att-claim-contradiction'), 'takip beyanı + metinde açık inkâr → çelişki')
  ok(/CRASH_DATA/.test(celiski.bulgular[0].message), 'bulgu hangi beyan satırına dayandığını yazıyor')

  const pazarlama = checkPrivacyClaims(sub({
    text: { description: 'Private, secure and fast. Gizliliğinize önem veriyoruz.' },
    declarations: { privacy: takipVar },
  }))
  ok(pazarlama.bulgular.length === 0,
    'pazarlama dili ("private", "secure") tetiklemiyor — yalnız açık olumsuzlama')

  const gizlilikYok = checkPrivacyClaims(sub({ declarations: {} }))
  ok(gizlilikYok.bulgular.length === 0 && gizlilikYok.denetlenmedi.length === 1,
    'gizlilik etiketi çekilmemişse "denetlenmedi" — sessizce temiz değil')

  // --- Yaş beyanı ----------------------------------------------------------
  const yas = (sinyaller: any, sinif = '4+') =>
    checkAgeDeclaration(sub({
      ageRating: sinif,
      declarations: { age: { sinyaller, noneSayisi: 18, beyanEdilmemis: [], kaynak: 'surum' } },
    }))
  ok(kod(yas({ userGeneratedContent: true })).includes('lint-age-declaration-ugc'),
    'UGC beyanı + 4+ sınıfı → çelişki')
  ok(kod(yas({ sexualContentOrNudity: 'INFREQUENT_OR_MILD' })).includes('lint-age-declaration-content'),
    'içerik beyanı + düşük sınıf → çelişki, hangi alan olduğu yazılıyor')
  ok(kod(yas({ gambling: true }, '12+')).includes('lint-age-declaration-gambling'), 'kumar beyanı + 17+ altı → çelişki')
  ok(yas({ userGeneratedContent: true }, '17+').bulgular.length === 0, 'sınıf uygunsa tetiklenmiyor')

  // TUZAK: üstün kılma mağaza sınıfından DÜŞÜK olabilir; bu çelişki değil.
  const tuzak = checkAgeDeclaration(sub({
    ageRating: '17+',
    declarations: { age: { sinyaller: {}, noneSayisi: 20, beyanEdilmemis: [], kaynak: 'surum', ustunKilma: '16+', magazaSinifi: '17+' } },
  }))
  ok(tuzak.bulgular.length === 0,
    'beyan 16+ / mağaza 17+ kombinasyonu YALANCI ALARM üretmiyor (Apple hesaplananı yüksek tutabiliyor)')

  const yasYok = checkAgeDeclaration(sub({ declarations: {} }))
  ok(yasYok.bulgular.length === 0 && yasYok.denetlenmedi.length === 1, 'yaş beyanı yoksa "denetlenmedi"')

  // --- Cihaz aileleri ↔ ekran görüntüsü -----------------------------------
  const ipadGorsel = [{ id: 's1', path: 'u', deviceClass: 'ipad_pro_12_9' }]
  const cihaz = checkDeviceFamilies(sub({
    media: { screenshots: ipadGorsel },
    declarations: { build: { cihazAileleri: ['IPHONE'], kaynak: 'build 32 (2026-06-24)' } },
  }))
  ok(kod(cihaz).includes('lint-screenshots-vs-devicefamilies'),
    'build iPad desteklemiyorken iPad görseli varsa yakalanıyor (2.3.3)')
  ok(/build 32/.test(cihaz.bulgular[0].message), 'bulgu HANGİ build\'e bakıldığını yazıyor')

  const uyumlu = checkDeviceFamilies(sub({
    media: { screenshots: ipadGorsel },
    declarations: { build: { cihazAileleri: ['IPHONE', 'IPAD'], kaynak: 'build 32' } },
  }))
  ok(uyumlu.bulgular.length === 0, 'iPad destekleniyorsa iPad görseli sorun değil')

  const buildYok = checkDeviceFamilies(sub({ declarations: {} }))
  ok(buildYok.bulgular.length === 0 && buildYok.denetlenmedi.length === 1, 'build yoksa "denetlenmedi"')

  // --- Kapsam: özel ürün sayfaları ----------------------------------------
  const kapsam = checkCoverage(sub({
    declarations: { ozelSayfalar: [{ ad: 'Fun Viral', gorunur: true, icerikCekildi: false }] },
  }))
  ok(kod(kapsam).includes('lint-custom-page-not-audited'), 'denetlenmemiş özel ürün sayfası skorda görünüyor')
  ok(checkCoverage(sub({ declarations: { ozelSayfalar: [{ ad: 'x', gorunur: true, icerikCekildi: true }] } })).bulgular.length === 0,
    'içeriği çekilmiş sayfa uyarı üretmiyor')
  ok(checkCoverage(sub({ declarations: {} })).bulgular.length === 0, 'özel sayfa yoksa gürültü yok')
}

// ===========================================================================
console.log('\ncheck/select.ts — beyan koşulu: "bilinmiyor" ≠ "sağlanmadı"')
// ===========================================================================
{
  const { selectRules } = await import('../src/check/select.js')
  const kart = (appliesWhen: any): any => ({
    id: 'apple-5.1.2-att', platform: 'apple',
    source: { doc: 'd', section: '5.1.2', url: 'https://x', retrievedAt: '2026-01-01' },
    tags: ['privacy'], scope: 'single', needs: [], appliesWhen,
    question: 'q', ruleText: 'r', positiveExample: 'a', negativeExample: 'b',
    outcome: 'manual', defaultSeverity: 'high', version: 1,
  })
  const sub = (declarations?: any): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
      text: { description: 'x' }, media: { screenshots: [] }, iap: [], urls: {}, reviewNotes: {},
      meta: {}, declarations,
    }) as any

  const takipli = selectRules(sub({ privacy: { satirlar: [], takip: true, kimlikleBagli: false } }), [kart({ declaresTracking: true })])
  ok(takipli.manual.length === 1 && takipli.unknownMeta.length === 0, 'takip beyanı varsa ATT kartı listeye giriyor')

  const takipsiz = selectRules(sub({ privacy: { satirlar: [], takip: false, kimlikleBagli: false } }), [kart({ declaresTracking: true })])
  ok(takipsiz.manual.length === 0 && takipsiz.unknownMeta.length === 0,
    'takip beyanı yoksa kart gösterilmiyor — herkese gösterilen madde bilgi taşımaz')

  const bilinmiyor = selectRules(sub({}), [kart({ declaresTracking: true })])
  ok(bilinmiyor.manual.length === 0 && bilinmiyor.unknownMeta.length === 1,
    'gizlilik etiketi ÇEKİLMEMİŞSE kart sessizce elenmiyor, "bilgi eksik" kovasına düşüyor')
}

// ===========================================================================
console.log('\ncheck/select.ts — konu geçmiyorsa elle kontrol maddesi de çıkmasın')
// ===========================================================================
{
  const { selectRules } = await import('../src/check/select.js')
  const kart = (over: any = {}): any => ({
    id: 'apple-5.4-vpn', platform: 'apple',
    source: { doc: 'd', section: '5.4', url: 'https://x', retrievedAt: '2026-01-01' },
    tags: ['vpn'], scope: 'cross', needs: [], prefilter: ['vpn', 'proxy'],
    question: 'q', ruleText: 'r', outcome: 'manual', defaultSeverity: 'high', version: 1,
    ...over,
  })
  const sub = (metin: string, over: any = {}): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
      text: { description: metin }, media: { screenshots: [] }, iap: [], urls: {}, reviewNotes: {},
      meta: {}, ...over,
    }) as any

  // Kural kitabı yönergenin tamamını kapsayınca kontrol listesi 60 maddeye
  // çıkıyor. Her uygulamada gösterilen bir madde hiçbir bilgi taşımaz; VPN
  // kartı yalnız VPN'den söz eden listing'de çıkmalı.
  const alakasiz = selectRules(sub('A photo editor with filters.'), [kart()])
  ok(alakasiz.manual.length === 0, 'konusu listing’de hiç geçmeyen elle kontrol maddesi listeye girmiyor')
  ok(alakasiz.prefiltered.length === 1,
    'ama SESSİZCE kaybolmuyor: eleme "prefiltered" olarak geri dönüyor, rapor sayısını yazabilsin')

  const alakali = selectRules(sub('Fast VPN with unlimited bandwidth.'), [kart()])
  ok(alakali.manual.length === 1 && alakali.prefiltered.length === 0,
    'konu geçiyorsa madde listeye giriyor')

  // Modele giden kartlarda eski sınır korunuyor: görsel gören ya da çapraz
  // kartlarda metin eşleşmemesi "ihlal yok" anlamına gelmez.
  const gorselKart = kart({
    outcome: 'risk', scope: 'cross', needs: ['screenshots'], requiresVision: true,
    positiveExample: 'a', negativeExample: 'b',
  })
  const gorselli = selectRules(
    sub('A photo editor with filters.', { media: { screenshots: [{ id: 's1', path: '/tmp/a.png' }] } }),
    [gorselKart],
  )
  ok(gorselli.llm.length === 1, 'görsel kartta prefilter uygulanmıyor — metinde geçmemesi ihlal yok demek değil')

  // Türetilen koşul: kimse girmiyor, veriden çıkıyor, "bilinmiyor" hâli yok.
  const onizlemeKart = kart({ prefilter: undefined, appliesWhen: { hasPreviewVideo: true } })
  const videolu = selectRules(
    sub('x', { media: { screenshots: [], previewVideo: { id: 'v', path: '/tmp/v.mp4' } } }),
    [onizlemeKart],
  )
  ok(videolu.manual.length === 1, 'önizleme videosu varsa 2.3.4 maddesi listeye giriyor')
  const videosuz = selectRules(sub('x'), [onizlemeKart])
  ok(videosuz.manual.length === 0 && videosuz.unknownMeta.length === 0,
    'video yoksa madde çıkmıyor ve "bilgi eksik" de denmiyor — türetilen koşulda bilinmezlik yok')

  ok(videosuz.elenen.length === 1 && videosuz.elenen[0]!.sebep === 'beyanla-elendi',
    'ama kart YOK OLMUYOR: "beyanla elendi" kovasında sebebiyle duruyor')
}

// ===========================================================================
console.log('\ncheck/select.ts — çalışmayan kartın sebebi kaybolmuyor')
// ===========================================================================
{
  const { selectRules } = await import('../src/check/select.js')
  const kart = (id: string, over: any = {}): any => ({
    id, platform: 'apple',
    source: { doc: 'd', section: '1.1', url: 'https://x', retrievedAt: '2026-01-01' },
    tags: ['t'], scope: 'single', needs: ['description'],
    question: 'q', ruleText: 'r', positiveExample: 'a', negativeExample: 'b',
    outcome: 'risk', defaultSeverity: 'high', version: 1, ...over,
  })
  const sub = (over: any = {}): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
      text: { description: 'a photo editor' }, media: { screenshots: [] }, iap: [], urls: {},
      reviewNotes: {}, meta: {}, ...over,
    }) as any

  const kartlar = [
    kart('apple-a.calisan'),
    kart('apple-b.beyanla', { appliesWhen: { showsAds: true } }),
    kart('apple-c.bilinmiyor', { appliesWhen: { targetsKids: true } }),
    kart('apple-d.verisiz', { needs: ['screenshots'], scope: 'cross' }),
    kart('apple-e.konusuz', { prefilter: ['vpn'] }),
  ]
  const r = selectRules(sub({ meta: { showsAds: false } }), kartlar)
  const sebep = (id: string) => r.elenen.find((e) => e.id === id)?.sebep

  // ASIL KURAL: her aday kart TAM OLARAK bir kovada. Eskiden "hayır" ile
  // elenen kart llm, manual, unknownMeta, prefiltered — dördünün de dışında
  // kalıyordu; raporu okuyan "28 kural denetlendi" görüp bunu kapsam
  // sanıyordu (belkiPatlarız R3).
  ok(r.llm.length + r.manual.length + r.elenen.length === kartlar.length,
    'her aday kart tam olarak bir kovaya düşüyor — hiçbiri sessizce kaybolmuyor')
  ok(sebep('apple-b.beyanla') === 'beyanla-elendi',
    '"hayır" cevabıyla elenen kart artık sebebiyle raporlanıyor')
  ok(r.elenen.find((e) => e.id === 'apple-b.beyanla')!.detay.includes('Reklam gösteriyor'),
    'gerekçe insanın itiraz edebileceği hâlde: hangi beyan, hangi cevap')
  ok(sebep('apple-c.bilinmiyor') === 'meta-bilinmiyor', 'cevaplanmamış beyan "bilinmiyor" kalıyor')
  ok(sebep('apple-d.verisiz') === 'veri-yok', 'içeriği olmayan kart "veri yok" olarak ayrılıyor')
  ok(sebep('apple-e.konusuz') === 'konu-gecmiyor', 'konusu geçmeyen kart ayrı kovada')
  ok(r.llm.length === 1 && r.llm[0]!.id === 'apple-a.calisan', 'koşulu tutan kart modele gidiyor')

  // "Bilinmiyor" her şeyin önünde: eksik veriyi doğru eleme gibi göstermek
  // bu boru hattındaki en pahalı hata.
  const ikiKosul = selectRules(
    sub({ meta: { showsAds: false } }),
    [kart('apple-f.ikili', { appliesWhen: { showsAds: true, targetsKids: true } })],
  )
  ok(ikiKosul.elenen[0]!.sebep === 'meta-bilinmiyor',
    'bir koşul "hayır" bir koşul "bilinmiyor" ise kart BİLİNMİYOR sayılıyor')

  // Çekilmemiş BEYAN ayrı sebep: kullanıcının dolduracağı bir alan yok,
  // dolayısıyla "alanı doldur, kart açılır" tarifi bu kartlar için yanlıştı.
  const beyanKarti = kart('apple-g.att', { appliesWhen: { declaresTracking: true }, outcome: 'manual' })
  const cekilmemis = selectRules(sub(), [beyanKarti])
  ok(cekilmemis.elenen[0]!.sebep === 'beyan-cekilmedi',
    'çekilmemiş App Store Connect beyanı "beyan eksik" ile aynı kovaya girmiyor')
  ok(cekilmemis.unknownMeta.length === 1,
    'ama yine "bilmiyoruz" ailesinde: unknownMeta ikisini birden taşıyor')

  const cekilmis = selectRules(
    sub({ declarations: { privacy: { satirlar: [], takip: false, kimlikleBagli: false } } }),
    [beyanKarti],
  )
  ok(cekilmis.elenen[0]!.sebep === 'beyanla-elendi',
    'beyan çekilmişse ve takip yoksa sebep "beyanla elendi" — bilinmezlik değil')
}

// ===========================================================================
console.log('\nreport — "neyi kapsamadık" raporun içinde yazıyor')
// ===========================================================================
{
  const { renderMarkdown } = await import('../src/report/index.js')
  const rapor: any = {
    submission: { appId: '1', appName: 'App', platform: 'apple', locale: 'en-US' },
    generatedAt: '2026-09-02T00:00:00.000Z', corpusVersion: 'abc',
    riskScore: 0,
    riskBreakdown: { ham: 0, engelleyici: 0, kesinIhlal: 0, risk: 0, kesinKontrol: 0, yuksek: 0, orta: 0, dusuk: 0 },
    lint: [], findings: [], manual: [], notChecked: [],
    lessons: { active: 0, draft: 0, coverageGaps: [] },
    beyan: [
      { alan: 'showsAds', etiket: 'Reklam gösteriyor', deger: false, kaynak: 'bayrak' },
      { alan: 'targetsKids', etiket: 'Çocuklara yönelik', deger: null, kaynak: 'bilinmiyor' },
    ],
    selection: {
      corpus: 175, aday: 175, modele: 28, calisti: 28, elleKontrol: 40,
      elenen: [
        { id: 'apple-2.5.18-advertising-rules', section: '2.5.18', outcome: 'manual',
          sebep: 'beyanla-elendi', detay: 'Reklam gösteriyor = hayır, kart "evet" istiyor' },
        { id: 'apple-1.3-kids-category', section: '1.3', outcome: 'manual',
          sebep: 'meta-bilinmiyor', detay: 'Çocuklara yönelik' },
      ],
    },
    stats: { rulesSelected: 28, rulesRun: 28, rawFindings: 0, afterGrounding: 0, afterVerify: 0 },
  }
  const md = renderMarkdown(rapor)

  ok(md.includes('Bu denetim neyi kapsamadı (2 kart)'),
    'rapor çalışmayan kart sayısını BAŞLIKTA söylüyor — "28 kural denetlendi" tek başına kapsam gibi okunuyordu')
  ok(md.includes('apple-2.5.18-advertising-rules') && md.includes('Reklam gösteriyor = hayır'),
    '"hayır" yüzünden kapanan kural, gerekçesiyle raporda')
  ok(md.includes('Kural seçimini belirleyen beyanlar') && md.includes('| Çocuklara yönelik | **?** (bilinmiyor) |'),
    'beyan tablosu raporda: hangi cevap hangi kuralı kapattı, okuyan görebiliyor')
  ok(md.includes('çalışmayan: 2'), 'alt satırdaki muhasebe de çalışmayanları sayıyor')

  // "Elle doğrula" sayısı seçim muhasebesindeki KART sayısından farklı
  // olabiliyor: aradaki fark in-app derslerden geliyor. Yazmazsak okuyan iki
  // sayı arasındaki boşluğu görüp sebebini bulamıyor.
  const dersli = {
    ...rapor,
    manual: [
      { ruleId: 'x', platform: 'apple', question: 'q', ruleText: 'r',
        source: { doc: 'd', section: '1.1', url: 'u', retrievedAt: '2026-01-01' }, why: 'w' },
    ],
    selection: { ...rapor.selection, elleKontrol: 0 },
  }
  ok(renderMarkdown(dersli as any).includes('Elle doğrula (1 — 0 kart + 1 ders)'),
    'elle kontrol başlığı kart ile dersi ayırıyor')

  // Tanı koşusu (--kartlar) tam denetim değildir. Raporda yazmazsa dosyaya
  // bakan biri "temiz çıktı" diye okur — ölçüm için yapılan bir koşunun
  // güvence belgesine dönüşmesi en kötü sonuç olurdu.
  const filtreli = renderMarkdown({
    ...rapor,
    selection: { ...rapor.selection, filtre: ['apple-2.3.7-keyword-misuse'] },
  } as any)
  ok(filtreli.includes('KISMİ KOŞU') && filtreli.includes('apple-2.3.7-keyword-misuse'),
    'filtreli koşu raporun başında KISMİ olduğunu ve hangi kartlarla koştuğunu söylüyor')
}

// ===========================================================================
console.log('\nprompt + verify — zayıf model muafiyeti okusun diye')
// ===========================================================================
{
  const { renderRuleCard, renderNotViolation } = await import('../src/check/prompt.js')
  const { cards } = await loadCorpus()

  const kart: any = {
    id: 'apple-x.y', platform: 'apple',
    source: { doc: 'd', section: '2.3.7', url: 'u', retrievedAt: '2026-01-01' },
    tags: ['t'], scope: 'single', needs: ['subtitle'], question: 'q', ruleText: 'r',
    positiveExample: 'pozitif', negativeExample: 'negatif',
    notViolation: ['özellik listeleri', 'kategori adları'],
    outcome: 'violation', defaultSeverity: 'medium', version: 1,
  }
  const render = renderRuleCard(kart)
  ok(render.includes('BULGU ÜRETME'), 'muafiyet listesi kendi başlığı altında render ediliyor')
  ok(render.indexOf('BULGU ÜRETME') > render.indexOf('İhlal SAYILMAYAN örnek'),
    'muafiyet bloğu örneklerden SONRA — zayıf modelde son okunan blok ağır basıyor')
  ok(render.indexOf('BULGU ÜRETME') < render.indexOf('Yalnızca yukarıdaki kurala göre'),
    'kapı, cevap talimatından hemen önce duruyor')
  ok(renderNotViolation({ ...kart, notViolation: [] } as any).length === 0,
    'listesi olmayan kartta boş başlık basılmıyor')

  // ÖLÇÜMDEN GELEN REGRESYON (2026-09-02, gpt-4o-mini, 5 listing): bu üç kart
  // 14 ham bulgu üretip savunmadan hiçbirini geçiremedi. Gerekçeler kartların
  // KENDİ muafiyetine giriyordu; o muafiyetler artık açık listede.
  for (const [id, kanit] of [
    ['apple-2.3.7-subtitle-rules', 'AI Photo & Video Face Swap'],
    ['apple-5.2-third-party-brand-in-text', 'tahmin etme'],
  ] as const) {
    const c = cards.find((x) => x.id === id)!
    ok(
      (c.notViolation ?? []).some((n) => n.includes(kanit)),
      `${id}: sahada görülen yalancı alarm ("${kanit}") kartın muafiyet listesinde`,
    )
  }

  // Üç oy, üç ayrı soru: aynı prompt'un üç örneklemesi korele hata üretiyordu.
  const verifySrc = await readFile(new URL('../src/check/verify.ts', import.meta.url), 'utf8')
  const mercekler = verifySrc.slice(verifySrc.indexOf('const MERCEKLER'), verifySrc.indexOf('const VERIFIER_SYSTEM'))
  ok(mercekler.includes('MUAFİYETE BAK'), 'ikinci oy muafiyeti TERSİNDEN soruyor')
  ok(mercekler.includes('RED sebebi'), 'üçüncü oy "reviewer bunu red yapar mıydı" testini soruyor')
  ok(verifySrc.includes('MERCEKLER[vote % MERCEKLER.length]'), 'her oy farklı merceği kullanıyor')
}

// ===========================================================================
console.log('\ncheck/prompt.ts — görseli olmayan gönderim vision modelde patlamasın')
// ===========================================================================
{
  const { submissionPrefix } = await import('../src/check/prompt.js')
  const sub = (media: any): any => ({
    platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
    text: { description: 'x' }, media, iap: [], urls: {}, reviewNotes: {}, meta: {},
  })

  // Görsel YOKSA yükleyici aramak anlamsız: ortada yüklenecek bir şey yok.
  // Bu ayrım olmadan görselsiz bir gönderim + vision destekli model her zaman
  // hata veriyordu; kart canlılık koşusu tam bu yüzden patladı.
  const bos = await submissionPrefix(sub({ screenshots: [] }), { withImages: true })
  ok(bos.length === 1 && bos[0]!.type === 'text', 'görselsiz gönderim yükleyici olmadan da ön ek üretiyor')

  // Ama görsel VARSA yükleyicisiz devam etmek yasak: sessizce görselsiz
  // gitmek, görsel kartlarının "sorun yok" demesine yol açar.
  let patladi = false
  try {
    await submissionPrefix(sub({ screenshots: [{ id: 's', path: 'p' }] }), { withImages: true })
  } catch {
    patladi = true
  }
  ok(patladi, 'görsel VARKEN yükleyici yoksa gürültülü hata veriyor — sessizce atlamıyor')
}

// ===========================================================================
console.log('\nlint/sections.ts — her kesin kontrol bir maddeye dayanmalı')
// ===========================================================================
{
  const { lintSection } = await import('../src/lint/sections.js')
  const { loadGuidelines } = await import('../src/corpus/guidelines-node.js')
  const doc = await loadGuidelines()

  // Lint kaynaklarındaki TÜM checkId'leri topla — şablonlu olanlar dâhil.
  const dosyalar = ['policy', 'review-notes', 'urls', 'iap', 'iap-state', 'limits', 'media', 'device', 'declarations']
  const kaynak = (
    await Promise.all(
      dosyalar.map((f) => readFile(new URL(`../src/lint/${f}.ts`, import.meta.url), 'utf8').catch(() => '')),
    )
  ).join('\n')
  const kimlikler = [...kaynak.matchAll(/checkId: [`']([^`']+)[`']/g)]
    .map((m) => m[1]!.replace(/\$\{[^}]+\}/g, 'x'))
  ok(kimlikler.length > 20, `${kimlikler.length} kesin kontrol kimliği tarandı`)

  /**
   * Kartlar madde numarasına çapalı ve rapor onu yazıyor; lint bulguları
   * çapasızdı. Oysa "gönderimi engelleyen" sorunların çoğu lint'ten geliyor —
   * dayanağı görünmeyen bir bulguya kimse itiraz edemez, ofise de gösteremez.
   */
  const capasiz = [...new Set(kimlikler)].filter((id) => !lintSection(id))
  ok(capasiz.length === 0,
    `her kesin kontrol bir Apple maddesine çapalı${capasiz.length ? ' — çapasız: ' + capasiz.join(', ') : ''}`)

  // Çapa GERÇEK bir maddeye gitmeli; uydurma numara, uydurma bulgudan beter.
  const bilinen = new Set(doc.sections.map((x) => x.id))
  const uydurma = [...new Set(kimlikler)]
    .map((id) => lintSection(id)!)
    .filter((sec) => !bilinen.has(sec) && !bilinen.has(sec.replace(/\(.*/, '')))
  ok(uydurma.length === 0,
    `lint çapalarının hepsi yönergede var${uydurma.length ? ' — kayıp: ' + [...new Set(uydurma)].join(', ') : ''}`)
}

// ===========================================================================
console.log('\nskor — "yayına çıkar mı" sorusunu sürekli skor cevaplayamıyor')
// ===========================================================================
{
  const { riskRaw, riskScore, riskBreakdown, hukum, engelleyiciSorunlar } =
    await import('../src/report/index.js')
  const lint = (checkId: string, severity: any = 'high'): any =>
    ({ checkId, platform: 'apple', severity, artifact: 'keywords', message: 'm', suggestedFix: 's' })
  const bulgu = (ruleId: string, outcome: any = 'violation', severity: any = 'high'): any =>
    ({ ruleId, platform: 'apple', severity, outcome, artifact: 'description', locator: { type: 'field', field: 'x' },
       excerpt: 'e', rationale: 'r', suggestedFix: 's', confidence: 1 })

  // SAHA (2026-09-02): Dance AI'ın anahtar kelimelerinde iki marka terimi vardı
  // ("tiktok", "reels") ve her biri 30 puan yazıyordu. Oysa ikisi TEK bir
  // düzeltme: anahtar kelime alanını düzenle. Aynı çarpıklık Housify'da üç
  // fiyat bulgusunda vardı. Azalan ağırlık findings'te vardı, lint'te yoktu.
  const ikiAyniKural = riskRaw([lint('lint-keyword-brand-term'), lint('lint-keyword-brand-term')], [])
  const tekBulgu = riskRaw([lint('lint-keyword-brand-term')], [])
  ok(ikiAyniKural < tekBulgu * 2,
    `aynı lint kuralının ikinci bulgusu azalan ağırlıkla sayılıyor (${tekBulgu} → ${ikiAyniKural})`)
  ok(ikiAyniKural > tekBulgu, 'ama sıfır da sayılmıyor — daha çok yerde görünüyor olması bir şey ifade eder')
  const ikiFarkliKural = riskRaw([lint('lint-a'), lint('lint-b')], [])
  ok(ikiFarkliKural > ikiAyniKural, 'iki FARKLI sorun, aynı sorunun iki kopyasından ağır')

  // Sürekli skorun cevaplayamadığı soru: hangisi yayına çıkamaz?
  const cokOrta = riskBreakdown([lint('a', 'high'), ...Array.from({ length: 7 }, (_, i) => lint('m' + i, 'medium'))], [])
  const azYuksek = riskBreakdown([lint('a'), lint('b'), lint('c')], [])
  ok(hukum(cokOrta).renk === 'high' && hukum(azYuksek).renk === 'high', 'ikisi de engelleyici içeriyor')
  ok(azYuksek.engelleyici > cokOrta.engelleyici,
    'ama engelleyici SAYISI ayırıyor: üç yüksek bulgu, bir yüksek + yedi ortadan daha ağır')

  ok(engelleyiciSorunlar([lint('a'), lint('a'), lint('a')], []).length === 1,
    'engelleyici sayımı kural başına TEK: kullanıcı bulguyu değil sorunu düzeltiyor')
  ok(engelleyiciSorunlar([], [bulgu('r1', 'risk')]).length === 0,
    '"risk" çıktılı bulgu engelleyici değil — insan kararı ister, tek başına ret sebebi değildir')
  ok(engelleyiciSorunlar([], [bulgu('r1', 'violation', 'medium')]).length === 0,
    'orta şiddetli kesin ihlal de engelleyici sayılmıyor — eşik "kesin VE ağır"')

  ok(hukum({ engelleyici: 0, risk: 2, kesinKontrol: 0 }).renk === 'medium', 'engel yoksa sarı')
  ok(hukum({ engelleyici: 0, risk: 0, kesinKontrol: 0 }).renk === 'low', 'hiç bulgu yoksa yeşil')
  ok(hukum({ engelleyici: 0, risk: 0, kesinKontrol: 0 }).aciklama.includes('DEĞİL'),
    'yeşil "onaylanır" demiyor — kaç kuralın hiç çalışmadığı ayrı bölümde')
  ok(hukum({ engelleyici: 1, risk: 0, kesinKontrol: 1 }).renk === 'high',
    'TEK engelleyici sorun kırmızı yapıyor — Apple tek sebeple reddediyor')

  ok(riskScore([], []) === 0, 'bulgu yoksa skor sıfır')
}

// ===========================================================================
console.log('\neval/card-liveness.ts — kart kendi ihlal örneğinde açılabilmeli')
// ===========================================================================
{
  const { canlilikTaramasi } = await import('../src/eval/card-liveness.js')
  const { cards } = await loadCorpus()
  const satirlar = canlilikTaramasi(cards)

  /**
   * ASIL KURAL. Kartın `positiveExample` alanı "bu bir ihlaldir" diye yazılmış
   * bir metindir. O metinden kurulan listing'de kart SEÇİLMİYORSA, kart gerçek
   * bir listing'de de hiç açılmaz — soru ne kadar iyi yazılmış olursa olsun.
   *
   * Sahada bulundu (2026-09-02): 3.2.2(ix) kredi kartının prefilter'ı
   * "loan/credit/apr" arıyordu ama kendi örneği "Get cash in minutes. Repay
   * within 30 days." diyordu. Kredi uygulamalarının gerçekte kullandığı dil
   * tam olarak buydu ve kart o listing'lerde hiç açılmıyordu.
   */
  const olu = satirlar.filter((s) => s.durum === 'secilemedi')
  ok(olu.length === 0,
    `her modele giden kart kendi ihlal örneğinde seçilebiliyor${
      olu.length ? ' — ÖLÜ: ' + olu.map((o) => `${o.ruleId} (${o.sebep})`).join(' | ') : ''
    }`)

  ok(satirlar.filter((s) => s.durum === 'secilebilir').length > 30,
    `sınanabilir kart sayısı anlamlı (${satirlar.filter((s) => s.durum === 'secilebilir').length})`)
}

// ===========================================================================
console.log('\ncheck/ground.ts — kimlikteki noktalama gerçek bulguyu öldürmesin')
// ===========================================================================
{
  const { groundFindings } = await import('../src/check/ground.js')
  const sub: any = {
    platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
    text: { description: 'bir metin' },
    media: { screenshots: [{ id: 'd10e4a76-9a63-4c6c-b53e-f6873955ef74', path: 'p' }] },
    iap: [{ id: 'com.x.pro', kind: 'subscription', name: 'Pro', description: '', price: 1, currency: 'USD' }],
    urls: {}, reviewNotes: {}, meta: {},
  }
  const bulgu = (locator: any): any =>
    ({ ruleId: 'r', platform: 'apple', severity: 'high', outcome: 'violation', artifact: 'screenshot',
       locator, excerpt: 'Redesign Your Interior', rationale: '', suggestedFix: '', confidence: 0 })

  // SAHA HATASI (2026-09-02): model medya kimliğini cümle sonuna koyup nokta
  // ekliyordu; tam eşleşme aradığımız için GERÇEK bulgu "uydurma" sayılıp
  // atılıyordu. 2.3.3 kartı bulgularının bir kısmını böyle kaybetti.
  const noktali = groundFindings(sub, [bulgu({ type: 'image', mediaId: 'd10e4a76-9a63-4c6c-b53e-f6873955ef74.' })])
  ok(noktali.kept.length === 1, 'kimliğin sonundaki nokta gerçek bulguyu öldürmüyor')

  const bosluklu = groundFindings(sub, [bulgu({ type: 'image', mediaId: ' d10e4a76-9a63-4c6c-b53e-f6873955ef74 ' })])
  ok(bosluklu.kept.length === 1, 'baştaki/sondaki boşluk da tolere ediliyor')

  // Gevşetme DAR: uydurma kimlik hâlâ eleniyor, yoksa savunmanın kendisi biterdi.
  const uydurma = groundFindings(sub, [bulgu({ type: 'image', mediaId: 'd10e4a76-0000-0000-0000-f6873955ef74' })])
  ok(uydurma.dropped.length === 1, 'ortadaki fark hâlâ uydurma sayılıyor — kapı gevşemedi')
  ok(groundFindings(sub, [bulgu({ type: 'image', mediaId: '' })]).dropped.length === 1,
    'boş kimlik geçerli sayılmıyor')
  ok(groundFindings(sub, [bulgu({ type: 'iap', iapId: 'com.x.pro,' })]).kept.length === 1,
    'aynı tolerans IAP kimliğinde de var — oradaki kimlik de modelden geliyor')
}

// ===========================================================================
console.log('\nlint/brands.ts — anahtar kelimede marka: liste sorgusu modele sorulmaz')
// ===========================================================================
{
  const { checkKeywordBrands } = await import('../src/lint/limits.js')
  const { markaBul } = await import('../src/lint/brands.js')
  const sub = (keywords: string): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
      text: { keywords }, media: { screenshots: [] }, iap: [], urls: {}, reviewNotes: {}, meta: {},
    }) as any

  // SAHA VERİSİ (2026-09-02): iki uygulamanın anahtar kelimelerinde gerçekten
  // bunlar vardı. LLM kartı bulguyu üretiyor ama alıntı olarak virgüllü
  // dizinin tamamını verdiği için ikinci göz 0/3 ile eliyordu — yani boru
  // hattı DOĞRU bulguyu kaybediyordu.
  const dance = await checkKeywordBrands(sub('photo,challenge,tiktok,reels,template,trend,motion'))
  ok(dance.length === 2, 'gerçek ihlaller (tiktok, reels) kesin olarak yakalanıyor')
  ok(dance.every((f) => f.checkId === 'lint-keyword-brand-term' && f.severity === 'high'),
    'bulgu kesin kontrol olarak işaretleniyor')
  ok(dance[0]!.message.includes('"tiktok"') && !dance[0]!.message.includes('challenge'),
    'ihlal eden terim TEK BAŞINA raporlanıyor — itiraz edilebilir olsun')

  const temiz = await checkKeywordBrands(sub('hair,haircut,haircolor,beauty,makeover,stylist,salon'))
  ok(temiz.length === 0, 'jenerik kategori terimleri bulgu üretmiyor')

  // Kelime sınırı şart: alt dize eşleşmesi kesin bir kontrolü yalancı alarma
  // çevirirdi.
  ok(markaBul('shortcuts') === null && markaBul('shorts') !== null,
    '"shortcuts" markaya benzediği için yakalanmıyor, "shorts" yakalanıyor')
  ok(markaBul('tiktok video') !== null, 'terim içinde geçen marka da yakalanıyor')

  const { cards } = await loadCorpus()
  ok(!cards.some((c) => c.id === 'apple-2.3.7-keyword-misuse'),
    'liste sorgusu artık kartta değil — iki ölçümde 9 ham bulgu, sıfır survivor')
}

// ===========================================================================
console.log('\nlint/iap.ts — abonelik dönemi: modele sorulmayacak kadar kesin')
// ===========================================================================
{
  const { checkIap, donemGun } = await import('../src/lint/iap.js')
  const sub = (iap: any[]): Submission =>
    ({
      platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'X', ageRating: '4+',
      text: { description: 'x' }, media: { screenshots: [] }, iap, urls: {}, reviewNotes: {},
      meta: {},
    }) as any
  const abonelik = (name: string, duration?: string): any =>
    ({ id: name, kind: 'subscription', name, description: '', price: 9.99, currency: 'USD', duration })

  ok(donemGun('P1W') === 7 && donemGun('P1D') === 1 && donemGun('P1Y') === 365, 'ISO 8601 dönemi güne çevriliyor')
  ok(donemGun('haftalık') === null, 'tanınmayan biçimde uydurma gün sayısı üretilmiyor')

  const kisa = await checkIap(sub([abonelik('Daily Pass', 'P1D')]))
  ok(kisa.some((f) => f.checkId === 'lint-subscription-period-too-short'),
    '7 günden kısa abonelik dönemi KESİN olarak yakalanıyor')

  // SAHA REGRESYONU (2026-09-02): kart olarak sorulduğunda gpt-4o-mini bu
  // kaydı 5 uygulamada ihlal saydı — kartın kendi "temizdir" örneğini. Aynı
  // veri lint'te sıfır bulgu üretmeli.
  const temiz = await checkIap(sub([abonelik('Glamio Pro Weekly', 'P1W'), abonelik('Glamio Pro Yearly', 'P1Y')]))
  ok(!temiz.some((f) => f.checkId === 'lint-subscription-period-too-short'),
    'P1W ve P1Y uyumlu — modelin 7 kez ürettiği yalancı alarm burada sıfır')

  const bilinmeyen = await checkIap(sub([abonelik('Mystery', undefined)]))
  ok(!bilinmeyen.some((f) => f.checkId === 'lint-subscription-period-too-short'),
    'dönem bilinmiyorsa hüküm kurulmuyor')
}

// ===========================================================================
console.log('\ncheck/huni.ts + eval/false-positive.ts — "kaç tane uydurdu"')
// ===========================================================================
{
  const { hesaplaHuni } = await import('../src/check/huni.js')
  const {
    ornekUyarisi, ornekSatiri, orneklemUyarilari, birlestirHuni, toplamHuni,
    gurultuAdaylari, karsilastir,
  } = await import('../src/eval/false-positive.js')

  const f = (ruleId: string, excerpt = 'x', over: any = {}): any => ({
    ruleId, platform: 'apple', severity: 'high', outcome: 'violation', artifact: 'description',
    locator: {}, excerpt, rationale: 'r', suggestedFix: 's', confidence: 1, ...over,
  })
  const kart = (id: string, section: string): any => ({
    id, platform: 'apple', source: { doc: 'd', section, url: 'u', retrievedAt: '2026-01-01' },
    tags: ['t'], scope: 'single', needs: ['description'], question: 'q', ruleText: 'r',
    positiveExample: 'a', negativeExample: 'b', outcome: 'violation', defaultSeverity: 'high', version: 1,
  })

  // A: 3 ham üretti, biri alıntıdan biri oydan düştü, biri kaldı.
  // B: 2 ham üretti, ikisi de düştü — gürültü adayı.
  // C: hiç bulgu üretmedi — huniye girmiyor (tabloyu şişirmesin).
  const huni = hesaplaHuni({
    ham: [f('a', '1'), f('a', '2'), f('a', '3'), f('b', '4'), f('b', '5')],
    alintiDusen: [f('a', '1')],
    ikinciGozDusen: [f('a', '2', { trace: { verifyVotes: { agree: 1, total: 3 } } }), f('b', '4'), f('b', '5')],
    kalan: [f('a', '3')],
    kartlar: [kart('a', '2.3.1'), kart('b', '5.2.1'), kart('c', '1.1.1')],
  })
  const A = huni.find((h) => h.ruleId === 'a')!
  const B = huni.find((h) => h.ruleId === 'b')!
  ok(A.ham === 3 && A.alintiDusen === 1 && A.ikinciGozDusen === 1 && A.kalan === 1, 'huni kart bazında doğru sayıyor')
  ok(A.section === '2.3.1', 'madde numarası kartla eşleşiyor — rapor "hangi kural" diye sorabilsin')
  ok(!huni.some((h) => h.ruleId === 'c'), 'hiç bulgu üretmeyen kart huniyi şişirmiyor')
  ok(huni[0]!.ruleId === 'a' || huni[0]!.ruleId === 'b', 'sıralama en çok elenenden başlıyor')
  ok(A.elenenOrnekler.some((o) => o.oy === '1/3'), 'ikinci gözden düşen bulgunun OYU kayda giriyor')

  // Dedupe ruleId'leri "a + b" diye birleştiriyor; ikisine de sayılmalı,
  // yoksa birleşen bulgu iki kartta birden "kayıp" görünür.
  const birlesik = hesaplaHuni({
    ham: [f('a'), f('b')], alintiDusen: [], ikinciGozDusen: [],
    kalan: [f('a + b')], kartlar: [kart('a', '1.1'), kart('b', '1.2')],
  })
  ok(birlesik.every((h) => h.kalan === 1 && h.tekrarDusen === 0),
    'dedupe ile birleşen bulgu iki kartın da hanesine yazılıyor')

  // Tekrar elemesi: ham 2, hiçbiri elenmedi ama sonuçta 1 kaldı.
  const tekrar = hesaplaHuni({
    ham: [f('a', '1'), f('a', '1')], alintiDusen: [], ikinciGozDusen: [],
    kalan: [f('a', '1')], kartlar: [kart('a', '1.1')],
  })
  ok(tekrar[0]!.tekrarDusen === 1, 'artakalan fark "tekrar elendi" olarak yazılıyor, kaybolmuyor')

  // --- Örneklem dürüstlüğü --------------------------------------------------
  const sub = (over: any = {}): any => ({
    platform: 'apple', appId: '1', appName: 'App', locale: 'en-US', category: 'Photo & Video',
    ageRating: '4+', text: { description: 'x'.repeat(4000) },
    media: { screenshots: [{ id: 's', path: 'p' }] }, iap: [], urls: {}, reviewNotes: {},
    meta: { generatesAiContent: true }, ...over,
  })
  ok(/fixtures/.test(ornekUyarisi(sub(), 'fixtures/glamio-apple.json') ?? ''),
    'birim test artefaktı örneklemde uyarı veriyor — kırpılmış metin oranı iyimser gösterir')
  ok(ornekUyarisi(sub({ text: { description: 'kısa' } }), 'out/x.json')?.includes('karakter'),
    'gerçek listing’in altında kalan metin uyarı veriyor')
  ok(ornekUyarisi(sub({ media: { screenshots: [] } }), 'out/x.json')?.includes('ekran görüntüsü'),
    'ekran görüntüsü yoksa görsel kartların hiç çalışmayacağı söyleniyor')
  ok(ornekUyarisi(sub(), 'out/submission-1.json') === undefined, 'gerçek anlık görüntü uyarı üretmiyor')

  // Kategori tek başına yetmiyor: iki farklı kategoride ama İKİSİ DE AI
  // uygulaması olabilir — örneklemin gerçek ortak özelliği beyanlarda.
  const uyarilar = orneklemUyarilari([
    ornekSatiri(sub(), 'out/a.json'),
    ornekSatiri(sub({ category: 'Lifestyle' }), 'out/b.json'),
  ])
  ok(uyarilar.some((u) => u.includes('AI içerik üretiyor')),
    'farklı kategorilerde bile ortak beyan profili uyarı olarak yazılıyor')

  // --- Birleştirme ve regresyon --------------------------------------------
  const kartlar = birlestirHuni([
    { app: 'Glamio', huni },
    { app: 'Housify', huni: hesaplaHuni({
      ham: [f('a', '9')], alintiDusen: [f('a', '9')], ikinciGozDusen: [], kalan: [],
      kartlar: [kart('a', '2.3.1')],
    }) },
  ])
  const toplamA = kartlar.find((k) => k.ruleId === 'a')!
  ok(toplamA.ham === 4 && toplamA.uygulamalar.length === 2,
    'aynı kart iki listing’de toplanıyor ve hangi uygulamalardan geldiği kayıtta')
  ok(toplamHuni(kartlar).ham === 6, 'toplam huni kartların toplamı')
  ok(gurultuAdaylari(kartlar).some((k) => k.ruleId === 'b'),
    'hiç geçemeyen kart "gürültü adayı" olarak işaretleniyor')
  ok(!gurultuAdaylari(kartlar).some((k) => k.ruleId === 'a'),
    'bulgusu savunmayı geçen kart gürültü sayılmıyor')

  const kosu = (kartlar: any[]): any => ({
    tarih: '2026-09-02T00:00:00.000Z', corpusVersion: 'v1', model: 'm',
    ornekler: [], toplam: toplamHuni(kartlar), kartlar, uyarilar: [],
  })
  const farklar = karsilastir(
    kosu([{ ruleId: 'a', section: '', ham: 4, alintiDusen: 0, ikinciGozDusen: 0, tekrarDusen: 0, kalan: 2, elenenOrnekler: [], uygulamalar: [] }]),
    kosu([
      { ruleId: 'a', section: '', ham: 9, alintiDusen: 0, ikinciGozDusen: 0, tekrarDusen: 0, kalan: 1, elenenOrnekler: [], uygulamalar: [] },
      { ruleId: 'z', section: '', ham: 3, alintiDusen: 0, ikinciGozDusen: 0, tekrarDusen: 0, kalan: 0, elenenOrnekler: [], uygulamalar: [] },
    ]),
  )
  ok(farklar.find((x) => x.ruleId === 'a')?.yon === 'artti',
    'kart eklendikçe gürültüsü artan kural karşılaştırmada görünüyor')
  ok(farklar.find((x) => x.ruleId === 'z')?.yon === 'yeni', 'yeni kart "yeni" diye işaretleniyor')
}

// ===========================================================================
console.log('\neval/guideline-coverage.ts — Apple’ın her maddesinde kart var mı')
// ===========================================================================
{
  const { guidelineCoverage } = await import('../src/eval/guideline-coverage.js')
  const { cards } = await loadCorpus()
  const doc = await loadGuidelines()
  const r = guidelineCoverage(doc, cards)

  ok(r.kuralliMadde > 100, `yönergede kural taşıyan ${r.kuralliMadde} madde bulundu`)
  // Apple yönergeyi güncellediğinde bu test KIRILIR ve kırılması gerekir:
  // yeni madde geldiğinde kart yazılmadan corpus "tam" görünmemeli.
  ok(r.bosluklar.length === 0,
    `kural taşıyan her maddede en az bir kart var${
      r.bosluklar.length ? ' — kartsız: ' + r.bosluklar.map((b) => b.id).join(', ') : ''
    }`)
  ok(r.gecersizAtiflar.length === 0,
    `hiçbir kart yönergede olmayan bir maddeye atıf yapmıyor${
      r.gecersizAtiflar.length ? ' — ' + r.gecersizAtiflar.map((g) => `${g.kart}→${g.madde}`).join(', ') : ''
    }`)
}

// ---------------------------------------------------------------------------
// Corpus bütünlüğü — sorulan soru bir işe yaramalı
// ---------------------------------------------------------------------------
{
  console.log('\ncorpus — sorulan her beyan bir kartı tetiklemeli')

  const { cards } = await loadCorpus()
  ok(cards.length > 0, `corpus yükleniyor (${cards.length} kart)`)

  /**
   * ASIL KURAL. Arayüz kullanıcıya dört soru soruyor. Bir soru hiçbir kartı
   * tetiklemiyorsa o soru YALAN: kullanıcı cevaplıyor, hiçbir şey değişmiyor,
   * ama cevapladığı için o konunun denetlendiğini sanıyor.
   *
   * Sahada tam bu oldu: `generatesAiContent` aylarca soruldu ve SIFIR kart
   * tetikledi. Bir AI uygulaması "AI içerik üretiyor: Evet" işaretliyor,
   * denetim AI'a dair tek kural çalıştırmıyor, rapor temiz görünüyordu.
   * Bu, belkiPatlarız R3'ün ta kendisi — yalnızca eşlemede değil, kural
   * kitabında açılmış hâli.
   *
   * Yeni bir beyan eklenirse ya kartı da eklenir ya da soru sorulmaz.
   */
  // Liste elle tutulmuyor: arayüzün SORDUĞU alanların tamamı buradan geliyor.
  // Elle tutulan kopya, yeni alan eklendiğinde sınanmadan kalıyordu — bu testin
  // yakalamak için var olduğu hatanın ta kendisi.
  const { META_KEYS } = await import('../src/meta-fields.js')
  const SORULAN_BEYANLAR = META_KEYS

  // Bir beyan İKİ yoldan işe yarayabilir: kural kartını tetikler ya da kesin
  // bir lint kontrolünü. `requiresLogin` bugün ikinci gruptan — 4.8 kartı
  // `hasThirdPartyLogin`'e taşındıktan sonra kart tetiklemiyor ama "giriş
  // gerekiyorsa demo hesap zorunlu" lint'ini tetikliyor. Yalnızca kartlara
  // baksaydık bu testin kendisi yalancı alarm üretirdi (R20).
  const lintKaynagi = (
    await Promise.all(
      ['policy', 'review-notes', 'urls', 'iap', 'index'].map((f) =>
        readFile(new URL(`../src/lint/${f}.ts`, import.meta.url), 'utf8').catch(() => ''),
      ),
    )
  ).join('\n')

  for (const beyan of SORULAN_BEYANLAR) {
    const kart = cards.filter((c) => c.appliesWhen?.[beyan] !== undefined).length
    const lint = new RegExp(`meta\\.${beyan}\\b`).test(lintKaynagi)
    ok(kart > 0 || lint,
      `"${beyan}" denetimi gerçekten etkiliyor (${kart} kart${lint ? ' + lint' : ''}) — ` +
      'etkilemiyorsa arayüzdeki soru yalan')
  }

  // Kart kaynağı gerçek bir maddeye çapalı olmalı: uydurma atıf, uydurma
  // bulgudan beter — kullanıcı gidip o maddeyi okuyamaz.
  const guidelines = await loadGuidelines()
  const bilinen = new Set(guidelines.sections.map((s) => s.id))
  const kayipAtif = cards
    // Yalnızca tek platformlu Apple kartları: çapraz kartlar iki politikaya
    // birden atıf yapıyor ("1.1 / Content Ratings") ve tek bir Apple madde
    // kimliğine oturmuyor. Onları burada kovalamak yalancı alarm olurdu.
    .filter((c) => c.source.doc === 'Apple App Review Guidelines')
    // Bazı kartlar "5.1.1(v)" gibi alt-fıkra veriyor; kökü tutuyorsa yeterli.
    .filter((c) => !bilinen.has(c.source.section) && !bilinen.has(c.source.section.replace(/\(.*/, '')))
    .map((c) => `${c.id} → ${c.source.section}`)
  ok(kayipAtif.length === 0,
    `her Apple kartı gerçek bir maddeye atıf yapıyor${kayipAtif.length ? ' — kayıp: ' + kayipAtif.join(', ') : ''}`)

  // Model çağıran kartlarda iki taraflı örnek zorunlu (şema da bunu istiyor).
  // Burada ikinci kez bakıyoruz çünkü şema atlanabilir bir yoldan yüklenirse
  // sessizce geçer ve yalancı alarm oranı fırlar.
  const orneksiz = cards
    .filter((c) => c.outcome !== 'manual')
    .filter((c) => !c.positiveExample || !c.negativeExample)
    .map((c) => c.id)
  ok(orneksiz.length === 0,
    `modele giden her kartta olumlu+olumsuz örnek var${orneksiz.length ? ' — eksik: ' + orneksiz.join(', ') : ''}`)
}

// ---------------------------------------------------------------------------
// Skor ve şiddet — sahadaki 100/100 raporundan çıkan dersler
// ---------------------------------------------------------------------------
{
  console.log('\nskor — doymayan eğri, şiddet kartın')

  const { riskScore, riskRaw, riskBreakdown } = await import('../src/report/index.js')
  // Hepsi AYNI kural id'siyle — azalan ağırlığı da böyle sınıyoruz.
  const f = (n: number, sev: any = 'high', o: any = 'violation') =>
    Array.from({ length: n }, () => ({ ruleId: 'ayni-kural', severity: sev, outcome: o })) as any[]

  // SAHA HATASI (2026-08-26): gerçek bir denetimde ham toplam 350 çıktı ve
  // skor 100 yazdı. Beş sorunu olan uygulama ile elli sorunu olan aynı
  // görünüyordu; üç sorunu düzeltmek skoru KIPIRDATMIYORDU. Denetim geçmişi
  // özelliğinin tek amacı "düzeldi mi" sorusuna cevap vermekti.
  const cok = riskScore([], f(20))
  const az = riskScore([], f(5))
  ok(cok > az, `daha çok bulgu daha yüksek skor (${az} → ${cok}) — 100'de tıkanmıyor`)
  ok(riskScore([], f(100)) === 99,
    'skor 99\'da duruyor, 100\'e ULAŞMIYOR — "daha kötüsü olamaz" diye bir şey yok')
  // Gerçekçi aralıkta çözünürlük şart: demo edilen uygulamalar 1-15 bulgu
  // arasında. Orada her bulgu skoru gözle görülür oynatmalı.
  const kademeler = [1, 2, 3, 5, 8, 12].map((n) => riskScore([], f(n, 'high', 'risk')))
  const artiyor = kademeler.every((v, i) => i === 0 || v > kademeler[i - 1]!)
  ok(artiyor, `gerçekçi aralıkta her kademe ayırt ediliyor (${kademeler.join(' → ')})`)
  ok(riskScore([], []) === 0, 'bulgu yoksa skor 0')

  // Monotonluk: her yeni bulgu skoru artırmalı, hiçbir noktada düşmemeli.
  let onceki = -1
  let monoton = true
  for (let n = 0; n <= 40; n++) {
    const v = riskScore([], f(n))
    if (v < onceki) monoton = false
    onceki = v
  }
  ok(monoton, 'skor her bulguda artıyor, hiçbir yerde geri gitmiyor')

  // İlerleme görünmeli: beş ihlalden ikisine inmek skoru düşürmeli.
  const oncesi = riskScore([], f(5))
  const sonrasi = riskScore([], f(2))
  ok(oncesi - sonrasi >= 10,
    `üç ihlal düzeltilince skor belirgin düşüyor (${oncesi} → ${sonrasi})`)

  // Ham toplam da rapora giriyor: eğri basıklaştığı için asıl çözünürlük orada.
  // NOT: f(5) beş bulguyu AYNI kural id'siyle üretiyor, o yüzden azalan
  // ağırlık devreye giriyor: 30 + 4×7.5 = 60.
  ok(riskRaw([], f(5)) === 60, `aynı kuralın tekrarı azalan ağırlıkla sayılıyor (${riskRaw([], f(5))})`)

  // SAHA HATASI (2026-09-02): `apple-3.1.2-subscription-disclosure` abonelik
  // başına bir kez, toplam DÖRT kez düştü ve 4 × 30 = 120 puan yazdı — ham
  // toplamın neredeyse yarısı. Oysa tek sorun var: listing metni abonelik
  // şartlarını yazmıyor. O metni bir kez düzeltince dördü birden kapanıyor.
  // Doğrusal saymak, skoru "uygulama ne kadar kötü"nün değil "model ne kadar
  // çok cümle yazdı"nın ölçüsü yapıyordu.
  const ayniKural = [1, 2, 3, 4].map(() => ({ ruleId: 'ayni', severity: 'high', outcome: 'violation' })) as never[]
  const farkliKural = ['a', 'b', 'c', 'd'].map((r) => ({ ruleId: r, severity: 'high', outcome: 'violation' })) as never[]
  ok(riskRaw([], ayniKural) === 52.5,
    `aynı kuraldan 4 bulgu = 30 + 3×7.5 (${riskRaw([], ayniKural)}), 4×30 DEĞİL`)
  ok(riskRaw([], farkliKural) === 120,
    `FARKLI dört kural tam ağırlıkla sayılıyor (${riskRaw([], farkliKural)}) — ayrı sorunlar ayrı`)
  ok(riskRaw([], ayniKural) > riskRaw([], ayniKural.slice(0, 1)),
    'tekrar yine de bir şey ifade ediyor — sıfır değil, dörtte bir')
  const b = riskBreakdown([{ severity: 'high' } as any], [...f(2), ...f(3, 'medium', 'risk')])
  ok(b.kesinIhlal === 2 && b.risk === 3 && b.kesinKontrol === 1,
    'bileşim kesin ihlal / risk / kesin kontrol olarak ayrılıyor')

  // ŞİDDET KARTIN. Sahada model 15 bulgunun 15'ine de "high" dedi; kartların
  // yarısı "medium" olarak kalibre edilmişti. O sinyal bilgi taşımıyor,
  // yalnızca skoru şişiriyordu.
  const checkSrc = await readFile(new URL('../src/check/check.ts', import.meta.url), 'utf8')
  ok(/severity: rule\.defaultSeverity,/.test(checkSrc),
    'bulgunun şiddeti KARTIN defaultSeverity\'sinden geliyor')
  ok(!/severity: raw\.severity/.test(checkSrc),
    'modelin söylediği şiddet KULLANILMIYOR')
}

// ---------------------------------------------------------------------------
// Görsel kapısı — kart ekran görüntüsü istiyorsa GÖRMELİ
// ---------------------------------------------------------------------------
{
  console.log('\ngörsel kapısı — needs içindeki artifact modele gitmeli')

  // SAHA HATASI (2026-08-26): `needsVision` kartın BÜTÜN ihtiyaçlarının
  // görsel olmasını şart koşuyordu. Karışık kartlar (metin + ekran
  // görüntüsü) görselsiz prompt alıyor, ama soruları görsele bakmayı şart
  // koşuyordu: "…o özelliğin ekran görüntülerinde hiçbir izi yok mu?"
  // Model görmediği şey için "izi yok" dedi ve tek kart yedi uydurma bulgu
  // üretti. Skor 100'e dayandı, rapor okunamaz hâle geldi.
  const checkSrc = await readFile(new URL('../src/check/check.ts', import.meta.url), 'utf8')
  const govde = /function needsVision\(card: RuleCard\): boolean \{[\s\S]*?\n\}/.exec(checkSrc)?.[0] ?? ''
  ok(govde !== '', 'needsVision okunabildi')
  ok(/\.some\(/.test(govde) && !/\.every\(/.test(govde),
    'needs içinde TEK BİR görsel artifact yeterli (some), hepsi değil (every)')

  const needsVision = new Function('card', `
    const visual = ['screenshots', 'icon', 'previewVideo']
    if (card.requiresVision) return true
    return card.needs.some((n) => visual.includes(n))
  `) as (c: any) => boolean

  ok(needsVision({ needs: ['description', 'subtitle', 'promotionalText', 'screenshots'] }),
    'karışık kart (metin + ekran görüntüsü) GÖRSEL alıyor — yedi uydurma bulgunun sebebi buydu')
  ok(needsVision({ needs: ['screenshots'] }), 'yalnız görsel isteyen kart görsel alıyor')
  ok(needsVision({ needs: ['reviewNotes'], requiresVision: true }), 'açık bayrak her zaman kazanıyor')
  ok(!needsVision({ needs: ['description', 'keywords'] }),
    'hiç görsel istemeyen kart görsel ALMIYOR — gereksiz maliyet ve gürültü')

  // Asıl kural: `needs` içindeki her artifact modele ULAŞMALI. Kural kitabında
  // ekran görüntüsü isteyip görselsiz kalan kart kalmamalı.
  const { cards } = await loadCorpus()
  const korler = cards
    .filter((c) => c.outcome !== 'manual')
    .filter((c) => c.needs.some((n) => ['screenshots', 'icon', 'previewVideo'].includes(n)))
    .filter((c) => !needsVision(c))
    .map((c) => c.id)
  ok(korler.length === 0,
    `ekran görüntüsü isteyip görmeyen kart yok${korler.length ? ' — kör: ' + korler.join(', ') : ''}`)
}

// ---------------------------------------------------------------------------
// Kart kalitesi — sahadaki saçma çıktılardan çıkan dersler
// ---------------------------------------------------------------------------
{
  console.log('\nkart kalitesi — model bilmediği şeyi uydurmasın')

  const { cards } = await loadCorpus()

  // SAHA HATASI (2026-09-02): yaş sınırı kartı, zaten **17+** olan bir
  // uygulamaya "yaş sınırını 12+ veya daha yükseğe çıkar" dedi. İki kat
  // saçma: 17+ Apple'ın en yükseği, üstelik 12+ ondan DÜŞÜK.
  //
  // Sebep: kart, Apple'ın derece merdivenini bilmiyordu. Model dünyaya dair
  // olguları hatırlamaz — `facts` alanı tam bunun için var (README'de
  // "bilgi kuralı" diye geçiyor).
  const yas = cards.find((c) => c.id === 'shared-age-rating-consistency')
  ok(!!yas, 'yaş sınırı kartı duruyor')
  const yasFacts = (yas?.facts ?? []).join(' ')
  ok(/4\+.*9\+.*12\+.*17\+/.test(yasFacts), 'kart Apple\'ın derece merdivenini SAYIYOR')
  ok(/EN YÜKSEK/.test(yasFacts), '17+\'ın tavan olduğu açıkça yazılı')
  ok(/17\+/.test(yas?.question ?? '') && /BULGU ÜRETME/.test(yas?.question ?? ''),
    'soru, zaten 17+ olan uygulamada bulgu üretmemeyi EMREDİYOR')

  // SAHA HATASI (aynı gün): abonelik ifşası kartı ürün başına bir bulgu
  // üretti — dört abonelik, dört bulgu, tek sorun. Kartın kendi talimatı
  // ("eksik olan her maddeyi ayrı ayrı belirt") bunu yaptırıyordu.
  const abone = cards.find((c) => c.id === 'apple-3.1.2-subscription-disclosure')
  ok(!!abone, 'abonelik ifşası kartı duruyor')
  ok(/TEK BULGU ÜRET/.test(abone?.question ?? ''), 'kart TEK bulgu istiyor')
  ok(/ÜRÜN BAŞINA AYRI BULGU ÜRETME/.test(abone?.question ?? ''),
    'ürün başına bulgu üretmek açıkça yasaklanmış')

  // SAHA HATASI (2026-09-02, üçüncü tur): 2.3.3 altındaki İKİ kart aynı işi
  // yapmaya başladı. `feature-not-evidenced` "bu özelliği ekran
  // görüntülerinde göremiyorum" diye üç bulgu üretti — oysa görsellerin
  // arayüz göstermemesi `screenshots-reflect-app`'in konusu. Üstelik
  // uygulamanın ADI "AI Video, Face Swap: Editor"; yüz değiştirme zaten
  // kanıtlanmış bir özellik.
  //
  // Aynı maddeye iki kart yazarken sınırı AÇIKÇA çizmek gerekiyor; yoksa
  // model ikisini de aynı soruyu sormuş sayıyor ve rapor tekrara düşüyor.
  const ozellik = cards.find((c) => c.id === 'apple-2.3.3-feature-not-evidenced')
  ok(!!ozellik, 'özellik kartı duruyor')
  const ozellikMetin = `${ozellik?.question ?? ''} ${(ozellik?.facts ?? []).join(' ')}`
  ok(/screenshots-reflect-app/.test(ozellikMetin),
    'kart, komşu kartı ADIYLA anıp sınırı çiziyor')
  ok(/BULGU ÜRETME/.test(ozellik?.question ?? '') && /ekran görüntülerinde göremiyorum/.test(ozellik?.question ?? ''),
    '"ekran görüntüsünde göremiyorum" gerekçesi açıkça yasaklanmış')
  ok(/KENDİ ADI/.test(ozellikMetin),
    'uygulamanın kendi adının da kanıt olduğu olgu olarak yazılı')

  // Genel kural: bir kart "her X için ayrı bildir" diyorsa, X listeden gelen
  // bir varlıksa (ürün, ekran görüntüsü) tek sorunu N kez saydırır.
  const supheli = cards
    .filter((c) => c.outcome !== 'manual')
    .filter((c) => /her .{0,20}(ürün|paket|abonelik).{0,20}(için )?ayrı/i.test(c.question))
    .map((c) => c.id)
  ok(supheli.length === 0,
    `hiçbir kart "her ürün için ayrı bildir" demiyor${supheli.length ? ' — ' + supheli.join(', ') : ''}`)
}

// ---------------------------------------------------------------------------
// Oran sınırı (429) — sahada denetimin TAMAMINI düşürdü
// ---------------------------------------------------------------------------
{
  console.log('\noran sınırı — tek kart tüm denetimi öldürmemeli')

  // SAHA HATASI (2026-09-02): OpenAI dakikalık token sınırına (200k TPM)
  // çarpıldı. Sekiz yeniden deneme de tükendi ve `Promise.all` reddetti —
  // 13 kart başarıyla koşmuş olmasına rağmen kullanıcı HİÇBİR ŞEY alamadı,
  // yalnız "Denetim çalışmadı" gördü.
  //
  // Yarım rapor hiç rapordan iyidir, YETER Kİ neyin çalışmadığı görünsün.
  const src = await readFile(new URL('../src/check/check.ts', import.meta.url), 'utf8')

  const dongu = /const queue = \[\.\.\.runnable\][\s\S]*?stats\.ms = Date\.now/.exec(src)?.[0] ?? ''
  ok(dongu !== '', 'kart döngüsü okunabildi')
  ok(/try \{[\s\S]*?\} catch \(e\) \{[\s\S]*?basarisiz\.push/.test(dongu),
    'kart çağrısı try/catch içinde — biri patlayınca ötekiler devam ediyor')
  ok(/basarisiz: Array<\{ id: string; sebep: string \}>/.test(src),
    'patlayan kartlar sebebiyle birlikte kaydediliyor')

  // Sessizce düşerlerse rapor o konulara BAKILDIĞINI ima eder — R2.
  const auditSrc = await readFile(new URL('../src/ext/audit.ts', import.meta.url), 'utf8')
  ok(/res\.stats\.basarisiz\.map/.test(auditSrc),
    'patlayan kartlar raporun DENETLENMEDİ listesine giriyor')
  const runSrc = await readFile(new URL('../src/check/run.ts', import.meta.url), 'utf8')
  ok(/basarisiz\.map/.test(runSrc), 'CLI de patlayan kartları listeliyor')

  // --- TPM valisi ---------------------------------------------------------
  // Yeniden deneme tek başına yetmiyordu: 429'u yedikten SONRA bekliyorduk,
  // yani kotayı zaten doldurmuştuk. Artık göndermeden ÖNCE bakıyoruz.
  const llmSrc = await readFile(new URL('../src/llm/openai-compatible.ts', import.meta.url), 'utf8')
  ok(/private static tpmLimit/.test(llmSrc), 'dakikalık token kotası için vali var')
  ok(/await this\.valiyeSor\(tahmin\)/.test(llmSrc),
    'her çağrı GÖNDERMEDEN ÖNCE valiye soruyor — 429 yemeyi beklemiyor')
  ok(/sinirOgren/.test(llmSrc) && /Limit \(\\d\+\)/.test(llmSrc),
    '429 gövdesindeki gerçek sınır okunup vali ona göre daraltılıyor')

  // --- Görsel tahmini ------------------------------------------------------
  // SAHA HATASI (2026-09-02, ikinci tur): tahmin `JSON.stringify(body)/4` idi.
  // Görseller gövdeye BASE64 olarak giriyor; altı ekran görüntüsü 718 KB
  // ediyor ve formül onu ~185 bin token sanıyordu. Bütçe 180 bin, yani vali
  // hiçbir zaman izin vermiyor ve boş pencerede `pencere[0].t` okuyup
  // çöküyordu: "Cannot read properties of undefined (reading 't')".
  // 14 karttan 9'u böyle düştü.
  //
  // Gerçekte görselin token maliyeti BOYUTUNA bağlı değil: detail:low için
  // görsel başına ~85 token.
  const { OpenAICompatibleProvider } = await import('../src/llm/openai-compatible.js')
  const sahteGovde = {
    messages: [{ role: 'user', content: [
      { type: 'text', text: 'x'.repeat(15_000) },
      ...Array.from({ length: 6 }, () => ({
        type: 'image_url', image_url: { url: `data:image/png;base64,${'A'.repeat(120_000)}` },
      })),
    ] }],
  }
  const saglayici = new OpenAICompatibleProvider(
    'gpt-4o-mini', 'http://x', '', true, 4, true, { imageDetail: 'low' } as never,
  ) as unknown as { tahminiToken(b: unknown): number }
  const tahmin = saglayici.tahminiToken(sahteGovde)
  const hamBoyut = JSON.stringify(sahteGovde).length
  ok(hamBoyut > 700_000, `sahte gövde gerçekçi boyutta (${Math.round(hamBoyut / 1024)} KB)`)
  ok(tahmin < 20_000,
    `base64 görseller token sanılmıyor (${tahmin.toLocaleString('tr-TR')} token, eski formül ${Math.ceil(hamBoyut / 4).toLocaleString('tr-TR')} derdi)`)
  ok(tahmin > 3_000, 'metin ve görseller yine de sayılıyor — sıfıra da inmiyor')

  // Boş pencerede ÇÖKMEMELİ. Tek bir istek bütün bütçeden büyükse bölemeyiz;
  // geçirmek gerekir. Beklemek sonsuz döngü + çökme demekti.
  const llmKaynak = await readFile(new URL('../src/llm/openai-compatible.ts', import.meta.url), 'utf8')
  ok(/if \(!K\.pencere\.length\) \{[\s\S]*?return/.test(llmKaynak),
    'pencere boşken istek geçiriliyor — pencere[0] okunmadan önce korunuyor')
  ok(/private static tpmLimit/.test(llmKaynak) && /private static pencere/.test(llmKaynak),
    'vali durumu SINIF düzeyinde — kota hesap başına, denetim başına değil')

  // Valinin matematiği: 60 saniyelik kayan pencere.
  const vali = new Function(`
    let tpmLimit = 1000
    let pencere = []
    return {
      dene(tok, simdi) {
        pencere = pencere.filter((x) => simdi - x.t < 60000)
        const kullanilan = pencere.reduce((n, x) => n + x.tok, 0)
        if (kullanilan + tok <= tpmLimit) { pencere.push({ t: simdi, tok }); return true }
        return false
      },
      ogren(govde) {
        const m = /Limit (\\d+)/.exec(govde)
        if (m) { const y = Math.floor(Number(m[1]) * 0.85); if (y < tpmLimit) tpmLimit = y }
      },
      get limit() { return tpmLimit },
    }
  `)()
  const t = 1_000_000
  ok(vali.dene(600, t) === true, 'kota altındaki çağrı geçiyor')
  ok(vali.dene(300, t) === true, 'kota dolana kadar geçmeye devam ediyor')
  ok(vali.dene(300, t) === false, 'kota dolunca DURUYOR — 429 yemeden')
  ok(vali.dene(300, t + 61_000) === true, '60 saniye sonra pencere kayıyor ve yeniden geçiyor')

  // Öğrenme AYRI bir valiyle sınanıyor: yukarıdaki 1000'lik kota pencere
  // matematiği içindi, gerçek varsayılan 180 bin.
  const ogrenen = new Function(`
    let tpmLimit = 180000
    return {
      ogren(govde) {
        const m = /Limit (\\d+)/.exec(govde)
        if (m) { const y = Math.floor(Number(m[1]) * 0.85); if (y < tpmLimit) tpmLimit = y }
      },
      get limit() { return tpmLimit },
    }
  `)()
  ogrenen.ogren('Rate limit reached ... Limit 200000, Used 200000, Requested 2511')
  ok(ogrenen.limit === 170_000,
    `sahadaki 429 gövdesinden sınır öğreniliyor (200000 → %85 = ${ogrenen.limit})`)

  // YALNIZ AŞAĞI. Yukarı çekseydik, yüksek kotalı bir hesapta öğrendiğimiz
  // değerle hızlanır ama başka biri aynı hesabı kullanırken (şirket kurulumu)
  // ikimiz birden kotayı doldururduk. Güvenli taraf yavaş taraftır.
  ogrenen.ogren('Limit 999999')
  ok(ogrenen.limit === 170_000, 'öğrenilen sınır YUKARI çekilmiyor')
  ogrenen.ogren('Limit 40000')
  ok(ogrenen.limit === 34_000, 'daha DAR bir sınır görülürse ona iniyor')
}

// ---------------------------------------------------------------------------
// Kapsam analizi — sayı bir TAVAN, yakalama oranı değil
// ---------------------------------------------------------------------------
{
  console.log('\nkapsam — geçmiş redler vs kural kitabı')

  const { coverage, kapsamOrani, normalizeSection, kartKapsiyorMu } =
    await import('../src/eval/coverage.js')

  // Madde kodu sadeleştirme: fıkra harfi atılır, DERİNLİK korunur.
  ok(normalizeSection('Guideline 2.3.3(a)') === '2.3.3', 'fıkra harfi ve önek atılıyor')
  ok(normalizeSection('  5.1.1 ') === '5.1.1', 'boşluk kırpılıyor')
  ok(normalizeSection('') === '', 'boş kod boş kalıyor')

  // Kart daha GENEL olabilir; daha ÖZEL olamaz. 2.3 altında 2.3.1'den
  // 2.3.12'ye bambaşka kurallar var — birini yazmış olmak ötekini bilmek
  // değildir. Ters yönü kabul etseydik kapsam olduğundan geniş görünürdü,
  // yani araç kendini olduğundan iyi gösterirdi. Bu projede en yasak şey bu.
  ok(kartKapsiyorMu('1.2', '1.2.1'), 'genel kart özel redi kapsıyor')
  ok(kartKapsiyorMu('2.3.3', '2.3.3'), 'birebir eşleşme kapsıyor')
  ok(!kartKapsiyorMu('2.3.3', '2.3'), 'ÖZEL kart GENEL redi kapsamıyor')
  ok(!kartKapsiyorMu('2.3.3', '2.3.7'), 'kardeş maddeler birbirini kapsamıyor')
  ok(!kartKapsiyorMu('2.3', '23'), 'nokta önemli — 2.3 ile 23 farklı')

  const kart = (id: string, section: string) =>
    ({ id, source: { doc: 'Apple App Review Guidelines', section, url: 'https://x.dev', retrievedAt: '2026-01-01' } }) as unknown as RuleCard

  const rapor = coverage(
    [
      { id: 'a', guideline: '2.3.3', appName: 'App1', text: "x\n=== Apple'ın red gerekçesi ===\nScreenshots do not reflect the app." },
      { id: 'b', guideline: '4.3', appName: 'App1' },
      { id: 'c', guideline: '4.3', appName: 'App2' },
      { id: 'd', guideline: '', appName: 'App2' },
    ],
    [kart('k1', '2.3.3'), kart('k2', '1.2')],
  )

  ok(rapor.toplamRed === 4 && rapor.kodlu === 3 && rapor.kodsuz === 1,
    'kodlu ve kodsuz redler AYRI sayılıyor')
  // Kodsuzu paydaya koymak, bilinmeyeni "kapsanmıyor" saymak olurdu — R2.
  ok(kapsamOrani(rapor) === 33, `oranın paydası KODLU redler (%${kapsamOrani(rapor)})`)
  ok(rapor.bosluklar.length === 1 && rapor.bosluklar[0].madde === '4.3',
    'kartı olmayan madde boşluk listesinde')
  ok(rapor.bosluklar[0].redSayisi === 2 && rapor.bosluklar[0].uygulamalar.length === 2,
    'boşluk satırı kaç red ve hangi uygulamalar olduğunu taşıyor')
  ok(rapor.uyarilar.some((u) => /kodu taşımıyor/.test(u)),
    'kodsuz redler için uyarı var — sessizce yutulmuyorlar')
  ok(/Screenshots do not reflect/.test(rapor.kapsananlar[0]?.ornek ?? ''),
    "Apple'ın gerekçesinden örnek çıkarılıyor — kart yazacak kişi okusun diye")

  // Mükerrer kayıt oranı şişirir; eleniyor mu?
  const mukerrer = coverage(
    [{ id: 'x', guideline: '1.2' }, { id: 'x', guideline: '1.2' }],
    [kart('k2', '1.2')],
  )
  ok(mukerrer.toplamRed === 1, 'aynı id iki kez sayılmıyor')
  ok(mukerrer.uyarilar.some((u) => /mükerrer/.test(u)), 'mükerrer eleme sessiz değil')

  // Hiç kart yoksa oran 0 olmalı — "veri yok" ile "kapsam yok" karışmasın.
  const kartsiz = coverage([{ id: 'a', guideline: '9.9' }], [])
  ok(kapsamOrani(kartsiz) === 0, 'kart yokken oran 0 (null değil — kodlu red var)')
  ok(kapsamOrani(coverage([], [])) === null, 'hiç kodlu red yokken oran NULL — sıfır değil')
}

// ---------------------------------------------------------------------------
// CLI — bayrak sessizce yutulmamalı
// ---------------------------------------------------------------------------
{
  console.log('\nCLI — meta bayrakları fixture modunda da geçerli')

  // NEDEN UÇTAN UCA: hata birim testiyle yakalanamazdı. `mergeMeta` doğru
  // çalışıyordu; sorun ÇAĞRILMAMASIYDI — `if (input.appId)` bloğunun içinde
  // duruyordu ve fixture modunda hiç koşmuyordu. Yazdığın `--ai-content`
  // hiçbir şey yapmıyor, hiçbir uyarı da çıkmıyordu. Bu projede sessiz
  // davranış, yanlış davranıştan pahalıdır.
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const { fileURLToPath } = await import('node:url')
  const run = promisify(execFile)

  // `new URL(...).pathname` KULLANMA: bu deponun yolunda boşluk ve Türkçe
  // harf var ("adsız klasör") ve pathname onları yüzde-kodluyor. Sonuç:
  // cwd yanlış, komut fixture'ı bulamıyor, test "hata" diye kırılıyor —
  // yani testin kendi kusuru kod hatası gibi görünüyor.
  const kok = fileURLToPath(new URL('..', import.meta.url))

  const cikti = await run(
    'npx',
    ['tsx', 'src/cli.ts', 'check', '--fixture', 'fixtures/glamio-apple.json',
     '--no-llm', '--third-party-login', '--out', 'out/test-flag.md'],
    { cwd: kok, timeout: 120_000 },
  ).then((r) => r.stdout + r.stderr).catch((e) => String(e.stdout ?? '') + String(e.stderr ?? e))

  ok(/hasThirdPartyLogin=true\(bayrak\)/.test(cikti),
    'fixture modunda --third-party-login uygulanıyor ve KAYNAĞI raporlanıyor')
  ok(!/elendi: apple-4\.8/.test(cikti),
    'bayrak verilince 4.8 kartı "meta bilinmiyor" diye elenmiyor')
  // Kaynak etiketi (api/dosya/bayrak/bilinmiyor) her alanda yazmalı: sessiz
  // varsayım bu boru hattındaki en pahalı hata türü.
  ok(/generatesAiContent=\w+\((api|dosya|bayrak|bilinmiyor)\)/.test(cikti),
    'her meta alanının değeri NEREDEN geldiği yazılıyor')
}

console.log('\nlessons/embed.ts — kosinüs ve gömme metni')
{
  const { cosine, lessonText, vectorHash } = await import('../src/lessons/embed.js')

  ok(Math.abs(cosine([1, 0, 0], [1, 0, 0]) - 1) < 1e-9, 'aynı vektör → 1')
  ok(Math.abs(cosine([1, 0], [0, 1])) < 1e-9, 'dik vektörler → 0')
  ok(Math.abs(cosine([3, 0], [7, 0]) - 1) < 1e-9, 'ölçek benzerliği DEĞİŞTİRMİYOR (normalize ediliyor)')
  // Uzunluk uyuşmazlığı sessizce yanlış skor üretirse, model değişikliğinden
  // sonra bayat vektörler "hiç benzemiyor" diye görünür ve sebebi anlaşılmaz.
  ok(cosine([1, 0, 0], [1, 0]) === 0, 'boyutu farklı vektörler eşleşmiyor, patlamıyor')
  ok(cosine([0, 0], [1, 1]) === 0, 'sıfır vektör NaN üretmiyor')

  // Gömme metninde MADDE NUMARASI OLMAMALI: aranan şey tam olarak "numarası
  // tutmayan ama aynı olan kalıp". Numara girerse kaçırdığımız durum geri gelir.
  const metin = lessonText({
    title: 'Ekran goruntuleri arayuz gostermiyor',
    summary: 'Ekran goruntuleri pazarlama gorseli, uygulama arayuzu yok.',
    artifact: 'screenshots',
    signals: ['ekran goruntusunde uygulama arayuzu yok'],
  })
  ok(!/2\.3\.3|\bmadde\b/i.test(metin), 'gömme metninde madde numarası YOK')
  ok(metin.includes('screenshots'), 'alan adı gömme metninde var — aynı maddedeki kalıpları o ayırıyor')
  ok(metin.includes('ekran goruntusunde uygulama arayuzu yok'), 'belirtiler gömme metnini besliyor')

  // Hash'e model ve boyut girmezse, model değiştirildiğinde eski vektörler
  // güncel sayılır ve iki farklı uzayın vektörleri karşılaştırılırdı.
  ok(vectorHash('x', 'voyage-4-lite', 512) !== vectorHash('x', 'voyage-4', 512), 'model değişince hash değişiyor')
  ok(vectorHash('x', 'voyage-4-lite', 512) !== vectorHash('x', 'voyage-4-lite', 1024), 'boyut değişince hash değişiyor')
  ok(vectorHash('x', 'voyage-4-lite', 512) === vectorHash('x', 'voyage-4-lite', 512), 'aynı girdi → aynı hash')
}

console.log('\nlessons/review.ts — çıkarımın ikinci turu')
{
  const { groundExtraction, overlap } = await import('../src/lessons/review.js')

  const ham = [
    'Guideline 2.3.3 - Performance - Accurate Metadata',
    '',
    'We noticed that your screenshots do not sufficiently reflect the app in use.',
    'Specifically, your app description states "live 24/7 consultation with certified dermatologists".',
    '',
    'Next Steps: Please revise your screenshots to show the app in use.',
  ].join('\n')

  const temiz = {
    platform: 'apple' as const,
    guideline: '2.3.3',
    scope: 'listing' as const,
    title: 'Ekran goruntuleri arayuz gostermiyor',
    artifact: 'screenshots',
    excerpt: 'live 24/7 consultation with certified dermatologists',
    reviewerText: 'your screenshots do not sufficiently reflect the app in use',
    signals: ['ekran goruntuleri uygulama arayuzunu gostermiyor'],
    falsePositive: null,
    rootCause: null,
    severity: 'high' as const,
    summary: 'Ekran goruntuleri uygulamanin gercek arayuzunu gostermeli.',
  }

  ok(groundExtraction(temiz, ham).length === 0,
    'temiz çıkarımda ŞÜPHE YOK — yani ikinci tur hiç çağrılmaz (maliyet sıfır)')

  // Boru hattındaki en pahalı hata: reviewer cümlesi excerpt'e yazılıyor,
  // uydurma alıntı derse giriyor, oradan rapora "örnek reject" diye basılıyor.
  const uydurma = groundExtraction({ ...temiz, excerpt: 'bu cumle metinde hic gecmiyor' }, ham)
  ok(uydurma.some((d) => d.field === 'excerpt'), 'ham metinde geçmeyen alıntı şüphe üretiyor')

  const yanlisMadde = groundExtraction({ ...temiz, guideline: '4.3' }, ham)
  ok(yanlisMadde.some((d) => d.field === 'guideline'), 'metinde geçmeyen madde numarası şüphe üretiyor')

  ok(groundExtraction({ ...temiz, signals: [] }, ham).some((d) => d.field === 'signals'),
    'belirtisiz ders şüphe üretiyor — modele "neye bakayım"ı söylemiyor')

  // Özet reviewer cümlesinin kopyasıysa ders genellenmemiştir: bir sonraki
  // uygulamada hiçbir işe yaramaz.
  ok(groundExtraction({ ...temiz, summary: temiz.reviewerText }, ham)
    .some((d) => d.field === 'summary'), 'reviewer cümlesini kopyalayan özet şüphe üretiyor')

  // scope'un bedava kontrolü yok ama en pahalı alan: in-app işaretlenen ders
  // prompt'a HİÇ girmez. İşaretler ters yöne bakıyorsa soru sordurulmalı.
  const inAppHam = 'Guideline 2.1\nThe app crashed when we tapped the subscribe button in the sandbox environment.'
  const scopeSuphe = groundExtraction(
    { ...temiz, guideline: '2.1', scope: 'listing', excerpt: '', reviewerText: 'The app crashed when we tapped the subscribe button' },
    inAppHam,
  )
  ok(scopeSuphe.some((d) => d.field === 'scope'),
    'metin uygulama içi davranıştan söz ederken listing seçilirse şüphe üretiyor')

  ok(overlap('screenshots reflect', ham) === 1, 'örtüşme: kelimeler metinde geçiyorsa 1')
  ok(overlap('tamamen alakasiz kelimeler burada', ham) === 0, 'örtüşme: hiç geçmiyorsa 0')
  // Kısa kelimeler elenmeli; yoksa "the/and" örtüşmesi her metni doğrular.
  ok(overlap('the and a of', ham) === 0, 'üç harften kısa kelimeler örtüşmeyi şişirmiyor')
}

console.log('\ncheck/prompt.ts — derslerin prompt\'a girişi')
{
  const kart: RuleCard = {
    id: 'apple-2.3.3-feature-not-evidenced',
    platform: 'apple',
    outcome: 'violation',
    severity: 'high',
    needs: ['screenshots'],
    source: { doc: 'App Review Guidelines', section: '2.3.3', url: 'https://x', retrievedAt: '2026-01-01' },
    ruleText: 'Ekran görüntüleri uygulamayı kullanımda göstermeli.',
    question: 'Ekran görüntüleri arayüzü gösteriyor mu?',
    positiveExample: 'Pazarlama görseli',
    negativeExample: 'Gerçek arayüz',
    tags: [],
  } as unknown as RuleCard

  const ders = {
    id: 'lesson-apple-2.3.3-screenshots',
    ruleId: 'apple-2.3.3-feature-not-evidenced',
    platform: 'apple' as const,
    guideline: '2.3.3',
    scope: 'listing' as const,
    title: 'Ekran goruntuleri arayuz gostermiyor',
    summary: 'Ekran goruntuleri uygulamanin gercek arayuzunu gostermeli.',
    signals: ['ekran goruntusu pazarlama gorseli', 'arayuz eleman yok'],
    falsePositive: 'ilk gorsel kapak olarak pazarlama gorseli olabilir',
    artifact: 'screenshots' as const,
    severity: 'high' as const,
    status: 'active' as const,
    bodyKey: 'bodies/x.md',
    exampleCount: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  const cikti = renderRuleCard(kart, [ders], '')
  ok(cikti.includes('ekran goruntusu pazarlama gorseli'),
    'belirtiler prompt\'a giriyor — özet "ne", belirti "neye bakayım"')
  ok(cikti.includes('SAYILMAZ: ilk gorsel kapak'),
    'yanlış pozitif durumu prompt\'a giriyor — ders benzeyen masum listing\'de ateşlemesin')
  // Ders kuralın YERİNE geçerse, elle yazılmış politika kartını modelden
  // gelmiş bir çıkarım eziyor olurdu. Sıralama tersine dönmemeli.
  ok(cikti.indexOf('# UYGULANACAK KURAL') < cikti.indexOf('geçmişte yaşanmış'),
    'kural dersten ÖNCE geliyor — ders kuralın yerine geçmiyor')

  const dersiz = renderRuleCard(kart, [], '')
  ok(!dersiz.includes('geçmişte yaşanmış'), 'ders yoksa blok hiç açılmıyor (boşuna token yok)')

  // Eski dersler signals/falsePositive alanı olmadan kaydedilmişti.
  const eski = { ...ders, signals: [] as string[], falsePositive: null }
  const eskiCikti = renderRuleCard(kart, [eski], '')
  ok(eskiCikti.includes('Ekran goruntuleri uygulamanin gercek'),
    'alansız eski ders patlamadan render ediliyor')
  ok(!eskiCikti.includes('Belirtiler:'), 'boş belirti listesi başlık bırakmıyor')
}

console.log('\nlessons/ingest.ts — uçtan uca: ikinci tur + anlamsal eşleştirme')
{
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { LocalLessonStore } = await import('../src/lessons/local.js')
  const { ingestReject } = await import('../src/lessons/ingest.js')

  /**
   * Sahte LLM: çağrıları sırayla verilen yanıtlarla karşılar ve HANGİ
   * çağrıların yapıldığını kaydeder. "İkinci tur şüphe yoksa koşmuyor"
   * iddiasını ancak çağrı sayısını sayarak doğrulayabiliriz.
   */
  const stubLlm = (yanitlar: unknown[]) => {
    const cagrilar: string[] = []
    let i = 0
    return {
      llm: {
        name: 'stub', model: 'stub', supportsVision: false, concurrency: 1,
        async healthcheck() { return { ok: true as const } },
        async complete(req: { system: string }) {
          // Sistem promptundan hangi adım olduğunu ayırt ediyoruz.
          cagrilar.push(
            /DENETLERSİN/.test(req.system) ? 'review'
              : /örneği mi/.test(req.system) ? 'match'
                : 'extract',
          )
          return {
            json: yanitlar[i++] ?? null, raw: '',
            usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, ms: 0 },
          }
        },
      },
      cagrilar,
    }
  }

  /**
   * Sahte gömme: kelime torbası → seyrek vektör.
   *
   * Voyage'ı çağırmadan "anlamca yakın" ilişkisini taklit ediyor. Test
   * ettiğimiz şey Voyage'ın kalitesi değil — BORU HATTININ kablolaması:
   * farklı madde numarasındaki bir ders aday havuzuna giriyor mu?
   */
  const BOYUTLAR = [
    'ekran', 'goruntu', 'arayuz', 'pazarlama', 'abonelik', 'fiyat', 'gizlilik', 'iap',
  ]
  const stubEmbedder = {
    name: 'stub', model: 'stub-embed', dim: BOYUTLAR.length,
    async embed(texts: string[]) {
      return texts.map((t) => {
        const alt = t.toLowerCase()
        return BOYUTLAR.map((b) => (alt.includes(b) ? 1 : 0))
      })
    },
  }

  const ham = [
    'Guideline 2.3.3 - Performance - Accurate Metadata',
    '',
    'We noticed that your screenshots do not sufficiently reflect the app in use.',
    'Next Steps: Please revise your screenshots.',
  ].join('\n')

  const cikarim = {
    platform: 'apple', guideline: '2.3.3', scope: 'listing',
    title: 'Ekran goruntuleri arayuz gostermiyor', artifact: 'screenshots',
    excerpt: '', reviewerText: 'your screenshots do not sufficiently reflect the app in use',
    signals: ['ekran goruntusu pazarlama gorseli, arayuz yok'],
    falsePositive: null, rootCause: null, resolution: 'Please revise your screenshots.',
    appName: 'Test', rejectedAt: null, severity: 'high',
    summary: 'Ekran goruntuleri uygulamanin gercek arayuzunu gostermeli.',
  }

  const tmp = await mkdtemp(join(tmpdir(), 'greenlight-lessons-'))
  try {
    const store = new LocalLessonStore(tmp)
    await store.healthcheck()

    // --- 1. Temiz çıkarım: ikinci tur KOŞMAMALI --------------------------
    const a = stubLlm([cikarim])
    const r1 = await ingestReject(a.llm, store, ham, [], { embedder: stubEmbedder })
    ok(r1.kind === 'new-lesson', 'ilk red yeni ders açıyor')
    ok(a.cagrilar.filter((c) => c === 'review').length === 0,
      'temiz çıkarımda ikinci tur ÇAĞRILMIYOR — şüphe yoksa maliyet yok')
    ok(r1.review.doubts.length === 0, 'şüphe listesi boş')
    ok(r1.lesson.signals.length === 1, 'belirtiler derse yazıldı')

    const vektorler = await store.readVectors()
    ok(vektorler.length === 1 && vektorler[0]!.lessonId === r1.lesson.id,
      'yeni dersin vektörü HEMEN yazılıyor — sonraki red onu bulabilsin')

    // --- 2. FARKLI madde numarası, aynı kalıp ----------------------------
    // Asıl iddia bu: 2.3.3 yerine 2.3.1 yazan bir red, numara eşleşmesiyle
    // aday bulamaz ve kopya ders açardı. Anlamsal arama onu yakalamalı.
    const ham2 = [
      'Guideline 2.3.1 - Performance - Accurate Metadata',
      '',
      'Your screenshots do not show the app in use.',
    ].join('\n')
    const b = stubLlm([
      { ...cikarim, guideline: '2.3.1', reviewerText: 'Your screenshots do not show the app in use' },
      { lessonId: r1.lesson.id, reason: 'ayni duzeltme ikisini de cozer' },
    ])
    const r2 = await ingestReject(b.llm, store, ham2, [], { embedder: stubEmbedder })

    ok(r2.matching.exact === 0, 'madde numarası eşleşmesi HİÇBİR aday bulamıyor (2.3.1 ≠ 2.3.3)')
    ok(r2.matching.near.some((n) => n.id === r1.lesson.id),
      'anlamsal arama farklı maddedeki dersi aday havuzuna sokuyor')
    ok(b.cagrilar.includes('match'), 'aday bulunduğu için eşleştirme modele soruluyor')
    ok(r2.kind === 'example-added' && r2.lesson.id === r1.lesson.id,
      'KOPYA DERS AÇILMIYOR — mevcut derse örnek olarak ekleniyor')
    ok((await store.allLessons()).length === 1, 'depoda hâlâ tek ders var')

    // --- 3. Uydurma alıntı: ikinci tur koşar, düzeltemezse SİLİNİR -------
    const c = stubLlm([
      { ...cikarim, guideline: '2.3.3', excerpt: 'bu cumle ham metinde yok' },
      // İkinci tur da uydurmakta ısrar ediyor:
      { excerpt: 'bu da yok', degisenler: ['excerpt'] },
      { lessonId: 'none', reason: 'yeni kalip' },
    ])
    const r3 = await ingestReject(c.llm, store, ham, [], { embedder: stubEmbedder })
    ok(c.cagrilar.includes('review'), 'şüphe varsa ikinci tur ÇAĞRILIYOR')
    ok(r3.review.droppedExcerpt !== null, 'ikinci turdan sonra da bulunamayan alıntı SİLİNİYOR')
    ok(r3.example.excerpt === '', 'uydurma alıntı rapora "örnek reject" diye basılamaz')

    // --- 4. LESSON_REVIEW=off: bedava kontroller yine korur --------------
    const d = stubLlm([
      { ...cikarim, guideline: '2.3.3', excerpt: 'yine yok' },
      { lessonId: 'none', reason: 'yeni kalip' },
    ])
    const r4 = await ingestReject(d.llm, store, ham, [], { embedder: stubEmbedder, reviewMode: 'off' })
    ok(!d.cagrilar.includes('review'), 'off modunda ikinci tur çağrılmıyor')
    ok(r4.review.droppedExcerpt !== null, 'off modunda bile uydurma alıntı siliniyor')

    // --- 5. Gömme kapalı: boru hattı numara tabanına geriliyor -----------
    const e = stubLlm([{ ...cikarim, guideline: '9.9.9' }])
    const r5 = await ingestReject(e.llm, store, ham, [], { embedder: null })
    ok(r5.matching.embedder === false, 'anahtar yokken anlamsal arama kapalı olarak raporlanıyor')
    ok(r5.matching.near.length === 0 && r5.kind === 'new-lesson',
      'gömme olmadan boru hattı DURMUYOR, numara eşleşmesiyle çalışıyor')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

// ===========================================================================
console.log('\nhavuz — istemci ↔ sunucu gidiş-dönüşü')
// ===========================================================================
{
  const { createServer } = await import('node:http')
  const { RemoteLessonStore } = await import('../src/lessons/remote.js')
  // GERÇEK yönlendirici. Sahte bir sunucuya konuşsaydık yalnız kendi
  // varsayımımızı doğrulardık: istemci bir yola gider, sunucu başka bir yolu
  // tanır ve ikisi ayrı dosyada olduğu için kimse fark etmez. Bu deponun bir
  // numaralı hata sınıfı tam olarak bu (belkiPatlarız R18).
  const { createRouter } = await import('../havuz/router.js' as string)

  const ders = {
    id: 'apple-2.3.3-screenshot', ruleId: 'apple-2.3.3-feature-not-evidenced',
    platform: 'apple' as const, guideline: '2.3.3', scope: 'listing' as const,
    title: 'Ekran görüntüsü uygulamayı göstermiyor', summary: 'özet',
    signals: ['mockup çerçevesi'], falsePositive: null, artifact: 'screenshot' as const,
    severity: 'high' as const, status: 'active' as const,
    bodyKey: 'bodies/apple-2.3.3-screenshot.md', exampleCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  }
  const vaka = {
    id: '11111111-1111-4111-8111-111111111111', lessonId: ders.id, appName: 'Glamio',
    platform: 'apple' as const, rejectedAt: '2026-01-05', guideline: '2.3.3',
    artifact: 'screenshot' as const, excerpt: 'alıntı', reviewerText: 'reviewer cümlesi',
    resolution: 'gerçek ekran görüntüsü kondu', rawKey: 'rejects/11111111.txt',
    status: 'active' as const, createdAt: '2026-01-05T00:00:00.000Z',
  }

  /**
   * Bellek içi Postgres taklidi.
   *
   * Postgres'in KENDİSİNİ sınamıyor — onu sınamak Docker ister ve zaten
   * Postgres'in çalıştığını varsayabiliriz. Sınadığı şey aradaki her şey:
   * yetki kapıları, yol eşleşmesi, snake_case ↔ camelCase çevirisi, işlem
   * sarmalayıcısı ve istemcinin beklediği yanıt biçimi.
   */
  const veri = { lessons: [] as any[], reject_cases: [] as any[], lesson_vectors: [] as any[], blobs: [] as any[] }
  const kosullariUygula = (satirlar: any[], sql: string, params: any[]) => {
    const where = sql.split(' where ')[1]?.split(' order by ')[0] ?? ''
    for (const [, kolon, op, n] of where.matchAll(/(\w+)\s*(=|<>)\s*\$(\d+)/g)) {
      const beklenen = params[Number(n) - 1]
      satirlar = satirlar.filter((r) => (op === '=' ? r[kolon!] === beklenen : r[kolon!] !== beklenen))
    }
    return satirlar
  }
  const calistir = async (sql: string, params: any[] = []) => {
    const t = sql.trim().replace(/\s+/g, ' ')
    if (/count\(\*\)::int as dersler from lessons/.test(t))
      return { rows: [{ dersler: veri.lessons.length }], rowCount: 1 }
    if (/count\(\*\)::int as n from reject_cases/.test(t))
      return { rows: [{ n: veri.reject_cases.length }], rowCount: 1 }
    if (/^select \* from lessons/.test(t))
      return { rows: kosullariUygula(veri.lessons, t, params), rowCount: 0 }
    if (/^select \* from reject_cases where lesson_id/.test(t)) {
      const r = veri.reject_cases.filter((x) => x.lesson_id === params[0]).slice(0, params[1])
      return { rows: r, rowCount: r.length }
    }
    if (/^select \* from reject_cases/.test(t))
      return { rows: veri.reject_cases, rowCount: veri.reject_cases.length }
    if (/^select \* from lesson_vectors/.test(t))
      return { rows: veri.lesson_vectors, rowCount: veri.lesson_vectors.length }
    if (/^select content from blobs/.test(t)) {
      const b = veri.blobs.find((x) => x.key === params[0])
      return { rows: b ? [b] : [], rowCount: b ? 1 : 0 }
    }
    if (/^insert into blobs/.test(t)) {
      const v = veri.blobs.find((x) => x.key === params[0])
      if (v) v.content = params[1]
      else veri.blobs.push({ key: params[0], content: params[1], content_type: params[2] })
      return { rows: [], rowCount: 1 }
    }
    if (/^insert into lessons/.test(t)) {
      // Birincil anahtar çakışması Postgres'te 23505 — istemcinin 409
      // görmesi bu koda bağlı, o yüzden taklidi de aynı kodu atıyor.
      if (veri.lessons.some((x) => x.id === params[0]))
        throw Object.assign(new Error('dup'), { code: '23505', detail: `Key (id)=(${params[0]})` })
      veri.lessons.push({
        id: params[0], rule_id: params[1], platform: params[2], guideline: params[3],
        scope: params[4], title: params[5], summary: params[6], signals: params[7],
        false_positive: params[8], artifact: params[9], severity: params[10],
        status: params[11], body_key: params[12], example_count: params[13],
        created_at: params[14], updated_at: params[15],
      })
      return { rows: [], rowCount: 1 }
    }
    if (/^update lessons set status/.test(t)) {
      const l = veri.lessons.find((x) => x.id === params[1])
      if (l) l.status = params[0]
      return { rows: [], rowCount: l ? 1 : 0 }
    }
    if (/^insert into reject_cases/.test(t)) {
      if (!veri.lessons.some((x) => x.id === params[1]))
        throw Object.assign(new Error('fk'), { code: '23503', detail: `lesson_id=(${params[1]})` })
      veri.reject_cases.push({
        id: params[0], lesson_id: params[1], app_name: params[2], platform: params[3],
        rejected_at: params[4], guideline: params[5], artifact: params[6], excerpt: params[7],
        reviewer_text: params[8], resolution: params[9], raw_key: params[10],
        status: params[11], created_at: params[12],
      })
      return { rows: [], rowCount: 1 }
    }
    if (/^insert into lesson_vectors/.test(t)) {
      const v = veri.lesson_vectors.find((x) => x.lesson_id === params[0])
      const yeni = { lesson_id: params[0], model: params[1], dim: params[2], hash: params[3], embedding: params[4] }
      if (v) Object.assign(v, yeni)
      else veri.lesson_vectors.push(yeni)
      return { rows: [], rowCount: 1 }
    }
    throw new Error(`taklit veritabanı bu SQL'i tanımıyor: ${t.slice(0, 80)}`)
  }
  // İşlem sarmalayıcısı: taklitte geri alma yok, ama çağrı yüzeyi aynı.
  const db = { sorgu: calistir, islem: (fn: any) => fn(calistir) }

  const sunucu = createServer(createRouter({ db, okuma: 'oku-belirteci', yazma: 'yaz-belirteci' }))
  await new Promise<void>((r) => sunucu.listen(0, '127.0.0.1', r))
  const port = (sunucu.address() as { port: number }).port
  const adres = `http://127.0.0.1:${port}`

  try {
    // Adres normalleştirme: sonda eğik çizgi ve '/v1' eki tolere edilmeli.
    // Ayarlara adresi yapıştıran kişi hangisini yazdığını hatırlamak zorunda
    // kalmasın — Worker ayarında da aynı tolerans var.
    const yazar = new RemoteLessonStore(`${adres}/v1/`, 'yaz-belirteci')
    const okur = new RemoteLessonStore(adres, 'oku-belirteci')

    ok((await yazar.healthcheck()).ok, "healthcheck geçiyor ('/v1' ve sondaki eğik çizgi temizlendi)")

    // --- Yazma yolu -----------------------------------------------------
    await yazar.createLesson(ders, '# uzun anlatım')
    ok(veri.lessons.length === 1, 'ders havuza yazıldı')
    ok(veri.blobs.some((b) => b.key === ders.bodyKey && b.content === '# uzun anlatım'),
      'GÖVDE de yazıldı — yalnız satırı taşımak anlatımı yerelde bırakırdı')

    await yazar.addExample(vaka, "apple'ın yazdığının tamamı")
    ok(veri.reject_cases.length === 1, 'red vakası havuza yazıldı')
    ok(veri.blobs.some((b) => b.content === "apple'ın yazdığının tamamı"),
      'HAM metin saklandı — çıkarım iyileşince aynı metin yeniden işlenebilsin')

    // --- Okuma yolu: yazılanın aynısı geri geliyor mu --------------------
    const geri = await okur.findLesson(ders.id)
    ok(geri?.title === ders.title && geri?.ruleId === ders.ruleId, 'ders aynen geri okunuyor')
    ok(Array.isArray(geri?.signals) && geri!.signals[0] === 'mockup çerçevesi',
      'dizi alan (signals) tel üzerinde bozulmuyor')
    ok(geri?.falsePositive === null && geri?.bodyKey === ders.bodyKey,
      'snake_case ↔ camelCase çevirisi tek yerde ve doğru')

    ok((await okur.activeLessons('apple')).length === 1, 'aktif dersler platforma göre filtreleniyor')
    ok((await okur.activeLessons('google')).length === 0, 'başka platformun dersi sızmıyor')
    ok((await okur.candidatesFor('apple', '2.3.3')).length === 1, 'aday havuzu madde ile daralıyor')
    ok((await okur.candidatesFor('apple', '9.9.9')).length === 0, 'alakasız madde aday getirmiyor')
    ok((await okur.findLesson('yok')) === null, '404 hata DEĞİL null dönüyor (yerel depoyla aynı)')

    const ornekler = await okur.examplesFor(ders.id, 2)
    ok(ornekler[0]?.appName === 'Glamio' && ornekler[0]?.rejectedAt === '2026-01-05',
      'örnek red geri okunuyor, tarih gün olarak kalıyor')
    ok((await okur.allExamples()).length === 1, 'tüm vakalar okunuyor')
    ok((await okur.readBody(ders)) === '# uzun anlatım', 'ders gövdesi okunuyor')
    ok((await okur.readRaw(vaka)) === "apple'ın yazdığının tamamı", 'ham reject metni okunuyor')

    // Okunamayan gövde BOŞ DİZE — hata değil. Yerel depo da böyle davranıyor;
    // eksik bir gövde yüzünden tüm denetimi düşürmek orantısız olurdu.
    ok((await okur.readBody({ ...ders, bodyKey: 'bodies/yok.md' })) === '',
      'okunamayan gövde denetimi DÜŞÜRMÜYOR, boş dize dönüyor')

    // --- Vektörler -------------------------------------------------------
    await yazar.writeVectors([])
    ok(veri.lesson_vectors.length === 0, 'boş vektör listesi için ağa HİÇ çıkılmıyor')
    await yazar.writeVectors([{ lessonId: ders.id, model: 'voyage-4-lite', dim: 2, hash: 'h1', vec: [1, 0] }])
    await yazar.writeVectors([{ lessonId: ders.id, model: 'voyage-4-lite', dim: 2, hash: 'h2', vec: [0, 1] }])
    ok(veri.lesson_vectors.length === 1, 'aynı dersin vektörü ÜZERİNE yazılıyor, kopya açmıyor')
    ok((await okur.readVectors())[0]?.hash === 'h2', 'son yazılan vektör okunuyor')

    // --- Durum değişikliği ----------------------------------------------
    await yazar.updateLessonStatus(ders.id, 'retired')
    ok((await okur.findLesson(ders.id))?.status === 'retired', 'ders emekliye ayrılabiliyor')
    ok((await okur.candidatesFor('apple', '2.3.3')).length === 0,
      'emekli ders aday havuzuna GİRMİYOR — kural değiştiyse eski kalıp önerilmemeli')
    await yazar.updateLessonStatus(ders.id, 'active')

    // --- Yetki kapıları --------------------------------------------------
    //
    // SINIR BURADA: okuma belirteci ofisteki herkeste, eklentinin ayarlarında
    // duruyor ve sır sayılamaz. Onay/emeklilik ona AÇIK (ekip işi; kapalıyken
    // havuzun tıkandığı yer oluyordu), ama arşive İÇERİK ekleyip var olanı
    // ezmek kapalı. Sızan bir belirteç geri çevrilebilir bir durum değişikliği
    // yapabilir; kayıp veri üretemez.
    await okur.updateLessonStatus(ders.id, 'draft')
    ok((await okur.findLesson(ders.id))?.status === 'draft',
      'okuma belirteci ders DURUMUNU değiştirebiliyor — onay ekip işi')
    await okur.updateLessonStatus(ders.id, 'active')

    const yasak: string[] = []
    try { await okur.createLesson({ ...ders, id: 'okur-ders', bodyKey: 'bodies/o.md' }, 'x') }
    catch (e) { yasak.push((e as Error).message) }
    try { await okur.addExample({ ...vaka, id: '55555555-5555-4555-8555-555555555555' }, 'x') }
    catch (e) { yasak.push((e as Error).message) }
    try { await okur.writeVectors([{ lessonId: ders.id, model: 'm', dim: 1, hash: 'x', vec: [1] }]) }
    catch (e) { yasak.push((e as Error).message) }
    ok(yasak.length === 3 && yasak.every((m) => /403/.test(m)),
      'okuma belirteci ders/vaka/vektör YAZAMIYOR — üçü de 403')
    ok(!veri.lessons.some((l) => l.id === 'okur-ders') && veri.reject_cases.length === 1,
      'reddedilen yazmalar gerçekten uygulanmadı — arşive hiçbir şey sızmadı')

    const yabanci = new RemoteLessonStore(adres, 'uydurma-belirtec')
    const yabanciSag = await yabanci.healthcheck()
    ok(!yabanciSag.ok && /belirteç/.test(yabanciSag.reason),
      'geçersiz belirteç healthcheck\'te yakalanıyor — denetimin ortasında değil')
    let okudu = false
    try { await yabanci.allLessons(); okudu = true } catch { /* beklenen */ }
    ok(!okudu, 'belirteçsiz okuma da reddediliyor: arşiv adresi bilene açık değil')

    // --- Aynı ders iki kez: ikinci yazan 409 görüyor ---------------------
    //
    // Ortak havuzda gerçek bir senaryo: iki kişi aynı redi aynı anda işler.
    // Sessizce ezmek, ikincinin çıkarımının birincininkini silmesi olurdu.
    let ikinci = ''
    try { await yazar.createLesson(ders, 'x') } catch (e) { ikinci = (e as Error).message }
    ok(/409/.test(ikinci), 'var olan ders id\'si sessizce EZİLMİYOR, 409 dönüyor')

    // --- Dersi olmayan vakayı yazmak ------------------------------------
    let oksuz = ''
    try {
      await yazar.addExample({ ...vaka, id: '22222222-2222-4222-8222-222222222222', lessonId: 'olmayan' }, 'x')
    } catch (e) { oksuz = (e as Error).message }
    ok(/400/.test(oksuz), 'bağlı dersi olmayan vaka reddediliyor (500 değil, 400)')

    // --- Ham HTTP: tarayıcının göreceği davranış -------------------------
    const on = await GERCEK_FETCH(`${adres}/lessons`, { method: 'OPTIONS' })
    ok(on.status === 204 && on.headers.get('access-control-allow-headers')?.includes('x-gl-token'),
      'CORS ön uçuşu geçiyor — eklenti özel başlık gönderebiliyor')
    const yanlisYol = await GERCEK_FETCH(`${adres}/bilinmeyen`, { headers: { 'x-gl-token': 'oku-belirteci' } })
    ok(yanlisYol.status === 404, 'bilinmeyen yol 404')
    const yanlisYontem = await GERCEK_FETCH(`${adres}/vectors`, {
      method: 'POST', headers: { 'x-gl-token': 'yaz-belirteci' },
    })
    // 404 değil 405: yol VAR, yalnız fiil yanlış. 404 deseydik "böyle bir uç
    // yok" derdik ve arayan kişi yanlış yerde arardı.
    ok(yanlisYontem.status === 405, 'var olan yolda yanlış yöntem 405 veriyor, 404 değil')
    const kotuDurum = await GERCEK_FETCH(`${adres}/lessons/${ders.id}`, {
      method: 'PATCH',
      headers: { 'x-gl-token': 'yaz-belirteci', 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'uydurma' }),
    })
    ok(kotuDurum.status === 400, 'geçersiz durum değeri kapıda reddediliyor')
  } finally {
    await new Promise<void>((r) => sunucu.close(() => r()))
  }

  // Havuz kapalıyken: hata YUTULMUYOR ama tanınabilir olmalı — "adres yanlış /
  // sunucu kapalı" ile "havuz hayır dedi" ayrı sorunlar, ayrı yerde aranır.
  const olu = new RemoteLessonStore('http://127.0.0.1:1/', 'x', 800)
  const oluSag = await olu.healthcheck()
  ok(!oluSag.ok, 'ulaşılamayan havuz healthcheck\'te DÜŞÜYOR, sessizce boş dönmüyor')
  ok(!oluSag.ok && /ulaşılamadı/.test(oluSag.reason), 'sebep "ulaşılamadı" diyor ve adresi yazıyor')
}

console.log(`\n${passed} geçti, ${failed} kaldı`)
process.exit(failed ? 1 : 0)
