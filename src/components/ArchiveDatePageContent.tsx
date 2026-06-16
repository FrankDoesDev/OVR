'use client'

import { useState, useEffect } from 'react'
import * as tauri from '@/lib/tauri'
import { type Digest } from '@/lib/tauri'
import FeedCard from '@/components/FeedCard'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function ArchiveDatePageContent({
  date,
  hour,
  onNavigate,
}: {
  date: string
  hour: string
  onNavigate: (v: PageView) => void
}) {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDigest()
  }, [date, hour])

  async function loadDigest() {
    setLoading(true)
    try {
      const d = await tauri.getDigest(date, hour)
      setDigest(d)
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">Loading digest...</p>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => onNavigate({ type: 'archive' })}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 transition-colors font-mono"
        >
          &larr; Archive
        </button>
        <p className="text-sm text-[var(--text-tertiary)] text-center py-12 font-mono">
          Digest not found for {date} hour {hour}.
        </p>
      </div>
    )
  }

  const [year, month, day] = date.split('-')
  const display = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const formatted = display.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const totalItems = Object.values(digest.sections).reduce((sum, items) => sum + items.length, 0)

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => onNavigate({ type: 'archive' })}
        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 transition-colors font-mono"
      >
        &larr; Archive
      </button>

      <div className="mb-8">
        <div className="section-header">
          <div className="section-accent" style={{ background: 'var(--tech)' }} />
          <h2 className="section-title">{formatted}</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-tertiary)] font-mono">
          Hour {digest.hour} &middot; {totalItems} items
        </p>
      </div>

      <div className="space-y-10">
        {digest.categories.map((cat) => {
          const section = digest.sections[cat.slug]
          if (!section || section.length === 0) return null

          return (
            <div key={cat.slug}>
              <div className="section-header mb-4">
                <div className="section-accent" style={{ background: 'var(--text-primary)' }} />
                <h2 className="section-title">{cat.name}</h2>
                <span className="text-[var(--text-tertiary)] text-sm font-mono ml-3">{section.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.map((item, i) => (
                  <FeedCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
