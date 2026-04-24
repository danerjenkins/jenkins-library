import { startTransition, useCallback } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import {
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  type CardSize,
  WISHLIST_VIEW_STORAGE_KEY,
  writeStorageValue,
} from "../shelfViewPreferences";

export type WishlistReadFilter = "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH";

interface StoredWishlistViewPreferences {
  filterGenre: string;
  filterReadStatus: WishlistReadFilter;
  filterFormat: string;
  filterSeries: string;
}

export interface WishlistPageState extends StoredWishlistViewPreferences {
  searchQuery: string;
  cardSize: CardSize;
}

const readFilterValues = new Set<WishlistReadFilter>(["ALL", "NEITHER", "DANE", "EMMA", "BOTH"]);

export const wishlistReadFilterOptions = [
  { value: "ALL", label: "All" },
  { value: "NEITHER", label: "To Read" },
  { value: "DANE", label: "Read by Dane" },
  { value: "EMMA", label: "Read by Emma" },
  { value: "BOTH", label: "Read by Both" },
] as const;

const defaultWishlistState: WishlistPageState = {
  searchQuery: "",
  filterGenre: "ALL",
  filterReadStatus: "ALL",
  filterFormat: "ALL",
  filterSeries: "ALL",
  cardSize: getDefaultCardSize(),
};

function getStoredWishlistViewPreferences(): StoredWishlistViewPreferences | null {
  const stored = readStorageValue<Partial<StoredWishlistViewPreferences>>(WISHLIST_VIEW_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  return {
    filterGenre: stored.filterGenre ?? defaultWishlistState.filterGenre,
    filterReadStatus: readFilterValues.has(stored.filterReadStatus as WishlistReadFilter)
      ? (stored.filterReadStatus as WishlistReadFilter)
      : defaultWishlistState.filterReadStatus,
    filterFormat: stored.filterFormat ?? defaultWishlistState.filterFormat,
    filterSeries: stored.filterSeries ?? defaultWishlistState.filterSeries,
  };
}

function getHydratedState(searchParams: URLSearchParams): WishlistPageState {
  const storedView = getStoredWishlistViewPreferences();
  const storedCardSize = readStorageValue<string>(SHELF_CARD_SIZE_STORAGE_KEY);
  const queryCardSize = searchParams.get("size");
  const queryRead = searchParams.get("read");

  return {
    searchQuery: searchParams.get("q") ?? defaultWishlistState.searchQuery,
    filterGenre:
      searchParams.get("genre") ?? storedView?.filterGenre ?? defaultWishlistState.filterGenre,
    filterReadStatus: readFilterValues.has(queryRead as WishlistReadFilter)
      ? (queryRead as WishlistReadFilter)
      : storedView?.filterReadStatus ?? defaultWishlistState.filterReadStatus,
    filterFormat:
      searchParams.get("format") ?? storedView?.filterFormat ?? defaultWishlistState.filterFormat,
    filterSeries:
      searchParams.get("series") ?? storedView?.filterSeries ?? defaultWishlistState.filterSeries,
    cardSize: isCardSize(queryCardSize)
      ? queryCardSize
      : isCardSize(storedCardSize)
        ? storedCardSize
        : defaultWishlistState.cardSize,
  };
}

function toSearchParams(state: WishlistPageState) {
  const nextSearchParams = new URLSearchParams();

  if (state.searchQuery.trim()) {
    nextSearchParams.set("q", state.searchQuery);
  }
  if (state.filterGenre !== defaultWishlistState.filterGenre) {
    nextSearchParams.set("genre", state.filterGenre);
  }
  if (state.filterReadStatus !== defaultWishlistState.filterReadStatus) {
    nextSearchParams.set("read", state.filterReadStatus);
  }
  if (state.filterFormat !== defaultWishlistState.filterFormat) {
    nextSearchParams.set("format", state.filterFormat);
  }
  if (state.filterSeries !== defaultWishlistState.filterSeries) {
    nextSearchParams.set("series", state.filterSeries);
  }
  if (state.cardSize !== defaultWishlistState.cardSize) {
    nextSearchParams.set("size", state.cardSize);
  }

  return nextSearchParams;
}

export function useWishlistPageState(
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
) {
  const searchParamsKey = searchParams.toString();

  const state = getHydratedState(searchParams);

  const updateState = useCallback((patch: Partial<WishlistPageState>) => {
    const nextState = {
      ...state,
      ...patch,
    };

    writeStorageValue(WISHLIST_VIEW_STORAGE_KEY, {
      filterGenre: nextState.filterGenre,
      filterReadStatus: nextState.filterReadStatus,
      filterFormat: nextState.filterFormat,
      filterSeries: nextState.filterSeries,
    } satisfies StoredWishlistViewPreferences);
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
      searchQuery: defaultWishlistState.searchQuery,
      filterGenre: defaultWishlistState.filterGenre,
      filterReadStatus: defaultWishlistState.filterReadStatus,
      filterFormat: defaultWishlistState.filterFormat,
      filterSeries: defaultWishlistState.filterSeries,
    });
  }, [updateState]);

  const hasActiveFilters =
    Boolean(state.searchQuery.trim()) ||
    state.filterGenre !== defaultWishlistState.filterGenre ||
    state.filterReadStatus !== defaultWishlistState.filterReadStatus ||
    state.filterFormat !== defaultWishlistState.filterFormat ||
    state.filterSeries !== defaultWishlistState.filterSeries;

  return {
    state,
    updateState,
    clearFilters,
    hasActiveFilters,
  };
}
