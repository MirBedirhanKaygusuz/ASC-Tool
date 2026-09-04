/**
 * Eklentiyi TEK BAŞINA dağıtılabilir bir klasör/zip hâline getirir.
 *
 * NEDEN VAR. Eklentiyi denemesi için birine projenin tamamını vermek gerekmez
 * ve verilmemeli: `src/`, `corpus/`, `worker/`, `.env`, imza anahtarı ve red
 * arşivi paylaşılacak şeyler değil. `extension/` klasörü kendi kendine
 * yeterli — denetim mantığı `src/` altındaki TypeScript'ten derlenip
 * `src/*.bundle.js` içine gömülüyor.
 *
 * ÜÇ KORUMA (hepsi paketi durdurur, uyarıp devam etmez):
 *   1. Paketler TAZE. Betik önce `build:ext` koşturuyor; eski paketle
 *      dağıtmak, karşı tarafın düzeltilmiş bir hatayı yeniden yaşaması
 *      demek — ve sana "bende oluyor" diye geri dönmesi.
 *   2. Sır SIZMIYOR. .pem/.env/.p8 ve anahtar benzeri metin taranıyor.
 *   3. Node SIZMIYOR. Paketlerde `require(`/`node:` kalıntısı varsa tarayıcıda
 *      patlar; build:ext bunu zaten denetliyor, burada bir daha bakıyoruz.
 */
import { execFile } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
// `new URL(...).pathname` KULLANMA: bu deponun yolunda boşluk ve Türkçe harf
// var ("adsız klasör") ve pathname onları yüzde-kodluyor — chdir patlar.
// Aynı tuzağa scripts/test-core.ts'te de düşüldü.
const KOK = fileURLToPath(new URL('..', import.meta.url))
const KAYNAK = 'extension'
const DIST = 'dist'

/** Karşı tarafa GİTMEYECEKLER. Geliştirme artığı ya da bağlamı olmayan dosya. */
const HARIC = new Set(['test', 'README.md'])

/** Sızarsa iş büyür. Bulunursa paket üretilmez. */
const YASAK_DOSYA = /\.(pem|p8|key|env|crx)$|^\.env/i

/**
 * Desen DAR tutuluyor: manifest'teki `key` alanı base64 bir AÇIK anahtar ve
 * paylaşılması GEREKİYOR (eklenti kimliğini sabitliyor). "Uzun base64 gördüm"
 * gibi bir kural onu da engellerdi.
 *
 * `[A-Za-z0-9_-]` — tire ve alt çizgi ŞART. İlk hâli `[A-Za-z0-9]{20,}` idi ve
 * gerçek bir OpenAI anahtarını (`sk-proj-…`) KAÇIRIYORDU: "proj" dört
 * karakterde tireye çarpıyor, desen tutmuyordu. Sahte anahtarla sınamasaydım
 * koruma orada durduğu hâlde hiçbir şey yapmıyor olacaktı — güvenlik
 * kontrolünün en kötü hâli, çünkü ona güvenip bakmayı bırakıyorsun.
 */
const YASAK_METIN =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{20,}|Authorization:\s*Bearer\s+\S/

async function dosyalar(dir: string, taban = ''): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = taban ? `${taban}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...(await dosyalar(join(dir, e.name), rel)))
    else out.push(rel)
  }
  return out
}

async function main() {
  process.chdir(KOK)

  // --- 1. Paketleri tazele -------------------------------------------------
  console.log('→ paketler yeniden derleniyor (eski paketle dağıtmak en pahalı hata)')
  const { stdout } = await run('npm', ['run', 'build:ext'])
  if (!/Node sızıntısı yok/.test(stdout)) {
    throw new Error('build:ext "Node sızıntısı yok" demedi — paket üretilmedi.\n' + stdout)
  }

  const manifest = JSON.parse(await readFile(join(KAYNAK, 'manifest.json'), 'utf8'))
  const surum = manifest.version
  const ad = `greenlight-${surum}`
  const hedef = join(DIST, ad)

  await rm(DIST, { recursive: true, force: true })
  await mkdir(hedef, { recursive: true })

  // --- 2. Kopyala ----------------------------------------------------------
  let kopyalanan = 0
  for (const e of await readdir(KAYNAK, { withFileTypes: true })) {
    if (HARIC.has(e.name)) continue
    await cp(join(KAYNAK, e.name), join(hedef, e.name), { recursive: true })
    kopyalanan++
  }

  // --- 3. Sızıntı denetimi — kopyanın ÜSTÜNDE, kaynağın değil -------------
  const liste = await dosyalar(hedef)
  const yasakDosyalar = liste.filter((f) => YASAK_DOSYA.test(f.split('/').pop() ?? ''))
  if (yasakDosyalar.length) {
    throw new Error(`Pakete girmemesi gereken dosya bulundu: ${yasakDosyalar.join(', ')}`)
  }
  for (const f of liste) {
    if (/\.(png|jpg|zip)$/i.test(f)) continue
    const icerik = await readFile(join(hedef, f), 'utf8')
    if (YASAK_METIN.test(icerik)) {
      throw new Error(`${f} içinde anahtar benzeri metin var — paket üretilmedi.`)
    }
    if (/\brequire\(|node:fs|node:crypto|process\.env/.test(icerik)) {
      throw new Error(`${f} içinde Node kalıntısı var — tarayıcıda patlar.`)
    }
  }

  // --- 4. Karşı taraf için kurulum notu ------------------------------------
  await writeFile(join(hedef, 'KURULUM.md'), kurulumMetni(surum), 'utf8')

  // --- 5. Zip --------------------------------------------------------------
  // macOS'un `zip`i. `-x` ile .DS_Store gibi artıkları dışarıda bırakıyoruz;
  // Chrome onları yok sayar ama paketi kirletirler.
  const zip = `${ad}.zip`
  await run('zip', ['-r', '-q', zip, ad, '-x', '*.DS_Store'], { cwd: DIST })

  const boyut = (await stat(join(DIST, zip))).size
  console.log()
  console.log(`✓ ${DIST}/${zip}  (${Math.round(boyut / 1024)} KB, ${liste.length + 1} dosya)`)
  console.log(`  açık hâli: ${hedef}/`)
  console.log()
  console.log('Karşı tarafa gönderilecek: yalnız bu zip. Kurulum adımları içindeki')
  console.log('KURULUM.md dosyasında.')
  console.log()
  console.log('Model denetimi çalışsın istiyorsan Worker adresini de ayrıca ilet;')
  console.log('adres girilmezse eklenti yalnız kesin kontrolleri koşturur ve raporun')
  console.log('en üstünde "bu rapor eksiktir" yazar.')
  console.log()
  console.log('Ortak ders havuzu kuruluysa havuz adresini ve OKUMA belirtecini de ilet:')
  console.log('denetim ofisin geçmiş redlerini de kanıt olarak kullanır. Yazma')
  console.log('belirteci gitmez — eklenti havuza hiçbir şey yazmaz.')
}

function kurulumMetni(surum: string): string {
  return `# Greenlight — kurulum (v${surum})

App Store Connect listing'ini **göndermeden önce** politika kurallarına karşı
denetler. Apple'ın kendi kural metnine atıf yapar ve ne yapman gerektiğini yazar.

## Kurulum (2 dakika, bir kez)

1. Bu klasörü kalıcı bir yere çıkar — **Masaüstü'ne değil**. Klasörü silersen
   eklenti ölür.
2. Chrome → adres çubuğuna \`chrome://extensions\`
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
giden tek bir çıkış noktası var (\`src/iris.js\`) ve her testte POST/PUT/PATCH/
DELETE içermediği doğrulanıyor.

**İstenen izinler dar.** Kurulumda yalnız \`appstoreconnect.apple.com\` erişimi
istenir. Çerez okuma izni yoktur — oturum tarayıcının kendisinindir. Hiçbir
sayfaya kendiliğinden kod enjekte edilmez. Geniş erişim (\`<all_urls>\`)
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

**Apple \`429\` dönerse** çekim kendini durdurur. O gün o hesapta bir daha
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

Ayarlar'daki **Ortak ders havuzu** adresi tek yönlüdür: eklenti oradan yalnız
OKUR (ofisin daha önce yediği red'leri denetime kanıt olarak katar). Bu
makinedeki çekimlerin, denetimlerin ve dökümlerin hiçbiri havuza gitmez.

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

İstekler sıralı ve aralarında 800 ms bekleme var. Apple \`429\` dönerse çekim
kendini durdurur; o gün bir daha çalıştırma.

## Sorun olursa

- Panel açılmıyor → \`chrome://version\` ile Chrome sürümüne bak, 114'ten
  eskiyse güncelle.
- "App Store Connect sekmesi bulunamadı" → ASC'ye giriş yapıp tekrar dene.
- Bir şey ters görünüyorsa: sağ tık → **İncele** → Console sekmesindeki
  \`Greenlight yan panel v${surum} yüklendi\` satırının saatini ve altındaki
  hatayı gönder.
`
}

main().catch((e) => {
  console.error('✗ ' + e.message)
  process.exit(1)
})
