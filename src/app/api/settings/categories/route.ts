import { NextResponse } from 'next/server'
import { loadSettings, saveSettings } from '@/lib/storage'
import { Category } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const settings = loadSettings()

    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'

    const newCategory: Category = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10),
      name: body.name || 'Untitled',
      slug,
      enabled: body.enabled !== false,
      order: settings.categories.length,
    }

    settings.categories.push(newCategory)
    saveSettings(settings)
    return NextResponse.json(newCategory, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid category data' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const settings = loadSettings()
    const idx = settings.categories.findIndex((c) => c.id === body.id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    settings.categories[idx] = { ...settings.categories[idx], ...body }
    saveSettings(settings)
    return NextResponse.json(settings.categories[idx])
  } catch (err) {
    return NextResponse.json({ error: 'Invalid category data' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Category id required' }, { status: 400 })
    }

    const settings = loadSettings()

    const cat = settings.categories.find((c) => c.id === id)
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    settings.categories = settings.categories.filter((c) => c.id !== id)
    settings.sources = settings.sources.map((s) =>
      s.categoryId === id ? { ...s, categoryId: settings.categories[0]?.id || '' } : s
    )
    saveSettings(settings)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
