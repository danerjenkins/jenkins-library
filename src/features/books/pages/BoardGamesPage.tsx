import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { PageLayout } from "../../../ui/components/PageLayout";
import { Select } from "../../../ui/components/Select";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book } from "../lib/bookTypes";
import { BookCard, BookGrid, BookShelfState } from "../components/cards/BookCard";
import { FilterDrawer } from "../components/browse/FilterDrawer";
import { LibraryHero } from "../components/heroes/LibraryHero";
import { LIBRARY_HERO_QUOTES } from "../lib/libraryHeroQuotes";
import {
  actionLinkClasses,
  filterFieldGridClasses,
  ownershipSegmentOptions,
} from "../components/browse/shelfBrowseControlStyles";
import {
  SegmentedControl,
  ShelfDensitySelector,
  ShelfDisplayToggle,
  ShelfSearchField,
} from "../components/browse/ShelfBrowseControls";
import { useBoardGameShelfBooks } from "../hooks/useShelfBooks";
import {
  getSortedStrings,
  useViewBooksPageState,
  type SortOption,
} from "../hooks/useViewBooksPageState";
import {
  groupBooksByGenre,
  matchesBookSearchQuery,
} from "../hooks/discoveryBrowseShared";
import { CARD_SIZE_OPTIONS } from "../lib/shelfViewPreferences";
import { useLibrary } from "../../libraries/useLibrary";

const boardGameSortOptions = [
  { value: "genre-author", label: "Category then Title" },
  { value: "title", label: "Title (A-Z)" },
  { value: "author", label: "Designer (A-Z)" },
  { value: "updated", label: "Recently Updated" },
] as const;

function sortVisibleBoardGames(boardGames: Book[], sortBy: SortOption) {
  return [...boardGames].sort((a, b) => {
    switch (sortBy) {
      case "genre-author": {
        const categoryCompare = (a.category ?? a.genre ?? "").localeCompare(
          b.category ?? b.genre ?? "",
          undefined,
          { sensitivity: "base" },
        );
        if (categoryCompare !== 0) return categoryCompare;
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      }
      case "author":
        return a.author.localeCompare(b.author, undefined, {
          sensitivity: "base",
        });
      case "updated":
        return b.updatedAt - a.updatedAt;
      case "title":
      case "series":
      default:
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
    }
  });
}

function getBoardGameDetailMeta(boardGame: Book) {
  const playerText =
    boardGame.minPlayers && boardGame.maxPlayers
      ? boardGame.minPlayers === boardGame.maxPlayers
        ? `${boardGame.minPlayers} players`
        : `${boardGame.minPlayers}-${boardGame.maxPlayers} players`
      : null;
  const timeText = boardGame.playTimeMinutes
    ? `${boardGame.playTimeMinutes} min`
    : null;
  return [playerText, timeText].filter(Boolean).join(" - ") || null;
}

export function BoardGamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEdit } = useLibrary();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { books: boardGames, loading } = useBoardGameShelfBooks();
  const { state, updateState, clearFilters, hasActiveFilters } =
    useViewBooksPageState(searchParams, setSearchParams);
  const deferredSearchQuery = useDeferredValue(state.searchQuery);

  const visibleBoardGames = useMemo(() => {
    if (state.ownershipFilter === "all") {
      return boardGames;
    }

    return boardGames.filter(
      (boardGame) =>
        (boardGame.ownershipStatus ?? "owned") === state.ownershipFilter,
    );
  }, [boardGames, state.ownershipFilter]);

  const availableCategories = useMemo(
    () =>
      getSortedStrings(
        visibleBoardGames.map((boardGame) => boardGame.category ?? boardGame.genre),
      ),
    [visibleBoardGames],
  );

  const filteredBoardGames = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visible = visibleBoardGames.filter((boardGame) => {
      if (query && !matchesBookSearchQuery(boardGame, query)) {
        return false;
      }

      if (
        state.filterGenre !== "ALL" &&
        (boardGame.category ?? boardGame.genre) !== state.filterGenre
      ) {
        return false;
      }

      return true;
    });

    return sortVisibleBoardGames(visible, state.sortBy);
  }, [deferredSearchQuery, state.filterGenre, state.sortBy, visibleBoardGames]);

  const ownedCount = useMemo(
    () =>
      boardGames.filter(
        (boardGame) => (boardGame.ownershipStatus ?? "owned") === "owned",
      ).length,
    [boardGames],
  );
  const wishlistCount = useMemo(
    () =>
      boardGames.filter(
        (boardGame) => (boardGame.ownershipStatus ?? "owned") === "wishlist",
      ).length,
    [boardGames],
  );
  const showCategoryShelf =
    state.showGenreShelf && state.sortBy === "genre-author";
  const categoryShelfGroups = useMemo(
    () => (showCategoryShelf ? groupBooksByGenre(filteredBoardGames) : []),
    [filteredBoardGames, showCategoryShelf],
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-transparent">
      <LibraryHero
        title="Board Games"
        quotes={LIBRARY_HERO_QUOTES}
        totalCount={boardGames.length}
        ownedCount={ownedCount}
        wishlistCount={wishlistCount}
        activeOwnershipFilter={state.ownershipFilter}
        onOwnershipFilterSelect={(ownershipFilter) => updateState({ ownershipFilter })}
        totalLabel="Games Tracked"
      >
        <FilterDrawer
          title="Board Game Filters"
          isOpen={isFilterDrawerOpen}
          onOpen={() => setIsFilterDrawerOpen(true)}
          onClose={() => setIsFilterDrawerOpen(false)}
          triggerLabel="Filter Shelf"
          actions={
            <>
              {canEdit ? (
                <Link
                  to={`/board-game/new?ownership=${state.ownershipFilter === "wishlist" ? "wishlist" : "owned"}&returnTo=%2Fboard-games`}
                  className={actionLinkClasses}
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Board Game
                  </span>
                </Link>
              ) : null}
              <ShelfDensitySelector
                options={CARD_SIZE_OPTIONS}
                value={state.cardSize}
                onChange={(cardSize) => updateState({ cardSize })}
              />
              <ShelfDisplayToggle
                id="board-games-show-category-tags"
                label="Show Category Tags"
                checked={state.showGenreTags}
                onChange={(showGenreTags) => updateState({ showGenreTags })}
              />
              <ShelfDisplayToggle
                id="board-games-show-category-shelf"
                label="Show Category Shelf"
                checked={state.showGenreShelf}
                onChange={(showGenreShelf) => updateState({ showGenreShelf })}
              />
              <ShelfDisplayToggle
                id="board-games-show-ratings"
                label="Show Ratings"
                checked={state.showRatings}
                onChange={(showRatings) => updateState({ showRatings })}
              />
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="min-h-11 px-3 text-xs"
                >
                  Clear Filters
                </Button>
              ) : null}
            </>
          }
        >
          <div className={filterFieldGridClasses}>
            <ShelfSearchField
              id="board-games-search"
              name="search"
              label="Search"
              value={state.searchQuery}
              onChange={(searchQuery) => updateState({ searchQuery })}
              className="sm:col-span-2 lg:col-span-2"
            />

            <SegmentedControl
              label="Shelf"
              options={ownershipSegmentOptions}
              value={state.ownershipFilter}
              onChange={(ownershipFilter) => updateState({ ownershipFilter })}
            />

            <Select
              id="filter-category"
              label="Category"
              value={state.filterGenre}
              onChange={(event) =>
                updateState({ filterGenre: event.target.value })
              }
              options={[
                { value: "ALL", label: "All Categories" },
                ...availableCategories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />

            <Select
              id="sort-by"
              label="Sort"
              value={state.sortBy}
              onChange={(event) =>
                updateState({ sortBy: event.target.value as SortOption })
              }
              options={[...boardGameSortOptions]}
            />
          </div>
        </FilterDrawer>
      </LibraryHero>

      <PageLayout>
        <section className="space-y-6">
          {loading ? (
            <LoadingState
              title="Loading Board Games"
              description="Pulling in game boxes, filters, and ratings for the shelf."
              variant="shelf"
              cardCount={8}
            />
          ) : visibleBoardGames.length === 0 ? (
            <BookShelfState
              title={
                state.ownershipFilter === "wishlist"
                  ? "No Wishlist Board Games Yet"
                  : "No Board Games Yet"
              }
              description={
                state.ownershipFilter === "wishlist"
                  ? "Add the first wishlist game to track what should join game night next."
                  : "Start building your board game shelf by adding the first game."
              }
              action={canEdit ? (
                <Link
                  to={
                    state.ownershipFilter === "wishlist"
                      ? "/board-game/new?ownership=wishlist&returnTo=%2Fboard-games"
                      : "/board-game/new?ownership=owned&returnTo=%2Fboard-games"
                  }
                  className={actionLinkClasses}
                >
                  Add Board Game
                </Link>
              ) : undefined}
            />
          ) : filteredBoardGames.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or clear filters to see the full game shelf."
              action={
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              }
            />
          ) : showCategoryShelf ? (
            <div className="space-y-6">
              {categoryShelfGroups.map((group) => (
                <section key={group.genre} className="ds-genre-shelf">
                  <div className="ds-genre-shelf__divider">
                    <h2 className="ds-genre-shelf__label">{group.genre}</h2>
                    <div className="ds-genre-shelf__line" aria-hidden="true" />
                  </div>
                  <BookGrid cardSize={state.cardSize}>
                    {group.books.map((boardGame) => (
                      <BookCard
                        key={boardGame.id}
                        book={boardGame}
                        variant="view"
                        cardSize={state.cardSize}
                        clickable={true}
                        showGenreTag={state.showGenreTags}
                        showRatingPill={state.showRatings}
                        detailMeta={getBoardGameDetailMeta(boardGame)}
                      />
                    ))}
                  </BookGrid>
                </section>
              ))}
            </div>
          ) : (
            <BookGrid cardSize={state.cardSize}>
              {filteredBoardGames.map((boardGame) => (
                <BookCard
                  key={boardGame.id}
                  book={boardGame}
                  variant="view"
                  cardSize={state.cardSize}
                  clickable={true}
                  showGenreTag={state.showGenreTags}
                  showRatingPill={state.showRatings}
                  detailMeta={getBoardGameDetailMeta(boardGame)}
                />
              ))}
            </BookGrid>
          )}
        </section>
      </PageLayout>
    </div>
  );
}
