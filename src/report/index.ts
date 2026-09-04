import type {
  Report, Finding, LintFinding, ManualCheck, FindingExample, ElemeSebebi,
} from '../types.js'
import { lintSection } from '../lint/sections.js'

const W = { high: 30, medium: 10, low: 3 } as const

/**
 * Ağırlıklı ham toplam. Üst sınırı yok; skor bunun üstüne kuruluyor.
 *
 * AYNI KURAL AZALAN AĞIRLIKLA SAYILIR. İlk bulgu tam, sonrakiler dörtte bir.
 *
 * NEDEN. Sahada `apple-3.1.2-subscription-disclosure` dört kez düştü —
 * abonelik başına bir kez — ve 4 × 30 = 120 puan yazdı, ham toplamın neredeyse
 * yarısı. Oysa ortada TEK bir sorun var: listing metni abonelik şartlarını
 * yazmıyor. O metni bir kez düzeltince dördü birden kapanıyor.
 *
 * Doğrusal saymak skoru "uygulama ne kadar kötü"nün değil, "model ne kadar
 * çok cümle yazdı"nın ölçüsü yapıyordu. Aynı kuraldan gelen ek bulgular yine
 * de bir şey ifade ediyor (daha çok yerde görünüyor, reviewer'ın gözüne
 * çarpma ihtimali artıyor) — o yüzden sıfır değil, dörtte bir.
 */
export function riskRaw(lint: LintFinding[], findings: Finding[]): number {
  let s = 0

  // AZALAN AĞIRLIK LINT'TE DE GEÇERLİ.
  //
  // Bu kural findings için yazılmıştı, lint dışarıda kalmıştı — ve sahada
  // aynı çarpıklığı üretti: Housify'da `lint-price-store-mismatch` üç kez
  // düşüyor (üç ürün) ve 30 puan yazıyordu; Dance AI'da anahtar kelimedeki
  // iki marka terimi 60 puan yazıyordu. Oysa ikisi de TEK bir düzeltme:
  // fiyatları eşitle, anahtar kelimeleri düzelt. Üç ürünü olan uygulamayı
  // otuz ürünü olandan daha az riskli göstermek de aynı hatanın öbür yüzü.
  const lintGorulen = new Map<string, number>()
  for (const l of lint) {
    const n = lintGorulen.get(l.checkId) ?? 0
    lintGorulen.set(l.checkId, n + 1)
    s += n === 0 ? W[l.severity] : W[l.severity] * 0.25
  }

  const gorulen = new Map<string, number>()
  for (const f of findings) {
    const n = gorulen.get(f.ruleId) ?? 0
    gorulen.set(f.ruleId, n + 1)
    const taban = W[f.severity] * (f.outcome === 'violation' ? 1 : 0.5)
    s += n === 0 ? taban : taban * 0.25
  }
  return s
}

/**
 * 0-100 risk skoru. Kesin ihlaller tam, "risk" bulguları yarım ağırlıkla sayılır.
 *
 * NEDEN `min(100, toplam)` DEĞİL. Eski hâli ham toplamı 100'de kesiyordu.
 * Sahada gerçek bir denetimde toplam **350** çıktı ve 100 yazdı. Sonuç:
 *
 *   - Beş sorunu olan uygulama ile elli sorunu olan aynı görünüyordu.
 *   - Sorunların üçünü düzeltmek skoru KIPIRDATMIYORDU. Denetim geçmişi
 *     özelliğinin bütün anlamı "düzeldi mi" sorusuna cevap vermekti; sabit
 *     100 o soruyu cevaplanamaz kılıyordu.
 *
 * Yerine doyan ama TIKANMAYAN bir eğri: her yeni bulgu skoru artırır, artış
 * yukarı doğru azalır. 100'e asla tam ulaşmaz, çünkü "daha kötüsü olamaz"
 * diye bir şey yok.
 *
 *   toplam  30 →  35      (tek yüksek ihlal)
 *   toplam  70 →  63
 *   toplam 150 →  88
 *   toplam 350 →  99
 *
 * Skorun kendisi hâlâ bir ÖNCELİKLENDİRME aracı, olasılık değil. İlerlemeyi
 * skordan değil bulgu SAYISINDAN takip etmek daha doğru — o yüzden
 * `riskBreakdown` sayıları da rapora giriyor.
 */
export function riskScore(lint: LintFinding[], findings: Finding[]): number {
  const s = riskRaw(lint, findings)
  if (s <= 0) return 0
  // 99'da duruyor, 100'de değil. 100 "daha kötüsü olamaz" demek olurdu ve
  // öyle bir şey yok. 99 gören kişi eğrinin tıkandığını bilsin: buradan
  // sonraki çözünürlük yalnızca bulgu SAYILARINDA (riskBreakdown).
  return Math.min(99, Math.round(100 * (1 - Math.exp(-s / 70))))
}

/**
 * Gönderimi engelleyebilecek sorunlar — kural/kontrol başına TEK kayıt.
 *
 * Ölçüt "kesin ve ağır": deterministik lint'in yüksek bulguları (eksik demo
 * hesap, gizlilik adresi, anahtar kelimede marka…) ile modelin KESİN İHLAL
 * dediği ve ikinci gözden geçmiş yüksek bulgular. "Risk" çıktılı kartlar
 * buraya girmez — onlar insan kararı ister, tek başına ret sebebi değildir.
 */
export function engelleyiciSorunlar(lint: LintFinding[], findings: Finding[]): string[] {
  const out = new Set<string>()
  for (const l of lint) if (l.severity === 'high') out.add(l.checkId)
  for (const f of findings) {
    if (f.outcome === 'violation' && f.severity === 'high') out.add(f.ruleId)
  }
  return [...out]
}

/**
 * Raporun tepesindeki hüküm. Sürekli skor DEĞİL, engelleyici sorun sayısı.
 *
 * "Yayına çıkmasını engelleyecek belirgin sorun varsa kırmızı olmalı" —
 * doğru okuma bu ve 0-100'lük bir eğri onu ifade edemiyor. Apple tek bir
 * sebeple reddediyor; dolayısıyla eşik "çok sayıda" değil, BİR.
 */
export function hukum(b: { engelleyici: number; risk: number; kesinKontrol: number }): {
  renk: 'high' | 'medium' | 'low'
  baslik: string
  aciklama: string
} {
  if (b.engelleyici > 0) {
    return {
      renk: 'high',
      baslik: `${b.engelleyici} sorun gönderimi engelleyebilir`,
      aciklama:
        'Bunlar kesin kontrollerden ya da ikinci gözden geçmiş kesin ihlallerden geliyor. ' +
        'Apple tek bir sebeple reddediyor: bu haliyle göndermeden önce hepsini kapat.',
    }
  }
  if (b.risk > 0 || b.kesinKontrol > 0) {
    return {
      renk: 'medium',
      baslik: 'Kesin engel yok, karar gerektiren bulgular var',
      aciklama:
        'Hiçbiri tek başına ret sebebi değil ama insan kararı istiyor. Alıntılara bak, ' +
        'katılmadıklarını geç.',
    }
  }
  return {
    renk: 'low',
    baslik: 'Denetlenen alanlarda engel bulunmadı',
    aciklama:
      'Bu, "onaylanır" demek DEĞİL: raporun "neyi kapsamadı" bölümü kaç kuralın hiç ' +
      'çalışmadığını söylüyor.',
  }
}

/**
 * Skorun neyden oluştuğu. Tek bir sayı "düzeldi mi" sorusunu cevaplamıyor;
 * "3 kesin ihlal → 1 kesin ihlal" cevaplıyor.
 */
export function riskBreakdown(lint: LintFinding[], findings: Finding[]) {
  const say = (p: (x: { severity: string }) => boolean) =>
    lint.filter(p).length + findings.filter(p).length
  return {
    ham: riskRaw(lint, findings),
    // Gönderimi engelleyebilecek FARKLI sorun sayısı.
    //
    // NEDEN AYRI SAYI. 0-100 skoru bir öncelik aracı; "yayına çıkar mı"
    // sorusunu cevaplayamıyor ve sahada cevaplıyormuş gibi okunuyordu:
    // Housify (1 yüksek + 7 orta bulgu) ile Dance AI (3 yüksek bulgu) aynı
    // 76'yı alıyordu. Renk artık sürekli skordan değil bu sayıdan geliyor.
    //
    // NEDEN "FARKLI": kullanıcı bulguyu değil SORUNU düzeltiyor. Aynı kuraldan
    // gelen üç bulgu tek bir düzeltmedir.
    engelleyici: engelleyiciSorunlar(lint, findings).length,
    kesinIhlal: findings.filter((f) => f.outcome === 'violation').length,
    risk: findings.filter((f) => f.outcome !== 'violation').length,
    kesinKontrol: lint.length,
    yuksek: say((x) => x.severity === 'high'),
    orta: say((x) => x.severity === 'medium'),
    dusuk: say((x) => x.severity === 'low'),
  }
}

/**
 * Aynı alan + aynı alıntı için birden fazla kart bulgu ürettiyse tek bulguda
 * topla. Aksi halde tek bir cümle rapora 3 kez düşer ve "listing başına
 * yanlış alarm" metriği şişer — kullanıcı da aracı gürültülü bulur.
 */
/**
 * Sürüm durumunu insan diline çevir — VE raporun nasıl okunacağını söyle.
 *
 * NEDEN VAR. Araç yayında olan, Apple'ın inceleyip ONAYLADIĞI bir listing'i
 * denetleyip "15 felaket sorun" diyordu ve bunu hiçbir yerde belirtmiyordu.
 * Okuyan haklı olarak aracın saçmaladığını düşünüyor.
 *
 * "Apple onayladı" bulguları geçersiz kılmaz — Apple tutarlı denetlemiyor,
 * onaylanmış uygulamalar sonradan kaldırılabiliyor. Ama okuyucunun bu bilgiyi
 * GÖRMESİ gerekiyor, çünkü iki farklı soru soruyor:
 *
 *   yayındaki listing  → "sonraki gönderimde ne başımıza gelir?"
 *   gönderilmemiş taslak → "göndermeden önce neyi düzeltmeliyim?"
 */
export function surumDurumu(durum?: string): { etiket: string; okuma: string } | null {
  if (!durum) return null
  const D: Record<string, [string, string]> = {
    READY_FOR_DISTRIBUTION: ['Yayında', 'Apple bu listing\'i inceleyip onayladı'],
    READY_FOR_SALE: ['Yayında', 'Apple bu listing\'i inceleyip onayladı'],
    PENDING_DEVELOPER_RELEASE: ['Onaylandı, yayın sende', 'Apple onayladı; yayına almayı sen bekletiyorsun'],
    IN_REVIEW: ['İncelemede', 'Apple şu anda bakıyor'],
    WAITING_FOR_REVIEW: ['Sırada', 'Gönderildi, inceleme başlamadı'],
    PREPARE_FOR_SUBMISSION: ['Gönderilmedi', 'Henüz incelemeye girmedi'],
    DEVELOPER_REJECTED: ['Geri çekildi', 'Sen geri çektin, Apple reddetmedi'],
    REJECTED: ['Reddedildi', 'Apple reddetti'],
    METADATA_REJECTED: ['Reddedildi (üstveri)', 'Apple üstveri gerekçesiyle reddetti'],
  }
  const v = D[durum]
  if (!v) return { etiket: durum, okuma: 'bu durum kodu tanınmıyor' }
  const onayli = /READY_FOR|PENDING_DEVELOPER_RELEASE/.test(durum)
  return {
    etiket: v[0],
    okuma: onayli
      ? `${v[1]}. Yani aşağıdakiler GERÇEKLEŞMİŞ bir red değil, SONRAKİ gönderimde ` +
        'risk. Apple tutarlı denetlemiyor: bu sefer geçen bir şey bir dahakine ' +
        'takılabilir, onaylanmış uygulamalar sonradan da kaldırılabiliyor.'
      : `${v[1]}. Aşağıdakiler göndermeden önce bakılacak konular.`,
  }
}

export function dedupeFindings(findings: Finding[]): Finding[] {
  const groups = new Map<string, Finding[]>()
  for (const f of findings) {
    const key = `${f.artifact}::${f.excerpt.trim().toLowerCase()}`
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  const rank = { high: 3, medium: 2, low: 1 } as const
  const birlesik = [...groups.values()].map((g) => {
    const primary = [...g].sort((a, b) => rank[b.severity] - rank[a.severity])[0]!
    if (g.length === 1) return primary
    // Ders bağlarını da BİRLEŞTİR. Yalnızca primary'ninkini almak, birleşen
    // bulgunun getirdiği gerçek red örneklerini sessizce düşürüyordu.
    const lessonIds = [...new Set(g.flatMap((f) => f.lessonIds ?? []))]
    return {
      ...primary,
      // Aynı kart aynı alıntıda iki bulgu ürettiyse id'yi iki kez yazma:
      // raporda "apple-3.1.2 + apple-3.1.2" görünüyordu ve okuyan "iki ayrı
      // kural mı ihlal edilmiş" diye düşünüyordu.
      ruleId: [...new Set(g.map((f) => f.ruleId))].join(' + '),
      ...(lessonIds.length ? { lessonIds } : {}),
    }
  })

  /**
   * İKİNCİ TUR: aynı kural + aynı gerekçe, farklı alıntı.
   *
   * Sahada `apple-3.1.2-subscription-disclosure` DÖRT kez düştü — dördünün de
   * gerekçesi harfiyen aynıydı ("The subscription details are not explicitly
   * stated in the listing"), yalnız alıntıları farklıydı çünkü kart abonelik
   * başına bir bulgu üretiyor. Okuyan dört ayrı sorun sanıyor, skor da dört
   * kat sayıyor. Oysa tek bir eksiklik var: listing abonelik şartlarını
   * yazmıyor.
   *
   * Alıntıları ATMIYORUZ, birleştiriyoruz — her biri kanıt.
   */
  const g2 = new Map<string, Finding[]>()
  for (const f of birlesik) {
    const key = `${f.ruleId}::${f.rationale.trim().toLowerCase().replace(/\s+/g, ' ')}`
    g2.set(key, [...(g2.get(key) ?? []), f])
  }
  return [...g2.values()].map((g) => {
    if (g.length === 1) return g[0]!
    const primary = [...g].sort((a, b) => rank[b.severity] - rank[a.severity])[0]!
    return {
      ...primary,
      excerpt: [...new Set(g.map((f) => f.excerpt).filter(Boolean))].join('\n— '),
      lessonIds: [...new Set(g.flatMap((f) => f.lessonIds ?? []))],
    }
  })
}

export function renderMarkdown(r: Report): string {
  const L: string[] = []
  // Hüküm skordan DEĞİL, engelleyici sorun sayısından geliyor. Sürekli skor
  // "yayına çıkar mı" sorusunu cevaplamıyordu: 1 yüksek + 7 orta bulgusu olan
  // uygulama ile 3 yüksek bulgusu olan aynı 76'yı alıyordu.
  const h = hukum(r.riskBreakdown)
  const isaret = h.renk === 'high' ? '🔴' : h.renk === 'medium' ? '🟡' : '🟢'

  L.push(`# Greenlight — ${r.submission.appName} (${r.submission.platform})`)
  L.push('')
  L.push(`**${isaret} ${h.baslik}**`)
  L.push('')
  L.push(h.aciklama)
  L.push('')
  L.push(
    `Risk skoru ${r.riskScore}/100 — bu bir ÖNCELİK aracı, olasılık değil; ` +
      `ilerlemeyi sorun sayısından takip et (${r.riskBreakdown.engelleyici} engelleyici · ` +
      `${r.riskBreakdown.risk} karar gerektiren · ${r.riskBreakdown.kesinKontrol} kesin kontrol).`,
  )
  L.push(`${r.submission.locale} · corpus \`${r.corpusVersion}\``)
  L.push(
    `${r.lessons.active} aktif ders kullanıldı` +
      (r.lessons.draft ? ` · ${r.lessons.draft} ders onay bekliyor` : '') +
      (r.lessons.coverageGaps.length ? ` · ⚠ ${r.lessons.coverageGaps.length} kapsama boşluğu` : ''),
  )
  L.push(`_${r.generatedAt}_`)
  L.push('')

  if (r.lint.length) {
    L.push(`## Kesin kontroller (${r.lint.length})`)
    L.push('')
    for (const l of r.lint) {
      const madde = lintSection(l.checkId)
      L.push(`${icon(l.severity)} **${l.artifact}** — ${l.message}`)
      L.push(`   ↳ *Düzelt:* ${l.suggestedFix}`)
      // Dayanak görünsün: engelleyici sorunların çoğu buradan geliyor ve
      // okuyanın Apple'ın kendi cümlesine gidebilmesi gerekiyor.
      L.push(`   ↳ \`${l.checkId}\`${madde ? ` · *Apple ${madde}*` : ''}`)
      L.push('')
    }
  }

  const violations = r.findings.filter((f) => f.outcome === 'violation')
  const risks = r.findings.filter((f) => f.outcome === 'risk')

  if (violations.length) {
    L.push(`## İhlaller (${sorunSayisi(violations)} sorun · ${violations.length} bulgu)`)
    L.push('')
    L.push(...kuralaGoreGrupla(violations))
  }

  if (risks.length) {
    L.push(`## İnsan baksın (${sorunSayisi(risks)} sorun · ${risks.length} bulgu)`)
    L.push('')
    L.push(...kuralaGoreGrupla(risks))
  }

  if (!r.lint.length && !r.findings.length) {
    L.push('✅ Otomatik bulgu yok.')
    L.push('')
  }

  // Denetlenmeyeni raporda göstermek zorunlu: aksi halde "bulgu yok" ile
  // "bakılmadı" aynı görünür ve rapor yanlış güven verir.
  if (r.notChecked.length) {
    L.push(`## ⚠ Denetlenmedi (${r.notChecked.length})`)
    L.push('')
    L.push('_Bu kurallar ekran görüntüsü görmeden cevaplanamaz ve çalıştırılmadı._')
    L.push('_Vision destekli bir model kullan ya da görsel dosyalarını sağla._')
    L.push('')
    for (const id of r.notChecked) L.push(`- \`${id}\``)
    L.push('')
  }

  if (r.manual.length) {
    // Sayı, seçim muhasebesindeki kart sayısıyla aynı olmak ZORUNDA değil:
    // buraya kartların yanına geçmiş redlerden çıkan in-app dersler de
    // giriyor. Farkı yazmazsak okuyan iki sayı arasındaki boşluğu göremiyor.
    const kartSayisi = r.selection?.elleKontrol
    const dersSayisi = kartSayisi === undefined ? 0 : r.manual.length - kartSayisi
    const kirilim = dersSayisi > 0 ? ` — ${kartSayisi} kart + ${dersSayisi} ders` : ''
    L.push(`## Elle doğrula (${r.manual.length}${kirilim})`)
    L.push('')
    L.push('_Bu maddeler listing içeriğinden görülemez — uygulamanın kendisinde kontrol edilmeli._')
    L.push('')
    for (const m of r.manual) L.push(...renderManual(m))
  }

  L.push(...renderKapsamDisi(r))

  L.push('---')
  L.push(
    `Seçilen kural: ${r.stats.rulesSelected} · çalıştırılan: ${r.stats.rulesRun} · ` +
      `çalışmayan: ${r.selection?.elenen.length ?? 0} · ` +
      `ham bulgu: ${r.stats.rawFindings} → alıntı doğrulama sonrası: ${r.stats.afterGrounding} → ` +
      `ikinci göz sonrası: ${r.stats.afterVerify}`,
  )

  return L.join('\n')
}

const SEBEP_BASLIK: Record<ElemeSebebi, string> = {
  'meta-bilinmiyor': 'beyan eksik ("?")',
  'beyan-cekilmedi': 'App Store Connect beyanı çekilmedi',
  'beyanla-elendi': 'beyanla elendi',
  'veri-yok': 'veri yok',
  'konu-gecmiyor': 'konusu listing’de geçmiyor',
}

const SEBEP_ANLAM: Record<ElemeSebebi, string> = {
  'meta-bilinmiyor': 'O soru yanıtlanmadı; kart denetime hiç girmedi. Alanı doldur, kart açılır.',
  'beyan-cekilmedi':
    'Bu kartlar Apple’ın kendi kaydına bakıyor (gizlilik etiketi, içerik hakları beyanı) ve o kayıt ' +
    'ÇEKİLMEDİ. Aşağıdaki tabloda karşılıkları yok, çünkü doldurabileceğin bir alan da yok: ' +
    'eksik olan çekim. İlgili uyarı "⚠ Denetlenmedi" bölümünde duruyor.',
  'beyanla-elendi':
    'Kartı kapatan şey senin cevabın. Cevap yanlışsa o kural denetlenmemiş olur ve rapor bunu ' +
    'bulgu olarak göstermez — aşağıdaki gerekçeleri okumaya değer.',
  'veri-yok': 'Kartın baktığı alan bu gönderimde boş (ekran görüntüsü, IAP, review notu…).',
  'konu-gecmiyor':
    'Kartın aradığı kelimeler listing metninde geçmiyor. Bu bir METİN eşleşmesidir, anlam ' +
    'çözümlemesi değil: konu başka kelimelerle anlatılıyorsa kart yine de açılmaz.',
}

/**
 * "Bu denetim neyi kapsamadı" — raporun en çok atlanan yarısı.
 *
 * NEDEN VAR. Kural kitabı 175 karta çıktığında tipik bir denetimde kartların
 * ancak altıda biri çalışıyor. Rapor yalnız "seçilen kural: 28" yazınca bu
 * KAPSAM gibi okunuyordu; oysa geri kalan 147 kartın her birinin ayrı bir
 * çalışmama sebebi var ve bunların ikisi kullanıcının DÜZELTEBİLECEĞİ türden:
 * eksik beyan ve yanlış beyan. Sessiz kalmak, denetimi olduğundan geniş
 * gösterir (belkiPatlarız R3).
 */
function renderKapsamDisi(r: Report): string[] {
  const s = r.selection
  if (!s) return []
  const L: string[] = []

  L.push(`## Bu denetim neyi kapsamadı (${s.elenen.length} kart)`)
  L.push('')
  if (s.filtre?.length) {
    L.push(
      `> ⚠ **KISMİ KOŞU.** Bu denetim \`--kartlar\` ile sınırlandı; yalnız şu kartlar çalıştı: ` +
        `${s.filtre.map((id) => `\`${id}\``).join(', ')}. Aşağıdaki sayılar tam denetimi ` +
        'temsil etmez ve bu rapor "temiz" olarak okunamaz.',
    )
    L.push('')
  }
  // Model turu atlandığında "28 kart modele gitti (0 çalıştı)" cümlesi
  // okuyanı yanıltıyor: kart seçildi ama tur hiç koşmadı.
  const modelNotu =
    s.modele && !s.calisti
      ? `${s.modele} kart modele **gidecekti ama model turu koşmadı** (\`--no-llm\` ya da model erişilemedi)`
      : `${s.modele} kart modele gitti (${s.calisti} tanesi çalıştı)`
  L.push(
    `Kural kitabında ${s.corpus} kart var; ${s.aday} tanesi bu platforma aday oldu. ` +
      `${modelNotu}, ${s.elleKontrol} tanesi elle kontrol maddesi oldu. ` +
      `Kalan ${s.elenen.length} kart **çalışmadı** — sebepleri:`,
  )
  L.push('')

  const sebepler: ElemeSebebi[] = [
    'meta-bilinmiyor', 'beyan-cekilmedi', 'beyanla-elendi', 'veri-yok', 'konu-gecmiyor',
  ]
  for (const sebep of sebepler) {
    const liste = s.elenen.filter((e) => e.sebep === sebep)
    if (!liste.length) continue
    L.push(`**${SEBEP_BASLIK[sebep]} — ${liste.length} kart**`)
    L.push('')
    L.push(`_${SEBEP_ANLAM[sebep]}_`)
    L.push('')
    // "Beyan eksik" ve "beyanla elendi" tek tek yazılır: ikisi de kullanıcının
    // düzeltebileceği şeyler. Ötekiler uzun kuyruk — sayı ve örnek yeter.
    // Tam liste: kullanıcının bir şey YAPABİLECEĞİ sebepler.
    const tamListe = sebep !== 'konu-gecmiyor' && sebep !== 'veri-yok'
    const goster = tamListe ? liste : liste.slice(0, 8)
    for (const e of goster) L.push(`- \`${e.id}\` (${e.section}) — ${e.detay}`)
    if (goster.length < liste.length) L.push(`- _…ve ${liste.length - goster.length} kart daha_`)
    L.push('')
  }

  if (r.beyan?.length) {
    L.push('### Kural seçimini belirleyen beyanlar')
    L.push('')
    L.push('| alan | değer | nereden |')
    L.push('|---|---|---|')
    for (const b of r.beyan) {
      const deger = b.deger === null ? '**?** (bilinmiyor)' : b.deger ? 'evet' : 'hayır'
      L.push(`| ${b.etiket} | ${deger} | ${b.kaynak} |`)
    }
    L.push('')
    L.push(
      '_"?" bırakılan alan kartı denetimden çıkarır ve yukarıda "beyan eksik" olarak görünür. ' +
        '"Hayır" da kartı kapatır — farkı, bunun senin verdiğin bir cevap olması. Toplu olarak ' +
        '"hepsi hayır" işaretlediysen bu tablo, hangi kuralların o yüzden hiç sorulmadığını gösterir._',
    )
    L.push('')
  }

  return L
}

function renderManual(m: ManualCheck): string[] {
  return [
    `☐ **${m.why}** — \`${m.ruleId}\``,
    `   ${m.question}`,
    `   ↳ *${m.source.doc} ${m.source.section}*`,
    '',
  ]
}

/** Kaç ayrı SORUN — kullanıcı bulguyu değil sorunu düzeltiyor. */
function sorunSayisi(findings: Finding[]): number {
  return new Set(findings.map((f) => f.ruleId)).size
}

/**
 * Bulguları kurala göre grupla.
 *
 * NEDEN. `apple-2.3.2-iap-purchase-disclosure` ürün BAŞINA bulgu üretiyor:
 * ölçümde tek bir listing'de 9 bulgu. Dedupe bunları birleştiremiyor çünkü
 * model her ürün için farklı gerekçe yazıyor. Okuyan dokuz ayrı sorun
 * sanıyordu; oysa tek bir eksiklik var ve tek bir düzeltmeyle kapanıyor.
 * Skor tarafı zaten azalan ağırlıkla çözülmüştü, kalan sorun okunabilirlikti.
 *
 * Bulgular ATILMIYOR: her biri ayrı kanıt olarak alt alta duruyor.
 */
function kuralaGoreGrupla(findings: Finding[]): string[] {
  const gruplar = new Map<string, Finding[]>()
  for (const f of findings) gruplar.set(f.ruleId, [...(gruplar.get(f.ruleId) ?? []), f])

  const L: string[] = []
  for (const [ruleId, grup] of gruplar) {
    if (grup.length === 1) {
      L.push(...renderFinding(grup[0]!))
      continue
    }
    const ilk = grup[0]!
    L.push(`${icon(ilk.severity)} **${ilk.artifact}** — \`${ruleId}\` · ${grup.length} yerde`)
    L.push(`   ${ilk.rationale}`)
    L.push(`   ↳ *Düzelt:* ${ilk.suggestedFix}`)
    L.push(`   ↳ *Kanıtlar:*`)
    for (const f of grup) L.push(`   > ${f.excerpt.replace(/\n/g, ' ')}`)
    L.push('')
    for (const f of grup) L.push(...renderExamples(f.examples ?? []))
  }
  return L
}

function renderFinding(f: Finding): string[] {
  const conf = f.trace?.verifyVotes
    ? ` · güven ${f.trace.verifyVotes.agree}/${f.trace.verifyVotes.total}`
    : ''
  return [
    `${icon(f.severity)} **${f.artifact}** — \`${f.ruleId}\`${conf}`,
    `   > ${f.excerpt.replace(/\n/g, ' ')}`,
    `   ${f.rationale}`,
    `   ↳ *Düzelt:* ${f.suggestedFix}`,
    '',
    ...renderExamples(f.examples ?? []),
  ]
}

/**
 * Gerçek red örnekleri. Bir kural atfı "şu maddeye aykırı" der; gerçek bir
 * red örneği "bu tam olarak şu tarihte şu uygulamada reddedildi" der.
 * İkincisi tartışmayı bitirir.
 */
function renderExamples(examples: FindingExample[]): string[] {
  if (!examples.length) return []
  const L: string[] = ['   <details><summary>Benzer gerçek red\'ler (' + examples.length + ')</summary>', '']
  for (const e of examples) {
    const when = e.rejectedAt ? ` · ${e.rejectedAt}` : ''
    L.push(`   **${e.appName}${when} · ${e.guideline}** — ${e.lessonTitle}`)
    if (e.excerpt) L.push(`   > ${e.excerpt.replace(/\n/g, ' ')}`)
    if (e.reviewerText.trim()) L.push(`   Reviewer: ${e.reviewerText.replace(/\n/g, ' ')}`)
    if (e.resolution) L.push(`   Çözüm: ${e.resolution.replace(/\n/g, ' ')}`)
    L.push('')
  }
  L.push('   </details>', '')
  return L
}

function icon(s: 'high' | 'medium' | 'low'): string {
  return s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '⚪'
}
