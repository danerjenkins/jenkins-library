import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
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

interface BookFormProps {
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  finished: boolean;
  coverUrl: string;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onIsbnChange: (value: string) => void;
  onFinishedChange: (checked: boolean) => void;
  onCoverUrlChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function BookForm({
  isEditing,
  title,
  author,
  genre,
  isbn,
  finished,
  coverUrl,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
  onIsbnChange,
  onFinishedChange,
  onCoverUrlChange,
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
  const [genreManuallyEdited, setGenreManuallyEdited] = useState(false);

  // Title suggestions state
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>(
    [],
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const titleSuggestRequestIdRef = useRef(0);
  const titleInputRef = useRef<HTMLDivElement>(null);

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
    [author, userHasEditedAuthor, onAuthorChange],
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
    if (!genreWasAutofilled && value.trim().length > 0) {
      setGenreManuallyEdited(true);
    }
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
          setShowSuggestions(suggestions.length > 0);
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
    if (title.trim().length >= 3) {
      debouncedTitleSearch(title);
    } else {
      setTitleSuggestions([]);
      setShowSuggestions(false);
    }
  }, [title, debouncedTitleSearch]);

  // Handle title suggestion selection
  const handleSuggestionSelect = (suggestion: TitleSuggestion) => {
    onTitleChange(suggestion.title);

    // Fill author if not manually edited and suggestion has author
    if (
      !userHasEditedAuthor &&
      author.trim().length === 0 &&
      suggestion.author
    ) {
      onAuthorChange(suggestion.author);
      setAuthorWasAutofilled(true);
    }

    if (suggestion.isbn) {
      onIsbnChange(suggestion.isbn);
    }

    if (!genreManuallyEdited && genre.trim().length === 0) {
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
        <div className="mb-2 text-sm font-medium text-stone-600">
          {children}
        </div>
      )}

      <div ref={titleInputRef} className="relative">
        <Input
          id="title"
          label="Title"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onTitleChange(e.target.value)
          }
          onFocus={() => {
            if (titleSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Enter book title"
          autoFocus
        />

        {isbn && (
          <div className="mt-1 text-xs text-stone-500">ISBN: {isbn}</div>
        )}

        {/* Title suggestions dropdown */}
        {showSuggestions && titleSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-300 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {titleSuggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
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
        <Input
          id="genre"
          label="Genre (optional)"
          type="text"
          value={genre}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleGenreChange(e.target.value)
          }
          placeholder="e.g., Fiction, Non-fiction, Mystery"
        />
        {genreWasAutofilled && genre.trim().length > 0 && (
          <div className="mt-1.5 text-xs text-stone-500">
            Auto-filled from book metadata — please verify
          </div>
        )}
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

        {/* Cover Search Section */}
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-stone-700">
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
            <span className="text-xs text-stone-500">
              Current cover preview
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="finished"
          type="checkbox"
          checked={finished}
          onChange={(e) => onFinishedChange(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
        />
        <label
          htmlFor="finished"
          className="text-sm font-medium text-stone-700"
        >
          I've finished reading this book
        </label>
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
