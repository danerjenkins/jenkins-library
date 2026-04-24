import { PageLayout } from "../../ui/components/PageLayout";
import {
  FeaturedSeriesSection,
  SeriesHeroSection,
  SeriesFiltersSection,
  SeriesResultsSection,
} from "./components/SeriesPageSections";
import { useSeriesBrowse } from "./hooks/useSeriesBrowse";

export function SeriesPage() {
  const { state, actions, helpers } = useSeriesBrowse();

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <PageLayout>
        <SeriesHeroSection />
        <FeaturedSeriesSection featuredSeries={state.filteredSeries} />
        <SeriesFiltersSection
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
          onClearFilters={actions.handleClearFilters}
        />
        <SeriesResultsSection
          loading={state.loading}
          groupedSeries={state.groupedSeries}
          filteredSeries={state.filteredSeries}
          standaloneCount={state.standaloneBooks.length}
          cardSize={state.cardSize}
          registerCarousel={actions.registerCarousel}
          onStepCarousel={actions.handleStepCarousel}
          onClearFilters={actions.handleClearFilters}
          getSeriesProgressLabel={helpers.getSeriesProgressLabel}
        />
      </PageLayout>
    </div>
  );
}
