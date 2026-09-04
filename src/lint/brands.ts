/**
 * Başkasına ait marka adları — anahtar kelime alanının kesin kontrolü.
 *
 * NEDEN LİNT, NEDEN KART DEĞİL. `apple-2.3.7-keyword-misuse` kartı iki ayrı
 * ölçümde toplam 9 ham bulgu üretip HİÇBİRİNİ savunmadan geçiremedi. Sebebi
 * ilk bakışta "kart gürültülü" görünüyordu; verilere bakınca tersi çıktı:
 *
 *   Dance AI  → keywords: "...,tiktok,reels,..."
 *   Creator AI → keywords: "...,viral,trend,...,reels"
 *
 * Bunlar GERÇEK 2.3.7 ihlalleri. Kart onları buluyordu ama alıntı olarak
 * virgüllü dizinin TAMAMINI veriyordu; ikinci göz de "bu dizinin çoğu jenerik"
 * deyip 0/3 ile eliyordu. Yani boru hattı gerçek bulguyu kaybediyordu.
 *
 * Oysa soru zekâ istemiyor: "bu kelime bilinen bir marka mı" bir LİSTE
 * SORGUSU. Deterministik yapıldığında hem kesin, hem bedava, hem de ihlal
 * eden terimi TEK BAŞINA raporluyor — insanın itiraz edebileceği biçimde.
 *
 * LİSTE KAPALI VE KISA TUTULUR: burada tahmin yok. Bir ad eklenecekse
 * gerçekten başkasına ait olduğu bilinmeli; şüpheli olanlar `5.2` kartına
 * (LLM, bağlamla karar) bırakılır.
 */
export const BRANDS: ReadonlyArray<{ term: string; tur: string }> = [
  // Rakip fotoğraf/video uygulamaları
  { term: 'facetune', tur: 'uygulama markası' },
  { term: 'remini', tur: 'uygulama markası' },
  { term: 'faceapp', tur: 'uygulama markası' },
  { term: 'lensa', tur: 'uygulama markası' },
  { term: 'picsart', tur: 'uygulama markası' },
  { term: 'snapseed', tur: 'uygulama markası' },
  { term: 'vsco', tur: 'uygulama markası' },
  { term: 'youcam', tur: 'uygulama markası' },
  { term: 'meitu', tur: 'uygulama markası' },
  { term: 'beautyplus', tur: 'uygulama markası' },
  { term: 'airbrush', tur: 'uygulama markası' },
  { term: 'retrica', tur: 'uygulama markası' },
  { term: 'photoroom', tur: 'uygulama markası' },
  { term: 'canva', tur: 'uygulama markası' },
  { term: 'photoshop', tur: 'uygulama markası' },
  { term: 'lightroom', tur: 'uygulama markası' },
  { term: 'capcut', tur: 'uygulama markası' },
  // Platformlar ve onların içerik formatı adları
  { term: 'instagram', tur: 'platform markası' },
  { term: 'tiktok', tur: 'platform markası' },
  { term: 'snapchat', tur: 'platform markası' },
  { term: 'whatsapp', tur: 'platform markası' },
  { term: 'youtube', tur: 'platform markası' },
  { term: 'facebook', tur: 'platform markası' },
  { term: 'reels', tur: 'platform formatı (Meta)' },
  { term: 'shorts', tur: 'platform formatı (YouTube)' },
  // Tescilli ürünler
  { term: 'botox', tur: 'tescilli ürün' },
  { term: 'restylane', tur: 'tescilli ürün' },
  { term: 'juvederm', tur: 'tescilli ürün' },
]

/** Anahtar kelime dizisini Apple'ın gördüğü gibi böl. */
export function keywordTerms(keywords: string): string[] {
  return keywords.split(',').map((k) => k.trim()).filter(Boolean)
}

/**
 * Terim bir markayı taşıyor mu?
 *
 * Tam eşleşme ya da kelime sınırıyla içerme arıyoruz — "tiktok video" tutar,
 * "shortscut" tutmaz. Alt dize eşleşmesi burada kabul edilemez: "shorts"
 * "shortcuts" içinde geçiyor ve kesin bir bulguyu yalancı alarma çevirirdi.
 */
export function markaBul(term: string): { term: string; tur: string } | null {
  const t = term.toLocaleLowerCase('en')
  for (const b of BRANDS) {
    if (new RegExp(`(^|[^a-z0-9])${b.term}($|[^a-z0-9])`).test(t)) return b
  }
  return null
}
