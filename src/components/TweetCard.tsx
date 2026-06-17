'use client'

import { useState } from 'react'
import { FeedItem } from '@/types'

const AVATAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899']

function hashStr(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  if (isNaN(date)) return ''
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function truncateTweet(text: string, max = 280): { display: string; truncated: boolean } {
  const cleaned = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
  if (cleaned.length <= max) return { display: cleaned, truncated: false }
  return { display: cleaned.slice(0, max).trimEnd() + '...', truncated: true }
}

export default function TweetCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const color = AVATAR_COLORS[hashStr(item.author || item.source) % AVATAR_COLORS.length]
  const initials = getInitials(item.author || item.source)
  const { display, truncated } = truncateTweet(item.description || item.title)
  const domain = item.url ? new URL(item.url).hostname.replace('www.', '') : ''
  const [expanded, setExpanded] = useState(false)

  const tweetText = expanded ? (item.description || item.title).replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim() : display

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block stagger-item"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-all">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {item.author || 'Unknown'}
            </span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span className="text-[var(--text-tertiary)] whitespace-nowrap">{getTimeAgo(item.publishedAt)}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
            {tweetText}
            {truncated && !expanded && (
              <button
                onClick={(e) => { e.preventDefault(); setExpanded(true) }}
                className="ml-1 text-xs text-[var(--tech)] hover:underline whitespace-nowrap"
              >
                read more
              </button>
            )}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-tertiary)]">
            <span className="truncate">{domain}</span>
            <span className="opacity-30">·</span>
            <span className="uppercase">{item.source}</span>
          </div>
        </div>
      </div>
    </a>
  )
}