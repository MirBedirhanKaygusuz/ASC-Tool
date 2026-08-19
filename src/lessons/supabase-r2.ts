import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { Lesson, RejectCase, LessonStore } from './types.js'
import type { Platform } from '../types.js'

/**
 * Supabase (indeks) + Cloudflare R2 (gövde) deposu.
 *
 * İŞ BÖLÜMÜ:
 *   Supabase → sorguladığın kısım. "apple / 2.3.3 için aktif dersler" gibi
 *              filtreler burada koşar; küçük ve indeksli.
 *   R2       → okuduğun kısım. Ders gövdeleri ve ham reject metinleri; büyük,
 *              nadiren okunur, ucuz depolanır. Seçim Supa'da, okuma R2'de.
 *
 * R2 S3-uyumlu olduğu için standart S3 istemcisiyle konuşuyoruz.
 * Şema: sql/lessons.sql
 */
export class SupabaseR2Store implements LessonStore {
  readonly name = 'supabase+r2'
  private sb: SupabaseClient
  private s3: S3Client

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private readonly bucket: string,
    r2: { endpoint: string; accessKeyId: string; secretAccessKey: string },
  ) {
    this.sb = createClient(supabaseUrl, supabaseKey)
    this.s3 = new S3Client({
      region: 'auto', // R2 tek bölge gibi davranır
      endpoint: r2.endpoint,
      credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    })
  }

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    const { error } = await this.sb.from('lessons').select('id').limit(1)
    if (error) return { ok: false, reason: `Supabase: ${error.message}` }
    return { ok: true }
  }

  async activeLessons(platform: Platform): Promise<Lesson[]> {
    const { data, error } = await this.sb
      .from('lessons').select('*')
      .eq('status', 'active').eq('platform', platform)
    if (error) throw new Error(`Supabase: ${error.message}`)
    return (data ?? []).map(fromRow)
  }

  async allLessons(): Promise<Lesson[]> {
    const { data, error } = await this.sb.from('lessons').select('*').order('created_at')
    if (error) throw new Error(`Supabase: ${error.message}`)
    return (data ?? []).map(fromRow)
  }

  async findLesson(id: string): Promise<Lesson | null> {
    const { data } = await this.sb.from('lessons').select('*').eq('id', id).maybeSingle()
    return data ? fromRow(data) : null
  }

  async candidatesFor(platform: Platform, guideline: string): Promise<Lesson[]> {
    const { data, error } = await this.sb
      .from('lessons').select('*')
      .eq('platform', platform).eq('guideline', guideline).neq('status', 'retired')
    if (error) throw new Error(`Supabase: ${error.message}`)
    return (data ?? []).map(fromRow)
  }

  async examplesFor(lessonId: string, limit = 3): Promise<RejectCase[]> {
    const { data, error } = await this.sb
      .from('reject_cases').select('*')
      .eq('lesson_id', lessonId).order('rejected_at', { ascending: false }).limit(limit)
    if (error) throw new Error(`Supabase: ${error.message}`)
    return (data ?? []).map(caseFromRow)
  }

  async createLesson(lesson: Lesson, body: string): Promise<void> {
    // Önce gövde R2'ye: satır yazılıp gövde yazılamazsa kırık kayıt kalır.
    await this.put(lesson.bodyKey, body, 'text/markdown')
    const { error } = await this.sb.from('lessons').insert(toRow(lesson))
    if (error) throw new Error(`Supabase: ${error.message}`)
  }

  async updateLessonStatus(id: string, status: Lesson['status']): Promise<void> {
    const { error } = await this.sb
      .from('lessons').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(`Supabase: ${error.message}`)
  }

  async addExample(example: RejectCase, rawText: string): Promise<void> {
    await this.put(example.rawKey, rawText, 'text/plain')
    const { error } = await this.sb.from('reject_cases').insert(caseToRow(example))
    if (error) throw new Error(`Supabase: ${error.message}`)
    // example_count tetikleyici ile güncelleniyor (sql/lessons.sql)
  }

  async readBody(lesson: Lesson): Promise<string> {
    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: lesson.bodyKey }),
      )
      return (await res.Body?.transformToString()) ?? ''
    } catch {
      return ''
    }
  }

  private async put(key: string, body: string, contentType: string) {
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    )
  }
}

// snake_case (Postgres) ↔ camelCase (TS) dönüşümü
type Row = Record<string, unknown>

function fromRow(r: Row): Lesson {
  return {
    id: r.id as string,
    ruleId: (r.rule_id as string) ?? null,
    platform: r.platform as Platform,
    guideline: r.guideline as string,
    title: r.title as string,
    summary: r.summary as string,
    artifact: (r.artifact as Lesson['artifact']) ?? null,
    severity: r.severity as Lesson['severity'],
    status: r.status as Lesson['status'],
    bodyKey: r.body_key as string,
    exampleCount: (r.example_count as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

function toRow(l: Lesson): Row {
  return {
    id: l.id, rule_id: l.ruleId, platform: l.platform, guideline: l.guideline,
    title: l.title, summary: l.summary, artifact: l.artifact, severity: l.severity,
    status: l.status, body_key: l.bodyKey, example_count: l.exampleCount,
    created_at: l.createdAt, updated_at: l.updatedAt,
  }
}

function caseFromRow(r: Row): RejectCase {
  return {
    id: r.id as string,
    lessonId: r.lesson_id as string,
    appName: r.app_name as string,
    platform: r.platform as Platform,
    rejectedAt: (r.rejected_at as string) ?? null,
    guideline: r.guideline as string,
    artifact: (r.artifact as RejectCase['artifact']) ?? null,
    excerpt: r.excerpt as string,
    reviewerText: r.reviewer_text as string,
    resolution: (r.resolution as string) ?? null,
    rawKey: r.raw_key as string,
    status: r.status as RejectCase['status'],
    createdAt: r.created_at as string,
  }
}

function caseToRow(c: RejectCase): Row {
  return {
    id: c.id, lesson_id: c.lessonId, app_name: c.appName, platform: c.platform,
    rejected_at: c.rejectedAt, guideline: c.guideline, artifact: c.artifact,
    excerpt: c.excerpt, reviewer_text: c.reviewerText, resolution: c.resolution,
    raw_key: c.rawKey, status: c.status, created_at: c.createdAt,
  }
}
