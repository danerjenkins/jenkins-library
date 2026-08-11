import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { ManageBooksFilterPanel } from "../components/manage/ManageBooksFilterPanel";
import { ManageBooksResults } from "../components/manage/ManageBooksResults";
import { ManageDeleteDialog } from "../components/manage/ManageDeleteDialog";
import { useAdminBooksManager } from "../hooks/useAdminBooksManager";
import type { Book } from "../lib/bookTypes";

export function AdminBooksPage() {
  const { page, filters, modal, list, actions } = useAdminBooksManager();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);

  const handleStartAddBook = (ownership = filters.filterOwnership) => {
    navigate(`/book/new?ownership=${ownership}&returnTo=${returnTo}`);
  };

  const handleEditBook = (book: Book) => {
    navigate(`/book/${book.id}/edit?returnTo=${returnTo}`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
                Manage Books
              </h2>
              <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
                Add books and maintain catalog details. Browse covers and reading status from the
                Library and Wishlist pages.
              </p>
            </div>
            <Button variant="primary" onClick={() => handleStartAddBook()}>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Book
                </span>
              </Button>
          </div>

          {page.errorMessage ? (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {page.errorMessage}
            </div>
          ) : null}
          {page.statusMessage ? (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {page.statusMessage}
            </div>
          ) : null}

          <ManageBooksFilterPanel
            searchQuery={filters.searchQuery}
            filterGenre={filters.filterGenre}
            filterReadStatus={filters.filterReadStatus}
            filterOwnership={filters.filterOwnership}
            filterFormat={filters.filterFormat}
            filterSeries={filters.filterSeries}
            availableGenres={filters.availableGenres}
            availableFormats={filters.availableFormats}
            availableSeries={filters.availableSeries}
            filteredCount={filters.filteredBooks.length}
            hasActiveFilters={filters.hasActiveFilters}
            onSearchQueryChange={actions.setSearchQuery}
            onFilterGenreChange={actions.setFilterGenre}
            onFilterReadStatusChange={actions.setFilterReadStatus}
            onFilterOwnershipChange={actions.handleOwnershipTabChange}
            onFilterFormatChange={actions.setFilterFormat}
            onFilterSeriesChange={actions.setFilterSeries}
            onClearFilters={actions.handleClearFilters}
          />
        </div>
      </section>

      <section className="space-y-3">
        {page.loading ? (
          <LoadingState
            title="Loading Manage Books"
            description="Restoring the catalog table and ownership actions."
            variant="panel"
          />
        ) : (
          <ManageBooksResults
            loading={page.loading}
            books={list.books}
            filteredBooks={filters.filteredBooks}
            filterOwnership={filters.filterOwnership}
            onStartAddBook={handleStartAddBook}
            onClearFilters={actions.handleClearFilters}
            onEdit={handleEditBook}
            onDelete={actions.setDeleteTarget}
            onToggleOwnership={(book) => void actions.handleQuickOwnershipToggle(book)}
            ownershipBusyId={list.ownershipActionBookId}
          />
        )}
      </section>

      <ManageDeleteDialog
        open={modal.deleteTarget !== null}
        title={modal.deleteTarget?.title ?? "Untitled"}
        busy={modal.deletePending}
        onCancel={() => {
          if (!modal.deletePending) actions.setDeleteTarget(null);
        }}
        onConfirm={actions.handleConfirmDeleteBook}
      />
    </div>
  );
}
