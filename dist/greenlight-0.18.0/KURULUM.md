# Greenlight — kurulum (v0.18.0)

App Store Connect listing'ini **göndermeden önce** politika kurallarına karşı
denetler. Apple'ın kendi kural metnine atıf yapar ve ne yapman gerektiğini yazar.

## Kurulum (2 dakika, bir kez)

1. Bu klasörü kalıcı bir yere çıkar — **Masaüstü'ne değil**. Klasörü silersen
   eklenti ölür.
2. Chrome → adres çubuğuna `chrome://extensions`
3. Sağ üstten **Geliştirici modu**'nu aç.
4. **Paketlenmemiş öğe yükle** → bu klasörü seç.
5. Araç çubuğunda simge görünür. Puzzle simgesine tıklayıp iğneleyebilirsin.

Chrome her açılışta "geliştirici modundaki eklentileri devre dışı bırakın" diye
bir balon gösterir. **"Devre dışı bırak" deme** — eklenti kapanır.

## Kullanım

1. Bir sekmede App Store Connect'e giriş yapmış ol.
2. Eklenti simgesine tıkla → sağda **yan panel** açılır.
3. **Her şeyi çek** → hesaptaki uygulamalar, listing metinleri, sürüm geçmişi,
   ekran görüntüleri, ürün/abonelik ve **red yazışmaları** çekilir.
4. Bir uygulamaya tıkla → **Denetle**.

Uygulama başına yaklaşık bir dakika sürer. Çekim sürerken App Store Connect
sekmesini kapatma.

## İlk denetimde bir izin soracak

Denetim, gizlilik ve destek adreslerinin gerçekten açılıp açılmadığına bakabilir
— ölü bir gizlilik adresi en sık red sebeplerinden biri. Bunun için Chrome
"tüm sitelere erişim" izni ister.

Panel bu pencereyi habersiz açmaz: önce ne olduğunu anlatan bir kart çıkar ve
üç seçenek verir. **"İzinsiz denetle"** de gerçek bir seçenek — denetimin geri
kalanı çalışır, rapor yalnızca o kontrolün yapılmadığını yazar.

Eklenti bu izni yalnızca senin listing'inde yazan adresleri açmak için kullanır.

## Şirket kurulumu — bilinmesi gerekenler

**App Store Connect verisi DEĞİŞMEZ.** Eklenti Apple'a yalnızca okuma (GET)
isteği atar; hiçbir şey göndermez, düzenlemez, silmez. Kod tarafında Apple'a
giden tek bir çıkış noktası var (`src/iris.js`) ve her testte POST/PUT/PATCH/
DELETE içermediği doğrulanıyor.

**İstenen izinler dar.** Kurulumda yalnız `appstoreconnect.apple.com` erişimi
istenir. Çerez okuma izni yoktur — oturum tarayıcının kendisinindir. Hiçbir
sayfaya kendiliğinden kod enjekte edilmez. Geniş erişim (`<all_urls>`)
opsiyoneldir ve yalnızca sen onayladığında, listing'indeki adreslerin canlı
olup olmadığına bakmak için istenir.

**Herkesin verisi kendi bilgisayarında.** Ortak bir depo yok: sen çekersen
arkadaşın onu görmez, o çekerse sen görmezsin. Bu bilinçli bir ara durum.
Aktarmak için Menü → Yedek → "Paylaşılabilir kopya" kullan.

**Aynı anda hep birlikte çekim yapmayın.** İstekler arasında 800 ms bekleme
var ama bu bekleme her tarayıcıda AYRI çalışıyor. Beş kişi aynı anda "Her şeyi
çek" derse Apple aynı hesaptan beş kat yoğunluk görür ve hız sınırı
uygulayabilir. Kurulum gününde sırayla çekin; sonrasında herkes kendi
uygulamasını "Yeniden çek" ile güncellesin.

**Apple `429` dönerse** çekim kendini durdurur. O gün o hesapta bir daha
çekim yapmayın.

## Ne gerekmiyor

API anahtarı yok, konsola snippet yapıştırmak yok, terminal yok. Eklenti senin
zaten açık olan tarayıcı oturumunu kullanıyor.

## Veri nereye gidiyor

Her şey **kendi tarayıcının** deposunda (IndexedDB) durur; makineden çıkmaz.

Tek istisna: Ayarlar'a bir Worker adresi girilirse listing metinleri ve ekran
görüntüleri model denetimi için oraya gider. Adres boşken hiçbir veri dışarı
çıkmaz ve denetim yalnız kesin kontrolleri koşturur — rapor bunu en üstte
açıkça yazar.

Yedek alırken iki seçenek var: **Tam yedek** (maskesiz, demo hesap şifresi
dahil) ve **Paylaşılabilir kopya** (kişisel veri ve sırlar gizli). Birine dosya
gönderiyorsan ikincisini kullan.

## Bunu bil: rapor eksik olabileceğini SÖYLER

Araç "sorun yok" demeyi kolay bulmaz. Okunamayan bir uç, bilinmeyen bir beyan
ya da çalışmayan bir model turu varsa rapor bunu ayrı ayrı yazar:

- **"N uç okunamadı"** → o bölüme *bakılmadı*, "temiz" demek değil.
- **"Bu rapor eksiktir"** → model turu koşmadı, yalnız kesin kontroller çalıştı.
- **"Bilgi eksik"** → bir kural bir soruya cevap istiyor ama cevabı bilmiyoruz.
  Uygulama ekranındaki **Beyan** kutucuklarını doldurunca o kurallar çalışır.
  "Bilmiyorum" ile "Hayır" aynı şey değildir.

Bu satırları görmezden gelirsen elinde eksik bir denetim var demektir.

## Apple'a yük

İstekler sıralı ve aralarında 800 ms bekleme var. Apple `429` dönerse çekim
kendini durdurur; o gün bir daha çalıştırma.

## Sorun olursa

- Panel açılmıyor → `chrome://version` ile Chrome sürümüne bak, 114'ten
  eskiyse güncelle.
- "App Store Connect sekmesi bulunamadı" → ASC'ye giriş yapıp tekrar dene.
- Bir şey ters görünüyorsa: sağ tık → **İncele** → Console sekmesindeki
  `Greenlight yan panel v0.18.0 yüklendi` satırının saatini ve altındaki
  hatayı gönder.
