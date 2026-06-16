'use client'

import { FeedItem } from '@/types'
import FeedCard from './FeedCard'

export default function DigestSection({
  title,
  items,
  sectionClass,
  limit,
  link,
  onSeeAll,
}: {
  title: string
  items: FeedItem[]
  sectionClass: string
  limit?: number
  link?: string
  onSeeAll?: () => void
}) {
  if (items.length === 0) return null

  const displayItems = limit ? items.slice(0, limit) : items

  return (
    <div className={`section-wrapper ${sectionClass}`}>
      <div className="section-header">
        <div className="section-accent" />
        <h2 className="section-title">{title}</h2>
        <span className="section-count">{items.length} items</span>
      </div>

      <div className="section-grid">
        {displayItems.map((item, i) => (
          <FeedCard key={item.id} item={item} index={i} />
        ))}
      </div>

      {limit && items.length > limit && (
        <div className="mt-5 text-center">
          {onSeeAll ? (
            <button onClick={onSeeAll} className="section-link">
              View all {items.length} items &rarr;
            </button>
          ) : link ? (
            <a href={link} className="section-link">
              View all {items.length} items &rarr;
            </a>
          ) : null}
        </div>
      )}
    </div>
  )
}
