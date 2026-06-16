'use client'

import { useState, useEffect } from 'react'
import { getLatestDigest, type Digest } from '@/lib/tauri'
import SearchBar from '@/components/SearchBar'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function SearchPageContent({ onNavigate }: { onNavigate: (v: PageView) => void }) {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestDigest().then((d) => {
      setDigest(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const allItems = digest
    ? digest.categories.flatMap((cat) => digest.sections[cat.slug] || [])
    : []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="section-header">
          <div className="section-accent" />
          <h2 className="section-title">Search</h2>
          <span className="section-count">
            {allItems.length} items indexed
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-16">Loading...</p>
      ) : (
        <SearchBar allItems={allItems} />
      )}
    </div>
  )
}
