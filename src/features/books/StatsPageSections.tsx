export type RankedStat = {
  label: string;
  count: number;
  share: number;
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatPages(value: number): string {
  const decimalFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  });
  return `${decimalFormatter.format(value)} pages`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }

  return sortedValues[middle];
}

export function buildRankedStats(
  values: Array<string | null | undefined>,
  total: number,
  limit = 5,
): RankedStat[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }

    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      share: total > 0 ? (count / total) * 100 : 0,
    }));
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="ds-panel-surface bg-gradient-to-br from-cream to-parchment/60 px-4 py-4 shadow-soft">
      <div className="ds-muted-meta text-[0.7rem] uppercase tracking-[0.24em]">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{value}</div>
      {detail ? <div className="ds-subtle-text mt-2 text-sm leading-6">{detail}</div> : null}
    </div>
  );
}

export function InsightCard({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="ds-panel-surface px-4 py-4 shadow-soft">
      <div className="ds-muted-meta text-[0.7rem] uppercase tracking-[0.24em]">{label}</div>
      <div className="mt-2 text-lg font-semibold text-stone-900">{title}</div>
      <p className="ds-subtle-text mt-2 text-sm leading-6">{detail}</p>
    </div>
  );
}

export function RankedList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: RankedStat[];
  emptyText: string;
}) {
  return (
    <div className="ds-panel-surface px-4 py-4 shadow-soft">
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {items.length === 0 ? (
        <p className="ds-muted-meta mt-3 text-sm">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-stone-800">{item.label}</span>
                <span className="ds-muted-meta shrink-0">
                  {formatNumber(item.count)} {item.count === 1 ? "book" : "books"}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-warm-gray-light" aria-hidden="true">
                <div
                  className="h-2 rounded-full bg-sage"
                  style={{ width: `${Math.min(100, Math.max(6, item.share))}%` }}
                />
              </div>
              <div className="ds-muted-meta mt-1 text-xs">{formatPercent(item.share)} of books</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
