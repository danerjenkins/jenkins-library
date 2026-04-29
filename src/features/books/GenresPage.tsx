import {
  FeaturedGenresSection,
  GenresFiltersSection,
  GenresHeroSection,
  GenresPageFrame,
  GenresResultsSection,
} from "./components/GenresPageSections";
import { useGenresBrowse } from "./hooks/useGenresBrowse";

export function GenresPage() {
  const { state, refs, actions } = useGenresBrowse();

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <GenresHeroSection />
      <GenresPageFrame>
        <GenresFiltersSection
          resultsLabel={state.resultsLabel}
          searchQuery={state.searchQuery}
          ownershipFilter={state.ownershipFilter}
          cardSize={state.cardSize}
          isFilterDrawerOpen={state.isFilterDrawerOpen}
          hasActiveFilters={state.hasActiveFilters}
          onSearchQueryChange={actions.setSearchQuery}
          onOwnershipFilterChange={actions.setOwnershipFilter}
          onCardSizeChange={actions.setCardSize}
          onOpenFilters={() => actions.setIsFilterDrawerOpen(true)}
          onCloseFilters={() => actions.setIsFilterDrawerOpen(false)}
          onClearFilters={actions.clearFilters}
        />
        <FeaturedGenresSection featuredShelves={state.featuredShelves} />
        <GenresResultsSection
          loading={state.loading}
          genreShelves={state.genreShelves}
          cardSize={state.cardSize}
          carouselRefs={refs.carouselRefs}
          onScrollShelf={actions.scrollShelf}
          onClearFilters={actions.clearFilters}
        />
      </GenresPageFrame>
    </div>
  );
}
