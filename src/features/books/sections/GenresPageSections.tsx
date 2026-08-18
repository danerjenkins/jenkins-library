import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { FullBleedPageHero } from "../../../ui/components/PageLayout";
import { BookCard, BookShelfState } from "../components/cards/BookCard";
import { FilterDrawer } from "../components/browse/FilterDrawer";
import {
  ShelfDensitySelector,
  ShelfDisplayToggle,
  ShelfSearchField,
} from "../components/browse/ShelfBrowseControls";
import { CARD_SIZE_OPTIONS, type CardSize } from "../lib/shelfViewPreferences";
import type { GenreShelf } from "../hooks/useGenresBrowse";

const sectionSurfaceClasses = "ds-panel-shell";

export function GenresPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export function GenresHeroSection() {
  return (
    <FullBleedPageHero
      title="Genres"
      subtitle="Shelves arranged by instinct, atmosphere, and the company books keep."
      backgroundImage="/genreshero.png"
    />
  );
}

export function GenresFiltersSection({
  searchQuery,
  ownershipFilter,
  cardSize,
  showGenreTags,
  showRatings,
  isFilterDrawerOpen,
  hasActiveFilters,
  onSearchQueryChange,
  onOwnershipFilterChange,
  onCardSizeChange,
  onShowGenreTagsChange,
  onShowRatingsChange,
  onOpenFilters,
  onCloseFilters,
  onClearFilters,
}: {
  resultsLabel: string;
  searchQuery: string;
  ownershipFilter: "all" | "owned" | "wishlist";
  cardSize: CardSize;
  showGenreTags: boolean;
  showRatings: boolean;
  isFilterDrawerOpen: boolean;
  hasActiveFilters: boolean;
  onSearchQueryChange: (value: string) => void;
  onOwnershipFilterChange: (value: "all" | "owned" | "wishlist") => void;
  onCardSizeChange: (value: CardSize) => void;
  onShowGenreTagsChange: (value: boolean) => void;
  onShowRatingsChange: (value: boolean) => void;
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
          <ShelfDisplayToggle
            id="genres-show-genre-tags"
            label="Show Genre Tags"
            checked={showGenreTags}
            onChange={onShowGenreTagsChange}
          />
          <ShelfDisplayToggle
            id="genres-show-ratings"
            label="Show Ratings"
            checked={showRatings}
            onChange={onShowRatingsChange}
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
  showGenreTags,
  showRatings,
  onClearFilters,
}: {
  loading: boolean;
  genreShelves: GenreShelf[];
  cardSize: CardSize;
  showGenreTags: boolean;
  showRatings: boolean;
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
    <div className="space-y-3">
      {genreShelves.map((shelf) => (
        <section
          key={shelf.sectionId}
          id={shelf.sectionId}
          className="ds-genre-shelf scroll-mt-24"
        >
          <div className="ds-genre-shelf__divider">
            <h2 className="ds-genre-shelf__label">{shelf.genre}</h2>
            <div className="ds-genre-shelf__line" aria-hidden="true" />
          </div>

          <div
            className="ds-horizontal-book-shelf snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-2 pr-4 pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
            data-card-size={cardSize}
            aria-label={`${shelf.genre} books`}
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
                className="ds-horizontal-book-shelf__item"
                data-card-size={cardSize}
                style={{ scrollMarginInline: "1rem" }}
              >
                <BookCard
                  book={book}
                  variant="view"
                  cardSize={cardSize}
                  clickable={true}
                  showGenreTag={showGenreTags}
                  showRatingPill={showRatings}
                  deferRendering={false}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
