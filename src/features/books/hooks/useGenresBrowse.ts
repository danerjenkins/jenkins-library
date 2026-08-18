import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { getAllBooks, getWishlistBooks } from "../../../data/bookRepo";
import {
  matchesGenreBookQuery,
  mergeDiscoveryBooks,
  normalizeGenre,
  sortGenreShelfBooks,
  toGenreSectionId,
  type OwnershipFilter,
} from "./discoveryBrowseShared";
import type { Book } from "../lib/bookTypes";
import {
  GENRES_VIEW_STORAGE_KEY,
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  type CardSize,
  writeStorageValue,
} from "../lib/shelfViewPreferences";

export type GenreShelf = {
  genre: string;
  sectionId: string;
  books: Book[];
  ownedCount: number;
  wishlistCount: number;
};

interface StoredGenresViewPreferences {
  showGenreTags: boolean;
  showRatings: boolean;
}

export function useGenresBrowse() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [cardSize, setCardSize] = useState<CardSize>(() => {
    const storedCardSize = readStorageValue<string>(SHELF_CARD_SIZE_STORAGE_KEY);
    return isCardSize(storedCardSize) ? storedCardSize : getDefaultCardSize();
  });
  const [showGenreTags, setShowGenreTags] = useState(() => {
    const stored = readStorageValue<Partial<StoredGenresViewPreferences>>(
      GENRES_VIEW_STORAGE_KEY,
    );
    return stored?.showGenreTags ?? false;
  });
  const [showRatings, setShowRatings] = useState(() => {
    const stored = readStorageValue<Partial<StoredGenresViewPreferences>>(
      GENRES_VIEW_STORAGE_KEY,
    );
    return stored?.showRatings ?? true;
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks] = await Promise.all([getAllBooks(), getWishlistBooks()]);
      setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
    } catch (error) {
      console.error("Failed to load books for genres page:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, cardSize);
  }, [cardSize]);

  useEffect(() => {
    writeStorageValue(GENRES_VIEW_STORAGE_KEY, {
      showGenreTags,
      showRatings,
    } satisfies StoredGenresViewPreferences);
  }, [showGenreTags, showRatings]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const bookOwnershipStatus = book.ownershipStatus ?? "owned";
      if (ownershipFilter !== "all" && bookOwnershipStatus !== ownershipFilter) return false;
      return matchesGenreBookQuery(book, normalizedQuery);
    });
  }, [books, deferredSearchQuery, ownershipFilter]);

  const genreShelves = useMemo<GenreShelf[]>(() => {
    const grouped = new Map<string, Book[]>();
    for (const book of filteredBooks) {
      const genre = normalizeGenre(book.genre);
      const existing = grouped.get(genre);
      if (existing) existing.push(book);
      else grouped.set(genre, [book]);
    }

    return [...grouped.entries()]
      .map(([genre, genreBooks]) => {
        const sortedBooks = sortGenreShelfBooks(genreBooks);
        const ownedCount = sortedBooks.filter(
          (book) => (book.ownershipStatus ?? "owned") === "owned",
        ).length;

        return {
          genre,
          sectionId: toGenreSectionId(genre),
          books: sortedBooks,
          ownedCount,
          wishlistCount: sortedBooks.length - ownedCount,
        };
      })
      .sort((a, b) => {
        if (b.books.length !== a.books.length) return b.books.length - a.books.length;
        return a.genre.localeCompare(b.genre, undefined, { sensitivity: "base" });
      });
  }, [filteredBooks]);

  const featuredShelves = useMemo(() => genreShelves.slice(0, 6), [genreShelves]);
  const ownershipTotals = useMemo(
    () => ({
      owned: filteredBooks.filter((book) => (book.ownershipStatus ?? "owned") === "owned").length,
      wishlist: filteredBooks.filter((book) => (book.ownershipStatus ?? "owned") === "wishlist")
        .length,
    }),
    [filteredBooks],
  );
  const resultsLabel = useMemo(() => {
    if (loading) return "Loading shelves...";
    const genreCount = genreShelves.length;
    const bookCount = filteredBooks.length;
    return `${bookCount} ${bookCount === 1 ? "book" : "books"} across ${genreCount} ${
      genreCount === 1 ? "genre shelf" : "genre shelves"
    }`;
  }, [filteredBooks.length, genreShelves.length, loading]);

  const hasActiveFilters = deferredSearchQuery.trim().length > 0 || ownershipFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("all");
  }, []);

  return {
    state: {
      loading,
      isFilterDrawerOpen,
      searchQuery,
      ownershipFilter,
      cardSize,
      showGenreTags,
      showRatings,
      genreShelves,
      featuredShelves,
      ownershipTotals,
      resultsLabel,
      hasActiveFilters,
    },
    actions: {
      setIsFilterDrawerOpen,
      setSearchQuery,
      setOwnershipFilter,
      setCardSize,
      setShowGenreTags,
      setShowRatings,
      clearFilters,
    },
  };
}
