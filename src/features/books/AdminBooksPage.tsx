import { useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../ui/components/Button";
import { LoadingState } from "../../ui/components/LoadingState";
import { BookForm } from "./components/BookForm";
import { ManageBooksFilterPanel } from "./components/ManageBooksFilterPanel";
import { ManageBooksResults } from "./components/ManageBooksResults";
import { ManageDeleteDialog } from "./components/ManageDeleteDialog";
import { useAdminBooksManager } from "./hooks/useAdminBooksManager";

export function AdminBooksPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRegionRef = useRef<HTMLDivElement>(null);
  const { page, filters, form, modal, list, actions } = useAdminBooksManager({
    fileInputRef,
    formRegionRef,
  });

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
            {!page.showForm ? (
              <Button variant="primary" onClick={() => actions.handleStartAddBook()}>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Book
                </span>
              </Button>
            ) : null}
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

          {!page.showForm ? (
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
          ) : null}
        </div>

        {page.showForm ? (
          <div
            ref={formRegionRef}
            className="mt-5 space-y-4 scroll-mt-24"
            aria-label={form.editingId ? "Edit book form" : "Add book form"}
          >
            <BookForm
              isEditing={Boolean(form.editingId)}
              title={form.title}
              author={form.author}
              genre={form.genre}
              description={form.description}
              isbn={form.isbn}
              finished={form.finished}
              coverUrl={form.coverUrl}
              format={form.format}
              pages={form.pages}
              readByDane={form.readByDane}
              readByEmma={form.readByEmma}
              ownershipStatus={form.ownershipStatus}
              seriesName={form.seriesName}
              seriesLabel={form.seriesLabel}
              coverPhotoUrl={form.coverPhotoUrl}
              showCoverSaved={form.showCoverSaved}
              showCoverPhotoControls={Boolean(form.editingId)}
              coverPhotoInputRef={fileInputRef}
              saveState={form.formSaveState}
              saveMessage={form.formSaveMessage}
              saveSignal={form.formSaveSignal}
              formInstanceKey={form.formInstanceKey}
              onDirtyChange={actions.setFormIsDirty}
              onCoverPhotoFileChange={actions.handleCoverPhotoCapture}
              onCoverPhotoPick={actions.handlePickCoverPhoto}
              onRemoveCoverPhoto={actions.handleRemoveCoverPhoto}
              onTitleChange={actions.setTitle}
              onAuthorChange={actions.setAuthor}
              onGenreChange={actions.setGenre}
              onDescriptionChange={actions.setDescription}
              onIsbnChange={actions.setIsbn}
              onFinishedChange={actions.setFinished}
              onCoverUrlChange={actions.handleCoverUrlChange}
              onFormatChange={actions.setFormat}
              onPagesChange={actions.setPages}
              onReadByDaneChange={actions.setReadByDane}
              onReadByEmmaChange={actions.setReadByEmma}
              onOwnershipStatusChange={actions.setOwnershipStatus}
              onSeriesNameChange={actions.setSeriesName}
              onSeriesLabelChange={actions.setSeriesLabel}
              onClearSeries={actions.clearSeries}
              onSubmit={actions.handleSubmit}
              onCancel={actions.handleCancelEdit}
              onDelete={form.editingId ? actions.requestDeleteFromForm : undefined}
            >
              {form.editingId ? (
                <span>{form.formIsDirty ? "Editing Book - Unsaved Changes" : "Editing Book"}</span>
              ) : (
                <span>{form.formIsDirty ? "Adding Book - Unsaved Changes" : "Add A Book"}</span>
              )}
            </BookForm>
          </div>
        ) : null}
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
            onStartAddBook={actions.handleStartAddBook}
            onClearFilters={actions.handleClearFilters}
            onEdit={actions.handleEditBook}
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
