import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageLayout } from "../../ui/components/PageLayout";
import {
  FeaturedSeriesSection,
  SeriesHeroSection,
  SeriesFiltersSection,
  SeriesResultsSection,
} from "./components/SeriesPageSections";
import { getScrollBehavior } from "./hooks/discoveryBrowseShared";
import { useSeriesBrowse } from "./hooks/useSeriesBrowse";

export function SeriesPage() {
  const { state, actions, helpers } = useSeriesBrowse();
  const location = useLocation();

  useEffect(() => {
    if (state.loading || !location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));
    if (!targetId) {
      return;
    }

    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (!target) {
        return false;
      }

      target.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
      });
      return true;
    };

    if (scrollToTarget()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      scrollToTarget();
    }, 50);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.hash, state.loading, state.filteredParentSeries.length, state.filteredSeries.length]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <PageLayout className="space-y-4 sm:space-y-5">
        <SeriesHeroSection />
        <FeaturedSeriesSection featuredGroups={state.featuredGroups} />
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
          parentSeriesGroups={state.parentSeriesGroups}
          groupedSeries={state.groupedSeries}
          filteredParentSeries={state.filteredParentSeries}
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
