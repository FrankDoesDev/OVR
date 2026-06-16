'use client'

import { useState, useCallback } from 'react'
import { FeedItem } from '@/types'
import FeedCard from './FeedCard'

export default function SearchBar({ allItems }: { allItems: FeedItem[] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FeedItem[]>([])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const lower = q.toLowerCase()
    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.source.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    )
    setResults(filtered.slice(0, 50))
  }, [allItems])

  return (
    <div className="mb-6">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search headlines, sources, sections..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-5 py-3.5 pl-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)] transition-all"
        />
        <svg className="absolute left-4 top-4 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-secondary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-4 animate-fade-in">
          <p className="text-xs text-[var(--text-tertiary)] mb-4 font-mono tracking-wide">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
          <div className="section-grid">
            {results.map((item, i) => (
              <FeedCard key={item.id} item={item} index={i} />
            ))}
            {results.length === 0 && (
              <div className="col-span-full text-center py-16">
                <p className="text-sm text-[var(--text-tertiary)] font-mono">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
