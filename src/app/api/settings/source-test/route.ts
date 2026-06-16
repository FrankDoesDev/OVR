import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0' },
  customFields: { item: ['media:content', 'media:thumbnail'] },
})

export async function POST(request: Request) {
  try {
    const { url, type } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    if (type === 'api-json') {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const sample = Array.isArray(data) ? data.slice(0, 3) : [data]
      return NextResponse.json({
        success: true,
        type: 'api-json',
        items: sample.map((item: any, i: number) => ({
          index: i,
          title: item.title || '(no title)',
          url: item.url || item.link || item.html_url || '(no url)',
          preview: JSON.stringify(item).slice(0, 300),
        })),
        topKeys: Object.keys(Array.isArray(data) ? data[0] || {} : data).slice(0, 20),
      })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'OVERSEER-daily-digest/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const feed = await parser.parseString(xml)
    const items = (feed.items || []).slice(0, 3)

    return NextResponse.json({
      success: true,
      type: 'rss',
      title: feed.title || '(no title)',
      items: items.map((item, i) => ({
        index: i,
        title: item.title || '(no title)',
        url: item.link || '(no url)',
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
