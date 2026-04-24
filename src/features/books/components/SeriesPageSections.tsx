import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
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

const sectionSurfaceClasses =
  "rounded-[1.5rem] border border-warm-gray/85 bg-parchment/85 shadow-sm ring-1 ring-white/40";
const carouselButtonClasses =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-warm-gray/85 bg-cream/95 text-charcoal shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export function SeriesHeroSection() {
  return (
    <header className={`${sectionSurfaceClasses} px-5 py-6 sm:px-6 sm:py-7`}>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-4xl">
        Series page
      </h1>
    </header>
  );
}

export function SeriesFiltersSection({
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
  );
}

export function FeaturedSeriesSection({ featuredSeries }: { featuredSeries: SeriesGroup[] }) {
  if (featuredSeries.length === 0) return null;

  return (
    <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 rounded-2xl border border-warm-gray/70 bg-cream/90 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Featured Series
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
              Start with the biggest series
            </h2>
          </div>
          <p className="text-sm text-stone-600">
            Quick links for the series with the most books right now.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Featured series jumps">
          {featuredSeries.map((group) => (
            <a
              key={group.key}
              href={`#${group.key}`}
              className="inline-flex min-h-10 items-center rounded-full border border-warm-gray bg-parchment px-4 py-2 text-sm font-semibold text-stone-800 no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {group.name}
              <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                {group.books.length}
              </span>
            </a>
          ))}
        </nav>
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
        <LoadingState
          title="Loading Series"
          description="Arranging series into reading-order lanes."
          variant="shelf"
          cardCount={3}
        />
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
            id={group.key}
            className="scroll-mt-24 rounded-[1.75rem] border border-warm-gray/80 bg-cream/95 p-4 shadow-soft sm:p-5"
            style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}
          >
            <div className="flex flex-col gap-4 border-b border-warm-gray/70 pb-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
