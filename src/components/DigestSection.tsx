import type { FeedItem } from "../types";
import FeedCard from "./FeedCard";
import TweetCard from "./TweetCard";

function isTweet(item: FeedItem): boolean {
  return item.sourceType === "twitter-rss";
}

const predefinedAccents: Record<string, { accent: string; dim: string; glow: string }> = {
  gaming: { accent: "#059669", dim: "rgba(5,150,105,0.1)", glow: "rgba(5,150,105,0.18)" },
  tech: { accent: "#0284c7", dim: "rgba(2,132,199,0.1)", glow: "rgba(2,132,199,0.18)" },
  politics: { accent: "#dc2626", dim: "rgba(220,38,38,0.1)", glow: "rgba(220,38,38,0.18)" },
};

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getAccentFromSlug(slug: string): { accent: string; dim: string; glow: string } {
  if (predefinedAccents[slug]) return predefinedAccents[slug];
  const hue = hashSlug(slug) % 360;
  const accent = `hsl(${hue}, 55%, 45%)`;
  const dim = `hsla(${hue}, 55%, 45%, 0.1)`;
  const glow = `hsla(${hue}, 55%, 45%, 0.18)`;
  return { accent, dim, glow };
}

export default function DigestSection({
  title,
  items,
  sectionClass,
  limit,
  onSeeAll,
}: {
  title: string;
  items: FeedItem[];
  sectionClass: string;
  limit?: number;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;

  const displayItems = limit ? items.slice(0, limit) : items;
  const hasTweets = items.some(isTweet);
  const gridClass = hasTweets ? "space-y-3" : "section-grid";

  const slug = sectionClass.replace("section-", "");
  const colors = getAccentFromSlug(slug);

  return (
    <div
      className={`section-wrapper ${sectionClass}`}
      style={{
        "--accent": colors.accent,
        "--accent-dim": colors.dim,
        "--accent-glow": colors.glow,
      } as React.CSSProperties}
    >
      <div className="section-header">
        <div className="section-accent" />
        <h2 className="section-title">{title}</h2>
        <span className="section-count">{items.length} items</span>
      </div>

      <div className={gridClass}>
        {displayItems.map((item, i) =>
          isTweet(item) ? (
            <TweetCard key={item.id} item={item} index={i} />
          ) : (
            <FeedCard key={item.id} item={item} index={i} />
          ),
        )}
      </div>

      {limit && items.length > limit && (
        <div className="mt-5 text-center">
          {onSeeAll && (
            <button onClick={onSeeAll} className="section-link">
              View all {items.length} items &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
