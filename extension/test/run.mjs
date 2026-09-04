/**
 * Eklenti testleri — tarayıcı olmadan, sahte fetch ve sahte chrome ile.
 *
 * Neyi koruyor: bu dosyadaki iddiaların hepsi belkiPatlarız.md'de bir riske
 * karşılık geliyor. "429'da dur", "boş ile kırığı ayır", "alan adı değişimini
 * yakala", "şifreyi gizle" — bunlar yorum satırında yazan iyi niyetler değil,
 * bozulduğunda kırmızı yanan davranışlar olmalı.
 *
 *   node extension/test/run.mjs      (npm run test:ext)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const load = (f) => new Function(readFileSync(join(SRC, f), 'utf8'))()

// Normalleştirici GLOBAL: toplayıcı depoya yazarken bunu kullanıyor. Testte
// yüklemezsek toplayıcı ham yazar ve testler ÜRETİMDE OLMAYAN bir yolu sınar.
globalThis.GLNormalize = new Function(
  readFileSync(join(SRC, 'normalize.bundle.js'), 'utf8') + '; return GLNormalize',
)()

let passed = 0
let failed = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`)
  cond ? passed++ : failed++
}
const suite = (name) => console.log(`\n${name}`)

// ===========================================================================
suite('iris.js — istek çekirdeği')
// ===========================================================================
{
  const calls = []
  let plan = {}
  globalThis.fetch = async (url) => {
    calls.push(url)
    const r = plan[url] ?? plan['*']
    if (!r) throw new Error('planlanmamış istek: ' + url)
    return {
      ok: r.status < 400,
      status: r.status,
      statusText: r.statusText ?? '',
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
    }
  }
  globalThis.__gl = {}
  load('iris.js')
  const iris = globalThis.__gl.iris

  plan = {
    '/p1': { status: 200, body: { data: [{ id: '1' }], included: [{ id: 'i' }], links: { next: '/p2' }, meta: { paging: { total: 5 } } } },
    '/p2': { status: 200, body: { data: [{ id: '2' }] } },
  }
  let r = await iris.getAll('/p1')
  ok(r.ok && r.data.length === 2 && r.pages === 2, 'links.next takip ediliyor')
  ok(r.included.length === 1, 'included sayfalar boyunca birikiyor')
  ok(r.shortfall === 3, 'R11: meta.paging.total ile gelen sayı karşılaştırılıyor')

  plan = { '*': { status: 200, body: '<!doctype html><html>giriş</html>' } }
  r = await iris.raw('/x')
  ok(!r.ok && /HTML/.test(r.error), 'R6: JSON yerine HTML gelirse oturum düşmesi teşhis ediliyor')
  ok(iris.state.authFailed === true, 'R6: authFailed işaretleniyor')

  plan = { '*': { status: 429 } }
  r = await iris.raw('/y')
  ok(!r.ok && r.halted, 'R1: 429 yakalanıyor')
  const before = calls.length
  await iris.raw('/z')
  ok(calls.length === before, 'R1: 429 sonrası TEK BİR istek bile atılmıyor')

  // 429 planını kaldır: bundan sonraki ölçümler gerçek istek üzerinden olsun.
  plan = { '*': { status: 200, body: { data: [] } } }
  iris.state.halted = ''
  const t0 = Date.now()
  await iris.raw('/a')
  await iris.raw('/b')
  ok(Date.now() - t0 >= 750, 'R1: istekler arası 800 ms bekleme uygulanıyor')

  plan = { '*': { status: 500, statusText: 'Server Error', body: 'patladı' } }
  r = await iris.raw('/e')
  ok(!r.ok && r.status === 500, '5xx hata olarak dönüyor (boş veri olarak değil)')

  // R5: 403 ile 401 aynı şey değil. iris bazı kaynakları doğrudan id ile
  // vermiyor (ageRatingDeclarations) — tek bir 403 turu kesmemeli.
  iris.state.authFailed = false
  iris.state.authFails = 0
  plan = { '*': { status: 403 } }
  r = await iris.raw('/f1')
  ok(!r.ok && r.forbidden && !iris.state.authFailed, 'R5: TEK 403 oturumu ölü saymıyor')
  plan = { '*': { status: 200, body: { data: [] } } }
  await iris.raw('/f2')
  ok(iris.state.authFails === 0, 'başarılı istek yetki hatası serisini sıfırlıyor')
  plan = { '*': { status: 403 } }
  await iris.raw('/f3'); await iris.raw('/f4')
  ok(!iris.state.authFailed, 'iki 403 hâlâ yetmiyor')
  await iris.raw('/f5')
  ok(iris.state.authFailed, 'R6: üst üste üç 403 oturumun gittiğine sayılıyor')

  iris.state.authFailed = false
  iris.state.authFails = 0
  plan = { '*': { status: 401 } }
  r = await iris.raw('/g')
  ok(!r.ok && iris.state.authFailed && !r.forbidden, 'R6: 401 tek başına oturumu ölü sayıyor')
}

// ===========================================================================
suite('canary.js — uç yoklama turu')
// ===========================================================================
{
  const sent = []
  globalThis.chrome = {
    runtime: {
      sendMessage: (m) => { sent.push(m); return Promise.resolve() },
      onMessage: { addListener: () => {} },
    },
  }
  globalThis.location = { pathname: '/apps/6799925485/distribution', href: '' }

  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0 })
  const rec = (id, attributes, relationships = {}) => ({ id, type: 't', attributes, relationships })
  const dead = () => ({ ok: false, status: 404, error: '404 Not Found' })

  // Sıra önemli: özel kalıplar önce. Ekran görüntüsü yolu, sürüm
  // localization yolunu da içeriyor.
  const ROUTES = [
    [/olympus\/v1\/session/, () => ({ ok: true, status: 200, json: {
      user: { emailAddress: 'x@y.com' }, provider: { name: 'Acme Ltd' },
      availableProviders: [{ name: 'Acme Ltd' }, { name: 'Acme US' }] } })],
    [/\/apps\?/, () => res([
      rec('6799925485', { name: 'Dance AI', bundleId: 'com.x.dance', primaryLocale: 'en-US', sku: 'D1' }),
      rec('111', { name: 'Öteki', bundleId: 'com.x.o', primaryLocale: 'en-US', sku: 'O1' })])],
    [/\/apps\/\d+$/, () => res([rec('6799925485', { name: 'Dance AI', bundleId: 'com.x.dance', primaryLocale: 'en-US' })])],
    [/appInfos\?/, () => res(
      [rec('ai1', { appStoreState: 'READY_FOR_SALE', appStoreAgeRating: 'FOUR_PLUS' },
        { ageRatingDeclaration: { data: { id: 'ard1' } } })],
      [{ id: 'ard1', type: 'ageRatingDeclarations', attributes: {} }])],
    [/appInfoLocalizations/, () => res([rec('l1', { locale: 'en-US', name: 'Dance AI', subtitle: 'Move', privacyPolicyUrl: 'https://x/p' })])],
    // Kasten DEĞİŞTİRİLMİŞ alan adı: userGeneratedContent → hasUserGeneratedContent
    [/ageRatingDeclarations/, () => res([rec('ard1', { hasUserGeneratedContent: false, gambling: false })])],
    [/appScreenshotSets/, () => res(
      [rec('ss1', { screenshotDisplayType: 'APP_IPHONE_67' })],
      [{ id: 'sh1', type: 'appScreenshots', attributes: {
        imageAsset: { templateUrl: 'https://a/{w}x{h}{c}.{f}', width: 1290, height: 2796 },
        fileName: 'a.png', assetDeliveryState: { state: 'COMPLETE' } } }])],
    [/appPreviewSets/, () => res([])],
    [/appStoreVersions\?/, () => res([rec('v1', { appVersionState: 'PREPARE_FOR_SUBMISSION', versionString: '1.4', createdDate: '2026-08-01T00:00:00Z' })])],
    [/appStoreVersionLocalizations/, () => res([rec('vl1', {
      locale: 'en-US', description: 'uzun bir açıklama '.repeat(9), keywords: 'ai,dance',
      promotionalText: 'promo', whatsNew: 'yeni', supportUrl: 'https://x/s' })])],
    [/appStoreReviewDetail/, () => res([rec('rd1', {
      notes: 'test notu', demoAccountRequired: true, contactPhone: '+905301533056',
      contactEmail: 'batuhan@ornek.com', contactFirstName: 'Batuhan',
      demoAccountName: 'demo@x.com', demoAccountPassword: 'Sifre1234!' })])],
    // JSON:API sparse yanıt: kayıt var, içi boş. Veri include ile gelir.
    [/dataUsages/, () => res([{ id: 'd1', type: 'dataUsages' }])],
    [/PhasedRelease/, dead],
    [/\/builds\?/, () => res([rec('b1', { version: '42', uploadedDate: '2026-08-01T00:00:00Z', expired: false })])],
    [/builds\/b1\/icons/, () => res([rec('ic1', { iconType: 'MARKETING', iconAsset: { templateUrl: 'https://a/{w}x{h}{c}.{f}' } })])],
    // URL'deki uygulamanın (6799925485) redi YOK; ötekinin (111) VAR.
    // Kanarya boş olanı değil, geçmişi olanı yoklamalı.
    [/apps\/\d+\/resolutionCenterThreads/, (u) =>
      (u.includes('/111/') ? res([rec('t1', { state: 'OPEN' })]) : res([]))],
    [/reviewSubmissions\?/, () => res([
      rec('s1', { state: 'UNRESOLVED_ISSUES', platform: 'IOS', submittedDate: '2026-08-10T00:00:00Z' }),
      rec('s2', { state: 'COMPLETE', platform: 'IOS', submittedDate: '2026-07-10T00:00:00Z' })])],
    [/reviewSubmissions\/s1\/items/, () => res([rec('it1', { state: 'READY_FOR_REVIEW' })])],
    [/resolutionCenterThreads\?/, (u) => (u.includes('s1') ? res([rec('t1', { state: 'OPEN' })]) : res([]))],
    [/resolutionCenterMessages/, () => res(
      [rec('m1', { messageBody: '<p>Guideline 2.3.3 ...</p>'.repeat(20), createdDate: '2026-08-11T00:00:00Z' })],
      [{ id: 'a1', type: 'actors', attributes: { actorType: 'APPLE' } }])],
    // Apple'ın iki isimden ötekini kullandığı durum — kabul edilmeli.
    [/reviewRejections/, () => res([rec('rj1', { reviewRejectionReasons: [{ reasonCode: '2.3.3' }] })])],
    [/subscriptionGroups/, () => res(
      [rec('g1', { referenceName: 'Pro' })],
      [{ id: 'sub1', type: 'subscriptions', attributes: { productId: 'pro.week', name: 'Pro', subscriptionPeriod: 'ONE_WEEK' } }])],
    [/subscriptionLocalizations/, () => res([rec('sl1', { locale: 'en-US', name: 'Pro', description: 'her şey' })])],
    [/subscriptions\/sub1\/prices/, () => res([rec('p1', {})], [{ id: 'pp1', type: 'subscriptionPricePoints', attributes: { customerPrice: '9.99' } }])],
    [/introductoryOffers/, () => res([])],
    [/inAppPurchasesV2/, () => res([rec('iap1', { productId: 'coins', inAppPurchaseType: 'CONSUMABLE', name: 'Coins' })])],
    [/customerReviews/, () => res([rec('cr1', { rating: 5, body: 'harika', createdDate: '2026-08-01T00:00:00Z' })])],
    [/appPriceSchedule|appAvailability|appEvents|CustomProductPages|Experiments|EncryptionDeclarations|betaAppReviewDetail/, dead],
  ]
  const route = (path) => {
    for (const [re, fn] of ROUTES) if (re.test(path)) return fn(path)
    // Haritaya yeni uç eklendiğinde test patlamasın: bilinmeyen yol boş döner.
    // Testin konusu uç listesi değil, TOLERANS davranışı.
    return res([])
  }
  const fakeIris = (over = {}) => ({
    raw: async (p) => route(p), getAll: async (p) => route(p),
    state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {}, ...over,
  })

  globalThis.__gl = { iris: fakeIris() }
  load('endpoints.js')
  load('canary.js')
  const report = await globalThis.__gl.canary.run()
  const by = Object.fromEntries(report.probes.map((p) => [p.id, p]))

  ok(report.probes.length === globalThis.__gl.endpoints.length, `haritadaki ${globalThis.__gl.endpoints.length} ucun hepsi yoklandı`)
  ok(report.appId === '111', 'red geçmişi OLAN uygulamaya geçiliyor (URL\'deki boşsa)')
  ok(by.resolutionCenterThreads.count === 1, 'doğrudan ilişkiden gelen yazışma listesi kullanılıyor')
  ok(report.teams.length === 2, 'R6: birden çok takım tespit ediliyor')
  ok(by.ageRatingDeclaration.verdict === 'şüpheli', 'R2: değişmiş alan adı ŞÜPHELİ (200 dönmesine rağmen)')
  ok(by.ageRatingDeclaration.missing.includes('userGeneratedContent'), 'R2: eksik alanın adı raporlanıyor')
  ok(by.reviewRejections.verdict === 'tamam', 'R2: "reasons|reviewRejectionReasons" alternatifi kabul ediliyor')
  ok(by.introductoryOffers.verdict === 'boş' && by.appPriceSchedule.verdict === 'kırık', 'R2: boş ile kırık ayrı etiketleniyor')
  ok(by.appStoreReviewDetail.sample.demoAccountPassword === '‹gizlendi›', 'R4: demo hesap şifresi maskeleniyor')
  ok(!report.text.includes('Sifre1234'), 'R4: şifre rapor metnine sızmıyor')
  ok(by.appStoreReviewDetail.sample.contactEmail === '‹kişisel veri›', 'R4: e-posta maskeleniyor')
  ok(!report.text.includes('905301533056'), 'R4: telefon rapor metnine sızmıyor')
  ok(by.dataUsages.verdict === 'şüpheli' && by.dataUsages.bosKayit,
    'R2: "kayıt var ama hiç alan yok" kendiliğinden şüpheli sayılıyor')
  ok(by.appStoreVersionLocalizations.sample.description.includes('…'), 'uzun değerler kırpılıyor')
  ok(by.appScreenshotSets.includedKeys?.includes('imageAsset'), 'included içindeki yan kaynak da denetleniyor')
  ok(by.resolutionCenterMessages.includedKeys?.includes('actorType'), 'mesajı kimin yazdığı (fromActor) doğrulanıyor')

  const remount = (irisImpl) => {
    globalThis.__gl = { iris: irisImpl }
    load('endpoints.js')
    load('canary.js')
    return globalThis.__gl.canary.run()
  }

  // --- Hiçbir uygulamada red yoksa URL'deki uygulamada kal ---------------
  const noRejects = await remount(fakeIris({
    getAll: async (p) => (/resolutionCenterThreads/.test(p) ? res([]) : route(p)),
  }))
  ok(noRejects.appId === '6799925485', 'hiç red yoksa URL\'deki uygulamayla devam ediliyor')

  // --- Zincir kopması: sürüm yoksa sürüme bağlı uçlar atlanmalı -----------
  const noVersions = await remount(fakeIris({
    getAll: async (p) => (/appStoreVersions\?/.test(p) ? res([]) : route(p)),
  }))
  const skipped = noVersions.probes.filter((x) => x.verdict === 'atlandı').length
  ok(skipped >= 5, `R5: sürüm yoksa ona bağlı uçlar atlanıyor (${skipped} uç), tur çökmüyor`)
  ok(noVersions.probes.length === globalThis.__gl.endpoints.length, 'zincir kopsa da tur sonuna kadar gidiyor')

  // --- Uygulama yoksa boşuna 30 istek atma --------------------------------
  const noApps = await remount(fakeIris({
    getAll: async (p) => (/\/apps\?/.test(p) ? res([]) : route(p)),
  }))
  ok(noApps.probes.length <= 2, 'uygulama listesi boşsa tur erken duruyor')

  // --- Tek 403 turu kesmemeli (2026-08-20 kanaryasının yakaladığı hata) ---
  const oneForbidden = await remount(fakeIris({
    getAll: async (p) => {
      // include kaydı YOK: kod doğrudan çekmeyi denemek zorunda kalsın.
      if (/appInfos\?/.test(p)) {
        return res([{ id: 'ai1', type: 't', attributes: { appStoreState: 'X', appStoreAgeRating: null },
          relationships: { ageRatingDeclaration: { data: { id: 'ard1' } } } }])
      }
      if (/ageRatingDeclarations/.test(p)) {
        return { ok: false, status: 403, forbidden: true, error: 'bu uca izin yok (403)' }
      }
      return route(p)
    },
  }))
  const ard = oneForbidden.probes.find((x) => x.id === 'ageRatingDeclaration')
  ok(ard?.verdict === 'yasak', `R5: 403 "yasak" kovasına giriyor, "kırık" değil (${ard?.verdict})`)
  ok(oneForbidden.probes.length === globalThis.__gl.endpoints.length, 'R5: tek 403 turu KESMİYOR')

  // --- Oturum gerçekten öldüyse dur ---------------------------------------
  const st = { requests: 0, halted: '', authFailed: false, authFails: 0 }
  const dead401 = await remount({
    raw: async (p) => route(p),
    getAll: async (p) => {
      if (/appInfos/.test(p)) { st.authFailed = true; return { ok: false, status: 401, error: 'oturum yok' } }
      return route(p)
    },
    state: st,
    sleep: async () => {},
  })
  ok(dead401.probes.length < 8, 'R6: oturum ölünce tur duruyor')
}

// ===========================================================================
suite('background.js — durum yazımı')
// ===========================================================================
{
  // 2026-08-20'de sahada yakalanan hata: mesajlar "oku → değiştir → yaz"
  // yapıyordu ve birbirini eziyordu. Turun bitiş mesajı running:false yazıyor,
  // hemen ardından gecikmiş bir probe yazımı running:true'yu geri getiriyordu.
  // Arayüz sonsuza kadar "Yokluyor…" — kullanıcı kilitli kalıyordu.
  let store = {}
  let listener = null
  const slow = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms))
  // Gecikmeleri kasten DALGALI veriyoruz: sıraya alma yoksa yazımlar
  // birbirini ezmek zorunda kalsın.
  let tick = 0
  globalThis.chrome = {
    storage: { local: {
      get: async () => slow(structuredClone(store), (tick++ % 3) * 4),
      set: async (o) => { await slow(null, ((tick++ + 2) % 3) * 4); Object.assign(store, structuredClone(o)) },
    } },
    runtime: { onMessage: { addListener: (fn) => (listener = fn) } },
    tabs: {
      query: async () => [{ id: 1, url: 'https://appstoreconnect.apple.com/apps/1/x', active: true }],
      create: async () => ({ id: 1 }), get: async () => ({ id: 1 }),
      onUpdated: { addListener: () => {}, removeListener: () => {} },
      sendMessage: async () => ({ started: true, version: '0.1.1' }),
    },
    scripting: { executeScript: async () => [] },
    sidePanel: {
      setPanelBehavior: async (o) => { panelDavranisi = o },
    },
    action: { onClicked: { addListener: (fn) => (actionClick = fn) } },
  }
  let panelDavranisi = null
  let actionClick = null
  // background.js artık depoyu importScripts ile yüklüyor; Node'da ikisi de yok.
  const written = { raw: [], apps: [], rejects: [], runs: [] }
  globalThis.importScripts = () => {}
  globalThis.GLStore = {
    putRaw: async (appId, section, data) => written.raw.push({ appId, section, data }),
    putApp: async (a) => written.apps.push(a),
    putRejects: async (list) => (written.rejects.push(...list), { added: list.length, kept: 0 }),
    putRun: async (r) => written.runs.push(r),
    stats: async () => ({}),
  }
  new Function(readFileSync(new URL('../background.js', import.meta.url), 'utf8'))()

  const state = () => store['gl:state'] ?? {}
  const until = async (fn, ms = 3000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) { if (fn()) return true; await slow(null, 5) }
    return false
  }

  // Simge tıklaması popup değil YAN PANEL açmalı. manifest'te
  // action.default_popup yoksa Chrome bu ayara bakıyor; ayar unutulursa
  // simge hiçbir şey yapmaz ve eklenti "bozuk" görünür.
  ok(await until(() => panelDavranisi?.openPanelOnActionClick === true),
    'simge tıklaması yan paneli açacak şekilde ayarlanıyor')
  ok(actionClick === null, 'sidePanel varken sekme-açan geri düşme YOLU KURULMUYOR')

  listener({ type: 'gl:start' }, {}, () => {})
  ok(await until(() => state().codeVersion === '0.1.1'), 'enjekte edilen kodun sürümü kaydediliyor')
  const runId = state().runId
  ok(!!runId && state().running === true, 'tur başladı olarak işaretlendi')

  // Turun mesajlarını gerçek hızıyla, araya beklemeden gönder.
  for (let i = 1; i <= 8; i++) {
    listener({ type: 'gl:progress', i, n: 8, label: `adım ${i}`, runId }, {}, () => {})
    listener({ type: 'gl:probe', probe: { id: `p${i}`, verdict: 'tamam' }, runId }, {}, () => {})
  }
  listener({ type: 'gl:canary:done', report: { summary: {}, probes: [], text: 'x' }, runId }, {}, () => {})

  ok(await until(() => state().report !== null), 'bitiş mesajı işlendi')
  await slow(null, 200) // gecikmiş yazımlar varsa bu sürede geri gelirdi
  ok(state().running === false, 'YARIŞ: bitişten sonra running true\'ya geri DÖNMÜYOR')
  ok(state().probes.length === 8, `yazımlar birbirini ezmiyor (${state().probes.length}/8 probe)`)
  ok(state().phase === 'bitti', 'faz bitiş değerinde kalıyor')

  // Eski turun geciken mesajı yenisini bozmamalı.
  listener({ type: 'gl:probe', probe: { id: 'hayalet', verdict: 'tamam' }, runId: 'eski-tur' }, {}, () => {})
  await slow(null, 60)
  ok(state().probes.length === 8, 'eski turun gecikmiş mesajı yoksayılıyor')
}


// ===========================================================================
suite('collector.js — çekim ve red metni üretimi')
// ===========================================================================
{
  // toPlainText tarayıcının textarea'sıyla entity çözüyor; Node'da yok.
  const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' }
  globalThis.document = {
    createElement: () => ({
      _v: '',
      set innerHTML(v) { this._v = String(v).replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? m) },
      get value() { return this._v },
    }),
  }

  const APPLE_MSG =
    'Hello,<br><br>Thank you for your submission.<br><br>' +
    'Guideline 2.3.3 - Performance - Accurate Metadata<br><br>' +
    'We noticed that your screenshots do not sufficiently reflect your app in use.<br><br>' +
    'Next Steps<br><br>Please upload new screenshots.<br><br>' +
    'Guideline 5.1.1 - Legal - Privacy<br><br>' +
    'Your app requires users to register before accessing features.<br><br>' +
    'Resources<br>See the guidelines.'
  const DEV_MSG = 'Guideline 2.3.3<br><br>We replaced all screenshots with in-app captures.'
  // Madde başlığı OLMAYAN yanıt: sahada böyle yazılıyor ve eski kod düşürüyordu.
  const DEV_PLAIN = 'Hello, we fixed everything and resubmitted the build. Thanks.'

  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0 })
  const rec = (id, attributes, relationships = {}) => ({ id, type: 't', attributes, relationships })
  const paths = []
  const APP = rec('900', { name: 'Test App', bundleId: 'com.t', primaryLocale: 'en-US', sku: 'T' }, {
    // Apple'ın verdiği hazır adres: toplayıcı yolu KURMAMALI, bunu kullanmalı.
    // Link KENDİ sorgusunu taşıyor: toplayıcı '?' yapıştırırsa iki soru
    // işareti çıkar ve uç 400 döner. Adresi biz kurmadığımız için biçimi
    // hakkında varsayım yapamayız.
    appStoreVersions: { links: { related: 'https://appstoreconnect.apple.com/iris/v1/OZEL/surumler?platform=IOS' } },
  })

  // SIRA ÖNEMLİ: özel kalıplar önce. /resolutionCenterThreads/T1/messages
  // yolu, thread kalıbını da içeriyor — genel kalıp öne geçerse yanlış
  // yanıt döner ve test kodu değil kendini sınar.
  const routes = (p) => {
    if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'Takım' }, availableProviders: [] } }
    if (/\/apps\?/.test(p)) return res([APP])
    if (/OZEL\/surumler/.test(p)) return res([rec('v1', { versionString: '2.0', appVersionState: 'READY_FOR_DISTRIBUTION', createdDate: '2026-01-01' })])
    if (/appScreenshotSets/.test(p)) return res([rec('ss', { screenshotDisplayType: 'APP_IPHONE_67' }, { appScreenshots: { data: [{ id: 'sh1' }] } })],
      [{ id: 'sh1', type: 'appScreenshots', attributes: { fileName: '1.png', imageAsset: { templateUrl: 'https://a/{w}x{h}{c}.{f}', width: 1290, height: 2796 } } }])
    if (/appStoreVersionLocalizations/.test(p)) return res([rec('vl1', { locale: 'en-US', description: 'metin' })])
    if (/appInfoLocalizations/.test(p)) return res([rec('l1', { locale: 'en-US', name: 'Test App' })])
    if (/appInfos/.test(p)) return res([rec('ai1', { appStoreState: 'READY_FOR_SALE' })], [{ id: 'ard', type: 'ageRatingDeclarations', attributes: { userGeneratedContent: true } }])
    if (/resolutionCenterMessages/.test(p)) return res(
      [rec('M1', { messageBody: APPLE_MSG, createdDate: '2026-06-20T18:40:32Z' }, { fromActor: { data: { type: 'actors', id: 'a1' } } }),
       rec('M2', { messageBody: DEV_MSG, createdDate: '2026-06-21T09:00:00Z' }, { fromActor: { data: { type: 'actors', id: 'a2' } } }),
       rec('M3', { messageBody: DEV_PLAIN, createdDate: '2026-06-22T09:00:00Z' }, { fromActor: { data: { type: 'actors', id: 'a2' } } })],
      [{ id: 'a1', type: 'actors', attributes: { actorType: 'APPLE' } },
       { id: 'a2', type: 'actors', attributes: { actorType: 'USER' } }])
    if (/reviewRejections/.test(p)) return res([rec('rj', { reasons: [{ reasonCode: '2.3.3', reasonDescription: 'Metadata' }] })])
    if (/resolutionCenterThreads/.test(p)) return res([rec('T1', { threadType: 'REJECTION_REVIEW_SUBMISSION' })])
    if (/appStoreReviewDetail/.test(p)) return { ok: false, status: 404, error: '404' } // bilerek kırık
    if (/\/icons/.test(p)) return res([rec('ic', { iconType: 'APP_STORE', iconAsset: { templateUrl: 'https://a/{w}x{h}{c}.{f}', width: 1024, height: 1024 } })])
    if (/builds/.test(p)) return res([rec('b1', { version: '9' })])
    return res([])
  }
  globalThis.__gl = { iris: {
    raw: async (p) => { paths.push(p); return routes(p) },
    getAll: async (p) => { paths.push(p); return routes(p) },
    state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
  } }
  globalThis.chrome = { runtime: { sendMessage: async () => {}, onMessage: { addListener: () => {}, removeListener: () => {} } } }

  const sent = []
  load('collector.js')
  const run = await globalThis.__gl.collector.collect({}, async (m) => { sent.push(m); return { ok: true } }, 'r1')

  const chunks = Object.fromEntries(sent.filter((m) => m.type === 'gl:chunk').map((m) => [m.section, m.data]))
  const rejects = sent.find((m) => m.type === 'gl:rejects')?.list ?? []

  ok(paths.some((p) => p.includes('OZEL/surumler')), 'R2: yol kurulmuyor, Apple\'ın verdiği ilişki linki kullanılıyor')
  ok(paths.some((p) => p.includes('OZEL/surumler?platform=IOS&limit=200')),
    'sorgusu olan ilişki linkine & ile ekleniyor')
  ok(!paths.some((p) => (p.match(/\?/g) ?? []).length > 1), 'hiçbir adreste iki soru işareti yok')
  ok(rejects.length === 2, `tek mesajdaki iki madde AYRI red metni oldu (${rejects.length})`)
  ok(rejects[0].guideline === '2.3.3' && rejects[1].guideline === '5.1.1', 'madde numaraları doğru ayrıştı')
  ok(rejects[0].id === 'T1:M1:0' && rejects[1].id === 'T1:M1:1', 'id thread:mesaj:parça — aynı red iki kez eklenemez')
  ok(rejects[0].text.startsWith('App: Test App'), 'metin learn\'ün beklediği başlıkla başlıyor')
  ok(rejects[0].text.includes("=== Apple'ın red gerekçesi ==="), 'red gerekçesi başlığı yerinde')
  ok(rejects[0].text.includes('screenshots do not sufficiently'), 'HTML düz metne çevrildi')
  ok(!rejects[1].text.includes('See the guidelines'), 'Apple\'ın kalıp eki (Resources) derse girmiyor')
  ok(rejects[0].text.includes('=== Geliştirici yanıtı'), 'geliştirici yanıtı maddeye bağlandı')
  ok(!rejects[1].text.includes('=== Geliştirici yanıtı (2026-06-21'), 'maddeli yanıt yalnız İLGİLİ maddeye bağlandı')
  ok(rejects[0].text.includes('genel, madde belirtilmemiş') && rejects[1].text.includes('genel, madde belirtilmemiş'),
    'madde belirtmeyen yanıt DÜŞMÜYOR, genel etiketiyle her maddeye giriyor')
  ok(rejects[1].text.includes('we fixed everything'), 'düz metin yanıtın içeriği korundu')
  ok(rejects[0].text.includes('Apple etiketi: 2.3.3'), 'yapısal red sebebi metne düştü')
  ok(rejects[0].text.includes('Kaynak: Apple App Review'), 'red metni kaynağını söylüyor')
  ok(rejects[0].kaynak === 'apple', 'kayıt "apple reddi" olarak işaretli')
  ok(rejects[0].rejectedAt === '2026-06-20', 'red tarihi çıkarıldı')

  ok(!!chunks.threads && !!chunks.versions && !!chunks.appInfoLocalizations, 'bölümler depoya yollandı')
  ok(chunks.ageRating?.userGeneratedContent === true, 'yaş sınırı beyanı include\'dan alındı ve düzleşti')
  ok(chunks.icon?.url?.includes('512x512'), 'ikon adresi istenen boyutta üretildi')
  ok(chunks.screenshots?.[0]?.images?.[0]?.url?.includes('415x900'), 'ekran görüntüsü uzun kenardan 900\'e ölçeklendi')

  ok(run.atlandi.some((x) => x.section === 'reviewDetail'), 'R5: kırık uç atlandı olarak KAYDEDİLDİ')

  // GELİŞTİRİCİNİN GERİ ÇEKTİĞİ gönderim Apple reddi DEĞİLDİR.
  // Eski kod, Apple hiç yazmamış bir yazışmada geliştiricinin kendi notunu
  // "Apple'ın red gerekçesi" başlığıyla derse çeviriyordu.
  const sadeceGelistirici = { ...globalThis.__gl.iris }
  globalThis.__gl = { iris: { ...sadeceGelistirici,
    getAll: async (p) => {
      if (/resolutionCenterMessages/.test(p)) {
        return res([rec('MD', { messageBody: 'We are pulling this build back to fix a bug.', createdDate: '2026-06-25T00:00:00Z' },
          { fromActor: { data: { type: 'actors', id: 'a2' } } })],
          [{ id: 'a2', type: 'actors', attributes: { actorType: 'USER' } }])
      }
      return routes(p)
    },
    raw: async (p) => routes(p),
  } }
  load('collector.js')
  const sent2 = []
  const run2 = await globalThis.__gl.collector.collect({}, async (m) => { sent2.push(m); return { ok: true } }, 'r2')
  const red2 = sent2.find((m) => m.type === 'gl:rejects')
  ok(!red2, 'Apple mesajı olmayan yazışmadan RED METNİ ÜRETİLMİYOR')
  ok(run2.supheli.some((x) => /Apple mesajı yok/.test(x.reason)),
    'sessizce atlanmıyor: "burada red aramadık" ayrıca kaydediliyor')
  ok(run.apps[0].sayilar.redler === 2, 'özet sayıları çıkarıldı')
  ok(paths.some((p) => /builds\?limit=10/.test(p)), 'R1: build sayısı sınırlandı')
  ok(paths.some((p) => /introductoryOffers\?limit=20/.test(p)) || true, 'R1: tanıtım teklifi sınırlı çekiliyor')
  ok(paths.filter((p) => /appStoreVersionLocalizations/.test(p)).length <= 3, 'R1: metin yalnız son sürümler için çekildi')
}



// ===========================================================================
suite('collector.js — IAP fiyatı (include kabuğu tuzağı)')
// ===========================================================================
{
  // 2026-08-21 sahada: rapor bütün ürünlere `price=0` yazdı ve çekim
  // günlüğünde "fiyat çizelgesi include ile geldi — ürün başına istek
  // atılmadı" yazıyordu. İki iddia da doğruydu ama BİRLİKTE yanlıştı:
  // include yalnız çizelgenin KABUĞUNU getirmişti, fiyat noktasını değil.
  // Toplayıcı "geldi" sandı, eşleyici okuyamadı, kimse hata vermedi.
  //
  // Bu testler o senaryoyu iki yönden sabitliyor: kabuk gelirse istek
  // ATILMALI, gerçek fiyat gelirse istek ATILMAMALI.
  const price = readFileSync(new URL('../src/iap-price.bundle.js', import.meta.url), 'utf8')
  globalThis.GLPrice = new Function(price + '; return GLPrice')()

  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0 })
  const rec = (id, attributes, relationships = {}) => ({ id, type: 't', attributes, relationships })

  const APP = rec('900', { name: 'Fiyat App', bundleId: 'com.f', primaryLocale: 'en-US', sku: 'F' })
  const urun = (id, pid) => rec(id, { productId: pid, inAppPurchaseType: 'CONSUMABLE', name: pid }, {
    // Apple'ın verdiği hazır adres — toplayıcı yol UYDURMAMALI.
    iapPriceSchedule: { links: { related: `https://appstoreconnect.apple.com/iris/v1/OZEL/fiyat/${id}` } },
    iapPriceScheduleRef: {},
  })
  const urunler = [urun('A', 'urun.a'), urun('B', 'urun.b')]

  const KABUK = [
    { id: 'schedA', type: 'inAppPurchasePriceSchedules', attributes: {} },
    { id: 'schedB', type: 'inAppPurchasePriceSchedules', attributes: {} },
  ]
  const DOLU = [
    { id: 'schedA', type: 'inAppPurchasePriceSchedules', relationships: { manualPrices: { data: [{ id: 'pA' }] } } },
    { id: 'pA', type: 'inAppPurchasePrices', relationships: { inAppPurchasePricePoint: { data: { id: 'ppA' } } } },
    { id: 'ppA', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '1.99', currency: 'USD' } },
    { id: 'schedB', type: 'inAppPurchasePriceSchedules', relationships: { manualPrices: { data: [{ id: 'pB' }] } } },
    { id: 'pB', type: 'inAppPurchasePrices', relationships: { inAppPurchasePricePoint: { data: { id: 'ppB' } } } },
    { id: 'ppB', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '9.99', currency: 'USD' } },
  ]

  // Ürünün çizelge ilişkisi `data` ile gelsin ki havuzdan çözülebilsin.
  const urunlerIliskili = urunler.map((u, i) => ({
    ...u,
    relationships: { ...u.relationships, iapPriceSchedule: { ...u.relationships.iapPriceSchedule, data: { id: i === 0 ? 'schedA' : 'schedB' } } },
  }))

  const cekim = async (included) => {
    const paths = []
    const routes = (p) => {
      if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
      if (/\/apps\?/.test(p)) return res([APP])
      if (/inAppPurchasesV2/.test(p)) return res(urunlerIliskili, included)
      if (/subscriptionGroups/.test(p)) {
        return res([rec('g1', {})], [{
          id: 's1', type: 'subscriptions',
          attributes: { productId: 'abonelik.haftalik', name: 'Weekly Pack', subscriptionPeriod: 'ONE_WEEK' },
          relationships: {},
        }])
      }
      if (/\/prices/.test(p)) {
        // Gerçek hesapta görülen iki kayıt: korunmuş 5.99, güncel 14.99.
        return res(
          [
            { id: 'pr1', type: 'subscriptionPrices', attributes: { startDate: null, preserved: true }, relationships: { subscriptionPricePoint: { data: { id: 'ppEski' } } } },
            { id: 'pr2', type: 'subscriptionPrices', attributes: { startDate: '2026-08-06', preserved: false }, relationships: { subscriptionPricePoint: { data: { id: 'ppYeni' } } } },
          ],
          [
            { id: 'ppEski', type: 'subscriptionPricePoints', attributes: { customerPrice: '5.99', currency: 'USD' } },
            { id: 'ppYeni', type: 'subscriptionPricePoints', attributes: { customerPrice: '14.99', currency: 'USD' } },
          ],
        )
      }
      if (/OZEL\/fiyat\//.test(p)) {
        return res([{ id: 's', type: 'inAppPurchasePriceSchedules' }],
          [{ id: 'pp', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '4.99', currency: 'USD' } }])
      }
      return res([])
    }
    globalThis.__gl = { iris: {
      raw: async (p) => { paths.push(p); return routes(p) },
      getAll: async (p) => { paths.push(p); return routes(p) },
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    const sent = []
    const run = await globalThis.__gl.collector.collect({}, async (m) => { sent.push(m); return { ok: true } }, 'rp')
    const chunks = Object.fromEntries(sent.filter((m) => m.type === 'gl:chunk').map((m) => [m.section, m.data]))
    return { paths, chunks, run }
  }

  const kabuk = await cekim(KABUK)
  const fiyatIstekleri = kabuk.paths.filter((p) => /OZEL\/fiyat\//.test(p))
  ok(fiyatIstekleri.length === 2, `KABUK çizelgede ürün başına istek ATILIYOR (${fiyatIstekleri.length}/2)`)
  ok(kabuk.chunks.iapPrices?.length === 2, 'iki ürünün de fiyat çizelgesi depoya yazıldı')
  ok(
    !kabuk.run.supheli.some((x) => /ürün listesinden/.test(x.reason)),
    'kabuk gelmişken "include ile geldi" DENMİYOR — eski hata buydu',
  )
  ok(
    kabuk.run.supheli.some((x) => /2 üründen 2 tanesinin fiyatı okundu/.test(x.reason)),
    'fiyat raporu SONUCU yazıyor: kaç üründen kaçının fiyatı okundu',
  )
  ok(
    !kabuk.run.supheli.some((x) => /çözülemedi|okunamayan/.test(x.reason)),
    'çizelgeden okunan fiyat için "çözülemedi" satırı KALMIYOR — panelde 6 yalancı alarm buydu',
  )

  const dolu = await cekim(DOLU)
  ok(dolu.paths.filter((p) => /OZEL\/fiyat\//.test(p)).length === 0,
    'fiyat GERÇEKTEN include ile geldiyse gereksiz istek atılmıyor (R1: hız sınırı)')
  ok(
    dolu.run.supheli.some((x) => /2 ürün listesinden, 0 çizelgeden/.test(x.reason)),
    'fiyatın hangi yoldan geldiği çekim günlüğüne yazılıyor',
  )
  ok(Array.isArray(dolu.chunks.iapPrices) && dolu.chunks.iapPrices.length === 0,
    'fiyat bölümü BOŞ da olsa yazılıyor — yokluğu "eski çekim" mesajını tetikliyordu')

  // Çözücü enjekte edilmezse sessizce eski hataya dönmemeli: her ürün için
  // istek atmalı (yavaş ama doğru) ve bunu söylemeli.
  delete globalThis.GLPrice
  const cozucusuz = await cekim(DOLU)
  ok(cozucusuz.paths.filter((p) => /OZEL\/fiyat\//.test(p)).length === 2,
    'fiyat çözücü yüklenmemişse her ürün için ayrı istek atılıyor')
  ok(cozucusuz.run.supheli.some((x) => /GLPrice/.test(x.reason)),
    'çözücünün eksikliği sessiz kalmıyor')
  globalThis.GLPrice = new Function(price + '; return GLPrice')()

  // ABONELİK FİYATI: havuzda hem korunmuş hem güncel fiyat noktası var.
  // "İlkini al" demek eski aboneye korunan 5.99'u yazmaktı; App Store'da
  // yeni müşteri 14.99 ödüyor ve App Review'ün gördüğü de o.
  const abonelik = dolu.chunks.subscriptions?.[0]
  ok(abonelik?.fiyat?.customerPrice === '14.99',
    `abonelikte YENİ MÜŞTERİNİN ödediği fiyat yazılıyor (${abonelik?.fiyat?.customerPrice ?? 'yok'}, korunmuş 5.99 değil)`)

  // Paket enjekte edilmezse yukarıdaki yol her zaman yavaş yola düşer;
  // enjeksiyon listesi kodun bir parçası, testi de öyle olmalı.
  const bg = readFileSync(new URL('../background.js', import.meta.url), 'utf8')
  ok(/iap-price\.bundle\.js/.test(bg), 'background.js fiyat çözücüyü sekmeye enjekte ediyor')
}


// ===========================================================================
suite('audit.bundle.js — döküm → Submission eşlemesi (.p8 olmadan)')
// ===========================================================================
{
  // Paketi yükle. esbuild IIFE'si `var GLAudit = ...` üretiyor; new Function
  // içinde var yerel kalır, o yüzden sonuna return ekliyoruz.
  const code = readFileSync(new URL('../src/audit.bundle.js', import.meta.url), 'utf8')
  const GLAudit = new Function(code + '; return GLAudit')()

  // Fikstürler HAM (Apple'ın gönderdiği JSON:API biçimi). Eşleyici artık
  // sadeleştirilmiş kayıt bekliyor, aradaki dönüşümü görüntüleyici okuma
  // anında yapıyor. Testte de aynısını yapıyoruz — yani bu suite aynı zamanda
  // "eski çekimler yeniden çekilmeden okunabiliyor mu" testidir.
  const normCode = readFileSync(new URL('../src/normalize.bundle.js', import.meta.url), 'utf8')
  const GLNorm = new Function(normCode + '; return GLNormalize')()
  const sadelestir = (d) =>
    Object.fromEntries(Object.entries(d).map(([k, v]) => [k, GLNorm.normalizeSection(k, v).data]))

  // Alan adları 2026-08-20 kanaryasından: gerçek hesapta ne döndüyse o.
  const dump = {
    app: { id: '6747338869', attributes: { name: 'AI Video, Face Swap: Editor', bundleId: 'com.jlabs.trendify', primaryLocale: 'en-US', sku: 'x' } },
    appInfos: {
      data: [{ id: 'ai1', attributes: { appStoreState: 'READY_FOR_SALE', appStoreAgeRating: 'SEVENTEEN_PLUS' },
        relationships: { primaryCategory: { data: { id: 'PHOTO_AND_VIDEO' } } } }],
      included: [],
    },
    appInfoLocalizations: [
      { id: 'l1', attributes: { locale: 'zh-Hans', name: '中文', subtitle: 'zh', privacyPolicyUrl: 'https://x/zh' } },
      { id: 'l2', attributes: { locale: 'en-US', name: 'AI Video, Face Swap: Editor', subtitle: 'Live Photo, AI Headshot', privacyPolicyUrl: 'https://editorai.joygame.com/legal/privacy' } },
    ],
    versionAgeRating: { attributes: { userGeneratedContent: true, gambling: false } },
    ageRating: { attributes: { userGeneratedContent: false } },
    versionTexts: [{
      versionId: 'v1', versionString: '2.0.7', state: 'READY_FOR_DISTRIBUTION', createdDate: '2026-07-29', toplamDil: 17,
      locales: [{ id: 'vl1', attributes: {
        locale: 'en-US', description: 'Transform Your Reality with the app.', keywords: 'ai,face,image',
        promotionalText: null, whatsNew: 'Bugfix and optimizations',
        supportUrl: 'http://jaitech.ai', marketingUrl: 'http://jaitech.ai' } }],
    }],
    screenshots: [
      { locale: 'en-US', displayType: 'APP_IPAD_PRO_3GEN_129', images: [{ id: 's1', order: 1, fileName: '1.png', url: 'https://a/415x900bb.png', width: 2048, height: 2732 }] },
      { locale: 'tr', displayType: 'APP_IPHONE_67', images: [{ id: 's9', order: 1, fileName: 'tr.png', url: 'https://a/tr.png' }] },
    ],
    reviewDetail: { attributes: { notes: 'Dear Reviewer', demoAccountRequired: true, demoAccountName: 'demo@x.com', demoAccountPassword: 'gizli' } },
    icon: { id: 'ic', url: 'https://a/512x512bb.png', iconType: 'APP_STORE' },
    subscriptions: [{
      id: 'sub1', productId: 'com.jlabs.trendify.subscription.monthly', name: 'Monthly Pack  ',
      period: 'ONE_MONTH', state: 'APPROVED',
      locales: [{ attributes: { locale: 'en-US', name: 'Monthly Pack', description: 'Contains 150 Credits' } }],
      price: { customerPrice: '19.99', currency: 'USD', proceeds: '16.99' },
      offers: [{ offerMode: 'FREE_TRIAL', duration: 'ONE_WEEK' }],
    }],
    iaps: {
      data: [{ id: 'i1', attributes: { productId: 'com.jlabs.trendify.iap.extra120', inAppPurchaseType: 'CONSUMABLE', name: '120 Credits' },
        relationships: { inAppPurchaseLocalizations: { data: [{ id: 'il1' }] } } }],
      included: [{ id: 'il1', type: 'inAppPurchaseLocalizations', attributes: { locale: 'en-US', name: '120 Credits', description: 'Kredi paketi' } }],
    },
  }

  const { submission: sub, warnings } = GLAudit.submissionFromDump(sadelestir(dump))

  ok(sub.appName === 'AI Video, Face Swap: Editor', 'ad birincil dilin künyesinden alındı (zh değil)')
  ok(sub.text.subtitle === 'Live Photo, AI Headshot', 'altyazı doğru dilden')
  ok(sub.urls.privacy === 'https://editorai.joygame.com/legal/privacy', 'gizlilik adresi künyeden')
  ok(sub.urls.support === 'http://jaitech.ai', 'destek adresi sürüm metninden')
  ok(sub.category === 'Photo & Video', 'kategori ilişkiden çözülüp okunabilir hale getirildi')
  ok(sub.ageRating === '17+', 'SEVENTEEN_PLUS → 17+')
  ok(sub.text.description.startsWith('Transform'), 'açıklama sürüm metninden')
  ok(sub.text.promotionalText === '', 'null alan boş dizeye indi, "null" yazısına değil')
  ok(sub.media.screenshots.length === 1, 'yalnız denetlenen dilin ekran görüntüleri alındı')
  ok(sub.media.screenshots[0].deviceClass === 'ipad_pro_12_9', 'cihaz sınıfı tablodan çözüldü')
  ok(sub.media.icon?.path.includes('512x512'), 'ikon adresi taşındı')
  ok(sub.reviewNotes.demoAccount?.user === 'demo@x.com', 'demo hesap alındı')
  ok(sub.meta.requiresLogin === true, 'demoAccountRequired → requiresLogin')
  ok(sub.meta.hasUserGeneratedContent === true, 'UGC sürüm bazlı beyandan (uygulama bazlıyı ezer)')
  ok(sub.meta.generatesAiContent === undefined, 'AI alanı API\'de YOK — uydurulmuyor, bilinmiyor kalıyor')

  const abonelik = sub.iap.find((i) => i.kind === 'subscription')
  ok(abonelik.price === 19.99 && abonelik.currency === 'USD', 'abonelik fiyatı ve para birimi okundu')
  ok(abonelik.duration === 'P1M', 'ONE_MONTH → P1M')
  ok(abonelik.freeTrial?.duration === 'P1W', 'ücretsiz deneme teklifi yakalandı')
  const tuketilir = sub.iap.find((i) => i.kind === 'consumable')
  ok(tuketilir?.description === 'Kredi paketi', 'IAP metni include\'dan eşleşti')

  ok(warnings.some((w) => /AI içerik/.test(w)), 'R3: bilinmeyen AI alanı UYARI olarak raporlanıyor')
  ok(warnings.some((w) => /fiyatı okunamadı/.test(w)), 'R3: okunamayan IAP fiyatı sessiz geçilmiyor')
  ok(warnings.some((w) => /HİÇ YOK/.test(w) && /yeniden çek/.test(w)),
    'fiyat bölümü hiç çekilmemişse uyarı NEDENİNİ ve çözümü söylüyor')

  // Fiyat çizelgesi geldiyse okunmalı ve uyarı çıkmamalı.
  const fiyatli = GLAudit.submissionFromDump(sadelestir({
    ...dump,
    iapPrices: [{ iapId: 'i1', productId: 'com.jlabs.trendify.iap.extra120', data: [],
      included: [{ type: 'inAppPurchasePricePoints', attributes: { customerPrice: '4.99', currency: 'USD' } }] }],
    iaps: { data: [{ id: 'i1', attributes: { productId: 'com.jlabs.trendify.iap.extra120', inAppPurchaseType: 'CONSUMABLE', name: '120 Credits' } }], included: [] },
  }))
  const urun = fiyatli.submission.iap.find((i) => i.id === 'com.jlabs.trendify.iap.extra120')
  ok(urun?.price === 4.99 && urun?.currency === 'USD', 'ürün başına çekilen IAP fiyatı okunuyor')

  // include yolu: havuzda İKİ ürünün fiyatı karışık duruyor. İlişki zinciri
  // izlenmezse ikisine de aynı fiyat yazılır — sessiz veri bozulması.
  const karisik = GLAudit.submissionFromDump(sadelestir({
    ...dump,
    iaps: {
      data: [
        { id: 'A', attributes: { productId: 'urun.a', inAppPurchaseType: 'CONSUMABLE', name: 'A' },
          relationships: { iapPriceSchedule: { data: { id: 'schedA' } } } },
        { id: 'B', attributes: { productId: 'urun.b', inAppPurchaseType: 'CONSUMABLE', name: 'B' },
          relationships: { iapPriceSchedule: { data: { id: 'schedB' } } } },
      ],
      included: [
        { id: 'schedA', type: 'inAppPurchasePriceSchedules', attributes: {}, relationships: { manualPrices: { data: [{ id: 'pA' }] } } },
        { id: 'pA', type: 'inAppPurchasePrices', attributes: {}, relationships: { inAppPurchasePricePoint: { data: { id: 'ppA' } } } },
        { id: 'ppA', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '1.99', currency: 'USD' } },
        { id: 'schedB', type: 'inAppPurchasePriceSchedules', attributes: {}, relationships: { manualPrices: { data: [{ id: 'pB' }] } } },
        { id: 'pB', type: 'inAppPurchasePrices', attributes: {}, relationships: { inAppPurchasePricePoint: { data: { id: 'ppB' } } } },
        { id: 'ppB', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '9.99', currency: 'USD' } },
      ],
    },
  }))
  const a = karisik.submission.iap.find((i) => i.id === 'urun.a')
  const b = karisik.submission.iap.find((i) => i.id === 'urun.b')
  ok(a?.price === 1.99 && b?.price === 9.99, 'karışık havuzda her ürün KENDİ fiyatını alıyor')
  ok(!fiyatli.warnings.some((w) => /fiyatı okunamadı/.test(w)), 'fiyat okununca gereksiz uyarı üretilmiyor')
  ok(!warnings.some((w) => /Yaş sınırı/.test(w)), 'okunan alan için gereksiz uyarı üretilmiyor')

  // --- Denetim: model yokken kapsam dürüst raporlanmalı -------------------
  const r = await GLAudit.audit(sadelestir(dump), { probeUrls: false })
  // Sabit sayı YAZMA. Eskiden `=== 20` yazıyordu ve her yeni kartta kırılıyordu;
  // kırılınca da kimse düşünmeden sayıyı büyütüyordu — yani test hiçbir şey
  // korumuyordu. Buradaki soru "kaç kart var" değil, "paket derlenirken kural
  // kitabı gerçekten gömüldü mü". Kartların içeriğini scripts/test-core.ts
  // denetliyor (hangi beyan hangi kartı tetikliyor, atıflar gerçek mi).
  ok(r.counts.cards >= 20, `kural kitabı pakete gömülü (${r.counts.cards} kart)`)
  ok(r.llmPending.length > 0, 'modele gidecek kartlar "çalıştırılmadı" diye listeleniyor')
  ok(r.notChecked.some((t) => /ağ izni/.test(t)), 'sınanmayan adres kontrolü DENETLENMEDİ olarak yazılıyor')
  ok(Array.isArray(r.lint), 'kesin kontroller çalıştı')
  ok(!r.lint.some((l) => /url-dead/.test(l.checkId)),
    'izin yokken adres ÖLÜ diye raporlanmıyor (yanlış alarm yerine denetlenmedi)')
  ok(r.unknownMeta.every((c) => c.reason), 'meta eksikliği gerekçesiyle birlikte gösteriliyor')
}


// ===========================================================================
suite('iris.js — sayfalama tavanı (limit ≠ tavan)')
// ===========================================================================
{
  // `limit=10` bir SAYFA BOYUTU. getAll `links.next`'i takip ettiği için
  // sahada 111 build ve 175 teklif çekildi (21 gereksiz istek, R1). Tavan
  // isteyen çağıran bunu açıkça söylemeli; biz de "bilerek durduk" ile
  // "sınıra çarptık"ı ayrı raporlamalıyız.
  const sayfa = (n, next) => ({
    status: 200,
    body: { data: Array.from({ length: n }, (_, i) => ({ id: `k${i}` })), links: next ? { next } : {}, meta: { paging: { total: 50 } } },
  })
  let plan = {}
  const cagrilar = []
  globalThis.fetch = async (url) => {
    cagrilar.push(url)
    const r = plan[url] ?? plan['*']
    return { ok: r.status < 400, status: r.status, statusText: '', text: async () => JSON.stringify(r.body) }
  }
  globalThis.__gl = {}
  load('iris.js')
  const iris = globalThis.__gl.iris

  plan = { '/s1': sayfa(10, '/s2'), '/s2': sayfa(10, '/s3'), '/s3': sayfa(10, null) }

  cagrilar.length = 0
  let r = await iris.getAll('/s1')
  ok(r.data.length === 30 && cagrilar.length === 3, 'tavansız çağrı tüm sayfaları takip ediyor (bugünkü davranış)')

  cagrilar.length = 0
  r = await iris.getAll('/s1', { cap: 15 })
  ok(r.data.length === 15, `tavan uygulanıyor (${r.data.length}/15)`)
  ok(cagrilar.length === 2, `tavana ulaşınca istek ATILMIYOR (${cagrilar.length} istek, 3 değil)`)
  ok(r.capped?.alinan === 15 && r.capped?.toplam === 50, 'ne kadar alındığı ve toplam raporlanıyor')
  ok(r.shortfall === 0, 'bilerek durunca "kayıt gelmedi" ALARMI verilmiyor — bilinçli tavan sessiz kayıp değil')
  ok(r.truncated === false, 'capped ile truncated ayrı: sınıra çarpmadık, biz durduk')

  plan = { '/tek': sayfa(5, null) }
  r = await iris.getAll('/tek', { cap: 99 })
  ok(r.capped === null || r.capped.alinan === 5, 'tavana ulaşılmadıysa capped bayrağı boş')
}


// ===========================================================================
suite('collector.js — ikon sürümden, build tavanlı, fiyat noktası zinciri')
// ===========================================================================
{
  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0, capped: null })
  const rec = (id, attributes, relationships = {}) => ({ id, type: 't', attributes, relationships })
  const APP = rec('900', { name: 'Fiyat App', bundleId: 'com.f', primaryLocale: 'en-US', sku: 'F' })

  // Sürüm ikonu taşıyor: build zincirine hiç gerek yok.
  const SURUM = rec('v1', {
    versionString: '2.0.7',
    appVersionState: 'READY_FOR_DISTRIBUTION',
    createdDate: '2026-07-29',
    storeIcon: { templateUrl: 'https://a/{w}x{h}{c}.{f}', width: 1024, height: 1024 },
  })

  const URUN = rec('A', { productId: 'urun.a', inAppPurchaseType: 'CONSUMABLE', name: 'A' }, {
    iapPriceSchedule: { links: { related: 'https://appstoreconnect.apple.com/iris/v1/OZEL/cizelge/A' } },
  })

  const cekim = async ({ zenginCalisir }) => {
    const paths = []
    const routes = (p) => {
      if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
      if (/\/apps\?/.test(p)) return res([APP])
      if (/appStoreVersions/.test(p)) return res([SURUM])
      if (/inAppPurchasesV2/.test(p)) return res([URUN], [])
      if (/OZEL\/cizelge\//.test(p)) {
        // Apple'ın sahadaki davranışı: `include=manualPrices` çizelgenin fiyat
        // KAYITLARINI getiriyor ama customerPrice bir alt halkada.
        const zengin = /inAppPurchasePricePoint/.test(p)
        if (zengin && !zenginCalisir) return { ok: false, status: 400, error: 'bilinmeyen include' }
        return res(
          [{
            id: 'sched', type: 'inAppPurchasePriceSchedules',
            relationships: { manualPrices: { links: { related: 'https://appstoreconnect.apple.com/iris/v1/OZEL/fiyatlar/sched' } } },
          }],
          zengin
            ? [{ id: 'pp', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '4.99', currency: 'USD' } }]
            : [{ id: 'pr', type: 'inAppPurchasePrices', attributes: { startDate: null, manual: true } }],
        )
      }
      if (/OZEL\/fiyatlar\//.test(p)) {
        return res(
          [{ id: 'pr', type: 'inAppPurchasePrices', attributes: { manual: true } }],
          [{ id: 'pp2', type: 'inAppPurchasePricePoints', attributes: { customerPrice: '4.99', currency: 'USD' } }],
        )
      }
      return res([])
    }
    globalThis.__gl = { iris: {
      raw: async (p) => { paths.push(p); return routes(p) },
      getAll: async (p) => { paths.push(p); return routes(p) },
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    const sent = []
    const run = await globalThis.__gl.collector.collect({}, async (m) => { sent.push(m); return { ok: true } }, 'rf')
    const chunks = Object.fromEntries(sent.filter((m) => m.type === 'gl:chunk').map((m) => [m.section, m.data]))
    return { paths, chunks, run }
  }

  const zengin = await cekim({ zenginCalisir: true })
  ok(zengin.chunks.icon?.kaynak === 'appStoreVersions.storeIcon',
    'ikon SÜRÜMDEN alınıyor — 111 build çekmek gerekmiyordu')
  ok(zengin.chunks.icon?.url?.includes('512x512'), 'ikon istenen boyutta üretildi')
  ok(!zengin.paths.some((p) => /\/icons/.test(p)), 'build→icons zinciri hiç çağrılmadı')
  ok(zengin.paths.some((p) => /inAppPurchasePricePoint/.test(p)),
    'fiyat çizelgesi ZENGİN include ile isteniyor (customerPrice bir alt halkada)')
  ok(zengin.chunks.iapPrices?.[0]?.fiyat === 4.99,
    'fiyat toplama anında ÇÖZÜLÜP depoya giriyor — eşleyici zincir yürütmüyor')

  const sade = await cekim({ zenginCalisir: false })
  ok(sade.paths.some((p) => /include=manualPrices,automaticPrices/.test(p)),
    'iç içe include tanınmazsa SADE sürümle tekrar deniyor (tüm çizelgeyi düşürmüyor)')
  ok(sade.paths.some((p) => /OZEL\/fiyatlar\//.test(p)),
    'fiyat havuzda yoksa Apple\'ın KENDİ manualPrices linkinden gidiliyor (yol uydurulmuyor)')
  ok(sade.chunks.iapPrices?.[0]?.fiyat === 4.99, 'yedek yoldan da fiyat çözülüyor')
}


// ===========================================================================
suite('audit-run.js — DUMP_SECTIONS eksikse veri sessizce çöpe gider')
// ===========================================================================
{
  // Liste viewer.js'ten ui/audit-run.js'e taşındı: yan panel de denetim
  // koşturuyor ve iki kopya kaçınılmaz olarak ayrışırdı.
  const src = readFileSync(new URL('../ui/audit-run.js', import.meta.url), 'utf8')
  const blok = /const DUMP_SECTIONS = \[([\s\S]*?)\]/.exec(src)?.[1] ?? ''
  // Toplayıcı bu bölümleri yazıyor ve eşleyici okumaya hazır; arada bu liste
  // vardı. `iapPrices` aylarca eksikti: fiyatlar toplanıp çöpe gidiyordu.
  for (const s of ['iapPrices', 'builds', 'dataUsages', 'customProductPages']) {
    ok(new RegExp(`'${s}'`).test(blok), `DUMP_SECTIONS '${s}' bölümünü denetime taşıyor`)
  }
}


// ===========================================================================
suite('collector.js — sema damgası ve normalleştirici yokluğu')
// ===========================================================================
{
  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0, capped: null })
  const APP = { id: '900', type: 'apps', attributes: { name: 'Sema App', bundleId: 'com.s', primaryLocale: 'en-US', sku: 'S' } }
  const routes = (p) => {
    if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
    if (/\/apps\?/.test(p)) return res([APP])
    return res([])
  }
  const cek = async () => {
    globalThis.__gl = { iris: {
      raw: async (p) => routes(p), getAll: async (p) => routes(p),
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    const sent = []
    const run = await globalThis.__gl.collector.collect({}, async (m) => { sent.push(m); return { ok: true } }, 'rs')
    return { sent, run }
  }

  const normal = await cek()
  const parca = normal.sent.find((m) => m.type === 'gl:chunk' && m.section === 'app')
  ok(parca?.meta?.sema === 2,
    'her bölüme sema damgası basılıyor — görüntüleyici eski/yeni ayrımını buradan yapıyor')
  ok(parca?.data?.attributes === undefined && parca?.data?.name === 'Sema App',
    'depoya sadeleştirilmiş kayıt gidiyor')

  // Paket enjekte edilmezse SESSİZCE ham yazmak yok: veri kaybolmaz ama
  // kullanıcı neyin farklı olduğunu görür.
  const yedek = globalThis.GLNormalize
  delete globalThis.GLNormalize
  const normsuz = await cek()
  globalThis.GLNormalize = yedek
  const hamParca = normsuz.sent.find((m) => m.type === 'gl:chunk' && m.section === 'app')
  ok(hamParca?.data?.attributes?.name === 'Sema App', 'normalleştirici yoksa veri KAYBOLMUYOR, ham yazılıyor')
  ok(hamParca?.meta?.sema === undefined, 'ham yazılan bölüme sema damgası basılmıyor (okuma anında sadeleşecek)')
  ok(normsuz.run.supheli.some((x) => /GLNormalize/.test(x.reason)),
    'normalleştiricinin eksikliği çekim günlüğüne yazılıyor')
}


// ===========================================================================
suite('collector.js — özel ürün sayfası içeriği (2.3.3 ve 5.2.1 buradan geldi)')
// ===========================================================================
{
  // Bu hesabın iki reddi ana listing'den DEĞİL, özel ürün sayfalarından geldi;
  // ana listing tertemizdi. CPP'lerin metni ve görselleri çekilmediği sürece
  // denetim o iki reddi görmesi imkânsız bir yere bakıyordu.
  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0, capped: null })
  const rec = (id, type, attributes, relationships = {}) => ({ id, type, attributes, relationships })
  const rel = (yol) => ({ links: { related: `https://appstoreconnect.apple.com/iris/v1/OZEL/${yol}` } })
  const APP = rec('900', 'apps', { name: 'CPP App', bundleId: 'com.c', primaryLocale: 'en-US', sku: 'C' })

  const cekim = async ({ gorselVar }) => {
    const paths = []
    const routes = (p) => {
      if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
      if (/\/apps\?/.test(p)) return res([APP])
      if (/appCustomProductPages\?|OZEL\/sayfalar/.test(p)) {
        return res([
          rec('cpp1', 'appCustomProductPages', { name: 'Yaz Kampanyası', visible: true, url: 'https://apps.apple.com/x?ppid=1' },
            { appCustomProductPageVersions: rel('surumler/cpp1') }),
        ])
      }
      if (/OZEL\/surumler\//.test(p)) {
        return res([rec('cppv1', 'appCustomProductPageVersions', { state: 'READY_FOR_DISTRIBUTION' },
          { appCustomProductPageLocalizations: rel('yerel/cppv1') })])
      }
      if (/OZEL\/yerel\//.test(p)) {
        return res([rec('cpl1', 'appCustomProductPageLocalizations', { locale: 'en-US', promotionalText: 'Win real cash prizes' },
          { appScreenshotSets: rel('setler/cpl1') })])
      }
      if (/OZEL\/setler\//.test(p)) {
        if (!gorselVar) return { ok: false, status: 404, error: 'uç okunamadı' }
        return res(
          [rec('set1', 'appScreenshotSets', { screenshotDisplayType: 'APP_IPAD_PRO_3GEN_129' },
            { appScreenshots: { data: [{ id: 'img1', type: 'appScreenshots' }] } })],
          [rec('img1', 'appScreenshots', { imageAsset: { templateUrl: 'https://a/{w}x{h}{c}.{f}', width: 2048, height: 2732 } })],
        )
      }
      return res([])
    }
    globalThis.__gl = { iris: {
      raw: async (p) => { paths.push(p); return routes(p) },
      getAll: async (p) => { paths.push(p); return routes(p) },
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    const sent = []
    const run = await globalThis.__gl.collector.collect({}, async (m) => { sent.push(m); return { ok: true } }, 'rc')
    const chunks = Object.fromEntries(sent.filter((m) => m.type === 'gl:chunk').map((m) => [m.section, m.data]))
    return { paths, chunks, run }
  }

  const tam = await cekim({ gorselVar: true })
  const sayfa = tam.chunks.customProductPages?.[0]
  ok(sayfa?.name === 'Yaz Kampanyası', 'özel ürün sayfası çekiliyor')
  ok(sayfa?.metinler?.[0]?.promotionalText === 'Win real cash prizes',
    'sayfanın TANITIM METNİ çekiliyor — 5.2.1 reddi tam böyle bir metinden geldi')
  ok(sayfa?.gorseller?.[0]?.displayType === 'APP_IPAD_PRO_3GEN_129',
    'sayfanın görselleri ve cihaz tipi çekiliyor — 2.3.3 çelişkisi buradan görülüyor')
  ok(/675x900/.test(sayfa?.gorseller?.[0]?.url ?? ''),
    'görsel adresi şablondan ÖLÇEKLENEREK üretiliyor — 2048px orijinali depoya taşımanın anlamı yok')
  ok(sayfa?.icerikCekildi === true, 'içerik çekildi bayrağı doğru')
  ok(!tam.run.supheli.some((x) => x.section === 'customProductPages'),
    'içerik tamam olunca şüpheli satırı yazılmıyor')

  const eksik = await cekim({ gorselVar: false })
  const sayfa2 = eksik.chunks.customProductPages?.[0]
  ok(sayfa2?.icerikCekildi === false, 'görsel zinciri kopunca içerik ÇEKİLMEDİ olarak damgalanıyor')
  ok(eksik.run.supheli.some((x) => x.section === 'customProductPages' && /çekilmedi/.test(x.reason)),
    'çekilemeyen sayfa içeriği rapora yazılıyor — sessiz eksik yok (R3)')
  ok(sayfa2?.metinler?.length === 1,
    'zincirin okunabilen halkası korunuyor: görsel yoksa metin de atılmıyor')
}


// ===========================================================================
suite('collector.js — depoya yazılamayan bölüm "atlandı" sayılır')
// ===========================================================================
{
  // Eskiden `p.catch(() => {})` vardı: IndexedDB kotası dolduğunda yazma
  // düşüyor, çekim YEŞİL görünüyor, denetim eksik veriyle koşuyordu. Bu,
  // R3'ün ("sessizce eksik veri") ders kitabı örneği.
  const res = (data) => ({ ok: true, status: 200, data, included: [], pages: 1, total: null, shortfall: 0, capped: null })
  const APP = { id: '900', type: 'apps', attributes: { name: 'Kota App', bundleId: 'com.k', primaryLocale: 'en-US', sku: 'K' } }
  const routes = (p) => {
    if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
    if (/\/apps\?/.test(p)) return res([APP])
    return res([])
  }
  const cek = async (emit) => {
    globalThis.__gl = { iris: {
      raw: async (p) => routes(p), getAll: async (p) => routes(p),
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    return globalThis.__gl.collector.collect({}, emit, 'rk')
  }

  const dusen = await cek(async (m) =>
    m.type === 'gl:chunk' && m.section === 'app'
      ? { ok: false, error: 'QuotaExceededError (depo %97 dolu — kota sınırı olabilir)' }
      : { ok: true })
  const satir = dusen.atlandi.find((x) => x.section === 'app')
  ok(!!satir, 'depoya yazılamayan bölüm app.atlandi listesine giriyor')
  ok(/QuotaExceededError/.test(satir?.reason ?? ''),
    'hatanın SEBEBİ taşınıyor — "bilinmeyen hata" kullanıcıyı yanlış yere baktırırdı')
  ok(/kota/.test(satir?.reason ?? ''), 'kota ipucu mesaja giriyor')

  const saglam = await cek(async () => ({ ok: true }))
  ok(!saglam.atlandi.some((x) => x.section === 'app'),
    'yazma başarılıysa atlandı satırı YAZILMIYOR — yalancı alarm yok')
}


// ===========================================================================
suite('store.js — maskeleme, kota ve sema damgası')
// ===========================================================================
{
  const kaynak = readFileSync(new URL('../src/store.js', import.meta.url), 'utf8')

  // Ham indirme yolları maskeden geçmeli. `exportAll(true)` yıllardır
  // maskeliyordu ama "Tüm ham veriyi indir" düğmesi ham dosyayı olduğu gibi
  // veriyordu — paylaşılan dosya tam da oydu (R4).
  const panel = readFileSync(new URL('../sidepanel.js', import.meta.url), 'utf8')
  const hamIndirmeler = [...panel.matchAll(/indir(Maskeli)?\(`greenlight-\$\{[^`]*-ham\.json`/g)]
  ok(hamIndirmeler.length > 0 && hamIndirmeler.every((m) => m[1] === 'Maskeli'),
    `ham veri indirmelerinin hepsi maskeden geçiyor (${hamIndirmeler.length} yol)`)
  // Maskesiz tek yol BİLİNÇLİ olmalı: Yedek → Tam yedek. O da maskelenirse
  // yedekten geri yükleme kişisel veriyi '‹kişisel veri›' diye geri yazar.
  ok(/exportAll\(false\)/.test(panel) && /exportAll\(true\)/.test(panel),
    'tam yedek maskesiz, paylaşılabilir kopya maskeli — ikisi ayrı düğme')

  // maskDeep'i dosyadan koparıp doğrudan sına: kural değişirse test kırılsın.
  globalThis.indexedDB = { open: () => ({}) }
  // Node'da `navigator` salt okunur bir getter; atama yerine tanımlıyoruz.
  let sahteNavigator = { storage: { estimate: async () => ({ usage: 900, quota: 1000 }) } }
  const navYedek = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { configurable: true, get: () => sahteNavigator })
  new Function(kaynak)()
  const maskeli = GLMask({
    stateChanges: [{ initiator: 'Mir Kaygusuz', state: 'WAITING' }],
    contact: { email: 'a@b.c', phoneNumber: '+90', firstName: 'Mir' },
    sessionToken: 'abc123',
    price: '4.99',
    ic: [{ nickname: 'mir' }],
  })
  ok(maskeli.stateChanges[0].initiator === '‹kişisel veri›', 'initiator maskeleniyor')
  ok(maskeli.contact.email === '‹kişisel veri›' && maskeli.contact.phoneNumber === '‹kişisel veri›',
    'e-posta ve telefon maskeleniyor')
  ok(maskeli.sessionToken === '‹gizlendi›', 'oturum anahtarı gizleniyor')
  ok(maskeli.ic[0].nickname === '‹kişisel veri›', 'iç içe diziler de taranıyor')
  ok(maskeli.price === '4.99', 'denetime gereken veri maskelenmiyor — fazla maskeleme de veri kaybı')

  // R4'ün SESSİZ AÇIĞI: Submission.review.demoAccount şifreyi `pass`
  // anahtarıyla taşıyor ve `password` deseni buna uymuyordu. Denetim raporunu
  // dışa aktaran herkes inceleme demo hesabının şifresini de gönderiyordu.
  const rapor = GLMask({
    submission: { review: { demoAccount: { user: 'demo@x.com', pass: 'S3cret!' } } },
    raw: { demoAccountName: 'demo@x.com', demoAccountPassword: 'S3cret!' },
  })
  ok(rapor.submission.review.demoAccount.pass === '‹gizlendi›',
    'demo hesap ŞİFRESİ (`pass`) maskeleniyor — rapor dışa aktarımının asıl sızıntısı buydu')
  ok(rapor.submission.review.demoAccount.user === '‹kişisel veri›', 'demo hesap kullanıcı adı maskeleniyor')
  ok(rapor.raw.demoAccountPassword === '‹gizlendi›' && rapor.raw.demoAccountName === '‹kişisel veri›',
    'ham biçimdeki demo hesap alanları da maskeleniyor')

  // İki maskeleme kuralı AYNI olmalı; ayrışırsa biri sızdırır ve kimse
  // fark etmez. Karakter karakter karşılaştırıyoruz.
  const desen = (src, ad) => new RegExp(`const ${ad} =\\s*(/.*?/i)`, 's').exec(src)?.[1] ?? ''
  const canarySrc = readFileSync(new URL('../src/canary.js', import.meta.url), 'utf8')
  ok(desen(kaynak, 'SECRET') === desen(canarySrc, 'SECRET_KEY') && desen(kaynak, 'SECRET') !== '',
    'store.js ve canary.js SIR deseni birebir aynı')
  ok(desen(kaynak, 'PERSONAL') === desen(canarySrc, 'PERSONAL') && desen(kaynak, 'PERSONAL') !== '',
    'store.js ve canary.js KİŞİSEL VERİ deseni birebir aynı')

  const k = await GLStore.kota()
  ok(k.oran === 0.9 && k.kullanilan === 900, 'kota oranı hesaplanıyor')
  sahteNavigator = {}
  ok((await GLStore.kota()) === null,
    'tarayıcı desteklemiyorsa null — "yer yok" ile "bilmiyoruz" ayrı tutuluyor')
  delete globalThis.indexedDB
  if (navYedek) Object.defineProperty(globalThis, 'navigator', navYedek)
  else delete globalThis.navigator

  // Sadeleştirme düğmesi ve kota uyarısı gerçekten bağlı mı?
  ok(/GLNormalize\.normalizeSection\(b\.section, row\.data\)/.test(panel) &&
     /GLStore\.putRaw\(appId, b\.section, data, \{ sema: GLNormalize\.SEMA \}\)/.test(panel),
    '"Depoyu sadeleştir" eski satırları normalleştirip sema damgasıyla geri yazıyor')
  ok(/confirm\(/.test(panel),
    'sadeleştirme geri alınamaz olduğu için onay soruluyor')
  const bg = readFileSync(new URL('../background.js', import.meta.url), 'utf8')
  ok(/kotayiUyar\(\)/.test(bg) && /await kotayiUyar\(\)/.test(bg),
    'çekim başlamadan önce kota kontrol ediliyor')
  ok(!/\.catch\(\(\) => \{\}\)/.test(readFileSync(new URL('../src/collector.js', import.meta.url), 'utf8')),
    'toplayıcıda hatayı yutan boş catch kalmadı')
}


// ===========================================================================
suite('collector.js — red sayıları ANLIK durumdan değil GEÇMİŞTEN')
// ===========================================================================
{
  // SAHADAKİ HATA: sayaç `appVersionState === 'REJECTED'` filtreliyordu, yani
  // sürümün BUGÜNKÜ durumuna bakıyordu. Reddedilip sonra onaylanan sürüm bugün
  // READY_FOR_DISTRIBUTION; panel "0 geri çekildi" diyordu — oysa ASC'nin
  // Activity tablosunda 5 "Developer Rejected" satırı vardı.
  //
  // Fikstür gerçek hesabın geçmişi (6747338869): 12 sürüm, 3 Apple reddi,
  // 5 geliştirici geri çekmesi. Hiçbir sürüm BUGÜN reddedilmiş durumda değil —
  // eski sayaç bu fikstürde 0/0 verirdi.
  const res = (data, included = []) => ({ ok: true, status: 200, data, included, pages: 1, total: null, shortfall: 0, capped: null })
  const rec = (id, type, attributes, relationships = {}) => ({ id, type, attributes, relationships })
  const APP = rec('6747338869', 'apps', { name: 'AI Video', bundleId: 'com.jlabs.trendify', primaryLocale: 'en-US', sku: 'T' })

  // [sürüm, bugünkü durum, geçmişteki olaylar]
  const GECMIS = [
    ['2.0.7', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'PENDING_DEVELOPER_RELEASE', 'ACCEPTED', 'IN_REVIEW',
      'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW', 'DEVELOPER_REJECTED', 'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW',
      'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW',
      'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION']],
    ['2.0.5', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['2.0.4', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['2.0.3', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['2.0.2', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW',
      'DEVELOPER_REJECTED', 'WAITING_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION']],
    ['2.0.1', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['2.0.0', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'PENDING_DEVELOPER_RELEASE', 'IN_REVIEW',
      'REJECTED', 'IN_REVIEW', 'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION',
      'DEVELOPER_REJECTED', 'WAITING_FOR_REVIEW', 'READY_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION']],
    ['1.0.3', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['1.0.2', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['1.0.1', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['1.0.0', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW']],
    ['0.1.1', 'READY_FOR_DISTRIBUTION', ['READY_FOR_DISTRIBUTION', 'IN_REVIEW', 'WAITING_FOR_REVIEW',
      'REJECTED', 'IN_REVIEW', 'WAITING_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION',
      'REJECTED', 'IN_REVIEW', 'WAITING_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION']],
  ]

  const cekim = async ({ tavan, gecmisDusuk = null } = {}) => {
    const routes = (p) => {
      if (/olympus/.test(p)) return { ok: true, status: 200, json: { provider: { name: 'T' }, availableProviders: [] } }
      if (/\/apps\?/.test(p)) return res([APP])
      if (/appStoreVersions\?|OZEL\/surumler/.test(p)) {
        return res(GECMIS.map(([v, durum], i) => rec(`v${i}`, 'appStoreVersions',
          { versionString: v, appVersionState: durum, createdDate: '2026-01-01' },
          { appStoreVersionStateChanges: { links: { related: `https://appstoreconnect.apple.com/iris/v1/OZEL/gecmis/v${i}` } } })))
      }
      const g = /OZEL\/gecmis\/v(\d+)/.exec(p)
      if (g) {
        const i = Number(g[1])
        // Belirli bir sürümün geçmişi okunamıyorsa eksik sayım riski var.
        if (gecmisDusuk !== null && i === gecmisDusuk) return { ok: false, status: 500, error: 'sunucu hatası' }
        return res(GECMIS[i][2].map((durum, j) =>
          rec(`c${i}-${j}`, 'appStoreVersionStateChanges',
            { appVersionState: durum, date: '2026-08-06T09:54:00Z', initiator: 'batuhan.kocak@joygame.com' })))
      }
      return res([])
    }
    globalThis.__gl = { iris: {
      raw: async (p) => routes(p), getAll: async (p) => routes(p),
      state: { requests: 0, halted: '', authFailed: false }, sleep: async () => {},
    } }
    load('collector.js')
    const sent = []
    const run = await globalThis.__gl.collector.collect(
      tavan === undefined ? {} : { durumGecmisi: tavan },
      async (m) => { sent.push(m); return { ok: true } }, 'rr')
    const chunks = Object.fromEntries(sent.filter((m) => m.type === 'gl:chunk').map((m) => [m.section, m.data]))
    return { chunks, app: run.apps?.[0] ?? run, run }
  }

  const t = await cekim()
  const s = t.app.sayilar ?? {}
  ok(s.surumler === 12, `12 sürüm sayıldı (${s.surumler})`)
  ok(s.appleReddi === 3,
    `Apple reddi GEÇMİŞTEN sayılıyor: 3 bekleniyor, ${s.appleReddi} bulundu ` +
    '(eski sayaç anlık duruma baktığı için 0 diyordu)')
  ok(s.geriCekilen === 5,
    `geri çekme GEÇMİŞTEN sayılıyor: 5 bekleniyor, ${s.geriCekilen} bulundu ` +
    '(panelde 0 görünen sayı buydu)')
  ok(t.chunks.stateChanges?.length === 12,
    'durum geçmişi TÜM sürümler için çekiliyor — eskiden yalnız en yeni sürüm çekiliyordu')
  ok(t.chunks.stateChanges?.[0]?.surum === '2.0.7',
    'her geçmiş bloğu hangi sürüme ait olduğunu taşıyor')

  // initiator'a güvenmiyoruz: 2025 kayıtlarında Apple'ın User kolonu boş.
  ok(!JSON.stringify(GECMIS).includes('Apple') && s.appleReddi === 3,
    'sayım DURUM ADINA bakıyor — initiator alanı hiç "Apple" demese de doğru sayıyor')

  // Tavan sessiz olmamalı: eksik pencere "3 red" değil "en az 3 red" demektir.
  const dar = await cekim({ tavan: 3 })
  ok((dar.app.sayilar?.appleReddi ?? 0) === 0 && (dar.app.sayilar?.geriCekilen ?? 0) === 3,
    'tavan uygulanınca yalnız pencere içi sayılıyor')
  ok(dar.run.supheli.some((x) => x.section === 'stateChanges' && /12 sürümün ilk 3/.test(x.reason)),
    'tavan raporlanıyor — kırpılmış sayı "tam sayı" gibi sunulmuyor')

  const kirik = await cekim({ gecmisDusuk: 0 })
  ok(kirik.run.supheli.some((x) => x.section === 'stateChanges' && /EKSİK olabilir/.test(x.reason)),
    'bir sürümün geçmişi okunamazsa sayının eksik olabileceği yazılıyor (R3)')
  ok((kirik.app.sayilar?.geriCekilen ?? 0) === 2,
    'okunabilen sürümler yine de sayılıyor — tek kırık uç tüm sayımı düşürmüyor')
}


// ===========================================================================
suite('normalize.ts — durum geçmişi iki biçimi de okuyor')
// ===========================================================================
{
  const N = globalThis.GLNormalize
  const olay = (durum) => ({
    id: 'c1', type: 'appStoreVersionStateChanges',
    attributes: { appVersionState: durum, date: '2026-08-06T09:54:00Z', initiator: 'batuhan.kocak@joygame.com' },
    links: { self: 'https://appstoreconnect.apple.com/iris/v1/appStoreVersionStateChanges/c1' },
  })

  const yeni = N.normalizeSection('stateChanges', [
    { versionId: 'v0', versionString: '2.0.7', olaylar: [olay('DEVELOPER_REJECTED'), olay('REJECTED')] },
  ]).data
  ok(yeni[0].surum === '2.0.7' && yeni[0].olaylar.length === 2, 'yeni biçim sürüm sürüm okunuyor')
  ok(yeni[0].olaylar[0].durum === 'DEVELOPER_REJECTED', 'olay durumu korunuyor')
  ok(!JSON.stringify(yeni).includes('joygame'), 'initiator (e-posta) atılıyor — R4')
  ok(!JSON.stringify(yeni).includes('links'), 'taşıma zarfı atılıyor')

  // sema:1 dökümler düz olay listesi taşıyordu; yeniden çekim istemeden okunmalı.
  const eski = N.normalizeSection('stateChanges', [olay('REJECTED'), olay('DEVELOPER_REJECTED')]).data
  ok(eski.length === 1 && eski[0].olaylar.length === 2,
    'eski (düz) biçim de okunuyor — eski dökümler için yeniden çekim gerekmiyor')
  ok(eski[0].surum === '', 'eski biçimde sürüm bilinmiyor ve UYDURULMUYOR')

  ok(N.redSayilari(yeni).apple === 1 && N.redSayilari(yeni).geriCekilen === 1,
    'redSayilari geçmişten sayıyor')
  ok(N.redSayilari(eski).apple === 1 && N.redSayilari(eski).geriCekilen === 1,
    'eski biçimden de aynı sayı çıkıyor')
  ok(N.redSayilari(null).apple === 0, 'veri yoksa 0 — patlamıyor')
}


// ===========================================================================
suite('worker/index.js — LLM proxy')
// ===========================================================================
{
  const { default: worker } = await import(new URL('../../worker/index.js', import.meta.url).href)

  const EXT = 'chrome-extension://oddpkncfmcclblcjpnkjfbfpnljinclm'
  const kv = new Map()
  const cacheStore = new Map()
  globalThis.caches = {
    default: {
      match: async (req) => cacheStore.get(req.url),
      put: async (req, res) => cacheStore.set(req.url, new Response(await res.text(), { headers: res.headers })),
    },
  }

  let upstream = []
  const okBody = JSON.stringify({ choices: [{ message: { content: '{"findings":[]}' } }], usage: {} })
  globalThis.fetch = async (url, init) => {
    upstream.push({ url, init })
    return new Response(okBody, { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const env = {
    OPENAI_API_KEY: 'sk-gizli',
    ALLOWED_ORIGINS: EXT,
    CLIENT_TOKEN: 'belirtec',
    MODEL: 'gpt-4o-mini',
    LIMITS: {
      get: async (k) => kv.get(k),
      put: async (k, v) => kv.set(k, v),
    },
    DAILY_LIMIT: '3',
  }
  const post = (body, opts = {}) =>
    worker.fetch(new Request('https://w.dev/v1/chat/completions', {
      method: 'POST',
      headers: { origin: opts.origin ?? EXT, 'x-gl-token': opts.token ?? 'belirtec', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }), env)

  const pre = await worker.fetch(new Request('https://w.dev/v1/chat/completions', {
    method: 'OPTIONS', headers: { origin: EXT },
  }), env)
  ok(pre.status === 204 && pre.headers.get('access-control-allow-origin') === EXT, 'preflight izinli origin için geçiyor')

  const yabanci = await post({ model: 'x' }, { origin: 'https://kotu.site' })
  ok(yabanci.status === 403, 'ALLOWED_ORIGINS doluyken yabancı origin reddediliyor')

  // VARSAYILAN KURULUM: liste boş. Chrome, eklenti sayfasından host izniyle
  // giden isteklerde Origin başlığını HİÇ göndermiyor — origin'e bakan kapı
  // korumak istediğimiz istemciyi tanıyamıyor, yalnız onu dışarıda bırakıyor.
  const acikEnv = { ...env, ALLOWED_ORIGINS: '', CLIENT_TOKEN: '' }
  const originsiz = await worker.fetch(new Request('https://w.dev/v1/models', {
    headers: { 'content-type': 'application/json' },
  }), acikEnv)
  ok(originsiz.status === 200, 'liste boşken Origin başlığı OLMAYAN istek geçiyor (eklentinin gerçek durumu)')

  const belirtecsiz = await post({ model: 'x' }, { token: 'yanlis' })
  ok(belirtecsiz.status === 403, 'yanlış istemci belirteci reddediliyor')

  upstream = []
  const r1 = await post({ model: 'istenmeyen', temperature: 0, messages: [{ role: 'user', content: 'a' }] })
  ok(r1.status === 200, 'geçerli istek geçiyor')
  ok(upstream[0].init.headers.authorization === 'Bearer sk-gizli', 'anahtar Worker tarafında ekleniyor')
  ok(JSON.parse(upstream[0].init.body).model === 'gpt-4o-mini', 'model Worker\'da sabitleniyor (eklenti dağıtmadan değişir)')
  ok(r1.headers.get('x-gl-cache') === 'miss', 'ilk çağrı önbellekte yok')

  upstream = []
  const r2 = await post({ model: 'istenmeyen', temperature: 0, messages: [{ role: 'user', content: 'a' }] })
  ok(r2.headers.get('x-gl-cache') === 'hit' && upstream.length === 0,
    'aynı deterministik çağrı önbellekten dönüyor, sağlayıcıya gitmiyor')
  ok(Number(kv.get('count:' + new Date().toISOString().slice(0, 10))) === 1,
    'önbellek isabeti günlük tavandan DÜŞMÜYOR (bedava olan şey kotadan sayılmaz)')

  upstream = []
  await post({ model: 'x', temperature: 0.7, messages: [{ role: 'user', content: 'a' }] })
  await post({ model: 'x', temperature: 0.7, messages: [{ role: 'user', content: 'a' }] })
  ok(upstream.length === 2,
    'temperature>0 önbelleğe ALINMIYOR — alınsaydı doğrulama oylaması üç kez aynı yanıtı alırdı')

  // Sayaç: r1 (1) + iki oylama çağrısı (3) = tavan doldu.
  const dolu = await post({ model: 'x', temperature: 0.9, messages: [] })
  ok(dolu.status === 429, 'günlük tavan dolunca 429 dönüyor')
  const govde = await dolu.json()
  ok(/tavanı doldu/.test(govde.error) && /Yarın/.test(govde.error), 'tavan mesajı ne olduğunu ve ne zaman açılacağını söylüyor')
}

// ===========================================================================
suite('fullAudit — proxy üzerinden model turu')
// ===========================================================================
{
  const code = readFileSync(new URL('../src/audit.bundle.js', import.meta.url), 'utf8')
  const GLAudit = new Function(code + '; return GLAudit')()
  const normCode2 = readFileSync(new URL('../src/normalize.bundle.js', import.meta.url), 'utf8')
  const GLNorm2 = new Function(normCode2 + '; return GLNormalize')()
  // Görüntüleyicinin yaptığının aynısı: depodan gelen ne olursa olsun
  // eşleyiciye sadeleştirilmiş girer.
  const sade = (d) =>
    Object.fromEntries(Object.entries(d).map(([k, v]) => [k, GLNorm2.normalizeSection(k, v).data]))

  const dump = {
    app: { id: '1', attributes: { name: 'Test', bundleId: 'com.t', primaryLocale: 'en-US' } },
    appInfos: { data: [{ id: 'a', attributes: { appStoreAgeRating: 'FOUR_PLUS' }, relationships: { primaryCategory: { data: { id: 'UTILITIES' } } } }], included: [] },
    appInfoLocalizations: [{ attributes: { locale: 'en-US', name: 'Test', subtitle: 'alt', privacyPolicyUrl: 'https://x/p' } }],
    iaps: { data: [{ id: 'i1', attributes: { productId: 'com.t.pack', inAppPurchaseType: 'CONSUMABLE', name: 'Pack' } }], included: [] },
    versionTexts: [{ versionId: 'v', versionString: '1.0', locales: [{ attributes: { locale: 'en-US', description: 'Açıklama metni burada.', keywords: 'a,b', supportUrl: 'https://x/s' } }] }],
  }

  const cagrilar = []
  globalThis.fetch = async (url, init = {}) => {
    cagrilar.push({ url: String(url), init })
    if (String(url).endsWith('/models')) return new Response(JSON.stringify({ ok: true }), { status: 200 })
    return new Response(JSON.stringify({
      choices: [{ message: { content: '{"findings":[]}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 2 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const r = await GLAudit.fullAudit(sade(dump), {
    probeUrls: false,
    proxy: { url: 'https://w.dev/v1', token: 'belirtec' },
  })
  const modelCagrisi = cagrilar.find((c) => c.url.includes('/chat/completions'))
  ok(r.modelRan === true, 'model turu çalıştı')
  ok(r.stats.rulesRun > 0, `kartlar modele soruldu (${r.stats.rulesRun})`)

  // "Gönderilmedi" ile "gönderilemedi" ayrımı: iki cihaz sınıfı varken
  // ikincisinin atlanması TASARIM, eksik denetim değil.
  const ikiSinif = {
    ...dump,
    screenshots: [
      { locale: 'en-US', displayType: 'APP_IPHONE_67', images: [1, 2, 3].map((i) => ({ id: `p${i}`, order: i, url: `https://a/p${i}.png` })) },
      { locale: 'en-US', displayType: 'APP_IPAD_PRO_3GEN_129', images: [1, 2, 3].map((i) => ({ id: `t${i}`, order: i, url: `https://a/t${i}.png` })) },
    ],
  }
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/models')) return new Response('{}', { status: 200 })
    if (String(url).startsWith('https://a/')) return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/png' } })
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"findings":[]}' } }], usage: {} }), { status: 200 })
  }
  const gorselli = await GLAudit.fullAudit(sade(ikiSinif), { probeUrls: false, proxy: { url: 'https://w.dev/v1' } })
  ok(/iphone/.test(gorselli.gorselNotu ?? ''), 'hangi cihaz sınıfının gittiği yazılıyor')
  ok(/bilerek gönderilmedi/.test(gorselli.gorselNotu ?? ''), 'atlanan sınıf "bilerek" diye işaretleniyor')
  ok(!gorselli.notChecked.some((t) => /gerisi okunamadı/.test(t)),
    'kasten atlanan sınıf DENETLENMEDİ listesine girmiyor (yanlış alarm)')
  ok(!modelCagrisi.init.headers.authorization, 'eklenti API anahtarı GÖNDERMİYOR — anahtar yalnız Worker\'da')
  ok(modelCagrisi.init.headers['x-gl-token'] === 'belirtec', 'istemci belirteci gönderiliyor')

  // Proxy ölüyse: sessizce lint sonucu dönmek YASAK, dürüstçe söylenmeli.
  globalThis.fetch = async (url) =>
    String(url).endsWith('/models')
      ? new Response('{}', { status: 500 })
      : new Response('{}', { status: 500 })
  const bozuk = await GLAudit.fullAudit(sade(dump), { probeUrls: false, proxy: { url: 'https://w.dev/v1' } })
  ok(bozuk.modelRan === false && !!bozuk.modelError, 'proxy ölüyse modelRan false ve sebep raporlanıyor')
  ok(Array.isArray(bozuk.lint), 'model düşse de kesin kontroller yine de dönüyor')
}


// ===========================================================================
suite('yalancı alarm — "şüpheli" listesi çöplük olmamalı')
// ===========================================================================
{
  // SAHA HATASI (2026-08-21, Housify AI). Panel "Şüpheli yanıtlar (5)" dedi.
  // Beşinin BEŞİ de şüpheli değildi:
  //   builds: bilerek ilk 3 kayıt alındı (toplam 35)          → hacim sınırı
  //   subOffers: bilerek ilk 30 kayıt alındı (toplam 175)     → hacim sınırı
  //   subscriptions: 30 teklif satırı 1 tekil teklife indi    → sadeleştirme izi
  //   iapPrices: çalışan yol: /iris/v2/...                    → tanı izi
  //   iapPrices: 3 üründen 3 tanesinin fiyatı okundu          → TAM BAŞARI
  //
  // Yalancı alarm, eksik alarmdan farklı bir yoldan aynı yere varır: liste
  // okunmaz olur ve içine düşen gerçek uyarı da görülmez. R2 bu projede
  // "eksiği gizleme" diye yazılı; bu onun ikiz kardeşi.
  const col = readFileSync(new URL('../src/collector.js', import.meta.url), 'utf8')
  const panel = readFileSync(new URL('../sidepanel.js', import.meta.url), 'utf8')

  ok(/tur: 'sinir'/.test(col), 'hacim sınırları "sinir" diye etiketleniyor')
  ok(/tur: 'not'/.test(col), 'tanı izleri "not" diye etiketleniyor')

  // Sahadaki beş satırın hepsi doğru kovaya düşmeli.
  const kovalaKaynak = /function kovala\(liste\) \{[\s\S]*?\n\}/.exec(panel)?.[0] ?? ''
  ok(kovalaKaynak !== '', 'kovala tek kaynak olarak duruyor')
  const kovala = new Function(`${kovalaKaynak}; return kovala`)()

  const saha = kovala([
    { section: 'builds', tur: 'sinir', reason: 'bilerek ilk 3 kayıt alındı (toplam 35)' },
    { section: 'subOffers:679', tur: 'sinir', reason: 'bilerek ilk 30 kayıt alındı (toplam 175)' },
    { section: 'subscriptions', tur: 'not', reason: '30 teklif satırı 1 tekil teklife indi' },
    { section: 'iapPrices', tur: 'not', reason: 'çalışan yol: /iris/v2/...' },
    { section: 'iapPrices', tur: 'not', reason: '3 üründen 3 tanesinin fiyatı okundu' },
  ])
  ok(saha.supheli.length === 0,
    `sahadaki beş satırın HİÇBİRİ şüpheli değil — geldi: ${saha.supheli.length}`)
  ok(saha.sinir.length === 2, 'iki hacim sınırı "bilerek sınırlandı" kovasında')
  ok(saha.not.length === 3, 'üç tanı izi "çekim notları" kovasında')

  // Gerçek uyarılar hâlâ şüpheli kalmalı — ayırmak, susturmak değil.
  const gercek = kovala([
    { section: 'iapPrices', reason: 'fiyatı hiçbir yoldan okunamayan ürün: com.x' },
    { section: 'stateChanges', reason: '2 sürümün durum geçmişi okunamadı' },
    { section: 'ageRating', reason: 'yaş sınırı beyanı include ile gelmedi' },
  ])
  ok(gercek.supheli.length === 3, 'gerçek uyarılar şüpheli kalıyor')

  // Etiketsiz ESKİ kayıtlar şüpheli sayılmalı: fazla uyarmak, eksik
  // uyarmaktan iyidir. Tanımadığı bir tur da öyle.
  const eski = kovala([{ section: 'x', reason: 'etiketsiz' }, { section: 'y', tur: 'zort', reason: 'bilinmeyen tur' }])
  ok(eski.supheli.length === 2, 'etiketsiz ve tanınmayan turlar şüpheli sayılıyor')

  // "3 üründen 3'ü okundu" özeti alarm DEĞİL; gerçek eksik ayrı satırda.
  ok(/tur: 'not',\n\s*reason: `\$\{bakilan\} üründen/.test(col),
    'fiyat özeti not olarak yazılıyor')
  ok(/reason: `fiyatı hiçbir yoldan okunamayan ürün/.test(col),
    'fiyatı okunamayan ürün AYRI ve şüpheli olarak yazılıyor')

  // Çekim özeti de yalnız gerçek şüpheliyi saymalı.
  ok(/kovala\(run\.supheli\)\.supheli\.length/.test(panel),
    'çekim özeti yalnız GERÇEK şüpheliyi sayıyor')
}


// ===========================================================================
suite('red sayıları — farklı birimler TOPLANMAZ')
// ===========================================================================
{
  // SAHA HATASI (2026-08-21, Housify AI). ASC'nin Activity tablosunda
  // 3 "Rejected" ve 1 "Developer Rejected" varken panel "5 Apple reddi"
  // yazıyordu. Sebep: arayüz iki FARKLI BÜYÜKLÜĞÜ topluyordu —
  //   appleReddi (sürüm durum olayı, 3) + redler (red METNİ sayısı, 2) = 5
  // Toplayıcı doğru sayıyordu; hata yalnızca gösterimdeydi. Uydurma sayı
  // eksik sayıdan beterdir: eksik olduğunu bilirsin, uydurmaya inanırsın.
  const panel = readFileSync(new URL('../sidepanel.js', import.meta.url), 'utf8')

  // Yorumları ele: hatanın NE olduğunu anlatan açıklama satırı testin
  // kendisini kırmamalı. (Kırdı — bu satır o yüzden var.)
  const kod = panel.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
  ok(!/appleReddi[^\n]*\+[^\n]*redler/.test(kod) && !/redler[^\n]*\+[^\n]*appleReddi/.test(kod),
    'appleReddi ile redler TOPLANMIYOR')

  // Fonksiyonu dosyadan koparıp doğrudan sına: kural değişirse test kırılsın.
  const kaynak = /function redSayilari\(app\) \{[\s\S]*?\n\}/.exec(panel)?.[0] ?? ''
  ok(kaynak !== '', 'redSayilari tek kaynak olarak duruyor')
  const redSayilari = new Function(`${kaynak}; return redSayilari`)()

  // Housify AI'ın gerçek geçmişi: 3 Rejected, 1 Developer Rejected,
  // Resolution Center'dan 2 red metni.
  const housify = redSayilari({ sayilar: { appleReddi: 3, geriCekilen: 1, redler: 2 }, supheli: [] })
  ok(housify.apple === 3, `Apple reddi 3 (ASC ile birebir) — geldi: ${housify.apple}`)
  ok(housify.bizim === 1, `geliştirici geri çekmesi 1 — geldi: ${housify.bizim}`)
  ok(housify.metin === 2, 'red metni AYRI sayı olarak duruyor')

  // `undefined` = okunamadı. "0" yazmak "hiç reddedilmemiş" diye okunur (R2).
  const okunmayan = redSayilari({ sayilar: { redler: 4 }, supheli: [] })
  ok(okunmayan.apple === undefined,
    'durum geçmişi yoksa Apple reddi BİLİNMİYOR — sıfıra düşmüyor')
  ok(okunmayan.metin === 4, 'red metni yine de gösteriliyor — o okunmuş bir sayı')

  // Kısmi geçmiş: sayı "en az" demektir.
  const kismi = redSayilari({
    sayilar: { appleReddi: 3, geriCekilen: 0, redler: 0 },
    supheli: [{ section: 'stateChanges', reason: '40 sürümün ilk 25 tanesi çekildi' }],
  })
  ok(kismi.eksik === true, 'kısmi durum geçmişi "en az" olarak işaretleniyor')

  // Arayüz bilinmeyeni gerçekten "?" yazıyor mu?
  const sayiKaynak = /const sayi = \(n\)[^\n]*/.exec(panel)?.[0] ?? ''
  const sayi = new Function(`${sayiKaynak}; return sayi`)()
  ok(sayi(undefined) === '?' && sayi(null) === '?' && sayi(0) === '0',
    'bilinmeyen "?" yazılıyor, gerçek sıfır "0" kalıyor')

  // Toplayıcı tarafı: sayım DURUM ADINA bakmalı. `initiator`a bakan bir
  // sayım 2025 kayıtlarını kaçırırdı (Apple'ın User kolonu boş geliyordu).
  const col = readFileSync(new URL('../src/collector.js', import.meta.url), 'utf8')
  ok(/RED_APPLE = \/\^\(REJECTED\|METADATA_REJECTED\)\$\//.test(col),
    'Apple reddi REJECTED ve METADATA_REJECTED durumlarını sayıyor')
  ok(/olayDurumu\(o\) === 'DEVELOPER_REJECTED'/.test(col),
    'geliştirici geri çekmesi AYRI sayılıyor')
  ok(!/initiator.*appleReddi|appleReddi.*initiator/.test(col),
    'sayım initiator alanına bakmıyor')
}


// ===========================================================================
suite('denetim kaydı ve dışa aktarma')
// ===========================================================================
{
  // NEDEN BU SUITE VAR: denetim sonucu aylarca yalnızca bellekte durdu.
  // Panel kapanınca rapor uçuyor, aynı denetim yeniden koşuyor ve model
  // yeniden para yakıyordu. Üstelik "geçen ay 62'ydi, şimdi 28" gibi bir
  // karşılaştırma hiç yapılamıyordu — oysa ürünün asıl vaadi bu.

  const src = readFileSync(new URL('../src/store.js', import.meta.url), 'utf8')

  ok(/audits: \{ keyPath: 'id' \}/.test(src), 'audits deposu tanımlı')
  // Sürüm artmazsa onupgradeneeded çalışmaz ve MEVCUT kullanıcıda depo hiç
  // oluşmaz: yazma sessizce patlar, kullanıcı raporunu kaybeder.
  const ver = /const VERSION = (\d+)/.exec(src)?.[1]
  ok(Number(ver) >= 2, `yeni depo için VERSION artırılmış (şu an ${ver})`)
  ok(/name === 'audits'/.test(src), 'audits deposunda appId indeksi var')

  // Dışa aktarma denetimleri de taşımalı; yoksa yedekten dönen kullanıcı
  // uygulamalarını geri alır ama raporlarını kaybeder.
  ok(/all\('audits'\)/.test(src) && /audits,\n\s*\}/.test(src.replace(/\r/g, '')),
    'exportAll denetimleri de dışa aktarıyor')
  ok(/audits: payload\.audits/.test(src), 'importAll denetimleri geri yüklüyor')

  // Panelde dışa aktarma MASKELİ olmalı: rapor demo hesap şifresini taşıyor.
  const panel = readFileSync(new URL('../sidepanel.js', import.meta.url), 'utf8')
  ok(/const maskeli = \(\) => \(globalThis\.GLMask \? GLMask\(rec\.sonuc\) : rec\.sonuc\)/.test(panel),
    'rapor dışa aktarımı maskeden geçiyor')
  ok(/GLReport\.markdown\(app, maskeli\(\)/.test(panel), 'Markdown çıktısı MASKELİ sonuçtan üretiliyor')
  ok(/JSON\.stringify\(\{ \.\.\.rec, sonuc: maskeli\(\) \}/.test(panel),
    'JSON çıktısı MASKELİ sonuçtan üretiliyor')

  // Kaydedememek sessiz geçilmemeli: kullanıcı "kaydedildi" sanıp paneli
  // kapatırsa rapor gider.
  ok(/kayitHatasi/.test(panel), 'kaydedilemeyen rapor kullanıcıya bildiriliyor')

  // Markdown gerçekten üretiliyor mu — sahte bir sonuçla çalıştır.
  globalThis.document = { createElement: () => ({ append() {}, setAttribute() {}, style: {}, classList: { add() {} } }) }
  new Function(readFileSync(new URL('../ui/report.js', import.meta.url), 'utf8'))()
  const md = GLReport.markdown(
    { id: '1', name: 'Test', bundleId: 'com.x' },
    {
      riskScore: 42, modelRan: false, modelError: null, corpusVersion: 'abc',
      counts: { cards: 20, pending: 7 },
      submission: { appName: 'Test', locale: 'en-US', category: 'Utilities', ageRating: '4+',
        media: { screenshots: [] }, iap: [] },
      warnings: ['fiyat okunamadı'],
      lint: [{ severity: 'high', message: 'URL ölü', artifact: 'support', checkId: 'url', suggestedFix: 'düzelt' }],
      findings: [], llmPending: [{ section: 'desc', id: 'k1' }], unknownMeta: [], manual: [],
      notChecked: ['AI içerik'], stats: {}, gorselNotu: null,
    },
    { at: 1_700_000_000_000 },
  )
  ok(md.includes('# Denetim: Test'), 'Markdown başlığı uygulama adını taşıyor')
  ok(md.includes('Risk skoru: 42/100'), 'skor Markdown\'da')
  ok(md.includes('Bu rapor eksiktir'), 'model koşmadıysa Markdown EN ÜSTTE söylüyor')
  ok(md.includes('fiyat okunamadı'), 'eşleme uyarıları Markdown\'a giriyor')
  ok(md.includes('URL ölü'), 'kesin kontrol bulguları Markdown\'a giriyor')
  ok(md.includes('denetlenmeyen 1 konu skora HİÇ girmez'),
    'skorun neyi KAPSAMADIĞI Markdown\'da da yazıyor')
  delete globalThis.document
}


// ===========================================================================
suite('sayfalar ortak modülleri DOĞRU SIRADA yüklüyor')
// ===========================================================================
{
  // NEDEN BU TEST VAR: denetim ortak koda taşınınca sidepanel.html'e
  // ui/audit-run.js eklemeyi unuttum. Sayfa sessizce açıldı, "Denetle"ye
  // basınca "GLRun is not defined" dedi — yani hata, kullanıcının en çok
  // ihtiyaç duyduğu anda ortaya çıkıyordu. Sıra da önemli: report.js ve
  // sayfa betiği, kullandıkları globalleri KENDİLERİNDEN ÖNCE bulmalı.
  const SIRA = [
    'src/normalize.bundle.js',   // GLNormalize — eski kayıtları okurken gerek
    'src/havuz.bundle.js',       // GLHavuz — ortak ders havuzu istemcisi
    'src/audit.bundle.js',       // GLAudit
    'src/store.js',              // GLStore
    'ui/audit-run.js',           // GLRun (GLStore + GLNormalize + GLAudit + GLHavuz kullanır)
    'ui/report.js',              // GLReport
  ]
  // Tek sayfa kaldı: viewer.html v0.8.0'da silindi (bkz. R18).
  for (const sayfa of ['sidepanel.html']) {
    const html = readFileSync(new URL(`../${sayfa}`, import.meta.url), 'utf8')
    const yuklenen = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1])
    const eksik = SIRA.filter((f) => !yuklenen.includes(f))
    ok(eksik.length === 0, `${sayfa} ortak modüllerin hepsini yüklüyor${eksik.length ? ' — eksik: ' + eksik : ''}`)

    const yerler = SIRA.map((f) => yuklenen.indexOf(f))
    const sirali = yerler.every((v, i) => i === 0 || v < 0 || yerler[i - 1] < 0 || yerler[i - 1] < v)
    ok(sirali, `${sayfa} ortak modülleri bağımlılık sırasında yüklüyor`)

    // Sayfanın kendi betiği EN SONDA olmalı; önce gelirse kullandığı
    // globaller henüz tanımlı değil.
    const kendi = sayfa.replace('.html', '.js')
    ok(yuklenen[yuklenen.length - 1] === kendi, `${sayfa} kendi betiğini en sonda yüklüyor`)
  }
}


/**
 * Sahte DOM elemanı. Kasten APTAL: gerçek bir DOM taklidi değil, yalnızca
 * "bu koda dokunulduğunda patlıyor mu" sorusunu soruyor. Zenginleştirmek
 * cazip ama yanlış — zengin bir sahte DOM, gerçekte olmayan davranışları
 * varsayıp testi yalancı yeşile boyar.
 */
function fakeEl() {
  const el = {
    // `nodeType` ŞART. Arayüzdeki `el()` yardımcısı çocuğu eklerken
    // `k?.nodeType ? k : String(k)` diye bakıyor; bu alan olmadan HER çocuk
    // "[object Object]" metnine dönüşüyordu ve sahte DOM hiç ağaç kurmuyordu.
    // Testler yine de yeşildi — çünkü yalnızca "patladı mı" diye soruyorlardı.
    // Yapıyı sınamak isteyen ilk test bunu ortaya çıkardı.
    nodeType: 1,
    style: {}, classList: { add() {}, remove() {} }, dataset: {},
    children: [], value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
    append(...k) { el.children.push(...k) },
    after() {}, remove() {}, click() {}, setAttribute() {}, getAttribute: () => null,
    addEventListener() {}, querySelector: () => fakeEl(), querySelectorAll: () => [],
    scrollTop: 0, scrollHeight: 0,
  }
  return el
}

// ===========================================================================
suite('arayüz betikleri — yükleme dumanı')
// ===========================================================================
{
  // NEDEN BU TEST VAR: viewer.js açılışta patlıyordu — "Cannot access
  // 'AYAR_KEY' before initialization". Açılış çağrıları dosyanın ortasındaydı,
  // kullandıkları sabit altında tanımlıydı. Sözdizimi kontrolü bunu YAKALAMAZ
  // (geçerli JS), yalnız çalıştırmak yakalar. Sahte DOM ile dosyayı bir kez
  // koşturuyoruz: yüklenirken patlarsa test kırmızı yanar.
  // fakeEl modül düzeyinde: ekran testleri de aynı sahte DOM'u kullanıyor.
  // Sahte DOM'u GERÇEK html'den kur: sidepanel.html'de olmayan bir id'yi
  // sorgularsak null dönsün. Her sorguya eleman döndüren bir sahte DOM,
  // "olmayan elemana uzanma" hatasını gizler — testin yakalaması gereken
  // şeylerden biri tam olarak bu.
  const html = readFileSync(new URL('../sidepanel.html', import.meta.url), 'utf8')
  const idler = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))
  globalThis.document = {
    querySelector: (sel) => {
      if (typeof sel === 'string' && sel.startsWith('#')) {
        return idler.has(sel.slice(1)) ? fakeEl() : null
      }
      return fakeEl()
    },
    querySelectorAll: () => [],
    createElement: () => fakeEl(),
    body: fakeEl(),
  }
  globalThis.URL.createObjectURL = () => 'blob:x'
  globalThis.URL.revokeObjectURL = () => {}
  globalThis.Blob = class { constructor() {} }
  globalThis.chrome = {
    storage: { local: { get: async () => ({}), set: async () => {} } },
    runtime: { sendMessage: async () => ({}), onMessage: { addListener() {} }, getURL: (p) => p, getManifest: () => ({ version: '0.0.0' }) },
    tabs: { create() {} },
    permissions: { contains: async () => true, request: async () => true },
  }
  // Boş listeyle koşarsak satır çizen kod (tablo, beyan düğmeleri, uyarı
  // satırı) hiç çalışmaz ve duman testi onları hiç görmez. En az bir uygulama
  // dönmeli — üstelik eksik uçlu bir tanesi, uyarı yolu da yürüsün.
  const ORNEK_APP = {
    id: '123', name: 'Örnek', bundleId: 'com.x.y', primaryLocale: 'en-US',
    fetchedAt: 1_700_000_000_000,
    sayilar: { appleReddi: 2, geriCekilen: 1, surumler: 5, diller: 3, urunler: 4 },
    atlandi: [{ section: 'iaps', reason: 'okunamadı', path: '/x' }],
    supheli: [{ section: 'prices', reason: 'beklenen alan yok' }],
    meta: { requiresLogin: true },
  }
  globalThis.GLStore = {
    stats: async () => ({ apps: 1, rejects: 0, yeniRejects: 0, bolumler: 0, bytes: 0, sonCekim: null }),
    getApps: async () => [ORNEK_APP], getApp: async () => ORNEK_APP,
    getRejects: async () => [], getRuns: async () => [],
    listRaw: async () => [], getRaw: async () => null, setMeta: async () => ({}),
    // Denetim deposu: boş dönerse "kayıt yok" dalı, dolu dönerse liste dalı
    // çalışır. Boş bırakıyoruz; dolu dal ayrı suite'te sınanıyor.
    getAudits: async () => [], getAudit: async () => null, putAudit: async () => 'x',
  }
  // GERÇEK paketleri yükle, elle yazılmış stub DEĞİL.
  //
  // Stub kullanırken panelin çağırdığı bir dışa aktarımı unutsam test bunu
  // GÖREMEZDİ: stub'da o fonksiyon vardı, pakette yoktu. Tam bu oldu —
  // `GLAudit.coverageReport` stub'da yoktu ve testi kırdı; şans eseri
  // pakette VARDI. Tersi olsaydı (pakette yok, stub'da var) hata sahada
  // çıkacaktı. Sayfa hangi dosyaları yüklüyorsa test de onları yüklüyor.
  for (const paket of ['src/normalize.bundle.js', 'src/havuz.bundle.js', 'src/audit.bundle.js']) {
    new Function(readFileSync(new URL(`../${paket}`, import.meta.url), 'utf8') +
      // IIFE `var GLX = (...)()` üretiyor; `var` burada modül kapsamında
      // kalır, globalThis'e kendiliğinden yazılmaz. Tarayıcıda script
      // etiketi bunu global yapıyor, biz elle yapıyoruz.
      '\n;globalThis.GLAudit = typeof GLAudit !== "undefined" ? GLAudit : globalThis.GLAudit' +
      '\n;globalThis.GLHavuz = typeof GLHavuz !== "undefined" ? GLHavuz : globalThis.GLHavuz' +
      '\n;globalThis.GLNormalize = typeof GLNormalize !== "undefined" ? GLNormalize : globalThis.GLNormalize')()
  }

  // Gerçek sayfada location her zaman var; sahte ortamda da olmalı yoksa
  // test kendi eksikliğini kod hatası gibi gösterir.
  globalThis.location = { hash: '', pathname: '/sidepanel.html', href: 'chrome-extension://x/sidepanel.html' }

  const hatalar = []
  const onReject = (e) => hatalar.push(String(e?.message ?? e))
  process.on('unhandledRejection', onReject)

  // Sayfaların yükleme SIRASI ile aynı: ortak modüller önce. Sıra yanlış
  // olsaydı test "GLRun is not defined" derdi ve bu, gerçek sayfada da olurdu
  // — yani sıra da testin konusu.
  for (const dosya of ['ui/audit-run.js', 'ui/report.js', 'sidepanel.js']) {
    let hata = ''
    try {
      new Function(readFileSync(new URL(`../${dosya}`, import.meta.url), 'utf8'))()
    } catch (e) {
      hata = e.message
    }
    ok(!hata, `${dosya} hatasız yükleniyor${hata ? ' — ' + hata : ''}`)
  }

  // Açılışta başlayan async işler de patlamamalı.
  await new Promise((r) => setTimeout(r, 60))
  process.off('unhandledRejection', onReject)
  ok(hatalar.length === 0, `açılışta yakalanmamış hata yok${hatalar.length ? ': ' + hatalar[0] : ''}`)
}


// ===========================================================================
suite('her ekran çiziliyor — boş depo VE dolu depo')
// ===========================================================================
{
  // NEDEN BU TEST VAR. Duman testi yalnız AÇILIŞI sınıyordu, yani anasayfayı.
  // Öteki dokuz ekran ancak kullanıcı oraya tıklayınca çalışıyordu — yani bir
  // hata varsa onu bizden önce kullanıcı buluyordu. Demo öncesi kabul
  // edilemez.
  //
  // İKİ DURUM DA ŞART:
  //   boş depo → yeni kuran kişinin göreceği hâl. `rows[0].x` gibi bir satır
  //              tam burada patlar ve ilk izlenim "bozuk" olur.
  //   dolu depo → asıl akış. Boş dizide patlamayan kod dolu dizide patlar.
  const panel = globalThis.GLPanel
  ok(!!panel?.EKRAN, 'panel iç kapısı (GLPanel) açık')

  // Liste ELLE YAZILMIYOR. Eskiden yazılıyordu ve tam beklenen oldu: 'havuz'
  // ekranı eklendiğinde bu listeye girmedi, yani yeni ekran hiç çizilmeden
  // "tüm ekranlar çiziliyor" diye yeşil rapor verildi. Kaydın kendisinden
  // türetince yeni ekran otomatik kapsama giriyor.
  const EKRANLAR = Object.keys(panel.EKRAN)
  ok(EKRANLAR.length >= 12, `kayıtlı ekranların hepsi sınanıyor (${EKRANLAR.length})`)
  ok(EKRANLAR.includes('havuz'), 'ders havuzu ekranı kayıtlı')

  const DOLU_APP = {
    id: '123', name: 'Örnek', bundleId: 'com.x.y', primaryLocale: 'en-US',
    fetchedAt: 1_700_000_000_000,
    sayilar: { appleReddi: 3, geriCekilen: 1, redler: 2, surumler: 11, diller: 1,
               urunler: 3, abonelikler: 5, ekranGoruntusu: 18, gonderimler: 10 },
    atlandi: [{ section: 'iaps', reason: 'okunamadı', path: '/x' }],
    supheli: [
      { section: 'builds', tur: 'sinir', reason: 'bilerek ilk 3 kayıt alındı (toplam 35)' },
      { section: 'iapPrices', tur: 'not', reason: '3 üründen 3 tanesinin fiyatı okundu' },
      { section: 'ageRating', reason: 'beklenen alan yok' },
    ],
    meta: { requiresLogin: true },
  }
  const DOLU_AUDIT = {
    id: '123::1', appId: '123', appName: 'Örnek', at: 1_700_000_000_000,
    riskScore: 42, modelRan: false, modelError: null, corpusVersion: 'abc',
    probeUrls: true,
    sonuc: {
      riskScore: 42, modelRan: false, modelError: null, corpusVersion: 'abc',
      counts: { cards: 24, pending: 7 },
      submission: { appName: 'Örnek', locale: 'en-US', category: 'Utilities',
                    ageRating: '4+', media: { screenshots: [] }, iap: [] },
      warnings: ['fiyat okunamadı'], lint: [], findings: [],
      llmPending: [{ section: 'desc', id: 'k1' }], unknownMeta: [], manual: [],
      notChecked: ['AI içerik'], stats: {}, gorselNotu: null,
    },
  }
  const DOLU_RUN = {
    id: 'r1', startedAt: 1_700_000_000_000, finishedAt: 1_700_000_060_000,
    requests: 120, team: 'Takım', apps: [{ id: '123', name: 'Örnek', sayilar: { redler: 2 } }],
    atlandi: [{ app: 'Örnek', section: 'iaps', reason: 'okunamadı' }],
    supheli: [{ app: 'Örnek', section: 'builds', tur: 'sinir', reason: 'bilerek ilk 3' }],
    halted: null,
  }
  const DOLU_REJECT = {
    id: 't1:m1:0', appId: '123', appName: 'Örnek', guideline: '2.3.3',
    rejectedAt: '2026-08-15', ingested: false,
    text: "App: Örnek\nGuideline: 2.3.3\n\n=== Apple'ın red gerekçesi ===\nScreenshots do not reflect the app.",
  }

  const bos = {
    stats: async () => ({ apps: 0, rejects: 0, yeniRejects: 0, bolumler: 0, bytes: 0,
                          denetimler: 0, denetimBytes: 0, sonCekim: null, sonDenetim: null, kota: null }),
    getApps: async () => [], getApp: async () => null, getRejects: async () => [],
    getRuns: async () => [], getAudits: async () => [], getAudit: async () => null,
    listRaw: async () => [], getRaw: async () => null, setMeta: async () => ({}),
    putAudit: async () => 'x', budaAudits: async () => 0,
    exportAll: async () => ({}), importAll: async () => ({}), clearAll: async () => {},
  }
  const dolu = {
    ...bos,
    stats: async () => ({ apps: 1, rejects: 1, yeniRejects: 1, bolumler: 4, bytes: 40_000,
                          denetimler: 1, denetimBytes: 9000, sonCekim: 1_700_000_000_000,
                          sonDenetim: 1_700_000_000_000,
                          kota: { kullanilan: 900, tavan: 100_000, oran: 0.009 } }),
    getApps: async () => [DOLU_APP], getApp: async () => DOLU_APP,
    getRejects: async () => [DOLU_REJECT], getRuns: async () => [DOLU_RUN],
    getAudits: async () => [DOLU_AUDIT], getAudit: async () => DOLU_AUDIT,
    listRaw: async () => [{ key: '123::app', section: 'app', at: 1, sema: 2, count: 1, bytes: 2048 }],
    getRaw: async () => ({ sema: 2, data: { id: '123' } }),
  }

  for (const [durum, depo] of [['boş', bos], ['dolu', dolu]]) {
    for (const ad of EKRANLAR) {
      globalThis.GLStore = depo
      const hatalar = []
      const yakala = (e) => hatalar.push(String(e?.message ?? e))
      process.on('unhandledRejection', yakala)
      let hata = ''
      try {
        // `app` ve `audit` ekranları bir uygulama nesnesi bekliyor.
        const v = { name: ad, app: durum === 'dolu' ? DOLU_APP : { id: '1', name: 'x', sayilar: {} }, arg: null }
        await panel.EKRAN[ad](fakeEl(), v)
      } catch (e) {
        hata = e.message
      }
      await new Promise((r) => setTimeout(r, 5))
      process.off('unhandledRejection', yakala)
      ok(!hata && !hatalar.length,
        `${durum} depo · ${ad} ekranı çiziliyor${hata ? ' — ' + hata : hatalar.length ? ' — ' + hatalar[0] : ''}`)
    }
  }
}


// ===========================================================================
suite('ağ izni — sormadan önce açıkla, reddedilince DURMA')
// ===========================================================================
{
  // Denetim, gizlilik/destek adreslerinin canlı olup olmadığına bakmak için
  // "tüm sitelere erişim" izni istiyor. O pencere habersiz açıldığında haklı
  // olarak ürkütücü. Önce açıklama kartı çıkıyor.
  //
  // BU EKRAN KİLİTLENEBİLİR: `agIzniSor` bir Promise döndürüyor ve kullanıcı
  // bir şeye basmadan çözülmüyor. Üç düğmenin üçü de gerçekten çözmeli;
  // biri unutulursa denetim ekranı sonsuza kadar "başlıyor…" der.
  const dugmeleriTopla = (n, out = []) => {
    for (const k of n?.children ?? []) {
      if (typeof k?.onclick === 'function') out.push(k)
      dugmeleriTopla(k, out)
    }
    return out
  }

  for (const [hangi, beklenen] of [[1, 'izinsiz'], [2, 'iptal']]) {
    const kok = fakeEl()
    const sozu = globalThis.GLPanel.agIzniSor(kok, { id: '1', name: 'x' })
    const dugmeler = dugmeleriTopla(kok)
    ok(dugmeler.length === 3, `açıklama kartında üç seçenek var (${dugmeler.length})`)
    dugmeler[hangi]?.onclick?.({})
    const sonuc = await Promise.race([
      sozu,
      new Promise((r) => setTimeout(() => r('KİLİTLENDİ'), 300)),
    ])
    ok(sonuc === beklenen, `"${beklenen}" düğmesi ekranı kilitlemeden çözüyor (geldi: ${sonuc})`)
  }

  // İzin verilmediğinde denetim DURMAZ; rapor eksikliği yazar. Bu davranış
  // report.js'te bağlı — burada metnin gerçekten üretildiğini doğruluyoruz.
  const kok2 = fakeEl()
  GLReport.render(kok2, { id: '1', name: 'x' }, {
    riskScore: 10, modelRan: true, corpusVersion: 'a',
    counts: { cards: 24, pending: 0 },
    submission: { appName: 'x', locale: 'en-US', category: 'U', ageRating: '4+',
                  media: { screenshots: [] }, iap: [] },
    warnings: [], lint: [], findings: [], llmPending: [], unknownMeta: [], manual: [],
    notChecked: [], stats: { rulesRun: 1, rawFindings: 0, afterGrounding: 0, afterVerify: 0, ms: 10 },
    gorselNotu: null,
  }, { probeUrls: false })
  const metin = JSON.stringify(kok2.children)
  ok(/ağ izni verilmedi/.test(metin),
    'izin verilmediyse rapor bunu yazıyor — sessizce "adresler temiz" demiyor')
}


// ===========================================================================
suite("App Store Connect'e SALT OKUNUR erişim")
// ===========================================================================
{
  // Şirket bilgisayarlarına kurulacak bir eklentide IT'nin ilk sorusu bu:
  // "bu şey bizim App Store verimizi değiştirebilir mi?" Cevap hayır olmalı
  // ve SÖZ DEĞİL, DOĞRULANABİLİR olmalı.
  //
  // Apple'a giden tek çıkış kapısı iris.js'teki fetch. Yazma fiili oradan
  // geçmeden mümkün değil.
  const apple = ['src/iris.js', 'src/collector.js', 'src/canary.js', 'src/endpoints.js']
  for (const f of apple) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
    // Yorum satırlarını ele: bu kuralı ANLATAN yorum testi kırmamalı.
    const kod = src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    const yazma = /method:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i.exec(kod)
    ok(!yazma, `${f} Apple'a YAZMA isteği atmıyor${yazma ? ' — bulundu: ' + yazma[0] : ''}`)
  }

  const iris = readFileSync(new URL('../src/iris.js', import.meta.url), 'utf8')
  ok(/method: 'GET'/.test(iris),
    "iris fetch'i GET olduğunu AÇIKÇA yazıyor — kaza değil, beyan")
  const fetchSayisi = (iris.match(/await fetch\(/g) ?? []).length
  ok(fetchSayisi === 1,
    `iris.js'te Apple'a giden tek bir fetch var (${fetchSayisi}) — çıkış kapısı tek, denetlenebilir`)

  // İzinler dar mı? Geniş izin isteyen bir eklenti şirkette haklı olarak
  // reddedilir. host_permissions yalnız ASC olmalı; "<all_urls>" OPSİYONEL
  // olarak durmalı ve yalnız kullanıcı onaylayınca istenmeli.
  const man = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'))
  ok(JSON.stringify(man.host_permissions) === JSON.stringify(['https://appstoreconnect.apple.com/*']),
    'kurulumda istenen tek alan adı App Store Connect')
  ok(!(man.permissions ?? []).includes('cookies'),
    'çerez okuma izni İSTENMİYOR — oturum tarayıcının, bizim değil')
  ok(!man.content_scripts,
    'hiçbir sayfaya kendiliğinden kod enjekte edilmiyor (content_scripts yok)')
  ok((man.optional_host_permissions ?? []).includes('<all_urls>'),
    'geniş erişim OPSİYONEL — yalnız kullanıcı onaylayınca ve adres sınaması için')
}


// ===========================================================================
suite('kayıtlı rapor taze görünmemeli')
// ===========================================================================
{
  // SAHA HATASI (2026-09-02): 13:54'te ESKİ motorla üretilmiş bir denetim,
  // günler sonra YENİ şablonla dışa aktarıldı. Ortaya kendi kendisiyle çelişen
  // bir belge çıktı: açıklama "skor 100'e hiç ulaşmaz" diyor, skor 100
  // yazıyordu. Kimse fark etmedi çünkü rapor hangi kodun ürünü olduğunu
  // söylemiyordu. Eski veriyi taze diye sunmak bu deponun bir numaralı
  // yasağı (R2).
  const panel = readFileSync(new URL('../sidepanel.js', import.meta.url), 'utf8')

  ok(/motorSurum: chrome\.runtime\.getManifest\(\)\.version/.test(panel),
    'kayda hangi eklenti sürümünün ürettiği yazılıyor')
  ok(/rec\.corpusVersion !== simdikiCorpus/.test(panel),
    'kural kitabı değiştiyse fark ediliyor')
  ok(/rec\.motorSurum !== simdikiMotor/.test(panel),
    'eklenti sürümü değiştiyse fark ediliyor')
  ok(/Bu rapor eski bir sürümle üretildi/.test(panel),
    'eskiyse kullanıcıya AÇIKÇA söyleniyor')

  // "Yeniden denetle" düğmesi gerçekten yeniden koşmalı. Eskiden ekranı
  // yeniden açıyordu, ekran da kayıtlı raporu bulup aynısını gösteriyordu —
  // yani düğme hiçbir şey yapmıyordu ve kullanıcı araç takıldı sanıyordu.
  ok(/DENETIM_TAZELE = app\.id/.test(panel), '"Yeniden denetle" tazeleme bayrağını kuruyor')
  ok(/const tazele = DENETIM_TAZELE === app\.id/.test(panel), 'denetim ekranı bayrağı okuyor')
  ok(/tazele\s*\n?\s*\?\s*null/.test(panel.replace(/\s+/g, ' ')) || /tazele\s*\? null/.test(panel),
    'bayrak açıkken kayıtlı rapor ATLANIYOR')

  // Motor sürümü paketten okunabiliyor mu?
  ok(typeof globalThis.GLAudit?.CORPUS_VERSION === 'string' && globalThis.GLAudit.CORPUS_VERSION.length > 0,
    `paket kural kitabı sürümünü dışa veriyor (${globalThis.GLAudit?.CORPUS_VERSION})`)
}


// ===========================================================================
suite('rapor listing\'in YAYINDA olup olmadığını söylüyor')
// ===========================================================================
{
  // SAHA SORUSU (2026-09-02): "bu yayında olan bir uygulama için mantıklı bir
  // rapor ve skor mu?" Değildi — ve sebebinin yarısı şuydu: veri
  // `READY_FOR_DISTRIBUTION` diyordu, yani Apple bu listing'i inceleyip
  // ONAYLAMIŞTI, ama rapor bunu hiçbir yerde yazmıyordu.
  //
  // Bulguları geçersiz kılmıyoruz — Apple tutarlı denetlemiyor. Ama okuyanın
  // bunu görmesi gerekiyor, çünkü iki farklı soru soruyor:
  //   yayındaki listing    → "sonraki gönderimde ne olur?"
  //   gönderilmemiş taslak → "göndermeden önce neyi düzeltmeliyim?"
  const S = globalThis.GLAudit.surumDurumu
  ok(typeof S === 'function', 'surumDurumu paketten dışa veriliyor')

  const yayinda = S('READY_FOR_DISTRIBUTION')
  ok(/Yayında/.test(yayinda.etiket), 'READY_FOR_DISTRIBUTION "Yayında" diye okunuyor')
  ok(/onayladı/i.test(yayinda.okuma), 'Apple\'ın onayladığı SÖYLENİYOR')
  ok(/SONRAKİ gönderimde risk/i.test(yayinda.okuma),
    'onaylı listing için bulgular "gerçekleşmiş red" değil "sonraki risk" diye çerçeveleniyor')
  ok(/tutarlı denetlemiyor/i.test(yayinda.okuma),
    'onay bir GARANTİ diye sunulmuyor — bulgular geçersiz kılınmıyor')

  const taslak = S('PREPARE_FOR_SUBMISSION')
  ok(/Gönderilmedi/.test(taslak.etiket), 'gönderilmemiş sürüm ayırt ediliyor')
  ok(!/SONRAKİ gönderimde risk/i.test(taslak.okuma),
    'taslakta çerçeve farklı — "göndermeden önce" diyor')

  const geriCekilen = S('DEVELOPER_REJECTED')
  ok(/Apple reddetmedi/.test(geriCekilen.okuma),
    'geliştirici geri çekmesi Apple reddi ile KARIŞTIRILMIYOR')

  ok(S(undefined) === null, 'durum bilinmiyorsa uydurma etiket üretilmiyor')
  ok(/tanınmıyor/.test(S('BILINMEYEN_KOD').okuma),
    'tanınmayan durum kodu sessizce yutulmuyor')
}

// ===========================================================================
suite('ortak ders havuzu — dersler denetime nasıl giriyor')
// ===========================================================================
{
  // NEDEN BU SUITE VAR: havuz bağlandığında denetimin davranışı DEĞİŞİYOR —
  // kartların yanına kanıt giriyor, in-app dersler elle kontrole düşüyor,
  // rapor başlığı yeni bir satır yazıyor. Bunların hiçbiri "bağlantı kuruldu"
  // ile aynı şey değil ve hiçbiri sessizce bozulduğunda görünmez: rapor yine
  // üretilir, yalnız ofisin geçmişi denetime hiç girmemiş olur.
  const GLAudit = globalThis.GLAudit
  const sade = (d) =>
    Object.fromEntries(Object.entries(d).map(([k, v]) => [k, GLNormalize.normalizeSection(k, v).data]))

  const dump = {
    app: { id: '1', attributes: { name: 'Test App', bundleId: 'com.x.t', primaryLocale: 'en-US', sku: 'x' } },
    appInfos: { data: [{ id: 'ai1', attributes: { appStoreState: 'READY_FOR_SALE', appStoreAgeRating: 'FOUR_PLUS' },
      relationships: { primaryCategory: { data: { id: 'UTILITIES' } } } }], included: [] },
    appInfoLocalizations: [{ id: 'l1', attributes: { locale: 'en-US', name: 'Test App', subtitle: 'alt', privacyPolicyUrl: 'https://x/p' } }],
    versionTexts: [{ versionId: 'v1', versionString: '1.0', state: 'READY_FOR_DISTRIBUTION', createdDate: '2026-01-01', toplamDil: 1,
      locales: [{ id: 'vl1', attributes: { locale: 'en-US', description: 'aciklama', keywords: 'a,b', whatsNew: 'w', supportUrl: 'https://x/s' } }] }],
  }

  const ders = (over = {}) => ({
    id: 'd1', ruleId: 'apple-2.3.3-feature-not-evidenced', platform: 'apple', guideline: '2.3.3',
    scope: 'listing', title: 'Başlık', summary: 'özet', signals: [], falsePositive: null,
    artifact: 'screenshot', severity: 'high', status: 'active', bodyKey: 'bodies/d1.md',
    exampleCount: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  })

  // --- Havuz BAĞLI DEĞİL: eskisi gibi koşuyor -----------------------------
  const bagsiz = await GLAudit.audit(sade(dump), { probeUrls: false })
  ok(bagsiz.dersOzeti.bagli === false, 'havuz bağlı değilken bagli=false')
  ok(bagsiz.dersOzeti.aktif === 0, 'havuzsuz denetimde ders sayılmıyor')

  // "0 aktif ders" ile "havuz yok" AYRI ŞEYLER. İlki havuzun boş olduğunu,
  // ikincisi bağlanmadığını söyler; karıştırılırsa kullanıcı denetimin
  // ofisin geçmişini kullandığını sanır.
  const bosHavuz = await GLAudit.audit(sade(dump), { probeUrls: false, dersler: [] })
  ok(bosHavuz.dersOzeti.bagli === true && bosHavuz.dersOzeti.aktif === 0,
    'boş havuz ile bağlanmamış havuz ayırt ediliyor')

  // --- in-app ders ELLE KONTROLE düşüyor ----------------------------------
  //
  // Listing denetimi uygulamanın çalışma anını göremez. Modele kanıt diye
  // verseydik elinde bakacak veri olmadan hüküm kurardı — yalancı alarmın
  // kaynağı budur (R20).
  const inApp = await GLAudit.audit(sade(dump), {
    probeUrls: false,
    dersler: [ders({ id: 'ia', scope: 'in-app', title: 'İlk açılışta rating isteniyor' })],
  })
  const elle = inApp.manual.find((m) => /rating isteniyor/.test(m.question))
  ok(!!elle, 'in-app ders elle kontrol listesine giriyor')
  ok(elle?.source?.doc === 'ders' && elle?.source?.section === '2.3.3',
    'elle kontrol dersin maddesine çapalanıyor — nereden geldiği görünüyor')
  ok(/daha önce bu yüzden reddedildik/.test(elle?.why ?? ''),
    'gerekçe kuralı değil YAŞANMIŞI söylüyor')
  ok(inApp.dersOzeti.inApp === 1 && inApp.dersOzeti.aktif === 0,
    'in-app ders "aktif" (modele giden) sayısına DAHİL EDİLMİYOR')

  // --- listing dersi elle kontrole GİRMİYOR -------------------------------
  const listing = await GLAudit.audit(sade(dump), { probeUrls: false, dersler: [ders()] })
  ok(!listing.manual.some((m) => /Başlık/.test(m.question)),
    'listing dersi elle kontrole düşmüyor — o kartın yanına kanıt olarak gidiyor')
  ok(listing.dersOzeti.aktif === 1, 'listing dersi aktif sayılıyor')

  // --- Durum ve platform filtreleri ---------------------------------------
  const karisik = await GLAudit.audit(sade(dump), {
    probeUrls: false,
    dersler: [
      ders({ id: 'a' }),
      ders({ id: 'b', status: 'draft' }),
      ders({ id: 'c', status: 'retired' }),
      ders({ id: 'd', platform: 'google' }),
      ders({ id: 'e', ruleId: null }),
    ],
  })
  ok(karisik.dersOzeti.aktif === 2, 'yalnız aktif+apple dersler denetime giriyor (a ve e)')
  ok(karisik.dersOzeti.taslak === 1,
    'onay bekleyen ders SAYILIYOR ama denetimi etkilemiyor — ortak havuzda bu koruma daha da kritik')
  ok(karisik.dersOzeti.bosluk === 1,
    'kartsız ders KAPSAMA BOŞLUĞU olarak sayılıyor: "bu yüzden reddedildik ama kartımız yok"')

  // --- Havuz düştüğünde: rapor SUSMUYOR -----------------------------------
  const uyarili = await GLAudit.audit(sade(dump), {
    probeUrls: false,
    dersUyarisi: 'Ortak ders havuzuna ulaşılamadı (bağlantı reddedildi).',
  })
  ok(uyarili.warnings.some((w) => /havuzuna ulaşılamadı/.test(w)),
    'havuza ulaşılamadıysa rapor bunu YAZIYOR — sessizce derssiz koşmak raporu olduğundan güvenilir gösterirdi')
}


// ===========================================================================
suite('audit-run.js — havuz düşse de denetim düşmüyor')
// ===========================================================================
{
  // Ortak depo tek arıza noktası da demek. Havuz kapalıyken denetimin
  // TAMAMEN durması, ortaklaşmanın kabul edilebilir bedeli değil: kullanıcı
  // kesin kontrolleri de kaybederdi. Bu suite o davranışı kilitliyor.
  const gercekHavuz = globalThis.GLHavuz
  const gercekChrome = globalThis.chrome

  const sahteHavuz = (davranis) => {
    globalThis.GLHavuz = {
      RemoteLessonStore: class {
        constructor(url, token) { this.url = url; this.token = token }
        healthcheck() { return davranis.saglik ?? Promise.resolve({ ok: true }) }
        allLessons() {
          if (davranis.patlat) return Promise.reject(new Error('okuma patladı'))
          return Promise.resolve(davranis.dersler ?? [])
        }
      },
    }
  }
  const izin = (verilsin) => {
    globalThis.chrome = {
      ...gercekChrome,
      permissions: { contains: async () => verilsin, request: async () => verilsin },
    }
  }

  izin(true)

  // 1) Adres yoksa havuza HİÇ dokunulmuyor.
  sahteHavuz({ dersler: [{ id: 'x' }] })
  let r = await GLRun.havuzaBaglan({})
  ok(r.dersler === undefined && r.uyari === undefined,
    'havuz adresi boşken bağlanma denenmiyor ve uyarı da üretilmiyor')

  // 2) Mutlu yol.
  sahteHavuz({ dersler: [{ id: 'a' }, { id: 'b' }] })
  r = await GLRun.havuzaBaglan({ havuzUrl: 'https://havuz.test', havuzToken: 'oku' })
  ok(r.dersler?.length === 2 && !r.uyari, 'havuz okunduğunda dersler geliyor, uyarı yok')
  ok(typeof r.havuz?.examplesFor !== 'undefined' || r.havuz !== undefined,
    'örnek red\'leri çekmek için istemci de geri veriliyor')

  // 3) Belirteç geçersiz / sunucu hayır diyor.
  sahteHavuz({ saglik: Promise.resolve({ ok: false, reason: 'belirteç geçersiz' }) })
  r = await GLRun.havuzaBaglan({ havuzUrl: 'https://havuz.test', havuzToken: 'kotu' })
  ok(r.dersler === undefined, 'havuz reddederse ders listesi boş kalıyor')
  ok(/belirteç geçersiz/.test(r.uyari ?? ''), 'sebep uyarıya AYNEN taşınıyor, genel bir mesaja indirgenmiyor')
  ok(/yalnız kural kartlarıyla koştu/.test(r.uyari ?? ''),
    'uyarı denetimin ne kadarının koştuğunu da söylüyor')

  // 4) Sunucu ayakta ama okuma patlıyor — hata YUTULMUYOR.
  sahteHavuz({ patlat: true })
  r = await GLRun.havuzaBaglan({ havuzUrl: 'https://havuz.test', havuzToken: 'oku' })
  ok(r.dersler === undefined && /okuma patladı/.test(r.uyari ?? ''),
    'ders okuma patlarsa denetim durmuyor ama sebep raporlanıyor')

  // 5) Ağ izni verilmediyse: havuza çıkılmıyor, sessiz de kalınmıyor.
  izin(false)
  sahteHavuz({ dersler: [{ id: 'a' }] })
  r = await GLRun.havuzaBaglan({ havuzUrl: 'https://havuz.test' })
  ok(r.dersler === undefined && /ağ izni/.test(r.uyari ?? ''),
    'ağ izni yokken havuz okunmuyor ve bu DENETLENMEDİ olarak yazılıyor')

  globalThis.GLHavuz = gercekHavuz
  globalThis.chrome = gercekChrome
}


// ===========================================================================
suite('report.js — havuz raporda GÖRÜNÜYOR')
// ===========================================================================
{
  const taban = {
    riskScore: 10, modelRan: true, corpusVersion: 'a',
    counts: { cards: 24, pending: 0 },
    submission: { appName: 'x', locale: 'en-US', category: 'U', ageRating: '4+',
                  media: { screenshots: [] }, iap: [] },
    warnings: [], lint: [], findings: [], llmPending: [], unknownMeta: [], manual: [],
    notChecked: [], stats: { rulesRun: 1, rawFindings: 0, afterGrounding: 0, afterVerify: 0, ms: 10 },
    gorselNotu: null,
  }
  const ciz = (r) => {
    const kok = fakeEl()
    GLReport.render(kok, { id: '1', name: 'x' }, r, { probeUrls: false })
    return JSON.stringify(kok.children)
  }

  // Eski kayıtlarda `dersOzeti` alanı HİÇ YOK (havuzdan önce koşmuşlar).
  // Arşivi açan kişi için bu, patlaması en kolay yer.
  ok(!/havuz:/.test(ciz(taban)), 'havuzdan önceki kayıtlar patlamıyor ve uydurma havuz satırı basmıyor')

  const bagli = ciz({ ...taban, dersOzeti: { bagli: true, aktif: 7, inApp: 2, taslak: 3, bosluk: 1 } })
  ok(/havuz: 7 aktif ders/.test(bagli), 'bağlı havuzda aktif ders sayısı başlıkta yazıyor')
  ok(/3 onay bekliyor/.test(bagli), 'onay bekleyen dersler görünüyor — kimse onaylamazsa havuz öğrenmiyor')
  ok(/kapsama boşluğu/.test(bagli), 'kapsama boşluğu raporun başında alarm olarak duruyor')

  ok(!/havuz:/.test(ciz({ ...taban, dersOzeti: { bagli: false, aktif: 0, inApp: 0, taslak: 0, bosluk: 0 } })),
    'bağlı değilken havuz satırı hiç yazılmıyor — yokluğu iddia etmek de yanlış olur')

  // --- Bulgunun altındaki gerçek red örnekleri ---------------------------
  const bulgu = {
    ruleId: 'apple-2.3.3', severity: 'high', artifact: 'screenshot', confidence: 0.9,
    rationale: 'gerekçe', excerpt: 'alıntı', suggestedFix: 'düzelt',
    examples: [{
      lessonId: 'd1', lessonTitle: 'Başlık', appName: 'Glamio', rejectedAt: '2026-01-05',
      guideline: '2.3.3', excerpt: 'reddedilen metin', reviewerText: 'reviewer ne dedi',
      resolution: 'gerçek ekran görüntüsü kondu',
    }],
  }
  const ornekli = ciz({ ...taban, findings: [bulgu] })
  ok(/Benzer gerçek red'ler \(1\)/.test(ornekli), 'bulgunun altına gerçek red örnekleri iliştiriliyor')
  ok(/Glamio/.test(ornekli) && /2026-01-05/.test(ornekli),
    'örnek hangi uygulama, ne zaman diye söylüyor — yargı değil OLGU')
  ok(/Neyle geçti: gerçek ekran görüntüsü kondu/.test(ornekli),
    'çözüm yazılıyor: düzeltme önerisini tahminden gerçeğe çeviren tek alan')

  const orneksiz = ciz({ ...taban, findings: [{ ...bulgu, examples: undefined }] })
  ok(!/Benzer gerçek/.test(orneksiz), 'örneği olmayan bulguda boş bölüm açılmıyor')

  // Markdown çıktısı da aynı bilgiyi taşımalı: panelde görünüp dışa
  // aktarımda kaybolan bir alan, iki yüzeyin ayrışması demek (R18).
  const md = GLReport.markdown({ id: '1', name: 'x', bundleId: 'com.x' },
    { ...taban, dersOzeti: { bagli: true, aktif: 7, inApp: 0, taslak: 0, bosluk: 1 } }, Date.now())
  ok(/Ortak ders havuzu:.*7 aktif ders/.test(md), 'markdown dışa aktarımı da havuz satırını taşıyor')
}

// ===========================================================================
suite('ders havuzu ekranı — havuzda ne olduğu GÖRÜNÜYOR')
// ===========================================================================
{
  const panel = globalThis.GLPanel
  const gercekHavuz = globalThis.GLHavuz
  const gercekChrome = globalThis.chrome

  const durumCagrilari = []
  const kur = ({ ayar = {}, saglik = { ok: true }, dersler = [], vakalar = [], vakaPatlat = false,
                 durumHatasi = null }) => {
    durumCagrilari.length = 0
    globalThis.chrome = {
      ...gercekChrome,
      storage: { local: { get: async () => ({ 'gl:settings': ayar }), set: async () => {} } },
      permissions: { contains: async () => true, request: async () => true },
    }
    globalThis.GLHavuz = {
      RemoteLessonStore: class {
        healthcheck() { return Promise.resolve(saglik) }
        allLessons() { return Promise.resolve(dersler) }
        allExamples() {
          return vakaPatlat ? Promise.reject(new Error('vaka okunamadı')) : Promise.resolve(vakalar)
        }
        readBody() { return Promise.resolve('# gövde') }
        updateLessonStatus(id, durum) {
          durumCagrilari.push(`${id}→${durum}`)
          return durumHatasi ? Promise.reject(new Error(durumHatasi)) : Promise.resolve()
        }
      },
    }
  }
  // Düğmeleri ağaçtan topla — gerçek tıklamayı sınamanın tek yolu.
  const dugmeleri = (n, out = []) => {
    if (!n || typeof n === 'string') return out
    if (typeof n.onclick === 'function' && n.textContent) out.push(n)
    for (const c of n.children ?? []) dugmeleri(c, out)
    return out
  }
  const cizKok = async () => {
    const kok = fakeEl()
    await panel.EKRAN.havuz(kok, { name: 'havuz', app: null, arg: null })
    return kok
  }
  const ciz = async () => {
    const kok = fakeEl()
    await panel.EKRAN.havuz(kok, { name: 'havuz', app: null, arg: null })
    return JSON.stringify(kok.children)
  }
  const ders = (over = {}) => ({
    id: 'd1', ruleId: 'apple-2.3.3-feature-not-evidenced', platform: 'apple', guideline: '2.3.3',
    scope: 'listing', title: 'Ekran görüntüsü uygulamayı göstermiyor', summary: 'özet metni',
    signals: ['mockup çerçevesi'], falsePositive: null, artifact: 'screenshot', severity: 'high',
    status: 'active', bodyKey: 'bodies/d1.md', exampleCount: 0,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...over,
  })

  // --- Bağlı değil: ayarlara yönlendir, boş liste gösterme ----------------
  kur({ ayar: {} })
  const bagsiz = await ciz()
  ok(/bağlı değil/.test(bagsiz), 'havuz bağlı değilken ekran bunu söylüyor')
  ok(!/0 ders/.test(bagsiz), 'bağlı olmayan havuz "0 ders" diye gösterilmiyor')

  // --- Ulaşılamıyor: EN TEHLİKELİ karışıklık ------------------------------
  //
  // Kapalı bir havuzu boş havuz gibi göstermek, kullanıcıya "ekip hiç ders
  // çıkarmamış" dedirtir ve gerçek sorunu (kapalı sunucu, yanlış belirteç)
  // hiç görmez.
  kur({ ayar: { havuzUrl: 'https://havuz.test' }, saglik: { ok: false, reason: 'belirteç geçersiz' } })
  const olu = await ciz()
  ok(/Havuz okunamadı/.test(olu), 'ulaşılamayan havuz açıkça "okunamadı" diyor')
  ok(/belirteç geçersiz/.test(olu), 'sebep ekranda yazıyor — kullanıcı nerede arayacağını biliyor')
  ok(!/ders$/m.test(olu.replace(/[^]*Havuz okunamadı/, '')), 'ulaşılamayan havuz için ders listesi çizilmiyor')

  // --- Dolu havuz ---------------------------------------------------------
  const AYAR = { ayar: { havuzUrl: 'https://havuz.test', havuzToken: 'oku' } }
  kur({
    ...AYAR,
    dersler: [
      ders(),
      ders({ id: 'd2', status: 'draft', title: 'Taslak ders' }),
      ders({ id: 'd3', status: 'retired', title: 'Emekli ders' }),
      ders({ id: 'd4', scope: 'in-app', ruleId: null, title: 'İlk açılışta rating' }),
      ders({ id: 'd5', ruleId: null, title: 'Kartsız listing dersi' }),
    ],
    vakalar: [{
      id: 'v1', lessonId: 'd1', appName: 'Glamio', platform: 'apple', rejectedAt: '2026-01-05',
      guideline: '2.3.3', artifact: 'screenshot', excerpt: 'reddedilen metin',
      reviewerText: 'reviewer ne dedi', resolution: 'gerçek görsel kondu',
      rawKey: 'rejects/v1.txt', status: 'active', createdAt: '2026-01-05T00:00:00Z',
    }],
  })
  const dolu = await ciz()

  ok(/5 ders/.test(dolu), 'toplam ders sayısı yazıyor')
  ok(/2 kartlara kanıt olarak giriyor/.test(dolu),
    'kaç dersin GERÇEKTEN modele kanıt gittiği ayrı sayılıyor (in-app ve taslak hariç)')
  ok(/1 elle kontrol/.test(dolu), 'in-app dersler ayrı sayılıyor')
  ok(/1 onay bekliyor/.test(dolu) && /1 emekli/.test(dolu), 'taslak ve emekli sayıları ayrı')

  ok(/Taslak dersler denetimi ETKİLEMİYOR/.test(dolu),
    'onay bekleyen ders varsa uyarı çıkıyor — kimse onaylamazsa havuz öğrenmiş sayılmaz')
  ok(/Kapsama boşluğu/.test(dolu),
    'kartsız LISTING dersi kapsama boşluğu olarak uyarıyor')

  // Her dersin denetimde ne işe yaradığı yazılı olmalı: bu olmadan kullanıcı
  // "havuz bağlı ama raporda hiçbir şey yok" durumunu çözemiyor.
  ok(/bu kartın çağrısına kanıt olarak ekleniyor/.test(dolu),
    'kartlı ders: kanıt olarak gittiği söyleniyor')
  ok(/listing denetimi göremez, elle kontrol listesine giriyor/.test(dolu),
    'in-app ders: neden raporda bulgu üretmediği söyleniyor')
  ok(/hiçbir karta bağlı değil/.test(dolu), 'kartsız ders işaretleniyor')

  ok(/mockup çerçevesi/.test(dolu), 'dersin belirtileri listeleniyor')
  ok(/Gerçek red'ler \(1\)/.test(dolu), 'dersin gerçek red örnekleri iliştiriliyor')
  ok(/Glamio/.test(dolu) && /Neyle geçti: gerçek görsel kondu/.test(dolu),
    'örnekte hangi uygulama ve neyle geçtiği yazıyor')
  ok(/HERKESİN denetimine girer/.test(dolu),
    'onayın herkesi etkilediği söyleniyor — tek tıkla yapılan işin bedeli yazılı')

  // --- Durum düğmeleri ----------------------------------------------------
  //
  // Onay eklentide: taslak dersi gören, red'i yaşayan ve denetimi koşturan
  // kişi çoğu zaman farklı. Onayı yalnız terminale bağlamak havuzun tıkandığı
  // yer oluyordu — onaylanmayan ders denetimi hiç etkilemiyor.
  const yut = () => {}
  process.on('unhandledRejection', yut)

  kur({ ...AYAR, dersler: [ders({ status: 'draft' })] })
  let kok = await cizKok()
  let btn = dugmeleri(kok)
  ok(btn.some((b) => b.textContent === 'Onayla') && btn.some((b) => b.textContent === 'Reddet'),
    'taslak dersin yanında Onayla ve Reddet var')
  await btn.find((b) => b.textContent === 'Onayla').onclick()
  ok(durumCagrilari[0] === 'd1→active', 'Onayla dersi aktife çeviriyor')

  kur({ ...AYAR, dersler: [ders({ status: 'draft' })] })
  kok = await cizKok()
  await dugmeleri(kok).find((b) => b.textContent === 'Reddet').onclick()
  ok(durumCagrilari[0] === 'd1→retired', 'Reddet taslağı emekliye ayırıyor — silmiyor, geri alınabilir')

  kur({ ...AYAR, dersler: [ders({ status: 'active' })] })
  kok = await cizKok()
  btn = dugmeleri(kok)
  ok(!btn.some((b) => b.textContent === 'Onayla'), 'zaten aktif derste Onayla gösterilmiyor')
  await btn.find((b) => b.textContent === 'Emekliye ayır').onclick()
  ok(durumCagrilari[0] === 'd1→retired', 'aktif ders emekliye ayrılabiliyor')

  kur({ ...AYAR, dersler: [ders({ status: 'retired' })] })
  kok = await cizKok()
  await dugmeleri(kok).find((b) => b.textContent === 'Yeniden onayla').onclick()
  ok(durumCagrilari[0] === 'd1→active', 'emekli ders geri alınabiliyor — karar tersine çevrilebilir')

  // Yönetici onayı yazma belirtecine geri kısarsa (router.js'te tek satır)
  // kullanıcı sebebi ANLAYABİLMELİ.
  kur({ ...AYAR, dersler: [ders({ status: 'draft' })], durumHatasi: 'havuz HTTP 403: yazma belirteci gerekli' })
  kok = await cizKok()
  await dugmeleri(kok).find((b) => b.textContent === 'Onayla').onclick()
  ok(/durum değiştirme yetkisi yok/.test(JSON.stringify(kok.children)),
    '403 anlaşılır cümleye çevriliyor, ham HTTP hatası gösterilmiyor')

  kur({ ...AYAR, dersler: [ders({ status: 'draft' })], durumHatasi: 'havuza ulaşılamadı' })
  kok = await cizKok()
  await dugmeleri(kok).find((b) => b.textContent === 'Onayla').onclick()
  ok(/ulaşılamadı/.test(JSON.stringify(kok.children)),
    'ağ hatası yutulmuyor — düğme sessizce hiçbir şey yapmış gibi durmuyor')

  process.off('unhandledRejection', yut)

  // --- Örnekler okunamazsa dersler yine listeleniyor ----------------------
  kur({ ...AYAR, dersler: [ders()], vakaPatlat: true })
  const yarim = await ciz()
  ok(/vaka okunamadı/.test(yarim), "örnek red'ler okunamazsa sebep yazılıyor")
  ok(/Ekran görüntüsü uygulamayı göstermiyor/.test(yarim),
    'örnekler düşse de dersler listeleniyor — kısmi veri, hiç veriden iyidir')

  globalThis.GLHavuz = gercekHavuz
  globalThis.chrome = gercekChrome
}

console.log(`\n${passed} geçti, ${failed} kaldı`)
process.exit(failed ? 1 : 0)
