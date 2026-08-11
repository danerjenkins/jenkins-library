import { ScanLine } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FullBleedPageHero, PageLayout } from "../../../ui/components/PageLayout";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import {
  IsbnScannerModal,
} from "../components/IsbnScannerModal";
import { canUseMobileIsbnScanner, normalizeIsbnInput } from "../lib/isbnScanner";
import { BookCard, BookGrid, BookShelfState } from "../components/cards/BookCard";
import {
  ShelfSearchField,
  ShelfDensitySelector,
  SegmentedControl,
} from "../components/browse/ShelfBrowseControls";
import {
  ownershipSegmentOptions,
  actionLinkClasses,
} from "../components/browse/shelfBrowseControlStyles";
import { CARD_SIZE_OPTIONS } from "../lib/shelfViewPreferences";
import { useGlobalSearchPage } from "../hooks/useGlobalSearchPage";

export function SearchPage() {
  const { state, actions } = useGlobalSearchPage();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBarcodeSupported] = useState(canUseMobileIsbnScanner);

  const resultsMeta = useMemo(
    () =>
      state.loading
        ? "Loading search results..."
        : `${state.filteredBooks.length} ${state.filteredBooks.length === 1 ? "book" : "books"} matched · ${state.ownershipTotals.owned} owned · ${state.ownershipTotals.wishlist} wishlist`,
    [
      state.filteredBooks.length,
      state.loading,
      state.ownershipTotals.owned,
      state.ownershipTotals.wishlist,
    ],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Search"
        subtitle="For the title on the tip of your tongue and the one hiding three shelves deep."
        backgroundImage="/searchhero.png"
      />

      <PageLayout>
        <div className="rounded-2xl border border-warm-gray/80 bg-parchment/90 p-3 shadow-sm sm:p-4">
          <div className="grid gap-3">
            <ShelfSearchField
              id="global-search"
              name="global-search"
              label="Search"
              value={state.searchQuery}
              onChange={actions.setSearchQuery}
              placeholder="Try ISBN, title, author, or series..."
              className="lg:max-w-3xl"
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <SegmentedControl
                label="Ownership"
                options={ownershipSegmentOptions}
                value={state.ownershipFilter}
                onChange={actions.setOwnershipFilter}
              />

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                <ShelfDensitySelector
                  options={CARD_SIZE_OPTIONS}
                  value={state.cardSize}
                  onChange={actions.setCardSize}
                />
              </div>
            </div>
          </div>

          <div className="ds-subtle-text mt-3 text-sm" aria-live="polite">
            {resultsMeta}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-wrap gap-1.5">
              {isBarcodeSupported ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <span className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4" aria-hidden="true" />
                    Scan ISBN
                  </span>
                </Button>
              ) : null}
              {state.hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={actions.clearFilters}
                >
                  Clear Search
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {state.loading ? (
          <LoadingState
            title="Loading Search"
            description="Gathering books from both shelves for one search result list."
            variant="shelf"
            cardCount={8}
          />
        ) : state.filteredBooks.length === 0 ? (
          <BookShelfState
            title="No matches found"
            description="Try a different ISBN, title, author, genre, or series."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/view" className={actionLinkClasses}>
                  Browse Library
                </Link>
                <Link to="/wishlist" className={actionLinkClasses}>
                  Browse Wishlist
                </Link>
              </div>
            }
          />
        ) : (
          <BookGrid cardSize={state.cardSize}>
            {state.filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="view"
                cardSize={state.cardSize}
                clickable={true}
                detailMeta={book.isbn ? `ISBN: ${book.isbn}` : null}
              />
            ))}
          </BookGrid>
        )}
      </PageLayout>

      <IsbnScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(value) => {
          const normalized = normalizeIsbnInput(value);
          actions.setSearchQuery(normalized || value);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
}
