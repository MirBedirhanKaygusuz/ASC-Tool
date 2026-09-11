/**
 * Yan panel — uygulamanın TAMAMI. Başka yüzey yok.
 *
 * Önce popup vardı, sonra panel geldi ama ağır işler tam sayfada kaldı.
 * Bu yarım hâl kendi hatasını üretti: panelde başlattığın çekim tam sayfada
 * görünmüyordu, çünkü ikisi ayrı sayfaydı ve durum birinden ötekine akmıyordu.
 * "Düzeltelim" demek yerine kaynağı kaldırdık — iki yüzey yerine tek yüzey.
 * Artık senkronlanacak bir şey yok (belkiPatlarız R18).
 *
 * GEZİNME. Panel dar, o yüzden sekme değil YIĞIN: liste → uygulama → denetim.
 * Geri düğmesi üst çubukta, yığın boşken gizli. Arşiv/yedek/ayarlar üst
 * sağdaki menüden. 340 pikselde sekme şeridi zaten okunmuyor.
 *
 * DEVRALINAN İKİ KURAL:
 *  1. Çekim düğmesi HİÇBİR KOŞULDA kilitlenmez (belkiPatlarız R14). Bir
 *     bayrağın tek çıkış yolu olması yanlış tasarım: bayrak takılırsa
 *     kullanıcının elinde hiçbir şey kalmıyor.
 *  2. Sürüm damgası görünür durur. "Yenileme tuttu mu" tahmine bırakılmaz.
 *
 * DİL KURALI (belkiPatlarız R16): veri kalitesi bildiren satırlar süssüz.
 */

const $ = (s) => document.querySelector(s)
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props)
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k?.nodeType ? k : String(k))
  return n
}
const tarih = (ms) => (ms ? new Date(ms).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—')
const damga = () => new Date().toISOString().slice(0, 10)
const kb = (n) => `${Math.round((n ?? 0) / 1024)} KB`

const ok = (d) => el('span', {
  className: 'chev',
  innerHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`,
})
const sagOk = () => ok('M9 18l6-6-6-6')

/**
 * İndirme.
 *
 * .txt dosyalarına UTF-8 BOM: aksi halde macOS TextEdit ve pek çok araç
 * Türkçe metni Latin-1 sanıp "gerekÃ§esi" diye açıyor. JSON'a BOM konmaz,
 * ayrıştırıcıları bozar.
 */
function indir(ad, icerik, tip = 'application/json') {
  const govde = tip === 'application/json' ? icerik : '﻿' + icerik
  const url = URL.createObjectURL(new Blob([govde], { type: `${tip};charset=utf-8` }))
  const a = el('a', { href: url, download: ad })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/**
 * MASKELİ indirme. Paylaşılan dosya çoğunlukla bu yoldan çıkıyor; demo hesap
 * şifresi ve kişisel veri burada gizleniyor. Maskesiz tam kopya yolu açık ve
 * BİLİNÇLİ: Menü → Yedek → "Tam yedek" (belkiPatlarız R4).
 */
function indirMaskeli(ad, veri) {
  const paket = { ...veri, _maskeleme: 'kişisel veri ve sırlar gizlendi — tam kopya: Menü → Yedek → Tam yedek' }
  indir(ad, JSON.stringify(globalThis.GLMask ? GLMask(paket) : paket, null, 2))
}

// --- Durum ------------------------------------------------------------------

let YIGIN = []          // [{ name, app, arg }] — sonuncusu görünen ekran
let LOG = []
let FAZ = 'hazır'
let HATA = false
let MESGUL = false
let lastBeat = 0
let canaryReport = null

const simdiki = () => YIGIN[YIGIN.length - 1] ?? { name: 'home' }

function git(name, app = null, arg = null) {
  YIGIN.push({ name, app, arg })
  ciz()
}
function geri() {
  if (YIGIN.length > 1) YIGIN.pop()
  ciz('back')
}
function kok(name = 'home') {
  YIGIN = [{ name, app: null, arg: null }]
  ciz('back')
}

// --- Kabuk ------------------------------------------------------------------

const BASLIK = {
  home: ['Greenlight', 'App Store Connect denetçisi'],
  menu: ['Menü', 'arşiv, yedek, ayarlar'],
  audits: ['Denetim geçmişi', 'kaydedilmiş raporlar'],
  kapsam: ['Kapsam', 'geçmiş redler vs kural kitabı'],
  rejects: ['Redler', 'Apple yazışma arşivi'],
  raw: ['Ham veri', "Apple'ın döndürdüğü JSON"],
  runs: ['Çekim günlüğü', 'ne zaman ne çekildi'],
  backup: ['Yedek', 'dışa/içe aktar, temizle'],
  settings: ['Ayarlar', 'model bağlantısı'],
  diag: ['Teşhis', 'uçları yokla'],
}

const EKRAN = {}   // name → (root, v) ; dosyanın altında dolduruluyor

function ciz(yon = '') {
  const v = simdiki()
  $('#back').hidden = YIGIN.length <= 1

  const [b, alt] = BASLIK[v.name] ?? [
    v.app?.name ?? 'Greenlight',
    v.name === 'audit' ? 'denetim raporu' : (v.app?.bundleId ?? ''),
  ]
  $('#title').textContent = b
  $('#subtitle').textContent = alt

  const kutu = $('#view')
  kutu.textContent = ''
  const govde = el('div', { className: `view${yon === 'back' ? ' back' : ''}` })
  kutu.append(govde)
  kutu.scrollTop = 0

  const ciz2 = EKRAN[v.name] ?? EKRAN.home
  ciz2(govde, v)
}

function mesgulYaz(m) {
  MESGUL = m
  $('#progress').className = `bar ${m ? 'busy' : 'idle'}`
  $('#dot').style.background = HATA ? 'var(--stop)' : m ? 'var(--hold)' : 'var(--go)'
  $('#dot').style.boxShadow = `0 0 0 3px ${HATA ? 'var(--stop-soft)' : m ? 'var(--hold-soft)' : 'var(--go-soft)'}`
}

function setFaz(text, hata = false) {
  FAZ = text
  HATA = hata
  const f = document.querySelector('#faz')
  if (f) { f.textContent = text; f.className = `small ${hata ? 'stop' : 'muted'}` }
  mesgulYaz(MESGUL)
}

function logEkle(text, cls = '') {
  LOG.push({ text, cls })
  if (LOG.length > 300) LOG.shift()
  const k = document.querySelector('#log')
  if (k) { k.append(el('div', { className: cls }, text)); k.scrollTop = k.scrollHeight }
}

function logSifirla() {
  LOG = []
  const k = document.querySelector('#log')
  if (k) k.textContent = ''
}

/** Çekimi başlat. İki yerden çağrılıyor; kural tek yerde dursun. */
function cekimBaslat(options = {}) {
  logSifirla()
  setFaz('çekim başlatılıyor…')
  mesgulYaz(true)
  chrome.runtime.sendMessage({ type: 'gl:collectStart', options })
}

// --- Ekran: anasayfa --------------------------------------------------------

const OZET = [['surumler', 'sürüm'], ['diller', 'dil'], ['urunler', 'ürün']]

/**
 * Red sayıları — ÜÇ AYRI BÜYÜKLÜK. Toplanmazlar.
 *
 *   appleReddi   Apple'ın reddettiği sürüm sayısı. Kaynağı sürüm durum
 *                geçmişi: ASC'deki Activity tablosunun ta kendisi.
 *   geriCekilen  Geliştiricinin kendi geri çektiği sürüm sayısı
 *                (DEVELOPER_REJECTED). Apple'ın reddi DEĞİL.
 *   redler       Resolution Center yazışmalarından çıkarılan red METNİ
 *                sayısı. Başka bir birim: tek bir red birden çok metin
 *                üretebilir, eski redlerin yazışması hiç olmayabilir.
 *
 * BU İKİSİ BİR DÖNEM TOPLANIYORDU (`appleReddi + redler`). Sahada Housify AI
 * için ASC 3 "Rejected" gösterirken panel 5 yazdı. Farklı birimleri toplamak
 * her zaman uydurma bir sayı üretir ve uydurma sayı, eksik sayıdan beterdir:
 * eksik olduğunu bilirsin, uydurmaya inanırsın.
 *
 * `undefined` = OKUNAMADI, sıfır DEĞİL. Durum geçmişi çekilemediyse ya da
 * kayıt eski bir eklenti sürümünden kaldıysa sayı bilinmiyor demektir; "0"
 * yazmak "hiç reddedilmemiş" diye okunur (belkiPatlarız R2).
 */
function redSayilari(app) {
  const s = app.sayilar ?? {}
  return {
    apple: s.appleReddi,
    bizim: s.geriCekilen,
    metin: s.redler ?? 0,
    // Durum geçmişi kısmen okunabildiyse sayılar "en az" demektir.
    eksik: (app.supheli ?? []).some((x) => String(x.section).startsWith('stateChanges')),
  }
}

/** Bilinmeyen sayı "0" değil "?" yazılır. */
const sayi = (n) => (n === undefined || n === null ? '?' : String(n))

/**
 * `app.supheli` üç farklı şeyi taşıyor; ayrı göster.
 *
 * SAHA HATASI (2026-08-21): panel "Şüpheli yanıtlar (5)" diyordu ve beşi de
 * şüpheli değildi — ikisi bilerek konmuş hacim sınırı, üçü başarı notuydu.
 * Biri harfiyen "3 üründen 3 tanesinin fiyatı okundu" idi; yani tam başarı,
 * uyarı listesinde. Yalancı alarm eksik alarmdan farklı bir yoldan aynı yere
 * varır: liste okunmaz olur ve içine düşen GERÇEK uyarı da görülmez.
 *
 * ESKİ KAYITLAR: `tur` alanı olmayan satırlar bu sürümden önce çekildi.
 * Onları metinden ayıklamıyoruz — 'supheli' sayıyoruz. Fazla uyarmak, eksik
 * uyarmaktan iyidir; yeniden çekince doğru etiketi alırlar.
 */
const KOVA = [
  ['supheli', 'Şüpheli yanıtlar', 'hold',
    'Beklenmedik yanıt. Bu bölümdeki veri yanlış ya da eksik olabilir.'],
  ['sinir', 'Bilerek sınırlandı', '',
    'Hacim tavanı devreye girdi — beklenen davranış. Ama bu bölümün sayıları ' +
    '"en az" demektir, "tam" değil.'],
  ['not', 'Çekim notları', '',
    'Tanı izi: hangi yol çalıştı, ne kadarı okundu. Sorun bildirmiyor.'],
]

function kovala(liste) {
  const out = { supheli: [], sinir: [], not: [] }
  for (const x of liste ?? []) out[x.tur && out[x.tur] ? x.tur : 'supheli'].push(x)
  return out
}

EKRAN.home = async (root) => {
  root.append(el('button', {
    className: 'btn primary lg full',
    textContent: MESGUL ? 'Yeniden başlat' : 'Her şeyi çek',
    onclick: () => cekimBaslat(),
  }))

  root.append(el('div', { className: 'row', style: 'margin:9px 0 4px' },
    el('span', { className: 'small muted grow', id: 'faz' }, FAZ)))

  const kayit = el('div', { className: 'log', id: 'log', style: 'max-height:128px' })
  for (const l of LOG) kayit.append(el('div', { className: l.cls }, l.text))
  root.append(kayit)
  kayit.scrollTop = kayit.scrollHeight

  let apps = []
  let denetimler = []
  try {
    ;[apps, denetimler] = await Promise.all([GLStore.getApps(), GLStore.getAudits()])
  } catch {
    /* depo henüz açılmamış olabilir */
  }

  if (!apps?.length) {
    root.append(el('div', { className: 'empty' },
      el('div', { className: 'icon' }, '↓'),
      el('h3', {}, 'Henüz veri yok'),
      el('p', {}, 'App Store Connect oturumu açıkken yukarıdaki düğmeye bas. ' +
        'API anahtarı, snippet ya da terminal gerekmiyor.')))
    return
  }

  // Uygulama başına en son denetim: listede skoru göstermek için.
  const sonDenetim = new Map()
  for (const d of denetimler) if (!sonDenetim.has(d.appId)) sonDenetim.set(d.appId, d)

  root.append(el('h2', {}, `Uygulamalar (${apps.length})`))
  const liste = el('div', { className: 'list' })
  for (const app of apps) {
    const s = app.sayilar ?? {}
    const red = redSayilari(app)
    const eksik = app.atlandi?.length ?? 0
    const ozet = OZET.filter(([k]) => s[k]).map(([k, ad]) => `${s[k]} ${ad}`).join(' · ')
    const d = sonDenetim.get(app.id)

    liste.append(el('button', { className: 'list-item', onclick: () => git('app', app) },
      el('div', { className: 'between' },
        el('div', { className: 'grow' },
          el('div', { className: 'title trunc' }, app.name),
          el('div', { className: 'meta trunc' }, ozet || app.bundleId || '—')),
        sagOk()),
      (red.apple || red.apple === undefined || eksik || d) &&
      el('div', { className: 'row', style: 'margin-top:7px' },
        d ? el('span', { className: `chip ${d.riskScore >= 70 ? 'stop' : d.riskScore >= 35 ? 'hold' : 'go'}` },
          `risk ${d.riskScore}`) : '',
        red.apple ? el('span', { className: 'chip stop' },
          `${red.eksik ? '≥' : ''}${red.apple} Apple reddi`) : '',
        red.apple === undefined ? el('span', { className: 'chip hold', title: 'Sürüm durum geçmişi okunamadı' },
          'red sayısı bilinmiyor') : '',
        // Veri kalitesi rozeti: düz dil, süs yok.
        eksik ? el('span', { className: 'chip hold' }, `${eksik} uç okunamadı`) : '')))
  }
  root.append(liste)
}

// --- Ekran: menü ------------------------------------------------------------

EKRAN.menu = async (root) => {
  let s = null
  try { s = await GLStore.stats() } catch { /* depo yok */ }

  const satir = (baslik, alt, hedef) =>
    el('button', { className: 'list-item', onclick: () => { YIGIN.pop(); git(hedef) } },
      el('div', { className: 'between' },
        el('div', { className: 'grow' },
          el('div', { className: 'title' }, baslik),
          el('div', { className: 'meta' }, alt)),
        sagOk()))

  root.append(el('div', { className: 'list' },
    satir('Denetim geçmişi', s ? `${s.denetimler} rapor · ${kb(s.denetimBytes)}` : 'kaydedilmiş raporlar', 'audits'),
    satir('Redler', s ? `${s.rejects} red (${s.yeniRejects} işlenmemiş)` : 'Apple yazışma arşivi', 'rejects'),
    satir('Kapsam', 'geçmiş redlerin kaçını kural kitabı biliyor', 'kapsam'),
    satir('Ham veri', s ? `${s.bolumler} bölüm · ${kb(s.bytes)}` : "Apple'ın JSON'u", 'raw'),
    satir('Çekim günlüğü', s?.sonCekim ? `son çekim ${tarih(s.sonCekim)}` : 'ne zaman ne çekildi', 'runs'),
    satir('Yedek', 'dışa/içe aktar, temizle', 'backup'),
    satir('Ayarlar', 'model bağlantısı', 'settings'),
    satir('Teşhis', 'uçları yokla — hiçbir şey toplamaz', 'diag')))

  if (s?.kota) {
    const oran = Math.round(s.kota.oran * 100)
    root.append(el('p', { className: 'tiny dim', style: 'margin-top:12px' },
      `Depo: ${kb(s.kota.kullanilan)} / ${kb(s.kota.tavan)} (%${oran})`))
  }
  root.append(el('p', { className: 'tiny dim', style: 'text-align:center;margin-top:14px' },
    `Greenlight v${chrome.runtime.getManifest().version}`))
}

// --- Ekran: tek uygulama ----------------------------------------------------

/**
 * Sayaç kutucukları: [anahtar, etiket, açıklama].
 *
 * AÇIKLAMA ZORUNLU. "17 dil" yazan bir kutucuk sahada yanlış okundu: kullanıcı
 * denetimin 17 dilde metin gördüğünü sandı, oysa o sayı KÜNYE dili
 * (ad/altyazı/kategori) sayısıydı ve yayındaki sürümün açıklama metni tek
 * dildeydi. Etiketi kısaltmak yerine ne saydığını yazıyoruz.
 */
const METRIK = [
  ['surumler', 'sürüm', 'App Store Connect\'te kayıtlı sürüm sayısı'],
  ['diller', 'dil', 'KÜNYE dili sayısı (ad, altyazı, kategori). Sürüm açıklama/anahtar kelime ' +
    'metninin dili AYRI olabilir — genelde daha azdır.'],
  ['urunler', 'ürün', 'Uygulama içi satın alma sayısı'],
  ['abonelikler', 'abonelik', 'Abonelik sayısı'],
  ['ekranGoruntusu', 'ekran gör.', 'Çekilen ekran görüntüsü sayısı (tüm cihaz sınıfları toplamı)'],
  ['gonderimler', 'gönderim', 'İnceleme gönderimi (reviewSubmissions) sayısı'],
]

EKRAN.app = async (root, v) => {
  const app = v.app
  const s = app.sayilar ?? {}
  const red = redSayilari(app)

  root.append(el('div', { className: 'row', style: 'margin-bottom:11px' },
    el('button', { className: 'btn primary grow', textContent: 'Denetle', onclick: () => git('audit', app) }),
    el('button', {
      className: 'btn', textContent: 'Yeniden çek',
      title: 'Yalnızca bu uygulamayı çeker — hesabın tamamını değil',
      onclick: () => { cekimBaslat({ apps: [app.id] }); kok('home') },
    })))

  // --- Red geçmişi: ÜÇ AYRI BÜYÜKLÜK, toplanmaz (bkz. redSayilari) --------
  root.append(el('div', { className: 'metrics', style: 'margin-bottom:8px' },
    el('div', {
      className: `metric${red.apple ? ' stop' : ''}`,
      title: "Apple'ın reddettiği sürüm sayısı — ASC'deki Activity tablosundaki \"Rejected\" satırları",
    }, el('b', {}, sayi(red.apple)), el('span', {}, 'Apple reddi')),
    el('div', {
      className: 'metric',
      title: 'Geliştiricinin kendi geri çektiği sürüm sayısı — "Developer Rejected"',
    }, el('b', {}, sayi(red.bizim)), el('span', {}, 'Geri çekildi')),
    el('div', {
      className: 'metric',
      title: 'Resolution Center yazışmalarından çıkarılan red metni sayısı. ' +
        'Red SAYISI değil: tek red birden çok metin üretebilir, eski redlerin yazışması olmayabilir.',
    }, el('b', {}, String(red.metin)), el('span', {}, 'Red metni'))))

  // Veri kalitesi satırları: düz dil, süs yok.
  if (red.apple === undefined) {
    root.append(el('div', { className: 'callout hold' },
      el('div', { className: 't' }, 'Red sayısı bilinmiyor'),
      el('p', { className: 'small' },
        'Sürüm durum geçmişi okunamadı ya da bu kayıt eski bir eklenti sürümünden kaldı. ' +
        'Bu "hiç reddedilmemiş" demek DEĞİL. "Yeniden çek" ile güncellenir.')))
  } else if (red.eksik) {
    root.append(el('div', { className: 'note warn' },
      'Sürüm durum geçmişinin bir kısmı okunamadı — red sayıları "en az" demektir, "tam" değil.'))
  }

  const kutular = METRIK.filter(([k]) => s[k])
  if (kutular.length) {
    root.append(el('div', { className: 'metrics' },
      ...kutular.map(([k, ad, ipucu]) => el('div', { className: 'metric', title: ipucu },
        el('b', {}, String(s[k])), el('span', {}, ad)))))
  }

  root.append(
    el('p', { className: 'tiny dim mono', style: 'margin:9px 0 0' },
      `${app.bundleId || '—'} · ${app.id} · ${app.primaryLocale || '—'}`),
    el('p', { className: 'tiny dim', style: 'margin:2px 0 0' }, `son çekim ${tarih(app.fetchedAt)}`))

  // --- Veri kalitesi: burada süs yok ---------------------------------------
  if (app.atlandi?.length) {
    root.append(el('div', { className: 'callout stop' },
      el('div', { className: 't' }, `${app.atlandi.length} uç okunamadı`),
      el('p', { className: 'small' },
        'Bu "temiz" demek değil, "bakılmadı" demek. Yukarıdaki sayılar eksik olabilir.')))
  }
  if (app.atlandi?.length) {
    root.append(ayrintiKutusu('Okunamayan uçlar', app.atlandi, 'stop',
      'Bu uçlar hiç okunamadı. İçlerindeki veri raporda YOK.'))
  }
  const kovalar = kovala(app.supheli)
  for (const [anahtar, ad, cls, aciklama] of KOVA) {
    if (kovalar[anahtar].length) root.append(ayrintiKutusu(ad, kovalar[anahtar], cls, aciklama))
  }

  // --- Bu uygulamanın denetim geçmişi ---------------------------------------
  const gecmis = await GLStore.getAudits(app.id)
  if (gecmis.length) {
    root.append(el('h2', {}, `Denetim geçmişi (${gecmis.length})`))
    root.append(denetimListesi(gecmis, { adGoster: false }))
  }

  root.append(el('h2', {}, 'Beyan'))
  root.append(beyanKarti(app))
}

/**
 * Üç durumlu beyan.
 *
 * "Bilmiyorum" BİRİNCİ SINIF seçenek ve "Hayır" ile aynı şey değildir:
 * bilinmeyen alana bakan kartlar denetimden elenir ve raporda "bilgi eksik"
 * diye görünür. Sessizce "hayır" saysaydık o kurallar hiç çalışmadan denetim
 * geniş görünürdü (belkiPatlarız R3).
 */
const META_FIELDS = () => globalThis.GLAudit?.META_FIELDS ?? []
const META_GROUPS = () => globalThis.GLAudit?.META_GROUPS ?? []

/** Bu alan bu uygulamada sorulmalı mı? */
function beyanGecerli(app, f) {
  // "Üçüncü taraf giriş" yalnızca giriş gerektiren uygulamada anlamlı.
  // Giriş yoksa 4.8 zaten uygulanmıyor; soruyu sormak gereksiz gürültü.
  if (f.key === 'hasThirdPartyLogin' && app.meta?.requiresLogin !== true) return false
  return true
}

function beyanSatiri(app, f, seciliDegisti) {
  const simdi = app.meta?.[f.key]
  const seg = el('div', { className: 'seg' })
  for (const [metin, deger] of [['Evet', true], ['Hayır', false], ['Bilmiyorum', null]]) {
    const secili = simdi === deger || (deger === null && simdi === undefined)
    const b = el('button', { type: 'button', textContent: metin })
    b.setAttribute('aria-pressed', String(secili))
    b.onclick = async () => {
      app.meta = await GLStore.setMeta(app.id, f.key, deger)
      for (const k of seg.children) k.setAttribute('aria-pressed', String(k === b))
      seciliDegisti(f.key)
    }
    seg.append(b)
  }

  const liste = (baslik, ogeler) => el('div', {},
    el('div', { className: 'tiny' }, baslik),
    el('ul', { className: 'tiny muted', style: 'margin:2px 0 6px 16px;padding:0' },
      ...ogeler.map((t) => el('li', {}, t))))

  return el('div', { className: 'decl' },
    el('div', { className: 'line' }, el('label', { title: f.tldr }, f.label), seg),
    el('details', { className: 'tiny' },
      el('summary', {}, 'ne demek?'),
      el('p', { className: 'tiny muted' }, f.what),
      liste('Evet sayılır', f.yes),
      liste('Hayır sayılır', f.no),
      f.note ? el('p', { className: 'tiny muted' }, f.note) : '',
      el('p', { className: 'tiny muted' }, 'Evet dersen: ' + f.effect),
      el('p', { className: 'tiny muted' }, f.source)))
}

function beyanKarti(app) {
  const kart = el('div', { className: 'card' },
    el('p', { className: 'small muted', style: 'margin-bottom:10px' },
      'App Store Connect bunları tutmuyor; denetim için biz soruyoruz. ' +
      'İşaretlenmeyen alana bakan kartlar denetime hiç girmez.'))

  for (const g of META_GROUPS()) {
    const alanlar = META_FIELDS().filter((f) => f.group === g.id && beyanGecerli(app, f))
    if (!alanlar.length) continue
    const bos = alanlar.filter((f) => app.meta?.[f.key] === undefined)

    const baslikSatiri = el('div', { className: 'line', style: 'margin-top:12px' },
      el('label', { title: g.hint, style: 'font-weight:600' }, g.title))
    if (bos.length) {
      // Alanların çoğu nadir (kripto, kumar, emülatör...). Tek tek "Hayır"
      // tıklatmak insanı alanları boş bırakmaya iter; boş alan ise kartı
      // denetimden çıkarır. Tek tık, ama yine de kullanıcının BEYANI.
      const toplu = el('button', {
        type: 'button', className: 'btn ghost',
        textContent: `${bos.length} boş → hepsi "Hayır"`,
        title: 'Bu gruptaki boş alanları Hayır olarak işaretler.',
      })
      toplu.onclick = async () => {
        for (const f of bos) app.meta = await GLStore.setMeta(app.id, f.key, false)
        ciz()
      }
      baslikSatiri.append(toplu)
    }
    kart.append(el('div', { className: 'decl' }, baslikSatiri))
    for (const f of alanlar) {
      kart.append(beyanSatiri(app, f, (key) => {
        // "Giriş gerekiyor" değişince alttaki "Üçüncü taraf giriş" satırı
        // belirip kaybolmalı; onun için ekranı tazeliyoruz. Diğerlerinde
        // tazelemiyoruz: kaydırma başa döner ve arka arkaya işaretlemek zorlaşır.
        if (key === 'requiresLogin') ciz()
      }))
    }
  }

  kart.append(el('p', { className: 'tiny muted', style: 'margin-top:10px' },
    '"Bilmiyorum" ile "Hayır" aynı şey değildir: bilinmeyen alana bakan kartlar ' +
    'denetime hiç girmez ve raporda "bilgi eksik" diye görünür.'))
  return kart
}

/** Açılır ayrıntı kutusu. Başlıkta ne olduğu, içinde tek tek satırlar. */
function ayrintiKutusu(ad, liste, cls, aciklama) {
  return el('details', {},
    el('summary', { className: cls }, `${ad} (${liste.length})`),
    el('p', { className: 'tiny muted', style: 'margin:5px 0 4px' }, aciklama),
    el('div', { className: 'log', style: 'max-height:170px' },
      liste.map((x) => `${x.section}: ${x.reason ?? x.error ?? ''} ${x.path ?? ''}`).join('\n')))
}

// --- Ekran: denetim ---------------------------------------------------------

/**
 * Denetim ekranı.
 *
 * v.arg bir kayıt id'siyse O kaydı gösterir (geçmişten geliniyor demektir).
 * Yoksa bu uygulamanın EN SON kaydını gösterir; hiç kayıt yoksa denetimi
 * çalıştırır.
 *
 * NEDEN OTOMATİK KOŞMUYOR: her açılışta koşsaydı model her seferinde para
 * yakardı ve kullanıcı raporuna bakmak için bile ödeme yapardı. Kayıt varken
 * "Yeniden denetle" AÇIK bir istektir.
 */
EKRAN.audit = async (root, v) => {
  const app = v.app
  // `DENETIM_TAZELE` açıksa kayıtlı raporu ATLA ve modeli yeniden çalıştır.
  //
  // Bu bayrak olmadan "Yeniden denetle" düğmesi HİÇBİR ŞEY YAPMIYORDU: ekranı
  // yeniden açıyor, ekran da kayıtlı raporu bulup aynısını gösteriyordu.
  // Kullanıcı düğmeye basıyor, aynı sayıları görüyor ve aracın takıldığını
  // sanıyor. Bayrak tek kullanımlık — sonraki açılışta yine kayıttan gelsin
  // ki model boşuna para yakmasın.
  const tazele = DENETIM_TAZELE === app.id
  DENETIM_TAZELE = null
  const kayit = tazele
    ? null
    : v.arg
      ? await GLStore.getAudit(v.arg)
      : (await GLStore.getAudits(app.id))[0]

  if (kayit) return raporCiz(root, app, kayit)

  // --- Ağ izni: SORMADAN ÖNCE NEDEN sorduğunu söyle ----------------------
  //
  // Denetim, gizlilik ve destek adreslerinin canlı olup olmadığına bakıyor;
  // bunun için Chrome'dan "tüm sitelere erişim" izni gerekiyor. O pencere
  // habersiz açıldığında haklı olarak ürkütücü — özellikle eklentiyi ilk kez
  // deneyen birine. Önce ne olduğunu anlatıyoruz, isteyen atlıyor.
  //
  // Atlamak DENETİMİ DURDURMUYOR: rapor "adres sınaması yapılmadı" diye
  // yazıyor. Ölü bir gizlilik adresi en sık red sebeplerinden biri, o yüzden
  // izin vermenin karşılığı somut — ama karar kullanıcının.
  if (!(await chrome.permissions.contains({ origins: ['<all_urls>'] }).catch(() => false))) {
    const karar = await agIzniSor(root, app)
    if (karar === 'iptal') return
  }

  const gunluk = el('div', { className: 'log', style: 'max-height:200px' }, 'denetim başlıyor…')
  root.append(el('div', { className: 'card' },
    el('div', { className: 'row', style: 'margin-bottom:8px' },
      el('span', { className: 'dot' }), el('span', { className: 'small' }, `${app.name} denetleniyor`)),
    gunluk))

  mesgulYaz(true)
  let cikti
  try {
    cikti = await GLRun.calistir(app, {
      onProgress: (t) => { gunluk.append(el('div', {}, t)); gunluk.scrollTop = gunluk.scrollHeight },
    })
  } catch (e) {
    mesgulYaz(false)
    root.textContent = ''
    root.append(el('div', { className: 'callout stop' },
      el('div', { className: 't' }, 'Denetim çalışmadı'),
      el('p', { className: 'small' }, e.message)))
    return
  }
  mesgulYaz(false)

  // --- KAYDET. Eskiden yalnızca bellekteydi: panel kapanınca rapor uçuyor,
  // aynı denetim yeniden koşuyor ve model yeniden para yakıyordu.
  const rec = {
    appId: app.id,
    appName: app.name,
    bundleId: app.bundleId ?? null,
    at: Date.now(),
    riskScore: cikti.sonuc.riskScore,
    modelRan: cikti.sonuc.modelRan,
    modelError: cikti.sonuc.modelError ?? null,
    corpusVersion: cikti.sonuc.corpusVersion,
    // Hangi eklenti sürümü üretti. Kayıtlı denetim aylar sonra yeni bir
    // şablonla dışa aktarılabiliyor; o zaman metin yeni, SAYILAR eski oluyor.
    // Bu alan olmadan fark edilemez.
    motorSurum: chrome.runtime.getManifest().version,
    bulguSayisi: cikti.sonuc.findings?.length ?? 0,
    lintSayisi: cikti.sonuc.lint?.length ?? 0,
    probeUrls: cikti.probeUrls,
    sonuc: cikti.sonuc,
  }
  try {
    rec.id = await GLStore.putAudit(rec)
  } catch (e) {
    // Kaydedememek raporu göstermeye engel değil ama SESSİZ kalmamalı:
    // kullanıcı "kaydedildi" sanıp paneli kapatırsa rapor gider.
    console.error('denetim kaydedilemedi', e)
    rec.kayitHatasi = e.message
  }

  if (simdiki().name !== 'audit' || simdiki().app?.id !== app.id) return
  root.textContent = ''
  raporCiz(root, app, rec)
}

/**
 * İzin açıklaması. Kullanıcı üç şey yapabilir: izin ver, izinsiz devam et,
 * vazgeç. "İzinsiz devam" gerçek bir seçenek — denetimin geri kalanı çalışıyor.
 */
function agIzniSor(root, app) {
  return new Promise((resolve) => {
    const kart = el('div', { className: 'card' },
      el('h3', {}, 'Adres canlılık sınaması'),
      el('p', { className: 'small muted' },
        'Denetim, gizlilik ve destek adreslerinin gerçekten açılıp açılmadığına ' +
        'bakabilir. Ölü bir gizlilik adresi en sık red sebeplerinden biri.'),
      el('p', { className: 'small muted' },
        'Bunun için Chrome "tüm sitelere erişim" izni soracak — eklenti bu izni ' +
        'yalnızca girdiğin adresleri açmak için kullanır, başka hiçbir sayfaya ' +
        'dokunmaz. İstemezsen denetim yine çalışır; rapor o kontrolün ' +
        'yapılmadığını açıkça yazar.'),
      el('div', { className: 'row', style: 'margin-top:12px' },
        el('button', {
          className: 'btn primary', textContent: 'İzin ver ve denetle',
          onclick: async () => { await GLRun.agIzni(); kart.remove(); resolve('izin') },
        }),
        el('button', {
          className: 'btn', textContent: 'İzinsiz denetle',
          onclick: () => { kart.remove(); resolve('izinsiz') },
        }),
        el('button', {
          className: 'btn ghost', textContent: 'Vazgeç',
          onclick: () => { kart.remove(); resolve('iptal'); geri() },
        })))
    root.append(kart)
  })
}

/** Bir sonraki açılışta kayıtlı raporu atlayıp yeniden koşacak uygulama id'si. */
let DENETIM_TAZELE = null

function raporCiz(root, app, rec) {
  const r = rec.sonuc

  /**
   * ESKİ KAYIT UYARISI.
   *
   * Kaydedilmiş bir denetim BUGÜNÜN şablonuyla çiziliyor ve dışa aktarılıyor.
   * Sahada tam bu oldu: eski motorla üretilmiş bir rapor yeni şablonla dışa
   * aktarıldı ve kendi kendisiyle çelişen bir belge çıktı — açıklama "skor
   * 100'e hiç ulaşmaz" diyor, skorun kendisi 100 yazıyordu.
   *
   * Kural kitabı ya da eklenti sürümü değiştiyse sayılar o günün kodundan
   * geliyor demektir. Bunu söylemeyen rapor, eski veriyi taze diye sunar (R2).
   */
  const simdikiCorpus = globalThis.GLAudit?.CORPUS_VERSION ?? null
  const simdikiMotor = chrome.runtime.getManifest().version
  const corpusEski = simdikiCorpus && rec.corpusVersion && rec.corpusVersion !== simdikiCorpus
  const motorEski = rec.motorSurum && rec.motorSurum !== simdikiMotor
  if (corpusEski || motorEski) {
    root.append(el('div', { className: 'callout hold' },
      el('div', { className: 't' }, 'Bu rapor eski bir sürümle üretildi'),
      el('p', { className: 'small' },
        'Aşağıdaki sayılar ve bulgular, denetimin koştuğu andaki kural kitabından ' +
        've koddan geliyor — bugünkünden farklı.'),
      el('div', { className: 'small mono dim', style: 'margin-top:5px' },
        [corpusEski ? `kural kitabı ${rec.corpusVersion} → bugün ${simdikiCorpus}` : '',
         motorEski ? `eklenti v${rec.motorSurum} → bugün v${simdikiMotor}` : '']
          .filter(Boolean).join('\n')),
      el('button', {
        className: 'btn sm', style: 'margin-top:9px',
        textContent: 'Şimdiki sürümle yeniden denetle',
        onclick: () => { DENETIM_TAZELE = app.id; YIGIN.pop(); git('audit', app) },
      })))
  }

  if (rec.kayitHatasi) {
    root.append(el('div', { className: 'callout stop' },
      el('div', { className: 't' }, 'Bu rapor KAYDEDİLEMEDİ'),
      el('p', { className: 'small' }, rec.kayitHatasi),
      el('p', { className: 'small' }, 'Paneli kapatırsan gider. Şimdi dışa aktar.')))
  }

  root.append(el('div', { className: 'row', style: 'margin-bottom:4px' },
    el('span', { className: 'small muted grow' }, `Denetim: ${tarih(rec.at)}`),
    el('button', {
      className: 'btn sm', textContent: 'Yeniden denetle',
      title: 'Modeli yeniden çalıştırır — ücretli',
      onclick: () => { DENETIM_TAZELE = app.id; YIGIN.pop(); git('audit', app) },
    })))

  root.append(disaAktarCubugu(app, rec))

  const alan = el('div')
  root.append(alan)
  GLReport.render(alan, app, r, { probeUrls: rec.probeUrls, dar: true, ayarlaraGit: () => git('settings') })
}

/**
 * Dışa aktarma.
 *
 * MASKELİ. Rapor `submission.review.demoAccount.pass` içinde inceleme demo
 * hesabının şifresini taşıyor; maskesiz gönderilseydi rapor paylaşan herkes
 * onu da paylaşırdı (belkiPatlarız R4).
 */
function disaAktarCubugu(app, rec) {
  const maskeli = () => (globalThis.GLMask ? GLMask(rec.sonuc) : rec.sonuc)
  // Dosya adına SAAT de giriyor.
  //
  // Eskiden yalnız tarih vardı: aynı gün iki kez denetleyince ikinci dosya
  // "rapor (1).json" diye iniyordu ve hangisinin hangi koşu olduğu
  // anlaşılmıyordu. Sahada tam bu oldu — kullanıcı eski bir kaydı yeni sanıp
  // gönderdi. Dosya adı, içindeki kaydın KİMLİĞİNİ taşımalı.
  const damgaTam = new Date(rec.at).toISOString().slice(0, 16).replace('T', '-').replace(':', '')
  const ad = `${String(app.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` +
    `-${damgaTam}`

  const metin = () => GLReport.markdown(app, maskeli(), { at: rec.at, probeUrls: rec.probeUrls })

  return el('div', { className: 'card tight' },
    el('div', { className: 'row' },
      el('button', { className: 'btn sm', textContent: 'Markdown indir',
        onclick: () => indir(`greenlight-denetim-${ad}.md`, metin(), 'text/markdown') }),
      el('button', { className: 'btn sm', textContent: 'JSON indir',
        onclick: () => indir(`greenlight-denetim-${ad}.json`,
          JSON.stringify({ ...rec, sonuc: maskeli() }, null, 2)) }),
      el('button', {
        className: 'btn sm ghost', textContent: 'Panoya kopyala',
        onclick: async (e) => {
          await navigator.clipboard.writeText(metin())
          e.target.textContent = 'kopyalandı'
          setTimeout(() => (e.target.textContent = 'Panoya kopyala'), 1600)
        },
      })),
    el('p', { className: 'tiny muted', style: 'margin:7px 0 0' },
      'Dışa aktarılan kopyada kişisel veri ve sırlar (demo hesap şifresi dahil) maskelenir.'))
}

// --- Ekran: denetim geçmişi -------------------------------------------------

function denetimListesi(kayitlar, { adGoster = true } = {}) {
  const liste = el('div', { className: 'list' })
  for (const d of kayitlar) {
    const renk = d.riskScore >= 70 ? 'stop' : d.riskScore >= 35 ? 'hold' : 'go'
    liste.append(el('button', {
      className: 'list-item',
      onclick: async () => {
        const app = (await GLStore.getApp(d.appId)) ?? { id: d.appId, name: d.appName }
        git('audit', app, d.id)
      },
    },
      el('div', { className: 'between' },
        el('div', { className: 'grow' },
          el('div', { className: 'title trunc' }, adGoster ? d.appName : tarih(d.at)),
          el('div', { className: 'meta trunc' },
            d.sonuc?.riskBreakdown
              ? `${d.sonuc.riskBreakdown.kesinIhlal} kesin ihlal · ${d.sonuc.riskBreakdown.risk} risk` +
                (adGoster ? ` · ${tarih(d.at)}` : '')
              : adGoster ? tarih(d.at) : `corpus ${d.corpusVersion ?? '?'}`)),
        el('span', { className: `chip ${renk}` }, `risk ${d.riskScore}`),
        sagOk()),
      // Model koşmadıysa raporun eksik olduğu LİSTEDE de görünmeli; yoksa
      // kullanıcı skoru tam sanıp karşılaştırma yapar.
      !d.modelRan && el('div', { className: 'note warn small', style: 'margin:7px 0 0' },
        'Model turu çalışmadı — bu rapor eksik.')))
  }
  return liste
}

EKRAN.audits = async (root) => {
  const kayitlar = await GLStore.getAudits()
  if (!kayitlar.length) {
    root.append(el('div', { className: 'empty' },
      el('div', { className: 'icon' }, '◷'),
      el('h3', {}, 'Denetim kaydı yok'),
      el('p', {}, 'Bir uygulamayı açıp "Denetle" dediğinde rapor buraya kaydedilir. ' +
        'Aynı uygulamanın eski raporları da durur — skor düştü mü, görebilirsin.')))
    return
  }
  root.append(denetimListesi(kayitlar))
  root.append(el('p', { className: 'tiny muted', style: 'margin-top:12px' },
    'Kayıtlar silinmez. Yer açmak istersen: Menü → Yedek → "Eski denetimleri buda".'))
}

// --- Ekran: kapsam ----------------------------------------------------------

/**
 * "Geçmişte yediğim redlerin kaçını bu araç bilirdi?"
 *
 * Bu ekran ürünün tek gerçek sorusuna bakıyor: işe yarıyor mu. Kart sayısı
 * cevap değil — 24 kart, yanlış 24 kart olabilir. Cevabın ölçülebilir yarısı
 * elimizde: Apple'ın red yazışmaları hangi maddeden geldiğini söylüyor,
 * kural kitabı da madde numarasına çapalı.
 *
 * ═══ SAYIYI YANLIŞ OKUTMAMAK BU EKRANIN ASIL İŞİ ═══
 * Bu bir TAVAN, yakalama oranı değil. Kart yoksa o red KESİNLİKLE
 * yakalanmazdı; kart varsa yakalanmış OLABİLİR. "%80 kapsam" cümlesini
 * "%80'ini yakalarız" diye okumak, bu projenin bütün mimarisinin engellemeye
 * çalıştığı hata (belkiPatlarız R2/R3). Uyarı ekranın en üstünde ve
 * kapatılamaz.
 */
EKRAN.kapsam = async (root) => {
  const rejects = await GLStore.getRejects()
  if (!rejects.length) {
    root.append(el('div', { className: 'empty' },
      el('div', { className: 'icon' }, '◔'),
      el('h3', {}, 'Red kaydı yok'),
      el('p', {}, 'Bu ekran geçmiş redleri kural kitabıyla karşılaştırıyor. ' +
        'Önce çekim yap; red yoksa buradaki hiçbir sayı bir şey söylemez.')))
    return
  }

  const r = GLAudit.coverageReport(rejects)
  const oran = GLAudit.kapsamOrani(r)

  // UYARI ÖNCE. Sayıyı üstte gösterip uyarıyı altına koymak, kimsenin
  // uyarıyı okumaması demek olurdu.
  root.append(el('div', { className: 'callout hold' },
    el('div', { className: 't' }, 'Bu bir tavan, yakalama oranı değil'),
    el('p', { className: 'small' },
      'Kart yoksa o red KESİNLİKLE yakalanmazdı. Kart varsa yakalanmış ' +
      'OLABİLİR — kartın sorusu o somut soruna denk gelmeyebilir.'),
    el('p', { className: 'small' },
      'Ayrıca pek çok red listing\'den hiç görülmez: çöken build, çalışmayan ' +
      'demo hesap, uygulama içi akış. Onları hiçbir kart yakalayamaz.')))

  root.append(el('div', { className: 'card' },
    el('div', { className: 'between', style: 'align-items:flex-start;gap:14px' },
      oran === null ? '' : GLReport.skorHalkasi(oran),
      el('div', { className: 'grow' },
        el('h3', {}, oran === null ? 'Oran hesaplanamıyor' : `Kapsam tavanı %${oran}`),
        el('div', { className: 'small muted' },
          `${r.kartiOlan}/${r.kodlu} madde kodlu red için en az bir kart var`),
        el('div', { className: 'tiny dim', style: 'margin-top:3px' },
          `${r.toplamRed} red · ${r.kodsuz} tanesi madde kodu taşımıyor`)))))

  for (const u of r.uyarilar) root.append(el('div', { className: 'note warn' }, u))

  if (r.bosluklar.length) {
    root.append(el('h2', { className: 'stop' }, `Boşluk — kartı olmayan ${r.bosluklar.length} madde`))
    root.append(el('p', { className: 'small muted', style: 'margin:0 0 8px' },
      'Yol haritası. Bu maddelerden gelen redleri bugün KESİNLİKLE kaçırıyoruz. ' +
      'En çok red yediğinden başla.'))
    for (const b of r.bosluklar) root.append(maddeKarti(b, true))
  }

  if (r.kapsananlar.length) {
    root.append(el('h2', {}, `Kartı olan ${r.kapsananlar.length} madde`))
    for (const k of r.kapsananlar) root.append(maddeKarti(k, false))
  }
}

function maddeKarti(m, bosluk) {
  return el('div', { className: 'card tight' },
    el('div', { className: 'between' },
      el('div', { className: 'grow' },
        el('div', { style: 'font-weight:600' }, `Guideline ${m.madde}`),
        el('div', { className: 'tiny dim trunc' }, m.uygulamalar.join(', ') || '—')),
      el('span', { className: `chip ${bosluk ? 'stop' : 'go'}` }, `${m.redSayisi} red`)),
    bosluk
      ? el('div', { className: 'tiny muted', style: 'margin-top:6px' }, 'kart yok')
      : el('div', { className: 'tiny dim mono', style: 'margin-top:6px' }, m.kartlar.join(', ')),
    m.ornek ? el('details', {},
      el('summary', { className: 'tiny' }, "Apple'ın gerekçesi"),
      el('div', { className: 'log', style: 'margin-top:4px' }, m.ornek)) : '')
}

// --- Ekran: redler ----------------------------------------------------------

EKRAN.rejects = async (root) => {
  const rows = await GLStore.getRejects()
  if (!rows.length) {
    root.append(el('div', { className: 'empty' },
      el('div', { className: 'icon' }, '—'),
      el('h3', {}, 'Red kaydı yok'),
      el('p', {}, 'Çekim yapıldıysa bu hesapta hiç red yaşanmamış olabilir.')))
    return
  }

  root.append(el('div', { className: 'card' },
    el('h3', {}, `${rows.length} red metni`),
    el('p', { className: 'small muted' },
      'Biçim, projedeki `npm run learn` komutunun beklediği biçimdir. İndirip rejects/ klasörüne koy.'),
    el('button', { className: 'btn primary', style: 'margin-top:9px',
      textContent: 'Hepsini indir (.txt)', onclick: (e) => indirHepsi(rows, e.target) })))

  const byApp = new Map()
  for (const r of rows) byApp.set(r.appName, [...(byApp.get(r.appName) ?? []), r])
  for (const [ad, liste] of [...byApp].sort((a, b) => b[1].length - a[1].length)) {
    const maddeler = [...new Set(liste.map((r) => r.guideline).filter(Boolean))].sort()
    const card = el('div', { className: 'card' },
      el('h3', {}, ad),
      el('div', { className: 'small muted' }, `${liste.length} red · madde: ${maddeler.join(', ') || '—'}`))
    for (const r of liste) {
      card.append(el('details', {},
        el('summary', {}, `${r.rejectedAt ?? 'tarihsiz'} · Guideline ${r.guideline || '—'}${r.ingested ? '' : ' · yeni'}`),
        el('blockquote', {}, r.text),
        el('button', {
          className: 'btn sm ghost', textContent: 'Panoya kopyala',
          onclick: (e) => { navigator.clipboard.writeText(r.text); e.target.textContent = 'kopyalandı' },
        })))
    }
    root.append(card)
  }
}

/** Her red ayrı dosya: learn bir dosyayı tek red sayıyor, birleştirmek ders kaybettirir. */
async function indirHepsi(rows, btn) {
  btn.disabled = true
  for (const [i, r] of rows.entries()) {
    btn.textContent = `indiriliyor ${i + 1}/${rows.length}`
    const slug = String(r.appName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const kod = (r.guideline || 'genel').replace(/[^0-9a-z]+/gi, '-')
    // Mesaj kimliğinin başı ada girsin: aynı gün aynı maddeden iki red
    // geldiğinde (oluyor) dosyalar birbirinin üzerine yazılmasın.
    const iz = String(r.messageId ?? '').slice(0, 6)
    indir(`asc-reject-${slug}-${kod}-${r.rejectedAt ?? 'tarihsiz'}-${iz}.txt`, r.text, 'text/plain')
    await new Promise((res) => setTimeout(res, 250))
  }
  btn.disabled = false
  btn.textContent = 'Hepsini indir (.txt)'
}

// --- Ekran: ham veri --------------------------------------------------------

EKRAN.raw = async (root) => {
  const apps = await GLStore.getApps()
  if (!apps.length) {
    root.append(el('div', { className: 'empty' }, el('h3', {}, 'Veri yok')))
    return
  }

  const sel = el('select', { style: 'width:100%' },
    ...apps.map((a) => el('option', { value: a.id, textContent: a.name })))
  const durum = el('span', { className: 'small muted' })
  const bolumKutu = el('div', { style: 'margin-top:10px' })
  const goster = el('div', { style: 'margin-top:10px' })
  sel.onchange = () => bolumler(sel.value)

  /**
   * Depoyu sadeleştir — eski (`sema:1`) satırları yerinde normalleştirir.
   *
   * Denetim bunları zaten okuma anında sadeleştiriyor, yani bu düğme SONUCU
   * değiştirmez; depodaki yeri geri alır (sahada 704 KB → ~60 KB). Tek yönlü:
   * `links` atıldığı için geri dönüş yok, o yüzden onay soruyoruz.
   */
  const sadelestir = el('button', {
    className: 'btn sm', textContent: 'Depoyu sadeleştir',
    onclick: async () => {
      const appId = sel.value
      const eski = (await GLStore.listRaw(appId)).filter((b) => b.sema !== GLNormalize.SEMA)
      if (!eski.length) return (durum.textContent = 'zaten sadeleştirilmiş')
      const kbTop = Math.round(eski.reduce((n, b) => n + b.bytes, 0) / 1024)
      if (!confirm(
        `${eski.length} bölüm (${kbTop} KB) sadeleştirilecek.\n\n` +
        'Taşıma linkleri kalıcı olarak silinir; geri alınamaz. ' +
        'Önce "Tam yedek" alman önerilir.\n\nDevam edilsin mi?',
      )) return
      sadelestir.disabled = true
      let once = 0, sonra = 0, hata = 0
      for (const b of eski) {
        const row = await GLStore.getRaw(appId, b.section)
        if (!row) continue
        try {
          const { data } = GLNormalize.normalizeSection(b.section, row.data)
          once += b.bytes
          sonra += JSON.stringify(data ?? null).length
          await GLStore.putRaw(appId, b.section, data, { sema: GLNormalize.SEMA })
        } catch (e) {
          // Tek bölüm çevrilemezse HAM HALİYLE bırakılır: yarım çevrilmiş bir
          // kayıt, hiç çevrilmemişten kötüdür.
          hata++
          console.warn(`[greenlight] ${b.section} sadeleştirilemedi`, e)
        }
      }
      sadelestir.disabled = false
      durum.textContent = `${eski.length - hata} bölüm sadeleşti · ${kb(once)} → ${kb(sonra)}` +
        (hata ? ` · ${hata} çevrilemedi (ham kaldı)` : '')
      bolumler(appId)
    },
  })

  root.append(el('div', { className: 'card' },
    el('label', { className: 'field' }, 'Uygulama', sel),
    el('p', { className: 'small muted', style: 'margin:9px 0 0' },
      "Apple'ın döndürdüğü ham JSON. Alan adları değişirse burayı yeniden okuruz, " +
      "Apple'a tek istek daha atmayız."),
    el('div', { className: 'row', style: 'margin-top:10px' },
      el('button', {
        className: 'btn sm primary', textContent: 'Tümünü indir',
        onclick: async (e) => {
          e.target.disabled = true
          const appId = sel.value
          const paket = { app: apps.find((a) => a.id === appId), bolumler: {}, indirilme: new Date().toISOString() }
          for (const b of await GLStore.listRaw(appId)) {
            paket.bolumler[b.section] = (await GLStore.getRaw(appId, b.section))?.data
          }
          indirMaskeli(`greenlight-${appId}-ham.json`, paket)
          e.target.disabled = false
        },
      }),
      sadelestir, durum)))

  root.append(bolumKutu, goster)

  async function bolumler(appId) {
    bolumKutu.textContent = ''
    goster.textContent = ''
    for (const b of await GLStore.listRaw(appId)) {
      bolumKutu.append(el('button', {
        className: 'btn sm', style: 'margin:0 4px 4px 0',
        title: b.sema === GLNormalize.SEMA ? '' : 'Eski biçim — okuma anında sadeleştiriliyor',
        textContent: `${b.section} (${kb(b.bytes)})` + (b.sema === GLNormalize.SEMA ? '' : ' · eski'),
        onclick: async () => {
          const row = await GLStore.getRaw(appId, b.section)
          goster.textContent = ''
          goster.append(el('div', { className: 'card' },
            el('div', { className: 'row', style: 'margin-bottom:8px' },
              el('h3', { className: 'grow' }, b.section),
              el('button', {
                className: 'btn sm', textContent: 'JSON indir',
                onclick: () => indir(`${appId}-${b.section}.json`, JSON.stringify(row.data, null, 2)),
              })),
            el('pre', {}, JSON.stringify(row.data, null, 2).slice(0, 200_000))))
        },
      }))
    }
  }
  bolumler(sel.value)
}

// --- Ekran: çekim günlüğü ---------------------------------------------------

EKRAN.runs = async (root) => {
  const runs = await GLStore.getRuns()
  if (!runs.length) {
    root.append(el('div', { className: 'empty' }, el('h3', {}, 'Henüz çekim yapılmadı')))
    return
  }

  for (const r of runs) {
    const sure = Math.round(((r.finishedAt ?? 0) - (r.startedAt ?? 0)) / 1000)
    const card = el('div', { className: 'card' },
      el('h3', {}, tarih(r.startedAt)),
      el('div', { className: 'small muted' },
        `${r.apps?.length ?? 0} uygulama · ${r.requests} istek · ${sure} sn · takım: ${r.team || '?'}`),
      el('div', { className: 'row', style: 'margin-top:8px' },
        r.atlandi?.length ? el('span', { className: 'chip stop' }, `${r.atlandi.length} okunamadı`) : null,
        r.supheli?.length ? el('span', { className: 'chip hold' }, `${r.supheli.length} şüpheli`) : null,
        el('button', {
          className: 'btn sm', textContent: 'Çekimi indir',
          title: 'Bu çekimin günlüğü + çektiği tüm ham veri',
          onclick: (e) => cekimIndir(r, e.target),
        })))
    if (r.halted) card.append(el('p', { className: 'note bad small' }, r.halted))

    // Uygulama başına ne çekilmiş: özet satırı "13 sürüm" diyor ama hangi
    // bölümlerin geldiğini görmeden eksiği anlamak zor.
    for (const a of r.apps ?? []) {
      const sayilar = Object.entries(a.sayilar ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ')
      card.append(el('details', {},
        el('summary', { className: 'small' }, `${a.name} — ${sayilar || 'sayım yok'}`),
        el('div', { className: 'tiny dim mono', style: 'padding:5px 0' }, `id: ${a.id}`),
        el('button', {
          className: 'btn sm', textContent: 'Bu uygulamanın ham verisi',
          onclick: async (e) => {
            e.target.disabled = true
            const paket = { app: a, bolumler: {} }
            for (const b of await GLStore.listRaw(a.id)) {
              paket.bolumler[b.section] = (await GLStore.getRaw(a.id, b.section))?.data
            }
            indirMaskeli(`greenlight-${a.id}-ham.json`, paket)
            e.target.disabled = false
          },
        })))
    }

    if (r.atlandi?.length) {
      card.append(ayrintiKutusu('Okunamayan uçlar', r.atlandi, 'stop',
        'Bu uçlar hiç okunamadı.'))
    }
    const kv = kovala(r.supheli)
    for (const [anahtar, ad, cls, aciklama] of KOVA) {
      if (kv[anahtar].length) card.append(ayrintiKutusu(ad, kv[anahtar], cls, aciklama))
    }
    root.append(card)
  }
}

/** Çekim günlüğü + o çekimdeki uygulamaların ham verisi, tek dosya. */
async function cekimIndir(run, btn) {
  btn.disabled = true
  btn.textContent = 'hazırlanıyor…'
  const paket = { cekim: run, uygulamalar: {} }
  for (const a of run.apps ?? []) {
    const bolumler = {}
    for (const b of await GLStore.listRaw(a.id)) {
      bolumler[b.section] = (await GLStore.getRaw(a.id, b.section))?.data
    }
    paket.uygulamalar[a.id] = { ozet: a, bolumler }
  }
  indirMaskeli(
    `greenlight-cekim-${new Date(run.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
    paket,
  )
  btn.disabled = false
  btn.textContent = 'Çekimi indir'
}

// --- Ekran: yedek -----------------------------------------------------------

EKRAN.backup = async (root) => {
  const cikti = el('div', { className: 'small', style: 'margin-top:7px' })

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Yedek al'),
    el('p', { className: 'small muted' },
      'Veri yalnızca bu tarayıcıda duruyor. Eklentiyi kaldırırsan ya da Chrome profilini ' +
      'sıfırlarsan gider — düzenli yedek al. Denetim raporları da yedeğe dahildir.'),
    el('div', { className: 'row', style: 'margin-top:10px' },
      el('button', {
        className: 'btn primary', textContent: 'Tam yedek indir',
        onclick: async () => indir(`greenlight-yedek-${damga()}.json`,
          JSON.stringify(await GLStore.exportAll(false), null, 2)),
      }),
      el('button', {
        className: 'btn', textContent: 'Paylaşılabilir kopya',
        title: 'Kişisel veri ve sırlar maskelenir',
        onclick: async () => indir(`greenlight-paylasilabilir-${damga()}.json`,
          JSON.stringify(await GLStore.exportAll(true), null, 2)),
      })),
    el('p', { className: 'tiny muted', style: 'margin-top:8px' },
      'Tam yedek MASKESİZDİR — demo hesap şifresi dahil her şeyi içerir. ' +
      'Paylaşacaksan ikinci düğmeyi kullan.')))

  const dosya = el('input', { type: 'file', accept: 'application/json', style: 'margin-top:8px;width:100%' })
  dosya.onchange = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const counts = await GLStore.importAll(JSON.parse(await f.text()))
      cikti.className = 'small go'
      cikti.textContent = `Yüklendi: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}`
    } catch (err) {
      cikti.className = 'small stop'
      cikti.textContent = err.message
    }
  }
  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Yedekten yükle'),
    el('p', { className: 'small muted' }, "Aynı id'li kayıtların üzerine yazar."),
    dosya, cikti))

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Yer aç'),
    el('p', { className: 'small muted' },
      'Denetim kayıtları büyük. Uygulama başına son 5 raporu tutup gerisini siler — ' +
      'geçmiş karşılaştırması için genelde yeterli.'),
    el('button', {
      className: 'btn', style: 'margin-top:9px', textContent: 'Eski denetimleri buda',
      onclick: async (e) => {
        const n = await GLStore.budaAudits(5)
        e.target.textContent = n ? `${n} kayıt silindi` : 'silinecek kayıt yok'
      },
    })))

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Depoyu temizle'),
    el('p', { className: 'small muted' }, 'Her şey silinir: uygulamalar, ham veri, redler, denetimler. Geri alınamaz.'),
    el('button', {
      className: 'btn danger', style: 'margin-top:9px', textContent: 'Hepsini sil',
      onclick: async (e) => {
        if (e.target.dataset.emin !== '1') {
          e.target.dataset.emin = '1'
          e.target.textContent = 'Emin misin? Tekrar tıkla'
          setTimeout(() => { e.target.dataset.emin = ''; e.target.textContent = 'Hepsini sil' }, 4000)
          return
        }
        await GLStore.clearAll()
        e.target.textContent = 'Silindi'
        kok('home')
      },
    })))
}

// --- Ekran: ayarlar ---------------------------------------------------------

EKRAN.settings = async (root) => {
  const A = await GLRun.ayarlar()

  const url = el('input', { type: 'url', value: A.proxyUrl ?? '',
    placeholder: 'https://greenlight-llm.hesabin.workers.dev/v1' })
  const token = el('input', { type: 'password', value: A.proxyToken ?? '',
    placeholder: "Worker'daki CLIENT_TOKEN ile aynı" })
  const detay = el('select', {},
    el('option', { value: 'low' }, 'low — ucuz, genelde yeterli'),
    el('option', { value: 'high' }, 'high — küçük puntoyu okur, pahalı'))
  detay.value = A.imageDetail ?? 'low'
  const cikti = el('span', { className: 'small muted' })

  const havuzUrl = el('input', { type: 'url', value: A.havuzUrl ?? '',
    placeholder: 'https://havuz.sirketin.com' })
  const havuzToken = el('input', { type: 'password', value: A.havuzToken ?? '',
    placeholder: 'HAVUZ_READ_TOKEN — okuma belirteci' })
  const havuzCikti = el('span', { className: 'small muted' })
  const havuzKaydet = async () => {
    await GLRun.ayarlariYaz({
      ...(await GLRun.ayarlar()),
      havuzUrl: havuzUrl.value.trim().replace(/\/+$/, ''),
      havuzToken: havuzToken.value.trim(),
    })
  }

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Model bağlantısı'),
    el('p', { className: 'small muted' },
      "Model çağrıları senin Cloudflare Worker'ından geçer; API anahtarı orada durur, " +
      'burada değil. Adres boşsa denetim yalnızca kesin kontrolleri çalıştırır.'),
    el('div', { className: 'col', style: 'margin-top:11px' },
      el('label', { className: 'field' }, 'Worker adresi', url),
      el('label', { className: 'field' }, 'İstemci belirteci (isteğe bağlı)', token),
      el('label', { className: 'field' }, 'Görsel ayrıntısı', detay)),
    el('div', { className: 'row', style: 'margin-top:12px' },
      el('button', {
        className: 'btn primary', textContent: 'Kaydet',
        onclick: async () => {
          // Mevcut ayarların ÜSTÜNE yaz, yerine değil: bu ekranda artık iki
          // ayrı kart var ve birini kaydetmek ötekini silmemeli.
          await GLRun.ayarlariYaz({
            ...(await GLRun.ayarlar()),
            proxyUrl: url.value.trim().replace(/\/+$/, ''),
            proxyToken: token.value.trim(),
            imageDetail: detay.value,
          })
          cikti.className = 'small go'
          cikti.textContent = 'kaydedildi'
        },
      }),
      el('button', { className: 'btn', textContent: 'Bağlantıyı sına', onclick: () => sinaProxy(url, token, cikti) }),
      cikti)))

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Ortak ders havuzu'),
    el('p', { className: 'small muted' },
      'Ofisin ortak red arşivi. Bağlıyken denetim, kural kartlarının yanına ' +
      "DAHA ÖNCE YEDİĞİMİZ RED'LERİ de kanıt olarak koyar ve bulguların altında " +
      'benzer gerçek red örneklerini gösterir. Boşsa denetim yalnız kartlarla koşar.'),
    el('p', { className: 'tiny muted', style: 'margin-top:6px' },
      'Buraya OKUMA belirtecini gir. Yazma belirteci red metinlerini işleyen ' +
      'kişide durur; eklentiye girmesine gerek yok ve girmemeli.'),
    el('div', { className: 'col', style: 'margin-top:11px' },
      el('label', { className: 'field' }, 'Havuz adresi', havuzUrl),
      el('label', { className: 'field' }, 'Okuma belirteci', havuzToken)),
    el('div', { className: 'row', style: 'margin-top:12px' },
      el('button', {
        className: 'btn primary', textContent: 'Kaydet',
        onclick: async () => {
          await havuzKaydet()
          havuzCikti.className = 'small go'
          havuzCikti.textContent = 'kaydedildi'
        },
      }),
      el('button', {
        className: 'btn', textContent: 'Bağlantıyı sına',
        onclick: () => sinaHavuz(havuzUrl, havuzToken, havuzCikti),
      }),
      havuzCikti)))

  root.append(el('div', { className: 'card' },
    el('h3', {}, 'Veri nereye gidiyor'),
    el('p', { className: 'small muted' },
      'Worker adresi boşken hiçbir veri tarayıcıdan çıkmaz. Adres girildiğinde listing ' +
      "metinleri, ekran görüntüleri ve denetlenen içerik senin Worker'ından geçip modele " +
      'gider. Red yazışmaları denetime girmez.'),
    el('p', { className: 'small muted', style: 'margin-top:8px' },
      'Ders havuzu adresi girildiğinde eklenti havuzdan yalnız OKUR: dersleri ve ' +
      'red örneklerini çeker. Bu makinedeki çekim, denetim ve dökümlerin hiçbiri ' +
      'havuza gitmez — havuza yazan tek şey terminaldeki npm run learn.')))
}

/**
 * Havuz sınaması iki şeyi birden söyler: adres doğru mu, belirteç geçerli mi.
 *
 * İkincisi olmadan yanlış belirteci ilk denetimin ortasında öğrenirsin —
 * `/health` yetkiyi bilerek dönüyor, tam bunun için.
 */
async function sinaHavuz(url, token, cikti) {
  const adres = url.value.trim().replace(/\/+$/, '')
  if (!adres) { cikti.className = 'small muted'; cikti.textContent = 'adres boş — havuz kapalı'; return }
  cikti.className = 'small muted'
  cikti.textContent = 'sınanıyor…'
  if (!(await GLRun.agIzni())) { cikti.className = 'small stop'; cikti.textContent = 'ağ izni verilmedi'; return }
  const havuz = new GLHavuz.RemoteLessonStore(adres, token.value.trim())
  const sag = await havuz.healthcheck()
  if (!sag.ok) { cikti.className = 'small stop'; cikti.textContent = sag.reason; return }
  try {
    const dersler = await havuz.allLessons()
    const aktif = dersler.filter((l) => l.status === 'active').length
    cikti.className = 'small go'
    cikti.textContent = `bağlandı · ${dersler.length} ders (${aktif} aktif)`
  } catch (e) {
    cikti.className = 'small stop'
    cikti.textContent = e.message
  }
}

async function sinaProxy(url, token, cikti) {
  const adres = url.value.trim().replace(/\/+$/, '')
  if (!adres) { cikti.className = 'small stop'; cikti.textContent = 'adres boş'; return }
  cikti.className = 'small muted'
  cikti.textContent = 'sınanıyor…'
  if (!(await GLRun.agIzni())) { cikti.className = 'small stop'; cikti.textContent = 'ağ izni verilmedi'; return }
  try {
    const res = await fetch(`${adres}/models`, {
      headers: token.value ? { 'x-gl-token': token.value.trim() } : {},
    })
    const body = await res.json()
    cikti.className = res.ok ? 'small go' : 'small stop'
    cikti.textContent = res.ok ? `bağlandı · ${body.model ?? '?'}` : `HTTP ${res.status}: ${body.error ?? ''}`
  } catch (e) {
    cikti.className = 'small stop'
    cikti.textContent = e.message
  }
}

// --- Ekran: teşhis (kanarya) ------------------------------------------------

EKRAN.diag = (root) => {
  root.append(el('div', { className: 'card' },
    el('p', { className: 'small muted' },
      "Hiçbir şey toplamaz ve kaydetmez. App Store Connect'in her ucunu birer kez çağırıp " +
      'hangisinin yaşadığını ve hangi alan adlarıyla cevap verdiğini ölçer. Apple bir ucu ' +
      'haber vermeden değiştirdiğinde ilk buradan anlarız.'),
    el('div', { className: 'row', style: 'margin-top:11px' },
      el('button', {
        className: 'btn primary', textContent: 'Yokla',
        onclick: () => {
          logSifirla()
          setFaz('uçlar yoklanıyor…')
          mesgulYaz(true)
          chrome.runtime.sendMessage({ type: 'gl:start' })
        },
      }),
      el('button', {
        className: 'btn', textContent: 'Raporu kopyala', disabled: !canaryReport,
        onclick: async (e) => {
          await navigator.clipboard.writeText(canaryReport.text)
          e.target.textContent = 'kopyalandı'
          setTimeout(() => (e.target.textContent = 'Raporu kopyala'), 1600)
        },
      }),
      el('button', {
        className: 'btn', textContent: 'JSON indir', disabled: !canaryReport,
        onclick: () => indir(`greenlight-kanarya-${canaryReport.at.slice(0, 10)}.json`,
          JSON.stringify(canaryReport, null, 2)),
      }))))

  root.append(el('div', { className: 'row', style: 'margin:4px 0' },
    el('span', { className: 'small muted grow', id: 'faz' }, FAZ)))
  const kayit = el('div', { className: 'log', id: 'log', style: 'max-height:300px' })
  for (const l of LOG) kayit.append(el('div', { className: l.cls }, l.text))
  root.append(kayit)
  kayit.scrollTop = kayit.scrollHeight
}

// --- Çekim durumu -----------------------------------------------------------

function ozetYaz(run) {
  const toplam = (k) => (run.apps ?? []).reduce((n, a) => n + (a.sayilar?.[k] ?? 0), 0)
  logEkle(`${run.apps?.length ?? 0} uygulama · ${toplam('redler')} red metni · ` +
    `${run.requests} istek · ${Math.round((run.finishedAt - run.startedAt) / 1000)} sn`)
  if (run.atlandi?.length) logEkle(`${run.atlandi.length} uç okunamadı — ayrıntı uygulama ekranında`, 'stop')
  // Yalnız GERÇEK şüpheliyi say: bilerek konmuş sınırları ve tanı notlarını
  // "şüpheli" diye raporlamak, sayıyı da listeyi de anlamsızlaştırıyordu.
  const gercek = kovala(run.supheli).supheli.length
  if (gercek) logEkle(`${gercek} şüpheli yanıt`, 'hold')
  if (run.halted) logEkle(run.halted, 'stop')
}

function kanaryaYaz(r) {
  canaryReport = r
  const s = r.summary
  logEkle(`${s.tamam} tamam · ${s.boş} boş · ${s.şüpheli} şüpheli · ${s.yasak} yasak · ${s.kırık} kırık`)
  if (r.teams?.length > 1) {
    logEkle(`${r.teams.length} takım var (${r.teams.join(', ')}) — yalnızca seçili olan okundu.`, 'hold')
  }
  if (r.halted) logEkle(r.halted, 'stop')
}

/** Panel kapanıp açıldığında service worker'daki duruma yeniden bağlan. */
function durumdanKur(state) {
  if (!state) return
  lastBeat = state.updatedAt ?? 0
  LOG = []
  for (const p of state.probes ?? []) LOG.push({ text: `${p.id}: ${p.verdict}`, cls: '' })
  if (state.mode === 'collect') {
    for (const a of state.apps ?? []) {
      LOG.push({ text: `${a.name}: ${a.sayilar?.redler ?? 0} red metni`, cls: a.atlandi?.length ? 'hold' : '' })
    }
  }
  if (state.run) ozetYaz(state.run)
  if (state.report) kanaryaYaz(state.report)
  FAZ = state.error || state.phase || 'hazır'
  HATA = !!state.error
  // 45 sn+ sessizlik: sessizce donmuş bir arayüzden görünür bir uyarı iyidir.
  if (state.running && state.updatedAt && Date.now() - state.updatedAt > 45_000) {
    FAZ = '45 sn+ sessiz — ASC sekmesi kapandı mı? Yeniden başlat.'
    HATA = true
  }
  mesgulYaz(!!state.running)
  ciz()
}

chrome.runtime.onMessage.addListener((msg) => {
  lastBeat = Date.now()
  if (msg?.type === 'gl:collect:progress') setFaz(msg.text)
  if (msg?.type === 'gl:collect:appStart') setFaz(`${msg.index}/${msg.total} · ${msg.name}`)
  if (msg?.type === 'gl:collect:app') {
    logEkle(`${msg.app.name}: ${msg.app.sayilar?.redler ?? 0} red metni`,
      msg.app.atlandi?.length ? 'hold' : '')
  }
  if (msg?.type === 'gl:collect:done') {
    mesgulYaz(false)
    setFaz('bitti')
    ozetYaz(msg.run)
    if (simdiki().name === 'home') ciz()
  }
  if (msg?.type === 'gl:progress') setFaz(`${msg.i}/${msg.n} · ${msg.label}`)
  if (msg?.type === 'gl:probe') logEkle(`${msg.probe.id}: ${msg.probe.verdict}`)
  if (msg?.type === 'gl:canary:done') {
    mesgulYaz(false)
    setFaz('bitti')
    kanaryaYaz(msg.report)
    if (simdiki().name === 'diag') ciz()
  }
  if (msg?.type === 'gl:error') {
    mesgulYaz(false)
    setFaz(msg.message, true)
  }
})

// Panel açıkken de takılmayı fark et.
setInterval(() => {
  if (MESGUL && lastBeat && Date.now() - lastBeat > 45_000) {
    setFaz('45 sn+ sessiz — yeniden başlat.', true)
  }
}, 5000)


// --- Açılış -----------------------------------------------------------------
// EN SONDA: yukarıdaki sabitler ve fonksiyonlar tanımlanmış olsun.
$('#back').onclick = geri
$('#menu').onclick = () => (simdiki().name === 'menu' ? geri() : git('menu'))

console.log(`Greenlight yan panel v${chrome.runtime.getManifest().version} yüklendi — ` +
  new Date().toLocaleTimeString('tr-TR'))

/**
 * Panelin iç kapısı — hem TEST hem SAHA TEŞHİSİ için.
 *
 * Test tarafı: her ekranı tek tek çizdirip patlıyor mu diye bakabiliyor.
 * Bir ekran yalnızca "o yola tıklandığında" patlıyorsa, kullanıcı onu bizden
 * önce buluyor demektir; bu kapı olmadan yalnız anasayfa sınanabiliyordu.
 *
 * Saha tarafı: paneli sağ tık → İncele ile açıp konsola `GLPanel.git('kapsam')`
 * yazarak herhangi bir ekrana atlanabiliyor. Bir kullanıcı "şurada hata var"
 * dediğinde oraya ulaşmak için altı tıklama gerekmiyor.
 */
globalThis.GLPanel = { EKRAN, git, geri, kok, ciz, simdiki, redSayilari, kovala, agIzniSor }

kok('home')
chrome.runtime.sendMessage({ type: 'gl:state' }, durumdanKur)
