'use client'

import { useState, useEffect } from 'react'
import { getLatestDigest, generateNow, type Digest, type Category } from '@/lib/tauri'
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
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    getLatestDigest().then(async (d) => {
      if (d) {
        setDigest(d)
        setLoading(false)
      } else {
        setGenerating(true)
        try {
          const newDigest = await generateNow()
          setDigest(newDigest)
        } catch (e) {
          const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e)
          console.error('[Home] Failed to generate digest:', msg)
          setErrorMessage(msg)
        }
        setGenerating(false)
        setLoading(false)
      }
    }).catch((e) => {
      const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e)
      console.error('[Home] Failed to load digest:', msg)
      setErrorMessage(msg)
      setLoading(false)
    })
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    setErrorMessage(null)
    try {
      const newDigest = await generateNow()
      setDigest(newDigest)
    } catch (e) {
      const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e)
      console.error('[Home] Refresh failed:', msg)
      setErrorMessage(msg)
    }
    setRefreshing(false)
  }

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          {generating ? 'Generating first digest...' : 'Loading...'}
        </p>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7] mb-6">
          OVR
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-2 max-w-md leading-relaxed">
          Failed to generate digest.
        </p>
        {errorMessage && (
          <p className="text-xs text-red-500 mb-6 max-w-md font-mono leading-relaxed">
            {errorMessage}
          </p>
        )}
        <button
          onClick={() => { setErrorMessage(null); setLoading(true); window.location.reload() }}
          className="px-4 py-2 text-sm rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  const enabledCats = digest.categories.filter((c) => c.enabled)
  const allItems = enabledCats.flatMap((cat) => digest.sections[cat.slug] || [])
  const articleItems = allItems.filter((i) => i.sourceType !== 'twitter-rss')
  const topItems = articleItems.sort((a, b) => {
    const aImg = a.imageUrl ? 1 : 0
    const bImg = b.imageUrl ? 1 : 0
    if (bImg !== aImg) return bImg - aImg
    const dateA = new Date(a.publishedAt).getTime() || 0
    const dateB = new Date(b.publishedAt).getTime() || 0
    return dateB - dateA
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
          <LastUpdated digest={digest} onRefresh={handleManualRefresh} refreshing={refreshing} />
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
