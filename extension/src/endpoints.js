/**
 * Uç haritası — neyin çekileceğinin TEK kaynağı.
 *
 * Kanarya turu da (canary.js) asıl toplayıcı da bu listeyi okur. Böylece
 * "yokladığımız uç" ile "çektiğimiz uç" ayrı gerçeklikler olamaz.
 *
 * Her uçta üç alan kritik:
 *   expect  → attributes içinde BEKLEDİĞİMİZ anahtarlar. 200 dönmesi yetmez;
 *             alan adı sessizce değişirse (belkiPatlarız R2) burası yakalar.
 *             İç içe dizi = "şunlardan herhangi biri" (Apple aynı veriyi iki
 *             farklı isimle döndürebiliyor — asc-grab.js'teki `??` bunun izi).
 *   weight  → kritik: yoksa çekim anlamsız, dur.
 *             önemli: eksikse rapor zayıflar ama devam.
 *             ekstra: olsa iyi, yoksa olmaz.
 *   kanit   → true ise bu uç bugün çalışıyor olarak BİLİNİYOR (asc-grab.js
 *             aylardır kullanıyor). false ise resmi API'nin kaynak
 *             isimlerinden türetilmiş TAHMİN — kanaryanın asıl konusu bunlar.
 */
globalThis.__gl ??= {}

globalThis.__gl.endpoints = [
  // --- Oturum -------------------------------------------------------------
  {
    id: 'session',
    label: 'Oturum ve takım',
    kind: 'plain',
    weight: 'kritik',
    kanit: true,
    path: () => '/olympus/v1/session',
    after: (payload, ctx) => {
      ctx.user = payload?.user?.emailAddress ?? ''
      ctx.team = payload?.provider?.name ?? ''
      ctx.teams = (payload?.availableProviders ?? []).map((p) => p?.name).filter(Boolean)
    },
  },

  // --- Uygulamalar --------------------------------------------------------
  {
    id: 'apps',
    label: 'Uygulama listesi',
    weight: 'kritik',
    kanit: true,
    expect: ['name', 'bundleId', 'primaryLocale', 'sku'],
    path: () => '/iris/v1/apps?limit=200',
    after: (r, ctx) => {
      ctx.apps = r.data
      // URL'de bir uygulama açıksa onu yokla — kullanıcı muhtemelen onunla
      // ilgileniyor ve red geçmişi olan uygulamayı bilerek açmış olabilir.
      const fromUrl = location.pathname.match(/\/apps\/(\d+)/)?.[1]
      ctx.app = r.data.find((a) => a.id === fromUrl) ?? r.data[0] ?? null
      ctx.appId = ctx.app?.id ?? ''
      ctx.appName = ctx.app?.attributes?.name ?? ''
    },
  },
  {
    id: 'redTaramasi',
    label: 'Red geçmişi olan uygulamayı bul',
    weight: 'önemli',
    kanit: false,
    // 2026-08-20 kanaryası: apps'ın ilişkileri arasında resolutionCenterThreads
    // DOĞRUDAN duruyor. Yani submission başına filtre atmaya gerek yok —
    // uygulama başına tek istekle "bu uygulamanın kaç yazışması var" sorulur.
    // Hesaptaki uygulamaları tarayıp red geçmişi OLANI seçiyoruz: boş bir
    // uygulamayı yoklamak, uçların gerçekten çalıştığını kanıtlamaz.
    find: async (ctx, iris) => {
      const apps = (ctx.apps ?? []).slice(0, 8)
      const counts = []
      let chosen = null
      let last = null
      let path = ''
      for (const a of apps) {
        path = `/iris/v1/apps/${a.id}/resolutionCenterThreads?limit=200`
        const r = await iris.getAll(path)
        last = r
        if (!r.ok) return { path, result: r, note: 'doğrudan ilişki okunamadı' }
        counts.push(`${a.attributes?.name ?? a.id}:${r.data.length}`)
        if (r.data.length && (!chosen || r.data.length > chosen.threads.length)) {
          chosen = { app: a, threads: r.data }
        }
      }
      if (chosen) {
        ctx.app = chosen.app
        ctx.appId = chosen.app.id
        ctx.appName = chosen.app.attributes?.name ?? chosen.app.id
        ctx.threadList = chosen.threads
        ctx.threadId = chosen.threads[0]?.id ?? ''
      }
      return {
        path,
        result: last,
        note: `${counts.join(', ')} → yoklanan: ${ctx.appName}`,
      }
    },
  },
  {
    id: 'app',
    label: 'Uygulama künyesi',
    weight: 'önemli',
    kanit: false,
    expect: ['name', 'bundleId', 'primaryLocale'],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}` : null),
  },

  // --- appInfo ağacı: ad, altyazı, kategori, yaş sınırı, gizlilik ----------
  {
    id: 'appInfos',
    label: 'appInfos (kategori, yaş sınırı)',
    weight: 'kritik',
    kanit: false,
    expect: ['appStoreState', 'appStoreAgeRating'],
    path: (ctx) =>
      ctx.appId
        ? `/iris/v1/apps/${ctx.appId}/appInfos?include=primaryCategory,secondaryCategory,ageRatingDeclaration`
        : null,
    after: (r, ctx) => {
      ctx.appInfo = r.data[0] ?? null
      ctx.appInfoId = ctx.appInfo?.id ?? ''
      ctx.ageRatingId = ctx.appInfo?.relationships?.ageRatingDeclaration?.data?.id ?? ''
      // include ile gelen kaydı SAKLA: iris bu kaynağı doğrudan id ile
      // vermiyor (403), yalnız üzerinden geldiği uçtan veriyor.
      ctx.ageRatingRecord = r.included?.find((x) => x.type === 'ageRatingDeclarations') ?? null
    },
  },
  {
    id: 'appInfoLocalizations',
    label: 'Ad / altyazı / gizlilik URL (dil dil)',
    weight: 'kritik',
    kanit: false,
    expect: ['locale', 'name', 'subtitle', 'privacyPolicyUrl'],
    path: (ctx) =>
      ctx.appInfoId ? `/iris/v1/appInfos/${ctx.appInfoId}/appInfoLocalizations?limit=200` : null,
  },
  {
    id: 'ageRatingDeclaration',
    label: 'Yaş sınırı beyanı (kullanıcı içeriği kutusu)',
    weight: 'önemli',
    kanit: false,
    // userGeneratedContent kural seçimini doğrudan etkiliyor (check/select.ts).
    expect: ['userGeneratedContent'],
    // 2026-08-20 kanaryası: /ageRatingDeclarations/{id} → 403. iris bu kaynağı
    // doğrudan vermiyor. Önce appInfos'un include'undan al, olmazsa dene.
    find: async (ctx, iris) => {
      if (ctx.ageRatingRecord) {
        return {
          path: '(appInfos → include=ageRatingDeclaration)',
          result: { ok: true, status: 200, data: [ctx.ageRatingRecord], included: [], pages: 1 },
        }
      }
      if (!ctx.ageRatingId) return { path: '(appInfos ilişki vermedi)', result: null }
      const path = `/iris/v1/ageRatingDeclarations/${ctx.ageRatingId}`
      return { path, result: await iris.getAll(path) }
    },
  },

  // --- Sürüm ağacı: açıklama, keywords, promo, yenilikler ------------------
  {
    id: 'appStoreVersions',
    label: 'Tüm sürüm geçmişi',
    weight: 'kritik',
    kanit: false,
    expect: [['appVersionState', 'appStoreState'], 'versionString', 'createdDate'],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/appStoreVersions?limit=200` : null),
    after: (r, ctx) => {
      ctx.versions = r.data
      ctx.version = r.data[0] ?? null
      ctx.versionId = ctx.version?.id ?? ''
    },
  },
  {
    id: 'appStoreVersionLocalizations',
    label: 'Açıklama / keywords / promo / yenilikler',
    weight: 'kritik',
    kanit: false,
    expect: ['locale', 'description', 'keywords', 'promotionalText', 'whatsNew', 'supportUrl'],
    path: (ctx) =>
      ctx.versionId
        ? `/iris/v1/appStoreVersions/${ctx.versionId}/appStoreVersionLocalizations?limit=200`
        : null,
    after: (r, ctx) => {
      ctx.versionLocId = r.data[0]?.id ?? ''
    },
  },
  {
    id: 'appScreenshotSets',
    label: 'Ekran görüntüsü setleri',
    weight: 'önemli',
    kanit: false,
    expect: ['screenshotDisplayType'],
    path: (ctx) =>
      ctx.versionLocId
        ? `/iris/v1/appStoreVersionLocalizations/${ctx.versionLocId}/appScreenshotSets?include=appScreenshots&limit=50`
        : null,
    // Görselin kendisi included içinde geliyor; imageAsset şablonu orada.
    inspect: (r) => r.included?.find((x) => x.type === 'appScreenshots') ?? null,
    inspectExpect: ['imageAsset', 'fileName', 'assetDeliveryState'],
  },
  {
    id: 'appPreviewSets',
    label: 'Önizleme videoları',
    weight: 'ekstra',
    kanit: false,
    expect: ['previewType'],
    path: (ctx) =>
      ctx.versionLocId
        ? `/iris/v1/appStoreVersionLocalizations/${ctx.versionLocId}/appPreviewSets?include=appPreviews&limit=50`
        : null,
  },
  {
    id: 'appStoreReviewDetail',
    label: 'Review notları + demo hesap',
    weight: 'kritik',
    kanit: false,
    expect: ['notes', 'demoAccountRequired', 'demoAccountName'],
    path: (ctx) =>
      ctx.versionId ? `/iris/v1/appStoreVersions/${ctx.versionId}/appStoreReviewDetail` : null,
  },
  {
    id: 'appStoreVersionPhasedRelease',
    label: 'Aşamalı yayın durumu',
    weight: 'ekstra',
    kanit: false,
    expect: ['phasedReleaseState'],
    path: (ctx) =>
      ctx.versionId
        ? `/iris/v1/appStoreVersions/${ctx.versionId}/appStoreVersionPhasedRelease`
        : null,
  },

  // --- Build ve ikon ------------------------------------------------------
  {
    id: 'builds',
    label: 'Build geçmişi',
    weight: 'önemli',
    kanit: false,
    expect: ['version', 'uploadedDate', 'expired'],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/builds?limit=25` : null),
    after: (r, ctx) => {
      ctx.buildId = r.data[0]?.id ?? ''
    },
  },
  {
    id: 'buildIcons',
    label: 'Uygulama ikonu (build içinde)',
    weight: 'önemli',
    kanit: false,
    expect: ['iconAsset', 'iconType'],
    path: (ctx) => (ctx.buildId ? `/iris/v1/builds/${ctx.buildId}/icons` : null),
  },

  // --- Red geçmişi: projenin asıl hazinesi --------------------------------
  {
    id: 'reviewSubmissions',
    label: 'Gönderim geçmişi',
    weight: 'kritik',
    kanit: true,
    expect: ['state', 'platform', 'submittedDate'],
    path: (ctx) =>
      ctx.appId
        ? `/iris/v1/apps/${ctx.appId}/reviewSubmissions?include=appStoreVersionForReview&limit=200`
        : null,
    after: (r, ctx) => {
      // Red yaşamış olanı öne al — thread'i olan bunlar.
      ctx.submissions = [...r.data].sort(
        (a, b) =>
          (b.attributes?.state === 'UNRESOLVED_ISSUES' ? 1 : 0) -
          (a.attributes?.state === 'UNRESOLVED_ISSUES' ? 1 : 0),
      )
      ctx.submissionId = ctx.submissions[0]?.id ?? ''
    },
  },
  {
    id: 'reviewSubmissionItems',
    label: 'Gönderim kalemleri',
    weight: 'ekstra',
    kanit: false,
    expect: ['state'],
    path: (ctx) =>
      ctx.submissionId ? `/iris/v1/reviewSubmissions/${ctx.submissionId}/items?limit=50` : null,
  },
  {
    id: 'resolutionCenterThreads',
    label: 'Resolution Center yazışmaları',
    weight: 'kritik',
    kanit: true,
    expect: ['state'],
    // Önce doğrudan ilişkiden gelen liste (redTaramasi). Yoksa eski yol:
    // gönderim başına filtre — her gönderimde yazışma olmaz, bulana kadar gez.
    find: async (ctx, iris) => {
      if (ctx.threadList?.length) {
        return {
          path: '(apps → resolutionCenterThreads doğrudan ilişkisi)',
          result: { ok: true, status: 200, data: ctx.threadList, included: [], pages: 1 },
        }
      }
      const subs = (ctx.submissions ?? []).slice(0, 6)
      if (!subs.length) return { path: '(gönderim yok)', result: null }
      let last = null
      let path = ''
      for (const sub of subs) {
        path = `/iris/v1/resolutionCenterThreads?filter[reviewSubmission]=${sub.id}&include=reviewSubmission`
        const r = await iris.getAll(path)
        last = r
        if (!r.ok) break
        if (r.data.length) {
          ctx.thread = r.data[0]
          ctx.threadId = r.data[0].id
          break
        }
      }
      return { path, result: last }
    },
  },
  {
    id: 'resolutionCenterMessages',
    label: "Apple'ın red mesajları",
    weight: 'kritik',
    kanit: true,
    expect: ['messageBody', 'createdDate'],
    path: (ctx) =>
      ctx.threadId
        ? `/iris/v1/resolutionCenterThreads/${ctx.threadId}/resolutionCenterMessages` +
          '?include=fromActor,rejections&limit[rejections]=200'
        : null,
    // fromActor olmadan "bunu Apple mı yazdı, biz mi" ayrımı yapılamaz.
    inspect: (r) => r.included?.find((x) => /actor/i.test(x.type)) ?? null,
    inspectExpect: [['actorType', 'name']],
  },
  {
    id: 'reviewRejections',
    label: 'Red sebepleri (yapısal)',
    weight: 'önemli',
    kanit: true,
    // İşte R2'nin doğduğu yer: aynı veri iki farklı isimle gelebiliyor.
    expect: [['reasons', 'reviewRejectionReasons']],
    path: (ctx) =>
      ctx.threadId
        ? `/iris/v1/reviewRejections?filter[resolutionCenterMessage.resolutionCenterThread]=${ctx.threadId}` +
          '&include=rejectionAttachments&limit=200'
        : null,
  },

  // --- Para: abonelik ve tek seferlik ürünler -----------------------------
  {
    id: 'subscriptionGroups',
    label: 'Abonelik grupları',
    weight: 'önemli',
    kanit: false,
    expect: ['referenceName'],
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/subscriptionGroups?include=subscriptions&limit=50` : null,
    after: (r, ctx) => {
      ctx.subscriptionId = r.included?.find((x) => x.type === 'subscriptions')?.id ?? ''
    },
    inspect: (r) => r.included?.find((x) => x.type === 'subscriptions') ?? null,
    inspectExpect: ['productId', 'name', 'subscriptionPeriod'],
  },
  {
    id: 'subscriptionLocalizations',
    label: 'Abonelik metinleri',
    weight: 'önemli',
    kanit: false,
    expect: ['locale', 'name', 'description'],
    path: (ctx) =>
      ctx.subscriptionId
        ? `/iris/v1/subscriptions/${ctx.subscriptionId}/subscriptionLocalizations?limit=50`
        : null,
  },
  {
    id: 'subscriptionPrices',
    label: 'Abonelik fiyatı',
    weight: 'önemli',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.subscriptionId
        ? `/iris/v1/subscriptions/${ctx.subscriptionId}/prices` +
          '?include=subscriptionPricePoint&filter[territory]=USA&limit=10'
        : null,
    inspect: (r) => r.included?.find((x) => x.type === 'subscriptionPricePoints') ?? null,
    inspectExpect: ['customerPrice'],
  },
  {
    id: 'introductoryOffers',
    label: 'Ücretsiz deneme / tanıtım teklifi',
    weight: 'önemli',
    kanit: false,
    expect: ['offerMode', 'duration'],
    path: (ctx) =>
      ctx.subscriptionId
        ? `/iris/v1/subscriptions/${ctx.subscriptionId}/introductoryOffers?limit=20`
        : null,
  },
  {
    id: 'inAppPurchasesV2',
    label: 'Tek seferlik ürünler',
    weight: 'önemli',
    kanit: false,
    expect: ['productId', 'inAppPurchaseType', 'name'],
    path: (ctx) =>
      ctx.appId
        ? `/iris/v1/apps/${ctx.appId}/inAppPurchasesV2?include=inAppPurchaseLocalizations&limit=200`
        : null,
    after: (r, ctx) => {
      ctx.iapId = r.data[0]?.id ?? ''
    },
  },

  // --- Tahmin uçları: hepsi doğrulanmamış, hiçbiri kritik değil -----------
  // --- İlişki grafiğinden keşfedilenler (2026-08-20) ---------------------
  {
    id: 'dataUsages',
    label: 'App Privacy etiketleri (gizlilik beyanı)',
    weight: 'önemli',
    kanit: false,
    // Apple 5.1.1/5.1.2'den bu beyanla listing'in uyuşmadığı için reddediyor.
    // Bugünkü .p8 yolunda bu veri HİÇ yok.
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/dataUsages?limit=200` : null),
  },
  {
    id: 'dataUsagePublishState',
    label: 'Gizlilik beyanı yayın durumu',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/dataUsagePublishState` : null),
  },
  {
    id: 'endUserLicenseAgreement',
    label: 'EULA (özel lisans sözleşmesi)',
    weight: 'önemli',
    kanit: false,
    // 3.1.2: abonelikte EULA bağlantısı zorunlu. Özel EULA varsa burada.
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/endUserLicenseAgreement` : null),
  },
  {
    id: 'versionSearchKeywords',
    label: 'Arama anahtar kelimeleri (yeni sistem)',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.versionLocId
        ? `/iris/v1/appStoreVersionLocalizations/${ctx.versionLocId}/searchKeywords?limit=100`
        : null,
  },
  {
    id: 'appStoreVersionStateChanges',
    label: 'Sürüm durum geçmişi (ne zaman ne oldu)',
    weight: 'önemli',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.versionId ? `/iris/v1/appStoreVersions/${ctx.versionId}/appStoreVersionStateChanges?limit=200` : null,
  },
  {
    id: 'appStoreVersionSubmission',
    label: 'Sürüm gönderim kaydı',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.versionId ? `/iris/v1/appStoreVersions/${ctx.versionId}/appStoreVersionSubmission` : null,
  },
  {
    id: 'versionAgeRatingDeclaration',
    label: 'Sürüm bazında yaş sınırı beyanı',
    weight: 'ekstra',
    kanit: false,
    expect: ['userGeneratedContent'],
    path: (ctx) =>
      ctx.versionId ? `/iris/v1/appStoreVersions/${ctx.versionId}/ageRatingDeclaration` : null,
  },
  {
    id: 'displayableVersions',
    label: 'Görünen sürümler (yayın geçmişi)',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/displayableVersions?limit=200` : null),
  },
  {
    id: 'iapPriceSchedule',
    label: 'IAP fiyat çizelgesi',
    weight: 'önemli',
    kanit: false,
    // Bugünkü .p8 yolu IAP fiyatlarını okuyamıyor ve hepsine price=0 diyor
    // (fetch/asc.ts → "priceless"). Fiyata bakan kurallar bu yüzden yanılıyor.
    expect: [],
    path: (ctx) =>
      ctx.iapId ? `/iris/v1/inAppPurchases/${ctx.iapId}/iapPriceSchedule?include=manualPrices` : null,
  },
  {
    id: 'iapPricePoints',
    label: 'IAP fiyat noktaları',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.iapId
        ? `/iris/v1/inAppPurchases/${ctx.iapId}/pricePoints?filter[territory]=USA&limit=5`
        : null,
  },
  {
    id: 'iapReviewScreenshot',
    label: 'IAP inceleme ekran görüntüsü',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.iapId ? `/iris/v1/inAppPurchases/${ctx.iapId}/appStoreReviewScreenshot` : null,
  },
  {
    id: 'accessibilityDeclarations',
    label: 'Erişilebilirlik beyanları',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/accessibilityDeclarations?limit=20` : null,
  },
  {
    id: 'promotedPurchases',
    label: 'Öne çıkarılan satın almalar',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/promotedPurchases?limit=20` : null),
  },
  {
    id: 'appPriceSchedule',
    label: 'Uygulama fiyat çizelgesi',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/appPriceSchedule?include=baseTerritory,manualPrices` : null,
  },
  {
    id: 'appAvailability',
    label: 'Ülke kullanılabilirliği',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/appAvailabilityV2` : null),
  },
  {
    id: 'appEvents',
    label: 'Uygulama içi etkinlikler',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/appEvents?limit=20` : null),
  },
  {
    id: 'appCustomProductPages',
    label: 'Özel ürün sayfaları',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/appCustomProductPages?limit=20` : null),
  },
  {
    id: 'appStoreVersionExperiments',
    label: 'Ürün sayfası deneyleri',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/appStoreVersionExperimentsV2?limit=20` : null,
  },
  {
    id: 'customerReviews',
    label: 'Kullanıcı yorumları',
    weight: 'ekstra',
    kanit: false,
    expect: ['rating', 'body', 'createdDate'],
    // Ağır uç: kanaryada yalnız 5 kayıt istiyoruz, "yaşıyor mu" sorusu için yeter.
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/customerReviews?limit=5&sort=-createdDate` : null,
  },
  {
    id: 'appEncryptionDeclarations',
    label: 'Şifreleme beyanları',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) =>
      ctx.appId ? `/iris/v1/apps/${ctx.appId}/appEncryptionDeclarations?limit=10` : null,
  },
  {
    id: 'betaAppReviewDetail',
    label: 'TestFlight inceleme detayı',
    weight: 'ekstra',
    kanit: false,
    expect: [],
    path: (ctx) => (ctx.appId ? `/iris/v1/apps/${ctx.appId}/betaAppReviewDetail` : null),
  },
]
