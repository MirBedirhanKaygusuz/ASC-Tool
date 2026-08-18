import { readFile } from 'node:fs/promises'
import type { Submission } from '../types.js'

/**
 * Girdi kaynakları.
 *
 * TASARIM KARARI: fetch katmanı fixture'dan da beslenebiliyor. Böylece
 * App Store Connect anahtarı gelmeden önce tüm boru hattı geliştirilebilir
 * ve test edilebilir. Anahtar geldiğinde sadece bu dosyanın içi değişir.
 */
export async function loadFixture(path: string): Promise<Submission> {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as Submission
}

export async function fetchFromAppStoreConnect(_appId: string): Promise<Submission> {
  // TODO(Faz 1): ASC API — .p8 ile JWT üret, sonra:
  //   GET /v1/apps/{id}/appStoreVersions
  //   GET /v1/appStoreVersions/{id}/appStoreVersionLocalizations  -> metinler
  //   GET /v1/appStoreVersionLocalizations/{id}/appScreenshotSets -> görseller
  //   GET /v1/apps/{id}/subscriptionGroups                        -> abonelikler
  // NOT: red gerekçeleri (Resolution Center) bu API'de YOK — elle toplanacak.
  throw new Error('App Store Connect entegrasyonu henüz yok — --fixture kullan')
}

export async function fetchFromPlay(_packageName: string): Promise<Submission> {
  // TODO(Faz 2): Play Developer API — edits.insert -> edits.listings.list
  //   + edits.images.list + monetization.subscriptions.list
  // NOT: Data Safety formu ve App Content beyanları bu API'de YOK.
  throw new Error('Play Developer API entegrasyonu henüz yok — --fixture kullan')
}
