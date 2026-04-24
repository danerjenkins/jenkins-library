import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { getAllBooks, getWishlistBooks, sortBooksBySeriesOrder } from "../../../data/bookRepo";
import {
  getScrollBehavior,
  getSeriesProgressLabel,
  matchesSeriesBookQuery,
  mergeDiscoveryBooks,
  normalizeSeriesName,
  type OwnershipFilter,
} from "./discoveryBrowseShared";
import type { Book } from "../bookTypes";
import type { CardSize } from "../shelfViewPreferences";
import { getDefaultCardSize } from "../shelfViewPreferences";

export type SeriesGroup = {
  key: string;
  name: string;
  books: Book[];
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function useSeriesBrowse() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [cardSize, setCardSize] = useState<CardSize>(getDefaultCardSize);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks] = await Promise.all([getAllBooks(), getWishlistBooks()]);
      setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
    } catch (error) {
      console.error("Failed to load books for series browsing:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const visibleBooks = useMemo(() => {
    if (ownershipFilter === "all") return books;
    return books.filter((book) => (book.ownershipStatus ?? "owned") === ownershipFilter);
  }, [books, ownershipFilter]);

  const standaloneBooks = useMemo(
    () => visibleBooks.filter((book) => !book.seriesName?.trim()),
    [visibleBooks],
  );

  const groupedSeries = useMemo(() => {
    const seriesMap = new Map<string, SeriesGroup>();
    for (const book of visibleBooks) {
      const rawSeriesName = book.seriesName?.trim();
      if (!rawSeriesName) continue;
      const key = normalizeSeriesName(rawSeriesName);
      const existingGroup = seriesMap.get(key);
      if (existingGroup) {
        existingGroup.books.push(book);
      } else {
        seriesMap.set(key, { key, name: rawSeriesName, books: [book] });
      }
    }

    return Array.from(seriesMap.values())
      .map((group) => ({ ...group, books: sortBooksBySeriesOrder(group.books) }))
      .sort((left, right) => collator.compare(left.name, right.name));
  }, [visibleBooks]);

  const filteredSeries = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase();
    return groupedSeries
      .map((group) => {
        if (!query || group.name.toLocaleLowerCase().includes(query)) return group;
        const matchingBooks = group.books.filter((book) => matchesSeriesBookQuery(book, query));
        return matchingBooks.length === 0 ? null : { ...group, books: matchingBooks };
      })
      .filter((group): group is SeriesGroup => group !== null);
  }, [deferredSearchQuery, groupedSeries]);

  const seriesBookCount = useMemo(
    () => groupedSeries.reduce((count, group) => count + group.books.length, 0),
    [groupedSeries],
  );

  const hasActiveFilters = searchQuery.trim().length > 0 || ownershipFilter !== "all";
  const resultsSummary = `${filteredSeries.length} series shown`;

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("all");
  }, []);

  const registerCarousel = useCallback((key: string, node: HTMLDivElement | null) => {
    carouselRefs.current[key] = node;
  }, []);

  const handleStepCarousel = useCallback((key: string, direction: "backward" | "forward") => {
    const carousel = carouselRefs.current[key];
    if (!carousel) return;
    const distance = Math.max(carousel.clientWidth * 0.82, 240);
    carousel.scrollBy({
      left: direction === "forward" ? distance : -distance,
      behavior: getScrollBehavior(),
    });
  }, []);

  return {
    state: {
      loading,
      isFilterDrawerOpen,
      searchQuery,
      ownershipFilter,
      cardSize,
      groupedSeries,
      filteredSeries,
      standaloneBooks,
      seriesBookCount,
      hasActiveFilters,
      resultsSummary,
    },
    actions: {
      setIsFilterDrawerOpen,
      setSearchQuery,
      setOwnershipFilter,
      setCardSize,
      handleClearFilters,
      registerCarousel,
      handleStepCarousel,
    },
    helpers: {
      getSeriesProgressLabel,
    },
  };
}
