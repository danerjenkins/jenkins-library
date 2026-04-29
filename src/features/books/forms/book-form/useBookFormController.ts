import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  guessAuthorByTitle,
  predictGenreFromSubjects,
  searchCoverCandidates,
  searchTitleSuggestions,
  type OpenLibraryCandidate,
  type TitleSuggestion,
} from "../../../../integrations/openLibrary";
import { debounce } from "../../../../utils/debounce";
import {
  createBookFormSnapshot,
  serializeBookFormSnapshot,
} from "../../lib/bookFormState";
import type { BookFormProps, BookFormSection } from "./BookForm.types";

export const unsavedChangesDefaultMessage =
  "You have unsaved changes. Leave this form without saving?";

export function useBookFormController(props: BookFormProps) {
  const {
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
    saveState = "idle",
    saveSignal = null,
    formInstanceKey = null,
    onDirtyChange,
    unsavedChangesMessage = unsavedChangesDefaultMessage,
    onTitleChange,
    onAuthorChange,
    onGenreChange,
    onIsbnChange,
    onCoverUrlChange,
    onCancel,
    onSubmit,
  } = props;

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

  const [coverCandidates, setCoverCandidates] = useState<OpenLibraryCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(coverUrl || null);
  const [activeSection, setActiveSection] = useState<BookFormSection>("core");
  const [showAdvancedFields, setShowAdvancedFields] = useState(isEditing);
  const [showValidation, setShowValidation] = useState(false);
  const [authorWasAutofilled, setAuthorWasAutofilled] = useState(false);
  const [userHasEditedAuthor, setUserHasEditedAuthor] = useState(Boolean(author.trim()));
  const [genreWasAutofilled, setGenreWasAutofilled] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [titleWasEdited, setTitleWasEdited] = useState(false);
  const [pendingSectionFocus, setPendingSectionFocus] = useState<BookFormSection | null>(null);

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
  const baselineSnapshotRef = useRef(currentSnapshot);

  const titleError =
    showValidation && !title.trim() ? "Add a title before you save this book." : null;
  const authorError =
    showValidation && !author.trim() ? "Add an author before you save this book." : null;
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
  const submitLabel =
    saveState === "saving" ? "Saving..." : isEditing ? "Update Book" : "Add Book";

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
    if (!hasMeaningfulChanges) return;

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

    const panelMap: Record<BookFormSection, HTMLElement | null> = {
      core: coreSectionRef.current,
      reading: readingSectionRef.current,
      meta: metaSectionRef.current,
    };
    const nextPanel = panelMap[pendingSectionFocus];
    if (!nextPanel) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      nextPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      nextPanel.focus({ preventScroll: true });
      setPendingSectionFocus(null);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [pendingSectionFocus]);

  const performSearch = useCallback(async (searchTitle: string, searchAuthor: string) => {
    if (!searchTitle.trim() || !searchAuthor.trim()) {
      setCoverCandidates([]);
      setSearchError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsSearching(true);
    setSearchError(null);

    try {
      const candidates = await searchCoverCandidates({ title: searchTitle, author: searchAuthor });
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
  }, []);

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

  const handleCoverSelect = useCallback(
    (candidate: OpenLibraryCandidate) => {
      const isSelected = selectedCoverUrl === candidate.coverUrl;
      if (isSelected) {
        onCoverUrlChange("");
        setSelectedCoverUrl(null);
        return;
      }

      onCoverUrlChange(candidate.coverUrl);
      setSelectedCoverUrl(candidate.coverUrl);
    },
    [onCoverUrlChange, selectedCoverUrl],
  );

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
    if (title.trim().length >= 4 && !userHasEditedAuthor && author.trim().length === 0) {
      debouncedAuthorGuess(title);
    }
  }, [author, debouncedAuthorGuess, title, userHasEditedAuthor]);

  const handleAuthorInput = useCallback(
    (value: string) => {
      if (!authorWasAutofilled && value.trim().length > 0) {
        setUserHasEditedAuthor(true);
      }
      if (authorWasAutofilled && value !== author) {
        setAuthorWasAutofilled(false);
      }
      onAuthorChange(value);
    },
    [author, authorWasAutofilled, onAuthorChange],
  );

  const handleGenreInput = useCallback(
    (value: string) => {
      if (genreWasAutofilled && value !== genre) {
        setGenreWasAutofilled(false);
      }
      onGenreChange(value);
    },
    [genre, genreWasAutofilled, onGenreChange],
  );

  const handleClearAuthor = useCallback(() => {
    onAuthorChange("");
    setAuthorWasAutofilled(false);
    setUserHasEditedAuthor(false);
  }, [onAuthorChange]);

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

  const handleSuggestionSelect = useCallback(
    (suggestion: TitleSuggestion) => {
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
    },
    [onAuthorChange, onGenreChange, onIsbnChange, onTitleChange],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleFieldRef.current && !titleFieldRef.current.contains(event.target as Node)) {
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

  const handleSectionChange = useCallback((section: BookFormSection) => {
    setActiveSection(section);
    setPendingSectionFocus(section);
  }, []);

  const handleCancel = useCallback(() => {
    if (hasMeaningfulChanges && !window.confirm(unsavedChangesMessage)) {
      return;
    }
    onCancel();
  }, [hasMeaningfulChanges, onCancel, unsavedChangesMessage]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      setShowValidation(true);
      if (!title.trim() || !author.trim()) {
        event.preventDefault();
        const firstInvalidField =
          formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']") ?? null;
        firstInvalidField?.focus();
        return;
      }
      onSubmit(event);
    },
    [author, onSubmit, title],
  );

  const handleTitleBlur = useCallback(() => {
    if (titleTimeoutRef.current) {
      window.clearTimeout(titleTimeoutRef.current);
    }
    titleTimeoutRef.current = window.setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) {
        window.clearTimeout(titleTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleInput = useCallback(
    (nextTitle: string) => {
      if (nextTitle.trim() !== initialTitleRef.current.trim()) {
        setTitleWasEdited(true);
      }
      onTitleChange(nextTitle);
    },
    [onTitleChange],
  );

  const handleTitleFocus = useCallback(() => {
    if (
      titleSuggestions.length > 0 &&
      !authorFieldFocusedRef.current &&
      (!isEditing || titleWasEdited)
    ) {
      setShowSuggestions(true);
    }
  }, [isEditing, titleSuggestions.length, titleWasEdited]);

  const handleAuthorFocus = useCallback(() => {
    authorFieldFocusedRef.current = true;
    setShowSuggestions(false);
  }, []);

  const handleAuthorBlur = useCallback(() => {
    authorFieldFocusedRef.current = false;
  }, []);

  const toggleAdvancedDetails = useCallback(() => {
    setShowAdvancedFields((currentValue) => {
      const nextValue = !currentValue;
      const nextSection = nextValue ? "reading" : "core";
      setActiveSection(nextSection);
      setPendingSectionFocus(nextSection);
      return nextValue;
    });
  }, []);

  return {
    refs: {
      formRef,
      titleFieldRef,
      coreSectionRef,
      readingSectionRef,
      metaSectionRef,
    },
    state: {
      activeSection,
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
      shouldShowAdvancedSections: isEditing || showAdvancedFields,
      submitLabel,
    },
    actions: {
      handleSectionChange,
      handleCancel,
      handleFormSubmit,
      handleTitleInput,
      handleTitleFocus,
      handleTitleBlur,
      handleAuthorInput,
      handleAuthorFocus,
      handleAuthorBlur,
      handleClearAuthor,
      handleGenreInput,
      handleCoverSelect,
      handleSuggestionSelect,
      toggleAdvancedDetails,
    },
  };
}
