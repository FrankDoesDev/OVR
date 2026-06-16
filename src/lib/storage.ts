import fs from 'fs'
import path from 'path'
import { Digest, DigestArchive, UserSettings, StoredSource, Category } from '@/types'
import { builtInSources } from './feeds'

const DATA_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)
}

function buildSeed(): UserSettings {
  const categories: Category[] = [
    { id: generateId(), name: 'Gaming', slug: 'gaming', enabled: true, order: 0 },
    { id: generateId(), name: 'Tech', slug: 'tech', enabled: true, order: 1 },
    { id: generateId(), name: 'Politics', slug: 'politics', enabled: true, order: 2 },
  ]

  const catBySlug: Record<string, string> = {}
  categories.forEach((c) => { catBySlug[c.slug] = c.id })

  const sources: StoredSource[] = builtInSources.map((def) => ({
    id: generateId(),
    name: def.name,
    categoryId: catBySlug[def.categorySlug] || categories[0].id,
    type: def.type,
    url: def.url,
    icon: def.icon,
    enabled: true,
    transformType: def.transformType,
    jsonMapping: def.jsonMapping,
  }))

  return {
    categories,
    sources,
    maxItemsPerSource: 30,
    refreshIntervalHours: 6,
    homepagePreviewCount: 4,
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function loadSettings(): UserSettings {
  ensureDataDir()
  if (!fs.existsSync(SETTINGS_FILE)) {
    const seed = buildSeed()
    saveSettings(seed)
    return seed
  }
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    if (!data.categories || !data.sources) {
      const seed = buildSeed()
      const merged = { ...seed, ...data }
      saveSettings(merged)
      return merged
    }
    return data
  } catch {
    const seed = buildSeed()
    saveSettings(seed)
    return seed
  }
}

export function saveSettings(settings: UserSettings): void {
  ensureDataDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

function getFileName(date: string, hour: string): string {
  return `digest-${date}-${hour}.json`
}

export function saveDigest(digest: Digest): string {
  ensureDataDir()
  const fileName = getFileName(digest.date, digest.hour)
  const filePath = path.join(DATA_DIR, fileName)
  fs.writeFileSync(filePath, JSON.stringify(digest, null, 2))
  return filePath
}

export function loadDigest(date: string, hour?: string): Digest | null {
  ensureDataDir()
  if (hour) {
    const filePath = path.join(DATA_DIR, getFileName(date, hour))
    if (fs.existsSync(filePath)) {
      return migrateDigest(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
    }
    return null
  }
  const hours = ['00', '06', '12', '18']
  for (const h of hours) {
    const digest = loadDigest(date, h)
    if (digest) return digest
  }
  return null
}

export function loadLatestDigest(): Digest | null {
  ensureDataDir()
  const archives = listArchives()
  if (archives.length === 0) return null
  const latest = archives[archives.length - 1]
  return loadDigest(latest.date, latest.hour)
}

export function listArchives(): DigestArchive[] {
  ensureDataDir()
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('digest-') && f.endsWith('.json'))
  return files.map((f) => {
    const match = f.match(/digest-(\d{4}-\d{2}-\d{2})-(\d{2})\.json/)
    if (!match) return null
    return { date: match[1], hour: match[2], path: f }
  }).filter(Boolean) as DigestArchive[]
}

export function loadDigestByPath(fileName: string): Digest | null {
  const filePath = path.join(DATA_DIR, fileName)
  if (fs.existsSync(filePath)) {
    return migrateDigest(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
  }
  return null
}

function migrateDigest(data: any): Digest {
  if (data.categories) return data as Digest
  const old = data as { sections: { gaming?: any[]; tech?: any[]; politics?: any[] }; sourceCounts: Record<string, number> }
  const categories: Category[] = [
    { id: 'migrated-gaming', name: 'Gaming', slug: 'gaming', enabled: true, order: 0 },
    { id: 'migrated-tech', name: 'Tech', slug: 'tech', enabled: true, order: 1 },
    { id: 'migrated-politics', name: 'Politics', slug: 'politics', enabled: true, order: 2 },
  ]
  const sections: Record<string, any[]> = {}
  const slugMap: Record<string, string> = { gaming: 'migrated-gaming', tech: 'migrated-tech', politics: 'migrated-politics' }
  for (const [slug, cat] of Object.entries(slugMap)) {
    const items = (old.sections as any)[slug] || []
    sections[slug] = items.map((item: any) => ({ ...item, categoryId: cat }))
  }

  return {
    date: data.date,
    hour: data.hour,
    generatedAt: data.generatedAt,
    sections,
    categories,
    sourceCounts: old.sourceCounts || {},
  }
}
