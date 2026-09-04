/**
 * Elle işaretlenen alanlar — TEK KAYNAK.
 *
 * NEDEN AYRI DOSYA: bu alanlar altı yerde birden geçiyordu (tip tanımı,
 * dosya deposu, komut satırı bayrakları, kural seçici, şema, arayüz). Alan
 * eklemek altı dosyaya dokunmak demekti ve bir tanesini unutmak sessiz bir
 * kayıp üretiyordu: arayüzde işaretlenen kutunun karşılığı olmayan bir bayrak,
 * ya da hiçbir yerde sorulmayan bir koşul. Nitekim `hasThirdPartyLogin` kodda
 * vardı ama arayüzde HİÇ görünmüyordu.
 *
 * NEDEN TANIM METNİ DE BURADA: "kullanıcı içeriği" gibi bir etiket tek başına
 * üç ayrı şeye okunabiliyor (başkasına görünmek / dışa aktarmak / üçüncü
 * tarafa veri vermek). Yanlış işaretlenen bir bayrak yanlış kural setine yol
 * açıyor ve bu, raporun sessizce yanlış olmasının en ucuz yolu. Tanım, sınır
 * durumları ve sonucu alanın yanında duruyor — arayüz bunları olduğu gibi
 * gösteriyor.
 *
 * BU DOSYADA G/Ç YOK: eklenti paketine de giriyor, `node:fs` sızarsa paket
 * tarayıcıda patlar (build-ext bunu hata sayıyor).
 */

export type MetaGroup = 'icerik' | 'is-modeli' | 'tur'

export interface MetaField {
  key: string
  label: string
  group: MetaGroup
  /** Komut satırı bayrağı: `--ugc` açar, `--no-ugc` kapatır. */
  flag: string
  /** Etiketin yanında duran tek satırlık soru. */
  tldr: string
  /** Alanın tanımı ve sınırı. */
  what: string
  /** "Evet" sayılan somut durumlar. */
  yes: readonly string[]
  /** "Hayır" sayılan, karıştırılması kolay durumlar. */
  no: readonly string[]
  /** Sınırda kalanlar için ek not. */
  note?: string
  /** Evet dendiğinde hangi kurallar devreye girer. */
  effect: string
  /** Değer nereden gelir; App Store Connect biliyor mu. */
  source: string
}

export const META_GROUPS: ReadonlyArray<{ id: MetaGroup; title: string; hint: string }> = [
  {
    id: 'icerik',
    title: 'Kullanıcılar ve içerik',
    hint: 'Uygulamanın kimden ne aldığı ve kime ne gösterdiği.',
  },
  {
    id: 'is-modeli',
    title: 'İş modeli ve para',
    hint: 'Ödeme kurallarının hangi dalına düştüğün. Çoğu uygulamada üçü de “hayır”.',
  },
  {
    id: 'tur',
    title: 'Uygulama türü',
    hint: 'Apple’ın ayrı kural seti yazdığı özel türler. Çoğu uygulamada üçü de “hayır”.',
  },
]

export const META_FIELDS = [
  // ---------------------------------------------------------------------
  // Kullanıcılar ve içerik
  // ---------------------------------------------------------------------
  {
    key: 'requiresLogin',
    label: 'Giriş gerekiyor',
    group: 'icerik',
    flag: 'requires-login',
    tldr: 'Ana işlevi görmek için hesap şart mı?',
    what:
      'Reviewer uygulamayı ilk açtığında, ana işleve ulaşmak için hesap açmak ya da giriş yapmak zorunda mı? ' +
      'Ölçü “giriş ekranı var mı” değil — ölçü, giriş yapmadan uygulamanın işini görüp göremediği.',
    yes: [
      'Açılışta atlanamayan kayıt/giriş duvarı var',
      'Ana özellik yalnızca hesapla çalışıyor (üretim, kaydetme, geçmiş)',
      'Yalnızca sosyal girişle giriliyor (Google, Facebook, X, Meta)',
      'SMS/OTP, davet kodu ya da kurumsal SSO gerekiyor',
    ],
    no: [
      'Giriş isteğe bağlı; misafir olarak tüm ana işlev kullanılabiliyor',
      'Hesap yalnızca ikincil bir şey için (bulut yedeği, cihazlar arası eşitleme)',
      'Sadece satın alma sırasında Apple hesabı isteniyor — o senin giriş duvarın değil',
    ],
    effect:
      'Review notlarında çalışan bir demo hesap aranır; yoksa yüksek önemli bulgu üretilir ' +
      '(Apple 2.1 — en sık red sebeplerinden). 5.1.1(v) “önemli hesap özelliği yoksa girişsiz kullandır” ' +
      'kartı da bu alana bakar.',
    source:
      'API ipucu: App Review Information’daki “Sign-In Required” kutusu. İşaretli değilse ASC bir şey söylemez, alan “?” kalır.',
  },
  {
    key: 'hasThirdPartyLogin',
    label: 'Üçüncü taraf giriş',
    group: 'icerik',
    flag: 'third-party-login',
    tldr: 'Google/Facebook/X gibi bir servisle giriş sunuluyor mu?',
    what:
      'Kullanıcı uygulamadaki ANA hesabını üçüncü taraf ya da sosyal bir servisle mi kuruyor? ' +
      '“Giriş gerekiyor”dan ayrı bir soru: 4.8 yalnızca sosyal/üçüncü taraf giriş sunanları bağlar, ' +
      'yalnız e-posta+şifre ile giriş yaptıran uygulama muaftır.',
    yes: [
      'Giriş ekranında “Continue with Google / Facebook / X / LinkedIn / Amazon / WeChat” var',
      'Kayıt yalnızca sosyal hesapla yapılabiliyor',
    ],
    no: [
      'Yalnız e-posta+şifre ya da telefon+OTP',
      'Yalnız kendi kurumsal hesap sistemin (okul/şirket SSO)',
      'Devlet ya da endüstri destekli kimlik sistemi',
      'Uygulama zaten belirli bir servisin istemcisi ve kullanıcı doğrudan o servise giriyor (ör. e-posta istemcisi)',
    ],
    effect:
      'Apple 4.8 kartı açılır: sosyal giriş sunan uygulama, veri toplamayı ad+e-postayla sınırlayan, ' +
      'e-postayı gizli tutmaya izin veren ve rıza olmadan reklam için etkileşim toplamayan eşdeğer bir ' +
      'seçenek de sunmak zorunda (pratikte Apple ile Giriş).',
    source:
      'ASC’de yok: “Sign-In Required” yalnızca giriş gerektiğini söyler, hangi yöntemlerin sunulduğunu değil.',
  },
  {
    key: 'allowsAccountCreation',
    label: 'Hesap açılabiliyor',
    group: 'icerik',
    flag: 'account-creation',
    tldr: 'Kullanıcı uygulama içinde kendine hesap açabiliyor mu?',
    what:
      '“Giriş gerekiyor”dan ayrı bir soru: giriş ZORUNLU olmasa bile kullanıcı hesap AÇABİLİYORSA ' +
      '5.1.1(v) devreye giriyor. Ölçü, uygulamanın bir hesap oluşturma akışı sunması.',
    yes: [
      'Kayıt ol / Sign up ekranı var',
      'Sosyal girişle ilk girişte arka planda hesap oluşuyor',
      'Misafir kullanım var ama istenirse kalıcı hesaba dönüştürülebiliyor',
    ],
    no: [
      'Hiç hesap kavramı yok; her şey cihazda duruyor',
      'Hesaplar yalnızca kurum tarafından açılıyor, kullanıcı kendi hesabını açamıyor',
    ],
    effect:
      '5.1.1(v) hesap SİLME kartı açılır: hesap açtırabilen uygulama, hesabın uygulama İÇİNDEN silinmesini ' +
      'de sağlamak zorunda — bu tek başına çok sık red sebebi. 1.6 (veri güvenliği) kartı da buna bağlı.',
    source: 'ASC’de yok — elle işaretlenir.',
  },
  {
    key: 'hasUserGeneratedContent',
    label: 'Kullanıcı içeriği',
    group: 'icerik',
    flag: 'ugc',
    tldr: 'Kullanıcıların ürettiği içerik, uygulama içinde başka kullanıcılara ulaşıyor mu?',
    what:
      'Apple’ın “user-generated content” dediği şey dar bir tanım: kullanıcıların yazdığı ya da yüklediği ' +
      'içeriğin UYGULAMANIN İÇİNDE başka kullanıcılara görünmesi. Ölçü “kullanıcı içerik üretiyor mu” değil, ' +
      '“içerik başka bir kullanıcıya ulaşıyor mu”. Üçüncü taraflarla veri paylaşımı bu alanın konusu değil — ' +
      'o gizlilik/veri toplama tarafı ve ayrı kurallarla denetleniyor.',
    yes: [
      'Yorum, değerlendirme, forum, sohbet/DM, grup',
      'Herkese açık profil; serbest yazılan kullanıcı adı, biyografi, avatar',
      'Akış/keşfet: kullanıcıların yüklediği foto, video ya da sesi başkaları görüyor',
      'Ortak galeri, şablon/preset paylaşımı — başkalarının üretimini görebildiğin her yer',
    ],
    no: [
      'İçerik yalnızca üreten kişiye görünüyor (yerel not, kendi galerisi, kendi düzenlemesi)',
      'Çıktı yalnızca “Paylaş” ile Instagram/WhatsApp’a dışa aktarılıyor — bu dışa aktarma, uygulama içi UGC değil',
      'Yalnızca sana ulaşan destek formu ya da geri bildirim metni',
      'Sunucuna yüklenen ama hiçbir kullanıcıya görünmeyen bulut yedeği',
    ],
    note:
      'Sınırda kalanlar: içerik varsayılan olarak gizli ama uygulama içinde paylaşılabiliyorsa evet say — ' +
      'Apple özelliğin varlığına bakıyor, kaç kişinin kullandığına değil.',
    effect:
      'Yaş sınırı 4+/Everyone ise doğrudan yüksek önemli bulgu üretilir ve yaş sınırı tutarlılık kartı sıkılaşır. ' +
      'Apple 1.2 gereği ayrıca beklenenler: içerik filtreleme, şikayet/bildir mekanizması, kullanıcı engelleme ' +
      've yayınlanmış bir iletişim adresi. 1.2.1 (creator içeriği) kartı da buna bağlı.',
    source:
      'API’den okunuyor: yaş sınırı beyanındaki “user-generated content” kutusu. Bu gerçeğin kendisi değil BEYANI — ' +
      'Apple da denetimi bu beyana göre yaptığı için denetlenecek doğru değer bu.',
  },
  {
    key: 'generatesAiContent',
    label: 'AI içerik üretiyor',
    group: 'icerik',
    flag: 'ai-content',
    tldr: 'Üretken bir model kullanıcı için yeni içerik mi üretiyor?',
    what:
      'Uygulama, kullanıcının isteğiyle üretken bir modelle YENİ içerik (görsel, video, metin, ses) üretiyor mu? ' +
      'Modelin cihazda mı, senin sunucunda mı, yoksa bir API’de mi (OpenAI, Gemini, Replicate) olduğu fark etmez: ' +
      'kullanıcının gördüğü çıktı modelden çıkıyorsa evet.',
    yes: [
      'AI ile görsel/avatar/arka plan üretimi, nesne ekleme-silme (“generative fill”)',
      'Yüz veya vücut değiştirme, yaşlandırma, stil transferi',
      'Sohbet botu; metin yazma, özetleme, çeviri asistanı',
      'AI ses klonlama, müzik/şarkı üretimi',
    ],
    no: [
      'Deterministik filtre, kırpma, renk düzeltme, hazır şablon',
      'Sınıflandıran veya etiketleyen ama içerik üretmeyen model (nesne tanıma, OCR)',
      'Yalnızca öneri sıralayan model',
      'AI’dan sadece pazarlama metninde söz ediliyor — o zaman da 2.3.1 “abartılı iddia” riski ayrıca doğar',
    ],
    effect:
      'AI ifşa kartları, üretilen içeriğin kullanıcı içeriği sayılması (1.2) ve yaş sınırı tutarlılık kartı ' +
      'devreye girer: gerçekçi insan görüntüsü ya da vücut değiştirme üreten bir uygulama 4+ olamaz, ' +
      'üretilen içerik için moderasyon ve şikayet yolu beklenir. Review notlarında AI’ın anlatılması da (2.3.1) buna bağlı.',
    source:
      'App Store Connect’te böyle bir alan yok — yaş beyanının tamamı tarandı, AI’a dair tek alan yok. Yalnızca senden gelir.',
  },
  {
    key: 'usesCameraOrMicrophone',
    label: 'Kamera / mikrofon',
    group: 'icerik',
    flag: 'camera-mic',
    tldr: 'Uygulama kayıt alıyor mu (kamera, mikrofon, ekran)?',
    what:
      'Uygulama cihazın kamerasına, mikrofonuna, ekran kaydına ya da kullanıcı etkinliğini kaydeden başka bir ' +
      'yola erişiyor mu? Galeriden hazır dosya seçmek tek başına bunu tetiklemez; ölçü, CANLI kayıt alınması.',
    yes: [
      'Fotoğraf/video çekimi, belge ya da QR tarama, yüz takibi',
      'Ses kaydı, sesli mesaj, sesli arama, sesli komut',
      'Ekran kaydı ya da kullanıcı davranışını kaydeden oturum kaydı',
    ],
    no: [
      'Yalnız galeriden hazır fotoğraf seçiliyor',
      'Yalnız cihazdaki dosyalar okunuyor',
      'Ses ÇALIYOR ama kaydetmiyor',
    ],
    effect:
      '2.5.14 (kayıt için açık rıza + görünür/duyulur gösterge) ve 5.1.1(ii)-(iv) (izin metinleri, veri ' +
      'asgariliği, izin vermeyene alternatif) kartları açılır.',
    source: 'ASC listing verisinde yok; izin metinleri binary’de duruyor, biz binary okumuyoruz.',
  },
  {
    key: 'usesLocation',
    label: 'Konum kullanımı',
    group: 'icerik',
    flag: 'location',
    tldr: 'Uygulama konum servislerini kullanıyor mu?',
    what:
      'Uygulama cihazın konumunu istiyor mu? Arka planda mı yoksa yalnız kullanılırken mi olduğu fark etmez; ' +
      'ölçü, konum izninin istenmesi.',
    yes: [
      'Harita, navigasyon, “yakınımdakiler”',
      'Konuma göre içerik, fiyat ya da kullanılabilirlik',
      'Arka planda konum takibi, coğrafi çit (geofence)',
    ],
    no: [
      'Kullanıcı şehri/adresi elle yazıyor',
      'IP’den kaba ülke tahmini yapılıyor, konum izni istenmiyor',
    ],
    effect:
      '5.1.5 kartı açılır: konum yalnızca işlevle doğrudan ilgiliyse kullanılabilir, amacı uygulama içinde ' +
      'açıklanmalı, acil servis ya da araç/hava aracı kontrolü için kullanılamaz.',
    source: 'ASC’de yok.',
  },
  {
    key: 'hasHealthFeatures',
    label: 'Sağlık / tıbbi işlev',
    group: 'icerik',
    flag: 'health',
    tldr: 'Sağlık, fitness ya da tıbbi veriyle mi çalışıyor?',
    what:
      'Uygulama sağlık, fitness ya da tıbbi veri topluyor, ölçüyor ya da yorumluyor mu? HealthKit kullanmak şart ' +
      'değil: adım, uyku, kalp atışı, kilo, adet döngüsü, ilaç ya da semptom takibi de bu kapsamda.',
    yes: [
      'HealthKit, Motion & Fitness, Clinical Health Records kullanımı',
      'Kalp atışı, tansiyon, uyku, kilo, döngü takibi',
      'Semptom, ilaç, diyet ya da terapi takibi',
      'Sağlıkla ilgili insan araştırması (çalışma, anket)',
    ],
    no: [
      'Genel amaçlı not/alışkanlık uygulaması, sağlık ölçümü yok',
      'Yalnızca sağlık haberi/içeriği okutuyor, veri toplamıyor',
    ],
    effect:
      '1.4.1 (doğruluk iddiası ve yöntemin açıklanması; cihaz sensörüyle tansiyon/şeker ölçme iddiası yasak), ' +
      '5.1.3 (sağlık verisi reklam/pazarlama için kullanılamaz, iCloud’da tutulamaz) ve 5.1.2(vi) kartları açılır.',
    source: 'ASC’de yok.',
  },
  {
    key: 'targetsKids',
    label: 'Çocuklara yönelik',
    group: 'icerik',
    flag: 'kids',
    tldr: 'Kids Category’de mi, ya da ana kitlesi çocuklar mı?',
    what:
      'Uygulama App Store’un Kids Category’sinde mi? Ya da kategoride olmasa bile ana kitlesi çocuklar mı? ' +
      'İkisi de aynı yükümlülükleri getiriyor: 1.3 kategoriyi, 5.1.4 “çocuklara yönelik” olmayı bağlıyor.',
    yes: [
      'Kids Category seçili ya da yaş bandı (5 ve altı / 6-8 / 9-11) girilmiş',
      'İçerik, dil ve görseller açıkça çocuğa göre: boyama, çocuk oyunu, okul öncesi eğitim',
    ],
    no: [
      'Kullanıcısı ebeveyn olan çocuk takip/gelişim uygulaması',
      'Genel kitle: çocuklar da kullanabilir ama hedef kitle değil',
    ],
    effect:
      '1.3 (ebeveyn kapısı olmadan dışa link ve satın alma yok; üçüncü taraf analitik/reklam yasağı) ve ' +
      '5.1.4 (çocuk verisi, gizlilik politikası, COPPA/GDPR) kartları açılır. 2.3.8’in “For Kids/For Children” ' +
      'ifadesi kuralı da bu alana bakar: kategoride değilsen bu ifadeleri kullanamazsın.',
    source: 'Yaş beyanındaki kidsAgeBand ipucu verir ama beyan çekilmemiş olabilir; burada kesinleşir.',
  },
  {
    key: 'showsAds',
    label: 'Reklam gösteriyor',
    group: 'icerik',
    flag: 'ads',
    tldr: 'Uygulama içinde reklam gösteriliyor mu?',
    what:
      'Uygulamada reklam birimi gösteriliyor mu? Üçüncü taraf ağ (AdMob, AppLovin, Unity Ads) ya da kendi ' +
      'çapraz tanıtımın olması fark etmez; ölçü, kullanıcıya reklamın gösterilmesi.',
    yes: [
      'Banner, geçiş reklamı (interstitial), ödüllü video',
      'Sponsorlu/yerleşik içerik reklamı',
      'Kendi diğer uygulamalarını tanıtan reklam birimleri',
    ],
    no: [
      'Yalnızca uygulama içi satın alma var, reklam yok',
      'Yalnızca kendi özelliklerini tanıtan uygulama içi bilgilendirme (reklam birimi değil)',
    ],
    effect:
      '2.5.18 (reklam yaş sınırına uygun olmalı; kolay kapatılabilir olmalı; hassas veriye göre hedefleme yasak; ' +
      'uygunsuz reklamı şikayet yolu şart), 3.2.2(iii) (ağırlıklı olarak reklam göstermek için tasarlanmış uygulama) ' +
      've uzantı/App Clip’te reklam yasağı kartları açılır. Çocuk uygulamasıysa 1.3 ile birleşir.',
    source: 'ASC’de yok.',
  },

  // ---------------------------------------------------------------------
  // İş modeli ve para
  // ---------------------------------------------------------------------
  {
    key: 'sellsPhysicalGoodsOrServices',
    label: 'Fiziksel mal / hizmet',
    group: 'is-modeli',
    flag: 'physical-goods',
    tldr: 'Uygulama dışında tüketilen mal ya da hizmet satıyor mu?',
    what:
      'Uygulama, kullanıcının uygulama DIŞINDA tüketeceği fiziksel bir mal ya da gerçek dünya hizmeti satıyor mu? ' +
      'Yönü karıştırma: burada “evet” demek IAP kullanman gerektiği değil, KULLANMAMAN gerektiği anlamına gelir (3.1.3(e)).',
    yes: [
      'E-ticaret, yemek siparişi, market, kargo',
      'Bilet, rezervasyon, kiralama',
      'Gerçek dünyada verilen hizmet (kurye, temizlik, tamir, ders — birebir hizmetler 3.1.3(d))',
      'Postayla gönderilen fiziksel hediye kartı',
    ],
    no: [
      'Yalnızca dijital içerik/işlev satılıyor — o IAP ile olmak zorunda',
      'Dijital hediye kartı, kupon ya da kredi (IAP zorunlu)',
    ],
    effect:
      '3.1.3(e) kartı açılır ve IAP kartları bu gözle okunur: fiziksel mal/hizmeti IAP ile satmak da ihlaldir.',
    source: 'IAP listesinden çıkarılamaz: IAP’ın olmaması “fiziksel mal satıyor” demek değil.',
  },
  {
    key: 'hasExternalPurchaseLink',
    label: 'Dışarıya satın alma linki',
    group: 'is-modeli',
    flag: 'external-purchase-link',
    tldr: 'Uygulamada IAP dışı satın almaya yönlendiren bağlantı var mı?',
    what:
      'Uygulama, dijital içerik ya da hizmet satın almak için kullanıcıyı kendi sitene veya başka bir ödeme yoluna ' +
      'yönlendiren bir bağlantı, düğme ya da çağrı içeriyor mu? ABD vitrini dışında bu yalnızca Apple’ın verdiği ' +
      'entitlement ile yapılabilir (StoreKit External Purchase Link, Music Streaming Services, External Link Account).',
    yes: [
      '“Web sitemizden daha uygun fiyata al” bağlantısı',
      'Abonelik satın almak için siteye götüren düğme',
      'Reader uygulamasında hesap açma/yönetme bağlantısı',
    ],
    no: [
      'Yalnızca IAP var, dışarıya satın alma bağlantısı yok',
      'Destek, gizlilik, hakkında gibi satın almayla ilgisiz bağlantılar',
    ],
    effect:
      '3.1.1(a) kartı açılır: entitlement var mı, hangi vitrinlerde açık, bağlantı metni izin verilen kalıba uyuyor mu. ' +
      '3.1.1 (IAP dışına yönlendirme) kartı da bu bilgiyle okunur.',
    source: 'ASC’de yok — entitlement bilgisi listing verisinde görünmüyor.',
  },
  {
    key: 'unlocksContentWithoutIap',
    label: 'IAP dışı kilit açma',
    group: 'is-modeli',
    flag: 'unlock-outside-iap',
    tldr: 'İçerik/işlev IAP olmadan açılıyor mu (kod, donanım, kripto)?',
    what:
      'Uygulamadaki bir içeriği ya da işlevi, uygulama içi satın alma DIŞINDA bir yöntemle açıyor musun? ' +
      'Apple 3.1.1’de sayıyor: lisans anahtarı, QR kod, AR işareti, kripto para ve cüzdanlar. Donanıma bağlı ' +
      'açılan işlev 3.1.4’ün ayrı istisnası — orada da bir IAP seçeneği sunulması gerekiyor.',
    yes: [
      'Lisans/aktivasyon anahtarı ya da promosyon kodu tam sürümü açıyor',
      'QR kod veya AR işareti okutunca içerik açılıyor',
      'Kripto cüzdan ya da NFT sahipliği işlev açıyor',
      'Eşleşen bir donanım (oyuncak, teleskop, cihaz) işlev açıyor',
    ],
    no: [
      'Tüm ücretli içerik IAP ile açılıyor',
      'Kurumsal/okul hesabıyla giriş yapana içerik açılıyor (3.1.3(c) istisnası)',
      'Reader uygulamasında daha önce başka yerde satın alınmış içeriğe erişiliyor (3.1.3(a))',
    ],
    effect:
      '3.1.1 (kilidi IAP dışında açma yasağı) ve 3.1.4 (donanıma bağlı içerik: IAP seçeneği de sunulmalı, ' +
      'ilgisiz ürün alma/pazarlama etkinliği şart koşulamaz) kartları açılır.',
    source: 'ASC’de yok.',
  },

  // ---------------------------------------------------------------------
  // Uygulama türü
  // ---------------------------------------------------------------------
  {
    key: 'isWebViewWrapper',
    label: 'Web sitesi sarmalayıcı',
    group: 'tur',
    flag: 'web-wrapper',
    tldr: 'Uygulama esas olarak bir web sitesini mi gösteriyor?',
    what:
      'Uygulamanın ana içeriği WebView içinde açılan bir web sitesi mi? Ölçü “web teknolojisi kullanıyor mu” değil — ' +
      'ölçü, uygulamanın sitenin ötesine geçen bir değer katıp katmadığı (4.2).',
    yes: [
      'Ana ekran doğrudan siteyi açan bir WebView',
      'İçeriğin tamamı uzaktan geliyor, yerel özellik yok',
      'Hibrit çerçeveyle yazılmış ama sitenin birebir kopyası',
    ],
    no: [
      'React Native/Flutter ile yazılmış ama yerel işlevi olan uygulama',
      'Yalnızca yardım, şartlar gibi ikincil sayfalar WebView’da açılıyor',
    ],
    effect:
      '4.2 (asgari işlevsellik), 4.2.2 (yalnızca pazarlama/link derlemesi olmama) ve 2.5.6 (web tarayan ' +
      'uygulamalar WebKit kullanmalı) kartları açılır.',
    source: 'ASC’de yok.',
  },
  {
    key: 'hostsThirdPartySoftware',
    label: 'Üçüncü taraf yazılım barındırıyor',
    group: 'tur',
    flag: 'third-party-software',
    tldr: 'Mini uygulama, mini oyun, chatbot, eklenti ya da emülatör oyunu sunuyor mu?',
    what:
      'Uygulaman, binary’nin içine gömülü OLMAYAN yazılım sunuyor mu: HTML5/JavaScript mini uygulama ve mini ' +
      'oyunlar, akış (streaming) oyunları, chatbotlar, eklentiler ya da retro konsol/PC emülatörüyle indirilen ' +
      'oyunlar. Apple bu yazılımların tamamından SENİ sorumlu tutuyor (4.7).',
    yes: [
      'Mini uygulama / mini oyun platformu',
      'Üçüncü tarafların yazdığı chatbot ya da asistan koleksiyonu',
      'Bulut üzerinden akan oyunlar',
      'Eklenti (plug-in) yüklenebilen uygulama',
      'Emülatör: kullanıcı oyun indirebiliyor',
    ],
    no: [
      'Tüm içerik binary’nin içinde',
      'Yalnızca senin ürettiğin içerik uzaktan güncelleniyor (metin, görsel, yapılandırma)',
    ],
    effect:
      '4.7 ve 4.7.1–4.7.5 kartları açılır: barındırılan yazılım için gizlilik kuralları, moderasyon ' +
      '(süzme/şikayet/engelleme), IAP zorunluluğu, yerel API’lerin izinsiz açılmaması, izinlerin rızasız ' +
      'paylaşılmaması, evrensel bağlantılı yazılım dizini ve yaş kısıtlama mekanizması.',
    source: 'ASC’de yok.',
  },
  {
    key: 'hasAppExtensions',
    label: 'Uzantı / widget',
    group: 'tur',
    flag: 'extensions',
    tldr: 'Pakette ana uygulama dışında çalışan bir bileşen var mı?',
    what:
      'Uygulama paketinde ana binary dışında çalışan bir bileşen var mı: uzantı, üçüncü taraf klavye, Safari ' +
      'uzantısı, widget, bildirim uzantısı, watchOS uygulaması, sticker paketi ya da App Clip.',
    yes: [
      'Klavye uzantısı, Safari uzantısı, paylaşım/aksiyon uzantısı',
      'Widget, canlı aktivite, bildirim içeriği uzantısı',
      'App Clip, watchOS uygulaması, sticker paketi',
    ],
    no: ['Tek bir ana uygulama; uzantı, widget ya da App Clip yok'],
    effect:
      '4.4 (uzantılar pazarlama metninde doğru anlatılmalı; uzantıda pazarlama, reklam ya da IAP olamaz), ' +
      '4.4.1 (klavye), 4.4.2 (Safari), 2.5.16 (widget/uzantı uygulamayla ilgili olmalı; App Clip’te reklam yok) ' +
      've 2.5.18 (reklam yalnızca ana binary’de) kartları açılır.',
    source: 'ASC’de yok — çekilen build bilgisi uzantıları listelemiyor.',
  },
] as const satisfies readonly MetaField[]

export type MetaKey = (typeof META_FIELDS)[number]['key']

/** Elle işaretlenen alanların tamamı. `undefined` = bilinmiyor (≠ hayır). */
export type AppMeta = Partial<Record<MetaKey, boolean>>

export const META_KEYS: readonly MetaKey[] = META_FIELDS.map((f) => f.key)

export function metaField(key: string): MetaField | undefined {
  return META_FIELDS.find((f) => f.key === key)
}

/** `--ugc` / `--no-ugc` → { hasUserGeneratedContent: true | false }. */
export function metaFromArgs(args: readonly string[]): AppMeta {
  const out: AppMeta = {}
  for (const f of META_FIELDS) {
    if (args.includes(`--${f.flag}`)) out[f.key] = true
    else if (args.includes(`--no-${f.flag}`)) out[f.key] = false
  }
  return out
}
