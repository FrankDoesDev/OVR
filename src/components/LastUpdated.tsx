import type { Digest } from "../types";

export default function LastUpdated({
  digest,
  onRefresh,
  refreshing,
}: {
  digest: Digest;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const totalItems = Object.values(digest.sections).reduce(
    (acc, items) => acc + items.length,
    0,
  );

  return (
    <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
      <span className="font-mono">
        {new Date(digest.generatedAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="opacity-30">&middot;</span>
      <span className="font-mono">{totalItems} items</span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all font-mono disabled:opacity-50"
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
  );
}
