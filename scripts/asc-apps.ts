/**
 * Hesaptaki uygulamaları listeler — `check --app <id>` için gereken id'yi verir.
 * Aynı zamanda ASC kimlik bilgilerinin çalıştığının en ucuz kanıtı.
 */
try {
  process.loadEnvFile('.env')
} catch {
  /* .env yok */
}

import { AscClient, ascConfigFromEnv } from '../src/fetch/asc.js'

async function main() {
  const client = new AscClient(ascConfigFromEnv())
  const { data } = await client.list('/apps?limit=200')
  if (!data.length) {
    console.log('Hesapta uygulama yok (ya da anahtarın rolü göremiyor).')
    return
  }
  console.log(`${data.length} uygulama:\n`)
  for (const a of data) {
    const at = a.attributes ?? {}
    console.log(`  ${a.id.padEnd(12)} ${String(at.name).padEnd(34)} ${at.bundleId}  ${at.primaryLocale}`)
  }
  console.log(`\nDenetlemek için:  npm run check -- --app ${data[0]!.id}`)
}

main().catch((e) => {
  console.error(`\nHATA: ${e.message}`)
  process.exit(1)
})
