/**
 * Apple App Review Guidelines — sayfanın TAMAMI, yapılandırılmış veri olarak.
 *
 * NEDEN VAR: kural kartlarımız (corpus/*.yaml) Apple'ın kuralını BİZİM
 * cümlelerimizle özetliyor. Özet, denetimin dayandığı kanıt olamaz — modele
 * "Apple şöyle diyor" diye kendi parafrazımızı verirsek, kartı yazarken
 * yaptığımız her yorum hatası denetime sessizce geçer.
 *
 * Bu dosya Apple'ın KENDİ metnini tutar. Kart hâlâ "neye bakılacağını"
 * söyler; madde metni "kuralın ne olduğunu". İkisi ayrı kalmalı.
 *
 * Veri `data/apple-guidelines.json` içinde durur ve `npm run guidelines`
 * ile yenilenir. Çekim ağdan, okuma diskten: denetim koşarken ağ beklemiyoruz.
 */

export interface GuidelineLink {
  text: string
  href: string
}

export interface GuidelineSection {
  /** "1.1.2" gibi madde numarası, ya da "introduction" gibi anahtar. */
  id: string
  /** "Objectionable Content". Alt maddelerin çoğunda başlık yoktur. */
  title: string
  /** Apple'ın metni, düz yazıya çevrilmiş hâli. */
  text: string
  /** "1" / "2" ... numarasız bölümlerde ''. */
  chapter: string
  /** "Safety", "Business" ... */
  chapterTitle: string
  /** "1.1.2" → "1.1". Üst maddesi yoksa ''. */
  parent: string
  /** Sayfadaki çapa adresi — rapora yazılır, kullanıcı tıklayıp doğrular. */
  url: string
  /** Metinde geçen bağlantılar (mutlak adres). */
  links: GuidelineLink[]
}

export interface GuidelineDoc {
  url: string
  /** Apple'ın sayfaya yazdığı tarih ("June 8, 2026"). Sürüm takibi bununla. */
  lastUpdated: string
  /** Bizim çektiğimiz an. */
  retrievedAt: string
  /** Ayrıştırılmış metnin özeti — iki çekim aynı mı, tek bakışta belli. */
  digest: string
  chapters: Array<{ id: string; number: string; title: string }>
  sections: GuidelineSection[]
}

export const GUIDELINES_URL = 'https://developer.apple.com/app-store/review/guidelines/'
export const GUIDELINES_PATH = 'data/apple-guidelines.json'

// ---------------------------------------------------------------------------
// HTML → metin
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  mdash: '—', ndash: '–', hellip: '…', copy: '©',
  reg: '®', trade: '™', deg: '°', eacute: 'é',
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[String(name).toLowerCase()] ?? m)
}

/**
 * Etiketleri at, ama YAPIYI koru.
 *
 * Düz `replace(/<[^>]+>/g, '')` madde imlerini birbirine yapıştırıyor:
 * "(i) ...(ii) ..." tek satır oluyor ve modele giden metinde maddelerin
 * nerede bittiği kayboluyor. Blok sonlarını satır sonuna çeviriyoruz.
 */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h[1-6]|div|ul|ol)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function linksIn(html: string, base: string): GuidelineLink[] {
  const out: GuidelineLink[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href: string
    try {
      href = new URL(m[1]!, base).toString()
    } catch {
      continue
    }
    const text = htmlToText(m[2]!)
    if (!text || seen.has(href)) continue
    seen.add(href)
    out.push({ text, href })
  }
  return out
}

// ---------------------------------------------------------------------------
// Ayrıştırma
// ---------------------------------------------------------------------------

/** Numarasız ama metni önemli olan bölümler — "her şeyi al" demek bunlar dâhil. */
const PROSE_IDS = ['introduction', 'before-you-submit', 'after-you-submit']

/**
 * Sayfanın HTML'ini bölümlere ayır.
 *
 * YÖNTEM: DOM kurmuyoruz (bağımlılık istemiyoruz). Çapaların (`id="3.1.1"`)
 * sayfadaki KONUMLARINI sıralıyoruz; bir maddenin metni kendi çapasından bir
 * sonrakine kadar olan parçadır. Bu, iç içe `<li>`lerde de doğru sonuç verir:
 * alt madde kendi kaydına gider, üst maddede yalnız giriş cümlesi kalır.
 */
export function parseGuidelines(
  html: string,
  opts: { url?: string; retrievedAt?: string } = {},
): GuidelineDoc {
  const url = opts.url ?? GUIDELINES_URL

  const startAt = html.indexOf('id="content-container"')
  const endAt = html.indexOf('</main>', startAt < 0 ? 0 : startAt)
  if (startAt < 0 || endAt < 0) {
    throw new Error(
      'Yönerge sayfasının içerik bloğu bulunamadı (id="content-container" … </main>). ' +
        'Apple sayfa iskeletini değiştirmiş olabilir — ayrıştırıcı elden geçmeli.',
    )
  }
  const body = html.slice(startAt, endAt)

  // Bölüm başlıkları: <h3 ... id="safety">1. Safety</h3>
  const chapters: GuidelineDoc['chapters'] = []
  const chapterTitles: Record<string, string> = {}
  for (const m of body.matchAll(/<h3[^>]*\bid="([a-z-]+)"[^>]*>([\s\S]*?)<\/h3>/gi)) {
    const raw = htmlToText(m[2]!)
    const num = raw.match(/^(\d+)\.\s*/)
    const title = num ? raw.slice(num[0].length).trim() : raw.trim()
    chapters.push({ id: m[1]!, number: num?.[1] ?? '', title })
    if (num) chapterTitles[num[1]!] = title
  }

  // Çapalar: numaralı maddeler + numarasız düzyazı bölümleri.
  //
  // Harfli alt maddeler de var ve en çok atıf alanlar onlar: Apple bunları
  // `id="3.1.2a"` diye yazıyor, metinde ve red mektuplarında ise "3.1.2(a)"
  // diye geçiyor. Aramanın tutması için yazılışa çeviriyoruz.
  const anchors: Array<{ id: string; at: number; after: number }> = []
  for (const m of body.matchAll(/<\w+[^>]*\bid="(\d+(?:\.\d+)*)([a-z]*)"[^>]*>/g)) {
    const id = m[2] ? `${m[1]}(${m[2]})` : m[1]!
    anchors.push({ id, at: m.index!, after: m.index! + m[0].length })
  }
  for (const id of PROSE_IDS) {
    const m = new RegExp(`<h3[^>]*\\bid="${id}"[^>]*>`).exec(body)
    if (m) anchors.push({ id, at: m.index, after: m.index + m[0].length })
  }
  anchors.sort((a, b) => a.at - b.at)

  const sections: GuidelineSection[] = []
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i]!
    const chunk = body.slice(a.after, anchors[i + 1]?.at ?? body.length)

    let title = ''
    let rest = chunk

    if (PROSE_IDS.includes(a.id)) {
      // Düzyazı bölümü: başlık <h3>'ün kendi içinde, metin ondan sonra.
      const close = chunk.indexOf('</h3>')
      title = htmlToText(close < 0 ? '' : chunk.slice(0, close)).trim()
      rest = close < 0 ? chunk : chunk.slice(close + 5)
    } else {
      // Başlık: çapadan hemen sonraki <strong>. "1.1 Objectionable Content"
      // biçiminde gelir; numarayı atıp gerisini alırız. Alt maddelerde
      // <strong>1.1.1</strong> yalnız numaradır → başlık boş kalır (doğrusu bu).
      const strong = /^(?:\s|<\/?[^>]+>)*?<strong>([\s\S]*?)<\/strong>/.exec(chunk)
      if (strong) {
        const label = htmlToText(strong[1]!)
        const withoutNum = label
          .replace(new RegExp(`^${a.id.replace(/[.()]/g, '\\$&')}[.\\s]*`), '')
          // Apple bazen "5.1.1 (v) Account Sign-In" diye ayırıyor: numarayı
          // attıktan sonra harf parçası başlıkta kalıyor, o da numaranın
          // parçası — başlık değil.
          .replace(/^\(\w{1,3}\)\s*/, '')
          .replace(/:\s*$/, '')
          .trim()
        // Numarayla başlamayan <strong> madde başlığı değil, metin içi
        // vurgudur ("Timing:", "Bug Fix Submissions:"). Ona dokunmuyoruz.
        if (label !== withoutNum) {
          title = withoutNum
          rest = chunk.slice(strong.index + strong[0].length)
        }
      }
    }

    const chapter = /^\d/.test(a.id) ? a.id.split('.')[0]! : ''
    const parent = a.id.includes('(')
      ? a.id.replace(/\(.*$/, '')
      : a.id.includes('.')
        ? a.id.split('.').slice(0, -1).join('.')
        : ''

    // Bölüm çapası (id="1") başlığı METNİN İÇİNDE taşıyor: "1. Safety …".
    // Başlığı kendi alanına alıp metinden düşürüyoruz, yoksa her bölüm
    // metni kendi adıyla başlıyor ve modele giden alıntı çöple açılıyor.
    if (chapter && !parent) {
      title = chapterTitles[chapter] ?? title
      rest = rest.replace(/^(?:\s|<[^>]+>)*\d+\.\s*[^<\n]{2,40}/, '')
    }

    sections.push({
      id: a.id,
      title,
      text: htmlToText(rest),
      chapter,
      chapterTitle: chapterTitles[chapter] ?? '',
      parent,
      url: `${url}#${a.id}`,
      links: linksIn(rest, url),
    })
  }

  const lastUpdated =
    htmlToText(/Last Updated:([\s\S]{0,160}?)<\/p>/i.exec(body)?.[1] ?? '').trim() || ''

  return {
    url,
    lastUpdated,
    retrievedAt: opts.retrievedAt ?? '',
    digest: digestOf(sections),
    chapters,
    sections,
  }
}

/**
 * İçerik parmak izi — "yönerge değişti mi?" sorusunun tek satırlık cevabı.
 *
 * Sayfanın HTML'inden ALMIYORUZ: Apple her istekte değişen izleme kimlikleri
 * gömüyor, ham HTML özeti her çekimde farklı çıkar ve "değişti" alarmı
 * anlamını yitirir. Yalnız madde metinlerinden hesaplıyoruz.
 */
export function digestOf(sections: GuidelineSection[]): string {
  const payload = sections.map((s) => `${s.id} ${s.title} ${s.text}`).join('')
  // FNV-1a türevi — kriptografik değil; amaç çakışma direnci değil, DEĞİŞİM tespiti.
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < payload.length; i++) {
    h1 = Math.imul(h1 ^ payload.charCodeAt(i), 0x01000193) >>> 0
    h2 = Math.imul(h2 + payload.charCodeAt(i) + i, 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

// ---------------------------------------------------------------------------
// Arama
//
// Bu dosyada DOSYA SİSTEMİ YOK: aynı kod eklenti paketine de giriyor ve
// `node:fs` içeri sızarsa paket tarayıcıda patlar. Diskten okuma
// `guidelines-node.ts` içinde durur.
// ---------------------------------------------------------------------------

/**
 * Madde numarasından metni bul.
 *
 * Red mektupları "Guideline 2.3.3" der; kartlarımız "3.1.2" der; ders deposu
 * bazen "5.1.1(i)" gibi harfli alt madde tutar. Üçü de aynı fonksiyona gelir.
 * Tam eşleşme yoksa ÜST maddeye düşeriz — 5.1.1(i) için 5.1.1 metni doğru
 * cevaptır. Bulunamazsa null: uydurma metin göstermek yanlış bilgidir.
 */
/**
 * Aramaya yeten en küçük kayıt. Eklenti paketine metinler bağlantısız,
 * kırpılmış bir biçimde gömülüyor; arama fonksiyonları onu da kabul etmeli
 * ki tarayıcıda ve terminalde AYNI kod koşsun (iki gerçeklik olmasın).
 */
export interface SectionText {
  id: string
  title: string
  text: string
}

export function findSection<T extends SectionText>(
  doc: { sections: readonly T[] },
  ref: string,
): T | null {
  const byId = new Map(doc.sections.map((s) => [s.id, s]))

  // Önce yazıldığı gibi: "3.1.2(a)" diye bir madde GERÇEKTEN var, üstüne
  // düşmeden önce onu deniyoruz.
  const tam = String(ref)
    .trim()
    .replace(/^guideline\s+/i, '')
    .replace(/[^\d.()a-z]/gi, '')
    .replace(/\.+$/, '')
  if (byId.has(tam)) return byId.get(tam)!

  const clean = tam.replace(/\(.*$/, '').replace(/[^\d.]/g, '').replace(/\.+$/, '')
  if (!clean) return null
  let id = clean
  while (id) {
    const hit = byId.get(id)
    if (hit) return hit
    if (!id.includes('.')) return null
    id = id.split('.').slice(0, -1).join('.')
  }
  return null
}

/** Madde + altındaki tüm alt maddeler — modele giden "tam kural" metni. */
export function sectionWithChildren(doc: { sections: readonly SectionText[] }, ref: string): string {
  const root = findSection(doc, ref)
  if (!root) return ''
  // Alt maddeler iki biçimde geliyor: "3.1.2.x" ve "3.1.2(a)". İkincisini
  // unutmak, abonelik kurallarının yarısını modelden gizlemek demekti.
  const kids = doc.sections.filter(
    (s) => s.id !== root.id && (s.id.startsWith(root.id + '.') || s.id.startsWith(root.id + '(')),
  )
  const head = `${root.id}${root.title ? ' ' + root.title : ''}`
  const body = [root.text, ...kids.map((k) => `${k.id}${k.title ? ' ' + k.title : ''} ${k.text}`.trim())]
    .filter(Boolean)
    .join('\n\n')
  return `${head}\n${body}`.trim()
}
