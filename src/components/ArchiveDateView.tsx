import { useState, useEffect } from "react";
import type { PageView, Digest } from "../types";
import { getDigest } from "../lib/api";
import DigestSection from "./DigestSection";

export default function ArchiveDateView({
  date,
  hour,
  onNavigate,
}: {
  date: string;
  hour: string;
  onNavigate: (v: PageView) => void;
}) {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDigest(date, hour)
      .then((d) => {
        if (d) setDigest(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [date, hour]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          Loading...
        </p>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          Digest not found.
        </p>
        <button
          onClick={() => onNavigate({ type: "archive" })}
          className="mt-4 px-4 py-2 text-sm rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
        >
          Back to archive
        </button>
      </div>
    );
  }

  const displayDate = new Date(date + "T12:00:00");
  const hourLabel = `${hour.padStart(2, "0")}:00`;

  return (
    <div className="pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => onNavigate({ type: "archive" })}
          className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7]">
            {displayDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] font-mono mt-1">
            {hourLabel}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {digest.categories
          .filter((c) => c.enabled)
          .map((cat) => (
            <DigestSection
              key={cat.id}
              title={cat.name}
              items={digest.sections[cat.slug] || []}
              sectionClass={`section-${cat.slug}`}
            />
          ))}
      </div>
    </div>
  );
}
