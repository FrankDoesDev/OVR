import Parser from 'rss-parser'
import { FeedItem, Digest, FeedSource, UserSettings, Category } from '@/types'
import { buildFeedSource } from './feeds'
import { saveDigest, loadSettings } from './storage'
import { extractRssImage } from './images'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0' },
  customFields: { item: ['media:content', 'media:thumbnail', 'media:group', 'content:encoded'] },
})

const BLOCKED_IMAGE_HOSTS = ['cdn.cnn.com']

function isImageBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return BLOCKED_IMAGE_HOSTS.some((h) => host === h || host.endsWith('.' + h))
  } catch { return false }
}

async function fetchSource(source: FeedSource): Promise<FeedItem[]> {
  try {
    const isXml = source.type === 'rss' || source.type === 'youtube-rss' || source.type === 'twitter-rss'
    if (isXml) {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()
      const feed = await parser.parseString(xml)
      const rawItems = feed.items || []
      const transformed = source.transform({ items: rawItems })
      transformed.forEach((item, i) => {
        if (!item.imageUrl) {
          const img = extractRssImage(rawItems[i], xml, i)
          if (img && !isImageBlocked(img)) item.imageUrl = img
        } else if (isImageBlocked(item.imageUrl)) {
          item.imageUrl = undefined
        }
        if (source.icon) item.icon = source.icon
      })
      return transformed
    }

    if (source.type === 'api-json') {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const items = source.transform(data)
      items.forEach((item) => { if (source.icon) item.icon = source.icon })
      return items
    }

    return []
  } catch (err) {
    console.error(`[Aggregator] Failed to fetch ${source.name}:`, (err as Error).message)
    return []
  }
}

function deduplicate(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url || item.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sortByDate(items: FeedItem[]): FeedItem[] {
  return items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

function getHourLabel(): string {
  const h = new Date().getHours()
  if (h < 6) return '00'
  if (h < 12) return '06'
  if (h < 18) return '12'
  return '18'
}

export async function generateDigest(settings?: UserSettings): Promise<Digest> {
  console.log('[Aggregator] Starting digest generation...')

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const hour = getHourLabel()

  const s = settings || loadSettings()
  const enabledCats = s.categories.filter((c) => c.enabled)
  const catBySlug: Record<string, Category> = {}
  enabledCats.forEach((c) => { catBySlug[c.slug] = c })

  const activeCatIds = new Set(enabledCats.map((c) => c.id))
  const storedSources = s.sources.filter((src) => src.enabled && activeCatIds.has(src.categoryId))
  const sources: FeedSource[] = storedSources.map(buildFeedSource)

  const maxPerSource = s.maxItemsPerSource || 30

  const results = await Promise.allSettled(sources.map((source) => fetchSource(source)))

  const sections: Record<string, FeedItem[]> = {}
  enabledCats.forEach((c) => { sections[c.slug] = [] })
  const sourceCounts: Record<string, number> = {}

  sources.forEach((source, i) => {
    const result = results[i]
    const cat = catBySlug[enabledCats.find((c) => c.id === source.categoryId)?.slug || '']
    const slug = cat?.slug
    if (result.status === 'fulfilled' && slug) {
      const items = sortByDate(deduplicate(result.value)).slice(0, maxPerSource)
      sections[slug].push(...items)
      sourceCounts[source.name] = items.length
    } else {
      sourceCounts[source.name] = 0
    }
  })

  enabledCats.forEach((c) => {
    sections[c.slug] = sortByDate(deduplicate(sections[c.slug]))
  })

  const digest: Digest = {
    date,
    hour,
    generatedAt: now.toISOString(),
    sections,
    categories: enabledCats,
    sourceCounts,
  }

  saveDigest(digest)
  console.log(`[Aggregator] Digest saved: ${date}-${hour}`)
  enabledCats.forEach((c) => {
    console.log(`  ${c.name}: ${(sections[c.slug] || []).length} items`)
  })

  return digest
}
