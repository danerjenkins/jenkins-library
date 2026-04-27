import type { ChangeEvent, Ref, RefObject } from "react";
import { Camera, Check, ChevronDown, Search } from "lucide-react";
import { Input } from "../../../../ui/components/Input";
import { getGoogleImageSearchUrl } from "../../bookTypes";
import type { BookFormSection } from "./BookForm.types";
import { MobileSectionToggle } from "./BookFormTabs";
import type { OpenLibraryCandidate, TitleSuggestion } from "../../../../integrations/openLibrary";

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

export function BookFormCoreSection({
  activeSection,
  onSectionChange,
  sectionRef,
  titleFieldRef,
  isEditing,
  title,
  author,
  genre,
  coverUrl,
  ownershipStatus,
  coverPhotoUrl,
  showCoverSaved,
  showCoverPhotoControls,
  coverPhotoInputRef,
  showAdvancedFields,
  titleSuggestions,
  isSuggesting,
  showSuggestions,
  titleError,
  authorError,
  authorWasAutofilled,
  genreWasAutofilled,
  isSearching,
  searchError,
  coverCandidates,
  selectedCoverUrl,
  coverSourceLabel,
  hasRemoteCover,
  hasLocalPhoto,
  onTitleInput,
  onTitleFocus,
  onTitleBlur,
  onAuthorInput,
  onAuthorFocus,
  onAuthorBlur,
  onClearAuthor,
  onOwnershipStatusChange,
  onCoverUrlChange,
  onCoverSelect,
  onSuggestionSelect,
  onCoverPhotoPick,
  onRemoveCoverPhoto,
  onCoverPhotoFileChange,
  onToggleAdvancedDetails,
}: {
  activeSection: BookFormSection;
  onSectionChange: (section: BookFormSection) => void;
  sectionRef: RefObject<HTMLElement | null>;
  titleFieldRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  ownershipStatus: "owned" | "wishlist";
  coverPhotoUrl: string | null;
  showCoverSaved: boolean;
  showCoverPhotoControls: boolean;
  coverPhotoInputRef: Ref<HTMLInputElement>;
  showAdvancedFields: boolean;
  titleSuggestions: TitleSuggestion[];
  isSuggesting: boolean;
  showSuggestions: boolean;
  titleError: string | null;
  authorError: string | null;
  authorWasAutofilled: boolean;
  genreWasAutofilled: boolean;
  isSearching: boolean;
  searchError: string | null;
  coverCandidates: OpenLibraryCandidate[];
  selectedCoverUrl: string | null;
  coverSourceLabel: string;
  hasRemoteCover: boolean;
  hasLocalPhoto: boolean;
  onTitleInput: (value: string) => void;
  onTitleFocus: () => void;
  onTitleBlur: () => void;
  onAuthorInput: (value: string) => void;
  onAuthorFocus: () => void;
  onAuthorBlur: () => void;
  onClearAuthor: () => void;
  onOwnershipStatusChange: (value: "owned" | "wishlist") => void;
  onCoverUrlChange: (value: string) => void;
  onCoverSelect: (candidate: OpenLibraryCandidate) => void;
  onSuggestionSelect: (suggestion: TitleSuggestion) => void;
  onCoverPhotoPick: () => void;
  onRemoveCoverPhoto: () => void;
  onCoverPhotoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleAdvancedDetails: () => void;
}) {
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
    >
      <MobileSectionToggle
        activeSection={activeSection}
        section="core"
        label="Core Info"
        onClick={onSectionChange}
      />
      <div
        id="section-core"
        role="tabpanel"
        className={`${activeSection === "core" ? "block" : "hidden"} px-4 pb-4 pt-4`}
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
                            <div className="truncate font-semibold text-stone-900">
                              {suggestion.title}
                            </div>
                            {suggestion.author || suggestion.year ? (
                              <div className="mt-0.5 text-xs text-stone-500">
                                {suggestion.author}
                                {suggestion.author && suggestion.year ? " • " : ""}
                                {suggestion.year}
                              </div>
                            ) : null}
                            {suggestion.isbn ? (
                              <div className="mt-0.5 text-xs text-stone-400">
                                ISBN: {suggestion.isbn}
                              </div>
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
                <label
                  htmlFor="ownershipStatus"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  Ownership
                </label>
                <p className="mb-2 text-xs text-stone-500">
                  Track whether this belongs in the library or wishlist.
                </p>
                <select
                  id="ownershipStatus"
                  name="ownershipStatus"
                  value={ownershipStatus}
                  onChange={(event) =>
                    onOwnershipStatusChange(event.target.value as "owned" | "wishlist")
                  }
                  className={fieldClassName}
                >
                  <option value="owned">Owned</option>
                  <option value="wishlist">Wishlist</option>
                </select>
              </div>
            </div>

            <aside className="space-y-3 rounded-lg bg-cream/70 p-3 sm:border sm:border-warm-gray">
              <h3 className="text-sm font-semibold text-stone-700">Cover Preview</h3>
              <div className="flex items-start gap-3">
                {hasLocalPhoto ? (
                  <img
                    src={coverPhotoUrl ?? undefined}
                    alt="Local cover preview"
                    width={72}
                    height={108}
                    className="h-[108px] w-[72px] rounded-md object-cover shadow-sm"
                  />
                ) : hasRemoteCover ? (
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    width={72}
                    height={108}
                    loading="lazy"
                    className="h-[108px] w-[72px] rounded-md object-cover shadow-sm"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-[108px] w-[72px] items-center justify-center rounded-md border border-dashed border-warm-gray bg-parchment text-center text-[11px] font-medium text-stone-400">
                    No cover
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                    Source
                  </div>
                  <div className="text-sm font-medium text-stone-700">{coverSourceLabel}</div>
                  {hasRemoteCover ? (
                    <button
                      type="button"
                      onClick={() => onCoverUrlChange("")}
                      className="text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                    >
                      Clear remote cover
                    </button>
                  ) : null}
                  {!hasRemoteCover && !hasLocalPhoto ? (
                    <p className="text-xs text-stone-500">
                      Add a URL, choose a suggestion, or save first to attach a local photo.
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>

          <div className="rounded-lg bg-cream/70 p-3 sm:border sm:border-warm-gray">
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                <Input
                  id="coverUrl"
                  name="coverUrl"
                  label="Cover URL"
                  type="url"
                  value={coverUrl}
                  onChange={(event) => onCoverUrlChange(event.target.value)}
                  placeholder="https://example.com/cover.jpg..."
                  autoComplete="off"
                  inputMode="url"
                  spellCheck={false}
                />
                <p className="mt-2 text-xs text-stone-500">
                  Paste a direct image link when you already have one.
                </p>
                {title.trim() ? (
                  <a
                    href={getGoogleImageSearchUrl(title, author)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 transition-colors hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    Search Google Images
                  </a>
                ) : null}
              </div>

              <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                <h4 className="text-sm font-semibold text-stone-700">Open Library</h4>
                <p className="mt-1 text-xs text-stone-500">
                  Suggestions appear after title and author are filled in.
                </p>
                <div className="mt-3" aria-live="polite">
                  {isSearching ? <div className="text-sm text-stone-500">Searching covers...</div> : null}
                  {searchError && !isSearching ? (
                    <div className="text-sm text-stone-500">{searchError}</div>
                  ) : null}
                  {!isSearching && !searchError && coverCandidates.length > 0 ? (
                    <div>
                      <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-2">
                        {coverCandidates.map((candidate) => {
                          const isSelected = selectedCoverUrl === candidate.coverUrl;

                          return (
                            <button
                              key={candidate.key}
                              type="button"
                              onClick={() => onCoverSelect(candidate)}
                              aria-label={`${
                                isSelected ? "Clear selected cover" : "Select cover"
                              } for ${candidate.title}`}
                              className={`group relative shrink-0 snap-start overflow-hidden rounded-md transition-shadow touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                isSelected
                                  ? "ring-2 ring-emerald-600"
                                  : "ring-1 ring-stone-300 hover:ring-2 hover:ring-stone-400"
                              }`}
                              title={`${candidate.title}${candidate.author ? ` by ${candidate.author}` : ""}`}
                            >
                              <img
                                src={candidate.coverUrl}
                                alt={candidate.title}
                                width={96}
                                height={128}
                                loading="lazy"
                                className="h-32 w-24 object-cover"
                              />
                              {isSelected ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20">
                                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                                    Selected
                                  </span>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-xs text-stone-500">Swipe to see more</div>
                    </div>
                  ) : null}
                  {!isSearching &&
                  !searchError &&
                  coverCandidates.length === 0 &&
                  (!title.trim() || !author.trim()) ? (
                    <div className="text-xs text-stone-500">
                      Enter title and author to search for covers.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                <h4 className="text-sm font-semibold text-stone-700">Local Photo</h4>
                <p className="mt-1 text-xs text-stone-500">
                  Use the device camera for a physical cover.
                </p>
                {showCoverPhotoControls ? (
                  <div className="mt-3">
                    {coverPhotoUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={coverPhotoUrl}
                          alt="Saved local cover preview"
                          width={48}
                          height={64}
                          className="h-16 w-12 rounded object-cover shadow-sm"
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={onCoverPhotoPick}
                            className="inline-flex items-center gap-1.5 rounded-md border border-warm-gray bg-cream px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
                          >
                            <Camera className="h-3 w-3" aria-hidden="true" />
                            Replace Photo
                          </button>
                          <button
                            type="button"
                            onClick={onRemoveCoverPhoto}
                            className="inline-flex text-xs font-medium text-red-600 transition-colors touch-manipulation hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onCoverPhotoPick}
                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors touch-manipulation hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                        Take Cover Photo
                      </button>
                    )}
                    {showCoverSaved ? (
                      <div
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                        aria-live="polite"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Local cover saved
                      </div>
                    ) : null}
                    <input
                      ref={coverPhotoInputRef}
                      name="coverPhoto"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={onCoverPhotoFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-stone-500">
                    Save the book first, then attach a local photo.
                  </p>
                )}
              </div>
            </div>
          </div>

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
      </div>
    </section>
  );
}
