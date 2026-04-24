import { Input } from "../../../../ui/components/Input";
import type { BookFormat } from "../../bookTypes";
import { BOOK_FORMAT_LABELS } from "../../bookTypes";
import type { BookFormSection } from "./BookForm.types";
import { MobileSectionToggle } from "./BookFormTabs";
import type { RefObject } from "react";
import { EDIT_BOOK_GENRES } from "./BookFormCoreSection";

const fieldClassName =
  "w-full rounded-lg border border-warm-gray bg-cream px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";

export function BookFormMetaSection({
  activeSection,
  onSectionChange,
  sectionRef,
  seriesName,
  seriesLabel,
  genre,
  format,
  isbn,
  pages,
  description,
  genreWasAutofilled,
  onSeriesNameChange,
  onSeriesLabelChange,
  onClearSeries,
  onGenreChange,
  onFormatChange,
  onIsbnChange,
  onPagesChange,
  onDescriptionChange,
}: {
  activeSection: BookFormSection;
  onSectionChange: (section: BookFormSection) => void;
  sectionRef: RefObject<HTMLElement | null>;
  seriesName: string;
  seriesLabel: string;
  genre: string;
  format: string;
  isbn: string;
  pages: string;
  description: string;
  genreWasAutofilled: boolean;
  onSeriesNameChange: (value: string) => void;
  onSeriesLabelChange: (value: string) => void;
  onClearSeries: () => void;
  onGenreChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  onIsbnChange: (value: string) => void;
  onPagesChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
    >
      <MobileSectionToggle
        activeSection={activeSection}
        section="meta"
        label="Description & Metadata"
        onClick={onSectionChange}
      />
      <div
        id="section-meta"
        role="tabpanel"
        className={`${activeSection === "meta" ? "block" : "hidden"} px-4 pb-4 pt-4`}
      >
        <div className="space-y-4">
          <h3 className="hidden text-sm font-semibold text-stone-700 sm:block">
            Description & Metadata
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="seriesName"
              name="seriesName"
              label="Series Name"
              type="text"
              value={seriesName}
              onChange={(event) => onSeriesNameChange(event.target.value)}
              placeholder="Earthsea..."
              autoComplete="off"
            />
            <Input
              id="seriesLabel"
              name="seriesLabel"
              label="# In Series"
              type="text"
              value={seriesLabel}
              onChange={(event) => onSeriesLabelChange(event.target.value)}
              placeholder="2 or 2.5..."
              autoComplete="off"
            />
          </div>
          {seriesName.trim() || seriesLabel.trim() ? (
            <div>
              <button
                type="button"
                onClick={onClearSeries}
                className="text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                Clear series
              </button>
            </div>
          ) : null}

          <div>
            <label htmlFor="genre" className="mb-1 block text-sm font-medium text-stone-700">
              Genre
            </label>
            <select
              id="genre"
              name="genre"
              value={genre}
              onChange={(event) => onGenreChange(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Select genre</option>
              {EDIT_BOOK_GENRES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {genreWasAutofilled && genre.trim().length > 0 ? (
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
              value={format}
              onChange={(event) => onFormatChange(event.target.value)}
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
            value={isbn}
            onChange={(event) => onIsbnChange(event.target.value)}
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
              value={pages}
              onChange={(event) => onPagesChange(event.target.value)}
              className={fieldClassName}
              placeholder="320..."
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className={`${fieldClassName} min-h-28 resize-y`}
              placeholder="Short summary or notes..."
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
