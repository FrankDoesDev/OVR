'use client'

import { useState, useEffect } from 'react'
import { getLatestDigest, type Digest, type Category } from '@/lib/tauri'
import DigestSection from '@/components/DigestSection'
import LastUpdated from '@/components/LastUpdated'
import FeedCard from '@/components/FeedCard'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function HomeLoader({ onNavigate }: { onNavigate: (v: PageView) => void }) {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestDigest().then((d) => {
      setDigest(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">Loading...</p>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7] mb-6">
          OVR
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-8 max-w-md leading-relaxed">
          No digest has been generated yet. The scheduler will produce the first one automatically.
        </p>
      </div>
    )
  }

  const enabledCats = digest.categories.filter((c) => c.enabled)
  const allItems = enabledCats.flatMap((cat) => digest.sections[cat.slug] || [])
  const topItems = allItems.sort((a, b) => {
    const aImg = a.imageUrl ? 1 : 0
    const bImg = b.imageUrl ? 1 : 0
    if (bImg !== aImg) return bImg - aImg
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  }).slice(0, 3)

  const previewCount = 4

  return (
    <>
      <section className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7]">
              Today&rsquo;s Digest
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mt-1 mb-6">
          <LastUpdated digest={digest} />
        </div>

        {topItems.length > 0 && (
          <div className="hero-grid">
            {topItems.map((item, i) => (
              <FeedCard key={item.id} item={item} featured={i === 0} index={i} />
            ))}
          </div>
        )}
      </section>

      <div className="space-y-8">
        {enabledCats.map((cat) => (
          <DigestSection
            key={cat.id}
            title={cat.name}
            items={digest.sections[cat.slug] || []}
            sectionClass={`section-${cat.slug}`}
            limit={previewCount}
            onSeeAll={() => onNavigate({ type: 'category', slug: cat.slug })}
          />
        ))}
      </div>
    </>
  )
}
