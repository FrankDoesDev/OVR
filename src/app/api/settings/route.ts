import { NextResponse } from 'next/server'
import { loadSettings, saveSettings } from '@/lib/storage'

export async function GET() {
  const settings = loadSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const current = loadSettings()
    const updated = { ...current, ...body }
    saveSettings(updated)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
  }
}
