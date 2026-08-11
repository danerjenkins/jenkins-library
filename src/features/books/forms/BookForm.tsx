import { Save } from "lucide-react";
import { Input } from "../../../ui/components/Input";
import { BookFormTabs } from "./book-form/BookFormTabs";
import type { BookFormProps } from "./book-form/BookForm.types";
import type { BookFormat } from "../lib/bookTypes";
import { BOOK_FORMAT_LABELS } from "../lib/bookTypes";
import { BookFormCoverWorkspace } from "./book-form/BookFormCoverWorkspace";
import {
  BookFormIdentityPanel,
  EDIT_BOOK_GENRES,
} from "./book-form/BookFormCorePanels";
import { useBookFormController } from "./book-form/useBookFormController";
import "./BookForm.css";

export type { BookFormSaveState } from "./book-form/BookForm.types";

const fieldClassName =
  "w-full rounded-lg border border-warm-gray bg-cream px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";

function ReadingToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-warm-gray-light"
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
      />
      <span>{label}</span>
    </label>
  );
}

export function BookForm(props: BookFormProps) {
  const { saveMessage = null, saveState = "idle" } = props;
  const { refs, state, actions } = useBookFormController(props);
  const {
    formRef,
    basicsSectionRef,
    titleFieldRef,
    coverSectionRef,
    summarySectionRef,
    metadataSectionRef,
  } = refs;

  return (
    <form
      ref={formRef}
      className="book-editor-form ds-panel-surface shadow-sm"
      onSubmit={actions.handleFormSubmit}
    >
      {saveMessage ? (
        <div
          className={`book-editor-form__message rounded-lg border px-3 py-2 text-sm ${
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

      <BookFormTabs
        activeSection={state.activeSection}
        onSectionChange={actions.handleSectionChange}
      />

      <div className="book-editor-form__panels">
        <section
          ref={basicsSectionRef}
          id="section-basics"
          role="tabpanel"
          tabIndex={-1}
          className={`book-editor-form__panel ${state.activeSection === "basics" ? "block" : "hidden"}`}
        >
          <div className="book-editor-form__panel-grid">
            <BookFormIdentityPanel
              titleFieldRef={titleFieldRef}
              title={props.title}
              author={props.author}
              ownershipStatus={props.ownershipStatus}
              titleSuggestions={state.titleSuggestions}
              isSuggesting={state.isSuggesting}
              showSuggestions={state.showSuggestions}
              titleError={state.titleError}
              authorError={state.authorError}
              authorWasAutofilled={state.authorWasAutofilled}
              onTitleInput={actions.handleTitleInput}
              onTitleFocus={actions.handleTitleFocus}
              onTitleBlur={actions.handleTitleBlur}
              onAuthorInput={actions.handleAuthorInput}
              onAuthorFocus={actions.handleAuthorFocus}
              onAuthorBlur={actions.handleAuthorBlur}
              onClearAuthor={actions.handleClearAuthor}
              onOwnershipStatusChange={props.onOwnershipStatusChange}
              onSuggestionSelect={actions.handleSuggestionSelect}
            />

            <div className="space-y-3 rounded-lg border border-warm-gray bg-parchment/75 p-3">
              <h3 className="text-sm font-semibold text-stone-700">Reading Status</h3>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <ReadingToggle
                  id="finished"
                  label="Finished"
                  checked={props.finished}
                  onChange={props.onFinishedChange}
                />
                <ReadingToggle
                  id="readByDane"
                  label="Read by Dane"
                  checked={props.readByDane}
                  onChange={props.onReadByDaneChange}
                />
                <ReadingToggle
                  id="readByEmma"
                  label="Read by Emma"
                  checked={props.readByEmma}
                  onChange={props.onReadByEmmaChange}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          ref={coverSectionRef}
          id="section-cover"
          role="tabpanel"
          tabIndex={-1}
          className={`book-editor-form__panel ${state.activeSection === "cover" ? "block" : "hidden"}`}
        >
          <BookFormCoverWorkspace
            coverUrl={props.coverUrl}
            title={props.title}
            author={props.author}
            coverPhotoUrl={props.coverPhotoUrl}
            showCoverSaved={props.showCoverSaved}
            showCoverPhotoControls={props.showCoverPhotoControls}
            coverPhotoInputRef={props.coverPhotoInputRef}
            isSearching={state.isSearching}
            searchError={state.searchError}
            coverCandidates={state.coverCandidates}
            selectedCoverUrl={state.selectedCoverUrl}
            coverSourceLabel={state.coverSourceLabel}
            hasRemoteCover={state.hasRemoteCover}
            hasLocalPhoto={state.hasLocalPhoto}
            onCoverUrlChange={props.onCoverUrlChange}
            onCoverSelect={actions.handleCoverSelect}
            onCoverPhotoPick={props.onCoverPhotoPick}
            onRemoveCoverPhoto={props.onRemoveCoverPhoto}
            onCoverPhotoFileChange={props.onCoverPhotoFileChange}
          />
        </section>

        <section
          ref={summarySectionRef}
          id="section-summary"
          role="tabpanel"
          tabIndex={-1}
          className={`book-editor-form__panel ${state.activeSection === "summary" ? "block" : "hidden"}`}
        >
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Summary
            </label>
            <textarea
              id="description"
              name="description"
              value={props.description}
              onChange={(event) => props.onDescriptionChange(event.target.value)}
              className={`${fieldClassName} book-editor-form__summary-input resize-none`}
              placeholder="Short summary or notes..."
              autoComplete="off"
            />
          </div>
        </section>

        <section
          ref={metadataSectionRef}
          id="section-metadata"
          role="tabpanel"
          tabIndex={-1}
          className={`book-editor-form__panel ${state.activeSection === "metadata" ? "block" : "hidden"}`}
        >
          <div className="book-editor-form__metadata-grid">
            <Input
              id="seriesName"
              name="seriesName"
              label="Series Name"
              type="text"
              value={props.seriesName}
              onChange={(event) => props.onSeriesNameChange(event.target.value)}
              placeholder="Earthsea..."
              autoComplete="off"
            />
            <Input
              id="seriesLabel"
              name="seriesLabel"
              label="# In Series"
              type="text"
              value={props.seriesLabel}
              onChange={(event) => props.onSeriesLabelChange(event.target.value)}
              placeholder="2 or 2.5..."
              autoComplete="off"
            />
            <div>
              <label htmlFor="genre" className="mb-1 block text-sm font-medium text-stone-700">
                Genre
              </label>
              <select
                id="genre"
                name="genre"
                value={props.genre}
                onChange={(event) => actions.handleGenreInput(event.target.value)}
                className={fieldClassName}
              >
                <option value="">Select genre</option>
                {EDIT_BOOK_GENRES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {state.genreWasAutofilled && props.genre.trim().length > 0 ? (
                <div className="mt-1.5 text-xs text-stone-500">
                  Auto-filled from book metadata. Verify it before saving.
                </div>
              ) : null}
            </div>
            <div>
              <label htmlFor="format" className="mb-1 block text-sm font-medium text-stone-700">
                Format
              </label>
              <select
                id="format"
                name="format"
                value={props.format}
                onChange={(event) => props.onFormatChange(event.target.value)}
                className={fieldClassName}
              >
                <option value="">Unknown</option>
                {(Object.keys(BOOK_FORMAT_LABELS) as BookFormat[]).map((value) => (
                  <option key={value} value={value}>
                    {BOOK_FORMAT_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="isbn"
              name="isbn"
              label="ISBN"
              type="text"
              value={props.isbn}
              onChange={(event) => props.onIsbnChange(event.target.value)}
              placeholder="9780547928227..."
              autoComplete="off"
              spellCheck={false}
            />
            <div>
              <label htmlFor="pages" className="mb-1 block text-sm font-medium text-stone-700">
                Pages
              </label>
              <input
                id="pages"
                name="pages"
                type="number"
                min="1"
                step="1"
                value={props.pages}
                onChange={(event) => props.onPagesChange(event.target.value)}
                className={fieldClassName}
                placeholder="320..."
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>
          {props.seriesName.trim() || props.seriesLabel.trim() ? (
            <button
              type="button"
              onClick={props.onClearSeries}
              className="mt-3 text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              Clear series
            </button>
          ) : null}
        </section>
      </div>

      <button
        type="submit"
        className="book-editor-floating-save"
        disabled={saveState === "saving"}
        aria-label={state.submitLabel}
        title={state.submitLabel}
      >
        <Save className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );
}
