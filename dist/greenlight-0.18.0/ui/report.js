/**
 * Denetim raporunu çizen ORTAK kod — yan panel ve tam sayfa aynı çıktıyı
 * gösterir. Kod tek olduğu için "panelde başka, sayfada başka yazıyordu"
 * diye bir şey olamaz.
 *
 * DAR ÖNCE: her şey 340px'te okunur olacak şekilde tek sütun. Geniş ekranda
 * aynı bileşenler ferahlıyor, yapı değişmiyor.
 *
 * DEĞİŞMEZ KURAL — EKSİKLİK GİZLENMEZ (belkiPatlarız R2, R3, R16):
 *  - Model turu koşmadıysa bunu EN ÜSTTE, süssüz bir kutuda söyler.
 *  - "Denetlenmedi" listesi skora girmez ve bu açıkça yazılır.
 *  - Bu satırlarda espri, ikon ya da dekoratif kutu yok.
 */
/**
 * "Bilgi eksik" dışındaki eleme sebepleri.
 *
 * Ayrı ayrı duruyorlar çünkü kullanıcı için anlamları farklı: biri yanlış
 * cevaplanmış bir kutu (düzeltilebilir), biri çekilmemiş veri, biri de düz
 * metin eşleşmesine dayanan bir tahmin.
 */
/** Kesin kontrolün dayandığı Apple maddesi — dayanağı görünmeyen bulguya itiraz edilemez. */
const maddeEki = (checkId) => {
  const m = globalThis.GLAudit?.lintSection?.(checkId)
  return m ? ` · Apple ${m}` : ''
}

const ELENME_SEBEPLERI = [
  ['beyan-cekilmedi', 'Beyanı çekilmediği için elenen kartlar',
    'Bu kartlar Apple’ın kendi kaydına bakıyor (gizlilik etiketi, içerik hakları) ve o kayıt çekilmedi. İşaretlenecek bir kutu yok; eksik olan çekim.'],
  ['beyanla-elendi', 'Beyanın yüzünden elenen kartlar',
    'Bu kuralları kapatan şey senin cevabın. Bir kutuyu yanlış işaretlediysen o kural HİÇ denetlenmedi.'],
  ['veri-yok', 'Veri olmadığı için elenen kartlar',
    'Kartın baktığı alan bu gönderimde boş (ekran görüntüsü, IAP, review notu...).'],
  ['konu-gecmiyor', 'Konusu mağaza metninde geçmeyen kartlar',
    'Kartın aradığı kelimeler metinde yok. Bu bir METİN eşleşmesi, anlam çözümlemesi değil.'],
]


const GLReport = (() => {
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props)
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k?.nodeType ? k : String(k))
    return n
  }

  const SEV_TR = { high: 'yüksek', medium: 'orta', low: 'düşük' }

  /** Skor halkası. Renk eşiği tek yerde dursun. */
  /**
   * Renk sürekli skordan DEĞİL, engelleyici sorun sayısından geliyor.
   * "1 yüksek + 7 orta" ile "3 yüksek" aynı skoru alıyordu; okuyan için ikisi
   * aynı şey değil. Apple tek bir sebeple reddediyor, eşik bir.
   */
  function skorHalkasi(skor, engelleyici) {
    const renk = engelleyici > 0 ? 'var(--stop)' : skor >= 35 ? 'var(--hold)' : 'var(--go)'
    return el('div', {
      className: 'gauge',
      style: `--g:${Math.max(0, Math.min(100, skor))};--g-col:${renk}`,
    }, el('div', { className: 'v' }, String(skor)))
  }

  /**
   * @param root    içine çizilecek eleman (içeriği silinir)
   * @param app     depo kaydı (ad için)
   * @param r       GLAudit sonucu
   * @param opts    { probeUrls, dar }  dar = yan panel yerleşimi
   */
  function render(root, app, r, { probeUrls = true, dar = false, ayarlaraGit = null } = {}) {
    root.textContent = ''
    const sub = r.submission

    // --- Model turu koşmadıysa: EN ÜSTTE, ilk okunan şey --------------------
    if (!r.modelRan) {
      const kutu = el('div', { className: 'callout hold' },
        el('div', { className: 't' }, 'Bu rapor eksiktir'),
        el('p', { className: 'small' },
          r.modelError
            ? `Model turu çalışmadı: ${r.modelError}`
            : `Yalnızca kesin kontroller çalıştı. ${r.counts.pending} kart modele sorulacaktı ` +
              'ama model bağlantısı ayarlanmamış.'),
        el('p', { className: 'small muted' },
          'O konular DENETLENMEDİ — "sorun yok" demek değil.'))
      // "Ayarlar" deyip bırakmak kullanıcıyı aramaya bırakıyordu. Çağıran
      // yüzey bir yol verdiyse doğrudan oraya götür.
      if (!r.modelError && ayarlaraGit) {
        kutu.append(el('button', {
          className: 'btn sm', style: 'margin-top:8px',
          textContent: 'Model bağlantısını ayarla',
          onclick: ayarlaraGit,
        }))
      }
      root.append(kutu)
    }

    // --- Bu listing hangi hâlde? -------------------------------------------
    //
    // SKORDAN ÖNCE. Yayında olan, Apple'ın onayladığı bir listing için "15
    // felaket sorun" cümlesi bu bağlam olmadan saçma görünüyor ve okuyan
    // haklı olarak araca güvenmiyor. Bulguları geçersiz kılmıyoruz; nasıl
    // okunacağını söylüyoruz.
    const durum = globalThis.GLAudit?.surumDurumu?.(sub.declarations?.surum?.durum)
    if (durum) {
      const onayli = /Yayında|Onaylandı/.test(durum.etiket)
      root.append(el('div', { className: `callout ${onayli ? 'go' : ''}` },
        el('div', { className: 't' }, `Bu sürüm: ${durum.etiket}`),
        el('p', { className: 'small' }, durum.okuma)))
    }

    // --- Skor ---------------------------------------------------------------
    const bilgi = el('div', { className: 'grow' },
      el('h3', {}, sub.appName || app.name),
      el('div', { className: 'small dim' },
        `${sub.locale} · ${sub.category || 'kategori?'} · ${sub.ageRating || 'yaş?'}`),
      el('div', { className: 'small dim' },
        `${sub.media.screenshots.length} ekran görüntüsü · ${sub.iap.length} ürün`),
      el('div', { className: 'tiny dim mono', style: 'margin-top:3px' },
        `corpus ${r.corpusVersion} · ${r.counts.cards} kart` + dersEki(r)))

    // BİLEŞİM. Tek sayı "düzeldi mi" sorusunu cevaplamıyor: skor eğrisi
    // yukarıda basıklaşıyor, yani 5 sorunla 15 sorun birbirine yakın çıkıyor.
    // İlerlemeyi buradan takip et — "3 kesin ihlal → 1 kesin ihlal".
    const b = r.riskBreakdown
    const bilesim = b
      ? el('div', { className: 'metrics', style: 'margin-top:12px' },
          el('div', { className: `metric${b.engelleyici ? ' stop' : ''}` },
            el('b', {}, String(b.engelleyici ?? 0)), el('span', {}, 'gönderimi engeller')),
          el('div', { className: `metric${b.kesinIhlal ? ' stop' : ''}` },
            el('b', {}, String(b.kesinIhlal)), el('span', {}, 'kesin ihlal')),
          el('div', { className: `metric${b.risk ? ' hold' : ''}` },
            el('b', {}, String(b.risk)), el('span', {}, 'risk')),
          el('div', { className: `metric${b.kesinKontrol ? ' hold' : ''}` },
            el('b', {}, String(b.kesinKontrol)), el('span', {}, 'kesin kontrol')))
      : ''

    root.append(el('div', { className: 'card' },
      el('div', { className: 'between', style: 'align-items:flex-start;gap:14px' },
        skorHalkasi(r.riskScore, b?.engelleyici ?? 0), bilgi),
      bilesim,
      // Skor tek başına yanıltıcı: neyin sayıldığını ve neyin sayılmadığını
      // yanına yazmazsak "60" mı iyi "60" mı kötü belli olmuyor.
      el('p', { className: 'tiny muted', style: 'margin:11px 0 0' },
        'Risk skoru = bulguların ağırlıklı toplamı (yüksek 30, orta 10, düşük 3; ' +
        '"kesin ihlal" tam, "risk" yarım sayılır)' +
        (b ? `; ham toplam ${b.ham}` : '') +
        '. Yukarı doğru basıklaşan bir eğriden geçiyor, 100\'e hiç ulaşmaz — ' +
        '"daha kötüsü olamaz" diye bir şey yok. Olasılık değil, önceliklendirme ' +
        'aracıdır. İLERLEMEYİ SKORDAN DEĞİL yukarıdaki sayılardan takip et. ' +
        `Denetlenmeyen ${r.notChecked.length} konu skora HİÇ girmez.`)))

    const blok = (baslik, alt, cocuklar, sinif) => {
      if (!cocuklar.length) return
      root.append(el('h2', { className: sinif ?? '' }, `${baslik} (${cocuklar.length})`))
      if (alt) root.append(el('p', { className: 'small muted', style: 'margin:0 0 8px' }, alt))
      root.append(el('div', { className: 'card' }, ...cocuklar))
    }

    blok('Eşlemede eksik kalanlar',
      'Bu alanlar okunamadı. Onlara bakan kurallar yanılabilir — boş olması "sorun yok" demek değil.',
      r.warnings.map((w) => el('div', { className: 'note warn small', style: 'margin:4px 0' }, w)),
      'hold')

    // --- Kesin kontroller ---------------------------------------------------
    const satir = (icerik) => el('div', { style: 'padding:10px 0;border-top:1px solid var(--line)' }, ...icerik)
    const lintKarti = (l, i) => {
      const g = [
        el('div', { className: 'row', style: 'margin-bottom:5px' },
          el('span', { className: `chip ${l.severity === 'high' ? 'stop' : 'hold'}` }, SEV_TR[l.severity] ?? l.severity),
          el('span', { className: 'tiny dim mono trunc' },
            `${l.artifact} · ${l.checkId}` + maddeEki(l.checkId))),
        el('div', {}, l.message),
        el('div', { className: 'small muted', style: 'margin-top:4px' }, 'Düzelt: ' + l.suggestedFix),
      ]
      return i === 0 ? el('div', {}, ...g) : satir(g)
    }

    if (r.lint.length) {
      root.append(el('h2', {}, `Kesin kontroller (${r.lint.length})`))
      root.append(el('div', { className: 'card' }, ...r.lint.map(lintKarti)))
    } else {
      root.append(el('h2', {}, 'Kesin kontroller'),
        el('div', { className: 'card' }, el('p', { className: 'muted small' },
          'Kesin kontrollerde bulgu yok.' +
          (r.modelRan ? '' : ' Model turu çalışmadığı için bu, listing temiz demek değildir.'))))
    }

    // --- Model bulguları ----------------------------------------------------
    if (r.modelRan) {
      // Önem derecesi her satırda tekrar etmek yerine başlıkta toplanıyor:
      // aynı bilgi 20 kez yazılınca okunmaz oluyor.
      const KOVA = [
        ['high', 'Felaket problemli şeyler', 'stop'],
        ['medium', 'Problemli şeyler', 'hold'],
        ['low', 'Az buçuk problemli şeyler', 'muted'],
      ]
      const bulguKarti = (f, i) => {
        const g = [
          el('div', { className: 'row', style: 'margin-bottom:5px' },
            el('span', { className: 'tiny dim mono grow trunc' }, `${f.artifact} · ${f.ruleId}`),
            el('span', { className: 'pill' }, `güven ${Math.round((f.confidence ?? 0) * 100)}%`)),
          el('div', {}, f.rationale),
          f.excerpt ? el('blockquote', {}, f.excerpt) : '',
          el('div', { className: 'small muted', style: 'margin-top:4px' }, 'Düzelt: ' + f.suggestedFix),
          ...ornekRedler(f),
        ]
        return i === 0 ? el('div', {}, ...g) : satir(g)
      }

      for (const [sev, baslik, sinif] of KOVA) {
        const grup = r.findings.filter((f) => f.severity === sev)
        if (!grup.length) continue
        root.append(el('h2', { className: sinif }, `${baslik} (${grup.length})`))
        root.append(el('div', { className: 'card' }, ...grup.map(bulguKarti)))
      }
      if (!r.findings.length) {
        root.append(el('h2', {}, 'Model bulguları'),
          el('div', { className: 'card' }, el('p', { className: 'muted small' },
            `${r.stats.rulesRun} kart çalıştı, bulgu çıkmadı. ` +
            `(${r.stats.rawFindings} ham → ${r.stats.afterGrounding} alıntı doğrulandı → ${r.stats.afterVerify} kaldı)`)))
      } else {
        root.append(el('p', { className: 'tiny muted' },
          `${r.stats.rulesRun} kart · ${r.stats.rawFindings} ham bulgu → ` +
          `${r.stats.afterGrounding} alıntısı doğrulandı → ${r.stats.afterVerify} ikinci gözden geçti · ` +
          `${Math.round(r.stats.ms / 1000)} sn`))
      }
    } else {
      blok('Modele sorulacaktı — çalıştırılmadı',
        'Ayarlardan Worker adresini girince bu kartlar çalışır.',
        r.llmPending.map((c) => el('div', { className: 'tiny mono', style: 'padding:2px 0' },
          `${String(c.section)} · ${c.id}`)))
    }

    blok('Bilgi eksik olduğu için elenen kartlar',
      'Bu kartlar bir soruya cevap istiyor ama cevabı bilmiyoruz. Elemek DOĞRU değil, eksik.',
      r.unknownMeta.map((c) => el('div', { className: 'small', style: 'padding:3px 0' },
        el('span', { className: 'mono' }, c.id), ' — bilinmiyor: ', c.reason)),
      'hold')

    // "Bilgi eksik" kovasının yanındaki DİĞER üç sebep. Bunlar da denetlenmemiş
    // konular; özellikle "beyanla elendi" itiraz edilebilir olmalı — yanlış
    // işaretlenmiş tek bir kutu koca bir kuralı sessizce kapatıyor.
    for (const [sebep, baslik, aciklama] of ELENME_SEBEPLERI) {
      const liste = (r.elenen ?? []).filter((e) => e.sebep === sebep)
      if (!liste.length) continue
      blok(`${baslik} (${liste.length})`, aciklama,
        liste.map((e) => el('div', { className: 'small', style: 'padding:3px 0' },
          el('span', { className: 'mono' }, e.id), ' — ', e.detay)),
        'hold')
    }

    blok('Elle kontrol', 'Mağaza kaydından görülemez; yayın öncesi sen bakacaksın.',
      r.manual.map((m) => el('details', {},
        el('summary', {}, m.question),
        el('p', { className: 'small muted', style: 'margin-top:5px' }, m.ruleText),
        el('p', { className: 'tiny mono dim' }, `${m.source.doc} ${m.source.section}`))))

    blok('Denetlenmedi', 'Bu konulara HİÇ bakılmadı; skora da girmiyorlar.',
      r.notChecked.map((t) => el('div', { className: 'small', style: 'padding:2px 0' }, '· ' + t)),
      'hold')

    // Bilerek gönderilmeyen görseller "denetlenmedi" DEĞİL — ayrı ve sakin bir
    // satır olarak yazılıyor, yoksa kullanıcı eksik denetim sanıyor.
    const kuyruk = []
    if (r.gorselNotu) kuyruk.push('Görseller: ' + r.gorselNotu)
    if (!probeUrls) {
      kuyruk.push('Adres canlılık sınaması için ağ izni verilmedi. İzin verirsen ölü ' +
        'gizlilik/destek adresleri de yakalanır — en sık red sebeplerinden biri.')
    }
    for (const t of kuyruk) root.append(el('p', { className: 'tiny muted', style: 'margin-top:8px' }, t))
  }

  /**
   * Raporun METİN hâli — paylaşmak için.
   *
   * NEDEN MARKDOWN: rapor ekip içinde dolaşacak. JSON kimse okumaz, PDF
   * üretmek ağır. Markdown hem Slack'e yapışır hem dosya olarak durur.
   *
   * NEDEN AYNI DOSYADA: rapor yapısını bilen tek yer burası kalsın. Çizim ve
   * metin ayrı dosyalara düşseydi biri güncellenir öteki unutulurdu ve
   * "ekranda gördüğüm rapor ile gönderdiğim rapor farklı" olurdu (R18).
   *
   * MASKELİ: çıktı GLMask'ten geçmiş sonuçla çağrılmalı. Demo hesap şifresi
   * `submission.review.demoAccount.pass` içinde düz metin duruyor (R4).
   */
  function markdown(app, r, { at = null, probeUrls = true } = {}) {
    const sub = r.submission
    const L = []
    const yaz = (...x) => L.push(...x)

    yaz(`# Denetim: ${sub.appName || app.name}`, '')
    yaz(`- Tarih: ${at ? new Date(at).toLocaleString('tr-TR') : '—'}`)
    yaz(`- Uygulama: \`${app.bundleId ?? '—'}\` · id \`${app.id ?? '—'}\``)
    yaz(`- Dil: ${sub.locale} · Kategori: ${sub.category || '?'} · Yaş: ${sub.ageRating || '?'}`)
    yaz(`- Kural kitabı: corpus ${r.corpusVersion} · ${r.counts.cards} kart`)
    const dersMd = dersEki(r)
    if (dersMd) yaz(`- Ortak ders havuzu:${dersMd.replace(' · havuz:', '')}`)
    const durumMd = globalThis.GLAudit?.surumDurumu?.(sub.declarations?.surum?.durum)
    if (durumMd) yaz(`- Sürüm durumu: **${durumMd.etiket}**`)
    const eng = r.riskBreakdown?.engelleyici ?? 0
    yaz(eng > 0
      ? `- **🔴 ${eng} sorun gönderimi engelleyebilir** — Apple tek bir sebeple reddediyor.`
      : '- **🟡 Kesin engel bulunmadı** — kalanlar insan kararı istiyor.', '')
    yaz(`- Risk skoru: ${r.riskScore}/100 (öncelik aracı, olasılık değil)` +
      (r.riskBreakdown
        ? ` — ${r.riskBreakdown.kesinIhlal} kesin ihlal, ${r.riskBreakdown.risk} risk, ` +
          `${r.riskBreakdown.kesinKontrol} kesin kontrol (ham toplam ${r.riskBreakdown.ham})`
        : ''), '')

    if (durumMd) yaz(`> ${durumMd.okuma}`, '')
    yaz('> Risk skoru = bulguların ağırlıklı toplamı (yüksek 30, orta 10, düşük 3;',
        '> "kesin ihlal" tam, "risk" yarım sayılır), yukarı doğru basıklaşan bir',
        '> eğriden geçer ve 100\'e hiç ulaşmaz. Olasılık değil, önceliklendirme',
        '> aracıdır. İlerlemeyi skordan değil bulgu sayılarından takip et —',
        `> denetlenmeyen ${r.notChecked.length} konu skora HİÇ girmez.`, '')

    if (!r.modelRan) {
      yaz('## ⚠ Bu rapor eksiktir', '')
      yaz(r.modelError
        ? `Model turu çalışmadı: ${r.modelError}`
        : `Yalnızca kesin kontroller çalıştı. ${r.counts.pending} kart modele sorulacaktı ` +
          'ama model bağlantısı ayarlanmamış.')
      yaz('', 'O konular **denetlenmedi** — "sorun yok" demek değil.', '')
    }

    const liste = (baslik, satirlar, alt) => {
      if (!satirlar.length) return
      yaz(`## ${baslik} (${satirlar.length})`, '')
      if (alt) yaz(alt, '')
      yaz(...satirlar, '')
    }

    liste('Eşlemede eksik kalanlar', r.warnings.map((w) => `- ${w}`),
      'Bu alanlar okunamadı. Onlara bakan kurallar yanılabilir — boş olması "sorun yok" demek değil.')

    liste('Kesin kontroller', r.lint.map((l) =>
      `- **[${SEV_TR[l.severity] ?? l.severity}]** ${l.message}\n` +
      `  - \`${l.artifact} · ${l.checkId}\`${maddeEki(l.checkId)}\n` +
      `  - Düzelt: ${l.suggestedFix}`))
    if (!r.lint.length) yaz('## Kesin kontroller', '', 'Bulgu yok.', '')

    if (r.modelRan) {
      for (const [sev, baslik] of [['high', 'Felaket problemli şeyler'],
                                   ['medium', 'Problemli şeyler'],
                                   ['low', 'Az buçuk problemli şeyler']]) {
        const grup = r.findings.filter((f) => f.severity === sev)
        liste(baslik, grup.map((f) =>
          `- ${f.rationale}\n` +
          `  - \`${f.artifact} · ${f.ruleId}\` · güven ${Math.round((f.confidence ?? 0) * 100)}%\n` +
          (f.excerpt ? `  - Alıntı: "${String(f.excerpt).replace(/\s+/g, ' ').slice(0, 300)}"\n` : '') +
          `  - Düzelt: ${f.suggestedFix}`))
      }
      if (!r.findings.length) yaz('## Model bulguları', '', `${r.stats.rulesRun} kart çalıştı, bulgu çıkmadı.`, '')
    } else {
      liste('Modele sorulacaktı — çalıştırılmadı',
        r.llmPending.map((c) => `- \`${c.section} · ${c.id}\``))
    }

    liste('Bilgi eksik olduğu için elenen kartlar',
      r.unknownMeta.map((c) => `- \`${c.id}\` — bilinmiyor: ${c.reason}`),
      'Bu kartlar bir soruya cevap istiyor ama cevabı bilmiyoruz. Elemek DOĞRU değil, eksik.')

    for (const [sebep, baslik, aciklama] of ELENME_SEBEPLERI) {
      const kartlar = (r.elenen ?? []).filter((e) => e.sebep === sebep)
      if (!kartlar.length) continue
      liste(`${baslik} (${kartlar.length})`,
        kartlar.map((e) => `- \`${e.id}\` — ${e.detay}`), aciklama)
    }

    liste('Elle kontrol', r.manual.map((m) => `- ${m.question} (${m.source.doc} ${m.source.section})`),
      'Mağaza kaydından görülemez; yayın öncesi insan bakacak.')

    liste('Denetlenmedi', r.notChecked.map((t) => `- ${t}`),
      'Bu konulara HİÇ bakılmadı; skora da girmiyorlar.')

    if (r.gorselNotu) yaz(`_Görseller: ${r.gorselNotu}_`, '')
    if (!probeUrls) {
      yaz('_Adres canlılık sınaması için ağ izni verilmedi; ölü gizlilik/destek adresleri ' +
          'bu raporda yakalanmamış olabilir._', '')
    }

    yaz('---', '', '_Greenlight ile üretildi. Kişisel veri ve sırlar maskelenmiştir._')
    return L.join('\n')
  }

  /**
   * Başlıktaki havuz satırı.
   *
   * "0 aktif ders" ile "havuz bağlı değil" AYRI ŞEYLER ve karıştırılırsa
   * kullanıcı denetimin ders kullandığını sanır. `bagli` bu ikisini ayırıyor;
   * bağlı değilse hiçbir şey yazmıyoruz — yokluğunu iddia etmek de yanlış olur.
   *
   * Eski kayıtlarda alan hiç yok (denetim havuzdan önce koşmuş): boş dön.
   */
  function dersEki(r) {
    const d = r.dersOzeti
    if (!d || !d.bagli) return ''
    const ek = []
    if (d.taslak) ek.push(`${d.taslak} onay bekliyor`)
    if (d.inApp) ek.push(`${d.inApp} in-app`)
    if (d.bosluk) ek.push(`⚠ ${d.bosluk} kapsama boşluğu`)
    return ` · havuz: ${d.aktif} aktif ders` + (ek.length ? ` (${ek.join(', ')})` : '')
  }

  /**
   * Bulgunun altındaki "benzer gerçek red'ler".
   *
   * Bulgunun kendisi modelin YARGISI; bu ise yaşanmış OLGU — aynı maddeden
   * daha önce nasıl reddedildiğimiz. Kapalı `details` içinde duruyor çünkü
   * kartın asıl mesajı düzeltme; örnek, ikna olmayan için.
   *
   * `resolution` özellikle değerli: "neyle geçti" bilgisi, düzeltme önerisini
   * tahminden gerçeğe çeviren tek alan.
   */
  function ornekRedler(f) {
    const ornekler = f.examples ?? []
    if (!ornekler.length) return []
    return [
      el('details', { style: 'margin-top:7px' },
        el('summary', { className: 'tiny muted' }, `Benzer gerçek red'ler (${ornekler.length})`),
        ...ornekler.map((e) => el('div', { className: 'small', style: 'padding:7px 0 0' },
          el('div', { className: 'tiny dim mono' },
            `${e.appName || '?'} · ${e.guideline}${e.rejectedAt ? ' · ' + e.rejectedAt : ''}`),
          e.excerpt ? el('blockquote', {}, e.excerpt) : '',
          el('div', { className: 'small' }, e.reviewerText),
          e.resolution
            ? el('div', { className: 'small go', style: 'margin-top:3px' }, 'Neyle geçti: ' + e.resolution)
            : '')))
    ]
  }

  return { render, markdown, skorHalkasi, SEV_TR }
})()

globalThis.GLReport = GLReport
