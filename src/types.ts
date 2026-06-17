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
  itemsPath: string
  titlePath: string
  urlPath: string
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

export interface FeedSource extends StoredSource {
  transform: (data: any) => FeedItem[]
}

export interface DigestArchive {
  date: string
  hour: string
  path: string
}

export interface UserSettings {
  categories: Category[]
  sources: StoredSource[]
  maxItemsPerSource: number
  refreshIntervalHours: number
  homepagePreviewCount: number
  maxItemAgeDays: number
}
