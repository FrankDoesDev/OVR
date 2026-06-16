import { NextResponse } from 'next/server'

function parseOpml(xml: string): { title: string; xmlUrl: string; htmlUrl?: string }[] {
  const feeds: { title: string; xmlUrl: string; htmlUrl?: string }[] = []
  const outlineRe = /<outline[^>]*?\/?>/gi
  let m: RegExpExecArray | null

  while ((m = outlineRe.exec(xml)) !== null) {
    const text = m[1]
    const xmlUrlMatch = text.match(/xmlUrl\s*=\s*["']([^"']+)["']/i)
    if (!xmlUrlMatch) continue

    const titleMatch = text.match(/(?:title|text)\s*=\s*["']([^"']+)["']/i)
    const htmlUrlMatch = text.match(/htmlUrl\s*=\s*["']([^"']+)["']/i)

    feeds.push({
      title: titleMatch?.[1] || 'Untitled',
      xmlUrl: xmlUrlMatch[1],
      htmlUrl: htmlUrlMatch?.[1],
    })
  }

  return feeds
}

export async function POST(request: Request) {
  try {
    const { opmlXml } = await request.json()
    if (!opmlXml) {
      return NextResponse.json({ error: 'OPML XML content required' }, { status: 400 })
    }

    const feeds = parseOpml(opmlXml)
    return NextResponse.json({ success: true, feeds })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
