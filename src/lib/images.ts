function resolveUrl(src: string, base?: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (base && src.startsWith('/')) {
    try {
      const url = new URL(base)
      return `${url.protocol}//${url.host}${src}`
    } catch {}
  }
  return src
}

function grab(arr: any): string | undefined {
  if (!arr) return undefined
  const list = Array.isArray(arr) ? arr : [arr]
  for (const entry of list) {
    if (typeof entry === 'string') return entry
    const u = entry?.$?.url ?? entry?.url ?? entry?.href
    if (u) return u
  }
  return undefined
}

function grabGroup(g: any): string | undefined {
  if (!g) return undefined
  let u: string | undefined
  u = grab(g.thumbnail)
  if (u) return u
  u = grab(g['media:thumbnail'])
  if (u) return u
  u = grab(g.content)
  if (u) return u
  u = grab(g['media:content'])
  if (u) return u
  return undefined
}

export function extractRssImage(item: any, rawXml?: string, itemIndex?: number): string | undefined {
  let url: string | undefined

  url = grab(item['media:thumbnail'])
  if (url) return resolveUrl(url, item.link)

  url = grab(item['media:content'])
  if (url) return resolveUrl(url, item.link)

  const group = item['media:group']
  if (group) {
    const g = Array.isArray(group) ? group[0] : group
    url = grabGroup(g)
    if (url) return resolveUrl(url, item.link)
  }

  if (item.enclosure?.url) {
    const type = item.enclosure.type || ''
    if (!type || type.startsWith('image')) return item.enclosure.url
  }

  for (const html of [item.content, item['content:encoded'], item.summary]) {
    if (html) {
      const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (m) return resolveUrl(m[1], item.link)
    }
  }

  if (rawXml && typeof itemIndex === 'number') {
    const parts = rawXml.split(/<(?:item|entry)[>\s]/i).slice(1)
    const entry = parts[itemIndex]
    if (entry) {
      const mediaRe = /<(?:media:thumbnail|media:content)\b[^>]*?(?:url|href)\s*=\s*["']([^"']+)["']/gi
      let m: RegExpExecArray | null
      while ((m = mediaRe.exec(entry)) !== null) {
        const u = m[1]
        if (/\.(?:jpe?g|png|gif|webp|bmp)(?:\?|$)/i.test(u)) return resolveUrl(u, item.link)
      }

      const encRe = /<enclosure\b[^>]*?(?:url|href)\s*=\s*["']([^"']+)["'][^>]*?type\s*=\s*["']image/i
      m = encRe.exec(entry)
      if (m) return resolveUrl(m[1], item.link)

      const srcRe = /src\s*=\s*["']([^"']+\.(?:jpe?g|png|gif|webp|bmp)(?:\?[^"']*)?)["']/gi
      let firstImg: string | undefined
      while ((m = srcRe.exec(entry)) !== null) {
        if (!firstImg) firstImg = m[1]
      }
      if (firstImg) return resolveUrl(firstImg, item.link)
    }
  }

  return undefined
}

export function extractImagesFromXml(xml: string): string[] {
  const urls: string[] = []
  const set = new Set<string>()
  let m: RegExpExecArray | null
  const re = /(?:url|href)\s*=\s*["']([^"']+\.(?:jpe?g|png|gif|webp|bmp)(?:\?[^"']*)?)["']/gi
  while ((m = re.exec(xml)) !== null) {
    const url = resolveUrl(m[1])
    if (url && !set.has(url)) {
      set.add(url)
      urls.push(url)
    }
  }
  return urls
}
