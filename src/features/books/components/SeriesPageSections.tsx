import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { PageHero } from "../../../ui/components/PageLayout";
import { Select } from "../../../ui/components/Select";
import { BookCard, BookShelfState } from "./BookCard";
import { FilterDrawer } from "./FilterDrawer";
import {
  actionLinkClasses,
  filterFieldGridClasses,
  ShelfDensitySelector,
  ShelfSearchField,
} from "./ShelfBrowseControls";
import { CARD_SIZE_OPTIONS, type CardSize } from "../shelfViewPreferences";
import { getSeriesCarouselCardWidthClass } from "../hooks/discoveryBrowseShared";
import type { SeriesGroup } from "../hooks/useSeriesBrowse";

const carouselButtonClasses =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-warm-gray/85 bg-cream/95 text-charcoal shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export function SeriesHeroSection({
  groupedSeriesCount,
  seriesBookCount,
  standaloneCount,
  searchQuery,
  ownershipFilter,
  cardSize,
  isFilterDrawerOpen,
  hasActiveFilters,
  onSearchQueryChange,
  onOwnershipFilterChange,
  onCardSizeChange,
  onOpenFilters,
  onCloseFilters,
  onClearFilters,
}: {
  groupedSeriesCount: number;
  seriesBookCount: number;
  standaloneCount: number;
  searchQuery: string;
  ownershipFilter: "all" | "owned" | "wishlist";
  cardSize: CardSize;
  isFilterDrawerOpen: boolean;
  hasActiveFilters: boolean;
  onSearchQueryChange: (value: string) => void;
  onOwnershipFilterChange: (value: "all" | "owned" | "wishlist") => void;
  onCardSizeChange: (value: CardSize) => void;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
  onClearFilters: () => void;
}) {
  return (
    <PageHero
      title="Series Browser"
      description={
        <>
          <div className="inline-flex items-center gap-2 rounded-full border border-warm-gray/80 bg-parchment/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
            <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
            Search And Discovery
          </div>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-stone-600">
            Browse the catalog by series, keep the reading order visible, and jump straight into
            each book from a grouped shelf view.
          </p>
        </>
      }
      actions={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Series", value: groupedSeriesCount },
            { label: "In Series", value: seriesBookCount },
            { label: "Standalone", value: standaloneCount, className: "col-span-2 sm:col-span-1" },
          ].map((item) => (
            <div
              key={item.label}
              className={`${item.className ?? ""} rounded-xl border border-warm-gray/75 bg-parchment/85 px-4 py-3`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                {item.label}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold text-stone-900">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      }
    >
      <FilterDrawer
        title="Series Filters"
        description="Search by series, title, author, or genre and keep density adjustable for longer reading-order scans."
        isOpen={isFilterDrawerOpen}
        onOpen={onOpenFilters}
        onClose={onCloseFilters}
        triggerLabel="Filter Series"
        actions={
          <>
            <ShelfDensitySelector options={CARD_SIZE_OPTIONS} value={cardSize} onChange={onCardSizeChange} />
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onClearFilters}
                className="min-h-11 px-3 text-xs"
              >
                Clear Filters
              </Button>
            ) : null}
          </>
        }
        footer={
          <div className="text-sm text-stone-600">
            Books without a series stay out of the grouped shelf and are summarized separately.
          </div>
        }
      >
        <div className={filterFieldGridClasses}>
          <ShelfSearchField
            id="series-search"
            name="series-search"
            label="Search"
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Series, title, author, or genre..."
          />
          <Select
            id="series-ownership"
            label="Shelf"
            value={ownershipFilter}
            onChange={(event) => onOwnershipFilterChange(event.target.value as "all" | "owned" | "wishlist")}
            options={[
              { value: "all", label: "Owned + Wishlist" },
              { value: "owned", label: "Owned Only" },
              { value: "wishlist", label: "Wishlist Only" },
            ]}
          />
        </div>
      </FilterDrawer>
    </PageHero>
  );
}

export function StandaloneSummarySection({ standaloneCount }: { standaloneCount: number }) {
  if (standaloneCount === 0) return null;
  return (
    <section className="rounded-2xl border border-warm-gray/80 bg-parchment/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-display text-xl font-semibold text-stone-900">Standalone Summary</h3>
          <p className="text-sm leading-relaxed text-stone-600">
            {standaloneCount} {standaloneCount === 1 ? "book is" : "books are"} not attached to a
            series and therefore excluded from the grouped results.
          </p>
        </div>
        <Link to="/view?series=NONE" className={actionLinkClasses}>
          View Standalones
        </Link>
      </div>
    </section>
  );
}

export function SeriesResultsSection({
  loading,
  groupedSeries,
  filteredSeries,
  standaloneCount,
  cardSize,
  registerCarousel,
  onStepCarousel,
  onClearFilters,
  getSeriesProgressLabel,
}: {
  loading: boolean;
  groupedSeries: SeriesGroup[];
  filteredSeries: SeriesGroup[];
  standaloneCount: number;
  cardSize: CardSize;
  registerCarousel: (key: string, node: HTMLDivElement | null) => void;
  onStepCarousel: (key: string, direction: "backward" | "forward") => void;
  onClearFilters: () => void;
  getSeriesProgressLabel: (books: SeriesGroup["books"]) => string;
}) {
  return (
    <section className="space-y-4">
      {loading ? (
        <div aria-live="polite" aria-label="Loading series">
          <div className="sr-only">Loading series...</div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <section
                key={index}
                className="rounded-[1.75rem] border border-warm-gray/80 bg-cream/95 p-4 shadow-soft sm:p-5"
              />
            ))}
          </div>
        </div>
      ) : groupedSeries.length === 0 ? (
        <BookShelfState
          title="No Series Yet"
          description={
            standaloneCount > 0
              ? `${standaloneCount} standalone ${standaloneCount === 1 ? "book is" : "books are"} already in the catalog, but nothing is grouped into a series yet.`
              : "Assign books to a series in Manage to start browsing by reading order."
          }
          action={
            <Link to="/admin" className={actionLinkClasses}>
              Open Manage
            </Link>
          }
        />
      ) : filteredSeries.length === 0 ? (
        <BookShelfState
          title="No Matching Series"
          description="Try a different search or clear the shelf filter to return to the full series list."
          action={
            <Button variant="secondary" onClick={onClearFilters} className="text-xs">
              Clear Filters
            </Button>
          }
        />
      ) : (
        filteredSeries.map((group) => (
          <section
            key={group.key}
            className="rounded-[1.75rem] border border-warm-gray/80 bg-cream/95 p-4 shadow-soft sm:p-5"
            style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}
          >
            <div className="flex flex-col gap-4 border-b border-warm-gray/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="inline-flex items-center rounded-full border border-warm-gray/70 bg-parchment/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Reading Order Carousel
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-2xl font-semibold text-pretty text-stone-900 sm:text-[2rem]">
                    {group.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-600">
                    {getSeriesProgressLabel(group.books)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-stone-600">
                  <span className="rounded-full border border-warm-gray/75 bg-parchment/80 px-3 py-1">
                    {group.books.length} {group.books.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={carouselButtonClasses}
                    onClick={() => onStepCarousel(group.key, "backward")}
                    aria-label={`Scroll ${group.name} backward`}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={carouselButtonClasses}
                    onClick={() => onStepCarousel(group.key, "forward")}
                    aria-label={`Scroll ${group.name} forward`}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={(node) => registerCarousel(group.key, node)}
              className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible px-1 pb-3 pr-4 pt-2 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label={`${group.name} books`}
              role="region"
              aria-roledescription="carousel"
              tabIndex={0}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {group.books.map((book, index) => (
                <div
                  key={book.id}
                  className={`${getSeriesCarouselCardWidthClass(cardSize)} min-w-0 shrink-0 snap-start`}
                  style={{ scrollMarginInline: "1rem" }}
                >
                  <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    <span>{book.seriesLabel?.trim() || `Book ${index + 1}`}</span>
                  </div>
                  <BookCard book={book} variant="view" cardSize={cardSize} clickable={true} />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
