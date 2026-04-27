import type { RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "../../../../ui/components/Input";
import type { TitleSuggestion } from "../../../../integrations/openLibrary";

const fieldClassName =
  "w-full rounded-lg border border-warm-gray bg-cream px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";

export const EDIT_BOOK_GENRES = [
  "Adventure",
  "Classic",
  "Fantasy",
  "Historical Fiction",
  "Literary Fiction",
  "Mystery",
  "Non-fiction",
  "Religion",
  "Science Fiction",
  "Self-Help",
] as const;

export function BookFormIdentityPanel({
  titleFieldRef,
  title,
  author,
  ownershipStatus,
  titleSuggestions,
  isSuggesting,
  showSuggestions,
  titleError,
  authorError,
  authorWasAutofilled,
  onTitleInput,
  onTitleFocus,
  onTitleBlur,
  onAuthorInput,
  onAuthorFocus,
  onAuthorBlur,
  onClearAuthor,
  onOwnershipStatusChange,
  onSuggestionSelect,
}: {
  titleFieldRef: RefObject<HTMLDivElement | null>;
  title: string;
  author: string;
  ownershipStatus: "owned" | "wishlist";
  titleSuggestions: TitleSuggestion[];
  isSuggesting: boolean;
  showSuggestions: boolean;
  titleError: string | null;
  authorError: string | null;
  authorWasAutofilled: boolean;
  onTitleInput: (value: string) => void;
  onTitleFocus: () => void;
  onTitleBlur: () => void;
  onAuthorInput: (value: string) => void;
  onAuthorFocus: () => void;
  onAuthorBlur: () => void;
  onClearAuthor: () => void;
  onOwnershipStatusChange: (value: "owned" | "wishlist") => void;
  onSuggestionSelect: (suggestion: TitleSuggestion) => void;
}) {
  return (
    <div className="space-y-4">
      <div ref={titleFieldRef} className="relative">
        <Input
          id="title"
          name="title"
          label="Title"
          type="text"
          value={title}
          required
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? "title-error" : undefined}
          onChange={(event) => onTitleInput(event.target.value)}
          onFocus={onTitleFocus}
          onBlur={onTitleBlur}
          placeholder="The Hobbit..."
          autoComplete="off"
        />
        {isSuggesting ? (
          <div className="mt-1 text-xs text-stone-500" aria-live="polite">
            Searching titles...
          </div>
        ) : null}
        {titleError ? (
          <p id="title-error" className="mt-1 text-xs text-rose-600">
            {titleError}
          </p>
        ) : null}
        {showSuggestions && titleSuggestions.length > 0 ? (
          <div className="absolute z-10 mt-2 w-full rounded-lg border border-warm-gray bg-cream shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {titleSuggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSuggestionSelect(suggestion);
                  }}
                  className="flex w-full items-start gap-3 border-b border-warm-gray px-3 py-2 text-left transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage/30 last:border-b-0"
                >
                  {suggestion.coverUrl ? (
                    <img
                      src={suggestion.coverUrl}
                      alt=""
                      width={32}
                      height={48}
                      loading="lazy"
                      className="h-12 w-8 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-stone-900">{suggestion.title}</div>
                    {suggestion.author || suggestion.year ? (
                      <div className="mt-0.5 text-xs text-stone-500">
                        {suggestion.author}
                        {suggestion.author && suggestion.year ? " • " : ""}
                        {suggestion.year}
                      </div>
                    ) : null}
                    {suggestion.isbn ? (
                      <div className="mt-0.5 text-xs text-stone-400">ISBN: {suggestion.isbn}</div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-warm-gray bg-parchment px-3 py-1.5 text-xs text-stone-500">
              Suggested results from Open Library
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <Input
          id="author"
          name="author"
          label="Author"
          type="text"
          value={author}
          required
          aria-invalid={Boolean(authorError)}
          aria-describedby={authorError ? "author-error" : undefined}
          onChange={(event) => onAuthorInput(event.target.value)}
          onFocus={onAuthorFocus}
          onBlur={onAuthorBlur}
          placeholder="Ursula K. Le Guin..."
          autoComplete="off"
        />
        {authorError ? (
          <p id="author-error" className="mt-1 text-xs text-rose-600">
            {authorError}
          </p>
        ) : null}
        {authorWasAutofilled && author.trim().length > 0 ? (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-500">
            <span>Auto-filled from title. Verify it before saving.</span>
            <button
              type="button"
              onClick={onClearAuthor}
              className="text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-warm-gray bg-cream/80 p-3">
        <label htmlFor="ownershipStatus" className="mb-1 block text-sm font-medium text-stone-700">
          Ownership
        </label>
        <p className="mb-2 text-xs text-stone-500">Track whether this belongs in the library or wishlist.</p>
        <select
          id="ownershipStatus"
          name="ownershipStatus"
          value={ownershipStatus}
          onChange={(event) => onOwnershipStatusChange(event.target.value as "owned" | "wishlist")}
          className={fieldClassName}
        >
          <option value="owned">Owned</option>
          <option value="wishlist">Wishlist</option>
        </select>
      </div>
    </div>
  );
}

export function BookFormAdvancedDetailsPrompt({
  isEditing,
  showAdvancedFields,
  onToggleAdvancedDetails,
  genre,
  genreWasAutofilled,
}: {
  isEditing: boolean;
  showAdvancedFields: boolean;
  onToggleAdvancedDetails: () => void;
  genre: string;
  genreWasAutofilled: boolean;
}) {
  return (
    <div className="space-y-3">
      {!isEditing ? (
        <div className="rounded-lg border border-dashed border-warm-gray bg-cream/70 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-700">Advanced Details</h3>
              <p className="mt-1 text-xs text-stone-500">
                Add reading status, series info, and metadata now or after the book is saved.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleAdvancedDetails}
              className="inline-flex items-center gap-1.5 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
            >
              {showAdvancedFields ? "Hide Advanced Details" : "Add More Details"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvancedFields ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      ) : null}

      {genreWasAutofilled && genre.trim().length > 0 ? (
        <div className="text-xs text-stone-500">
          Genre was auto-filled from book metadata. Verify it in the metadata section.
        </div>
      ) : null}
    </div>
  );
}
