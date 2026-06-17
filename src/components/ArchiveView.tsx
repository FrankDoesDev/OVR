import { useState, useEffect } from "react";
import type { PageView, ArchiveEntry } from "../types";
import { listArchives } from "../lib/api";

export default function ArchiveView({
  onNavigate,
}: {
  onNavigate: (v: PageView) => void;
}) {
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listArchives()
      .then(setArchives)
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const grouped: Record<string, ArchiveEntry[]> = {};
  for (const a of archives) {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7] mb-6">
        Archive
      </h1>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            No digests have been generated yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sortedDates.map((date) => {
            const hours = grouped[date];
            const displayDate = new Date(date + "T12:00:00");
            const label = displayDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const firstHour = hours.sort((a, b) => b.hour.localeCompare(a.hour))[0];

            return (
              <button
                key={date}
                onClick={() =>
                  onNavigate({
                    type: "archive-date",
                    date,
                    hour: firstHour.hour,
                  })
                }
                className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:translate-y-[-1px] transition-all text-left"
              >
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                  {hours.length} digest{hours.length !== 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
