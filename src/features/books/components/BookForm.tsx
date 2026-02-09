import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Camera, Search } from "lucide-react";
import { Input } from "../../../ui/components/Input";
import { Button } from "../../../ui/components/Button";
import {
  searchCoverCandidates,
  guessAuthorByTitle,
  searchTitleSuggestions,
  type OpenLibraryCandidate,
  type TitleSuggestion,
  predictGenreFromSubjects,
} from "../../../integrations/openLibrary";
import { debounce } from "../../../utils/debounce";
import type { BookFormat } from "../bookTypes";
import {
  BOOK_FORMAT_LABELS,
  COMMON_GENRES,
  getGoogleImageSearchUrl,
} from "../bookTypes";

interface BookFormProps {
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  description: string;
  isbn: string;
  finished: boolean;
  coverUrl: string;
  format: string;
  pages: string;
  readByDane: boolean;
  readByEmma: boolean;
  ownershipStatus: "owned" | "wishlist";
  seriesName: string;
  seriesLabel: string;
  coverPhotoUrl: string | null;
  showCoverSaved: boolean;
  showCoverPhotoControls: boolean;
  coverPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  onCoverPhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverPhotoPick: () => void;
  onRemoveCoverPhoto: () => void;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsbnChange: (value: string) => void;
  onFinishedChange: (checked: boolean) => void;
  onCoverUrlChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  onPagesChange: (value: string) => void;
  onReadByDaneChange: (checked: boolean) => void;
  onReadByEmmaChange: (checked: boolean) => void;
  onOwnershipStatusChange: (value: "owned" | "wishlist") => void;
  onSeriesNameChange: (value: string) => void;
  onSeriesLabelChange: (value: string) => void;
  onClearSeries: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function BookForm({
  isEditing,
  title,
  author,
  genre,
  description,
  isbn,
  coverUrl,
  format,
  pages,
  readByDane,
  readByEmma,
  ownershipStatus,
  seriesName,
  seriesLabel,
  coverPhotoUrl,
  showCoverSaved,
  showCoverPhotoControls,
  coverPhotoInputRef,
  onCoverPhotoFileChange,
  onCoverPhotoPick,
  onRemoveCoverPhoto,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
  onDescriptionChange,
  onIsbnChange,
  onCoverUrlChange,
  onFormatChange,
  onPagesChange,
  onReadByDaneChange,
  onReadByEmmaChange,
  onOwnershipStatusChange,
  onSeriesNameChange,
  onSeriesLabelChange,
  onClearSeries,
  onSubmit,
  onCancel,
  children,
}: BookFormProps) {
  const [coverCandidates, setCoverCandidates] = useState<
    OpenLibraryCandidate[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Author autofill state
  const [authorWasAutofilled, setAuthorWasAutofilled] = useState(false);
  const [userHasEditedAuthor, setUserHasEditedAuthor] = useState(false);
  const authorGuessRequestIdRef = useRef(0);

  // Genre autofill state
  const [genreWasAutofilled, setGenreWasAutofilled] = useState(false);

  // Title suggestions state
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>(
    [],
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const titleSuggestRequestIdRef = useRef(0);
  const suggestionJustSelectedRef = useRef(false);
  const titleInputRef = useRef<HTMLDivElement>(null);
  const authorFieldFocusedRef = useRef(false);
  const [titleWasEdited, setTitleWasEdited] = useState(false);
  const initialTitleRef = useRef<string>(title);

  const performSearch = useCallback(
    async (searchTitle: string, searchAuthor: string) => {
      if (!searchTitle.trim() || !searchAuthor.trim()) {
        setCoverCandidates([]);
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setIsSearching(true);
      setSearchError(null);

      try {
        const candidates = await searchCoverCandidates({
          title: searchTitle,
          author: searchAuthor,
        });

        // Ignore stale responses
        if (currentRequestId === requestIdRef.current) {
          setCoverCandidates(candidates);
          if (candidates.length === 0) {
            setSearchError("No covers found. Try adjusting title/author.");
          }
        }
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          setSearchError("Failed to search covers. Please try again.");
          setCoverCandidates([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    },
    [],
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTitle: string, searchAuthor: string) => {
      performSearch(searchTitle, searchAuthor);
    }, 700),
    [performSearch],
  );

  // Auto-search when title or author changes
  useEffect(() => {
    if (title.trim() && author.trim()) {
      debouncedSearch(title, author);
    } else {
      setCoverCandidates([]);
      setSearchError(null);
    }
  }, [title, author, debouncedSearch]);

  const handleCoverSelect = (candidate: OpenLibraryCandidate) => {
    const isSelected =
      selectedCoverUrl === candidate.coverUrl ||
      coverUrl === candidate.coverUrl;

    if (isSelected) {
      onCoverUrlChange("");
      setSelectedCoverUrl(null);
      return;
    }

    onCoverUrlChange(candidate.coverUrl);
    setSelectedCoverUrl(candidate.coverUrl);
  };

  const handleManualSearch = () => {
    performSearch(title, author);
  };

  // Author autofill logic
  const performAuthorGuess = useCallback(
    async (searchTitle: string) => {
      if (
        !isEditing ||
        !searchTitle.trim() ||
        searchTitle.trim().length < 4 ||
        userHasEditedAuthor ||
        author.trim().length > 0
      ) {
        return;
      }

      const currentRequestId = ++authorGuessRequestIdRef.current;

      try {
        const result = await guessAuthorByTitle(searchTitle);

        // Ignore stale responses
        if (
          currentRequestId === authorGuessRequestIdRef.current &&
          result &&
          !userHasEditedAuthor &&
          author.trim().length === 0
        ) {
          onAuthorChange(result.author);
          setAuthorWasAutofilled(true);
        }
      } catch (error) {
        console.error("Failed to guess author:", error);
      }
    },
    [author, userHasEditedAuthor, onAuthorChange, isEditing],
  );

  // Debounced author guess
  const debouncedAuthorGuess = useCallback(
    debounce((searchTitle: string) => {
      performAuthorGuess(searchTitle);
    }, 700),
    [performAuthorGuess],
  );

  // Auto-guess author when title changes
  useEffect(() => {
    if (
      title.trim().length >= 4 &&
      !userHasEditedAuthor &&
      author.trim().length === 0
    ) {
      debouncedAuthorGuess(title);
    }
  }, [title, userHasEditedAuthor, author, debouncedAuthorGuess]);

  // Track when user manually edits author
  const handleAuthorChange = (value: string) => {
    if (!authorWasAutofilled && value.trim().length > 0) {
      setUserHasEditedAuthor(true);
    }
    if (authorWasAutofilled && value !== author) {
      setAuthorWasAutofilled(false);
    }
    onAuthorChange(value);
  };

  const handleGenreChange = (value: string) => {
    if (genreWasAutofilled && value !== genre) {
      setGenreWasAutofilled(false);
    }
    onGenreChange(value);
  };

  const handleClearAuthor = () => {
    onAuthorChange("");
    setAuthorWasAutofilled(false);
    setUserHasEditedAuthor(false);
  };

  // Title suggestions logic
  const performTitleSearch = useCallback(
    async (searchTitle: string) => {
      if (searchTitle.trim().length < 3) {
        setTitleSuggestions([]);
        return;
      }

      const currentRequestId = ++titleSuggestRequestIdRef.current;
      setIsSuggesting(true);

      try {
        const suggestions = await searchTitleSuggestions(searchTitle, author);

        // Ignore stale responses
        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setTitleSuggestions(suggestions);
          // Only show suggestions if we didn't just select one
          if (!suggestionJustSelectedRef.current) {
            setShowSuggestions(suggestions.length > 0);
          }
          // Reset the flag after processing
          suggestionJustSelectedRef.current = false;
        }
      } catch (error) {
        console.error("Failed to search title suggestions:", error);
        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setTitleSuggestions([]);
        }
      } finally {
        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setIsSuggesting(false);
        }
      }
    },
    [author],
  );

  // Debounced title search
  const debouncedTitleSearch = useCallback(
    debounce((searchTitle: string) => {
      performTitleSearch(searchTitle);
    }, 600),
    [performTitleSearch],
  );

  // Auto-search titles when title changes
  useEffect(() => {
    if (title.trim().length >= 3 && (!isEditing || titleWasEdited)) {
      debouncedTitleSearch(title);
    } else {
      setTitleSuggestions([]);
      setShowSuggestions(false);
    }
  }, [title, debouncedTitleSearch, isEditing, titleWasEdited]);

  useEffect(() => {
    if (isEditing) {
      initialTitleRef.current = title;
      setTitleWasEdited(false);
    }
  }, [isEditing, title]);

  // Handle title suggestion selection
  const handleSuggestionSelect = (suggestion: TitleSuggestion) => {
    suggestionJustSelectedRef.current = true;
    onTitleChange(suggestion.title);
    setTitleWasEdited(true);

    // Fill author from suggestion (clear previous edit flag to allow autofill)
    if (suggestion.author) {
      onAuthorChange(suggestion.author);
      setAuthorWasAutofilled(true);
      setUserHasEditedAuthor(false);
    }

    if (suggestion.isbn) {
      onIsbnChange(suggestion.isbn);
    }

    // Fill genre from subjects
    if (suggestion.subjects) {
      const predicted = predictGenreFromSubjects(suggestion.subjects);
      if (predicted) {
        onGenreChange(predicted);
        setGenreWasAutofilled(true);
      }
    }

    setShowSuggestions(false);
  };

  // Close suggestions on escape or outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        titleInputRef.current &&
        !titleInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <form
      className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
      onSubmit={onSubmit}
    >
      {children && (
        <div className="font-sans mb-2 text-sm font-medium text-stone-600">
          {children}
        </div>
      )}

      <div ref={titleInputRef} className="relative">
        <Input
          id="title"
          label="Title"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const nextTitle = e.target.value;
            const hasMeaningfulChange =
              nextTitle.trim() !== initialTitleRef.current.trim();
            if (hasMeaningfulChange) {
              setTitleWasEdited(true);
            }
            onTitleChange(nextTitle);
          }}
          onFocus={() => {
            if (
              titleSuggestions.length > 0 &&
              !authorFieldFocusedRef.current &&
              (!isEditing || titleWasEdited)
            ) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Enter book title"
          autoFocus
        />

        {isbn && (
          <div className="mt-1 text-xs text-stone-500">ISBN: {isbn}</div>
        )}

        {isSuggesting && (
          <div className="mt-1 text-xs text-stone-500">Searching titles...</div>
        )}
      </div>

      <div>
        <Input
          id="author"
          label="Author"
          type="text"
          value={author}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleAuthorChange(e.target.value)
          }
          onFocus={() => {
            authorFieldFocusedRef.current = true;
            setShowSuggestions(false);
          }}
          onBlur={() => {
            authorFieldFocusedRef.current = false;
          }}
          placeholder="Enter author name"
        />
        {authorWasAutofilled && author.trim().length > 0 && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-500">
            <span>Auto-filled from title — please verify</span>
            <button
              type="button"
              onClick={handleClearAuthor}
              className="text-stone-600 underline hover:text-stone-900"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="seriesName"
            label="Series name (optional)"
            type="text"
            value={seriesName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSeriesNameChange(e.target.value)
            }
            placeholder="Enter series name"
          />
          <Input
            id="seriesLabel"
            label="# in series (optional)"
            type="text"
            value={seriesLabel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSeriesLabelChange(e.target.value)
            }
            placeholder="e.g. 2 or 2.5"
          />
        </div>
        {(seriesName.trim() || seriesLabel.trim()) && (
          <div className="mt-2">
            <button
              type="button"
              onClick={onClearSeries}
              className="text-xs font-medium text-stone-600 underline hover:text-stone-900"
            >
              Clear series
            </button>
          </div>
        )}
      </div>

      {/* Title suggestions dropdown - positioned after author field */}
      {showSuggestions && titleSuggestions.length > 0 && (
        <div className="relative -mt-2">
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-300 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {titleSuggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionSelect(suggestion);
                  }}
                  className="flex w-full items-start gap-3 border-b border-stone-100 px-3 py-2 text-left transition hover:bg-stone-50 last:border-b-0"
                >
                  {suggestion.coverUrl && (
                    <img
                      src={suggestion.coverUrl}
                      alt=""
                      className="h-12 w-8 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-900 truncate">
                      {suggestion.title}
                    </div>
                    {(suggestion.author || suggestion.year) && (
                      <div className="mt-0.5 text-xs text-stone-500">
                        {suggestion.author}
                        {suggestion.author && suggestion.year && " • "}
                        {suggestion.year}
                      </div>
                    )}
                    {suggestion.isbn && (
                      <div className="mt-0.5 text-xs text-stone-400">
                        ISBN: {suggestion.isbn}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-500">
              Suggested results from Open Library
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="genre"
          className="text-sm font-medium text-stone-700 block mb-1"
        >
          Genre (optional)
        </label>
        <div className="space-y-2">
          <select
            id="genre"
            value={genre}
            onChange={(e) => {
              const newGenre = e.target.value;
              handleGenreChange(newGenre);
            }}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          >
            <option value="">— Select or enter custom</option>
            {COMMON_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={genre}
            onChange={(e) => handleGenreChange(e.target.value)}
            placeholder="Or type a custom genre"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
        {genreWasAutofilled && genre.trim().length > 0 && (
          <div className="mt-1.5 text-xs text-stone-500">
            Auto-filled from book metadata — please verify
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-medium text-stone-700 block mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 min-h-25 resize-y"
          placeholder="Enter book description or summary"
        />
      </div>

      <div>
        <label
          htmlFor="format"
          className="text-sm font-medium text-stone-700 block mb-1"
        >
          Format (optional)
        </label>
        <select
          id="format"
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
        >
          <option value="">— Unknown</option>
          {(Object.keys(BOOK_FORMAT_LABELS) as BookFormat[]).map((fmt) => (
            <option key={fmt} value={fmt}>
              {BOOK_FORMAT_LABELS[fmt]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="pages"
          className="text-sm font-medium text-stone-700 block mb-1"
        >
          Pages (optional)
        </label>
        <input
          id="pages"
          type="number"
          min="1"
          step="1"
          value={pages}
          onChange={(e) => onPagesChange(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          placeholder="Enter page count"
        />
      </div>

      <div>
        <Input
          id="coverUrl"
          label="Cover Image URL (optional)"
          type="text"
          value={coverUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onCoverUrlChange(e.target.value)
          }
          placeholder="https://example.com/cover.jpg"
        />

        {/* Google Images Search Link */}
        {title.trim() && (
          <div className="mt-2">
            <a
              href={getGoogleImageSearchUrl(title, author)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition"
            >
              <Search className="h-3.5 w-3.5" />
              Search cover on Google
            </a>
          </div>
        )}

        {/* Cover Search Section */}
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-sans text-sm font-semibold text-stone-700">
              Cover Suggestions
            </h4>
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={!title.trim() || !author.trim() || isSearching}
              className="flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-3 w-3" />
              Find covers
            </button>
          </div>

          {isSearching && (
            <div className="mt-3 text-center text-sm text-stone-500">
              Searching...
            </div>
          )}

          {searchError && !isSearching && (
            <div className="mt-3 text-center text-sm text-stone-500">
              {searchError}
            </div>
          )}

          {!isSearching && !searchError && coverCandidates.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {coverCandidates.map((candidate) => (
                <button
                  key={candidate.key}
                  type="button"
                  onClick={() => handleCoverSelect(candidate)}
                  className={`group relative overflow-hidden rounded-md transition ${
                    selectedCoverUrl === candidate.coverUrl ||
                    coverUrl === candidate.coverUrl
                      ? "ring-2 ring-emerald-600"
                      : "ring-1 ring-stone-300 hover:ring-2 hover:ring-stone-400"
                  }`}
                  title={`${candidate.title}${candidate.author ? ` by ${candidate.author}` : ""}`}
                >
                  <img
                    src={candidate.coverUrl}
                    alt={candidate.title}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                  {(selectedCoverUrl === candidate.coverUrl ||
                    coverUrl === candidate.coverUrl) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20">
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Selected
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSearching &&
            !searchError &&
            coverCandidates.length === 0 &&
            (!title.trim() || !author.trim()) && (
              <div className="mt-3 text-center text-xs text-stone-500">
                Enter title and author to search for covers
              </div>
            )}
        </div>

        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-sans text-sm font-semibold text-stone-700">
              Cover Photo
            </h4>
          </div>
          {showCoverPhotoControls ? (
            <div className="mt-2">
              {coverPhotoUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={coverPhotoUrl}
                    alt="Cover preview"
                    className="h-16 w-12 rounded object-cover shadow-sm"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onCoverPhotoPick}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 border border-stone-300 transition hover:bg-stone-50"
                    >
                      <Camera className="h-3 w-3" />
                      Replace Photo
                    </button>
                    <button
                      type="button"
                      onClick={onRemoveCoverPhoto}
                      className="inline-flex text-xs font-medium text-red-600 hover:text-red-700 transition"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onCoverPhotoPick}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 border border-amber-200 transition hover:bg-amber-100"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Take Cover Photo
                </button>
              )}
              {showCoverSaved && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Cover saved
                </div>
              )}
              <input
                ref={coverPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onCoverPhotoFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="mt-2 text-xs text-stone-500">
              Save the book first to add a photo.
            </div>
          )}
        </div>

        {coverUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={coverUrl}
              alt="Cover preview"
              className="h-24 w-16 rounded object-cover shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-stone-500">
                Current cover preview
              </span>
              <button
                type="button"
                onClick={() => {
                  onCoverUrlChange("");
                  setSelectedCoverUrl(null);
                }}
                className="text-xs font-medium text-stone-600 hover:text-stone-800"
              >
                Clear cover
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50/50 p-3">
        <h4 className="text-sm font-semibold text-stone-700">Ownership</h4>
        <label htmlFor="ownershipStatus" className="text-xs text-stone-500">
          Track whether the book is in your library or wishlist.
        </label>
        <select
          id="ownershipStatus"
          value={ownershipStatus}
          onChange={(e) =>
            onOwnershipStatusChange(e.target.value as "owned" | "wishlist")
          }
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
        >
          <option value="owned">Owned</option>
          <option value="wishlist">Wishlist</option>
        </select>
      </div>

      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50/50 p-3">
        <h4 className="text-sm font-semibold text-stone-700">Read Status</h4>
        <div className="flex items-center gap-2">
          <input
            id="readByDane"
            type="checkbox"
            checked={readByDane}
            onChange={(e) => onReadByDaneChange(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
          />
          <label
            htmlFor="readByDane"
            className="text-sm font-medium text-stone-700"
          >
            Read by Dane
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="readByEmma"
            type="checkbox"
            checked={readByEmma}
            onChange={(e) => onReadByEmmaChange(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
          />
          <label
            htmlFor="readByEmma"
            className="text-sm font-medium text-stone-700"
          >
            Read by Emma
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant="success"
          disabled={!title.trim() || !author.trim()}
        >
          {isEditing ? "Update Book" : "Add Book"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
