'use client'

import { Digest } from '@/types'

export default function LastUpdated({ digest }: { digest: Digest | null }) {
  if (!digest) return null

  const time = new Date(digest.generatedAt)
  const timeStr = time.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const runLabel = digest.hour === '00' ? 'Midnight'
    : digest.hour === '06' ? '6 AM'
    : digest.hour === '12' ? 'Noon'
    : '6 PM'

  const totalItems =
    digest.sections.gaming.length +
    digest.sections.tech.length +
    digest.sections.politics.length

  const handleRefresh = async () => {
    try {
      await fetch('/api/digest', { method: 'POST' })
      window.location.reload()
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pb-4 border-b border-[var(--border-primary)]">
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--gaming)]" />
        <span>{timeStr} &mdash; {runLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[var(--text-tertiary)]">{totalItems} items</span>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] border border-[var(--border-primary)] rounded-md hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
