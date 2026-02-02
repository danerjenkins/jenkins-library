import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "../../../ui/components/Input";
import { Button } from "../../../ui/components/Button";
import {
  searchCoverCandidates,
  type OpenLibraryCandidate,
} from "../../../integrations/openLibrary";
import { debounce } from "../../../utils/debounce";

interface BookFormProps {
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  finished: boolean;
  coverUrl: string;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onGenreChange: (value: string) => void;
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
  finished,
  coverUrl,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
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

      <Input
        id="title"
        label="Title"
        type="text"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onTitleChange(e.target.value)
        }
        placeholder="Enter book title"
        autoFocus
      />

      <Input
        id="author"
        label="Author"
        type="text"
        value={author}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onAuthorChange(e.target.value)
        }
        placeholder="Enter author name"
      />

      <Input
        id="genre"
        label="Genre (optional)"
        type="text"
        value={genre}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onGenreChange(e.target.value)
        }
        placeholder="e.g., Fiction, Non-fiction, Mystery"
      />

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
            <span className="text-xs text-stone-500">Current cover preview</span>
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
