'use client'

import { useState, useEffect } from 'react'
import * as tauri from '@/lib/tauri'
import { type ArchiveEntry } from '@/lib/tauri'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function ArchivePageContent({ onNavigate }: { onNavigate: (v: PageView) => void }) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArchiveDates()
  }, [])

  async function loadArchiveDates() {
    setLoading(true)
    try {
      const data = await tauri.listArchives()
      setEntries(data)
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">Loading archive...</p>
      </div>
    )
  }

  // Group by date, take the latest hour per date
  const byDate = new Map<string, ArchiveEntry>()
  for (const e of entries) {
    const existing = byDate.get(e.date)
    if (!existing || e.hour > existing.hour) {
      byDate.set(e.date, e)
    }
  }
  const dates = Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="section-header">
          <div className="section-accent" style={{ background: 'var(--tech)' }} />
          <h2 className="section-title">Archive</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">Browse past digests by date.</p>
      </div>

      {dates.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-12 font-mono">
          No archives yet. Your first digest will appear here.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {dates.map((entry) => {
            const [year, month, day] = entry.date.split('-')
            const display = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            const weekday = display.toLocaleDateString('en-US', { weekday: 'short' })
            const formatted = display.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <button
                key={entry.date}
                onClick={() => onNavigate({ type: 'archive-date', date: entry.date, hour: entry.hour })}
                className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)] transition-all text-left group"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] group-hover:text-[var(--tech)]">
                  {weekday}
                </span>
                <span className="block text-lg font-semibold text-[var(--text-primary)] mt-0.5">{formatted}</span>
                <span className="block text-[10px] text-[var(--text-tertiary)] font-mono mt-1">{year}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
