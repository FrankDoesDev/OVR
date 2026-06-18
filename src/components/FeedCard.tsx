import { useState } from "react";
import type { FeedItem } from "../types";
import { stripHtml, getTimeAgo } from "../lib/utils";

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match
    ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
    : null;
}

export default function FeedCard({
  item,
  featured = false,
  index = 0,
}: {
  item: FeedItem;
  featured?: boolean;
  index?: number;
}) {
  const ytThumb = getYouTubeThumbnail(item.url);
  const thumbnail = ytThumb || item.imageUrl;
  const isYouTube =
    item.url.includes("youtube.com") || item.url.includes("youtu.be");
  const domain = (() => {
    try { return item.url ? new URL(item.url).hostname.replace("www.", "") : ""; }
    catch { return ""; }
  })();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`feed-card stagger-item ${featured ? "featured" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {thumbnail && !imgFailed ? (
        <div className="feed-card-media">
          <img
            src={thumbnail}
            alt=""
            className="feed-card-img"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
          <span className="feed-card-badge">
            {isYouTube ? "YouTube" : item.source}
          </span>
        </div>
      ) : item.icon ? (
        <div className="feed-card-icon">
          <span className="feed-card-icon-emoji">{item.icon}</span>
          <span className="feed-card-badge">{item.source}</span>
        </div>
      ) : (
        <div className="feed-card-placeholder">
          <span className="feed-card-badge">{item.source}</span>
        </div>
      )}

      <div className="feed-card-body">
        <h3 className="feed-card-title">{item.title}</h3>
        {item.description && (
          <p className="feed-card-desc">{stripHtml(item.description)}</p>
        )}
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
