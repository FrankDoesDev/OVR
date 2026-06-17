import { useState, useEffect } from "react";
import type { Digest, FeedItem } from "../types";
import { getLatestDigest, generateNow } from "../lib/api";
import DigestSection from "./DigestSection";

export default function CategoryView({ slug }: { slug: string }) {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestDigest().then((d) => {
      if (d) {
        setDigest(d);
        setLoading(false);
      } else {
        generateNow()
          .then(setDigest)
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          Loading...
        </p>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          No digest available.
        </p>
      </div>
    );
  }

  const cat = digest.categories.find((c) => c.slug === slug);
  if (!cat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          Category not found.
        </p>
      </div>
    );
  }

  const items: FeedItem[] = digest.sections[slug] || [];

  return (
    <div className="pt-6">
      <DigestSection
        title={cat.name}
        items={items}
        sectionClass={`section-${cat.slug}`}
      />
    </div>
  );
}
