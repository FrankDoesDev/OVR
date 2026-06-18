import type { FeedItem } from "../types";
import { stripHtml, getTimeAgo } from "../lib/utils";

export default function TweetCard({
  item,
  index = 0,
}: {
  item: FeedItem;
  index?: number;
}) {
  const domain = (() => {
    try { return item.url ? new URL(item.url).hostname.replace("www.", "") : ""; }
    catch { return ""; }
  })();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="feed-card stagger-item"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="feed-card-body">
        <div className="flex items-center gap-2 mb-2">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="w-6 h-6 rounded-full bg-[var(--bg-surface)] flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-xs flex-shrink-0">
              {item.icon || ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {item.source}
            </span>
            {item.author && (
              <span className="text-xs text-[var(--text-tertiary)] truncate">
                @{item.author}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
          {stripHtml(item.description || item.title)}
        </p>
        <div className="feed-card-meta">
          <span>{getTimeAgo(item.publishedAt)}</span>
          {domain && (
            <>
              <span className="opacity-30">&middot;</span>
              <span className="truncate max-w-[100px]">{domain}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
