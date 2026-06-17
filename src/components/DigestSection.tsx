import type { FeedItem } from "../types";
import FeedCard from "./FeedCard";
import TweetCard from "./TweetCard";

function isTweet(item: FeedItem): boolean {
  return item.sourceType === "twitter-rss";
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

  return (
    <div className={`section-wrapper ${sectionClass}`}>
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
