import { useState, useEffect, useCallback } from "react";
import type { Digest, FeedItem } from "../types";
import { getLatestDigest, generateNow } from "../lib/api";
import { stripHtml } from "../lib/utils";
import FeedCard from "./FeedCard";

export default function SearchView() {
  const [query, setQuery] = useState("");
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FeedItem[]>([]);

  useEffect(() => {
    getLatestDigest()
      .then((d) => {
        if (d) {
          setDigest(d);
        } else {
          generateNow().then(setDigest).catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim() || !digest) {
        setResults([]);
        return;
      }
      const lowered = q.toLowerCase();
      const allItems = Object.values(digest.sections).flat();
      const filtered = allItems.filter((item) => {
        return (
          item.title.toLowerCase().includes(lowered) ||
          item.source.toLowerCase().includes(lowered) ||
          (item.description &&
            stripHtml(item.description).toLowerCase().includes(lowered))
        );
      });
      setResults(filtered);
    },
    [digest],
  );

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  return (
    <div className="pt-6">
      <div className="relative mb-8">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Loading digest..." : "Search articles, sources, or topics..."}
          disabled={loading}
          className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)] transition-colors disabled:opacity-50"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[20vh]">
          <p className="text-sm text-[var(--text-tertiary)] font-mono">Loading digest...</p>
        </div>
      )}

      {!loading && query && results.length > 0 && (
        <p className="text-xs text-[var(--text-tertiary)] mb-4 font-mono">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      )}

      {!loading && results.length > 0 ? (
        <div className="section-grid">
          {results.map((item, i) => (
            <FeedCard key={item.id} item={item} index={i} />
          ))}
        </div>
      ) : !loading && query ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : null}
    </div>
  );
}
