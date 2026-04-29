import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { getAllBooks, getWishlistBooks } from "../../../data/bookRepo";
import {
  getScrollBehavior,
  matchesGenreBookQuery,
  mergeDiscoveryBooks,
  normalizeGenre,
  sortGenreShelfBooks,
  toGenreSectionId,
  type OwnershipFilter,
} from "./discoveryBrowseShared";
import type { Book } from "../lib/bookTypes";
import {
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
  const [shelfCardHeights, setShelfCardHeights] = useState<Record<string, number>>({});
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heightSyncFrameRef = useRef<number | null>(null);

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

  const scrollShelf = useCallback((sectionId: string, direction: "backward" | "forward") => {
    const shelf = carouselRefs.current[sectionId];
    if (!shelf) return;
    const delta = Math.max(shelf.clientWidth * 0.82, 240) * (direction === "forward" ? 1 : -1);
    shelf.scrollBy({ left: delta, behavior: getScrollBehavior() });
  }, []);

  const syncShelfCardHeights = useCallback(() => {
    const nextHeights: Record<string, number> = {};

    for (const shelf of genreShelves) {
      const carousel = carouselRefs.current[shelf.sectionId];
      if (!carousel) continue;
      const cardItems = carousel.querySelectorAll<HTMLElement>("[data-genre-card-item]");
      if (cardItems.length === 0) continue;

      cardItems.forEach((item) => {
        item.style.height = "";
      });

      let maxHeight = 0;
      cardItems.forEach((item) => {
        const card = item.querySelector<HTMLElement>(".book-card");
        const measuredHeight = Math.ceil((card ?? item).getBoundingClientRect().height);
        if (measuredHeight > maxHeight) maxHeight = measuredHeight;
      });
      if (maxHeight > 0) nextHeights[shelf.sectionId] = maxHeight;
    }

    setShelfCardHeights((current) => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextHeights);
      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === nextHeights[key])
      ) {
        return current;
      }
      return nextHeights;
    });
  }, [genreShelves]);

  const scheduleShelfCardHeightSync = useCallback(() => {
    if (typeof window === "undefined") {
      syncShelfCardHeights();
      return;
    }
    if (heightSyncFrameRef.current !== null) {
      window.cancelAnimationFrame(heightSyncFrameRef.current);
    }
    heightSyncFrameRef.current = window.requestAnimationFrame(() => {
      heightSyncFrameRef.current = null;
      syncShelfCardHeights();
    });
  }, [syncShelfCardHeights]);

  useEffect(() => {
    scheduleShelfCardHeightSync();
    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (typeof window !== "undefined" && heightSyncFrameRef.current !== null) {
          window.cancelAnimationFrame(heightSyncFrameRef.current);
          heightSyncFrameRef.current = null;
        }
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleShelfCardHeightSync();
    });
    for (const shelf of genreShelves) {
      const carousel = carouselRefs.current[shelf.sectionId];
      if (!carousel) continue;
      resizeObserver.observe(carousel);
      carousel
        .querySelectorAll<HTMLElement>("[data-genre-card-item]")
        .forEach((item) => resizeObserver.observe(item));
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", scheduleShelfCardHeightSync);
    }

    return () => {
      resizeObserver.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", scheduleShelfCardHeightSync);
        if (heightSyncFrameRef.current !== null) {
          window.cancelAnimationFrame(heightSyncFrameRef.current);
          heightSyncFrameRef.current = null;
        }
      }
    };
  }, [cardSize, genreShelves, scheduleShelfCardHeightSync]);

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
      shelfCardHeights,
      genreShelves,
      featuredShelves,
      ownershipTotals,
      resultsLabel,
      hasActiveFilters,
    },
    refs: { carouselRefs },
    actions: {
      setIsFilterDrawerOpen,
      setSearchQuery,
      setOwnershipFilter,
      setCardSize,
      scrollShelf,
      clearFilters,
    },
  };
}
