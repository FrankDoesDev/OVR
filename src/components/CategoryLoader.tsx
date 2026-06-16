'use client'

import { useState, useEffect } from 'react'
import { getLatestDigest, type Digest, type Category } from '@/lib/tauri'
import DigestSection from '@/components/DigestSection'
import LastUpdated from '@/components/LastUpdated'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function CategoryLoader({ slug, onNavigate }: { slug: string; onNavigate: (v: PageView) => void }) {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [cat, setCat] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestDigest().then((d) => {
      setDigest(d)
      setCat(d?.categories.find((c) => c.slug === slug) || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <p className="text-sm text-[var(--text-tertiary)] text-center py-16">Loading...</p>
      </div>
    )
  }

  if (!digest || !cat) {
    return (
      <div className="animate-fade-in">
        <p className="text-sm text-[var(--text-tertiary)] text-center py-16">No digest available yet.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7]">
          {cat.name}
        </h1>
      </div>

      <div className="mb-6">
        <LastUpdated digest={digest} />
      </div>

      <DigestSection title={cat.name} items={digest.sections[slug] || []} sectionClass={`section-${slug}`} />
    </div>
  )
}
