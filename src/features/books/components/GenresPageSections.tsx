import { ArrowLeft, ArrowRight, Library, Sparkles } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { BookCard, BookShelfState } from "./BookCard";
import { FilterDrawer } from "./FilterDrawer";
import { ShelfDensitySelector, ShelfSearchField } from "./ShelfBrowseControls";
import { CARD_SIZE_OPTIONS, type CardSize } from "../shelfViewPreferences";
import type { GenreShelf } from "../hooks/useGenresBrowse";

const sectionSurfaceClasses = "ds-panel-shell";
const pillClasses = "ds-chip";
const carouselButtonClasses = "ds-carousel-button";

export function GenresPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export function GenresHeroSection() {
  return (
    <header className={`${sectionSurfaceClasses} px-5 py-6 sm:px-6 sm:py-7`}>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-4xl">
        Genres page
      </h1>
    </header>
  );
}

export function GenresFiltersSection({
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
    <FilterDrawer
      title="Genre Filters"
      description="Search across titles, authors, genres, and series without pushing the shelves out of view."
      isOpen={isFilterDrawerOpen}
      onOpen={onOpenFilters}
      onClose={onCloseFilters}
      triggerLabel="Filter Genres"
      actions={
        <>
          <ShelfDensitySelector
            options={CARD_SIZE_OPTIONS}
            value={cardSize}
            onChange={onCardSizeChange}
          />
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
          Keep the same shelf density controls here and browse sideways instead
          of vertically.
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
          onEnterPress={onCloseFilters}
          placeholder="Try fantasy, Sanderson, murder mystery, or novella..."
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold leading-4 text-stone-700">
            Ownership
          </span>
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
                  onClick={() =>
                    onOwnershipFilterChange(
                      option.value as "all" | "owned" | "wishlist",
                    )
                  }
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
  );
}

export function FeaturedGenresSection({
  featuredShelves,
}: {
  featuredShelves: GenreShelf[];
}) {
  if (featuredShelves.length === 0) return null;
  return (
    <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
      <div className="ds-panel-surface flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ds-muted-meta text-[11px] font-semibold uppercase tracking-[0.14em]">
              Featured Shelves
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
              Start with the busiest genres
            </h2>
          </div>
          <p className="ds-subtle-text text-sm">
            Quick links for the shelves with the most books right now.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-2"
          aria-label="Featured genre shelf jumps"
        >
          {featuredShelves.map((shelf) => (
            <a
              key={shelf.sectionId}
              href={`#${shelf.sectionId}`}
              className="ds-chip ds-chip--interactive ds-chip--warm-gray-light"
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
  carouselRefs,
  onScrollShelf,
  onClearFilters,
}: {
  loading: boolean;
  genreShelves: GenreShelf[];
  cardSize: CardSize;
  carouselRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onScrollShelf: (sectionId: string, direction: "backward" | "forward") => void;
  onClearFilters: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-5">
        <LoadingState
          title="Loading Genre Carousels"
          description="Pulling the latest books into browseable genre lanes."
          variant="shelf"
          cardCount={4}
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
          <div className="ds-panel-surface rounded-[1.6rem] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="ds-muted-meta text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Genre Lane
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold text-stone-900 text-balance">
                    {shelf.genre}
                  </h2>
                  <span className={`${pillClasses} ds-chip--warm-gray`}>
                    {shelf.books.length}{" "}
                    {shelf.books.length === 1 ? "book" : "books"}
                  </span>
                </div>
                <p className="ds-subtle-text max-w-2xl text-sm leading-6">
                  Swipe or arrow through this lane to compare ownership, scan
                  related reads, and keep series-adjacent picks together.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <span className="ds-chip ds-chip--interactive ds-chip--sage">
                  <Library className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {shelf.ownedCount} in library
                </span>
                <span className="ds-chip ds-chip--interactive ds-chip--brass">
                  <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {shelf.wishlistCount} on wishlist
                </span>
                <div className="ml-auto flex items-center gap-2 md:ml-2">
                  <button
                    type="button"
                    className={`${carouselButtonClasses} min-h-10 min-w-10 touch-manipulation`}
                    onClick={() => onScrollShelf(shelf.sectionId, "backward")}
                    aria-label={`Scroll ${shelf.genre} books backward`}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${carouselButtonClasses} min-h-10 min-w-10 touch-manipulation`}
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
              className="ds-genres-carousel mt-4 snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-2 pr-4 pt-1 touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
              data-card-size={cardSize}
              aria-label={`${shelf.genre} book carousel`}
              role="region"
              aria-roledescription="carousel"
              tabIndex={0}
              style={{
                contentVisibility: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {shelf.books.map((book) => (
                <div
                  key={book.id}
                  className="ds-carousel-card"
                  data-card-size={cardSize}
                  style={{ scrollMarginInline: "1rem" }}
                >
                  <BookCard
                    book={book}
                    variant="view"
                    cardSize={cardSize}
                    clickable={true}
                    deferRendering={false}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
