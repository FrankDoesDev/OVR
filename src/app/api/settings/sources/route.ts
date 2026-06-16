import { NextResponse } from 'next/server'
import { loadSettings, saveSettings } from '@/lib/storage'
import { StoredSource } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const settings = loadSettings()

    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const newSource: StoredSource = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10),
      name: body.name || 'Untitled Source',
      categoryId: body.categoryId || settings.categories[0]?.id || '',
      type: body.type || 'rss',
      url: body.url,
      icon: body.icon || '📡',
      enabled: body.enabled !== false,
      transformType: body.transformType || 'rss',
      jsonMapping: body.jsonMapping,
    }

    settings.sources.push(newSource)
    saveSettings(settings)
    return NextResponse.json(newSource, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid source data' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const settings = loadSettings()
    const idx = settings.sources.findIndex((s) => s.id === body.id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    settings.sources[idx] = { ...settings.sources[idx], ...body }
    saveSettings(settings)
    return NextResponse.json(settings.sources[idx])
  } catch (err) {
    return NextResponse.json({ error: 'Invalid source data' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Source id required' }, { status: 400 })
    }

    const settings = loadSettings()
    settings.sources = settings.sources.filter((s) => s.id !== id)
    saveSettings(settings)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
