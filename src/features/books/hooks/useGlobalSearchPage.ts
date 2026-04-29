import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { getAllBooks, getWishlistBooks } from "../../../data/bookRepo";
import type { Book } from "../lib/bookTypes";
import type { CardSize } from "../lib/shelfViewPreferences";
import {
  SHELF_CARD_SIZE_STORAGE_KEY,
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  writeStorageValue,
} from "../lib/shelfViewPreferences";
import {
  mergeDiscoveryBooks,
  matchesBookSearchQuery,
} from "./discoveryBrowseShared";

export type SearchOwnershipFilter = "all" | "owned" | "wishlist";

const defaultOwnershipFilter: SearchOwnershipFilter = "all";

function hydrateOwnershipFilter(value: string | null): SearchOwnershipFilter {
  if (value === "owned" || value === "wishlist" || value === "all") {
    return value;
  }
  return defaultOwnershipFilter;
}

export function useGlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [ownershipFilter, setOwnershipFilterState] =
    useState<SearchOwnershipFilter>(() =>
      hydrateOwnershipFilter(searchParams.get("ownership")),
    );
  const [cardSize, setCardSize] = useState<CardSize>(() => {
    const storedCardSize = readStorageValue<string>(
      SHELF_CARD_SIZE_STORAGE_KEY,
    );
    return isCardSize(storedCardSize) ? storedCardSize : getDefaultCardSize();
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const [ownedBooks, wishlistBooks] = await Promise.all([
          getAllBooks(),
          getWishlistBooks(),
        ]);
        setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
      } catch (error) {
        console.error("Failed to load books for search:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadBooks();
  }, []);

  useEffect(() => {
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, cardSize);
  }, [cardSize]);

  useEffect(() => {
    const nextQuery = new URLSearchParams();
    if (searchQuery.trim()) {
      nextQuery.set("q", searchQuery.trim());
    }
    if (ownershipFilter !== defaultOwnershipFilter) {
      nextQuery.set("ownership", ownershipFilter);
    }

    if (nextQuery.toString() !== searchParams.toString()) {
      setSearchParams(nextQuery, { replace: true });
    }
  }, [ownershipFilter, searchParams, searchQuery, setSearchParams]);

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const ownership = book.ownershipStatus ?? "owned";
      if (ownershipFilter !== "all" && ownership !== ownershipFilter) {
        return false;
      }
      return matchesBookSearchQuery(book, query);
    });
  }, [books, deferredSearchQuery, ownershipFilter]);

  const ownershipTotals = useMemo(
    () => ({
      owned: filteredBooks.filter(
        (book) => (book.ownershipStatus ?? "owned") === "owned",
      ).length,
      wishlist: filteredBooks.filter(
        (book) => (book.ownershipStatus ?? "owned") === "wishlist",
      ).length,
    }),
    [filteredBooks],
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || ownershipFilter !== defaultOwnershipFilter;

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilterState(defaultOwnershipFilter);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const setOwnershipFilter = useCallback((value: SearchOwnershipFilter) => {
    setOwnershipFilterState(value);
  }, []);

  return {
    state: {
      loading,
      searchQuery,
      ownershipFilter,
      cardSize,
      filteredBooks,
      ownershipTotals,
      hasActiveFilters,
    },
    actions: {
      setSearchQuery,
      setOwnershipFilter,
      setCardSize,
      clearFilters,
    },
  };
}
