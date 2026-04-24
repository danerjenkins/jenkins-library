import { PageLayout } from "../../ui/components/PageLayout";
import {
  SeriesHeroSection,
  SeriesResultsSection,
  StandaloneSummarySection,
} from "./components/SeriesPageSections";
import { useSeriesBrowse } from "./hooks/useSeriesBrowse";

export function SeriesPage() {
  const { state, actions, helpers } = useSeriesBrowse();

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <PageLayout>
        <SeriesHeroSection
          groupedSeriesCount={state.groupedSeries.length}
          seriesBookCount={state.seriesBookCount}
          standaloneCount={state.standaloneBooks.length}
          searchQuery={state.searchQuery}
          ownershipFilter={state.ownershipFilter}
          cardSize={state.cardSize}
          isFilterDrawerOpen={state.isFilterDrawerOpen}
          hasActiveFilters={state.hasActiveFilters}
          resultsSummary={state.resultsSummary}
          onSearchQueryChange={actions.setSearchQuery}
          onOwnershipFilterChange={actions.setOwnershipFilter}
          onCardSizeChange={actions.setCardSize}
          onOpenFilters={() => actions.setIsFilterDrawerOpen(true)}
          onCloseFilters={() => actions.setIsFilterDrawerOpen(false)}
          onClearFilters={actions.handleClearFilters}
        />
        <StandaloneSummarySection standaloneCount={state.standaloneBooks.length} />
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
