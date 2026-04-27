import { Trash2 } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { BookFormCoreSection } from "./book-form/BookFormCoreSection";
import { BookFormMetaSection } from "./book-form/BookFormMetaSection";
import { BookFormReadingSection } from "./book-form/BookFormReadingSection";
import { BookFormTabs } from "./book-form/BookFormTabs";
import type { BookFormProps } from "./book-form/BookForm.types";
import { useBookFormController } from "./book-form/useBookFormController";

export type { BookFormSaveState } from "./book-form/BookForm.types";

export function BookForm(props: BookFormProps) {
  const { isEditing, saveMessage = null, saveState = "idle", children } = props;
  const { refs, state, actions } = useBookFormController(props);
  const { formRef, coreSectionRef, titleFieldRef, readingSectionRef, metaSectionRef } = refs;

  return (
    <form
      ref={formRef}
      className="ds-panel-surface grid gap-4 p-4 pb-24 shadow-sm"
      onSubmit={actions.handleFormSubmit}
    >
      {children ? (
        <div className="mb-1 hidden font-sans text-sm font-medium text-stone-600 sm:block">
          {children}
        </div>
      ) : null}

      <div
        className="ds-panel-surface rounded-lg bg-parchment/80 p-3 sm:rounded-xl sm:p-4"
        aria-labelledby="book-form-summary"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="book-form-summary"
              className="text-balance font-display text-xl font-semibold text-stone-900 sm:text-2xl"
            >
              {isEditing ? "Edit Book" : "Add Book"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {isEditing
                ? "Update the essentials first, then adjust reading details and metadata."
                : "Start with title, author, ownership, and a cover. Add more details only if you need them."}
            </p>
          </div>
          <div className="ds-chip self-start border-warm-gray bg-cream px-3 py-1 text-stone-600">
            {state.coverSourceLabel}
          </div>
        </div>

        {saveMessage ? (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              saveState === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : saveState === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-warm-gray bg-cream text-stone-600"
            }`}
            aria-live="polite"
          >
            {saveMessage}
          </div>
        ) : null}
      </div>

      {state.shouldShowAdvancedSections ? (
        <BookFormTabs
          activeSection={state.activeSection}
          onSectionChange={actions.handleSectionChange}
        />
      ) : null}

      <BookFormCoreSection
        activeSection={state.activeSection}
        onSectionChange={actions.handleSectionChange}
        sectionRef={coreSectionRef}
        titleFieldRef={titleFieldRef}
        isEditing={isEditing}
        title={props.title}
        author={props.author}
        genre={props.genre}
        coverUrl={props.coverUrl}
        ownershipStatus={props.ownershipStatus}
        coverPhotoUrl={props.coverPhotoUrl}
        showCoverSaved={props.showCoverSaved}
        showCoverPhotoControls={props.showCoverPhotoControls}
        coverPhotoInputRef={props.coverPhotoInputRef}
        showAdvancedFields={state.showAdvancedFields}
        titleSuggestions={state.titleSuggestions}
        isSuggesting={state.isSuggesting}
        showSuggestions={state.showSuggestions}
        titleError={state.titleError}
        authorError={state.authorError}
        authorWasAutofilled={state.authorWasAutofilled}
        genreWasAutofilled={state.genreWasAutofilled}
        isSearching={state.isSearching}
        searchError={state.searchError}
        coverCandidates={state.coverCandidates}
        selectedCoverUrl={state.selectedCoverUrl}
        coverSourceLabel={state.coverSourceLabel}
        hasRemoteCover={state.hasRemoteCover}
        hasLocalPhoto={state.hasLocalPhoto}
        onTitleInput={actions.handleTitleInput}
        onTitleFocus={actions.handleTitleFocus}
        onTitleBlur={actions.handleTitleBlur}
        onAuthorInput={actions.handleAuthorInput}
        onAuthorFocus={actions.handleAuthorFocus}
        onAuthorBlur={actions.handleAuthorBlur}
        onClearAuthor={actions.handleClearAuthor}
        onOwnershipStatusChange={props.onOwnershipStatusChange}
        onCoverUrlChange={props.onCoverUrlChange}
        onCoverSelect={actions.handleCoverSelect}
        onSuggestionSelect={actions.handleSuggestionSelect}
        onCoverPhotoPick={props.onCoverPhotoPick}
        onRemoveCoverPhoto={props.onRemoveCoverPhoto}
        onCoverPhotoFileChange={props.onCoverPhotoFileChange}
        onToggleAdvancedDetails={actions.toggleAdvancedDetails}
      />

      {state.shouldShowAdvancedSections ? (
        <BookFormReadingSection
          activeSection={state.activeSection}
          onSectionChange={actions.handleSectionChange}
          sectionRef={readingSectionRef}
          finished={props.finished}
          readByDane={props.readByDane}
          readByEmma={props.readByEmma}
          onFinishedChange={props.onFinishedChange}
          onReadByDaneChange={props.onReadByDaneChange}
          onReadByEmmaChange={props.onReadByEmmaChange}
        />
      ) : null}

      {state.shouldShowAdvancedSections ? (
        <BookFormMetaSection
          activeSection={state.activeSection}
          onSectionChange={actions.handleSectionChange}
          sectionRef={metaSectionRef}
          seriesName={props.seriesName}
          seriesLabel={props.seriesLabel}
          genre={props.genre}
          format={props.format}
          isbn={props.isbn}
          pages={props.pages}
          description={props.description}
          genreWasAutofilled={state.genreWasAutofilled}
          onSeriesNameChange={props.onSeriesNameChange}
          onSeriesLabelChange={props.onSeriesLabelChange}
          onClearSeries={props.onClearSeries}
          onGenreChange={actions.handleGenreInput}
          onFormatChange={props.onFormatChange}
          onIsbnChange={props.onIsbnChange}
          onPagesChange={props.onPagesChange}
          onDescriptionChange={props.onDescriptionChange}
        />
      ) : null}

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-warm-gray bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" variant="success" disabled={saveState === "saving"}>
            {state.submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={actions.handleCancel}>
            Cancel
          </Button>
          {isEditing && props.onDelete ? (
            <Button type="button" variant="danger" onClick={props.onDelete}>
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete Book
              </span>
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
