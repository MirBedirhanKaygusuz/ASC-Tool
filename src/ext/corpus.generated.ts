// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: corpus/*.yaml
// Yeniden üretmek için: npm run build:ext
import type { RuleCard } from '../types.js'

export const CORPUS: { cards: RuleCard[]; version: string } = {
  "cards": [
    {
      "id": "apple-1.1.1-offensive-content",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "content",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "whatsNew",
        "keywords"
      ],
      "question": "Metinde bir gruba ya da kişiye yönelik aşağılayıcı, ayrımcı ya da kötü niyetli bir ifade var mı? Din, ırk, cinsel yönelim, cinsiyet, etnik köken ya da başka hedef grup üzerinden aşağılama, korkutma veya zarar verme ihtimali taşıyan ifadeleri bildir. Sert mizah tek başına ihlal değildir; ihlal, hedef alınan grubu küçük düşüren ifadedir.\n",
      "ruleText": "Uygulamalar; iftira niteliğinde, ayrımcı ya da kötü niyetli içerik barındıramaz. Özellikle hedef alınan bir kişiyi veya grubu küçük düşürme, korkutma ya da ona zarar verme ihtimali olan içerik reddedilir.\n",
      "positiveExample": "The only app that keeps those people out of your neighborhood.",
      "negativeExample": "A community app for neighbors to share local news and events.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.1.2-violence-depiction",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "content",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "kill",
        "killing",
        "murder",
        "torture",
        "abuse",
        "gore",
        "blood",
        "brutal",
        "execution",
        "shoot",
        "shooting",
        "violence",
        "violent"
      ],
      "question": "Metin, insanların ya da hayvanların öldürülmesini, sakat bırakılmasını, işkence görmesini gerçekçi biçimde anlatıyor ya da şiddeti özendiriyor mu? Oyunlarda \"düşman\" yalnızca belirli bir ırk, kültür, gerçek bir devlet ya da gerçek bir kurum olarak tarif ediliyorsa bunu da bildir. Soyut oyun şiddeti (ör. \"uzaylılarla savaş\") tek başına ihlal değildir.\n",
      "ruleText": "İnsanların veya hayvanların öldürülmesinin, sakat bırakılmasının, işkence görmesinin gerçekçi tasvirleri ve şiddeti özendiren içerik yasaktır. Oyun içindeki \"düşmanlar\" yalnızca belirli bir ırkı, kültürü, gerçek bir hükümeti ya da gerçek bir kurumu hedef alamaz.\n",
      "positiveExample": "Torture your enemies in realistic detail and watch them bleed out.",
      "negativeExample": "Fast-paced arcade shooter with cartoon aliens and power-ups.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.1.3-weapons",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "weapons",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "gun",
        "guns",
        "firearm",
        "firearms",
        "ammo",
        "ammunition",
        "rifle",
        "pistol",
        "weapon",
        "weapons",
        "knife",
        "explosive"
      ],
      "question": "Metin, silahların ya da tehlikeli nesnelerin yasa dışı veya pervasız kullanımını özendiriyor mu, ya da silah/mühimmat SATIN ALINMASINI kolaylaştırdığını söylüyor mu? Silahların bilgi amaçlı anlatımı ya da bir oyunun içindeki kurgusal silahlar tek başına ihlal değildir.\n",
      "ruleText": "Silahların ve tehlikeli nesnelerin yasa dışı ya da pervasız kullanımını özendiren tasvirler ile ateşli silah veya mühimmat satın alınmasını kolaylaştıran uygulamalar yasaktır.\n",
      "positiveExample": "Browse and buy handguns and ammo from local sellers, delivered fast.",
      "negativeExample": "A ballistics reference for licensed sport shooters, with range logs.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.1.4-sexual-content",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "adult",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "porn",
        "porno",
        "nude",
        "nudes",
        "nudity",
        "nsfw",
        "erotic",
        "sexy",
        "sexual",
        "hookup",
        "18+",
        "escort",
        "adult content",
        "undress",
        "strip"
      ],
      "question": "Metin, cinsel organların ya da cinsel eylemlerin açık tasvirini vaat ediyor, pornografik içerik ya da \"hookup\" tarzı bir deneyim sunuyor mu? Yetişkin içeriğine erişim, çıplaklaştırma/soyma özelliği, fuhuşu kolaylaştırma ihtimali taşıyan ifadeleri bildir. Flört uygulaması olmak tek başına ihlal değildir; ihlal, açık cinsel içerik vaadidir.\n",
      "ruleText": "Cinsel organların veya cinsel eylemlerin, estetik değil erotik duygu uyandırmayı amaçlayan açık tasvirleri yasaktır. Buna pornografi içerebilecek uygulamalar, \"hookup\" uygulamaları ve fuhuşu ya da insan ticaretini kolaylaştırabilecek uygulamalar dâhildir.\n",
      "positiveExample": "Undress any photo with AI and unlock uncensored nudes.",
      "negativeExample": "A dating app for finding people with shared hobbies nearby.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.1.5-religious-content",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "content",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "quran",
        "koran",
        "bible",
        "torah",
        "hadith",
        "prophet",
        "verse",
        "scripture",
        "religion",
        "religious",
        "islamic",
        "christian",
        "jewish",
        "hindu",
        "buddhist"
      ],
      "question": "Metin, kışkırtıcı dinî yorum içeriyor ya da dinî metinlerden yanlış/yanıltıcı alıntı yaptığını gösteriyor mu? Dinî içerik sunmak tek başına ihlal değildir; ihlal, kışkırtıcı yorum ya da kaynağı çarpıtan alıntıdır.\n",
      "ruleText": "Kışkırtıcı dinî yorumlar ile dinî metinlerin yanlış veya yanıltıcı biçimde alıntılanması yasaktır.\n",
      "positiveExample": "Learn why followers of that faith are wrong, verse by verse.",
      "negativeExample": "Daily prayer times, qibla direction and a searchable Quran text.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-1.1.6-false-features",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "false-claims",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "fake",
        "prank",
        "spoof",
        "joke",
        "trick",
        "anonymous call",
        "anonymous sms",
        "fake gps",
        "fake location",
        "fake call",
        "hidden number",
        "untraceable"
      ],
      "facts": [
        "Apple bu maddede üç şeyi ayrı ayrı sayıyor: yanlış cihaz verisi, şaka/hile işlevi, ve anonim/şaka arama veya mesaj gönderme.",
        "“Yalnızca eğlence amaçlıdır” ibaresi bu maddeyi aşmaz — Apple bunu metnin içinde açıkça yazıyor."
      ],
      "question": "Metin, gerçek olmayan bir işlev vaat ediyor mu? Özellikle: sahte cihaz verisi (sahte konum, sahte sensör ölçümü), şaka/hile işlevi, ya da anonim veya şaka amaçlı arama/SMS gönderme. \"Sadece eğlence amaçlı\" notu bu maddeyi aşmaz.\n",
      "ruleText": "Yanlış bilgi ve işlevler yasaktır: hatalı cihaz verisi, şaka/hile işlevleri (ör. sahte konum takipçileri) buna dâhildir. \"Yalnızca eğlence amaçlıdır\" demek bu kuralı aşmaz. Anonim ya da şaka amaçlı telefon araması veya SMS/MMS göndermeyi sağlayan uygulamalar reddedilir.\n",
      "positiveExample": "Send anonymous prank calls and fake your GPS location instantly.",
      "negativeExample": "Simulate camera angles for filmmakers with a virtual location preview inside the app.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.1.7-current-events",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.1.7",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.1.7",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "content",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "whatsNew"
      ],
      "prefilter": [
        "war",
        "earthquake",
        "pandemic",
        "covid",
        "outbreak",
        "epidemic",
        "terror",
        "attack",
        "crisis",
        "disaster",
        "refugee",
        "hurricane"
      ],
      "question": "Metin, güncel ya da yakın geçmişteki bir felaketten, çatışmadan, terör saldırısından veya salgından kazanç sağlamayı öneriyor mu? Yardım toplamak ya da doğru bilgi vermek ihlal değildir; ihlal, olayın kendisini pazarlama ya da gelir kancası olarak kullanmaktır.\n",
      "ruleText": "Yakın geçmişteki veya güncel olaylardan — şiddetli çatışmalar, terör saldırıları, salgınlar — kazanç sağlamayı amaçlayan zararlı içerik yasaktır.\n",
      "positiveExample": "Cash in on the outbreak — premium panic maps, only this week!",
      "negativeExample": "Official public health updates and vaccination site finder.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-1.2-ai-output-is-ugc",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
        "retrievedAt": "2026-08-25"
      },
      "tags": [
        "ai",
        "ugc",
        "moderation",
        "safety"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "generatesAiContent": true
      },
      "facts": [
        "App Review, kullanıcının verdiği girdiden (prompt, yüklenen fotoğraf) ÜRETİLEN içeriği kullanıcı içeriği sayar. Geliştiricilerin en sık kaçırdığı nokta budur: 'bizde kullanıcı içeriği yok, biz üretiyoruz' savunması kabul görmez.",
        "Üretici uygulamalarda süzgeç iki yerde birden gerekir: GİRDİDE (uygunsuz prompt reddedilmeli) ve ÇIKTIDA (üretilen görsel/metin uygunsuzsa gösterilmemeli).",
        "Yüz değiştirme, avatar ve görsel üretme uygulamalarında en sık gelen red budur; genellikle Guideline 1.2 atfıyla ve uygulamanın gerçek bir kişinin müstehcen görüntüsünü üretebildiğini gösteren bir ekran görüntüsüyle gelir."
      ],
      "question": "Uygulama AI ile içerik üretiyor. App Review bu çıktıyı KULLANICI İÇERİĞİ sayar. Şu üçü var mı? (1) Uygunsuz GİRDİYİ (prompt, yüklenen fotoğraf) reddeden bir süzgeç, (2) uygunsuz ÇIKTIYI kullanıcıya göstermeden engelleyen bir süzgeç, (3) üretilen bir içeriği şikayet etme yolu. Kendi uygulamanda dene: müstehcen ya da şiddet içeren bir prompt yaz, tanınmış bir kişinin fotoğrafını yükle. Ne çıkıyor?\n",
      "ruleText": "Kullanıcı içeriği barındıran uygulamalar uygunsuz materyali süzmek, şikayet mekanizması sunmak, kötüye kullanan kullanıcıları engellemek ve yayınlanmış iletişim bilgisi bulundurmak zorundadır. Kullanıcı girdisinden üretilen içerik de bu kapsamdadır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.2-prohibited-ugc-patterns",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ugc",
        "safety",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "random chat",
        "anonymous chat",
        "chatroulette",
        "stranger",
        "strangers",
        "hot or not",
        "rate people",
        "rate photos",
        "meet new people randomly",
        "video roulette"
      ],
      "facts": [
        "Apple bu türleri metinde tek tek sayıyor: pornografi ağırlıklı kullanım, Chatroulette tarzı deneyim, rastgele veya anonim sohbet, gerçek kişilerin nesneleştirilmesi (“hot-or-not” oylaması), fiziksel tehdit ve zorbalık.",
        "Bu türler App Store’a “ait değil” sayılıyor ve haber verilmeden kaldırılabiliyor — yani düzeltilebilir bir eksiklik değil, iş modelinin kendisi sorun."
      ],
      "question": "Metin, Apple'ın 1.2'de açıkça saydığı yasak kullanım kalıplarından birini vaat ediyor mu: rastgele/anonim yabancılarla eşleşme (Chatroulette tarzı), gerçek kişileri puanlatma (\"hot-or-not\"), ağırlıklı olarak pornografik içerik, tehdit ya da zorbalık. Moderasyonlu bir sosyal ağ olmak ihlal değildir; ihlal, bu kalıplardan birinin ana özellik olarak sunulmasıdır.\n",
      "ruleText": "Kullanıcı içeriği barındıran ya da sosyal ağ hizmeti veren uygulamalardan ağırlıklı olarak pornografik içerik, Chatroulette tarzı deneyim, rastgele veya anonim sohbet, gerçek kişilerin nesneleştirilmesi, fiziksel tehdit ya da zorbalık için kullanılanlar App Store'a ait değildir ve haber verilmeden kaldırılabilir.\n",
      "positiveExample": "Get matched with random strangers on video in one tap — no sign-up, no rules.",
      "negativeExample": "Join moderated interest groups and chat with people you follow.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.2-ugc-safeguards",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
        "retrievedAt": "2026-08-25"
      },
      "tags": [
        "ugc",
        "moderation",
        "safety"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasUserGeneratedContent": true
      },
      "facts": [
        "Apple, kullanıcı içeriği barındıran uygulamalardan DÖRT şeyi birden ister ve bunların hepsi uygulamanın İÇİNDE olmalıdır.",
        "Bu dördü listing'den görülemez; ekran görüntüsüne bakarak var/yok denemez. O yüzden bu kart modele gitmez, insana düşer.",
        "Eksik olduğunda gelen red genellikle Guideline 1.2 atfıyla ve 'moderation' kelimesiyle gelir."
      ],
      "question": "Kullanıcı içeriği barındıran uygulamada Apple'ın istediği DÖRT mekanizma da uygulamanın içinde var mı? (1) Uygunsuz içeriği yayına girmeden SÜZEN bir yöntem, (2) rahatsız edici içeriği ŞİKAYET etme yolu ve şikayetlere zamanında dönüş, (3) kötüye kullanan kullanıcıyı ENGELLEME imkânı, (4) kullanıcıların sana ulaşabileceği YAYINLANMIŞ iletişim bilgisi. Dördünden biri bile yoksa gönderme.\n",
      "ruleText": "Kullanıcı içeriği ya da sosyal ağ işlevi barındıran uygulamalar şunları içermek zorundadır: uygunsuz materyalin uygulamaya gönderilmesini süzen bir yöntem, rahatsız edici içeriği bildirme mekanizması ve bildirimlere zamanında yanıt, kötüye kullanan kullanıcıları hizmetten engelleme imkânı, ve kullanıcıların size kolayca ulaşabilmesi için yayınlanmış iletişim bilgisi.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.2.1-creator-content-age-gate",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ugc",
        "creator",
        "age-rating",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasUserGeneratedContent": true
      },
      "question": "Uygulamada \"creator\" (içerik üretici) topluluğunun ürettiği içerik varsa: (1) kullanıcı, uygulamanın yaş sınırını AŞAN içeriği ayırt edebiliyor mu, (2) doğrulanmış ya da beyan edilmiş yaşa dayanan bir yaş kısıtlama mekanizması var mı, (3) hangi içeriğin ek satın alma gerektirdiği kullanıcıya söyleniyor mu? Creator içeriği App Review tarafından kullanıcı içeriği sayılıyor: 1.2'nin moderasyon şartları da aynen geçerli.\n",
      "ruleText": "Creator içeriği sunan uygulamalar, uygulamanın yaş sınırını aşan içeriğin tanınmasını sağlamalı ve doğrulanmış ya da beyan edilmiş yaşa dayalı bir yaş kısıtlama mekanizmasıyla küçüklerin erişimini sınırlamalıdır. Bu içerik kullanıcı içeriği sayılır; 1.2 (moderasyon) ve 3.1.1 (satın alma) kuralları geçerlidir. Hangi içeriğin ek satın alma gerektirdiği kullanıcıya bildirilmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.3-kids-category",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "kids",
        "safety",
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "targetsKids": true
      },
      "facts": [
        "Ebeveyn kapısı (parental gate) şartı üç şeyi birden kapsıyor: uygulamadan çıkan bağlantılar, satın alma imkânları ve çocuğun dikkatini dağıtan diğer yönlendirmeler.",
        "Kids Category işaretini sonradan kaldırsan bile kullanıcılar uygulamanın bu kurallara uymasını beklediği için yükümlülük sonraki sürümlerde de sürüyor."
      ],
      "question": "Çocuklara yönelik uygulamada: (1) dışa açılan bağlantılar, satın alma imkânları ve dikkat dağıtıcı yönlendirmelerin tamamı ebeveyn kapısının arkasında mı, (2) üçüncü taraf analitik ve reklam kaldırıldı mı (izin verilen sınırlı durumlarda IDFA ve çocuğa dair hiçbir tanımlayıcı bilgi gönderilmiyor, bağlamsal reklamda insan incelemesi var mı), (3) çocuklardan veri toplanmasına dair yerel yasalara (COPPA, GDPR) uyum sağlandı mı?\n",
      "ruleText": "Kids Category uygulamaları, ebeveyn kapısı arkasında olmadıkça uygulamadan çıkan bağlantı, satın alma imkânı veya dikkat dağıtıcı yönlendirme içeremez. Kişisel bilgi ya da cihaz bilgisi üçüncü taraflara gönderilemez; üçüncü taraf analitik ve reklam kullanılmamalıdır. Sınırlı durumlarda IDFA veya çocuğu tanımlayan bilgi toplamayan analitik ile insan incelemesi yapan bağlamsal reklam kabul edilebilir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.1-health-measurement-claims",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "health",
        "false-claims",
        "metadata",
        "safety"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "blood pressure",
        "blood oxygen",
        "spo2",
        "glucose",
        "blood sugar",
        "x-ray",
        "xray",
        "body temperature",
        "heart rate",
        "bpm",
        "ecg",
        "ekg",
        "diagnose",
        "diagnosis",
        "treat"
      ],
      "facts": [
        "Apple bu maddede dört ölçümü ADIYLA yasaklıyor: yalnızca cihaz sensörleriyle röntgen çekmek, tansiyon, vücut sıcaklığı, kan şekeri veya kan oksijeni ölçmek.",
        "Doğruluk iddiası varsa veri ve yöntemin açıkça anlatılması gerekiyor; doğrulanamıyorsa uygulama reddediliyor."
      ],
      "question": "Metin, yalnızca telefonun sensörleriyle tıbbi bir ölçüm yaptığını iddia ediyor mu (tansiyon, kan şekeri, kan oksijeni, vücut sıcaklığı, röntgen)? Ya da teşhis/tedavi iddiası var mı? Böyle bir iddia varsa ölçümün dayandığı veri ve yöntem metinde açıklanıyor mu? Harici bir tıbbi cihazdan veri okumak ihlal değildir; ihlal, ölçümü cihazın kendi sensörlerine dayandırmaktır.\n",
      "ruleText": "Sağlık ölçümlerine ilişkin doğruluk iddiaları veri ve yöntemle desteklenmelidir. Yalnızca cihaz sensörlerini kullanarak röntgen çektiğini, tansiyon, vücut sıcaklığı, kan şekeri ya da kan oksijeni ölçtüğünü iddia eden uygulamalara izin verilmez.\n",
      "positiveExample": "Measure your blood pressure and blood oxygen using just your iPhone camera.",
      "negativeExample": "Log readings from your Bluetooth blood pressure cuff and see weekly trends.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.1-medical-app-duties",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "health",
        "safety",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasHealthFeatures": true
      },
      "question": "Sağlık/tıbbi işlev sunan uygulamada: (1) kullanıcıya, uygulamayı kullanmanın yanı sıra ve tıbbi karar vermeden ÖNCE doktoruna danışması hatırlatılıyor mu, (2) doğruluk iddiası varsa dayandığı veri ve yöntem uygulamada açıklanıyor mu, (3) düzenleyici onayın (FDA vb.) varsa belgesinin bağlantısı gönderime eklendi mi?\n",
      "ruleText": "Yanlış veri veya bilgi verebilecek, ya da teşhis/tedavi için kullanılabilecek tıbbi uygulamalar daha sıkı incelenir. Uygulamalar kullanıcıya doktoruna danışmayı hatırlatmalıdır. Düzenleyici onay alınmışsa belgenin bağlantısı gönderimle birlikte iletilmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.2-drug-dosage",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "health",
        "safety",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "dosage",
        "dose",
        "dosing",
        "mg/kg",
        "posology",
        "drug calculator",
        "medication calculator",
        "insulin"
      ],
      "question": "Metin, ilaç dozu hesaplayan bir işlev sunduğunu söylüyor mu? Söylüyorsa, uygulamanın ilaç üreticisi, hastane, üniversite, sigorta şirketi, eczane ya da onaylı bir kurum tarafından sunulduğu veya düzenleyici onay aldığı metinde belli oluyor mu? Yalnızca ilaç hatırlatıcısı olmak ihlal değildir; ihlal, doz HESAPLAYAN bir işlevin dayanağının belirsiz olmasıdır.\n",
      "ruleText": "İlaç dozu hesaplayıcıları; ilaç üreticisinden, bir hastaneden, üniversiteden, sağlık sigortası şirketinden, eczaneden veya onaylı başka bir kurumdan gelmeli, ya da FDA veya muadili bir kurumun onayını almalıdır.\n",
      "positiveExample": "Instantly calculate pediatric drug dosages for any medication.",
      "negativeExample": "Set reminders for the medications your doctor prescribed.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.3-substances",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "substances",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "tobacco",
        "cigarette",
        "vape",
        "vaping",
        "nicotine",
        "cannabis",
        "weed",
        "marijuana",
        "dispensary",
        "alcohol",
        "drinking",
        "shots",
        "drug",
        "drugs"
      ],
      "question": "Metin, tütün/elektronik sigara, yasa dışı uyuşturucu ya da aşırı alkol tüketimini özendiriyor mu? Ya da kontrollü madde veya tütün satışını kolaylaştırdığını söylüyor mu (lisanslı eczane ve yasal esrar dispensary istisnası dışında)? Bırakma/azaltma yardımı ihlal değildir.\n",
      "ruleText": "Tütün ve vape ürünleri, yasa dışı uyuşturucular ya da aşırı alkol tüketimini özendiren uygulamalara izin verilmez; küçükleri bu maddeleri tüketmeye özendirenler reddedilir. Kontrollü maddelerin veya tütünün satışını kolaylaştırmak yasaktır (lisanslı eczaneler ile lisanslı ya da yasal esrar dispensary'leri hariç).\n",
      "positiveExample": "Find the cheapest vapes and get them delivered to your door tonight.",
      "negativeExample": "A quit-smoking tracker with craving logs and milestone rewards.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.4-dui-checkpoints",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "dui",
        "checkpoint",
        "checkpoints",
        "speed trap",
        "police trap",
        "radar",
        "alkol kontrol",
        "drunk driving"
      ],
      "question": "Metin, alkol/hız denetim noktalarını gösterdiğini söylüyor mu? Söylüyorsa bu verinin kolluk kuvvetlerince YAYIMLANMIŞ olduğu belirtiliyor mu? Ayrıca alkollü araç kullanmayı ya da aşırı hız gibi pervasız davranışları özendiren ifadeler var mı?\n",
      "ruleText": "Uygulamalar yalnızca kolluk kuvvetleri tarafından yayımlanmış alkol denetim noktalarını gösterebilir ve alkollü araç kullanmayı ya da aşırı hız gibi pervasız davranışları asla özendirmemelidir.\n",
      "positiveExample": "Crowd-sourced DUI checkpoints so you can drive home after a few drinks.",
      "negativeExample": "Official traffic advisories published by the highway authority.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-1.4.5-risky-activities",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.4.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.4.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "challenge",
        "dare",
        "stunt",
        "bet",
        "prank",
        "extreme",
        "risk your"
      ],
      "question": "Metin, kullanıcıyı kendisine ya da başkasına fiziksel zarar verebilecek bir etkinliğe (bahis, meydan okuma, tehlikeli hareket) ya da cihazı riskli biçimde kullanmaya çağırıyor mu? Spor/antrenman içeriği tek başına ihlal değildir.\n",
      "ruleText": "Uygulamalar kullanıcıları kendilerine ya da başkalarına fiziksel zarar riski taşıyan etkinliklere (bahisler, meydan okumalar vb.) ya da cihazlarını riskli biçimde kullanmaya teşvik etmemelidir.\n",
      "positiveExample": "Take the 24-hour no-water challenge and dare your friends to beat it.",
      "negativeExample": "Guided interval running plans with heart-rate zones.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-1.5-developer-contact",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "support",
        "contact",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Kullanıcı sana nasıl ulaşacak? (1) Uygulamanın İÇİNDE kolay bir iletişim yolu var mı, (2) Support URL gerçekten iletişim imkânı sunan bir sayfaya mı gidiyor (yalnızca pazarlama ana sayfası yeterli değil), (3) bilgiler güncel mi? Wallet pass üretiyorsan geçerli iletişim bilgisi ve markaya atanmış sertifika ile imza şartı da geçerli.\n",
      "ruleText": "Uygulamanın kendisi ve Support URL'i sana ulaşmanın kolay bir yolunu içermelidir; bu özellikle sınıfta kullanılabilecek uygulamalar için önemlidir. Güncel ve doğru iletişim bilgisi vermemek kullanıcıyı mağdur eder ve bazı ülkelerde yasaya aykırı olabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-1.6-data-security",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "security",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "allowsAccountCreation": true
      },
      "question": "Kullanıcı verisi uygun güvenlik önlemleriyle mi işleniyor: aktarım ve depolamada şifreleme, yetkisiz erişime karşı koruma, üçüncü taraf erişimlerinin sınırlanması? Hesap açtırıp veri saklayan bir uygulamada bu Apple'ın ayrı bir maddesi.\n",
      "ruleText": "Uygulamalar, topladıkları kullanıcı bilgisinin doğru işlenmesini sağlamak ve yetkisiz kullanımını, ifşasını ya da üçüncü taraflarca erişilmesini önlemek için uygun güvenlik önlemleri uygulamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-1.7-criminal-reporting",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "1.7",
        "url": "https://developer.apple.com/app-store/review/guidelines/#1.7",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "safety",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "report crime",
        "criminal activity",
        "law enforcement",
        "police",
        "emergency report",
        "suç ihbar",
        "ihbar"
      ],
      "question": "Uygulama suç ihbarı almayı sağlıyorsa: yerel kolluk kuvvetleri sürece gerçekten dâhil mi ve uygulama yalnızca bu iş birliğinin aktif olduğu ülke/bölgelerde mi sunuluyor?\n",
      "ruleText": "İddia edilen suç faaliyetini bildirmeye yarayan uygulamalar yerel kolluk kuvvetlerini sürece dâhil etmek zorundadır ve yalnızca bu katılımın aktif olduğu ülke veya bölgelerde sunulabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.1-coming-soon-placeholder",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "completeness",
        "vision",
        "metadata"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "description",
        "whatsNew",
        "promotionalText"
      ],
      "question": "Ekran görüntülerinde veya metinlerde henüz hazır olmayan bir işlev işareti var mı? Örnekler: ekranda \"Coming soon\", \"Yakında\", \"Beta\", \"Under construction\", boş/placeholder içerik, \"Lorem ipsum\", gri kutu yer tutucular. Metinde \"yakında eklenecek\" biçiminde vaat edilen özellikler de bu kapsamdadır. Gelecek sürüm planından genel bahsetmek ihlal DEĞİLDİR.\n",
      "ruleText": "Uygulama ve metadata gönderim anında tamamlanmış olmalıdır. \"Yakında\" içerikleri, yer tutucular ve tamamlanmamış ekranlar reddedilir.\n",
      "positiveExample": "Ekran görüntüsünde 'AI Video — Coming Soon' yazan gri bir kart var.",
      "negativeExample": "We ship new filters every month — follow us for updates.",
      "outcome": "violation",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.1-demo-access",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "review-notes",
        "login",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "requiresLogin": true
      },
      "facts": [
        "Demo hesabın VAR olması yetmiyor: Apple “arka uç servisini açık tut” diyor — reviewer denediğinde giriş gerçekten çalışmalı.",
        "Hesap veremiyorsan alternatif, Apple’ın ÖNCEDEN onayladığı gömülü bir demo modudur ve uygulamanın tüm özelliklerini göstermek zorundadır."
      ],
      "question": "Giriş gerektiren uygulamada: (1) verilen demo hesapla ŞU AN giriş yapılabiliyor mu (kendin dene), (2) arka uç servisleri inceleme boyunca açık ve erişilebilir mi, (3) hesap veremiyorsan Apple'ın önceden onayladığı, tüm özellikleri gösteren bir demo modu var mı, (4) inceleme için gereken diğer kaynaklar (donanım, örnek QR kod, davet kodu) notlara eklendi mi?\n",
      "ruleText": "Uygulaman giriş içeriyorsa demo hesap bilgisi ver ve arka uç servisini açık tut. Yasal ya da güvenlik yükümlülükleri nedeniyle demo hesap veremiyorsan, Apple'ın önceden onayıyla demo hesap yerine gömülü bir demo modu sunabilirsin; bu modun uygulamanın tüm özelliklerini ve işlevselliğini göstermesi gerekir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.1-launch-crash",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "completeness"
      ],
      "scope": "single",
      "needs": [],
      "question": "Gönderilecek build temiz bir cihazda açılıyor mu? Uygulamayı sil, App Store sürümünü kur, uçak modunda ve normal ağda aç. Reviewer'ın kullandığı iOS sürümünde test edildi mi?\n",
      "ruleText": "Uygulama açılışta çökmemeli ve gönderilen build tamamlanmış olmalıdır. Bu listing icerigi disinda; cihazda dogrulanmali.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.1b-iap-reviewable",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "review-notes",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasIap": true
      },
      "question": "Uygulama içi satın almalar reviewer için: (1) uygulamada BULUNABİLİR mi (hangi ekranda, kaç tıkla), (2) güncel ve çalışır durumda mı, (3) uygulamada bulunamayan bir ürün varsa sebebi review notlarında yazıyor mu?\n",
      "ruleText": "Uygulama içi satın alma sunuyorsan, ürünlerin eksiksiz, güncel, reviewer tarafından görülebilir ve çalışır olduğundan emin ol. Yapılandırılmış bir ürün uygulamada bulunamıyor ya da incelenemiyorsa sebebini review notlarında açıkla.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.2-beta-language",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "completeness"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "whatsNew",
        "keywords"
      ],
      "prefilter": [
        "beta",
        "alpha",
        "demo version",
        "trial version",
        "preview version",
        "early access",
        "prototype",
        "test version",
        "work in progress",
        "wip"
      ],
      "facts": [
        "Apple’ın kuralı sürümün KENDİSİ hakkında: demo, beta ve deneme sürümleri App Store’a değil TestFlight’a ait.",
        "“Free trial” bir abonelik teklifidir ve bu maddenin konusu değildir — karıştırma."
      ],
      "question": "Metin, bu sürümün kendisinin bir beta, demo, önizleme ya da deneme sürümü olduğunu söylüyor mu? Böyle bir ifade varsa bildir. Abonelikteki ücretsiz deneme (\"free trial\") ya da \"erken erişim içerik paketi\" gibi ürün adları bu maddenin konusu değildir.\n",
      "ruleText": "Uygulamanın demo, beta ve deneme sürümleri App Store'a ait değildir; bunun için TestFlight kullanılmalıdır.\n",
      "positiveExample": "This is an early beta — expect bugs while we test new features.",
      "negativeExample": "Try Premium free for 7 days, then $4.99/month.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.3.1-ai-not-in-review-notes",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        "retrievedAt": "2026-08-25"
      },
      "tags": [
        "ai",
        "review-notes",
        "disclosure"
      ],
      "scope": "single",
      "needs": [
        "reviewNotes"
      ],
      "appliesWhen": {
        "generatesAiContent": true
      },
      "facts": [
        "Apple, her yeni işlevin İnceleme Notları alanında AYRINTILI anlatılmasını istiyor ve 'genel açıklamalar reddedilecektir' diye yazıyor.",
        "AI üretimi, reviewer'ın ekrandan anlayamayacağı bir işlevdir: hangi modelin kullanıldığı, çıktının nasıl süzüldüğü, içeriğin nereden geldiği notta yazmıyorsa reviewer varsayım yapmak zorunda kalır ve genellikle en kötü varsayımı yapar.",
        "Yeterli not şunları söyler: üretimin nerede çalıştığı (cihazda/sunucuda), hangi sağlayıcı/model kullanıldığı, uygunsuz girdi ve çıktının nasıl engellendiği, üretilen içeriğin saklanıp saklanmadığı.",
        "Notların boş olması ya da yalnızca demo hesap bilgisi içermesi bu kartın konusudur."
      ],
      "question": "Uygulama AI ile içerik üretiyor. Aşağıdaki İnceleme Notları metni bu işlevi reviewer'ın anlayacağı AYRINTIDA anlatıyor mu? Aranan asgari bilgi: üretimin nerede çalıştığı, hangi model/sağlayıcının kullanıldığı, uygunsuz girdi ve çıktının nasıl engellendiği. Notlar boşsa, yalnızca demo hesap/şifre içeriyorsa, ya da AI'dan hiç söz etmiyorsa bildir. Not bu üçünden en az ikisini somut olarak anlatıyorsa bulgu üretme.\n",
      "ruleText": "Bütün yeni özellikler, işlevler ve ürün değişiklikleri App Store Connect'in İnceleme Notları bölümünde AYRINTILI olarak anlatılmalı ve incelemeye erişilebilir olmalıdır; genel açıklamalar reddedilir.\n",
      "positiveExample": "Notes for Review: test@demo.com / 123456",
      "negativeExample": "Notes for Review: Görsel üretimi Replicate üzerinde SDXL ile sunucuda çalışıyor. Prompt'lar gönderilmeden önce OpenAI moderation API'sinden geçiyor, uygunsuz istekler reddediliyor. Üretilen görseller 24 saat sonra siliniyor. Demo: test@demo.com / 123456",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.1-exaggerated-claims",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        "retrievedAt": "2026-08-18"
      },
      "tags": [
        "metadata",
        "claims"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "guarantee",
        "guaranteed",
        "clinically",
        "medical",
        "proven",
        "100%",
        "#1",
        "best in the world",
        "instantly cure"
      ],
      "question": "Aşağıdaki metinde, uygulamanın gerçekten sağlayamayacağı veya kanıtlanamaz bir sonuç garantisi var mı? Özellikle şunlara bak: kesin sonuç vaadi (\"guaranteed\", \"%100\"), doğrulanmamış bilimsel/klinik iddia (\"clinically proven\", \"medical-grade\"), kanıtlanamayan üstünlük iddiası (\"#1 app\", \"world's best\"). Pazarlama dili tek başına ihlal değildir — ihlal, ölçülebilir ama kanıtlanmamış bir iddiadır.\n",
      "ruleText": "App Store metadata doğru olmalıdır. Uygulamanın yapabileceklerini abartan, garanti eden veya kanıtlanamayan bilimsel/klinik iddialar içeren metinler reddedilir.\n",
      "positiveExample": "Our clinically proven engine gives you guaranteed medical-grade results.",
      "negativeExample": "Helps you enhance your photos with AI-powered retouching tools.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.3.1-review-notes-specificity",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "review-notes",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "reviewNotes"
      ],
      "facts": [
        "Apple bu maddede “generic descriptions will be rejected” diyor: yeni özellik ve değişiklikler review notlarında AÇIKÇA anlatılmak zorunda."
      ],
      "question": "Review notları, bu sürümdeki yeni özellikleri ve değişiklikleri SOMUT olarak anlatıyor mu? \"Bug fixes and improvements\", \"minor updates\", \"yeni özellikler eklendi\" gibi genel ifadeler tek başına yeterli değildir. Notlarda yalnızca genel ifade varken uygulamada anlatılmamış yeni bir işlev olduğunu düşündüren bir durum varsa bildir. Yalnızca hata düzeltmesi içeren bir sürümde genel ifade kabul edilebilir.\n",
      "ruleText": "Gizli, uykuda ya da belgelenmemiş özellik bulunamaz; uygulamanın işlevi hem son kullanıcı hem App Review için açık olmalıdır. Tüm yeni özellikler, işlevler ve ürün değişiklikleri App Store Connect'in Notes for Review alanında SPESİFİK olarak anlatılmalı ve incelemeye açık olmalıdır; genel açıklamalar reddedilir.\n",
      "positiveExample": "Bug fixes and performance improvements.",
      "negativeExample": "Adds an AI photo editor (Home > Edit > Enhance). Test account: demo@x.com / 1234. The editor calls our server; no login needed to try it.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.10-other-platforms",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.10",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.10",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "platform"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "keywords",
        "promotionalText",
        "whatsNew"
      ],
      "prefilter": [
        "android",
        "google play",
        "play store",
        "huawei",
        "appgallery",
        "galaxy store",
        "samsung store",
        "windows phone",
        "amazon appstore",
        "apk"
      ],
      "facts": [
        "Yasak yalnızca ADLARDA değil: başka mobil platformların ya da alternatif uygulama pazarlarının adı, simgesi ve görselleri uygulamada ve metadata’da geçemez.",
        "Aynı madde metadata’nın konu dışı bilgi içermemesini de istiyor."
      ],
      "question": "Metinde başka bir mobil platformun ya da alternatif uygulama pazarının adı geçiyor mu (Android, Google Play, Huawei AppGallery, Galaxy Store, APK)? Onaylanmış özel bir etkileşimli işlev yoksa bu ihlaldir. Ayrıca metadata uygulamayla ilgisiz bilgi içeriyorsa bildir.\n",
      "ruleText": "Uygulaman, desteklediği Apple platformlarındaki deneyime odaklanmalıdır; onaylanmış özel bir etkileşimli işlev yoksa uygulamada ya da metadata'da başka mobil platformların veya alternatif uygulama pazarlarının adları, simgeleri ya da görselleri yer alamaz. Metadata konu dışı bilgi içermemelidir.\n",
      "positiveExample": "Also available on Android — download the APK from our site.",
      "negativeExample": "Syncs across your iPhone, iPad and Mac.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.3.11-preorder",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.11",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.11",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "preorder",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "pre-order",
        "preorder",
        "coming soon",
        "launching soon",
        "ön sipariş"
      ],
      "question": "Ön siparişe açtığın uygulama, gönderdiğin hâliyle eksiksiz ve teslim edilebilir mi? Yayınlanan sürüm, ön sipariş sırasında tanıtılandan esaslı biçimde farklı olacak mı (özellikle iş modeli değişikliği)? Esaslı değişiklik varsa ön sipariş satışını yeniden başlatman gerekir.\n",
      "ruleText": "Ön sipariş için gönderilen uygulamalar gönderildiği hâliyle eksiksiz ve teslim edilebilir olmalıdır. Yayımladığın uygulama, ön sipariş sırasında tanıttığından esaslı biçimde farklı olmamalıdır; esaslı değişiklik (ör. iş modeli değişikliği) yaparsan ön sipariş satışını yeniden başlatmalısın.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.12-whats-new",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.12",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.12",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "whats-new"
      ],
      "scope": "single",
      "needs": [
        "whatsNew"
      ],
      "facts": [
        "Basit hata düzeltmeleri, güvenlik güncellemeleri ve performans iyileştirmeleri için genel ifade SERBEST; kural yalnızca daha önemli değişiklikler için."
      ],
      "question": "\"What's New\" metni bu sürümdeki yeni özellikleri ve ürün değişikliklerini anlatıyor mu? Metin yalnızca genel bir ifadeden ibaretse (\"bug fixes and improvements\") ama aynı metin yeni bir özellikten söz ediyorsa ya da açıklama/ekran görüntüleri yeni bir özelliği işaret ediyorsa bildir. Yalnızca hata düzeltmesi içeren sürümde genel ifade kabul edilir.\n",
      "ruleText": "Uygulamalar yeni özellikleri ve ürün değişikliklerini \"What's New\" metninde açıkça anlatmalıdır. Basit hata düzeltmeleri, güvenlik güncellemeleri ve performans iyileştirmeleri genel bir açıklamaya dayanabilir; daha önemli değişiklikler notlarda listelenmelidir.\n",
      "positiveExample": "Various improvements. Also adds AI background removal and a new subscription tier.",
      "negativeExample": "Fixes a crash when opening large photos.",
      "outcome": "risk",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-2.3.13-in-app-events",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.13",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.13",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "events",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "in-app event",
        "live event",
        "tournament",
        "premiere",
        "season",
        "competition",
        "challenge",
        "etkinlik"
      ],
      "question": "App Store'da öne çıkardığın bir uygulama içi etkinlik varsa: (1) App Store Connect'teki etkinlik türlerinden birine giriyor mu, (2) etkinlik metadata'sının tamamı doğru ve etkinliğin KENDİSİYLE mi ilgili (uygulamanın geneliyle değil), (3) etkinlik seçtiğin tarih ve saatlerde tüm vitrinlerde gerçekten oluyor mu, (4) derin bağlantı uygulamada doğru yere gidiyor mu?\n",
      "ruleText": "Uygulama içi etkinlikler App Store Connect'teki etkinlik türlerinden birine girmeli; tüm etkinlik metadata'sı doğru olmalı ve uygulamanın geneliyle değil etkinliğin kendisiyle ilgili olmalıdır. Etkinlikler, birden çok vitrin dâhil, seçtiğin tarih ve saatlerde gerçekleşmelidir. Etkinlik derin bağlantısı kullanıcıyı uygulamadaki doğru hedefe götürmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.2-iap-purchase-disclosure",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "metadata",
        "disclosure"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "screenshots",
        "iap"
      ],
      "appliesWhen": {
        "hasIap": true
      },
      "requiresVision": true,
      "question": "Açıklama ve ekran görüntülerinde öne çıkarılan özellik, seviye, içerik ya da abonelik EK SATIN ALMA gerektiriyorsa bu açıkça söyleniyor mu? Ücretsiz gibi sunulup aslında satın alma gerektiren özellikleri bildir. Ayrıca App Store'da tanıtılan IAP'ların adı ve açıklaması genel kitleye uygun mu?\n",
      "ruleText": "Uygulama içi satın alma varsa; açıklama, ekran görüntüleri ve önizlemeler, öne çıkarılan öğelerin, seviyelerin veya aboneliklerin ek satın alma gerektirip gerektirmediğini açıkça belirtmelidir. App Store'da tanıtılan uygulama içi satın almaların görünen adı, ekran görüntüsü ve açıklaması genel bir kitleye uygun olmalıdır.\n",
      "positiveExample": "Unlimited AI portraits, unlimited exports, all filters — everything included. (Tüm bu özellikler yalnızca abonelikte açılıyor ama metin bunu söylemiyor.)",
      "negativeExample": "Includes 3 free edits per day. Unlimited edits require a Premium subscription.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.3-feature-not-evidenced",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "metadata",
        "claims",
        "screenshots"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "subtitle",
        "promotionalText",
        "screenshots"
      ],
      "facts": [
        "Uygulamanın KENDİ ADI, alt başlığı, kategorisi ve uygulama içi ürünleri o özellik için KANITTIR. 'AI Video, Face Swap: Editor' adlı bir uygulamada yüz değiştirme kanıtlanmıştır; ayrıca ekran görüntüsünde göstermesi gerekmez.",
        "Ekran görüntülerinin uygulama arayüzünü göstermemesi AYRI bir sorundur ve AYRI bir kart onu denetliyor (apple-2.3.3-screenshots-reflect-app). Bu kart o konuya girmez.",
        "Bu kartın hedefi, uygulamanın gerçekten yapamayacağı bir işi vaat etmesidir — bir fotoğraf filtresi uygulamasının 'dermatologla canlı görüşme' vaat etmesi gibi."
      ],
      "question": "Açıklama veya alt başlık, uygulamanın YAPAMAYACAĞI somut bir iş vaat ediyor mu? Yani vaat, uygulamanın adı, alt başlığı, kategorisi ve uygulama içi ürünleriyle BAĞDAŞMIYOR mu?\nBULGU ÜRETME şu durumlarda: - Vaat, uygulamanın adı/alt başlığı/kategorisiyle uyumluysa (bir yüz\n  değiştirme uygulamasının yüz değiştirme vaat etmesi gibi).\n- Yalnızca \"ekran görüntülerinde göremiyorum\" diyeceksen. Görsellerin\n  arayüzü göstermemesi BAŞKA bir kartın konusu; burada bulgu değildir.\n- Genel pazarlama ifadeleri için (\"kolay kullanım\", \"hızlı\", \"en iyi\").\nBULGU ÜRET yalnızca: vaat edilen iş uygulamanın tarif ettiği işle çelişiyorsa ya da o kategoride teknik olarak mümkün görünmüyorsa. Emin değilsen bulgu üretme.\n",
      "ruleText": "Metadata'da tanıtılan özellikler uygulamada gerçekten bulunmalıdır. Reviewer tanıtılan bir özelliği bulamazsa gönderim reddedilir.\n",
      "positiveExample": "Bir fotoğraf filtresi uygulamasının açıklamasında: 'Includes live 24/7 video consultation with certified dermatologists.'",
      "negativeExample": "'AI Video, Face Swap: Editor' adlı uygulamanın açıklamasında 'Put your face into any scene' — ad ve kategoriyle bağdaşıyor, bulgu değil.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 2
    },
    {
      "id": "apple-2.3.3-screenshots-reflect-app",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "metadata",
        "screenshots",
        "vision"
      ],
      "scope": "single",
      "needs": [
        "screenshots"
      ],
      "requiresVision": true,
      "question": "Bu ekran görüntüsünde gerçek bir uygulama ARAYÜZÜ görünüyor mu (düğmeler, sekmeler, araç çubukları, durum çubuğu, menüler)? Yoksa görsel tamamen bir pazarlama kompozisyonu mu — sadece bir fotoğraf, sonuç kolajı, model fotoğrafı, ya da arayüzsüz \"before/after\" görseli? Arayüzün etrafına eklenmiş çerçeve/başlık metni sorun DEĞİLDİR; sorun arayüzün HİÇ olmaması.\n",
      "ruleText": "Ekran görüntüleri uygulamanın gerçek kullanımını yansıtmalıdır. Yalnızca pazarlama görselinden oluşan ekran görüntüleri reddedilir.\n",
      "positiveExample": "Görsel sadece bir kadın yüzünün öncesi/sonrası fotoğrafı; hiçbir arayüz öğesi yok.",
      "negativeExample": "Görselde uygulama arayüzü, alt sekme çubuğu ve düzenleme araçları görünüyor; üstte tanıtım başlığı var.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.4-preview-video",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "media",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasPreviewVideo": true
      },
      "facts": [
        "Önizleme videosu bu boru hattında İZLENEMİYOR: elimizde yalnızca dosya adresi var. Bu yüzden kart modele değil insana gidiyor."
      ],
      "question": "Önizleme videosu yalnızca uygulamanın KENDİ ekran kaydından mı oluşuyor? Dışarıdan çekilmiş sahneler, animasyon, render, stok görüntü ya da kamerayla çekilmiş kullanım videosu varsa bu ihlaldir. Anlatım (voice-over), altyazı ve metin/görsel bindirmeleri serbesttir. Sticker ve iMessage uzantıları deneyimi Mesajlar uygulamasında gösterebilir.\n",
      "ruleText": "Önizlemeler yalnızca uygulamanın kendi ekran kayıtlarını kullanabilir. Sticker ve iMessage uzantıları kullanıcı deneyimini Mesajlar uygulamasında gösterebilir. Videodan anlaşılmayan noktaları açıklamak için anlatım, video ya da metin bindirmesi eklenebilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.5-category-fit",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "category"
      ],
      "scope": "cross",
      "needs": [
        "category",
        "description",
        "name",
        "subtitle"
      ],
      "question": "Uygulamanın seçili kategorisi, açıklamadaki işlevle uyuşuyor mu? Belirgin bir uyuşmazlık varsa bildir (ör. kategori \"Eğitim\" ama uygulama bir fotoğraf düzenleyici). Kategori makul seçeneklerden biriyse — birden çok kategoriye girebilecek uygulamalarda sık olur — bulgu üretme.\n",
      "ruleText": "Uygulaman için en uygun kategoriyi seç. Kategori tamamen alakasızsa Apple kategoriyi değiştirebilir.\n",
      "positiveExample": "Kategori Education, açıklama ise “Blur faces in your photos and add stickers before sharing.” diyor.",
      "negativeExample": "Kategori Photo & Video, açıklama ise “Blur faces in your photos and add stickers before sharing.” diyor.",
      "outcome": "risk",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-2.3.6-age-rating-answers",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "age-rating",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "(1) App Store Connect'teki yaş sınırı soruları dürüstçe yanıtlandı mı — uygulamanın gerçekte içerdiği şiddet, korku, cinsellik, kumar, madde kullanımı ve kullanıcı içeriği beyanları doğru mu? (2) Uygulama, içerik derecelendirmesi ya da uyarı gösterilmesi gereken medya içeriyorsa (film, müzik, oyun), uygulamanın sunulduğu her ülkenin yerel gerekliliklerine uyuluyor mu? Yanlış derecelendirme hem kullanıcıyı şaşırtır hem düzenleyici incelemesi tetikleyebilir.\n",
      "ruleText": "App Store Connect'teki yaş sınırı sorularını dürüstçe yanıtla ki uygulaman ebeveyn denetimleriyle doğru biçimde hizalansın. Uygulaman yanlış derecelendirilirse müşteriler beklemedikleri içerikle karşılaşabilir ya da bu durum devlet düzenleyicilerinin incelemesini tetikleyebilir. Uygulaman içerik derecelendirmesi veya uyarısı gösterilmesi gereken medya (film, müzik, oyun vb.) içeriyorsa, sunulduğu her ülke ve bölgedeki yerel gerekliliklere uymaktan sen sorumlusun.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.3.7-subtitle-rules",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.7",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.7",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "subtitle"
      ],
      "scope": "single",
      "needs": [
        "subtitle",
        "name"
      ],
      "facts": [
        "Apple metadata’nın TÜRÜNE özgü olmayan bilgiyi yasaklıyor: fiyat, kampanya koşulu ve şart ifadeleri ada, altyazıya, ekran görüntülerine ve önizlemelere giremez.",
        "Altyazı ayrıca: uygunsuz içerik barındıramaz, BAŞKA uygulamalara atıf yapamaz ve doğrulanamaz ürün iddiası içeremez."
      ],
      "question": "Uygulama adı ve altyazısını YALNIZCA şu dört şey için tara. Başka hiçbir şey için bulgu üretme: (1) fiyat ya da kampanya bilgisi — rakam, para birimi, \"% indirim\", \"free\", \"ücretsiz\", \"sale\"; (2) şart/koşul ifadesi — \"abonelik gerekir\", \"3 gün deneme\", \"iptal et\"; (3) BAŞKA bir uygulamanın adı (kendi uygulamanın adı değil); (4) doğrulanamaz üstünlük iddiası — \"#1\", \"best\", \"en iyi\", \"no.1\", \"world's\". Bu dördünden hiçbiri yoksa {\"findings\": []} döndür. Uygulamanın ne yaptığını sayan ifadeler — özellik listeleri dâhil — bu maddenin konusu değildir.\n",
      "ruleText": "Uygulama adı, altyazı, ekran görüntüleri ve önizlemeler gibi metadata, metadata türüne özgü olmayan fiyat, şart ya da açıklama içermemelidir. Altyazılar standart metadata kurallarına uymalı; uygunsuz içerik, başka uygulamalara atıf veya doğrulanamaz ürün iddiası içermemelidir.\n",
      "positiveExample": "50% OFF — better than the #1 photo app",
      "negativeExample": "Blur faces and objects in photos",
      "notViolation": [
        "Uygulamanın özelliklerini sayan altyazılar: 'AI Photo & Video Face Swap', 'Virtual Makeup & Nail Looks' gibi işlev listeleri.",
        "Kategori ve teknoloji adları: 'AI', 'photo', 'video', 'editor', 'camera', 'filter'.",
        "'&' ya da virgülle birleştirilmiş özellik dizileri — uzunluk tek başına ihlal değildir.",
        "Uygulamanın KENDİ adının altyazıda geçmesi."
      ],
      "outcome": "violation",
      "defaultSeverity": "medium",
      "version": 2
    },
    {
      "id": "apple-2.3.8-for-kids-terms",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.8",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.8",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "kids"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "keywords",
        "promotionalText"
      ],
      "appliesWhen": {
        "targetsKids": false
      },
      "prefilter": [
        "for kids",
        "for children",
        "kids",
        "children",
        "toddler",
        "preschool",
        "çocuklar için",
        "çocuk"
      ],
      "facts": [
        "“For Kids” ve “For Children” ifadeleri App Store’da yalnızca Kids Category için ayrılmış.",
        "5.1.4 bunu genişletiyor: Kids Category’de olmayan uygulama, ana kitlesinin çocuklar olduğunu ima eden hiçbir ifadeyi ad, altyazı, simge, ekran görüntüsü ya da açıklamada kullanamaz."
      ],
      "question": "Uygulama Kids Category'de DEĞİL. Metinde ana kitlenin çocuklar olduğunu ima eden bir ifade var mı (\"for kids\", \"for children\", \"toddler\", \"preschool\", \"çocuklar için\")? Çocuklara UYGUN olduğunu söylemek ile çocuklar İÇİN olduğunu söylemek farklıdır; ikincisi bu kategoride yasaktır.\n",
      "ruleText": "\"For Kids\" ve \"For Children\" gibi terimlerin uygulama metadata'sında kullanımı App Store'da Kids Category için ayrılmıştır. Kids Category'de olmayan uygulamalar; ad, altyazı, simge, ekran görüntüsü veya açıklamada ana kitlenin çocuklar olduğunu ima eden ifade kullanamaz.\n",
      "positiveExample": "Fun math games for kids ages 4-8",
      "negativeExample": "A family-friendly puzzle game everyone can enjoy",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.3.8-metadata-4plus",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.8",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.8",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "age-rating",
        "media",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "icon"
      ],
      "requiresVision": true,
      "facts": [
        "Kural yaş sınırından BAĞIMSIZ: uygulama 17+ olsa bile metadata 4+ ölçüsüne uymak zorunda.",
        "Apple’ın verdiği örnek: şiddet içeren bir oyunda korkunç bir ölüm sahnesi ya da belirli bir karaktere doğrultulmuş silah gösteren görsel seçilmemeli."
      ],
      "question": "Ekran görüntüleri ve simge, uygulamanın yaş sınırından bağımsız olarak 4+ ölçüsüne uyuyor mu? Kanlı/vahşi sahne, birine doğrultulmuş silah, cinsel içerik, küfür ya da uyuşturucu/alkol kullanımı gösteren görselleri bildir. Ayrıca simge ile ekran görüntülerindeki uygulama görsel olarak aynı uygulama gibi mi duruyor?\n",
      "ruleText": "Metadata tüm kitlelere uygun olmalıdır: uygulama daha yüksek yaş sınırına sahip olsa bile uygulama ve uygulama içi satın alma simgeleri, ekran görüntüleri ve önizlemeler 4+ yaş sınırına uymalıdır. Metadata'nın — uygulama adı ve simgeleri dâhil — kafa karışıklığı yaratmayacak biçimde birbirine benzemesi gerekir.\n",
      "positiveExample": "Ekran görüntüsünde bir karaktere doğrultulmuş tabanca ve kanlı bir sahne var.",
      "negativeExample": "Ekran görüntülerinde oyunun arayüzü, seviye haritası ve puan tablosu görünüyor.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.3.9-screenshot-rights",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.3.9",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.3.9",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "metadata",
        "ip",
        "privacy",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "icon"
      ],
      "requiresVision": true,
      "question": "Ekran görüntülerinde ya da simgede GERÇEK bir kişiye ait görünen veri var mı (gerçek isim, telefon, e-posta, adres, gerçek bir kişinin fotoğrafı, gerçek sohbet içeriği)? Apple kurgusal hesap bilgisi kullanılmasını istiyor. Ayrıca üçüncü tarafa ait olduğu belli materyal (marka logosu, film karesi, tanınmış kişi görseli) izinsiz kullanılmış görünüyorsa bildir.\n",
      "ruleText": "Uygulama simgelerinde, ekran görüntülerinde ve önizlemelerde kullanılan tüm materyallerin haklarını almış olmalısın ve gerçek bir kişiye ait veri yerine kurgusal hesap bilgisi göstermelisin.\n",
      "positiveExample": "Ekran görüntüsünde gerçek bir kullanıcının adı, e-postası ve profil fotoğrafı görünüyor.",
      "negativeExample": "Ekran görüntüsünde “Jane Appleseed” adlı örnek profil ve örnek veriler var.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.4.1-ipad-support",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.4.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hardware",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "iPhone uygulaması iPad'de de çalışıyor mu? Apple bunu \"mümkün olduğunda\" bekliyor. Çalışmıyorsa sebebi (ör. yalnızca iPhone'da olan bir donanım) savunulabilir mi ve ekran görüntüsü/cihaz aileleri buna uygun mu?\n",
      "ruleText": "İnsanların uygulamandan en iyi şekilde yararlanabilmesi için iPhone uygulamaları mümkün olduğunda iPad'de de çalışmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-2.4.2-power-and-background",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.4.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hardware",
        "performance",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "mining",
        "miner",
        "crypto",
        "battery",
        "charging",
        "background"
      ],
      "question": "Uygulama pili hızla tüketiyor, aşırı ısıtıyor ya da cihaz kaynaklarını gereksiz zorluyor mu? Cihazın yastık/yorgan altında şarj edilmesini öneren bir yönlendirme var mı? Uygulama ya da içindeki üçüncü taraf reklamlar, kripto madenciliği gibi ilgisiz arka plan işlemleri çalıştırıyor mu?\n",
      "ruleText": "Uygulamalar gücü verimli kullanmalı ve cihaza zarar riski taşımamalıdır: pili hızla tüketmemeli, aşırı ısı üretmemeli, kaynakları gereksiz zorlamamalıdır. Uygulamalar ve içlerinde gösterilen üçüncü taraf reklamlar, kripto madenciliği gibi ilgisiz arka plan işlemleri çalıştıramaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.4.3-tv-and-controllers",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.4.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hardware",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "apple tv",
        "tvos",
        "game controller",
        "gamepad",
        "controller"
      ],
      "question": "Apple TV uygulaması Siri Remote ya da üçüncü taraf oyun kumandası dışında bir donanım gerektirmeden kullanılabiliyor mu? Oyun kumandası ZORUNLU ise bu, kullanıcı satın almadan önce metadata'da açıkça yazıyor mu?\n",
      "ruleText": "İnsanlar Apple TV uygulamanı Siri Remote ya da üçüncü taraf oyun kumandaları dışında bir donanım girişine ihtiyaç duymadan kullanabilmelidir. Oyun kumandası şart koşuyorsan bunu metadata'da açıkça anlat.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.4.4-system-settings",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.4.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hardware",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "restart",
        "reboot",
        "turn off wi-fi",
        "airplane mode",
        "disable",
        "settings"
      ],
      "question": "Uygulama, kullanıcıdan cihazı yeniden başlatmasını ya da uygulamanın ana işleviyle ilgisiz sistem ayarlarını değiştirmesini istiyor mu (Wi-Fi'ı kapat, güvenlik özelliğini devre dışı bırak gibi)?\n",
      "ruleText": "Uygulamalar, ana işlevleriyle ilgisiz biçimde cihazın yeniden başlatılmasını ya da sistem ayarlarının değiştirilmesini asla önermemeli ve şart koşmamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.4.5-mac-app-store",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.4.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.4.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "mac",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "mac",
        "macos",
        "mac app store",
        "desktop"
      ],
      "question": "Mac App Store'a gönderiyorsan dokuz şartın hepsi sağlanıyor mu: (i) uygun sandbox ve dosya sistemi kuralları, (ii) Xcode ile paketleme, üçüncü taraf yükleyici yok, tek ve kendi kendine yeten paket, (iii) rızasız otomatik başlatma yok, Dock'a kendini eklemiyor, (iv) bağımsız uygulama/kext/ek kod indirmiyor, (v) root yetkisi istemiyor, (vi) açılışta lisans ekranı yok, kendi kopya korumasını uygulamıyor, (vii) güncellemeler Mac App Store üzerinden, (viii) güncel işletim sisteminde çalışıyor ve kullanımdan kaldırılmış teknoloji kullanmıyor, (ix) tüm dil desteği tek pakette.\n",
      "ruleText": "Mac App Store üzerinden dağıtılan uygulamalar için ek şartlar geçerlidir: sandbox, Xcode ile paketleme, rızasız otomatik başlatmama, ek kod indirmeme, root yetkisi istememe, lisans ekranı ve kendi kopya koruması koymama, güncellemeleri Mac App Store'dan dağıtma, güncel işletim sisteminde çalışma ve tüm yerelleştirmeyi tek pakette taşıma.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.1-public-apis",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama yalnızca genel (public) API'leri mi kullanıyor ve güncel işletim sisteminde mi çalışıyor? Kullanımdan kaldırılan çerçeveler ayıklandı mı? Kullanılan çerçeveler AMACINA uygun mu (HealthKit sağlık/fitness için, HomeKit ev otomasyonu için) ve bu entegrasyon uygulama açıklamasında belirtiliyor mu?\n",
      "ruleText": "Uygulamalar yalnızca genel API'leri kullanabilir ve güncel işletim sisteminde çalışmalıdır. Kullanımdan kaldırılan özellik, çerçeve ve teknolojiler aşamalı olarak bırakılmalıdır. API ve çerçeveler amaçlarına uygun kullanılmalı ve bu entegrasyon uygulama açıklamasında belirtilmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.11-sirikit",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.11",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.11",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "siri",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "siri",
        "shortcut",
        "shortcuts",
        "voice command"
      ],
      "question": "SiriKit ve Kısayollar entegrasyonunda: (i) yalnızca başka bir uygulamaya gerek olmadan gerçekleştirebileceğin ve uygulamanın işlevinden beklenecek intent'lere kaydoldun mu, (ii) plist'teki kelime ve ifadeler uygulamana ve kaydolduğun intent'lere ait mi (takma adlar uygulama/şirket adınla ilgili olmalı, genel terim ya da üçüncü taraf uygulama adı olamaz), (iii) istek en doğrudan biçimde karşılanıyor ve araya reklam/pazarlama girmiyor mu?\n",
      "ruleText": "SiriKit ve Kısayollar entegre eden uygulamalar yalnızca ek bir uygulamaya ihtiyaç duymadan karşılayabilecekleri ve belirtilen işlevden beklenecek intent'lere kaydolmalıdır. plist'teki kelime dağarcığı uygulamaya ait olmalı, takma adlar genel terim veya üçüncü taraf adı içermemelidir. Siri isteği ya da Kısayol en doğrudan biçimde çözülmeli, istek ile yerine getirilmesi arasına reklam ya da pazarlama sokulmamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.12-call-sms-blocking",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.12",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.12",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "spam",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "description",
        "name",
        "subtitle",
        "promotionalText"
      ],
      "prefilter": [
        "spam call",
        "call block",
        "call blocking",
        "sms block",
        "robocall",
        "spam sms",
        "caller id",
        "spam identification",
        "unknown caller"
      ],
      "facts": [
        "Apple iki şeyi birden istiyor: bu özelliklerin PAZARLAMA METNİNDE açıkça belirtilmesi ve engelleme/spam listelerinin ölçütünün açıklanması."
      ],
      "question": "Uygulama arama/SMS/MMS engelleme ya da spam tanımlama sunuyorsa, pazarlama metni (1) bu özellikleri açıkça tanıtıyor mu ve (2) engellenen/spam sayılan numaraların hangi ölçüte göre belirlendiğini açıklıyor mu? Özellik var ama ölçüt anlatılmamışsa bildir.\n",
      "ruleText": "CallKit kullanan ya da SMS Fraud Extension içeren uygulamalar yalnızca doğrulanmış spam numaraları engellemelidir. Arama, SMS ve MMS engelleme ya da spam tanımlama işlevi içeren uygulamalar bu özellikleri pazarlama metinlerinde açıkça belirtmeli ve engelleme/spam listelerinin ölçütünü açıklamalıdır. Bu araçlarla erişilen veri, uygulamanın işletilmesi veya iyileştirilmesiyle doğrudan ilgili olmayan hiçbir amaçla kullanılamaz.\n",
      "positiveExample": "Blocks thousands of spam callers automatically.",
      "negativeExample": "Blocks numbers reported as spam by at least 50 users and verified against the public FTC complaint list; you can review and unblock any number.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.13-facial-recognition",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.13",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.13",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "face id",
        "facial recognition",
        "face unlock",
        "face login",
        "face scan",
        "biometric"
      ],
      "question": "Hesap doğrulaması için yüz tanıma kullanılıyorsa: mümkün olan her yerde LocalAuthentication mı kullanılıyor (ARKit ya da başka bir yüz tanıma teknolojisi değil)? 13 yaşından küçük kullanıcılar için alternatif bir doğrulama yöntemi var mı?\n",
      "ruleText": "Hesap kimlik doğrulaması için yüz tanıma kullanan uygulamalar mümkün olan yerlerde LocalAuthentication kullanmalı (ARKit ya da diğer yüz tanıma teknolojileri değil) ve 13 yaşından küçük kullanıcılar için alternatif bir kimlik doğrulama yöntemi sunmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.14-recording-consent",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.14",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.14",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "recording",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "usesCameraOrMicrophone": true
      },
      "question": "Kayıt yapan uygulamada: kullanıcıdan AÇIK rıza alınıyor mu ve kayıt sırasında görünür ve/veya duyulur bir gösterge var mı? Bu kural kamera, mikrofon, ekran kaydı ve diğer kullanıcı girdilerinin tamamını kapsıyor.\n",
      "ruleText": "Uygulamalar kullanıcı etkinliğini kaydederken, günlüklerken ya da başka biçimde kayda geçirirken açık kullanıcı rızası istemeli ve net bir görsel ve/veya işitsel gösterge sunmalıdır. Buna cihaz kamerası, mikrofon, ekran kayıtları ve diğer kullanıcı girdileri dâhildir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.15-files-app",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.15",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.15",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "file",
        "files",
        "document",
        "documents",
        "pdf",
        "import",
        "storage"
      ],
      "question": "Kullanıcıya dosya görüntületip seçtiren uygulama, Files uygulamasındaki öğeleri ve kullanıcının iCloud belgelerini de listeliyor mu?\n",
      "ruleText": "Kullanıcıların dosyaları görüntülemesini ve seçmesini sağlayan uygulamalar Files uygulamasındaki öğeleri ve kullanıcının iCloud belgelerini de içermelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-2.5.16-extensions-relevance",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.16",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.16",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "extensions",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasAppExtensions": true
      },
      "question": "Widget'lar, uzantılar ve bildirimler uygulamanın içeriği ve işleviyle ilgili mi? App Clip kullanıyorsan: tüm App Clip özellikleri ana uygulama binary'sinde de var mı ve App Clip reklam içermiyor mu?\n",
      "ruleText": "Widget'lar, uzantılar ve bildirimler uygulamanın içeriği ve işleviyle ilgili olmalıdır. Ayrıca tüm App Clip özellikleri ve işlevleri ana uygulama binary'sinde yer almalıdır; App Clip'ler reklam içeremez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.17-matter",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.17",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.17",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hardware",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "matter",
        "thread",
        "homekit",
        "smart home",
        "iot"
      ],
      "question": "Matter destekliyorsan: eşleştirmeyi başlatmak için Apple'ın Matter destek çerçevesini kullanıyor musun? Apple'ın verdiği Matter SDK dışında bir Matter bileşeni kullanıyorsan, o bileşen çalıştığı platform için Connectivity Standards Alliance tarafından sertifikalandırılmış mı?\n",
      "ruleText": "Matter destekleyen uygulamalar eşleştirmeyi başlatmak için Apple'ın Matter destek çerçevesini kullanmalıdır. Apple'ın sağladığı Matter SDK dışında bir Matter yazılım bileşeni kullanılıyorsa, bu bileşen çalıştığı platform için Connectivity Standards Alliance tarafından sertifikalandırılmış olmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-2.5.18-advertising-rules",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.18",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.18",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ads",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "showsAds": true
      },
      "question": "Reklam gösteren uygulamada: (1) reklamlar yalnızca ana binary'de mi (uzantı, App Clip, widget, bildirim, klavye, watchOS uygulamasında reklam yok), (2) reklamlar uygulamanın yaş sınırına uygun mu, (3) kullanıcı, kendisini hedeflemek için kullanılan bilgilerin tamamını uygulamadan ÇIKMADAN görebiliyor mu, (4) sağlık/HealthKit, okul/ClassKit ya da çocuk verisi gibi hassas veriyle hedefleme yapılmıyor, değil mi, (5) geçiş reklamları reklam olduğunu açıkça belli ediyor, kolayca kapatılabiliyor ve kullanıcıyı tıklamaya kandırmıyor mu, (6) uygunsuz veya yaşa uygun olmayan reklamı şikayet etme yolu var mı?\n",
      "ruleText": "Reklam gösterimi ana uygulama binary'siyle sınırlı olmalıdır; uzantı, App Clip, widget, bildirim, klavye ve watchOS uygulamalarında reklam gösterilemez. Reklamlar uygulamanın yaş sınırına uygun olmalı, kullanıcının hedefleme için kullanılan tüm bilgileri uygulamadan çıkmadan görmesine izin vermeli ve sağlık/tıbbi veri, okul verisi ya da çocuklardan elde edilen veri gibi hassas verilere dayalı hedefli veya davranışsal reklamcılık yapmamalıdır. Kullanıcı deneyimini kesen ya da engelleyen reklamlar reklam olduklarını açıkça belirtmeli, kullanıcıyı kandırmamalı ve kolayca görülebilen, yeterince büyük bir kapatma düğmesi sunmalıdır. Reklam içeren uygulamalar, kullanıcıların uygunsuz ya da yaşa uygun olmayan reklamları bildirebilmesini de sağlamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.2-self-contained",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama kendi paketinde kendine yeten bir bütün mü? Ayrılmış konteyner alanının dışına veri yazıyor ya da oradan okuyor mu? Uygulamanın (ya da başka uygulamaların) özelliklerini değiştiren veya ekleyen kod indiriyor, kuruyor veya çalıştırıyor mu? Eğitim amaçlı kod çalıştıran uygulamalarda kaynak kod kullanıcı tarafından görülebilir ve düzenlenebilir mi?\n",
      "ruleText": "Uygulamalar kendi paketlerinde kendine yeten olmalı, ayrılmış konteyner alanının dışına veri okuyup yazmamalı ve uygulamanın (ya da diğer uygulamaların) özelliklerini ve işlevlerini değiştiren kod indirmemeli, kurmamalı veya çalıştırmamalıdır. Öğrencilerin kod yazıp denemesini sağlayan eğitim uygulamaları sınırlı durumlarda kod indirebilir; bu kod başka amaçla kullanılmamalı ve kaynak kod kullanıcıya tamamen görünür ve düzenlenebilir olmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.3-harmful-code",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "security",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "virus",
        "malware",
        "antivirus",
        "scanner",
        "security scan",
        "clean your"
      ],
      "question": "Uygulama, işletim sisteminin ya da donanım özelliklerinin normal çalışmasını bozabilecek dosya, kod veya program iletiyor mu? Push Notifications ve Game Center üzerinden yapılan kötüye kullanımlar da bu maddeye giriyor. Kendini \"virüs/malware tarayıcı\" olarak tanıtan iOS uygulamaları ayrıca 2.3.1 (yanıltıcı pazarlama) kapsamında reddediliyor.\n",
      "ruleText": "İşletim sisteminin ve/veya donanım özelliklerinin normal çalışmasına zarar verebilecek ya da bunu bozabilecek virüs, dosya, kod veya program ileten uygulamalar reddedilir. Ağır ihlaller ve tekrar eden davranış Apple Developer Program'dan çıkarılmayla sonuçlanır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.4-background-services",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "background",
        "voip",
        "location",
        "audio",
        "always on",
        "arka plan"
      ],
      "question": "Uygulama arka plan servislerini yalnızca amacına uygun kullanıyor mu (VoIP, ses çalma, konum, görev tamamlama, yerel bildirim)? Beyan edilen arka plan modu gerçekten kullanılıyor mu, yoksa yalnızca uygulamayı canlı tutmak için mi açılmış?\n",
      "ruleText": "Çoklu görev yapan uygulamalar arka plan servislerini yalnızca amaçlarına uygun kullanabilir: VoIP, ses çalma, konum, görev tamamlama, yerel bildirimler vb.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.5-ipv6",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama yalnızca IPv6 olan bir ağda tam olarak çalışıyor mu? Apple incelemesi bu ağda yapılıyor; IPv4 varsayımı yapan bir istemci ya da sabit IP kullanımı burada patlar.\n",
      "ruleText": "Uygulamalar yalnızca IPv6 olan ağlarda tam işlevsel olmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-2.5.6-webkit",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "webview",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "isWebViewWrapper": true
      },
      "question": "Web tarayan uygulama uygun WebKit çerçevesini ve WebKit JavaScript'ini mi kullanıyor? Alternatif bir tarayıcı motoru kullanıyorsan (yalnız AB ve Japonya) buna dair entitlement başvurun onaylandı mı?\n",
      "ruleText": "Web tarayan uygulamalar uygun WebKit çerçevesini ve WebKit JavaScript'i kullanmak zorundadır. Alternatif bir web tarayıcı motoru kullanmak için entitlement başvurusu yapılabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.8-alternate-home-screen",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.8",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.8",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "launcher",
        "home screen",
        "desktop",
        "springboard",
        "app drawer"
      ],
      "question": "Uygulama alternatif bir masaüstü ya da ana ekran ortamı oluşturuyor mu? Bu doğrudan ret sebebi.\n",
      "ruleText": "Alternatif masaüstü/ana ekran ortamları oluşturan uygulamalar reddedilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-2.5.9-system-controls",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "2.5.9",
        "url": "https://developer.apple.com/app-store/review/guidelines/#2.5.9",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "volume button",
        "silent switch",
        "mute switch",
        "lock screen",
        "system button"
      ],
      "question": "Uygulama standart anahtarların (ses açma/kısma, sessize alma) ya da yerleşik arayüz öğelerinin davranışını değiştiriyor veya devre dışı bırakıyor mu? Kullanıcının belirli biçimde çalışmasını beklediği bağlantı ve özellikleri engelliyor mu?\n",
      "ruleText": "Ses açma/kısma ve zil/sessiz anahtarı gibi standart anahtarların ya da yerleşik arayüz öğelerinin ve davranışlarının işlevini değiştiren veya devre dışı bırakan uygulamalar reddedilir. Örneğin uygulamalar, kullanıcının çalışmasını beklediği diğer uygulamalara giden bağlantıları engellememelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3-business-model-clarity",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "metadata"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "reviewNotes",
        "iap"
      ],
      "question": "Uygulamanın nasıl para kazandığı listing'den ve review notlarından anlaşılıyor mu? Ücretli bir işlev, abonelik ya da alışılmadık bir iş modeli varken metinde bundan hiç söz edilmiyorsa bildir. Apple bunu \"anlaşılmıyorsa inceleme gecikir ve ret tetiklenebilir\" diye yazıyor.\n",
      "ruleText": "İş modelin açık değilse metadata'da ve App Review notlarında açıkla. Uygulamanın nasıl çalıştığı ya da uygulama içi satın almaların ne olduğu anlaşılmıyorsa inceleme gecikir ve ret tetiklenebilir. Fiyatlandırma sana aittir ama kullanıcıyı akıl dışı yüksek fiyatlarla kandıran uygulamalar dağıtılmaz.\n",
      "positiveExample": "Uygulamada 5 adet abonelik var, açıklama ve review notlarında ne satıldığına dair tek kelime yok.",
      "negativeExample": "Açıklama: “Ücretsiz sürümde günde 3 düzenleme; sınırsız düzenleme için aylık abonelik.”",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.1-credits-and-gifts",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasIap": true
      },
      "question": "Uygulama içi satın almalarda: (1) satın alınan kredi ya da oyun içi para birimi zaman aşımına uğruyor mu (uğramamalı), (2) geri yüklenebilir satın almalar için bir geri yükleme mekanizması var mı, (3) hediye edilebilen öğeler yalnızca ilk satın alana iade ediliyor ve takas edilemiyor mu?\n",
      "ruleText": "Uygulama içi satın almayla alınan krediler ve oyun içi para birimleri zaman aşımına uğrayamaz; geri yüklenebilir satın almalar için bir geri yükleme mekanizması bulunmalıdır. Uygulamalar, uygulama içi satın almaya uygun öğelerin başkalarına hediye edilmesine izin verebilir; bu hediyeler yalnızca ilk satın alana iade edilebilir ve takas edilemez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.1-digital-gift-cards",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments"
      ],
      "scope": "single",
      "needs": [
        "description",
        "iap",
        "promotionalText"
      ],
      "prefilter": [
        "gift card",
        "giftcard",
        "voucher",
        "coupon",
        "certificate",
        "hediye kart"
      ],
      "question": "Uygulama dijital hediye kartı, sertifika, kupon ya da bilet satıyor mu? Dijital mal veya hizmete çevrilebilen bunlar YALNIZCA uygulama içi satın alma ile satılabilir. Fiziksel olarak postalanan hediye kartları başka ödeme yöntemleri kullanabilir — metinden hangisi olduğu anlaşılıyor mu?\n",
      "ruleText": "Dijital mal veya hizmetlere çevrilebilen dijital hediye kartları, sertifikalar, kuponlar ve indirim kuponları uygulamanda yalnızca uygulama içi satın alma ile satılabilir. Uygulama içinde satılıp müşterilere posta ile gönderilen fiziksel hediye kartları uygulama içi satın alma dışındaki ödeme yöntemlerini kullanabilir.\n",
      "positiveExample": "Buy a digital gift card with your credit card and send it instantly.",
      "negativeExample": "Order a physical gift card; we mail it to any address.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.1-external-purchase-steering",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "monetization",
        "steering"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "promotionalText",
        "subtitle",
        "whatsNew",
        "screenshots",
        "urls"
      ],
      "facts": [
        "Apple, dijital içerik için kullanıcıyı uygulama dışı bir ödeme yöntemine yönlendirmeyi yasaklar.",
        "Fiziksel ürün/hizmet satışı (kargo gerektiren mal, gerçek dünyada verilen hizmet) bu yasağın dışındadır."
      ],
      "question": "Metin veya ekran görüntüleri, kullanıcıyı dijital içerik/abonelik için uygulama DIŞINDA bir ödeme yoluna yönlendiriyor mu? Örnek işaretler: \"web sitemizden daha ucuz\", \"sitemizden abone ol\", \"buradan satın al\" + harici bağlantı, indirim kodu ile site yönlendirmesi. Sadece genel bir web sitesi bağlantısı yönlendirme DEĞİLDİR.\n",
      "ruleText": "Uygulama içi dijital içerik yalnızca Apple'ın satın alma sistemiyle satılabilir; kullanıcıyı harici ödeme yöntemlerine yönlendirmek yasaktır.\n",
      "positiveExample": "Subscribe on our website for 50% less — glamio.com/pro",
      "negativeExample": "Learn more about Glamio at glamio.com",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.1-loot-box-odds",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "disclosure"
      ],
      "scope": "single",
      "needs": [
        "description",
        "iap",
        "promotionalText"
      ],
      "prefilter": [
        "loot box",
        "lootbox",
        "gacha",
        "mystery box",
        "random item",
        "chest",
        "crate",
        "summon",
        "draw"
      ],
      "question": "Uygulama, satın alınabilen rastgele sanal öğeler sunuyor mu (loot box, gacha, sürpriz kutu, sandık)? Sunuyorsa her öğe türünün çıkma OLASILIĞI satın almadan önce açıklanıyor mu? Rastgele ödül vaadi var ama olasılık bilgisi yoksa bildir. Ücretsiz günlük ödül çarkı bu maddenin konusu değildir.\n",
      "ruleText": "\"Loot box\" ya da satın alma karşılığında rastgele sanal öğe veren diğer mekanizmaları sunan uygulamalar, her öğe türünün elde edilme olasılığını satın alma öncesinde müşterilere açıklamak zorundadır.\n",
      "positiveExample": "Buy a Mystery Chest and get a random legendary skin!",
      "negativeExample": "Mystery Chest odds: legendary 2%, epic 8%, rare 30%, common 60%.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.1-nft",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "crypto",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "nft",
        "mint",
        "opensea",
        "web3",
        "blockchain",
        "token"
      ],
      "question": "NFT ile ilgili işlev varsa: (1) NFT satışı, listeleme, transfer gibi hizmetler uygulama içi satın alma ile mi yapılıyor, (2) NFT SAHİPLİĞİ uygulamada bir özellik ya da işlev açıyor mu (açmamalı), (3) başkalarının koleksiyonlarına göz attıran ekranlarda — ABD vitrini dışında — IAP dışı satın almaya yönlendiren düğme, bağlantı ya da çağrı var mı?\n",
      "ruleText": "Uygulamalar NFT'lerle ilgili hizmetleri (basma, listeleme, transfer) satmak için uygulama içi satın alma kullanabilir. Kullanıcıların kendi NFT'lerini görüntülemesine izin verilebilir, ancak NFT sahipliği uygulamada özellik ya da işlev açamaz. Başkalarının NFT koleksiyonlarına göz atılmasına izin verilebilir; ancak ABD vitrini dışındaki uygulamalarda, müşterileri uygulama içi satın alma dışındaki satın alma mekanizmalarına yönlendiren düğme, dış bağlantı ya da çağrı bulunamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.1-restore-purchases",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "subscriptions",
        "paywall",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "iap"
      ],
      "appliesWhen": {
        "hasSubscription": true
      },
      "requiresVision": true,
      "facts": [
        "Apple, kullanıcının daha önce satın aldığı içeriği geri yükleyebilmesi için satın alma ekranında bir 'Restore Purchases' mekanizması ister.",
        "Düğme metni 'Restore', 'Restore Purchases' veya 'Already subscribed?' şeklinde olabilir."
      ],
      "question": "Paywall / satın alma ekran görüntüsünde satın almaları geri yükleme seçeneği görünüyor mu (\"Restore\", \"Restore Purchases\", \"Already subscribed?\")? Görünmüyorsa bildir. Ekran görüntüleri arasında paywall yoksa bulgu üretme.\n",
      "ruleText": "Satın alınabilir içerik sunan uygulamalar, kullanıcının önceki satın alımlarını geri yükleyebileceği bir mekanizma sunmalıdır.\n",
      "positiveExample": "Paywall'da sadece 'Subscribe' ve 'Close' var; geri yükleme seçeneği yok.",
      "negativeExample": "Paywall'ın altında 'Restore Purchases' bağlantısı görünüyor.",
      "outcome": "violation",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.1-trial-naming",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "trial"
      ],
      "scope": "single",
      "needs": [
        "iap"
      ],
      "appliesWhen": {
        "hasIap": true
      },
      "question": "Abonelik olmayan bir deneme süresi sunuluyorsa, bunun için kullanılan tüketilemez (non-consumable) ürünün adı Apple'ın istediği kalıba uyuyor mu: \"XX-day Trial\" (ör. \"14-day Trial\") ve fiyatı 0 mı? Ürün adı deneme olduğunu söylüyor ama kalıba uymuyorsa ya da fiyatı sıfır değilse bildir. Abonelik ürünlerindeki ücretsiz deneme bu maddenin konusu değildir.\n",
      "ruleText": "Abonelik olmayan uygulamalar, tam sürüm kilidini açmadan önce zamana dayalı ücretsiz deneme sunabilir; bunun için Fiyat Katmanı 0 olan ve \"XX-day Trial\" adlandırma kuralına uyan bir tüketilemez uygulama içi satın alma öğesi tanımlanmalıdır. Deneme başlamadan önce uygulaman süresini, deneme bittiğinde erişilemeyecek içerik veya hizmetleri ve tam işlevsellik için ödenecek ücretleri açıkça belirtmelidir.\n",
      "positiveExample": "IAP: id=trial_pack [non_consumable] “Free Trial Unlock” — 4.99 USD",
      "negativeExample": "IAP: id=trial_14 [non_consumable] “14-day Trial” — 0 USD",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.1-unlock-outside-iap",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "unlocksContentWithoutIap": true
      },
      "question": "İçerik ya da işlev, uygulama içi satın alma DIŞINDA bir mekanizmayla açılıyor mu: lisans anahtarı, promosyon kodu, QR kod, AR işareti, kripto para ya da kripto cüzdan? Böyle bir yol varsa Apple bunu doğrudan yasaklıyor. (Donanıma bağlı açılan işlevler 3.1.4'ün ayrı istisnası; kurumsal ve reader istisnaları 3.1.3'te.)\n",
      "ruleText": "Uygulama içindeki özellikleri ya da işlevleri açmak istiyorsan uygulama içi satın alma kullanmak zorundasın. Uygulamalar içerik ya da işlev açmak için lisans anahtarı, artırılmış gerçeklik işareti, QR kod, kripto paralar ve kripto cüzdanları gibi kendi mekanizmalarını kullanamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.1a-external-purchase-link",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.1(a)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.1(a)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "iap",
        "payments",
        "entitlement",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasExternalPurchaseLink": true
      },
      "question": "Uygulamada IAP dışı satın almaya yönlendiren bağlantı varsa: (1) uygun entitlement'a (StoreKit External Purchase Link, Music Streaming Services ya da External Link Account) sahip misin, (2) bağlantı yalnızca entitlement'ın kapsadığı vitrinlerde mi gösteriliyor, (3) bağlantı metni yalnızca izin verilen bilgiyi mi veriyor (nerede ve nasıl satın alınacağı, öğelerin daha ucuz olabileceği), (4) yanıltıcı pazarlama ya da dolandırıcılık iması yok, değil mi? ABD vitrininde bu yasak uygulanmıyor.\n",
      "ruleText": "Geliştiriciler, dijital içerik veya hizmet satın almak üzere kendi sitelerine bağlantı vermek için entitlement başvurusu yapabilir. Bu entitlement'lar yalnızca belirli vitrinlerde iOS/iPadOS App Store'da kullanılabilir. ABD vitrini dışındaki tüm vitrinlerde, uygulamalar ve metadata'ları müşterileri uygulama içi satın alma dışındaki satın alma mekanizmalarına yönlendiren düğme, dış bağlantı ya da çağrı içeremez. Entitlement ile ilgili yanıltıcı pazarlama, dolandırıcılık ya da sahtekârlık uygulamanın kaldırılmasıyla sonuçlanır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.2-paywall-price-visibility",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "subscriptions",
        "paywall",
        "pricing",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "iap"
      ],
      "appliesWhen": {
        "hasSubscription": true
      },
      "requiresVision": true,
      "question": "Paywall ekran görüntüsünde abonelik FİYATI ve DÖNEMİ (haftalık/aylık/yıllık) birlikte, okunabilir biçimde görünüyor mu? Ayrıca ekranda görünen fiyat, sana verilen abonelik paketlerinin fiyatlarıyla uyuşuyor mu? Fiyat hiç görünmüyorsa ya da dönem belirtilmemişse bildir. Ekranda görünen fiyat tanımlı paketlerden farklıysa ayrıca bildir.\n",
      "ruleText": "Abonelik satın alma ekranında fiyat ve abonelik dönemi kullanıcıya açıkça gösterilmelidir; gösterilen fiyat gerçek fiyatla aynı olmalıdır.\n",
      "positiveExample": "Paywall'da yalnızca 'Start Free Trial' yazıyor, fiyat ve dönem hiç görünmüyor.",
      "negativeExample": "Paywall'da '$9.99 / week, auto-renews' açıkça yazıyor.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.2-paywall-terms-links",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "subscriptions",
        "paywall",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "iap"
      ],
      "appliesWhen": {
        "hasSubscription": true
      },
      "requiresVision": true,
      "facts": [
        "Apple, abonelik satın alma ekranında Kullanım Şartları (EULA/Terms of Use) ve Gizlilik Politikası bağlantılarının GÖRÜNÜR olmasını şart koşar.",
        "Bu bağlantılar ekranın altında küçük punto ile yer alabilir; varlıkları yeterlidir."
      ],
      "question": "Ekran görüntüleri arasında bir abonelik/satın alma (paywall) ekranı var mı? Varsa, o ekranda \"Terms of Use\", \"Terms\", \"EULA\" veya \"Privacy Policy\" bağlantıları görünüyor mu? Hiçbiri görünmüyorsa bunu bildir. Paywall ekranı hiç yoksa bulgu üretme.\n",
      "ruleText": "Otomatik yenilenen abonelik satın alma ekranında Kullanım Şartları ve Gizlilik Politikası bağlantıları kullanıcıya görünür olmalıdır.\n",
      "positiveExample": "Paywall ekranında yalnızca 'Continue' düğmesi ve fiyat var; şart/gizlilik bağlantısı yok.",
      "negativeExample": "Paywall ekranının altında 'Terms of Use · Privacy Policy · Restore' satırı görünüyor.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.2-subscription-disclosure",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        "retrievedAt": "2026-08-18"
      },
      "tags": [
        "subscriptions",
        "monetization"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "promotionalText",
        "subtitle",
        "iap",
        "screenshots"
      ],
      "appliesWhen": {
        "hasSubscription": true
      },
      "question": "Listing (metin + ekran görüntüleri) otomatik yenilenen bir abonelik ima ediyor mu? Ediyorsa şu dördü de açıkça belirtilmiş mi: (1) abonelik dönemi (haftalık/aylık/yıllık), (2) o dönemin fiyatı, (3) otomatik yenileneceği, (4) kullanım şartları ve gizlilik politikası erişimi.\nTEK BULGU ÜRET. Eksik olan maddeleri o tek bulgunun gerekçesinde say (\"dönem ve fiyat yazılmamış, otomatik yenileme belirtilmemiş\"). ÜRÜN BAŞINA AYRI BULGU ÜRETME: eksiklik listing metnindedir, ürünlerde değil. Sekiz abonelik için sekiz bulgu yazmak tek sorunu sekiz kez saydırır, raporu okunmaz yapar ve düzeltilecek şey yine tek bir metindir.\nAyrı bir bulgu YALNIZCA şunun için üretilir: metinde/görselde geçen bir fiyat, verilen abonelik paketlerinin fiyatıyla ÇELİŞİYORSA.\n",
      "ruleText": "Otomatik yenilenen abonelik satan uygulamalar; abonelik süresini, dönem başına fiyatı ve otomatik yenileme koşulunu kullanıcıya satın alma öncesi net biçimde göstermelidir. Kullanım şartları ve gizlilik politikası erişilebilir olmalıdır.\n",
      "positiveExample": "Start your 3-day free trial today. Only $9.99.",
      "negativeExample": "Glamio Pro — $9.99/week, auto-renews weekly. Cancel anytime in Settings. Terms: glamio.com/terms",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 2
    },
    {
      "id": "apple-3.1.2a-subscription-value",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2(a)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(a)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "subscriptions",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasSubscription": true
      },
      "question": "Abonelikte: (1) kullanıcıya SÜREKLİ değer sunuluyor mu (tek seferlik bir kilidi açıp bitmiyor), (2) abonelik kullanıcının uygulamanın bulunduğu tüm cihazlarında çalışıyor mu, (3) kullanıcı ödediği şeye ulaşmak için ek görev yapmak zorunda mı (sosyal medyada paylaşma, kişi listesi yükleme, günlük giriş gibi — bunlar yasak), (4) mevcut kullanıcıların daha önce satın aldığı temel işlev abonelik modeline geçerken elinden alınıyor mu?\n",
      "ruleText": "Otomatik yenilenen abonelik sürekli değer sunmalı ve kullanıcının tüm cihazlarında çalışmalıdır. Abonelik sunan uygulamalar, kullanıcının ödediği şeye sosyal medyada paylaşım yapmak, kişi yüklemek ya da uygulamaya belirli sayıda giriş yapmak gibi ek görevler olmadan ulaşmasına izin vermelidir. Mevcut uygulamanı abonelik modeline çeviriyorsan, kullanıcıların halihazırda satın aldığı temel işlevi ellerinden almamalısın.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.2b-upgrade-downgrade",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2(b)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(b)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "subscriptions",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasSubscription": true
      },
      "question": "Kullanıcı abonelik yükseltme ve düşürme işlemini sorunsuz yapabiliyor mu? Aynı şeyin farklı varyasyonlarına yanlışlıkla aynı anda abone olmak mümkün mü (ör. hem aylık hem yıllık plana birden)?\n",
      "ruleText": "Kullanıcılar sorunsuz bir yükseltme/düşürme deneyimi yaşamalı ve aynı şeyin birden fazla varyasyonuna yanlışlıkla abone olamamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.2c-subscription-information",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.2(c)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.2(c)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "subscriptions",
        "disclosure",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasSubscription": true
      },
      "question": "Abone olmayı istemeden ÖNCE kullanıcı ne aldığını net olarak biliyor mu: fiyat karşılığında tam olarak ne verildiği (ayda kaç sayı, ne kadar bulut alanı, hizmete nasıl bir erişim)? Bu bilgi paywall ekranında mı, yoksa yalnız mağaza açıklamasında mı duruyor?\n",
      "ruleText": "Bir müşteriden abone olmasını istemeden önce, ödeyeceği fiyat karşılığında ne alacağını açıkça anlatmalısın: ayda kaç sayı, ne kadar bulut depolama, hizmetine ne tür bir erişim. Apple Developer Program Lisans Sözleşmesi Ek 2'deki gereklilikleri de açıkça ilettiğinden emin ol.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.3a-reader-apps",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(a)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(a)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "reader",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "magazine",
        "newspaper",
        "books",
        "audiobook",
        "music",
        "video",
        "streaming",
        "reader",
        "subscription content"
      ],
      "question": "Uygulama bir \"reader\" uygulaması mı (dergi, gazete, kitap, ses, müzik, video içeriğine erişim)? Öyleyse: (1) yalnızca daha önce satın alınmış içeriğe ya da içerik aboneliğine erişim mi sunuluyor, (2) ücretsiz katman için hesap oluşturma ve mevcut müşteriler için hesap yönetimi dışında uygulama içinde satın alma yapılıyor mu, (3) hesap oluşturma/yönetme bağlantısı veriyorsan External Link Account Entitlement'ın var mı? (ABD vitrininde bu entitlement gerekmiyor.)\n",
      "ruleText": "Reader uygulamaları kullanıcının daha önce satın aldığı içeriğe ya da içerik aboneliklerine (dergi, gazete, kitap, ses, müzik, video) erişmesine izin verebilir. Ücretsiz katmanlar için hesap oluşturma ve mevcut müşteriler için hesap yönetimi sunulabilir. Geliştiriciler, hesap oluşturmak veya yönetmek üzere kendi sitelerine bilgilendirici bir bağlantı vermek için External Link Account Entitlement başvurusu yapabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.3b-multiplatform",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(b)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(b)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "web version",
        "desktop",
        "cross-platform",
        "multiplatform",
        "pc",
        "console",
        "also on the web"
      ],
      "question": "Kullanıcı başka platformda (web, PC, konsol) edindiği içeriğe, aboneliğe ya da özelliğe uygulamada erişebiliyor mu? Erişebiliyorsa, aynı öğeler uygulama İÇİNDE de uygulama içi satın alma olarak sunuluyor mu? Çok platformlu oyunlardaki tüketilebilir öğeler de bu şarta tabi.\n",
      "ruleText": "Birden fazla platformda çalışan uygulamalar, kullanıcıların başka platformlarda ya da web sitende edindikleri içeriğe, aboneliklere veya özelliklere — çok platformlu oyunlardaki tüketilebilir öğeler dâhil — erişmesine izin verebilir; yeter ki bu öğeler uygulama içinde de uygulama içi satın alma olarak sunuluyor olsun.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.3c-enterprise-services",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(c)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(c)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "enterprise",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "enterprise",
        "organization",
        "organizations",
        "school",
        "classroom",
        "employees",
        "students",
        "b2b",
        "teams"
      ],
      "question": "Uygulama yalnızca kurumlara/gruplara (çalışanları ya da öğrencileri için) doğrudan senin tarafından mı satılıyor? Öyleyse kurumsal kullanıcıların daha önce satın alınmış içeriğe erişmesine izin verilebilir. Bireysel, tek kullanıcılı ya da aile satışları uygulama içi satın alma kullanmak zorunda — uygulamada böyle bir satış var mı?\n",
      "ruleText": "Uygulaman yalnızca kurumlara ya da gruplara, çalışanları veya öğrencileri için doğrudan senin tarafından satılıyorsa (ör. profesyonel veritabanları, sınıf yönetim araçları), kurumsal kullanıcıların daha önce satın alınmış içeriğe veya aboneliklere erişmesine izin verebilirsin. Tüketiciye, tek kullanıcıya ya da aileye yapılan satışlar uygulama içi satın alma kullanmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.3d-person-to-person",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(d)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(d)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "tutor",
        "tutoring",
        "consultation",
        "coaching",
        "lesson",
        "training",
        "session",
        "appointment",
        "booking",
        "therapist"
      ],
      "question": "Uygulama iki kişi arasında GERÇEK ZAMANLI birebir hizmet satışı sağlıyorsa (özel ders, tıbbi danışma, emlak turu, kişisel antrenman) uygulama içi satın alma dışında ödeme alabilirsin. Ancak bire-birkaç ya da bire-çok gerçek zamanlı hizmetler (grup dersi, webinar) uygulama içi satın alma kullanmak zorunda — uygulamadaki hizmet hangisi?\n",
      "ruleText": "Uygulaman iki birey arasında gerçek zamanlı, kişiden kişiye hizmet satın alınmasını sağlıyorsa (öğrenciye özel ders, tıbbi danışma, emlak turu, kişisel antrenman) bu ödemeleri toplamak için uygulama içi satın alma dışındaki ödeme yöntemlerini kullanabilirsin. Bire-birkaç ve bire-çok gerçek zamanlı hizmetler uygulama içi satın alma kullanmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.3e-physical-goods",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(e)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(e)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "sellsPhysicalGoodsOrServices": true
      },
      "question": "Fiziksel mal ya da uygulama dışında tüketilen hizmet satan uygulamada ödeme uygulama içi satın alma DIŞINDA mı toplanıyor (Apple Pay ya da kredi kartı)? Bu satışlar için IAP kullanmak da ihlaldir — kullanılıyorsa bildir.\n",
      "ruleText": "Uygulaman insanların uygulama dışında tüketilecek fiziksel mal veya hizmet satın almasını sağlıyorsa, bu ödemeleri toplamak için Apple Pay ya da geleneksel kredi kartı girişi gibi uygulama içi satın alma dışındaki yöntemleri kullanmak ZORUNDASIN.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.1.3f-free-companion",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(f)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(f)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "companion",
        "cloud storage",
        "voip",
        "hosting",
        "web app",
        "existing account"
      ],
      "question": "Uygulama, ücretli bir web tabanlı aracın (VoIP, bulut depolama, e-posta, web hosting) ücretsiz yardımcı uygulaması mı? Öyleyse uygulamanın İÇİNDE hiçbir satın alma ve dışarıda satın almaya yönelik hiçbir çağrı bulunmamalı — var mı?\n",
      "ruleText": "Ücretli, web tabanlı bir aracın (VoIP, bulut depolama, e-posta hizmetleri, web hosting) bağımsız yardımcısı olan ücretsiz uygulamalar, uygulama içinde hiçbir satın alma ve uygulama dışında satın almaya yönelik hiçbir çağrı bulunmaması koşuluyla uygulama içi satın alma kullanmak zorunda değildir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.3g-advertising-management",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.3(g)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.3(g)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "ads",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "advertiser",
        "advertisers",
        "campaign",
        "ad manager",
        "boost",
        "promote your post"
      ],
      "question": "Uygulama yalnızca reklam verenlerin kampanya satın alıp yönetmesi için mi? Öyleyse uygulama içi satın alma gerekmez — ama uygulama reklamların KENDİSİNİ göstermemeli. Aynı uygulama içinde tüketilecek dijital satın almalar (ör. sosyal uygulamada gönderi \"boost\"u) uygulama içi satın alma kullanmak zorunda.\n",
      "ruleText": "Yalnızca reklam verenlerin çeşitli mecralarda reklam kampanyası satın alıp yönetmesini sağlayan uygulamalar uygulama içi satın alma kullanmak zorunda değildir. Bu uygulamalar kampanya yönetimi içindir ve reklamların kendisini göstermez. Bir uygulamada deneyimlenen ya da tüketilen içerik için yapılan dijital satın almalar — aynı uygulamada gösterilecek reklam satın almak, ör. gönderi \"boost\"ları dâhil — uygulama içi satın alma kullanmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.4-hardware-specific-content",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "hardware",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "unlocksContentWithoutIap": true
      },
      "question": "İşlev bir donanıma bağlı olarak açılıyorsa: (1) bu gerçekten donanıma bağlı bir özellik mi (ör. teleskopla eşleşince açılan gökbilim özellikleri), (2) onaylı bir fiziksel ürünle isteğe bağlı çalışan özellikler için AYRICA bir uygulama içi satın alma seçeneği de sunuluyor mu, (3) işlevi açmak için kullanıcıdan ilgisiz ürün satın alması ya da pazarlama etkinliğine katılması isteniyor mu (yasak)?\n",
      "ruleText": "Sınırlı durumlarda, özellikler çalışmak için belirli bir donanıma bağlıysa uygulama o işlevi uygulama içi satın alma kullanmadan açabilir. Onaylı bir fiziksel ürünle (ör. oyuncak) isteğe bağlı olarak çalışan özellikler, bir uygulama içi satın alma seçeneği de sunulması koşuluyla açılabilir. Ancak uygulama işlevini açmak için kullanıcılardan ilgisiz ürünler satın almasını ya da reklam/pazarlama etkinliklerine katılmasını isteyemezsin.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.1.5-cryptocurrencies",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.1.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.1.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "crypto",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "crypto",
        "cryptocurrency",
        "bitcoin",
        "ethereum",
        "wallet",
        "exchange",
        "mining",
        "ico",
        "blockchain",
        "token",
        "airdrop"
      ],
      "question": "Kripto para işlevi varsa Apple'ın beş alt kuralı: (i) cüzdan sunuyorsan geliştirici hesabın ORGANİZASYON olarak kayıtlı mı, (ii) cihazda madencilik yapılmıyor (yalnız cihaz dışı/bulut madencilik serbest), (iii) alım satım yalnızca onaylı bir borsada ve yalnızca lisans/izinlerin olduğu ülkelerde mi sunuluyor, (iv) ICO, kripto vadeli işlem ya da kripto menkul kıymet işlemi varsa uygulama bir banka, aracı kurum ya da onaylı finansal kurumdan mı geliyor, (v) uygulama indirme, davet, sosyal paylaşım gibi görevler karşılığında kripto para VERİYOR mu (yasak)?\n",
      "ruleText": "(i) Cüzdanlar: uygulamalar sanal para depolamayı kolaylaştırabilir, yeter ki organizasyon olarak kayıtlı geliştiriciler tarafından sunulsun. (ii) Madencilik: işlem cihaz dışında yapılmadıkça kripto madenciliği yapılamaz. (iii) Borsalar: onaylı bir borsada kripto işlemleri yalnızca uygun lisans ve izinlerin olduğu ülke veya bölgelerde kolaylaştırılabilir. (iv) ICO'lar, kripto vadeli işlemler ve diğer kripto menkul kıymet işlemleri yerleşik bankalardan, menkul kıymet firmalarından, FCM'lerden ya da onaylı finansal kurumlardan gelmeli ve tüm ilgili yasalara uymalıdır. (v) Kripto para uygulamaları, başka uygulamaları indirmek, başkalarını indirmeye teşvik etmek ya da sosyal ağlarda paylaşım yapmak gibi görevlerin karşılığında para birimi teklif edemez.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.2.1vi-nonprofit-fundraising",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "donations",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "donate",
        "donation",
        "donations",
        "charity",
        "fundraise",
        "fundraising",
        "nonprofit",
        "bağış"
      ],
      "question": "Uygulama içinde bağış topluyorsan: (1) Apple'ın onayladığı bir kâr amacı gütmeyen kuruluş musun, (2) Apple Pay desteği var mı, (3) toplanan paranın nasıl kullanılacağı açıklanıyor mu, (4) bağışçılara uygun vergi makbuzu sağlanıyor mu, (5) başka kuruluşlara bağış aktaran bir platformsan listelenen her kuruluş da onay sürecinden geçti mi? Onaylı kuruluş DEĞİLSEN uygulama içinde bağış toplayamazsın: uygulama ücretsiz olmalı ve bağış yalnızca uygulama dışında (Safari, SMS) toplanmalı.\n",
      "ruleText": "Onaylı kâr amacı gütmeyen kuruluşlar kendi uygulamalarında ya da üçüncü taraf uygulamalarda doğrudan bağış toplayabilir; bu kampanyalar tüm App Review kurallarına uymalı ve Apple Pay desteklemelidir. Bu uygulamalar fonların nasıl kullanılacağını açıklamalı, tüm yerel ve federal yasalara uymalı ve bağışçılara uygun vergi makbuzlarının sunulmasını sağlamalıdır. Onaylı kâr amacı gütmeyen kuruluş değilsen, uygulama içinde hayır kurumları ve bağış kampanyaları için fon toplayamazsın; bu tür uygulamalar App Store'da ücretsiz olmalı ve fonları yalnızca Safari veya SMS gibi uygulama dışı yollarla toplayabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.2.1vii-personal-gifts",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "tip",
        "tips",
        "tipping",
        "gift",
        "send money",
        "support the creator",
        "bahşiş"
      ],
      "question": "Kullanıcıların birbirine para hediye etmesi ya da bahşiş göndermesi varsa: (1) hediye tamamen gönderenin isteğine mi bağlı, (2) paranın %100'ü alıcıya mı gidiyor? Hediye herhangi bir anda dijital içerik veya hizmet almaya bağlanıyorsa uygulama içi satın alma kullanmak ZORUNLU.\n",
      "ruleText": "Uygulamalar, bireysel kullanıcıların başka bir bireye uygulama içi satın alma kullanmadan parasal hediye vermesini sağlayabilir; yeter ki (a) hediye tamamen verenin isteğine bağlı bir seçim olsun ve (b) fonların %100'ü hediyenin alıcısına gitsin. Ancak herhangi bir anda dijital içerik veya hizmet almaya bağlanan bir hediye uygulama içi satın alma kullanmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.2.1viii-financial-services",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "finance",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "trading",
        "invest",
        "investment",
        "broker",
        "stocks",
        "forex",
        "portfolio",
        "banking",
        "wealth",
        "money management"
      ],
      "question": "Finansal işlem, yatırım ya da para yönetimi hizmeti sunan uygulama, bu hizmeti VEREN finansal kurum tarafından mı gönderiliyor? Uygulamanın sunulduğu tüm ülkelerde gerekli lisans ve izinler var mı? (5.1.1(ix) ayrıca bu tür düzenlemeye tabi hizmetlerin bireysel geliştirici hesabıyla gönderilmemesini istiyor.)\n",
      "ruleText": "Finansal işlem, yatırım veya para yönetimi için kullanılan uygulamalar, bu hizmetleri veren finansal kurum tarafından gönderilmeli ve uygulamayı sunduğun yerlerde gerekli lisans ve izinlere sahip olmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.2.2i-app-catalog",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "app store",
        "best apps",
        "app collection",
        "app directory",
        "top apps",
        "app catalog"
      ],
      "question": "Uygulama, üçüncü taraf uygulamaları, uzantıları ya da eklentileri App Store benzeri bir arayüzde veya genel amaçlı bir koleksiyon olarak gösteriyor mu? Bu yasak. Belirli ve onaylı bir ihtiyaca yönelik (sağlık yönetimi, havacılık, erişilebilirlik) ve güçlü editoryal içerik sunan derlemeler 3.2.1(ii) kapsamında kabul edilebilir — uygulama hangisi?\n",
      "ruleText": "Üçüncü taraf uygulamaları, uzantıları ya da eklentileri App Store'a benzer biçimde veya genel amaçlı bir koleksiyon olarak gösteren bir arayüz oluşturmak kabul edilemez. Belirli ve onaylı bir ihtiyaca yönelik üçüncü taraf uygulama derlemeleri, uygulaman sırf bir vitrin gibi görünmeyecek kadar güçlü editoryal içerik sunuyorsa kabul edilebilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.2.2iii-ad-heavy-app",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "ads",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "showsAds": true
      },
      "question": "Uygulama ağırlıklı olarak reklam göstermek için mi tasarlanmış? Reklam gösterimi ya da tıklaması yapay olarak artırılıyor mu (otomatik tıklama, kullanıcıyı kandıran yerleşim, reklamı içerik gibi gösterme)? Reklam yoğunluğu uygulamanın kendi işlevini gölgeliyorsa bu maddeye girer.\n",
      "ruleText": "Reklam gösterimlerinin ya da tıklamalarının yapay olarak artırılması ve ağırlıklı olarak reklam göstermek için tasarlanmış uygulamalar kabul edilemez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-3.2.2ix-loan-terms",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "finance",
        "disclosure"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "loan",
        "loans",
        "lending",
        "credit",
        "apr",
        "borrow",
        "borrowing",
        "installment",
        "cash advance",
        "payday",
        "cash in minutes",
        "repay",
        "repayment",
        "interest rate",
        "instant cash",
        "get cash",
        "finance",
        "financing"
      ],
      "question": "Uygulama kişisel kredi sunuyorsa metin, kredi koşullarını açık ve göze çarpar biçimde veriyor mu: eşdeğer azami yıllık maliyet oranı (APR) ve ödeme tarihi? Ayrıca azami APR %36'yı aşıyor mu ya da geri ödeme 60 gün veya daha kısa sürede tam olarak isteniyor mu? Bunlardan biri varsa bildir.\n",
      "ruleText": "Kişisel kredi sunan uygulamalar, eşdeğer azami yıllık maliyet oranı (APR) ve ödeme tarihi dâhil tüm kredi koşullarını açık ve göze çarpar biçimde açıklamalıdır. Kredi uygulamaları, maliyet ve ücretler dâhil %36'dan yüksek bir azami APR uygulayamaz ve 60 gün ya da daha kısa sürede tam geri ödeme talep edemez.\n",
      "positiveExample": "Get cash in minutes. Repay within 30 days. Fees apply.",
      "negativeExample": "Personal loans from 12 to 60 months. Max APR 29.9% including fees; see the schedule before you sign.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 2
    },
    {
      "id": "apple-3.2.2v-arbitrary-restrictions",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "only available in",
        "carrier",
        "operator",
        "region locked",
        "only for users in"
      ],
      "question": "Uygulamayı kimin kullanabileceği keyfî olarak kısıtlanıyor mu (konuma ya da operatöre göre)? Yasal zorunluluk ya da lisans kaynaklı coğrafi kısıt bu maddenin konusu değildir — 5.3.4 ve 5.1.1(ix) bazı durumlarda coğrafi kısıt ZORUNLU kılıyor.\n",
      "ruleText": "Uygulamayı kimin kullanabileceğinin keyfî biçimde kısıtlanması — ör. konuma ya da operatöre göre — kabul edilemez.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-3.2.2vii-rank-manipulation",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "fraud"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "followers",
        "likes",
        "views",
        "subscribers",
        "boost your",
        "grow your account",
        "rank higher",
        "engagement"
      ],
      "question": "Uygulama, başka bir serviste kullanıcının görünürlüğünü, statüsünü ya da sıralamasını yapay olarak yükseltmeyi vaat ediyor mu (takipçi, beğeni, izlenme, abone satın alma; sıralama yükseltme)? Bu, o servisin şartları açıkça izin vermediği sürece yasak. Kendi içeriğini planlayıp yayınlamaya yarayan araçlar ihlal değildir.\n",
      "ruleText": "Bir kullanıcının başka servislerdeki görünürlüğünü, statüsünü ya da sıralamasını yapay olarak manipüle etmek, o servisin şartları izin vermediği sürece kabul edilemez.\n",
      "positiveExample": "Buy real Instagram followers and likes — boost your rank overnight.",
      "negativeExample": "Schedule and publish your own posts to Instagram and X from one place.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.2.2viii-binary-options",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "finance"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText"
      ],
      "prefilter": [
        "binary option",
        "binary options",
        "cfd",
        "forex",
        "derivative",
        "leverage",
        "expiry",
        "trading signals"
      ],
      "question": "Uygulama ikili opsiyon (binary options) işlemi sunuyor mu? Bu App Store'da tamamen yasak. CFD ya da FOREX gibi türev işlemleri sunuyorsa, hizmetin verildiği tüm yargı alanlarında lisanslı olduğunu gösteren bir ifade var mı?\n",
      "ruleText": "İkili opsiyon işlemlerini kolaylaştıran uygulamalara App Store'da izin verilmez. Fark sözleşmeleri (CFD) ya da FOREX gibi diğer türevlerde işlem yapılmasını sağlayan uygulamalar, hizmetin sunulduğu tüm yargı alanlarında uygun lisansa sahip olmalıdır.\n",
      "positiveExample": "Trade binary options with 60-second expiry and earn up to 90% profit.",
      "negativeExample": "Track your stock portfolio and set price alerts. No trading in the app.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-3.2.2x-forced-actions",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "3.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#3.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "dark-patterns",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "rate us",
        "rate the app",
        "review us",
        "share to unlock",
        "invite friends to unlock",
        "watch an ad to unlock",
        "download to continue"
      ],
      "question": "Uygulama, işleve ya da içeriğe erişmek için kullanıcıyı zorluyor mu: puan/yorum vermek, başka uygulama indirmek, mağazayla ilgili başka bir eylem yapmak? Bunlar yasak. Uygulama içi eylemleri (seviye tamamlamak, reklam izlemek) TEŞVİK etmek serbest — zorunlu kılmak değil.\n",
      "ruleText": "Uygulamalar, işleve, içeriğe ya da uygulamanın kullanımına erişmek için kullanıcıları uygulamayı puanlamaya, yorum yapmaya, başka uygulamalar indirmeye ya da mağazayla ilgili başka eylemlere zorlayamaz. Uygulamalar kullanıcıları uygulama içindeki belirli eylemleri (bir seviyeyi tamamlamak, reklam izlemek) yapmaya başka biçimlerde teşvik edebilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.1-copycat",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "ip",
        "metadata"
      ],
      "scope": "cross",
      "needs": [
        "name",
        "subtitle",
        "description",
        "keywords"
      ],
      "question": "Metin, başka bir uygulamayı ya da servisi taklit ettiğini gösteriyor mu: popüler bir uygulamanın adının küçük bir varyasyonu, \"X uygulamasının alternatifi/klonu\" ifadesi, ya da başka bir geliştiricinin marka/ürün adının uygulama adında kullanılması? Karşılaştırma yapmak (\"X'ten daha hızlı\") tek başına ihlal değildir; ihlal, kimliği ödünç almaktır.\n",
      "ruleText": "Başka bir uygulamanın adında ya da arayüzünde küçük değişiklikler yapıp onu kendi uygulamanmış gibi sunma. Başka uygulamaları veya servisleri taklit eden uygulamalar Developer Code of Conduct ihlali sayılır. Başka bir geliştiricinin simgesini, markasını ya da ürün adını, o geliştiricinin onayı olmadan kendi uygulamanın simgesinde veya adında kullanamazsın.\n",
      "positiveExample": "WhatsApp Pro — the better WhatsApp, same look and feel.",
      "negativeExample": "A private messenger with end-to-end encryption and disappearing messages.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.10-monetizing-built-in-capabilities",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.10",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.10",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "business",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "icloud",
        "screen time",
        "push notification",
        "apple music",
        "camera access",
        "gyroscope"
      ],
      "question": "Uygulama, donanımın ya da işletim sisteminin YERLEŞİK yeteneklerini paraya çeviriyor mu (push bildirimleri, kamera, jiroskop) ya da Apple servislerini ve teknolojilerini (Apple Music erişimi, iCloud depolama, Screen Time API'leri) satıyor mu? Bunların kendisini ücretlendirmek yasak.\n",
      "ruleText": "Donanımın veya işletim sisteminin sağladığı yerleşik yetenekleri (Push Notifications, kamera, jiroskop gibi) ya da Apple servis ve teknolojilerini (Apple Music erişimi, iCloud depolama, Screen Time API'leri gibi) paraya çeviremezsin.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.2-minimum-functionality",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#design",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "completeness"
      ],
      "scope": "single",
      "needs": [],
      "question": "Uygulama esasen web sitesinin bir sarmalayıcısı mı? Yerel işlev sunuyor mu (bildirim, çevrimdışı, cihaz özellikleri)? Bir tarayıcıda açmaktan farkı ne? Bu, listing icerigine bakarak guvenilir sekilde yargilanamaz.\n",
      "ruleText": "Uygulamalar bir web sitesini paketlemekten fazlasini sunmali, yeterli yerel islevsellige sahip olmalidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.2-webview-wrapper",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "minimum-functionality",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "isWebViewWrapper": true
      },
      "question": "Uygulama esas olarak bir web sitesini gösteriyorsa: sitenin ötesine geçen hangi yerel değeri sunuyor (çevrimdışı çalışma, bildirim, kamera/konum entegrasyonu, cihaz özellikleri, yerel arayüz)? \"Yeniden paketlenmiş web sitesi\"nin ötesine geçtiğini gösteren somut bir özellik yoksa bu gönderim 4.2'den reddedilir.\n",
      "ruleText": "Uygulaman, onu yeniden paketlenmiş bir web sitesinin ötesine taşıyan özellikler, içerik ve arayüz sunmalıdır. Uygulaman özellikle yararlı, özgün ya da \"uygulama gibi\" değilse App Store'a ait değildir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.2.1-arkit",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "ar ",
        "augmented reality",
        "arkit",
        "3d model",
        "ar view"
      ],
      "question": "ARKit kullanılıyorsa deneyim zengin ve bütünleşik mi? Bir modeli AR görünümüne bırakmak ya da bir animasyonu oynatmak tek başına yeterli değil.\n",
      "ruleText": "ARKit kullanan uygulamalar zengin ve bütünleşik artırılmış gerçeklik deneyimleri sunmalıdır; bir modeli AR görünümüne bırakmak veya animasyon oynatmak yeterli değildir.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-4.2.2-not-marketing-material",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "links",
        "directory",
        "catalog",
        "aggregator",
        "rss",
        "feed",
        "news reader",
        "bookmark"
      ],
      "question": "Uygulama esasen pazarlama materyali, reklam, web kırpıntısı, içerik toplayıcı ya da bağlantı derlemesi mi? Katalog uygulamaları istisna; diğerleri bu maddeden reddedilir.\n",
      "ruleText": "Kataloglar dışında uygulamalar esas olarak pazarlama materyali, reklam, web kırpıntısı, içerik toplayıcı ya da bağlantı koleksiyonu olmamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.2.3-standalone-and-downloads",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "(i) Uygulama başka bir uygulamanın kurulmasını gerektirmeden kendi başına çalışıyor mu? (ii) İlk açılışta çalışabilmek için ek kaynak indirmesi gerekiyorsa, indirmenin boyutu kullanıcıya söyleniyor ve onayı alınıyor mu?\n",
      "ruleText": "Uygulaman başka bir uygulamanın kurulmasını gerektirmeden kendi başına çalışmalıdır. İlk açılışta çalışmak için ek kaynak indirmesi gerekiyorsa, indirmenin boyutunu açıkla ve indirmeden önce kullanıcıya sor.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.2.6-template-apps",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "spam",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "template",
        "white label",
        "app builder",
        "app generator",
        "no-code",
        "for your business"
      ],
      "question": "Uygulama ticari bir şablondan ya da uygulama üretme hizmetinden mi oluşturuldu? Öyleyse gönderimi, uygulamanın İÇERİĞİNİN sahibi yapmak zorunda — şablon sağlayıcısı müşterisi adına gönderemez. Şablon sağlayıcısıysan, tüm müşteri içeriğini tek bir binary'de toplayan bir \"seçici\" model kabul edilir.\n",
      "ruleText": "Ticari bir şablondan ya da uygulama üretme hizmetinden oluşturulan uygulamalar, doğrudan uygulamanın içerik sağlayıcısı tarafından gönderilmedikçe reddedilir. Bu hizmetler müşterileri adına uygulama göndermemeli; müşterilerinin özelleştirilmiş, yenilikçi ve özgün deneyimler üretmesine izin veren araçlar sunmalıdır. Şablon sağlayıcıları için kabul edilebilir bir seçenek de tüm müşteri içeriğini toplu ya da \"seçici\" bir modelde barındıran tek bir binary oluşturmaktır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.2.7-remote-desktop",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.2.7",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.2.7",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "remote desktop",
        "rdp",
        "vnc",
        "stream your pc",
        "mirror your",
        "remote access",
        "cloud gaming"
      ],
      "question": "Uzak masaüstü uygulaması belirli bir yazılımın/servisin aynası gibi davranıyorsa beş şart: (a) yalnızca kullanıcının sahip olduğu kişisel bilgisayara ya da oyun konsoluna, aynı yerel ağ üzerinden bağlanıyor mu, (b) yazılım tamamen ana cihazda mı çalışıp orada mı işleniyor, (c) hesap oluşturma ve yönetimi ana cihazdan mı başlatılıyor, (d) istemcideki arayüz iOS/App Store görünümüne benzemiyor, mağaza gibi davranmıyor ve kullanıcının sahip olmadığı yazılımı göz atma/seçme/satın alma imkânı vermiyor, değil mi, (e) uygulama bulut tabanlı uygulamalar için ince istemci değil, değil mi?\n",
      "ruleText": "Uzak masaüstü uygulaması, ana cihazın genel bir aynası yerine belirli bir yazılımın ya da servisin aynası gibi davranıyorsa: yalnızca kullanıcının sahip olduğu kişisel bilgisayara ya da özel oyun konsoluna ve yerel ağ üzerinden bağlanmalı; yazılım tamamen ana cihazda çalışıp orada işlenmeli; hesap oluşturma ve yönetimi ana cihazdan başlatılmalı; istemcideki arayüz iOS ya da App Store görünümüne benzememeli, mağaza benzeri bir arayüz sunmamalı ve kullanıcının sahip olmadığı yazılımı göz atma, seçme veya satın alma imkânı vermemelidir. Bulut tabanlı uygulamalar için ince istemciler App Store'a uygun değildir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.3-duplicate-bundles",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "spam",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Aynı uygulamanın birden çok Bundle ID ile farklı sürümleri App Store'da mı (her şehir, takım, üniversite ya da müşteri için ayrı uygulama)? Apple bunun yerine tek bir uygulama ve varyasyonların uygulama içi satın alma ile sunulmasını istiyor.\n",
      "ruleText": "Aynı uygulamanın birden fazla Bundle ID'sini oluşturma (ör. dünyadaki her şehir için ayrı harita uygulaması yerine her şehri aratabilen tek bir uygulama). Uygulamanın belirli konumlar, spor takımları, üniversiteler vb. için farklı sürümleri varsa tek bir uygulama gönderip varyasyonları uygulama içi satın almayla sunmayı düşün.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.3-spam-template",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#design",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "spam"
      ],
      "scope": "single",
      "needs": [],
      "question": "Uygulama bir şablondan/jeneratörden üretilmiş ya da mağazadaki benzerlerinden ayırt edilemez mi? Ayırt edici bir işlevi var mı? Bu, listing icerigine bakarak guvenilir sekilde yargilanamaz.\n",
      "ruleText": "Sablondan uretilmis, ayirt edici islevi olmayan veya mevcut uygulamalarin kopyasi olan gonderimler spam olarak reddedilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.3b-commodity-genres",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "design",
        "spam",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "category",
        "keywords"
      ],
      "prefilter": [
        "flashlight",
        "wallpaper",
        "wallpapers",
        "fortune",
        "horoscope",
        "dating",
        "sound effects",
        "timer",
        "fart",
        "drinking game",
        "kama sutra",
        "soundboard"
      ],
      "question": "Uygulama, Apple'ın adıyla saydığı doygun türlerden birine mi giriyor (flört, fener, ses efektleri, duvar kâğıdı, basit zamanlayıcı, falcılık) ya da düşük kaliteli saydığı türlerden biri mi (içki oyunları, Kama Sutra, osuruk, geğirme)? Öyleyse metin, anlamlı biçimde FARKLI ya da GELİŞMİŞ bir deneyim sunduğunu gösteriyor mu? Ayırt edici bir şey vaat etmiyorsa bildir.\n",
      "ruleText": "Halihazırda yaygın olarak bulunanlardan ayırt edilemeyen uygulamalar gönderme. Flört, fener, ses efektleri, duvar kâğıdı, basit zamanlayıcı ve falcılık gibi belirli uygulama türleri App Store'da yerleşiktir ve anlamlı biçimde farklı ya da geliştirilmiş bir deneyim sunmadıkça yeni gönderimler kabul edilmez. İçki oyunları, Kama Sutra, osuruk ve geğirme uygulamaları gibi türler ise vasat, düşük kaliteli ya da düşük çabalıdır ve App Store'a değer katmaz.\n",
      "positiveExample": "Simple flashlight — turn your screen white and tap to toggle brightness.",
      "negativeExample": "A flashlight for divers: depth-aware red-light mode and a strobe for signalling, tested to 40m.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.4-extensions-disclosure",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "extensions",
        "metadata",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasAppExtensions": true
      },
      "question": "Uygulama uzantı barındırıyorsa: (1) uzantılar pazarlama metninde açık ve doğru biçimde anlatılıyor mu, (2) uzantıların içinde pazarlama, reklam ya da uygulama içi satın alma var mı (olmamalı), (3) yardım ekranı/ayarlar gibi bir işlevsellik sunuluyor mu?\n",
      "ruleText": "Uzantı barındıran ya da içeren uygulamalar ilgili programlama kılavuzlarına uymalı ve mümkün olduğunda yardım ekranları ve ayar arayüzleri gibi bir işlevsellik içermelidir. Uygulamada hangi uzantıların sunulduğunu pazarlama metninde açık ve doğru biçimde belirtmelisin; uzantılar pazarlama, reklam ya da uygulama içi satın alma içeremez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.4.1-keyboard-extensions",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.4.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.4.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "extensions",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasAppExtensions": true
      },
      "prefilter": [
        "keyboard",
        "klavye",
        "sticker",
        "emoji"
      ],
      "question": "Klavye uzantısı: (1) gerçekten karakter girişi sağlıyor mu, (2) görsel/emoji içeriyorsa Sticker kurallarına uyuyor mu, (3) sonraki klavyeye geçiş yolu var mı, (4) tam ağ erişimi ve \"full access\" olmadan çalışıyor mu, (5) kullanıcı etkinliğini yalnızca klavye uzantısının işlevini geliştirmek için mi topluyor, (6) Ayarlar dışında başka uygulama açmıyor ve klavye tuşlarını başka davranışlara yeniden atamıyor, değil mi?\n",
      "ruleText": "Klavye uzantıları: karakter girişi sağlamalı; görsel veya emoji içeriyorsa Sticker kurallarına uymalı; sonraki klavyeye geçiş yöntemi sunmalı; tam ağ erişimi olmadan ve tam erişim gerektirmeden çalışmaya devam etmeli; kullanıcı etkinliğini yalnızca cihazdaki klavye uzantısının işlevini geliştirmek için toplamalıdır. Ayarlar dışında başka uygulama başlatamaz ve klavye tuşlarını başka davranışlar için yeniden kullanamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.4.2-safari-extensions",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.4.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.4.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "extensions",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasAppExtensions": true
      },
      "prefilter": [
        "safari",
        "browser extension",
        "web extension",
        "content blocker",
        "ad blocker"
      ],
      "question": "Safari uzantısı ilgili işletim sisteminin güncel Safari sürümünde çalışıyor mu? Sistem ya da Safari arayüz öğelerine müdahale ediyor mu? Kötü niyetli veya yanıltıcı içerik/kod içeriyor mu? Çalışmak için gerçekten gerekli olandan daha fazla siteye erişim talep ediyor mu?\n",
      "ruleText": "Safari uzantıları ilgili Apple işletim sistemindeki güncel Safari sürümünde çalışmalıdır. Sistem ya da Safari arayüz öğelerine müdahale edemez ve asla kötü niyetli veya yanıltıcı içerik ya da kod içeremez. Safari uzantıları çalışmak için kesinlikle gerekli olandan daha fazla web sitesine erişim talep etmemelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.5.1-apple-data",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "app store",
        "itunes",
        "ranking",
        "rankings",
        "chart",
        "charts",
        "top apps",
        "aso",
        "app analytics"
      ],
      "question": "Uygulama Apple sitelerinden (apple.com, iTunes Store, App Store, App Store Connect, developer portalı) veri kazıyor ya da bu bilgilerle sıralama üretiyor mu? Onaylı Apple RSS akışlarını kullanmak serbest.\n",
      "ruleText": "Uygulamalar iTunes Store RSS akışı gibi onaylı Apple RSS akışlarını kullanabilir ancak Apple sitelerinden (apple.com, iTunes Store, App Store, App Store Connect, developer portalı vb.) bilgi kazıyamaz ve bu bilgilerle sıralama oluşturamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.5.2-apple-music",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "media",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "apple music",
        "musickit",
        "itunes",
        "playlist",
        "music library",
        "spotify"
      ],
      "question": "Apple Music/MusicKit kullanılıyorsa: (i) çalmayı kullanıcı mı başlatıyor ve standart medya kontrolleri (oynat/duraklat/atla) var mı; erişim ücretli ya da dolaylı olarak paraya çevrilmiş mi (IAP, reklam, kullanıcı bilgisi isteme); MusicKit kaynaklı müzik dosyaları indiriliyor, yükleniyor ya da paylaşılıyor mu, (ii) daha derin entegrasyon için gereken lisanslar (senkronizasyon, uyarlama) alındı mı; kapak görselleri ve metadata yalnızca çalma/çalma listeleriyle bağlantılı mı kullanılıyor, (iii) Apple Music kullanıcı verisine (çalma listeleri, favoriler) erişiliyorsa bu izin metninde açıkça belirtiliyor ve veri üçüncü taraflarla paylaşılmıyor, kullanıcı/cihaz tanımlamak ya da reklam hedeflemek için kullanılmıyor mu?\n",
      "ruleText": "MusicKit ile kullanıcılar Apple Music'i ve yerel müzik kütüphanelerini uygulamandan çalabilir. Akışı kullanıcı başlatmalı ve standart medya kontrolleriyle gezinebilmelidir. Uygulaman Apple Music servisine erişimi ücretlendiremez ya da dolaylı olarak paraya çeviremez. MusicKit API'lerinden gelen müzik dosyaları indirilemez, yüklenemez ve paylaşılamaz. MusicKit kullanmak, daha derin bir müzik entegrasyonu için gereken lisansların yerine geçmez. Kapak görselleri ve diğer metadata yalnızca müzik çalma ya da çalma listeleriyle bağlantılı kullanılabilir. Apple Music kullanıcı verisine erişen uygulamalar bunu izin metninde açıkça belirtmeli; toplanan veri uygulamayı desteklemek veya iyileştirmek dışında üçüncü taraflarla paylaşılamaz, kullanıcı/cihaz tanımlamak ya da reklam hedeflemek için kullanılamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.5.3-apple-services-spam",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "push",
        "notification",
        "notifications",
        "game center",
        "leaderboard",
        "live activity"
      ],
      "question": "Apple servisleri (Game Center, Push Notifications, Live Activities) üzerinden istenmeyen mesaj, spam ya da oltalama gönderiliyor mu? Game Center'dan elde edilen Player ID, takma ad ve diğer bilgiler ters arama, izleme, ilişkilendirme, madencilik ya da başka biçimde kullanılıyor mu?\n",
      "ruleText": "Apple servislerini — Game Center, Push Notifications, Live Activities vb. dâhil — müşterilere spam göndermek, oltalama yapmak ya da istenmeyen mesaj iletmek için kullanma. Game Center üzerinden elde edilen Player ID'leri, takma adları ya da diğer bilgileri ters arama, izleme, ilişkilendirme, madencilik, hasat ya da başka biçimde istismar etmeye çalışma.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.5.4-push-notifications",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "marketing",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "push",
        "notification",
        "notifications",
        "alerts",
        "reminder",
        "reminders",
        "bildirim"
      ],
      "question": "Push bildirimleri: (1) uygulamanın çalışması için ZORUNLU mu (olmamalı), (2) hassas ya da gizli kişisel bilgi gönderiliyor mu (gönderilmemeli), (3) promosyon veya doğrudan pazarlama amaçlı bildirim gönderiliyorsa kullanıcı uygulamanın ARAYÜZÜNDE gösterilen bir rıza metniyle açıkça onay verdi mi, (4) kullanıcı bu mesajlardan çıkmak için uygulamanın içinde bir yol bulabiliyor mu?\n",
      "ruleText": "Push bildirimleri uygulamanın çalışması için zorunlu olmamalı ve hassas ya da gizli kişisel bilgi göndermek için kullanılmamalıdır. Push bildirimleri, müşteriler uygulamanın arayüzünde gösterilen rıza metniyle açıkça kabul etmedikçe promosyon ya da doğrudan pazarlama amacıyla kullanılamaz; ayrıca uygulamanda kullanıcının bu mesajlardan çıkabileceği bir yöntem sunmalısın.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.5.5-game-center-ids",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "game center",
        "player id",
        "leaderboard",
        "achievements",
        "multiplayer"
      ],
      "question": "Game Center Player ID'leri yalnızca Game Center şartlarının onayladığı biçimde mi kullanılıyor? Uygulamada ya da üçüncü taraflara gösteriliyor mu (gösterilmemeli)?\n",
      "ruleText": "Game Center Player ID'lerini yalnızca Game Center şartlarının onayladığı biçimde kullan ve bunları uygulamada ya da herhangi bir üçüncü tarafa gösterme.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-4.5.6-apple-emoji",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.5.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.5.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "apple-services",
        "ip",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasAppExtensions": true
      },
      "prefilter": [
        "emoji",
        "emojis",
        "sticker",
        "stickers"
      ],
      "question": "Apple emojileri yalnızca Apple platformlarında ve Unicode karakter olarak mı kullanılıyor? Apple emojileri başka platformlarda kullanılamaz ve doğrudan uygulama binary'sine gömülemez; üçüncü taraf klavyeler ve Sticker paketleri Apple emojisi içeremez (5.2.5).\n",
      "ruleText": "Uygulamalar, uygulamalarında ve uygulama metadata'sında Apple emojisi olarak görüntülenen Unicode karakterlerini kullanabilir. Apple emojileri başka platformlarda kullanılamaz ve doğrudan uygulama binary'sine gömülemez.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-4.7-hosted-software",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Uygulama binary'ye gömülü olmayan yazılım sunuyorsa (mini uygulama, mini oyun, akış oyunu, chatbot, eklenti, emülatör oyunu): bu yazılımların kurallara ve yasalara uymasından SEN sorumlusun. Sunulan yazılımların tamamını gözden geçirdin mi ve 4.7.1-4.7.5 şartlarını karşıladıklarından emin misin?\n",
      "ruleText": "Uygulamalar binary'ye gömülü olmayan belirli yazılımları sunabilir: HTML5 ve JavaScript mini uygulamalar ve mini oyunlar, akış oyunları, chatbotlar ve eklentiler; ayrıca retro oyun konsolu ve PC emülatörü uygulamaları oyun indirmeyi sunabilir. Uygulamanda sunulan tüm bu yazılımlardan — bu kurallara ve tüm geçerli yasalara uymaları dâhil — sen sorumlusun. Bir kurala uymayan yazılım uygulamanın reddedilmesine yol açar.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.7.1-hosted-software-duties",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "ugc",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Barındırılan yazılımlar için üç şart: (1) gizlilik kuralları (5.1) — veri toplama, kullanım ve paylaşım ile çocuklardan gelen sağlık ve kişisel veri dâhil, (2) uygunsuz materyali süzme yöntemi, içeriği şikayet etme mekanizması, şikayetlere zamanında yanıt ve kötüye kullanan kullanıcıları engelleme imkânı, (3) dijital mal ve hizmetler için 3.1 (uygulama içi satın alma) kuralları. Üçü de sağlanıyor mu?\n",
      "ruleText": "Bu kural kapsamında sunulan yazılımlar: veri toplama, kullanım ve paylaşım ile hassas veriler (çocuklardan gelen sağlık ve kişisel veriler gibi) dâhil 5.1'deki gizlilik kurallarına uymalı; uygunsuz materyali süzen bir yöntem, içeriği bildirme mekanizması ve şikayetlere zamanında yanıt ile kötüye kullanan kullanıcıları engelleme imkânı içermeli; son kullanıcılara dijital mal veya hizmet sunmak için 3.1'e uymalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.7.2-native-api-exposure",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Uygulama, barındırdığı yazılımlara yerel platform API'lerini ya da teknolojilerini açıyor veya genişletiyor mu? Bu, Apple'ın önceden izni olmadan yasak.\n",
      "ruleText": "Uygulaman, Apple'ın önceden izni olmadan yerel platform API'lerini ya da teknolojilerini barındırdığı yazılımlara açamaz veya genişletemez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.7.3-permission-sharing",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Uygulama, barındırdığı yazılımlarla veri ya da gizlilik izinlerini paylaşıyor mu? Bu yalnızca HER SEFERİNDE alınan açık kullanıcı rızasıyla yapılabilir.\n",
      "ruleText": "Uygulaman, her durumda açık kullanıcı rızası olmadan, barındırdığı hiçbir yazılımla veri ya da gizlilik izinlerini paylaşamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.7.4-software-index",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Uygulamada sunulan yazılımların ve metadata'larının bir dizini var mı? Bu dizin, sunulan tüm yazılımlara giden evrensel bağlantıları (universal links) içermek zorunda.\n",
      "ruleText": "Uygulamanda sunulan yazılımların ve metadata'nın bir dizinini sağlamalısın. Bu dizin, uygulamanda sunulan tüm yazılımlara giden evrensel bağlantıları içermelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-4.7.5-hosted-age-restriction",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.7.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.7.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "hosted-software",
        "age-rating",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hostsThirdPartySoftware": true
      },
      "question": "Kullanıcı, uygulamanın yaş sınırını AŞAN yazılımı ayırt edebiliyor mu? Doğrulanmış ya da beyan edilmiş yaşa dayalı bir yaş kısıtlama mekanizmasıyla küçüklerin erişimi sınırlanıyor mu?\n",
      "ruleText": "Uygulaman, kullanıcıların uygulamanın yaş sınırını aşan yazılımı ayırt etmesini sağlamalı ve doğrulanmış ya da beyan edilmiş yaşa dayalı bir yaş kısıtlama mekanizmasıyla küçüklerin erişimini sınırlamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-4.8-sign-in-with-apple",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.8",
        "url": "https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "login",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "screenshots",
        "reviewNotes"
      ],
      "appliesWhen": {
        "hasThirdPartyLogin": true
      },
      "requiresVision": true,
      "facts": [
        "Bir uygulama üçüncü taraf veya sosyal giriş (Google, Facebook, X/Twitter, Meta) sunuyorsa, Apple ile Giriş'i de eşdeğer bir seçenek olarak sunmak zorundadır.",
        "Yalnızca e-posta/şifre ile giriş sunan uygulamalar bu şarttan muaftır."
      ],
      "question": "Giriş/kayıt ekran görüntüsünde üçüncü taraf giriş düğmeleri (Google, Facebook, X, Meta) görünüyor mu? Görünüyorsa, aynı ekranda \"Sign in with Apple\" düğmesi de var mı? Sosyal giriş var ve Apple ile Giriş yoksa bildir. Giriş ekranı görüntülerde yoksa bulgu üretme.\n",
      "ruleText": "Üçüncü taraf/sosyal giriş sunan uygulamalar, Apple ile Giriş'i de eşdeğer bir seçenek olarak sunmalıdır.\n",
      "positiveExample": "Giriş ekranında 'Continue with Google' ve 'Continue with Facebook' var, Apple yok.",
      "negativeExample": "Giriş ekranında 'Sign in with Apple', 'Continue with Google' ve e-posta seçeneği birlikte var.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 2
    },
    {
      "id": "apple-4.9-apple-pay",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "4.9",
        "url": "https://developer.apple.com/app-store/review/guidelines/#4.9",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "apple pay",
        "recurring",
        "subscription",
        "auto-renew",
        "membership"
      ],
      "question": "Apple Pay kullanılıyorsa: (1) satıştan önce tüm önemli satın alma bilgisi kullanıcıya veriliyor mu, (2) Apple Pay markası ve arayüz öğeleri kurallara uygun kullanılıyor mu, (3) yinelenen ödeme varsa şunlar açıklanıyor mu: yenileme dönemi ve iptal edilene kadar süreceği, her dönemde ne verileceği, müşteriden tahsil edilecek gerçek tutar ve nasıl iptal edileceği?\n",
      "ruleText": "Apple Pay kullanan uygulamalar, herhangi bir mal veya hizmetin satışından önce tüm önemli satın alma bilgilerini kullanıcıya sunmalı ve Apple Pay markasıyla arayüz öğelerini doğru kullanmalıdır. Apple Pay ile yinelenen ödeme sunan uygulamalar en azından şunları açıklamalıdır: yenileme döneminin uzunluğu ve iptal edilene kadar devam edeceği, her dönemde ne sağlanacağı, müşteriden tahsil edilecek gerçek ücretler ve nasıl iptal edileceği.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5-legal-compliance",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulamanın sunulduğu HER ülkede geçerli yasalara uyduğu kontrol edildi mi? Apple bunu geliştiricinin sorumluluğuna bırakıyor: yalnız bu kurallara uymak yetmiyor. Suç ya da açıkça pervasız davranışı teşvik eden hiçbir işlev yok, değil mi?\n",
      "ruleText": "Uygulamalar, sunuldukları her yerde tüm yasal gerekliliklere uymalıdır. Yerel yasaları anlamak ve uygulamanın bunlara uygun olmasını sağlamak senin sorumluluğundur. Suç işlemeyi ya da açıkça pervasız davranışı talep eden, teşvik eden veya özendiren uygulamalar reddedilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.1-privacy-claim-contradiction",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "privacy",
        "claims"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "promotionalText",
        "subtitle"
      ],
      "question": "Metin, veri toplama konusunda mutlak bir iddia içeriyor mu — \"hiçbir veri toplamıyoruz\", \"verileriniz asla sunucuya gitmez\", \"%100 çevrimdışı\", \"hiç takip yok\"? Böyle bir iddia varken uygulamanın hesap/giriş gerektirmesi, bulut işleme yapması ya da analitik/reklam içermesi bu iddiayla çelişir. Yalnızca MUTLAK ifadeleri bildir; \"gizliliğinize önem veriyoruz\" gibi genel cümleler ihlal değildir.\n",
      "ruleText": "Gizlilik beyanları uygulamanın gerçek veri davranışıyla ve App Privacy etiketiyle tutarlı olmalıdır. Çelişkili mutlak iddialar reddedilir.\n",
      "positiveExample": "We never collect any data. 100% offline, zero tracking.",
      "negativeExample": "Your privacy matters to us. Read our privacy policy for details.",
      "outcome": "risk",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1-purpose-strings",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "privacy"
      ],
      "scope": "single",
      "needs": [],
      "question": "Kamera, fotoğraf, konum, mikrofon gibi her izin için Info.plist'teki açıklama metni, iznin NEDEN gerektiğini somut olarak anlatıyor mu? 'Uygulama kamerayı kullanır' gibi genel metinler reddedilir.\n",
      "ruleText": "Her izin istegi icin, verinin ne icin kullanilacagini acikca anlatan bir amac metni bulunmalidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1i-privacy-policy-content",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "policy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Gizlilik politikası METNİ üç şeyi açıkça söylüyor mu: (1) hangi verinin toplandığı, nasıl toplandığı ve tüm kullanım amaçları, (2) veri paylaşılan her üçüncü tarafın (analitik, reklam ağı, SDK, bağlı şirketler) aynı ya da eşdeğer koruma sağladığının teyidi, (3) saklama/silme politikası ile kullanıcının rızasını nasıl geri alacağı ve verisinin silinmesini nasıl isteyeceği. Ayrıca politikaya bağlantı hem App Store Connect alanında hem UYGULAMANIN İÇİNDE kolayca erişilebilir yerde var mı?\n",
      "ruleText": "Tüm uygulamalar gizlilik politikasına App Store Connect metadata alanında ve uygulama içinde kolayca erişilebilir biçimde bağlantı vermelidir. Gizlilik politikası açıkça: uygulamanın/servisin hangi veriyi topladığını, nasıl topladığını ve tüm kullanım amaçlarını belirtmeli; veri paylaşılan her üçüncü tarafın aynı veya eşdeğer korumayı sağlayacağını teyit etmeli; saklama/silme politikalarını ve kullanıcının rızasını nasıl geri alabileceğini ya da verisinin silinmesini nasıl talep edebileceğini açıklamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1ii-consent",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "consent",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Veri toplayan uygulamada: (1) toplama için kullanıcı rızası alınıyor mu (toplandığı anda anonim sayılsa bile), (2) ücretli işlev bu veriye erişim iznine BAĞLI mı (olmamalı), (3) kullanıcı rızasını kolayca ve anlaşılır biçimde geri alabiliyor mu, (4) izin metinleri (purpose strings) verinin kullanımını eksiksiz anlatıyor mu, (5) GDPR'ın meşru menfaat istisnasına dayanıyorsan yasanın tüm şartlarına uyuluyor mu?\n",
      "ruleText": "Kullanıcı ya da kullanım verisi toplayan uygulamalar, veri toplandığı anda anonim sayılsa bile toplama için kullanıcı rızası almalıdır. Ücretli işlev, bu veriye erişim iznine bağlı olamaz ya da bunu gerektiremez. Uygulamalar kullanıcıya rızasını geri almak için kolay ve anlaşılır bir yol sunmalıdır. İzin metinlerin verinin kullanımını açık ve eksiksiz anlatmalıdır. GDPR ya da benzeri bir yasanın meşru menfaat hükmüne dayanarak rızasız veri toplayan uygulamalar o yasanın tüm şartlarına uymalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1iii-data-minimization",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama yalnızca ana işleviyle İLGİLİ veriye mi erişim istiyor ve yalnızca işi yapmak için gerekli olanı mı topluyor? Fotoğraflar ve Kişiler gibi korumalı kaynaklarda tam erişim istemek yerine, mümkün olduğunda süreç dışı seçici (picker) ya da paylaşım sayfası kullanılıyor mu?\n",
      "ruleText": "Uygulamalar yalnızca uygulamanın ana işleviyle ilgili veriye erişim istemeli ve yalnızca ilgili görevi yerine getirmek için gereken veriyi toplayıp kullanmalıdır. Mümkün olduğunda Fotoğraflar veya Kişiler gibi korumalı kaynaklara tam erişim istemek yerine süreç dışı seçici ya da paylaşım sayfası kullanılmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.1iv-permission-respect",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama kullanıcının izin ayarlarına saygı gösteriyor mu? Gereksiz veri erişimine rıza vermeye yönlendirme, kandırma ya da zorlama var mı (Apple'ın örneği: sosyal ağa fotoğraf yüklemek için mikrofon izni şart koşmak)? İzin vermeyen kullanıcı için alternatif sunuluyor mu (konum vermeyene adresi elle yazma imkânı gibi)?\n",
      "ruleText": "Uygulamalar kullanıcının izin ayarlarına saygı göstermeli ve insanları gereksiz veri erişimine rıza vermeye yönlendirmeye, kandırmaya ya da zorlamaya çalışmamalıdır. Mümkün olduğunda rıza vermeyen kullanıcılar için alternatif çözümler sun.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.1ix-regulated-entity",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "bank",
        "banking",
        "loan",
        "health",
        "medical",
        "gambling",
        "betting",
        "casino",
        "cannabis",
        "crypto",
        "exchange",
        "insurance",
        "airline",
        "flight"
      ],
      "question": "Uygulama sıkı düzenlemeye tabi bir alanda mı hizmet veriyor (bankacılık ve finans, sağlık, kumar, yasal esrar, hava yolu, kripto borsası) ya da hassas kullanıcı bilgisi mi istiyor? Öyleyse gönderim, hizmeti VEREN tüzel kişilik tarafından mı yapılıyor (bireysel geliştirici hesabı değil)? Yasal esrar satışını kolaylaştırıyorsan uygulama ilgili yasal yargı alanıyla coğrafi olarak sınırlandırıldı mı?\n",
      "ruleText": "Sıkı düzenlemeye tabi alanlarda (bankacılık ve finansal hizmetler, sağlık, kumar, yasal esrar kullanımı, hava yolculuğu ve kripto borsaları gibi) hizmet veren ya da hassas kullanıcı bilgisi gerektiren uygulamalar, bireysel bir geliştirici tarafından değil, bu hizmetleri sağlayan tüzel kişilik tarafından gönderilmelidir. Yasal esrar satışını kolaylaştıran uygulamalar ilgili yasal yargı alanıyla coğrafi olarak sınırlandırılmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1v-account-deletion",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1(v)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "privacy"
      ],
      "scope": "single",
      "needs": [],
      "question": "Uygulama hesap oluşturmaya izin veriyorsa, uygulama İÇİNDEN hesabı kalıcı silme yolu var mı? Yalnızca e-posta ile talep etmek yetmez; akış uygulama içinde bulunabilir olmalı.\n",
      "ruleText": "Hesap olusturmaya izin veren uygulamalar, hesabin uygulama icinden silinmesine de izin vermelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1v-account-signin",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1(v)",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1(v)",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "login",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "requiresLogin": true
      },
      "question": "(1) Uygulamanın gerçekten önemli hesap tabanlı özellikleri var mı? Yoksa insanlar girişsiz kullanabilmeli. (2) Kullanıcıdan kişisel bilgi girmesi, ana işlevle doğrudan ilgili ya da yasa gereği olmadıkça isteniyor mu? (3) Ana işlevin belirli bir sosyal ağla ilgili DEĞİLSE, girişsiz ya da başka bir mekanizmayla erişim sunuluyor mu? (Profil bilgisi çekmek, sosyal ağda paylaşmak ya da arkadaş davet etmek ana işlev sayılmaz.) (4) Sosyal ağ kimlik bilgilerini iptal etme ve veri erişimini kesme yolu uygulamanın içinde var mı? (5) Sosyal ağ token'ları cihaz dışında saklanıyor mu (saklanmamalı)?\n",
      "ruleText": "Uygulamanın önemli hesap tabanlı özellikleri yoksa insanların girişsiz kullanmasına izin ver. Uygulaman hesap oluşturmayı destekliyorsa uygulama içinde hesap silmeyi de sunmalısın. Uygulamalar, ana işlevle doğrudan ilgili olmadıkça ya da yasa gerektirmedikçe çalışmak için kişisel bilgi girilmesini zorunlu kılamaz. Ana işlevin belirli bir sosyal ağla ilgili değilse girişsiz ya da başka bir mekanizmayla erişim sağlamalısın; temel profil bilgisi çekmek, sosyal ağda paylaşmak veya arkadaş davet etmek ana işlev sayılmaz. Uygulama ayrıca sosyal ağ kimlik bilgilerini iptal etmek ve veri erişimini kesmek için uygulama içinde bir mekanizma içermelidir. Kimlik bilgileri ya da token'lar cihaz dışında saklanamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1vi-credential-harvesting",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "security",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "password",
        "passwords",
        "credential",
        "vault",
        "password manager",
        "login saver"
      ],
      "question": "Uygulama, kullanıcının şifrelerini ya da özel verilerini gizlice ele geçiren bir davranış içeriyor mu? Şifre yöneticisi ya da kasa uygulamalarında verinin nerede saklandığı ve kimin eriştiği açıkça anlatılıyor mu?\n",
      "ruleText": "Uygulamalarını şifreleri ya da diğer özel verileri gizlice ele geçirmek için kullanan geliştiriciler Apple Developer Program'dan çıkarılır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1vii-safari-view-controller",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "browser",
        "in-app browser",
        "safari",
        "web view",
        "open links"
      ],
      "question": "SafariViewController kullanılıyorsa: kullanıcıya GÖRÜNÜR biçimde mi sunuluyor (başka görünüm veya katmanlarla gizlenmiyor ya da örtülmüyor)? Kullanıcının bilgisi ve rızası olmadan izleme için kullanılıyor mu?\n",
      "ruleText": "SafariViewController, bilgiyi kullanıcılara görünür biçimde sunmak için kullanılmalıdır; denetleyici başka görünümler ya da katmanlarla gizlenemez veya örtülemez. Ayrıca uygulama, SafariViewController'ı kullanıcıların bilgisi ve rızası olmadan onları izlemek için kullanamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.1viii-data-compilation",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "people search",
        "public records",
        "lookup",
        "reverse phone",
        "find people",
        "background check",
        "directory"
      ],
      "question": "Uygulama, kişisel bilgiyi doğrudan kullanıcıdan almadan ya da açık rızası olmadan derliyor mu? Kamuya açık veritabanları da buna dâhil — \"insan arama\", telefon rehberi, kayıt taraması gibi işlevler bu maddeden reddediliyor.\n",
      "ruleText": "Doğrudan kullanıcıdan olmayan hiçbir kaynaktan, kullanıcının açık rızası olmadan kişisel bilgi derleyen uygulamalara — kamuya açık veritabanları dâhil — App Store'da veya alternatif dağıtımda izin verilmez.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.1x-optional-contact-info",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "allowsAccountCreation": true
      },
      "question": "Uygulama ad ve e-posta gibi temel iletişim bilgisi istiyorsa: (1) bu istek kullanıcı için İSTEĞE BAĞLI mı, (2) özellik ve hizmetler bu bilgiyi vermeye bağlı mı (olmamalı), (3) çocuklardan bilgi toplama sınırları dâhil diğer kurallara uyuluyor mu?\n",
      "ruleText": "Uygulamalar temel iletişim bilgisi (ad ve e-posta adresi gibi) isteyebilir; yeter ki bu istek kullanıcı için isteğe bağlı olsun, özellik ve hizmetler bu bilginin verilmesine bağlı olmasın ve çocuklardan bilgi toplamaya ilişkin sınırlamalar dâhil bu kuralların diğer hükümlerine uyulsun.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.2-att",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "checklist",
        "privacy"
      ],
      "scope": "single",
      "needs": [],
      "appliesWhen": {
        "declaresTracking": true
      },
      "question": "Uygulama reklam/analitik için cihazlar arası takip yapıyorsa AppTrackingTransparency izni isteniyor mu? İzin verilmediğinde takip gerçekten duruyor mu? App Privacy etiketindeki beyanla tutarlı mı?\n",
      "ruleText": "Kullaniciyi diger uygulama/sitelerde takip eden uygulamalar AppTrackingTransparency izni istemek zorundadir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.2i-forced-system-permissions",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "consent",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "(1) Kişisel veri, izin alınmadan kullanılıyor, iletiliyor ya da paylaşılıyor mu? (2) Verinin nerede ve nasıl kullanılacağı bilgisi kullanıcıya sunuluyor mu? (3) Üçüncü taraflarla — üçüncü taraf YAPAY ZEKÂ dâhil — paylaşım açıkça bildirilip açık izin alınıyor mu? (4) İzleme için ATT izni alınıyor mu? (5) Uygulama, işleve ya da içeriğe erişmek için kullanıcıyı sistem özelliklerini (push, konum, izleme) açmaya ZORLUYOR mu — ya da bunun karşılığında hediye kartı/kod gibi bir bedel mi sunuyor? Bu yasak.\n",
      "ruleText": "Yasa izin vermedikçe, birinin kişisel verisini önce izin almadan kullanamaz, iletemez veya paylaşamazsın. Verinin nasıl ve nerede kullanılacağına dair bilgiye erişim sağlamalısın. Kişisel verinin üçüncü taraflarla — üçüncü taraf yapay zekâ dâhil — nerede paylaşılacağını açıkça bildirmeli ve öncesinde açık izin almalısın. Uygulamalardan toplanan veri, yalnızca uygulamayı iyileştirmek ya da reklam sunmak için üçüncü taraflarla paylaşılabilir. Kullanıcıların etkinliğini izlemek için App Tracking Transparency API'leriyle açık izin almalısın. Uygulaman, işleve, içeriğe ya da kullanıma erişmek veya parasal ya da başka bir karşılık (hediye kartları ve kodlar dâhil) almak için kullanıcılardan sistem işlevlerini (push bildirimleri, konum servisleri, izleme gibi) etkinleştirmesini isteyemez.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.2ii-purpose-limitation",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Bir amaç için toplanan veri, yeni bir rıza alınmadan başka bir amaçla kullanılıyor mu? (Ör. ürün teslimi için alınan adresin reklam hedeflemede kullanılması.)\n",
      "ruleText": "Bir amaç için toplanan veri, yasa açıkça izin vermedikçe, ek rıza olmadan başka bir amaçla yeniden kullanılamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.2iii-anonymous-profiling",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama, toplanan veriye dayanarak gizlice kullanıcı profili oluşturuyor mu? Anonim kullanıcıları tanımlamaya ya da \"anonimleştirilmiş\", \"toplulaştırılmış\" denilen veriden profil yeniden kurmaya çalışıyor, bunu kolaylaştırıyor ya da başkalarını buna teşvik ediyor mu?\n",
      "ruleText": "Uygulamalar toplanan veriye dayanarak gizlice kullanıcı profili oluşturmaya çalışmamalıdır; Apple'ın sağladığı API'lerden ya da \"anonimleştirilmiş\", \"toplulaştırılmış\" veya başka biçimde tanımlanamaz olduğu söylenen verilerden anonim kullanıcıları tanımlamaya veya kullanıcı profillerini yeniden kurmaya çalışamaz, bunu kolaylaştıramaz veya başkalarını buna teşvik edemez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.2iv-contacts-database",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "contacts",
        "address book",
        "phonebook",
        "invite friends",
        "find friends",
        "sync contacts"
      ],
      "question": "Kişiler, Fotoğraflar ya da benzer API'lerden alınan bilgiyle kendi kullanımın için veya üçüncü taraflara satmak/dağıtmak üzere bir iletişim veritabanı oluşturuluyor mu? Cihazda başka hangi uygulamaların kurulu olduğu analitik ya da reklam/pazarlama amacıyla toplanıyor mu?\n",
      "ruleText": "Kişiler, Fotoğraflar ya da kullanıcı verisine erişen diğer API'lerden gelen bilgiyi kendi kullanımın için veya üçüncü taraflara satmak/dağıtmak üzere bir iletişim veritabanı oluşturmak amacıyla kullanma; kullanıcının cihazında hangi uygulamaların kurulu olduğunu analitik ya da reklam/pazarlama amacıyla toplama.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.2v-contact-messaging",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "invite friends",
        "invite your contacts",
        "share with friends",
        "sms invite",
        "refer a friend"
      ],
      "question": "Kullanıcının Kişiler ya da Fotoğraflar bilgisiyle üçüncü kişilere mesaj gönderiliyorsa: (1) yalnızca kullanıcının açık ve kişi bazında girişimiyle mi gönderiliyor, (2) \"Tümünü Seç\" seçeneği ya da varsayılan olarak seçili tüm kişiler var mı (olmamalı), (3) mesajın alıcıya nasıl görüneceği — metni ve gönderen kim görünecek — kullanıcıya önceden açıkça anlatılıyor mu?\n",
      "ruleText": "Bir kullanıcının Kişiler ya da Fotoğraflar bilgisi üzerinden toplanan bilgiyle insanlara ulaşma; buna yalnızca o kullanıcının açık girişimiyle ve kişi bazında izin verilir. \"Tümünü Seç\" seçeneği koyma ve tüm kişileri varsayılan olarak seçili hâle getirme. Mesajın alıcıya nasıl görüneceğine dair kullanıcıya net bir açıklama sunmalısın: mesajda ne yazacak, gönderen kim görünecek?\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.1.2vi-sensitive-api-data",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "health",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasHealthFeatures": true
      },
      "question": "HomeKit, HealthKit, Clinical Health Records, MovementDisorder, ClassKit ya da derinlik/yüz haritalama araçlarından (ARKit, kamera, fotoğraf API'leri) toplanan veri pazarlama, reklam ya da kullanım tabanlı veri madenciliği için kullanılıyor mu? Üçüncü taraflar aracılığıyla da olsa bu yasak.\n",
      "ruleText": "HomeKit API, HealthKit, Clinical Health Records API, MovementDisorder API'leri, ClassKit ya da derinlik ve/veya yüz haritalama araçlarından (ARKit, kamera API'leri, fotoğraf API'leri) toplanan veri, üçüncü taraflar dâhil, pazarlama, reklam ya da kullanım tabanlı veri madenciliği için kullanılamaz.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.2vii-apple-pay-data",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "payments",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "apple pay"
      ],
      "question": "Apple Pay ile elde edilen kullanıcı verisi üçüncü taraflarla yalnızca mal ve hizmetlerin teslimini kolaylaştırmak ya da iyileştirmek için mi paylaşılıyor?\n",
      "ruleText": "Apple Pay kullanan uygulamalar, Apple Pay aracılığıyla elde edilen kullanıcı verisini üçüncü taraflarla yalnızca mal ve hizmetlerin tesliminin kolaylaştırılması ya da iyileştirilmesi amacıyla paylaşabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-5.1.3-health-research",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "health",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "hasHealthFeatures": true
      },
      "question": "Sağlık/fitness/tıbbi veri işleyen uygulamada: (i) bu veri reklam, pazarlama ya da kullanım tabanlı veri madenciliği için kullanılıyor mu (yasak; sağlık yönetimini iyileştirmek ya da izinli sağlık araştırması istisna); topladığın spesifik sağlık verisini açıkladın mı, (ii) HealthKit'e ya da başka bir sağlık uygulamasına yanlış veri yazılıyor mu; kişisel sağlık bilgisi iCloud'da mı tutuluyor (tutulmamalı), (iii) insan araştırması yapılıyorsa katılımcıdan (küçüklerde ebeveyn/vasiden) araştırmanın niteliği, amacı ve süresi; prosedürler, riskler ve faydalar; gizlilik ve veri paylaşımı; soru için iletişim noktası; çekilme süreci anlatılarak rıza alınıyor mu, (iv) bağımsız bir etik kurul onayı alındı mı?\n",
      "ruleText": "Sağlık, fitness ve tıbbi araştırma bağlamında toplanan veri — Clinical Health Records API, HealthKit, Motion and Fitness, MovementDisorder API'leri ya da sağlıkla ilgili insan araştırmaları dâhil — sağlık yönetimini iyileştirmek ya da izinli sağlık araştırması dışında reklam, pazarlama veya kullanım tabanlı veri madenciliği için kullanılamaz ve üçüncü taraflara açıklanamaz. Cihazdan topladığın spesifik sağlık verisini açıklamalısın. Uygulamalar HealthKit'e ya da başka bir tıbbi araştırma/sağlık yönetimi uygulamasına yanlış veya hatalı veri yazamaz ve kişisel sağlık bilgisini iCloud'da saklayamaz. Sağlıkla ilgili insan araştırması yapan uygulamalar katılımcılardan (küçüklerde ebeveyn veya vasiden) rıza almalı ve bağımsız bir etik inceleme kurulundan onay sağlamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.4-kids-privacy",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "kids",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "targetsKids": true
      },
      "question": "Çocuklara yönelik uygulamada: (1) doğum tarihi ve ebeveyn iletişim bilgisi yalnızca COPPA/GDPR gibi yasalara uymak için mi isteniyor ve uygulama yaştan bağımsız olarak yararlı bir işlev ya da eğlence sunuyor mu, (2) üçüncü taraf analitik ve reklam kaldırıldı mı (sınırlı istisnalar 1.3'teki şartlara tabi), (3) çocuktan kişisel bilgi (ad, adres, e-posta, konum, fotoğraf, video, çizim, sohbet imkânı, kalıcı tanımlayıcılar) toplayan ya da paylaşabilen uygulamada gizlilik politikası var ve çocuk gizliliği yasalarına uyuluyor mu? Ebeveyn kapısı, veri toplama için ebeveyn rızası ALMAK anlamına GELMEZ; ikisi ayrı şeydir.\n",
      "ruleText": "Çocuklardan kişisel veri toplarken COPPA, GDPR ve diğer geçerli yasalara uyulmalıdır. Uygulamalar doğum tarihi ve ebeveyn iletişim bilgisini yalnızca bu yasalara uymak için isteyebilir ve kişinin yaşından bağımsız olarak yararlı bir işlev veya eğlence değeri içermelidir. Öncelikli olarak çocuklara yönelik uygulamalar üçüncü taraf analitik ve üçüncü taraf reklam içermemelidir. Kids Category'deki ya da bir küçükten kişisel bilgi toplayan, ileten veya paylaşma kapasitesi olan uygulamalar gizlilik politikası içermeli ve geçerli çocuk gizliliği yasalarına uymalıdır. Kids Category için ebeveyn kapısı şartı, kişisel veri toplamak için ebeveyn rızası almakla genellikle aynı şey değildir.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.1.5-location-services",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.1.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.1.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "privacy",
        "location",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "usesLocation": true
      },
      "question": "Konum kullanan uygulamada: (1) konum, uygulamanın sunduğu özellik ve hizmetlerle DOĞRUDAN ilgili mi, (2) konum verisi toplanmadan, iletilmeden ya da kullanılmadan önce kullanıcı bilgilendirilip rızası alınıyor mu, (3) konumun ne için kullanıldığı uygulamanın içinde açıklanıyor mu, (4) konum API'leri acil servis sağlamak ya da araç/hava aracı gibi cihazların otonom kontrolü için kullanılıyor mu (hafif drone, oyuncak ve uzaktan araç alarmı gibi küçük cihazlar istisna)?\n",
      "ruleText": "Konum Servislerini uygulamanda yalnızca sunduğun özellik ve hizmetlerle doğrudan ilgili olduğunda kullan. Konum tabanlı API'ler acil servis sağlamak ya da araçların, hava araçlarının ve diğer cihazların otonom kontrolü için kullanılmamalıdır; hafif drone ve oyuncaklar ya da uzaktan araç alarm sistemleri gibi küçük cihazlar bunun dışındadır. Konum verisi toplamadan, iletmeden veya kullanmadan önce bildirimde bulun ve rıza al. Konum Servisleri kullanıyorsan amacını uygulamanda açıkla.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.2-third-party-brand-in-text",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#intellectual-property",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "ip",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "whatsNew"
      ],
      "facts": [
        "Facetune, Remini, FaceApp, Lensa, Picsart, Snapseed, VSCO, YouCam, Meitu, BeautyPlus, AirBrush, Retrica, PhotoRoom, Canva ve Photoshop başka şirketlere ait uygulama/yazılım markalarıdır.",
        "Instagram, TikTok, Snapchat, WhatsApp, YouTube ve Facebook başka şirketlere ait platform markalarıdır.",
        "Botox, Restylane, Juvederm tescilli tıbbi/kozmetik ürün markalarıdır.",
        "Bir markadan yalnızca gerçek bir entegrasyonu tarif etmek için bahsedilebilir ('export to Instagram'). Karşılaştırma, üstünlük iddiası veya çağrışım ('better than X', 'X alternative') ihlaldir.",
        "Reels, TikTok(s), Shorts ve Stories birer İÇERİK FORMATI adı olarak da kullanılıyor ('create Reels'). Bu kullanım gri alandır: format adları da o platformların markasıdır ve bu ifade yüzünden gelmiş gerçek redler var. Karar kuralı: uygulama o platforma gerçekten aktarım yapmıyorsa, format adını çıktı vaadi olarak kullanmak BİLDİRİLİR."
      ],
      "question": "Metinde başka bir şirkete ait bir marka adı geçiyor mu? Geçiyorsa hangi kullanım olduğuna karar ver: (a) gerçek bir entegrasyonun tarifi (\"share to Instagram\") — İHLAL DEĞİL, bildirme; (b) karşılaştırma, üstünlük ya da alternatif olma iddiası (\"better than X\", \"X alternative\") — BİLDİR; (c) platform markasının içerik formatı olarak kullanımı (\"create Reels, TikToks and Shorts\") ve uygulama o platforma aktarım yapmıyor — BİLDİR. Marka adı olgu listesinde geçmiyorsa bulgu üretme.\n",
      "ruleText": "Sahibi olmadığınız markaları, uygulamanızla ilişkilendirecek veya karşılaştıracak biçimde metadata'da kullanamazsınız.\n",
      "positiveExample": "The best free alternative to Facetune and Remini.",
      "negativeExample": "Share your edits directly to Instagram and TikTok.",
      "notViolation": [
        "Kendi marka ve ürün adların.",
        "Jenerik teknoloji ya da format sözcükleri: 'video', 'story', 'clip', 'post', 'filter'.",
        "Olgu listesinde geçmeyen bir ad. Marka olup olmadığını tahmin etme."
      ],
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 2
    },
    {
      "id": "apple-5.2.1-ai-likeness-claims",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#intellectual-property",
        "retrievedAt": "2026-08-25"
      },
      "tags": [
        "ai",
        "ip",
        "likeness",
        "metadata"
      ],
      "scope": "cross",
      "needs": [
        "description",
        "subtitle",
        "keywords",
        "promotionalText"
      ],
      "appliesWhen": {
        "generatesAiContent": true
      },
      "facts": [
        "Korunan üçüncü taraf materyali (marka, telif eser, tanınmış kişi benzerliği) izinsiz kullanılamaz. Bu, uygulamanın ÜRETTİĞİ içerik için de geçerlidir.",
        "Listing metninin kendisi delil sayılır: uygulama tanınmış bir kişiye ya da telifli bir karaktere dönüştürme vaat ediyorsa, App Review bunu izinsiz kullanım beyanı olarak okur ve denemeye bile gerek duymaz.",
        "Sık görülen kalıplar: 'ünlü olarak gör', 'çizgi film karakterine dönüş', stüdyo/marka adıyla stil vaadi (Disney, Pixar, Ghibli, Marvel), 'X ile yüzünü değiştir' (X gerçek bir kişi).",
        "Genel ve marka içermeyen stil adları (anime, 3D, yağlı boya, piksel sanat, vintage) bu kuralın konusu DEĞİLDİR — bunlar bulgu üretmemeli."
      ],
      "question": "Aşağıdaki metin, uygulamanın GERÇEK BİR KİŞİYE benzerlik ya da TELİFLİ bir karakter/marka stiline dönüştürme yaptığını vaat ediyor mu? İhlal sayılacaklar: adı geçen veya açıkça kastedilen ünlü/kamuya mal olmuş kişiler; telifli karakterler ve stüdyo adları (Disney, Pixar, Ghibli, Marvel, Barbie gibi); \"ünlülerle yüz değiştir\" türü vaatler. İhlal SAYILMAYACAKLAR: marka içermeyen genel stiller (anime, 3D, karikatür, yağlı boya, vintage, piksel); kullanıcının KENDİ fotoğrafını düzenlemesi; kullanıcının kendi yüklediği içeriği dönüştürmesi. Emin değilsen bulgu üretme.\n",
      "ruleText": "Marka, telifli eser veya patentli fikir gibi korunan üçüncü taraf materyalini izin almadan uygulamanda kullanma; uygulama paketinde veya geliştirici adında yanıltıcı, yanlış ya da taklit temsiller, isimler veya üstveri bulundurma.\n",
      "positiveExample": "Turn yourself into a Disney princess or swap faces with your favorite celebrity!",
      "negativeExample": "Fotoğrafını anime, 3D karikatür veya yağlı boya stiline dönüştür.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.2.2-third-party-services",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ip",
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "appliesWhen": {
        "usesThirdPartyContent": true
      },
      "question": "Uygulama üçüncü taraf bir servisin içeriğini kullanıyor, ona erişiyor, erişimi paraya çeviriyor ya da içeriğini gösteriyorsa: o servisin kullanım şartları buna AÇIKÇA izin veriyor mu? Apple istediğinde yetkiyi belgeleyebilir misin?\n",
      "ruleText": "Uygulaman üçüncü taraf bir servisin içeriğini kullanıyor, ona erişiyor, erişimini paraya çeviriyor ya da içeriğini gösteriyorsa, bunu yapmana o servisin kullanım şartları uyarınca özel olarak izin verildiğinden emin ol. Yetki, talep edildiğinde sunulmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.2.3-media-downloading",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ip",
        "legal",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "download video",
        "youtube",
        "mp3",
        "converter",
        "save video",
        "downloader",
        "offline download",
        "ripper",
        "soundcloud",
        "vimeo"
      ],
      "question": "Metin, üçüncü taraf kaynaklardan (YouTube, Apple Music, SoundCloud, Vimeo, Instagram vb.) medya kaydetme, dönüştürme ya da indirme yeteneği sunuyor mu? Ya da yasa dışı dosya paylaşımını kolaylaştırdığını gösteriyor mu? Kaynağın açık yetkisi olduğu belirtilmedikçe bu ihlaldir. Kendi içeriğini indirtmek ya da çevrimdışı kullanıma almak ihlal değildir.\n",
      "ruleText": "Uygulamalar yasa dışı dosya paylaşımını kolaylaştırmamalı; üçüncü taraf kaynaklardan (Apple Music, YouTube, SoundCloud, Vimeo vb.) medyayı, o kaynakların açık yetkisi olmadan kaydetme, dönüştürme veya indirme imkânı içermemelidir. Ses/video içeriğinin akışa alınması da kullanım şartlarını ihlal edebilir; erişmeden önce kontrol et. Yetki, talep edildiğinde sunulmalıdır.\n",
      "positiveExample": "Download any YouTube video as MP3 and save it to your library.",
      "negativeExample": "Download the episodes you subscribed to for offline listening.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.2.4-apple-endorsement",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ip",
        "metadata"
      ],
      "scope": "single",
      "needs": [
        "name",
        "subtitle",
        "description",
        "promotionalText",
        "keywords"
      ],
      "prefilter": [
        "apple",
        "editor's choice",
        "editors choice",
        "featured by",
        "approved by apple",
        "apple onaylı"
      ],
      "question": "Metin, Apple'ın uygulamanın kaynağı/sağlayıcısı olduğunu ya da uygulamanın kalitesini onayladığını ima ediyor mu (\"Apple onaylı\", \"Apple tarafından seçildi\", \"Editor's Choice\", \"Apple'ın önerdiği\")? Editor's Choice rozetini Apple kendisi ekler; metinde iddia edilemez. Apple'ın teknolojilerinden söz etmek (ör. \"HealthKit ile çalışır\") ihlal değildir.\n",
      "ruleText": "Apple'ın uygulamanın kaynağı ya da sağlayıcısı olduğunu, veya kalite ya da işlevsellikle ilgili herhangi bir beyanı onayladığını öne sürme ya da ima etme. Uygulaman \"Editor's Choice\" seçilirse rozeti Apple otomatik olarak uygular.\n",
      "positiveExample": "Apple-approved and featured as Editors Choice on the App Store.",
      "negativeExample": "Works with Apple Health and Siri Shortcuts.",
      "outcome": "violation",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.2.5-apple-lookalike",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.2.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.2.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "ip",
        "design",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "icon",
        "screenshots",
        "name"
      ],
      "requiresVision": true,
      "question": "Simge, ekran görüntüleri ya da ad, mevcut bir Apple ürününe, arayüzüne (Finder gibi), uygulamasına (App Store, iTunes Store, Mesajlar gibi) ya da reklam temasına kafa karıştıracak kadar benziyor mu? Ayrıca Activity halkalarına benzeyen bir görselleştirme varsa bildir.\n",
      "ruleText": "Mevcut bir Apple ürününe, arayüzüne (ör. Finder), uygulamasına (App Store, iTunes Store ya da Mesajlar gibi) veya reklam temasına kafa karıştıracak kadar benzeyen bir uygulama oluşturma. Uygulaman Activity halkalarını gösteriyorsa, Move, Exercise veya Stand verisini Activity kontrolüne benzeyen biçimde görselleştirmemelidir.\n",
      "positiveExample": "Simge, App Store logosunun renkleri ve şekliyle neredeyse aynı.",
      "negativeExample": "Simge, uygulamanın kendi markasına ait özgün bir sembol.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.3.1-sweepstakes-sponsor",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.3.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "gambling",
        "contests",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "sweepstake",
        "sweepstakes",
        "contest",
        "raffle",
        "giveaway",
        "prize",
        "çekiliş",
        "yarışma"
      ],
      "question": "Uygulamada çekiliş ya da yarışma varsa, sponsoru uygulamanın GELİŞTİRİCİSİ mi? Üçüncü bir tarafın sponsor olduğu çekilişler bu maddeye takılır.\n",
      "ruleText": "Çekilişler ve yarışmalar uygulamanın geliştiricisi tarafından sponsor edilmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.3.2-official-rules",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.3.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "gambling",
        "contests",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "sweepstake",
        "sweepstakes",
        "contest",
        "raffle",
        "giveaway",
        "prize",
        "lottery",
        "çekiliş"
      ],
      "question": "Çekiliş, yarışma ya da piyangonun resmî kuralları uygulamanın İÇİNDE sunuluyor mu? Bu kurallar Apple'ın sponsor OLMADIĞINI ve etkinliğe hiçbir biçimde dâhil olmadığını açıkça belirtiyor mu?\n",
      "ruleText": "Çekilişlerin, yarışmaların ve piyangoların resmî kuralları uygulamada sunulmalı ve Apple'ın sponsor olmadığını, etkinliğe hiçbir biçimde dâhil olmadığını açıkça belirtmelidir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.3.3-iap-real-money-gaming",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.3.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "gambling",
        "iap"
      ],
      "scope": "single",
      "needs": [
        "description",
        "iap",
        "promotionalText"
      ],
      "prefilter": [
        "casino",
        "betting",
        "bet",
        "poker",
        "real money",
        "wager",
        "sportsbook",
        "bahis",
        "slots"
      ],
      "question": "Uygulama gerçek para ile oynanan bir oyun (spor bahsi, poker, casino, at yarışı) sunuyorsa, uygulama içi satın alma ile bu oyunlarda kullanılacak kredi ya da para birimi satın alınıyor mu? Bu doğrudan yasak. Gerçek para kazandırmayan sosyal casino oyunlarında IAP serbesttir.\n",
      "ruleText": "Uygulamalar, her türden gerçek para oyunuyla birlikte kullanılacak kredi ya da para birimi satın almak için uygulama içi satın alma kullanamaz.\n",
      "positiveExample": "Buy chips with in-app purchase and use them at our real money poker tables.",
      "negativeExample": "Buy coins to play our free-to-play social slots. Coins have no cash value and cannot be withdrawn.",
      "outcome": "violation",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.3.4-real-money-gaming",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.3.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.3.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "gambling",
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "casino",
        "betting",
        "bet",
        "poker",
        "lottery",
        "sports betting",
        "horse racing",
        "gambling",
        "bahis",
        "kumar"
      ],
      "question": "Gerçek para oyunu (spor bahsi, poker, casino, at yarışı) ya da piyango sunan uygulamada: (1) kullanıldığı her yerde gerekli lisans ve izinler var mı, (2) uygulama bu yerlere coğrafi olarak sınırlandırıldı mı, (3) App Store'da ÜCRETSİZ mi, (4) kart sayacı gibi yasa dışı kumar yardımcıları yok, değil mi, (5) piyango ise bedel, şans ve ödül üçü birden var mı?\n",
      "ruleText": "Gerçek para oyunu (spor bahsi, poker, casino oyunları, at yarışı) ya da piyango sunan uygulamalar, kullanıldıkları yerlerde gerekli lisans ve izinlere sahip olmalı, bu yerlerle coğrafi olarak sınırlandırılmalı ve App Store'da ücretsiz olmalıdır. Kart sayaçları dâhil yasa dışı kumar yardımcılarına izin verilmez. Piyango uygulamalarında bedel, şans ve ödül bulunmalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.4-vpn-apps",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "vpn",
        "privacy",
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "vpn",
        "proxy",
        "tunnel",
        "private network",
        "hide your ip"
      ],
      "question": "VPN hizmeti sunuyorsan: (1) NEVPNManager API kullanılıyor mu, (2) geliştirici hesabın ORGANİZASYON olarak mı kayıtlı, (3) hangi kullanıcı verisinin toplanacağı ve nasıl kullanılacağı, kullanıcı satın alma ya da kullanma eylemine geçmeden ÖNCE bir uygulama ekranında açıkça beyan ediliyor mu, (4) veri üçüncü taraflara satılmıyor/açıklanmıyor ve bu taahhüt gizlilik politikasında yazılı mı, (5) VPN lisansı gereken bir ülkede sunuyorsan lisans bilgisi App Review Notes alanına yazıldı mı?\n",
      "ruleText": "VPN hizmeti sunan uygulamalar NEVPNManager API'sini kullanmalı ve yalnızca organizasyon olarak kayıtlı geliştiriciler tarafından sunulmalıdır. Kullanıcı, satın alma ya da hizmeti kullanma eylemine geçmeden önce hangi verinin toplanacağı ve nasıl kullanılacağı bir uygulama ekranında açıkça beyan edilmelidir. VPN uygulamaları hiçbir veriyi hiçbir amaçla üçüncü taraflara satamaz, kullanamaz veya açıklayamaz ve buna gizlilik politikalarında taahhüt etmelidir. Yerel yasalar ihlal edilemez; VPN lisansı gerektiren bir bölgede sunuyorsan lisans bilgini App Review Notes alanında vermelisin.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.5-mdm-apps",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.5",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.5",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "mdm",
        "privacy",
        "legal",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "prefilter": [
        "mdm",
        "device management",
        "parental control",
        "kiosk",
        "supervision",
        "configuration profile",
        "screen time"
      ],
      "question": "MDM (mobil cihaz yönetimi) ya da yapılandırma profili sunuyorsan: (1) Apple'dan bu yetkiyi talep ettin mi, (2) sunan taraf ticari işletme, eğitim kurumu, kamu kurumu ya da sınırlı durumlarda ebeveyn kontrolü/cihaz güvenliği için MDM kullanan bir şirket mi, (3) toplanacak veri ve kullanımı, kullanıcı satın alma/kullanma eylemine geçmeden önce bir uygulama ekranında beyan ediliyor mu, (4) veri üçüncü taraflara satılmıyor/açıklanmıyor ve bu gizlilik politikasında yazılı mı, (5) üçüncü taraf analitik varsa yalnızca kendi MDM uygulamanın performansına dair veri mi topluyor?\n",
      "ruleText": "MDM hizmeti sunan uygulamalar bu yeteneği Apple'dan talep etmelidir. Bu uygulamalar yalnızca ticari işletmeler, eğitim kurumları ya da kamu kurumları tarafından ve sınırlı durumlarda ebeveyn kontrolü veya cihaz güvenliği için MDM kullanan şirketler tarafından sunulabilir. Hangi kullanıcı verisinin toplanacağı ve nasıl kullanılacağı, kullanıcı satın alma ya da kullanma eylemine geçmeden önce bir uygulama ekranında açıkça beyan edilmelidir. MDM uygulamaları hiçbir veriyi üçüncü taraflara satamaz, kullanamaz veya açıklayamaz ve buna gizlilik politikalarında taahhüt etmelidir. Sınırlı durumlarda, yalnızca geliştiricinin MDM uygulamasının performansına dair veri toplayan üçüncü taraf analitiklere izin verilebilir. Yapılandırma profili sunan uygulamalar da bu şartlara uymalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.6-code-of-conduct",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.6",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "conduct",
        "dark-patterns",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama kullanıcıyı sömüren ya da kandıran bir kalıp içeriyor mu: istemediği satın almaya yönlendirme, gereksiz veri paylaşımına zorlama, fiyatı hileli biçimde artırma, teslim edilmeyen özellik ya da içerik için ücret alma, iptali zorlaştırma? Ayrıca App Store yorumlarına, destek taleplerine ve Apple ile yazışmalara verilen yanıtlar saygılı mı?\n",
      "ruleText": "Herkese saygılı davran; App Store yorumlarına verdiğin yanıtlarda, müşteri destek taleplerinde ve Apple ile iletişimde taciz, ayrımcı uygulama, gözdağı ve zorbalık yapma. Müşteri güveni uygulama ekosisteminin temel taşıdır: uygulamalar kullanıcıları asla avlamamalı, kandırmamalı, istemedikleri satın almalara yönlendirmemeli, gereksiz veri paylaşımına zorlamamalı, fiyatları hileli biçimde artırmamalı, teslim edilmeyen özellik veya içerik için ücret almamalı ya da başka manipülatif uygulamalara başvurmamalıdır.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.6.1-review-prompts",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6.1",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.1",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "conduct",
        "reviews",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "(1) Uygulama puanlama istemi için Apple'ın sağladığı API'yi mi kullanıyor? Özel/kendi yazdığın yorum istemleri kabul edilmiyor. (2) App Store yorumlarına verdiğin yanıtlar kullanıcının yorumuna odaklı mı; kişisel bilgi, spam ya da pazarlama içeriyor mu?\n",
      "ruleText": "App Store müşteri yorumları uygulama deneyiminin ayrılmaz bir parçası olabilir; yorumlara yanıt verirken müşterilere saygılı davran. Yanıtların kullanıcının yorumuna odaklı olsun ve kişisel bilgi, spam ya da pazarlama içermesin. Kullanıcılardan uygulamanı değerlendirmelerini istemek için sağlanan API'yi kullan; özel yorum istemlerine izin verilmez.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.6.2-developer-identity",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6.2",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.2",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "conduct",
        "identity",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "App Store'da görünen kimlik bilgileri doğru mu: satıcı adı, geliştirici adı, iletişim bilgisi ve uygulamanın sunduğu şeye dair beyanlar? Bilgiler güncel mi ve Apple ile müşteriler kiminle muhatap olduklarını anlayabiliyor mu?\n",
      "ruleText": "Apple'a ve müşterilere doğrulanabilir bilgi sunmak müşteri güveni için kritiktir. Kendini, işletmeni ve sunduklarını App Store'da ya da alternatif dağıtımda doğru temsil etmelisin. Verdiğin bilgi doğru, ilgili ve güncel olmalıdır; böylece Apple ve müşteriler kiminle muhatap olduklarını anlar ve sorun hâlinde sana ulaşabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "medium",
      "version": 1
    },
    {
      "id": "apple-5.6.3-discovery-fraud",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.3",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "conduct",
        "fraud",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "App Store müşteri deneyiminin herhangi bir öğesi manipüle ediliyor mu: listeler/sıralamalar, arama sonuçları, yorumlar ya da uygulamaya gelen yönlendirmeler? Ücretli, teşvikli, filtrelenmiş veya sahte geri bildirim ile sıralama şişirme, üçüncü taraf hizmetler aracılığıyla yapılsa bile Developer Program'dan çıkarılma sebebi.\n",
      "ruleText": "App Store'da yer almak dürüstlük ve müşteri güvenini koruma taahhüdü gerektirir. App Store müşteri deneyiminin herhangi bir öğesinin — listeler, arama, yorumlar ya da uygulamana gelen yönlendirmeler gibi — manipüle edilmesi müşteri güvenini zedeler ve buna izin verilmez.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.6.3-rating-prompt-timing",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6.3",
        "url": "https://developer.apple.com/app-store/review/guidelines/#developer-code-of-conduct",
        "retrievedAt": "2026-08-26"
      },
      "tags": [
        "rating",
        "onboarding",
        "code-of-conduct"
      ],
      "scope": "single",
      "needs": [],
      "facts": [
        "Apple, App Store müşteri deneyiminin herhangi bir öğesini — sıralama, arama, YORUM/PUAN veya yönlendirme — manipüle etmeyi yasaklıyor.",
        "Somut ihlal biçimi: kullanıcı uygulamanın değerini anlamaya fırsat bulmadan, ilk açılışta ya da onboarding sırasında puan istemek.",
        "Doğru yol `SKStoreReviewController.requestReview` ve doğru AN: kullanıcı anlamlı bir işi TAMAMLADIKTAN sonra. Apple çağrı sayısını zaten yılda üçle sınırlıyor; sorun sıklık değil ZAMANLAMA.",
        "Kendi yazdığın özel bir 'bize 5 yıldız ver' penceresi, kullanıcıyı App Store'a yönlendiren düğme, ya da puan karşılığı ödül/kredi vermek de aynı maddeye giriyor.",
        "Bu davranış listing'den GÖRÜLEMEZ — build'in içinde. O yüzden kart modele gitmez, insana düşer."
      ],
      "question": "Uygulama puan/yorum isteme penceresini NE ZAMAN gösteriyor? Temiz kur: uygulamayı sil, yeniden kur ve ilk açılışı izle. İhlal sayılacaklar: ilk açılışta veya onboarding sırasında puan istemek; kullanıcı henüz anlamlı bir iş tamamlamadan istemek; kendi yazdığın \"5 yıldız ver\" penceresi; puan karşılığı ödül/kredi/özellik açmak; kullanıcıyı doğrudan App Store yorum sayfasına atmak. Temiz sayılan: `SKStoreReviewController.requestReview`, kullanıcı gerçek bir işi tamamladıktan sonra (ör. ilk tasarımını kaydetti, ilk videosunu üretti).\n",
      "ruleText": "App Store'da yer almak dürüstlük ve müşteri güvenini korumaya bağlılık gerektirir. App Store müşteri deneyiminin herhangi bir öğesini — sıralamalar, arama, yorumlar veya yönlendirmeler — manipüle etmek müşteri güvenini aşındırır ve buna izin verilmez.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "apple-5.6.4-app-quality",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "5.6.4",
        "url": "https://developer.apple.com/app-store/review/guidelines/#5.6.4",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "conduct",
        "quality",
        "checklist"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Uygulama hakkında aşırı müşteri şikâyeti, olumsuz yorum ya da aşırı iade talebi var mı? Apple bunları kalite beklentisinin karşılanmadığının göstergesi sayıyor ve Developer Code of Conduct değerlendirmesinde kullanıyor.\n",
      "ruleText": "Müşteriler App Store'dan en yüksek kaliteyi bekler. Uygulaman hakkında aşırı müşteri şikâyeti — olumsuz müşteri yorumları gibi — ve aşırı iade talepleri bu beklentinin karşılanmadığının göstergeleridir. Yüksek kaliteyi sürdürememek, geliştiricinin Developer Code of Conduct'a uyup uymadığına karar verirken bir etken olabilir.\n",
      "outcome": "manual",
      "defaultSeverity": "low",
      "version": 1
    },
    {
      "id": "apple-before-you-submit-checklist",
      "platform": "apple",
      "source": {
        "doc": "Apple App Review Guidelines",
        "section": "before-you-submit",
        "url": "https://developer.apple.com/app-store/review/guidelines/#before-you-submit",
        "retrievedAt": "2026-08-21"
      },
      "tags": [
        "checklist",
        "completeness"
      ],
      "scope": "cross",
      "needs": [],
      "question": "Apple'ın gönderim öncesi listesi: (1) uygulama çökme ve hatalara karşı test edildi mi, (2) tüm uygulama bilgisi ve metadata eksiksiz ve doğru mu, (3) App Review sana ulaşabilsin diye iletişim bilgin güncel mi, (4) hesap tabanlı özellikler varsa aktif bir demo hesap ya da tam işlevli demo modu ile incelemeye gereken diğer kaynaklar (giriş bilgisi, örnek QR kod, donanım) verildi mi, (5) arka uç servisleri inceleme boyunca açık mı, (6) apaçık olmayan özellikler ve uygulama içi satın almalar App Review notlarında — gerekiyorsa destekleyici belgeyle — ayrıntılı anlatıldı mı?\n",
      "ruleText": "Gönderim öncesinde: uygulamanı çökme ve hatalara karşı test et; tüm uygulama bilgisinin ve metadata'nın eksiksiz ve doğru olduğundan emin ol; App Review'un sana ulaşması gerekirse diye iletişim bilgini güncelle; App Review'a uygulamana tam erişim ver (hesap tabanlı özellikler varsa aktif bir demo hesap ya da tam işlevli demo modu ile incelemeye gerekebilecek diğer donanım ve kaynaklar); arka uç servislerini inceleme sırasında canlı ve erişilebilir tut; apaçık olmayan özellikleri ve uygulama içi satın almaları — uygun olduğunda destekleyici belgelerle birlikte — App Review notlarında ayrıntılı anlat.\n",
      "outcome": "manual",
      "defaultSeverity": "high",
      "version": 1
    },
    {
      "id": "shared-age-rating-consistency",
      "platform": "both",
      "source": {
        "doc": "Apple App Review Guidelines / Google Play Developer Policy",
        "section": "1.1 / Content Ratings",
        "url": "https://developer.apple.com/app-store/review/guidelines/#safety",
        "retrievedAt": "2026-08-19"
      },
      "tags": [
        "age-rating",
        "safety",
        "vision"
      ],
      "scope": "cross",
      "needs": [
        "ageRating",
        "description",
        "screenshots",
        "category"
      ],
      "facts": [
        "Apple'ın yaş sınırı merdiveni SADECE şudur, aşağıdan yukarıya: 4+, 9+, 12+, 17+. Google Play'de: Everyone, Everyone 10+, Teen, Mature 17+, Adults only 18+.",
        "17+ Apple'ın EN YÜKSEK derecesidir. Bir uygulama zaten 17+ ise daha yukarı çıkarılamaz ve bu kart o uygulama için bulgu ÜRETMEMELİDİR.",
        "Kullanıcı içeriği barındıran, sosyal etkileşim sunan veya AI ile gerçekçi insan görüntüsü üreten uygulamalar genellikle 4+ / Everyone derecesine uygun değildir.",
        "Kozmetik/vücut değiştirme, flört, şiddet veya müstehcenliğe yakın içerik daha yüksek yaş sınırı gerektirir."
      ],
      "question": "ÖNCE BUNA BAK: uygulamanın beyan edilen yaş sınırı nedir? 17+ (ya da Google'da \"Mature 17+\"/\"Adults only\") ise BULGU ÜRETME ve dur — zaten en yüksek derecede, yükseltilecek yer yok. Daha düşükse devam et: metin veya ekran görüntüleri müstehcenliğe yakın, vücut/yüz değiştirme, flört, şiddet ya da kullanıcı içeriği barındırma işareti veriyor mu? Veriyorsa bildir ve önerinde MEVCUT DERECEDEN DAHA YÜKSEK bir basamak yaz (4+ → 9+ → 12+ → 17+). Mevcut dereceye eşit ya da ondan düşük bir öneri yazma. Emin değilsen bildirme.\n",
      "ruleText": "Beyan edilen yaş sınırı/içerik derecelendirmesi uygulamanın gerçek içeriğiyle tutarlı olmalıdır.\n",
      "positiveExample": "Yaş sınırı 4+ ama açıklamada 'AI ile vücudunu yeniden şekillendir' ve kullanıcı galerisi var.",
      "negativeExample": "Yaş sınırı zaten 17+ ve uygulama AI ile yüz değiştirme sunuyor — en yüksek derecede olduğu için bulgu yok.",
      "outcome": "risk",
      "defaultSeverity": "medium",
      "version": 2
    }
  ],
  "version": "4cfd320aa974"
}
