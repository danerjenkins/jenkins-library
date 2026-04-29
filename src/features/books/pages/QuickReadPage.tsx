import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookMarked, Check } from "lucide-react";
import { updateBook } from "../../../data/bookRepo";
import { Button } from "../../../ui/components/Button";
import { FullBleedPageHero, PageLayout } from "../../../ui/components/PageLayout";
import { Select } from "../../../ui/components/Select";
import { LoadingState } from "../../../ui/components/LoadingState";
import { BOOK_FORMAT_LABELS, getReadStatus, type Book } from "../lib/bookTypes";
import type { ReaderId } from "../lib/readingListPreferences";
import { BookCard, BookGrid, BookShelfState } from "../components/cards/BookCard";
import { FilterDrawer } from "../components/browse/FilterDrawer";
import {
  actionLinkClasses,
  filterFieldGridClasses,
  ownershipSegmentOptions,
} from "../components/browse/shelfBrowseControlStyles";
import {
  SegmentedControl,
  ShelfDensitySelector,
  ShelfSearchField,
} from "../components/browse/ShelfBrowseControls";
import { useMergedShelfBooks } from "../hooks/useShelfBooks";
import {
  getSortedFormats,
  getSortedStrings,
  readStatusByFilter,
  readFilterOptions,
  sortOptions,
  useViewBooksPageState,
  type OwnershipFilter,
  type SortOption,
} from "../hooks/useViewBooksPageState";
import { matchesBookSearchQuery } from "../hooks/discoveryBrowseShared";
import { CARD_SIZE_OPTIONS, type CardSize } from "../lib/shelfViewPreferences";
import { addBookToReadingList, getReadingListQueues } from "../../../repos/readingListRepo";

function sortVisibleBooks(books: Book[], sortBy: SortOption) {
  return [...books].sort((a, b) => {
    switch (sortBy) {
      case "genre-author": {
        const genreCompare = (a.genre ?? "").localeCompare(
          b.genre ?? "",
          undefined,
          { sensitivity: "base" },
        );
        if (genreCompare !== 0) return genreCompare;

        const authorCompare = a.author.localeCompare(b.author, undefined, {
          sensitivity: "base",
        });
        if (authorCompare !== 0) return authorCompare;

        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      }
      case "title":
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      case "author":
        return a.author.localeCompare(b.author, undefined, {
          sensitivity: "base",
        });
      case "updated":
        return b.updatedAt - a.updatedAt;
      case "series":
      default:
        return (a.seriesName ?? "").localeCompare(b.seriesName ?? "", undefined, {
          sensitivity: "base",
          numeric: true,
        });
    }
  });
}

function getShelfLabel(ownershipFilter: OwnershipFilter) {
  if (ownershipFilter === "wishlist") {
    return "wishlist";
  }

  if (ownershipFilter === "all") {
    return "full shelf";
  }

  return "library";
}

function ReaderToggleButton({
  label,
  compact = false,
  active,
  pending,
  onClick,
}: {
  label: string;
  compact?: boolean;
  active: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "success" : "secondary"}
      className={`w-full min-w-0 justify-center gap-1 px-2 ${
        compact ? "min-h-7 text-[10px]" : "min-h-8 text-[11px]"
      }`}
      disabled={pending}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Mark ${label} as unread` : `Mark ${label} as read`}
      title={active ? `Mark ${label} as unread` : `Mark ${label} as read`}
    >
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
      {compact ? label.charAt(0) : label}
    </Button>
  );
}

function TbrButton({
  active,
  compact = false,
  pending,
  readerLabel,
  onClick,
}: {
  active: boolean;
  compact?: boolean;
  pending: boolean;
  readerLabel: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "success" : "secondary"}
      className={`w-full min-w-0 justify-center px-1.5 ${
        compact ? "min-h-6 text-[10px]" : "min-h-7 text-[10px]"
      } uppercase tracking-[0.12em]`}
      disabled={pending}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Queued for ${readerLabel}` : `Add to ${readerLabel}'s TBR`}
      title={active ? `Queued for ${readerLabel}` : `Add to ${readerLabel}'s TBR`}
    >
      <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
}

export function QuickReadPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [queueIdsByReader, setQueueIdsByReader] = useState<Record<ReaderId, string[]>>({
    dane: [],
    emma: [],
  });
  const { books, setBooks, loading } = useMergedShelfBooks();
  const { state, updateState, clearFilters, hasActiveFilters } =
    useViewBooksPageState(searchParams, setSearchParams);
  const deferredSearchQuery = useDeferredValue(state.searchQuery);
  const quickReadCardSize = state.cardSize;
  const compactActions =
    quickReadCardSize === "xsmall" || quickReadCardSize === "small";

  const actionGridClassesByCardSize: Record<CardSize, string> = {
    xsmall: "grid min-w-0 grid-cols-2 gap-1",
    small: "grid min-w-0 grid-cols-2 gap-1",
    medium: "grid min-w-0 grid-cols-2 gap-1.5",
    large: "grid min-w-0 grid-cols-2 gap-1.5",
  };

  const visibleShelfBooks = useMemo(() => {
    if (state.ownershipFilter === "all") {
      return books;
    }

    return books.filter(
      (book) => (book.ownershipStatus ?? "owned") === state.ownershipFilter,
    );
  }, [books, state.ownershipFilter]);

  const availableGenres = useMemo(
    () => getSortedStrings(visibleShelfBooks.map((book) => book.genre)),
    [visibleShelfBooks],
  );
  const availableFormats = useMemo(
    () => getSortedFormats(visibleShelfBooks),
    [visibleShelfBooks],
  );
  const availableSeries = useMemo(
    () => getSortedStrings(visibleShelfBooks.map((book) => book.seriesName)),
    [visibleShelfBooks],
  );

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visible = visibleShelfBooks.filter((book) => {
      if (query && !matchesBookSearchQuery(book, query)) {
        return false;
      }

      if (state.filterGenre !== "ALL" && book.genre !== state.filterGenre) {
        return false;
      }

      if (
        state.filterFinished !== "ALL" &&
        getReadStatus(book) !== readStatusByFilter[state.filterFinished]
      ) {
        return false;
      }

      if (state.filterFormat !== "ALL" && book.format !== state.filterFormat) {
        return false;
      }

      if (state.filterSeries === "NONE") {
        return !book.seriesName;
      }

      if (
        state.filterSeries !== "ALL" &&
        book.seriesName !== state.filterSeries
      ) {
        return false;
      }

      return true;
    });

    return sortVisibleBooks(visible, state.sortBy);
  }, [deferredSearchQuery, state, visibleShelfBooks]);

  useEffect(() => {
    void getReadingListQueues()
      .then((queues) => {
        setQueueIdsByReader(queues);
      })
      .catch((error) => {
        console.error("Failed to load reading list queues:", error);
      });
  }, []);

  const handleReadToggle = async (
    book: Book,
    reader: "dane" | "emma",
  ) => {
    const nextReadByDane = reader === "dane" ? !book.readByDane : book.readByDane;
    const nextReadByEmma = reader === "emma" ? !book.readByEmma : book.readByEmma;

    setPendingUpdates((current) => new Set(current).add(book.id));
    setBooks((currentBooks) =>
      currentBooks.map((currentBook) =>
        currentBook.id === book.id
          ? {
              ...currentBook,
              readByDane: nextReadByDane,
              readByEmma: nextReadByEmma,
            }
          : currentBook,
      ),
    );

    try {
      await updateBook(book.id, {
        readByDane: nextReadByDane,
        readByEmma: nextReadByEmma,
      });
    } catch (error) {
      console.error("Failed to update read status:", error);
      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.id === book.id
            ? {
                ...currentBook,
                readByDane: book.readByDane,
                readByEmma: book.readByEmma,
              }
            : currentBook,
        ),
      );
    } finally {
      setPendingUpdates((current) => {
        const next = new Set(current);
        next.delete(book.id);
        return next;
      });
    }
  };

  const handleAddToTbr = async (readerId: ReaderId, bookId: string) => {
    setPendingUpdates((current) => new Set(current).add(bookId));
    setQueueIdsByReader((current) => ({
      ...current,
      [readerId]: [bookId, ...current[readerId].filter((id) => id !== bookId)],
    }));

    try {
      const nextQueueIds = await addBookToReadingList(readerId, bookId);
      setQueueIdsByReader((current) => ({
        ...current,
        [readerId]: nextQueueIds,
      }));
    } catch (error) {
      console.error("Failed to update TBR queue:", error);
      const queues = await getReadingListQueues().catch(() => queueIdsByReader);
      setQueueIdsByReader(queues);
    } finally {
      setPendingUpdates((current) => {
        const next = new Set(current);
        next.delete(bookId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Quick Read"
        subtitle="A faster pass through the shelf, just for marking what Dane and Emma have finished."
        backgroundImage="/readinglisthero.png"
      />

      <PageLayout>
        <FilterDrawer
          title="Quick Read Filters"
          description="Keep the shelf compact while you move quickly through read-status updates."
          isOpen={isFilterDrawerOpen}
          onOpen={() => setIsFilterDrawerOpen(true)}
          onClose={() => setIsFilterDrawerOpen(false)}
          triggerLabel="Filter Shelf"
          actions={
            <>
              <ShelfDensitySelector
                options={CARD_SIZE_OPTIONS}
                value={quickReadCardSize}
                onChange={(cardSize) => updateState({ cardSize })}
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
          footer={
            <div className="text-sm text-stone-600">
              Working through the {getShelfLabel(state.ownershipFilter)} one card at a time.
            </div>
          }
        >
          <div className={filterFieldGridClasses}>
            <ShelfSearchField
              id="quick-read-search"
              name="quick-read-search"
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
              id="quick-read-genre"
              label="Genre"
              value={state.filterGenre}
              onChange={(event) =>
                updateState({ filterGenre: event.target.value })
              }
              options={[
                { value: "ALL", label: "All Genres" },
                ...availableGenres.map((genre) => ({
                  value: genre,
                  label: genre,
                })),
              ]}
            />

            <Select
              id="quick-read-status"
              label="Read Status"
              value={state.filterFinished}
              onChange={(event) =>
                updateState({
                  filterFinished: event.target
                    .value as typeof state.filterFinished,
                })
              }
              options={[...readFilterOptions]}
            />

            <Select
              id="quick-read-format"
              label="Format"
              value={state.filterFormat}
              onChange={(event) =>
                updateState({ filterFormat: event.target.value })
              }
              options={[
                { value: "ALL", label: "All Formats" },
                ...availableFormats.map((format) => ({
                  value: format,
                  label: BOOK_FORMAT_LABELS[format],
                })),
              ]}
            />

            <Select
              id="quick-read-series"
              label="Series"
              value={state.filterSeries}
              onChange={(event) =>
                updateState({ filterSeries: event.target.value })
              }
              options={[
                { value: "ALL", label: "All Series" },
                { value: "NONE", label: "No Series" },
                ...availableSeries.map((series) => ({
                  value: series,
                  label: series,
                })),
              ]}
            />

            <Select
              id="quick-read-sort"
              label="Sort"
              value={state.sortBy}
              onChange={(event) =>
                updateState({ sortBy: event.target.value as SortOption })
              }
              options={[...sortOptions]}
            />
          </div>
        </FilterDrawer>

        <section className="space-y-6">
          {loading ? (
            <LoadingState
              title="Loading Quick Read"
              description="Pulling together the shelf for fast read-status updates."
              variant="shelf"
              cardCount={8}
            />
          ) : visibleShelfBooks.length === 0 ? (
            <BookShelfState
              title="No Books Yet"
              description="Add books first, then come back here when you're ready to mark them as read."
              action={
                <Link to="/admin?add=1&ownership=owned" className={actionLinkClasses}>
                  Add Book
                </Link>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or clear filters to keep moving through the shelf."
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
          ) : (
            <BookGrid cardSize={quickReadCardSize}>
              {filteredBooks.map((book) => {
                const isPending = pendingUpdates.has(book.id);
                const queuedForDane = queueIdsByReader.dane.includes(book.id);
                const queuedForEmma = queueIdsByReader.emma.includes(book.id);

                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="view"
                    cardSize={quickReadCardSize}
                    clickable={true}
                    actions={
                      <div className={actionGridClassesByCardSize[quickReadCardSize]}>
                        <div className="grid min-w-0 gap-1">
                          <ReaderToggleButton
                            label="Dane"
                            compact={compactActions}
                            active={book.readByDane}
                            pending={isPending}
                            onClick={() => void handleReadToggle(book, "dane")}
                          />
                          <TbrButton
                            active={queuedForDane}
                            compact={compactActions}
                            pending={isPending}
                            readerLabel="Dane"
                            onClick={() => void handleAddToTbr("dane", book.id)}
                          />
                        </div>
                        <div className="grid min-w-0 gap-1">
                          <ReaderToggleButton
                            label="Emma"
                            compact={compactActions}
                            active={book.readByEmma}
                            pending={isPending}
                            onClick={() => void handleReadToggle(book, "emma")}
                          />
                          <TbrButton
                            active={queuedForEmma}
                            compact={compactActions}
                            pending={isPending}
                            readerLabel="Emma"
                            onClick={() => void handleAddToTbr("emma", book.id)}
                          />
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </BookGrid>
          )}
        </section>
      </PageLayout>
    </div>
  );
}
