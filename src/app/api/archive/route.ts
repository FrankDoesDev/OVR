import { NextResponse } from 'next/server'
import { listArchives, loadDigestByPath } from '@/lib/storage'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const file = searchParams.get('file')

  if (file) {
    const digest = loadDigestByPath(file)
    if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
    return NextResponse.json(digest)
  }

  const archives = listArchives()
  const grouped: Record<string, { date: string; hours: { hour: string; path: string }[] }> = {}

  for (const a of archives) {
    if (!grouped[a.date]) grouped[a.date] = { date: a.date, hours: [] }
    grouped[a.date].hours.push({ hour: a.hour, path: a.path })
  }

  return NextResponse.json(Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)))
}
