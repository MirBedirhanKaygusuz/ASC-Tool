import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { Lesson, RejectCase, LessonStore } from './types.js'
import type { Platform } from '../types.js'

/**
 * Yerel dosya sistemi deposu.
 *
 * Supabase'in tablolarını index.json, R2'nin bucket'ını klasörler taklit eder.
 * Amaç: bulut anahtarları gelmeden önce tüm öğrenme akışının geliştirilip
 * test edilebilmesi. Anahtarlar geldiğinde SupabaseR2Store devreye girer,
 * geri kalan kod değişmez.
 *
 *   lessons/index.json        ← Supabase karşılığı (lessons + reject_cases)
 *   lessons/bodies/{id}.md    ← R2: lessons/{id}.md
 *   lessons/rejects/{id}.txt  ← R2: rejects/{id}.txt
 */
export class LocalLessonStore implements LessonStore {
  readonly name = 'local'

  constructor(private readonly root = 'lessons') {}

  private get indexPath() {
    return join(this.root, 'index.json')
  }

  async healthcheck(): Promise<{ ok: true } | { ok: false; reason: string }> {
    await mkdir(join(this.root, 'bodies'), { recursive: true })
    await mkdir(join(this.root, 'rejects'), { recursive: true })
    return { ok: true }
  }

  private async index(): Promise<{ lessons: Lesson[]; examples: RejectCase[] }> {
    try {
      return JSON.parse(await readFile(this.indexPath, 'utf8'))
    } catch {
      return { lessons: [], examples: [] }
    }
  }

  private async writeIndex(idx: { lessons: Lesson[]; examples: RejectCase[] }) {
    await mkdir(dirname(this.indexPath), { recursive: true })
    await writeFile(this.indexPath, JSON.stringify(idx, null, 2))
  }

  async activeLessons(platform: Platform): Promise<Lesson[]> {
    const { lessons } = await this.index()
    return lessons.filter((l) => l.status === 'active' && l.platform === platform)
  }

  async allLessons(): Promise<Lesson[]> {
    return (await this.index()).lessons
  }

  async findLesson(id: string): Promise<Lesson | null> {
    return (await this.index()).lessons.find((l) => l.id === id) ?? null
  }

  async candidatesFor(platform: Platform, guideline: string): Promise<Lesson[]> {
    const { lessons } = await this.index()
    return lessons.filter(
      (l) => l.platform === platform && l.guideline === guideline && l.status !== 'retired',
    )
  }

  async examplesFor(lessonId: string, limit = 3): Promise<RejectCase[]> {
    const { examples } = await this.index()
    return examples.filter((e) => e.lessonId === lessonId).slice(0, limit)
  }

  async createLesson(lesson: Lesson, body: string): Promise<void> {
    const idx = await this.index()
    if (idx.lessons.some((l) => l.id === lesson.id)) {
      throw new Error(`Ders zaten var: ${lesson.id}`)
    }
    idx.lessons.push(lesson)
    await mkdir(join(this.root, 'bodies'), { recursive: true })
    await writeFile(join(this.root, lesson.bodyKey), body)
    await this.writeIndex(idx)
  }

  async updateLessonStatus(id: string, status: Lesson['status']): Promise<void> {
    const idx = await this.index()
    const l = idx.lessons.find((x) => x.id === id)
    if (!l) throw new Error(`Ders bulunamadı: ${id}`)
    l.status = status
    l.updatedAt = new Date().toISOString()
    await this.writeIndex(idx)
  }

  async addExample(example: RejectCase, rawText: string): Promise<void> {
    const idx = await this.index()
    idx.examples.push(example)
    const lesson = idx.lessons.find((l) => l.id === example.lessonId)
    if (lesson) {
      lesson.exampleCount = idx.examples.filter((e) => e.lessonId === lesson.id).length
      lesson.updatedAt = new Date().toISOString()
    }
    await mkdir(join(this.root, 'rejects'), { recursive: true })
    await writeFile(join(this.root, example.rawKey), rawText)
    await this.writeIndex(idx)
  }

  async readBody(lesson: Lesson): Promise<string> {
    try {
      return await readFile(join(this.root, lesson.bodyKey), 'utf8')
    } catch {
      return ''
    }
  }

  /** Yerel depoya özel: ham reject dosyalarını listele (ingest için kolaylık). */
  async listRawRejects(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((e) => e.isFile() && /\.(txt|md)$/.test(e.name)).map((e) => join(dir, e.name))
  }
}
