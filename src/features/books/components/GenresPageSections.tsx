import { ArrowLeft, ArrowRight, Compass, Library, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { BookCard, BookShelfState } from "./BookCard";
import { FilterDrawer } from "./FilterDrawer";
import { ShelfDensitySelector, ShelfSearchField } from "./ShelfBrowseControls";
import { CARD_SIZE_OPTIONS, type CardSize } from "../shelfViewPreferences";
import type { GenreShelf } from "../hooks/useGenresBrowse";
import { getGenreCarouselCardWidthClass } from "../hooks/discoveryBrowseShared";

const sectionSurfaceClasses =
  "rounded-[1.5rem] border border-warm-gray/85 bg-parchment/85 shadow-sm ring-1 ring-white/40";
const pillClasses =
  "inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]";
const carouselButtonClasses =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-warm-gray/80 bg-parchment text-stone-700 shadow-sm transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-px hover:border-sage-light hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";

export function GenresPageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">{children}</div>;
}

export function GenresHeroSection({
  loading,
  resultsLabel,
  shelfCount,
  ownedCount,
  wishlistCount,
}: {
  loading: boolean;
  resultsLabel: string;
  shelfCount: number;
  ownedCount: number;
  wishlistCount: number;
}) {
  return (
    <header className={`${sectionSurfaceClasses} overflow-hidden`}>
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,138,69,0.18),_transparent_36%),radial-gradient(circle_at_78%_22%,_rgba(111,132,99,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.3),_rgba(255,255,255,0))]"
          aria-hidden="true"
        />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.95fr)] lg:items-stretch">
          <div className="rounded-[1.9rem] border border-white/60 bg-cream/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-6">
            <span className={`${pillClasses} border-brass/40 bg-brass/10 text-brass shadow-sm`}>
              <Compass className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Browse by Genre
            </span>
            <div className="mt-4 max-w-3xl space-y-3">
              <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[0.95] tracking-[-0.03em] text-stone-900 sm:text-5xl">
                Genre shelves for quick discovery
              </h1>
              <p className="max-w-2xl text-base leading-8 text-stone-700">
                Scan the collection by mood, lane, and reading intent without replacing the main library view.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span className="inline-flex min-h-10 items-center rounded-full border border-warm-gray/80 bg-parchment/85 px-4 font-semibold text-stone-800 shadow-sm">
                {resultsLabel}
              </span>
              <span className="max-w-xl">Jump into the busiest genres first, then refine the shelves below.</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Total Shelves", value: loading ? "..." : String(shelfCount), tone: "" },
              { label: "Library", value: loading ? "..." : String(ownedCount), tone: "border-sage/20 bg-[linear-gradient(180deg,rgba(111,132,99,0.12),rgba(111,132,99,0.04))]" },
              { label: "Wishlist", value: loading ? "..." : String(wishlistCount), tone: "border-brass/30 bg-[linear-gradient(180deg,rgba(184,138,69,0.12),rgba(184,138,69,0.04))]" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-[1.6rem] border border-warm-gray/75 bg-cream/92 px-4 py-4 shadow-sm ${item.tone}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {item.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="font-display text-4xl font-semibold leading-none text-stone-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export function GenresFiltersSection({
  resultsLabel,
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
  resultsLabel: string;
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
    <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 rounded-2xl border border-warm-gray/70 bg-cream/90 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Search And Filter
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
              Narrow the shelves
            </h2>
            <p className="mt-1 text-sm text-stone-600">{resultsLabel}</p>
          </div>
          <Link
            to="/view"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-warm-gray bg-parchment px-3.5 py-2 text-sm font-semibold text-stone-800 no-underline shadow-sm transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Back to Library
          </Link>
        </div>

        <FilterDrawer
          title="Genre Filters"
          description="Search across titles, authors, genres, and series without pushing the shelves out of view."
          summary={resultsLabel}
          isOpen={isFilterDrawerOpen}
          onOpen={onOpenFilters}
          onClose={onCloseFilters}
          triggerLabel="Filter Genres"
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
              Keep the same shelf density controls here and browse sideways instead of vertically.
            </div>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <ShelfSearchField
              id="genres-search"
              name="genres-search"
              label="Search titles, authors, genres, or series"
              value={searchQuery}
              onChange={onSearchQueryChange}
              placeholder="Try fantasy, Sanderson, murder mystery, or novella..."
            />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold leading-4 text-stone-700">Ownership</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { value: "all", label: "All Books" },
                  { value: "owned", label: "Library Only" },
                  { value: "wishlist", label: "Wishlist Only" },
                ].map((option) => {
                  const isActive = ownershipFilter === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isActive ? "primary" : "secondary"}
                      onClick={() => onOwnershipFilterChange(option.value as "all" | "owned" | "wishlist")}
                      className="w-full"
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </FilterDrawer>
      </div>
    </section>
  );
}

export function FeaturedGenresSection({ featuredShelves }: { featuredShelves: GenreShelf[] }) {
  if (featuredShelves.length === 0) return null;
  return (
    <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 rounded-2xl border border-warm-gray/70 bg-cream/90 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Featured Shelves
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
              Start with the busiest genres
            </h2>
          </div>
          <p className="text-sm text-stone-600">
            Quick links for the shelves with the most books right now.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Featured genre shelf jumps">
          {featuredShelves.map((shelf) => (
            <a
              key={shelf.sectionId}
              href={`#${shelf.sectionId}`}
              className="inline-flex min-h-10 items-center rounded-full border border-warm-gray bg-parchment px-4 py-2 text-sm font-semibold text-stone-800 no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {shelf.genre}
              <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                {shelf.books.length}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function GenresResultsSection({
  loading,
  genreShelves,
  cardSize,
  shelfCardHeights,
  carouselRefs,
  onScrollShelf,
  onClearFilters,
}: {
  loading: boolean;
  genreShelves: GenreShelf[];
  cardSize: CardSize;
  shelfCardHeights: Record<string, number>;
  carouselRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onScrollShelf: (sectionId: string, direction: "backward" | "forward") => void;
  onClearFilters: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-5" role="status" aria-live="polite" aria-label="Loading genre carousels">
        <BookShelfState
          title="Loading genre carousels"
          description="Pulling the latest books into browseable genre lanes."
        />
      </div>
    );
  }

  if (genreShelves.length === 0) {
    return (
      <BookShelfState
        title="No shelves match this view"
        description="Try widening the search or switching the ownership filter."
        action={
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Reset filters
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {genreShelves.map((shelf) => (
        <section
          key={shelf.sectionId}
          id={shelf.sectionId}
          className={`${sectionSurfaceClasses} scroll-mt-24 p-4 sm:p-5`}
        >
          <div className="rounded-[1.6rem] border border-warm-gray/70 bg-cream/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Genre Lane
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold text-stone-900 text-balance">
                    {shelf.genre}
                  </h2>
                  <span className={`${pillClasses} border-warm-gray bg-parchment text-stone-600`}>
                    {shelf.books.length} {shelf.books.length === 1 ? "book" : "books"}
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  Swipe or arrow through this lane to compare ownership, scan related reads, and keep series-adjacent picks together.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <span className="inline-flex min-h-9 items-center rounded-full border border-sage/25 bg-sage/10 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
                  <Library className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {shelf.ownedCount} in library
                </span>
                <span className="inline-flex min-h-9 items-center rounded-full border border-brass/30 bg-brass/10 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-clay">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {shelf.wishlistCount} on wishlist
                </span>
                <div className="ml-auto flex items-center gap-2 md:ml-2">
                  <button
                    type="button"
                    className={`${carouselButtonClasses} touch-manipulation`}
                    onClick={() => onScrollShelf(shelf.sectionId, "backward")}
                    aria-label={`Scroll ${shelf.genre} books backward`}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${carouselButtonClasses} touch-manipulation`}
                    onClick={() => onScrollShelf(shelf.sectionId, "forward")}
                    aria-label={`Scroll ${shelf.genre} books forward`}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={(node) => {
                carouselRefs.current[shelf.sectionId] = node;
              }}
              className="mt-4 flex items-start snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-2 pr-4 pt-1 touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
              aria-label={`${shelf.genre} book carousel`}
              role="region"
              aria-roledescription="carousel"
              tabIndex={0}
              style={{ contentVisibility: "auto", containIntrinsicSize: "420px", WebkitOverflowScrolling: "touch" }}
            >
              {shelf.books.map((book) => (
                <div
                  key={book.id}
                  className={`${getGenreCarouselCardWidthClass(cardSize)} flex min-w-0 shrink-0 snap-start`}
                  data-genre-card-item
                  style={{
                    height: shelfCardHeights[shelf.sectionId]
                      ? `${shelfCardHeights[shelf.sectionId]}px`
                      : undefined,
                    scrollMarginInline: "1rem",
                  }}
                >
                  <BookCard book={book} variant="view" cardSize={cardSize} clickable={true} deferRendering={false} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
