import { NextResponse } from 'next/server'
import { loadLatestDigest, loadDigest } from '@/lib/storage'
import { generateDigest } from '@/lib/aggregator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const hour = searchParams.get('hour')

  if (date && hour) {
    const digest = loadDigest(date, hour)
    if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
    return NextResponse.json(digest)
  }

  if (date) {
    const digest = loadDigest(date)
    if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
    return NextResponse.json(digest)
  }

  const latest = loadLatestDigest()
  if (!latest) return NextResponse.json({ error: 'No digest available' }, { status: 404 })
  return NextResponse.json(latest)
}

export async function POST() {
  try {
    const digest = await generateDigest()
    return NextResponse.json({ success: true, date: digest.date, hour: digest.hour })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 })
  }
}
