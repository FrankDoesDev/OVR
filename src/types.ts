export interface FeedItem {
  id: string
  title: string
  url: string
  source: string
  categoryId: string
  publishedAt: string
  description?: string
  imageUrl?: string
  icon?: string
  author?: string
  sourceType: string
}

export interface Digest {
  date: string
  hour: string
  generatedAt: string
  sections: Record<string, FeedItem[]>
  categories: Category[]
  sourceCounts: Record<string, number>
}

export interface Category {
  id: string
  name: string
  slug: string
  enabled: boolean
  order: number
}

export interface JsonMapping {
  itemsPath?: string
  titlePath?: string
  urlPath?: string
  descriptionPath?: string
  datePath?: string
  imageUrlPath?: string
}

export interface StoredSource {
  id: string
  name: string
  categoryId: string
  type: string
  url: string
  icon?: string
  enabled: boolean
  transformType: string
  jsonMapping?: JsonMapping
}

export interface UserSettings {
  categories: Category[]
  sources: StoredSource[]
  maxItemsPerSource: number
  refreshIntervalHours: number
  homepagePreviewCount: number
  maxItemAgeDays: number
}

export interface ArchiveEntry {
  date: string
  hour: string
  path: string
}

export interface TestResult {
  success: boolean
  type?: string
  title?: string
  items: { index: number; title: string; url: string }[]
  error?: string
  topKeys?: string[]
}

export type PageView =
  | { type: "home" }
  | { type: "category"; slug: string }
  | { type: "search" }
  | { type: "settings" }
  | { type: "archive" }
  | { type: "archive-date"; date: string; hour: string }

export interface NavCategory {
  name: string
  slug: string
}
