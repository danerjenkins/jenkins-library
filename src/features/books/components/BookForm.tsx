import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ChevronDown, Search, Trash2 } from "lucide-react";
import { Input } from "../../../ui/components/Input";
import { Button } from "../../../ui/components/Button";
import {
  guessAuthorByTitle,
  predictGenreFromSubjects,
  searchCoverCandidates,
  searchTitleSuggestions,
  type OpenLibraryCandidate,
  type TitleSuggestion,
} from "../../../integrations/openLibrary";
import { debounce } from "../../../utils/debounce";
import type { BookFormat } from "../bookTypes";
import { BOOK_FORMAT_LABELS, getGoogleImageSearchUrl } from "../bookTypes";
import {
  createBookFormSnapshot,
  type BookFormSnapshot,
  serializeBookFormSnapshot,
} from "../bookFormState";

const EDIT_BOOK_GENRES = [
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
];

const sectionButtonBase =
  "rounded px-3 py-1 text-xs font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

const fieldClassName =
  "w-full rounded-lg border border-warm-gray bg-cream px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";

const unsavedChangesDefaultMessage =
  "You have unsaved changes. Leave this form without saving?";

export type BookFormSaveState = "idle" | "saving" | "success" | "error";

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
  coverPhotoInputRef: RefObject<HTMLInputElement | null>;
  saveState?: BookFormSaveState;
  saveMessage?: string | null;
  saveSignal?: number | string | null;
  formInstanceKey?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
  unsavedChangesMessage?: string;
  onCoverPhotoFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}

type BookFormSection = "core" | "reading" | "meta";

interface SectionTabButtonProps {
  activeSection: BookFormSection;
  section: BookFormSection;
  label: string;
  onClick: (section: BookFormSection) => void;
}

function SectionTabButton({
  activeSection,
  section,
  label,
  onClick,
}: SectionTabButtonProps) {
  const isActive = activeSection === section;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`section-${section}`}
      onClick={() => onClick(section)}
      className={`${sectionButtonBase} ${
        isActive
          ? "bg-sage text-white"
          : "text-charcoal/70 hover:bg-warm-gray-light"
      }`}
    >
      {label}
    </button>
  );
}

interface MobileSectionToggleProps {
  activeSection: BookFormSection;
  section: BookFormSection;
  label: string;
  onClick: (section: BookFormSection) => void;
}

function MobileSectionToggle({
  activeSection,
  section,
  label,
  onClick,
}: MobileSectionToggleProps) {
  const isActive = activeSection === section;

  return (
    <button
      type="button"
      onClick={() => onClick(section)}
      aria-controls={`section-${section}`}
      aria-expanded={isActive}
      className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-stone-700 transition-colors touch-manipulation hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-300 sm:hidden"
    >
      <span>{label}</span>
      <span className="text-xs text-stone-500">{isActive ? "Open" : "Closed"}</span>
    </button>
  );
}

export function BookForm({
  isEditing,
  title,
  author,
  genre,
  description,
  isbn,
  finished,
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
  saveState = "idle",
  saveMessage = null,
  saveSignal = null,
  formInstanceKey = null,
  onDirtyChange,
  unsavedChangesMessage = unsavedChangesDefaultMessage,
  onCoverPhotoFileChange,
  onCoverPhotoPick,
  onRemoveCoverPhoto,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
  onDescriptionChange,
  onIsbnChange,
  onFinishedChange,
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
  onDelete,
  children,
}: BookFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleFieldRef = useRef<HTMLDivElement>(null);
  const coreSectionRef = useRef<HTMLElement>(null);
  const readingSectionRef = useRef<HTMLElement>(null);
  const metaSectionRef = useRef<HTMLElement>(null);
  const requestIdRef = useRef(0);
  const authorGuessRequestIdRef = useRef(0);
  const titleSuggestRequestIdRef = useRef(0);
  const suggestionJustSelectedRef = useRef(false);
  const authorFieldFocusedRef = useRef(false);
  const titleTimeoutRef = useRef<number | null>(null);
  const initialTitleRef = useRef(title);
  const latestSessionStateRef = useRef({
    snapshot: createBookFormSnapshot({
      title,
      author,
      genre,
      description,
      isbn,
      finished,
      coverUrl,
      coverPhotoUrl,
      format,
      pages,
      readByDane,
      readByEmma,
      ownershipStatus,
      seriesName,
      seriesLabel,
    }),
    title,
    author,
    coverUrl,
  });

  const [coverCandidates, setCoverCandidates] = useState<OpenLibraryCandidate[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(
    coverUrl || null,
  );
  const [activeSection, setActiveSection] = useState<BookFormSection>("core");
  const [showAdvancedFields, setShowAdvancedFields] = useState(isEditing);
  const [showValidation, setShowValidation] = useState(false);

  const [authorWasAutofilled, setAuthorWasAutofilled] = useState(false);
  const [userHasEditedAuthor, setUserHasEditedAuthor] = useState(
    Boolean(author.trim()),
  );
  const [genreWasAutofilled, setGenreWasAutofilled] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [titleWasEdited, setTitleWasEdited] = useState(false);
  const [pendingSectionFocus, setPendingSectionFocus] =
    useState<BookFormSection | null>(null);

  const currentSnapshot = useMemo(
    () =>
      createBookFormSnapshot({
        title,
        author,
        genre,
        description,
        isbn,
        finished,
        coverUrl,
        coverPhotoUrl,
        format,
        pages,
        readByDane,
        readByEmma,
        ownershipStatus,
        seriesName,
        seriesLabel,
      }),
    [
      author,
      coverPhotoUrl,
      coverUrl,
      description,
      finished,
      format,
      genre,
      isbn,
      ownershipStatus,
      pages,
      readByDane,
      readByEmma,
      seriesLabel,
      seriesName,
      title,
    ],
  );
  const currentSnapshotKey = useMemo(
    () => serializeBookFormSnapshot(currentSnapshot),
    [currentSnapshot],
  );
  const baselineSnapshotRef = useRef<BookFormSnapshot>(currentSnapshot);

  const titleError =
    showValidation && !title.trim()
      ? "Add a title before you save this book."
      : null;
  const authorError =
    showValidation && !author.trim()
      ? "Add an author before you save this book."
      : null;

  const hasMeaningfulChanges =
    serializeBookFormSnapshot(baselineSnapshotRef.current) !== currentSnapshotKey;
  const hasRemoteCover = Boolean(coverUrl.trim());
  const hasLocalPhoto = Boolean(coverPhotoUrl);
  const coverSourceLabel = hasLocalPhoto
    ? "Local photo"
    : hasRemoteCover
      ? coverCandidates.some((candidate) => candidate.coverUrl === coverUrl)
        ? "Open Library suggestion"
        : "Cover URL"
      : "No cover selected";
  const submitLabel = saveState === "saving"
    ? "Saving…"
    : isEditing
      ? "Update Book"
      : "Add Book";

  const resetFormBaseline = useCallback(() => {
    baselineSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot]);

  useEffect(() => {
    latestSessionStateRef.current = {
      snapshot: currentSnapshot,
      title,
      author,
      coverUrl,
    };
  }, [author, coverUrl, currentSnapshot, title]);

  useEffect(() => {
    const latestSessionState = latestSessionStateRef.current;

    baselineSnapshotRef.current = latestSessionState.snapshot;
    initialTitleRef.current = latestSessionState.title;
    setActiveSection("core");
    setShowAdvancedFields(isEditing);
    setShowValidation(false);
    setSelectedCoverUrl(latestSessionState.coverUrl.trim() || null);
    setShowSuggestions(false);
    setAuthorWasAutofilled(false);
    setGenreWasAutofilled(false);
    setTitleWasEdited(false);
    setUserHasEditedAuthor(Boolean(latestSessionState.author.trim()));
  }, [formInstanceKey, isEditing]);

  useEffect(() => {
    if (saveState === "success") {
      resetFormBaseline();
    }
  }, [resetFormBaseline, saveSignal, saveState]);

  useEffect(() => {
    if (!showCoverSaved) {
      return;
    }

    baselineSnapshotRef.current = {
      ...baselineSnapshotRef.current,
      coverPhotoUrl: currentSnapshot.coverPhotoUrl,
      coverUrl: currentSnapshot.coverUrl,
    };
  }, [currentSnapshot.coverPhotoUrl, currentSnapshot.coverUrl, showCoverSaved]);

  useEffect(() => {
    onDirtyChange?.(hasMeaningfulChanges);
  }, [hasMeaningfulChanges, onDirtyChange]);

  useEffect(() => {
    if (!hasMeaningfulChanges) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = unsavedChangesMessage;
      return unsavedChangesMessage;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasMeaningfulChanges, unsavedChangesMessage]);

  useEffect(() => {
    setSelectedCoverUrl(coverUrl.trim() || null);
  }, [coverUrl]);

  useEffect(() => {
    if (!pendingSectionFocus) {
      return;
    }

    const sectionElements: Record<
      BookFormSection,
      {
        panel: HTMLElement | null;
      }
    > = {
      core: {
        panel: coreSectionRef.current,
      },
      reading: {
        panel: readingSectionRef.current,
      },
      meta: {
        panel: metaSectionRef.current,
      },
    };

    const nextSection = sectionElements[pendingSectionFocus];
    if (!nextSection.panel) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      nextSection.panel?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      nextSection.panel?.focus({ preventScroll: true });
      setPendingSectionFocus(null);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [pendingSectionFocus]);

  const performSearch = useCallback(
    async (searchTitle: string, searchAuthor: string) => {
      if (!searchTitle.trim() || !searchAuthor.trim()) {
        setCoverCandidates([]);
        setSearchError(null);
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

        if (currentRequestId === requestIdRef.current) {
          setCoverCandidates(candidates);
          if (candidates.length === 0) {
            setSearchError("No covers found yet. Try adjusting the title or author.");
          }
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setSearchError("Cover lookup failed. Try again in a moment.");
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

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTitle: string, searchAuthor: string) => {
        void performSearch(searchTitle, searchAuthor);
      }, 700),
    [performSearch],
  );

  useEffect(() => {
    if (title.trim() && author.trim()) {
      debouncedSearch(title, author);
      return;
    }

    setCoverCandidates([]);
    setSearchError(null);
  }, [author, debouncedSearch, title]);

  const handleCoverSelect = (candidate: OpenLibraryCandidate) => {
    const isSelected = selectedCoverUrl === candidate.coverUrl;

    if (isSelected) {
      onCoverUrlChange("");
      setSelectedCoverUrl(null);
      return;
    }

    onCoverUrlChange(candidate.coverUrl);
    setSelectedCoverUrl(candidate.coverUrl);
  };

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
    [author, onAuthorChange, userHasEditedAuthor],
  );

  const debouncedAuthorGuess = useMemo(
    () =>
      debounce((searchTitle: string) => {
        void performAuthorGuess(searchTitle);
      }, 700),
    [performAuthorGuess],
  );

  useEffect(() => {
    if (
      title.trim().length >= 4 &&
      !userHasEditedAuthor &&
      author.trim().length === 0
    ) {
      debouncedAuthorGuess(title);
    }
  }, [author, debouncedAuthorGuess, title, userHasEditedAuthor]);

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

  const performTitleSearch = useCallback(
    async (searchTitle: string) => {
      if (searchTitle.trim().length < 3) {
        setTitleSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const currentRequestId = ++titleSuggestRequestIdRef.current;
      setIsSuggesting(true);

      try {
        const suggestions = await searchTitleSuggestions(searchTitle, author);

        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setTitleSuggestions(suggestions);
          if (!suggestionJustSelectedRef.current) {
            setShowSuggestions(suggestions.length > 0);
          }
          suggestionJustSelectedRef.current = false;
        }
      } catch (error) {
        console.error("Failed to search title suggestions:", error);
        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setTitleSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (currentRequestId === titleSuggestRequestIdRef.current) {
          setIsSuggesting(false);
        }
      }
    },
    [author],
  );

  const debouncedTitleSearch = useMemo(
    () =>
      debounce((searchTitle: string) => {
        void performTitleSearch(searchTitle);
      }, 600),
    [performTitleSearch],
  );

  useEffect(() => {
    if (title.trim().length >= 3 && (!isEditing || titleWasEdited)) {
      debouncedTitleSearch(title);
      return;
    }

    setTitleSuggestions([]);
    setShowSuggestions(false);
  }, [debouncedTitleSearch, isEditing, title, titleWasEdited]);

  const handleSuggestionSelect = (suggestion: TitleSuggestion) => {
    suggestionJustSelectedRef.current = true;
    onTitleChange(suggestion.title);
    setTitleWasEdited(true);

    if (suggestion.author) {
      onAuthorChange(suggestion.author);
      setAuthorWasAutofilled(true);
      setUserHasEditedAuthor(false);
    }

    if (suggestion.isbn) {
      onIsbnChange(suggestion.isbn);
    }

    if (suggestion.subjects) {
      const predictedGenre = predictGenreFromSubjects(suggestion.subjects);
      if (predictedGenre) {
        onGenreChange(predictedGenre);
        setGenreWasAutofilled(true);
      }
    }

    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleFieldRef.current &&
        !titleFieldRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  const handleSectionChange = (section: BookFormSection) => {
    setActiveSection(section);
    setPendingSectionFocus(section);
  };

  const handleCancel = () => {
    if (hasMeaningfulChanges && !window.confirm(unsavedChangesMessage)) {
      return;
    }

    onCancel();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setShowValidation(true);

    if (!title.trim() || !author.trim()) {
      event.preventDefault();
      const firstInvalidField =
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']") ??
        null;
      firstInvalidField?.focus();
      return;
    }

    onSubmit(event);
  };

  const handleTitleBlur = () => {
    if (titleTimeoutRef.current) {
      window.clearTimeout(titleTimeoutRef.current);
    }
    titleTimeoutRef.current = window.setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) {
        window.clearTimeout(titleTimeoutRef.current);
      }
    };
  }, []);

  const shouldShowAdvancedSections = isEditing || showAdvancedFields;

  return (
    <form
      ref={formRef}
      className="grid gap-4 rounded-xl border border-warm-gray bg-cream p-4 pb-24 shadow-sm"
      onSubmit={handleFormSubmit}
    >
      {children && (
        <div className="mb-1 hidden font-sans text-sm font-medium text-stone-600 sm:block">
          {children}
        </div>
      )}

      <div
        className="rounded-lg border border-warm-gray bg-parchment/80 p-3 sm:rounded-xl sm:p-4"
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
          <div className="self-start rounded-full border border-warm-gray bg-cream px-3 py-1 text-xs font-medium text-stone-600">
            {coverSourceLabel}
          </div>
        </div>

        {saveMessage && (
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
        )}
      </div>

      {shouldShowAdvancedSections && (
        <div
          className="hidden gap-1 self-start rounded-lg border border-warm-gray p-1 sm:flex"
          role="tablist"
          aria-label="Book form sections"
        >
          <SectionTabButton
            activeSection={activeSection}
            section="core"
            label="Core Info"
            onClick={handleSectionChange}
          />
          <SectionTabButton
            activeSection={activeSection}
            section="reading"
            label="Reading Status"
            onClick={handleSectionChange}
          />
          <SectionTabButton
            activeSection={activeSection}
            section="meta"
            label="Description & Metadata"
            onClick={handleSectionChange}
          />
        </div>
      )}

      <section
        ref={coreSectionRef}
        tabIndex={-1}
        className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
      >
        <MobileSectionToggle
          activeSection={activeSection}
          section="core"
          label="Core Info"
          onClick={handleSectionChange}
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
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const nextTitle = event.target.value;
                      if (
                        nextTitle.trim() !== initialTitleRef.current.trim()
                      ) {
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
                    onBlur={handleTitleBlur}
                    placeholder="The Hobbit…"
                    autoComplete="off"
                  />
                  {isSuggesting && (
                    <div className="mt-1 text-xs text-stone-500" aria-live="polite">
                      Searching titles…
                    </div>
                  )}
                  {titleError && (
                    <p id="title-error" className="mt-1 text-xs text-rose-600">
                      {titleError}
                    </p>
                  )}
                  {showSuggestions && titleSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full rounded-lg border border-warm-gray bg-cream shadow-lg">
                      <div className="max-h-64 overflow-y-auto">
                        {titleSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.key}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleSuggestionSelect(suggestion);
                            }}
                            className="flex w-full items-start gap-3 border-b border-warm-gray px-3 py-2 text-left transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage/30 last:border-b-0"
                          >
                            {suggestion.coverUrl && (
                              <img
                                src={suggestion.coverUrl}
                                alt=""
                                width={32}
                                height={48}
                                loading="lazy"
                                className="h-12 w-8 shrink-0 rounded object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-stone-900">
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
                      <div className="border-t border-warm-gray bg-parchment px-3 py-1.5 text-xs text-stone-500">
                        Suggested results from Open Library
                      </div>
                    </div>
                  )}
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
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleAuthorChange(event.target.value)
                    }
                    onFocus={() => {
                      authorFieldFocusedRef.current = true;
                      setShowSuggestions(false);
                    }}
                    onBlur={() => {
                      authorFieldFocusedRef.current = false;
                    }}
                    placeholder="Ursula K. Le Guin…"
                    autoComplete="off"
                  />
                  {authorError && (
                    <p id="author-error" className="mt-1 text-xs text-rose-600">
                      {authorError}
                    </p>
                  )}
                  {authorWasAutofilled && author.trim().length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-500">
                      <span>Auto-filled from title. Verify it before saving.</span>
                      <button
                        type="button"
                        onClick={handleClearAuthor}
                        className="text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}
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
                      onOwnershipStatusChange(
                        event.target.value as "owned" | "wishlist",
                      )
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
                    <div className="text-sm font-medium text-stone-700">
                      {coverSourceLabel}
                    </div>
                    {hasRemoteCover && (
                      <button
                        type="button"
                        onClick={() => {
                          onCoverUrlChange("");
                          setSelectedCoverUrl(null);
                        }}
                        className="text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                      >
                        Clear remote cover
                      </button>
                    )}
                    {!hasRemoteCover && !hasLocalPhoto && (
                      <p className="text-xs text-stone-500">
                        Add a URL, choose a suggestion, or save first to attach a local photo.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <div className="rounded-lg bg-cream/70 p-3 sm:border sm:border-warm-gray">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-stone-700">
                    Cover Sources
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    Pick one source. A local photo replaces a remote cover after it saves.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                  <Input
                    id="coverUrl"
                    name="coverUrl"
                    label="Cover URL"
                    type="url"
                    value={coverUrl}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      onCoverUrlChange(event.target.value)
                    }
                    placeholder="https://example.com/cover.jpg…"
                    autoComplete="off"
                    inputMode="url"
                    spellCheck={false}
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Paste a direct image link when you already have one.
                  </p>
                  {title.trim() && (
                    <a
                      href={getGoogleImageSearchUrl(title, author)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 transition-colors hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      <Search className="h-3.5 w-3.5" aria-hidden="true" />
                      Search Google Images
                    </a>
                  )}
                </div>

                <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                  <h4 className="text-sm font-semibold text-stone-700">
                    Open Library
                  </h4>
                  <p className="mt-1 text-xs text-stone-500">
                    Suggestions appear after title and author are filled in.
                  </p>
                  <div className="mt-3" aria-live="polite">
                    {isSearching && (
                      <div className="text-sm text-stone-500">Searching covers…</div>
                    )}
                    {searchError && !isSearching && (
                      <div className="text-sm text-stone-500">{searchError}</div>
                    )}
                    {!isSearching && !searchError && coverCandidates.length > 0 && (
                      <div>
                        <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-2">
                          {coverCandidates.map((candidate) => {
                            const isSelected =
                              selectedCoverUrl === candidate.coverUrl;

                            return (
                              <button
                                key={candidate.key}
                                type="button"
                                onClick={() => handleCoverSelect(candidate)}
                                aria-label={`${
                                  isSelected ? "Clear selected cover" : "Select cover"
                                } for ${candidate.title}`}
                                className={`group relative shrink-0 snap-start overflow-hidden rounded-md transition-shadow touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                  isSelected
                                    ? "ring-2 ring-emerald-600"
                                    : "ring-1 ring-stone-300 hover:ring-2 hover:ring-stone-400"
                                }`}
                                title={`${candidate.title}${
                                  candidate.author ? ` by ${candidate.author}` : ""
                                }`}
                              >
                                <img
                                  src={candidate.coverUrl}
                                  alt={candidate.title}
                                  width={96}
                                  height={128}
                                  loading="lazy"
                                  className="h-32 w-24 object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20">
                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                                      Selected
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-xs text-stone-500">Swipe to see more</div>
                      </div>
                    )}
                    {!isSearching &&
                      !searchError &&
                      coverCandidates.length === 0 &&
                      (!title.trim() || !author.trim()) && (
                        <div className="text-xs text-stone-500">
                          Enter title and author to search for covers.
                        </div>
                      )}
                  </div>
                </div>

                <div className="rounded-lg border border-warm-gray bg-parchment p-3">
                  <h4 className="text-sm font-semibold text-stone-700">
                    Local Photo
                  </h4>
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
                      {showCoverSaved && (
                        <div
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                          aria-live="polite"
                        >
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Local cover saved
                        </div>
                      )}
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

            {!isEditing && (
              <div className="rounded-lg border border-dashed border-warm-gray bg-cream/70 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-700">
                      Advanced Details
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Add reading status, series info, and metadata now or after the book is saved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdvancedFields((currentValue) => {
                        const nextValue = !currentValue;
                        const nextSection = nextValue ? "reading" : "core";
                        setActiveSection(nextSection);
                        setPendingSectionFocus(nextSection);
                        return nextValue;
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
                  >
                    {showAdvancedFields ? "Hide Advanced Details" : "Add More Details"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showAdvancedFields ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {shouldShowAdvancedSections && (
        <section
          ref={readingSectionRef}
          tabIndex={-1}
          className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
        >
          <MobileSectionToggle
            activeSection={activeSection}
            section="reading"
            label="Reading Status"
            onClick={handleSectionChange}
          />
          <div
            id="section-reading"
            role="tabpanel"
            className={`${activeSection === "reading" ? "block" : "hidden"} px-4 pb-4 pt-4`}
          >
            <div className="space-y-4">
              <h3
                className="hidden text-sm font-semibold text-stone-700 sm:block"
              >
                Reading Status
              </h3>

              <div className="space-y-2 rounded-lg border border-warm-gray bg-cream/70 p-3">
                <h4 className="text-sm font-semibold text-stone-700">Read Status</h4>
                <label
                  htmlFor="finished"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-stone-700 transition-colors hover:bg-white"
                >
                  <input
                    id="finished"
                    name="finished"
                    type="checkbox"
                    checked={finished}
                    onChange={(event) => onFinishedChange(event.target.checked)}
                    className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                  />
                  <span>Finished</span>
                </label>
                <label
                  htmlFor="readByDane"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-stone-700 transition-colors hover:bg-white"
                >
                  <input
                    id="readByDane"
                    name="readByDane"
                    type="checkbox"
                    checked={readByDane}
                    onChange={(event) => onReadByDaneChange(event.target.checked)}
                    className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                  />
                  <span>Read by Dane</span>
                </label>
                <label
                  htmlFor="readByEmma"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-stone-700 transition-colors hover:bg-white"
                >
                  <input
                    id="readByEmma"
                    name="readByEmma"
                    type="checkbox"
                    checked={readByEmma}
                    onChange={(event) => onReadByEmmaChange(event.target.checked)}
                    className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                  />
                  <span>Read by Emma</span>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      {shouldShowAdvancedSections && (
        <section
          ref={metaSectionRef}
          tabIndex={-1}
          className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
        >
          <MobileSectionToggle
            activeSection={activeSection}
            section="meta"
            label="Description & Metadata"
            onClick={handleSectionChange}
          />
          <div
            id="section-meta"
            role="tabpanel"
            className={`${activeSection === "meta" ? "block" : "hidden"} px-4 pb-4 pt-4`}
          >
            <div className="space-y-4">
              <h3
                className="hidden text-sm font-semibold text-stone-700 sm:block"
              >
                Description & Metadata
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="seriesName"
                  name="seriesName"
                  label="Series Name"
                  type="text"
                  value={seriesName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onSeriesNameChange(event.target.value)
                  }
                  placeholder="Earthsea…"
                  autoComplete="off"
                />
                <Input
                  id="seriesLabel"
                  name="seriesLabel"
                  label="# In Series"
                  type="text"
                  value={seriesLabel}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onSeriesLabelChange(event.target.value)
                  }
                  placeholder="2 or 2.5…"
                  autoComplete="off"
                />
              </div>
              {(seriesName.trim() || seriesLabel.trim()) && (
                <div>
                  <button
                    type="button"
                    onClick={onClearSeries}
                    className="text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                  >
                    Clear series
                  </button>
                </div>
              )}

              <div>
                <label
                  htmlFor="genre"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  Genre
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={genre}
                  onChange={(event) => handleGenreChange(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Select genre</option>
                  {EDIT_BOOK_GENRES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {genreWasAutofilled && genre.trim().length > 0 && (
                  <div className="mt-1.5 text-xs text-stone-500">
                    Auto-filled from book metadata. Verify it before saving.
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="format"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
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

              <div>
                <Input
                  id="isbn"
                  name="isbn"
                  label="ISBN"
                  type="text"
                  value={isbn}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onIsbnChange(event.target.value)
                  }
                  placeholder="9780547928227…"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <label
                  htmlFor="pages"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
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
                  placeholder="320…"
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
                  placeholder="Short summary or notes…"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-warm-gray bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" variant="success" disabled={saveState === "saving"}>
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          {isEditing && onDelete && (
            <Button type="button" variant="danger" onClick={onDelete}>
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete Book
              </span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
