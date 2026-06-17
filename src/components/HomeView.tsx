import { useState, useEffect, useCallback } from "react";
import type { PageView, Digest } from "../types";
import { getLatestDigest, generateNow } from "../lib/api";
import DigestSection from "./DigestSection";
import FeedCard from "./FeedCard";

export default function HomeView({
  onNavigate,
}: {
  onNavigate: (v: PageView) => void;
}) {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getLatestDigest()
      .then(async (d) => {
        if (d) {
          setDigest(d);
          setLoading(false);
        } else {
          setGenerating(true);
          try {
            const newDigest = await generateNow();
            setDigest(newDigest);
            setErrorMessage(null);
          } catch (e) {
            const msg =
              typeof e === "string"
                ? e
                : e instanceof Error
                  ? e.message
                  : JSON.stringify(e);
            setErrorMessage(msg);
          }
          setGenerating(false);
          setLoading(false);
        }
      })
      .catch((e) => {
        const msg =
          typeof e === "string"
            ? e
            : e instanceof Error
              ? e.message
              : JSON.stringify(e);
        setErrorMessage(msg);
        setLoading(false);
      });
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      const newDigest = await generateNow();
      setDigest(newDigest);
      setErrorMessage(null);
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
            ? e.message
            : JSON.stringify(e);
      setErrorMessage(msg);
    }
    setRefreshing(false);
  }, []);

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          {generating ? "Generating first digest..." : "Loading..."}
        </p>
      </div>
    );
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
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const enabledCats = digest.categories.filter((c) => c.enabled);
  const allItems = enabledCats.flatMap(
    (cat) => digest.sections[cat.slug] || [],
  );
  const articleItems = allItems.filter((i) => i.sourceType !== "twitter-rss");
  const topItems = articleItems
    .sort((a, b) => {
      const aImg = a.imageUrl ? 1 : 0;
      const bImg = b.imageUrl ? 1 : 0;
      if (bImg !== aImg) return bImg - aImg;
      const dateA = new Date(a.publishedAt).getTime() || 0;
      const dateB = new Date(b.publishedAt).getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const previewCount = 4;

  return (
    <>
      <section className="mb-10">
        <div className="text-center mb-4">
          <p className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7]">
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="font-mono">
              {new Date(digest.generatedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="opacity-30">&middot;</span>
            <span className="font-mono">{Object.values(digest.sections).reduce((acc, items) => acc + items.length, 0)} items</span>
            <span className="opacity-30">&middot;</span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all font-mono disabled:opacity-50"
            >
              <svg
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-500 mt-2 font-mono">
              {errorMessage}
            </p>
          )}
        </div>

        {topItems.length > 0 && (
          <div className="hero-grid">
            {topItems.map((item, i) => (
              <FeedCard
                key={item.id}
                item={item}
                featured={i === 0}
                index={i}
              />
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
            onSeeAll={() =>
              onNavigate({ type: "category", slug: cat.slug })
            }
          />
        ))}
      </div>
    </>
  );
}
