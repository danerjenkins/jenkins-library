import { startTransition, useCallback } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import type { BookFormat, ReadStatus } from "../bookTypes";
import {
  getDefaultCardSize,
  isCardSize,
  LIBRARY_VIEW_STORAGE_KEY,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  type CardSize,
  writeStorageValue,
} from "../shelfViewPreferences";

export type SortOption = "genre-author" | "series" | "title" | "author" | "updated";
export type ReadFilter = "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH";
export type OwnershipFilter = "owned" | "wishlist" | "all";

interface StoredLibraryViewPreferences {
  ownershipFilter: OwnershipFilter;
  filterGenre: string;
  filterFinished: ReadFilter;
  filterFormat: string;
  filterSeries: string;
  sortBy: SortOption;
}

export interface ViewBooksPageState extends StoredLibraryViewPreferences {
  searchQuery: string;
  cardSize: CardSize;
}

const readFilterValues = new Set<ReadFilter>(["ALL", "NEITHER", "DANE", "EMMA", "BOTH"]);
const sortOptionValues = new Set<SortOption>([
  "genre-author",
  "series",
  "title",
  "author",
  "updated",
]);
const ownershipFilterValues = new Set<OwnershipFilter>(["owned", "wishlist", "all"]);

export const readStatusByFilter: Record<Exclude<ReadFilter, "ALL">, ReadStatus> = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
};

export const sortOptions = [
  { value: "genre-author", label: "Genre then Author" },
  { value: "series", label: "Series Order" },
  { value: "title", label: "Title (A-Z)" },
  { value: "author", label: "Author (A-Z)" },
  { value: "updated", label: "Recently Updated" },
] as const;

export const readFilterOptions = [
  { value: "ALL", label: "All" },
  { value: "NEITHER", label: "To Read" },
  { value: "DANE", label: "Read by Dane" },
  { value: "EMMA", label: "Read by Emma" },
  { value: "BOTH", label: "Read by Both" },
] as const;

const defaultViewState: ViewBooksPageState = {
  searchQuery: "",
  ownershipFilter: "owned",
  filterGenre: "ALL",
  filterFinished: "ALL",
  filterFormat: "ALL",
  filterSeries: "ALL",
  sortBy: "genre-author",
  cardSize: getDefaultCardSize(),
};

function getStoredLibraryViewPreferences(): StoredLibraryViewPreferences | null {
  const stored = readStorageValue<Partial<StoredLibraryViewPreferences>>(LIBRARY_VIEW_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  return {
    ownershipFilter: ownershipFilterValues.has(stored.ownershipFilter as OwnershipFilter)
      ? (stored.ownershipFilter as OwnershipFilter)
      : "owned",
    filterGenre: stored.filterGenre ?? "ALL",
    filterFinished: readFilterValues.has(stored.filterFinished as ReadFilter)
      ? (stored.filterFinished as ReadFilter)
      : "ALL",
    filterFormat: stored.filterFormat ?? "ALL",
    filterSeries: stored.filterSeries ?? "ALL",
    sortBy: sortOptionValues.has(stored.sortBy as SortOption)
      ? (stored.sortBy as SortOption)
      : "genre-author",
  };
}

function getHydratedState(searchParams: URLSearchParams): ViewBooksPageState {
  const storedView = getStoredLibraryViewPreferences();
  const storedCardSize = readStorageValue<string>(SHELF_CARD_SIZE_STORAGE_KEY);
  const queryCardSize = searchParams.get("size");
  const queryOwnership = searchParams.get("ownership");
  const queryRead = searchParams.get("read");
  const querySort = searchParams.get("sort");

  return {
    searchQuery: searchParams.get("q") ?? "",
    ownershipFilter: ownershipFilterValues.has(queryOwnership as OwnershipFilter)
      ? (queryOwnership as OwnershipFilter)
      : storedView?.ownershipFilter ?? defaultViewState.ownershipFilter,
    filterGenre: searchParams.get("genre") ?? storedView?.filterGenre ?? defaultViewState.filterGenre,
    filterFinished: readFilterValues.has(queryRead as ReadFilter)
      ? (queryRead as ReadFilter)
      : storedView?.filterFinished ?? defaultViewState.filterFinished,
    filterFormat:
      searchParams.get("format") ?? storedView?.filterFormat ?? defaultViewState.filterFormat,
    filterSeries:
      searchParams.get("series") ?? storedView?.filterSeries ?? defaultViewState.filterSeries,
    sortBy: sortOptionValues.has(querySort as SortOption)
      ? (querySort as SortOption)
      : storedView?.sortBy ?? defaultViewState.sortBy,
    cardSize: isCardSize(queryCardSize)
      ? queryCardSize
      : isCardSize(storedCardSize)
        ? storedCardSize
        : defaultViewState.cardSize,
  };
}

function toSearchParams(state: ViewBooksPageState) {
  const nextSearchParams = new URLSearchParams();

  if (state.searchQuery.trim()) {
    nextSearchParams.set("q", state.searchQuery);
  }
  if (state.ownershipFilter !== defaultViewState.ownershipFilter) {
    nextSearchParams.set("ownership", state.ownershipFilter);
  }
  if (state.filterGenre !== defaultViewState.filterGenre) {
    nextSearchParams.set("genre", state.filterGenre);
  }
  if (state.filterFinished !== defaultViewState.filterFinished) {
    nextSearchParams.set("read", state.filterFinished);
  }
  if (state.filterFormat !== defaultViewState.filterFormat) {
    nextSearchParams.set("format", state.filterFormat);
  }
  if (state.filterSeries !== defaultViewState.filterSeries) {
    nextSearchParams.set("series", state.filterSeries);
  }
  if (state.sortBy !== defaultViewState.sortBy) {
    nextSearchParams.set("sort", state.sortBy);
  }
  if (state.cardSize !== defaultViewState.cardSize) {
    nextSearchParams.set("size", state.cardSize);
  }

  return nextSearchParams;
}

export function useViewBooksPageState(
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
) {
  const searchParamsKey = searchParams.toString();

  const state = getHydratedState(searchParams);

  const updateState = useCallback((patch: Partial<ViewBooksPageState>) => {
    const nextState = {
      ...state,
      ...patch,
    };

    writeStorageValue(LIBRARY_VIEW_STORAGE_KEY, {
      ownershipFilter: nextState.ownershipFilter,
      filterGenre: nextState.filterGenre,
      filterFinished: nextState.filterFinished,
      filterFormat: nextState.filterFormat,
      filterSeries: nextState.filterSeries,
      sortBy: nextState.sortBy,
    } satisfies StoredLibraryViewPreferences);
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, nextState.cardSize);

    const nextSearchParams = toSearchParams(nextState);
    if (nextSearchParams.toString() !== searchParamsKey) {
      startTransition(() => {
        setSearchParams(nextSearchParams, { replace: true });
      });
    }
  }, [searchParamsKey, setSearchParams, state]);

  const clearFilters = useCallback(() => {
    updateState({
      searchQuery: defaultViewState.searchQuery,
      ownershipFilter: defaultViewState.ownershipFilter,
      filterGenre: defaultViewState.filterGenre,
      filterFinished: defaultViewState.filterFinished,
      filterFormat: defaultViewState.filterFormat,
      filterSeries: defaultViewState.filterSeries,
      sortBy: defaultViewState.sortBy,
    });
  }, [updateState]);

  const hasActiveFilters =
    Boolean(state.searchQuery) ||
    state.ownershipFilter !== defaultViewState.ownershipFilter ||
    state.filterGenre !== defaultViewState.filterGenre ||
    state.filterFinished !== defaultViewState.filterFinished ||
    state.filterFormat !== defaultViewState.filterFormat ||
    state.filterSeries !== defaultViewState.filterSeries ||
    state.sortBy !== defaultViewState.sortBy;

  return {
    state,
    updateState,
    clearFilters,
    hasActiveFilters,
  };
}

export function getSortedFormats(books: Array<{ format?: BookFormat | null }>) {
  return Array.from(
    new Set(books.map((book) => book.format).filter((format): format is BookFormat => Boolean(format))),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function getSortedStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
