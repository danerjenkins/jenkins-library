import { DiscoveryLinkCard } from "./ShelfBrowseControls";

interface LibraryDiscoveryPanelProps {
  loading: boolean;
  seriesCount: number;
  genreCount: number;
  noSeriesCount: number;
}

export function LibraryDiscoveryPanel({
  loading,
  seriesCount,
  genreCount,
  noSeriesCount,
}: LibraryDiscoveryPanelProps) {
  return (
    <div
      className="rounded-2xl border border-warm-gray/75 bg-parchment/80 p-3 shadow-sm ring-1 ring-white/35 sm:p-4"
      role="navigation"
      aria-labelledby="library-discovery-heading"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3
            id="library-discovery-heading"
            className="font-display text-xl font-semibold tracking-tight text-pretty text-stone-900"
          >
            Browse Beyond the Shelf
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            Jump into grouped browsing when you want to scan series order or explore the
            collection by genre.
          </p>
        </div>
        <div className="text-xs font-medium text-stone-500" aria-live="polite">
          {loading
            ? "Loading discovery views..."
            : `${seriesCount} series groups • ${genreCount} genres • 2 reader queues`}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-4">
        <DiscoveryLinkCard
          to="/search"
          badge="Global Search"
          badgeClassName="inline-flex w-fit rounded-full border border-sage/20 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-dark"
          title="Search Everything"
          description="Look across Library and Wishlist at once, including ISBNs, authors, genres, and series."
          summary="ISBN-aware results"
          cta="Open Search"
          ctaClassName="text-sage-dark"
        />
        <DiscoveryLinkCard
          to="/series"
          badge="Series View"
          badgeClassName="inline-flex w-fit rounded-full border border-sage/20 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-dark"
          title="Read in Order"
          description="Browse complete series stacks, spot gaps quickly, and keep long-running reads in sequence."
          summary={loading ? "Preparing series..." : `${seriesCount} series groups`}
          cta="Open Series"
          ctaClassName="text-sage-dark"
        />
        <DiscoveryLinkCard
          to="/genres"
          badge="Genre View"
          badgeClassName="inline-flex w-fit rounded-full border border-clay/20 bg-clay/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay"
          title="Explore by Mood"
          description="Move through genre shelves, compare categories, and surface titles that fit the kind of read you want next."
          summary={
            loading ? "Preparing genres..." : `${genreCount} genres • ${noSeriesCount} standalones`
          }
          cta="Open Genres"
          ctaClassName="text-clay"
        />
        <DiscoveryLinkCard
          to="/reading-list"
          badge="Reading List"
          badgeClassName="inline-flex w-fit rounded-full border border-brass/30 bg-brass/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay"
          title="Keep Next Up Small"
          description="Give Dane and Emma separate owned and wishlist queues so the next few reads stay focused."
          summary={loading ? "Preparing reading list..." : "2 reader queues"}
          cta="Open Reading List"
          ctaClassName="text-clay"
        />
      </div>
    </div>
  );
}
