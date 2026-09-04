# Greenlight LLM proxy

Eklentinin model çağrılarını taşıyan Cloudflare Worker. **Tek işi API
anahtarını isteğe eklemek.** Prompt, kural kartı, şema — hiçbiri burada
değil; onlar `src/` altındaki TypeScript'te ve hem `npm run check`'e hem
eklentiye aynı kaynaktan derleniyor.

## Neden var

Anahtar üç yerden birinde durabilir: kullanıcının girdiği kutuda (kural gereği
yok), eklenti klasöründe (klasörü açan herkes görür, değiştirmek yeniden
dağıtım demek), ya da burada. Buradayken kimse görmez, değiştirmek tek deploy
ve üstüne günlük tavan + önbellek koyabiliyoruz.

## Kurulum (bir kez, sen yaparsın)

```bash
npm install -g wrangler
wrangler login

cd worker
wrangler secret put OPENAI_API_KEY      # anahtarı yapıştır, bir daha görünmez
wrangler deploy
```

Çıktıdaki adresi (`https://greenlight-llm.<hesabın>.workers.dev`) eklentinin
**Ayarlar** sekmesine yapıştır. Ofisteki kimse bu adımların hiçbirini yapmaz.

### Günlük tavan (önerilir)

```bash
wrangler kv namespace create LIMITS
```

Çıkan id'yi `wrangler.toml` içindeki `[[kv_namespaces]]` bloğuna yaz ve bloğun
yorumunu kaldır, sonra tekrar `wrangler deploy`.

### İstemci belirteci (isteğe bağlı)

```bash
wrangler secret put CLIENT_TOKEN        # rastgele bir dize
```

Aynı dizeyi eklentinin Ayarlar sekmesine gir. Adresi tesadüfen bulan birinin
kullanmasını zorlaştırır.

## Güvenlik — dürüst tablo

Origin kontrolü ve istemci belirteci **kimlik doğrulama değildir**: Origin
başlığı `curl` ile uydurulabilir, belirteç de eklentinin içinde durduğu için
sır sayılmaz. İkisi "adresi bulan rastgele biri kullanmasın" içindir.

**Gerçek durdurucu iki yerde:** buradaki günlük istek tavanı ve
**OpenAI hesabındaki harcama sınırı**. İkincisini mutlaka ayarla — döngüye
giren bir hata gecede bütçe yakabilir ve KV sayacı nihai tutarlı olduğu için
kesin tavan değildir.

## Gizlilik

İstek gövdesi **loglanmaz**. Sadece durum kodu, boyut ve sayaç loglanır.
Yine de bilerek seç: listing metinleri ve red yazışmaları senin Worker'ından
geçip OpenAI'a gidiyor — eklenti tek başına çalışırken veri tarayıcıdan hiç
çıkmıyordu.

## Önbellek

`temperature` 0 olan çağrılar 6 saat önbelleklenir; aynı kart + aynı metin
ikinci kez para ödetmez. Doğrulama oylaması `temperature > 0` ile koştuğu için
**önbelleğe alınmaz** — alınsaydı üç oy aynı yanıt olur ve oylama anlamını
yitirirdi.
