import { FeedItem, FeedSource, StoredSource } from '@/types'

const youtubeChannel = (id: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`

function getByPath(obj: any, path?: string): any {
  if (!path || !obj) return undefined
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj)
}

function rssTransform(source: FeedSource) {
  return (data: any): FeedItem[] =>
    (data.items || []).map((item: any) => ({
      id: `${source.id}-${item.guid || item.link || Math.random().toString(36).slice(2)}`,
      title: item.title || '',
      url: item.link || '',
      source: source.name,
      categoryId: source.categoryId,
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      description: item.contentSnippet || item.content || '',
      sourceType: source.transformType,
    }))
}

function jsonTransform(source: FeedSource) {
  const m = source.jsonMapping
  return (data: any): FeedItem[] => {
    const items = m?.itemsPath ? getByPath(data, m.itemsPath) : data
    if (!Array.isArray(items)) return []
    return items.map((item: any) => ({
      id: `${source.id}-${getByPath(item, m?.titlePath) || Math.random().toString(36).slice(2)}`,
      title: getByPath(item, m?.titlePath) || '',
      url: getByPath(item, m?.urlPath) || '',
      source: source.name,
      categoryId: source.categoryId,
      publishedAt: getByPath(item, m?.datePath) || new Date().toISOString(),
      description: getByPath(item, m?.descriptionPath) || '',
      imageUrl: getByPath(item, m?.imageUrlPath) || undefined,
      sourceType: source.transformType,
    }))
  }
}

function epicFreeGamesTransform(source: FeedSource) {
  return (data: any): FeedItem[] =>
    (data.currentGames || []).map((game: any) => ({
      id: `epic-${game.id || game.title}`,
      title: `FREE: ${game.title || 'Unknown Game'}`,
      url: `https://store.epicgames.com/en-US/p/${game.slug || ''}`,
      source: 'Epic Games (Free)',
      categoryId: source.categoryId,
      publishedAt: new Date().toISOString(),
      description: game.description || 'Free on Epic Games Store',
      imageUrl: game.keyImages?.[0]?.url,
      sourceType: source.transformType,
    }))
}

function hfModelsTransform(source: FeedSource) {
  return (data: any[]): FeedItem[] =>
    (data || []).map((model: any) => ({
      id: `hf-model-${model.id || model._id}`,
      title: `New Model: ${model.id || 'Unknown'}`,
      url: `https://huggingface.co/${model.id || ''}`,
      source: 'Hugging Face Models',
      categoryId: source.categoryId,
      publishedAt: model.createdAt || new Date().toISOString(),
      description: `Downloads: ${(model.downloads || 0).toLocaleString()} · Likes: ${(model.likes || 0).toLocaleString()}`,
      author: model.author,
      sourceType: source.transformType,
    }))
}

export const transformRegistry: Record<string, (source: FeedSource) => (data: any) => FeedItem[]> = {
  'rss': rssTransform,
  'youtube-rss': rssTransform,
  'twitter-rss': rssTransform,
  'api-json': jsonTransform,
  'epic-free-games': epicFreeGamesTransform,
  'hf-models': hfModelsTransform,
}

export function getTransform(source: FeedSource): (data: any) => FeedItem[] {
  const factory = transformRegistry[source.transformType]
  if (!factory) return rssTransform(source)
  return factory(source)
}

export function buildFeedSource(stored: StoredSource): FeedSource {
  return { ...stored, transform: getTransform({ ...stored, transform: () => [] }) }
}

export interface BuiltInSourceDef {
  name: string
  categorySlug: string
  type: string
  url: string
  icon?: string
  transformType: string
  jsonMapping?: any
}

export const builtInSources: BuiltInSourceDef[] = [
  // ── GAMING ──
  { name: 'Steam News', categorySlug: 'gaming', icon: '🎮', type: 'rss', transformType: 'rss', url: 'https://store.steampowered.com/feeds/news.xml' },
  { name: 'Epic Free Games', categorySlug: 'gaming', icon: '🆓', type: 'api-json', transformType: 'epic-free-games', url: 'https://epic-free-games.vercel.app/api/games' },
  { name: 'IGN', categorySlug: 'gaming', icon: '🎯', type: 'rss', transformType: 'rss', url: 'https://www.ign.com/rss/v2/articles/feed' },
  { name: 'PC Gamer', categorySlug: 'gaming', icon: '🖥️', type: 'rss', transformType: 'rss', url: 'https://www.pcgamer.com/rss/feed/rss' },
  { name: 'Eurogamer', categorySlug: 'gaming', icon: '🇪🇺', type: 'rss', transformType: 'rss', url: 'https://www.eurogamer.net/feed/news' },
  { name: 'PlayStation', categorySlug: 'gaming', icon: '▶️', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UC-2Y8dQb0S6DtpxNgAKoJKA') },
  { name: 'Xbox', categorySlug: 'gaming', icon: '✖️', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCjBp_7RuDBUYbd1LegWEJ8g') },

  // ── TECH ──
  { name: 'OpenAI Blog', categorySlug: 'tech', icon: '🤖', type: 'rss', transformType: 'rss', url: 'https://openai.com/news/rss.xml' },
  { name: 'Anthropic News', categorySlug: 'tech', icon: '🧠', type: 'rss', transformType: 'rss', url: 'https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml' },
  { name: 'Hugging Face Blog', categorySlug: 'tech', icon: '🤗', type: 'rss', transformType: 'rss', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'HF New Models', categorySlug: 'tech', icon: '🏗️', type: 'api-json', transformType: 'hf-models', url: 'https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20' },
  { name: 'Ars Technica AI', categorySlug: 'tech', icon: '⚙️', type: 'rss', transformType: 'rss', url: 'https://arstechnica.com/ai/feed/' },
  { name: 'TechCrunch', categorySlug: 'tech', icon: '🔬', type: 'rss', transformType: 'rss', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', categorySlug: 'tech', icon: '⚡', type: 'rss', transformType: 'rss', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'SpaceX', categorySlug: 'tech', icon: '🚀', type: 'rss', transformType: 'rss', url: 'https://www.teslarati.com/feed/' },
  { name: 'Spaceflight Now', categorySlug: 'tech', icon: '🛰️', type: 'rss', transformType: 'rss', url: 'https://spaceflightnow.com/feed/' },
  { name: 'NASA', categorySlug: 'tech', icon: '🌌', type: 'rss', transformType: 'rss', url: 'https://www.nasa.gov/feed/' },
  { name: 'Raspberry Pi', categorySlug: 'tech', icon: '🥧', type: 'rss', transformType: 'rss', url: 'https://www.raspberrypi.com/news/feed/' },
  { name: 'Hacker News', categorySlug: 'tech', icon: '⚓', type: 'rss', transformType: 'rss', url: 'https://hnrss.org/frontpage' },
  { name: "Ben's Bites", categorySlug: 'tech', icon: '🥪', type: 'rss', transformType: 'rss', url: 'https://www.bensbites.co/feed' },
  { name: 'The Rundown AI', categorySlug: 'tech', icon: '📬', type: 'rss', transformType: 'rss', url: 'https://www.therundown.ai/feed' },
  { name: 'DeepMind', categorySlug: 'tech', icon: '🔬', type: 'rss', transformType: 'rss', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Linus Tech Tips', categorySlug: 'tech', icon: '🛠️', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCxHKALcAjHZpGCKW-oSr_zg') },
  { name: 'TechLinked', categorySlug: 'tech', icon: '🔗', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCeeFfhMcJa1kjtfZAGskOCA') },
  { name: 't3dotgg', categorySlug: 'tech', icon: '💻', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCbRP3c757lWg9M-U7TyEkXA') },
  { name: 'ThrillSeeker', categorySlug: 'tech', icon: '🥽', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCSbdMXOI_3HGiFviLZO6kNA') },

  // ── POLITICS ──
  { name: 'Fox News Politics', categorySlug: 'politics', icon: '📺', type: 'rss', transformType: 'rss', url: 'https://feeds.foxnews.com/foxnews/politics' },
  { name: 'NYT Politics', categorySlug: 'politics', icon: '📰', type: 'rss', transformType: 'rss', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml' },
  { name: 'Reuters', categorySlug: 'politics', icon: '🌐', type: 'rss', transformType: 'rss', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=politics' },
  { name: 'The Hill', categorySlug: 'politics', icon: '⛰️', type: 'rss', transformType: 'rss', url: 'https://thehill.com/feed/' },
  { name: 'Politico', categorySlug: 'politics', icon: '🏛️', type: 'rss', transformType: 'rss', url: 'https://rss.politico.com/congress.xml' },
  { name: 'RealClearPolitics', categorySlug: 'politics', icon: '📊', type: 'rss', transformType: 'rss', url: 'https://www.realclearpolitics.com/index.xml' },
  { name: 'CNN Politics', categorySlug: 'politics', icon: '📡', type: 'rss', transformType: 'rss', url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss' },
  { name: 'Asmongold', categorySlug: 'politics', icon: '🎭', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCQeRaTukNYft1_6AZPACnog') },
  { name: 'Sam Hyde', categorySlug: 'politics', icon: '🎪', type: 'youtube-rss', transformType: 'youtube-rss', url: youtubeChannel('UCfUaZ8Ra7m7BqUEACv2jySw') },
  { name: 'AF Post', categorySlug: 'politics', icon: '🗽', type: 'twitter-rss', transformType: 'twitter-rss', url: 'https://nitter.net/AFpost/rss' },
  { name: 'Elon Musk', categorySlug: 'politics', icon: '✖️', type: 'rss', transformType: 'rss', url: 'https://nitter.net/elonmusk/rss' },
  { name: 'Elon News', categorySlug: 'politics', icon: '✖️', type: 'rss', transformType: 'rss', url: 'https://nitter.net/elonmusk/rss' },
]
