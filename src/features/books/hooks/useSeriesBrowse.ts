import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getAllBooks,
  getWishlistBooks,
  sortBooksBySeriesOrder,
} from "../../../data/bookRepo";
import { listSeries } from "../../../repos/seriesRepo";
import {
  getScrollBehavior,
  getSeriesProgressLabel,
  matchesSeriesBookQuery,
  mergeDiscoveryBooks,
  normalizeSeriesName,
  type OwnershipFilter,
} from "./discoveryBrowseShared";
import type { Book } from "../lib/bookTypes";
import type { CardSize } from "../lib/shelfViewPreferences";
import {
  SHELF_CARD_SIZE_STORAGE_KEY,
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  writeStorageValue,
} from "../lib/shelfViewPreferences";
import type { Series } from "../lib/bookTypes";

export type SeriesGroup = {
  key: string;
  name: string;
  books: Book[];
  kind: "parent" | "series";
  parentName?: string | null;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function normalizeGroupKey(name: string) {
  return normalizeSeriesName(name);
}

function sortBooksForParentCarousel(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      {
        sensitivity: "base",
      },
    );
    if (seriesCompare !== 0) return seriesCompare;

    const sortA = a.seriesSort ?? Number.POSITIVE_INFINITY;
    const sortB = b.seriesSort ?? Number.POSITIVE_INFINITY;
    if (sortA !== sortB) return sortA - sortB;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

function buildSeriesHierarchy(seriesList: Series[], books: Book[]) {
  const seriesById = new Map(seriesList.map((series) => [series.id, series]));
  const seriesByName = new Map(
    seriesList.map((series) => [normalizeGroupKey(series.name), series]),
  );
  const childrenByParentId = new Map<string, Series[]>();
  const directBooksBySeriesId = new Map<string, Book[]>();

  for (const series of seriesList) {
    directBooksBySeriesId.set(series.id, []);
  }

  for (const book of books) {
    const rawSeriesName = book.seriesName?.trim();
    if (!rawSeriesName) continue;
    const series = seriesByName.get(normalizeGroupKey(rawSeriesName));
    if (!series) continue;
    const bucket = directBooksBySeriesId.get(series.id);
    if (bucket) {
      bucket.push(book);
    }
  }

  for (const series of seriesList) {
    if (!series.parentSeriesId) continue;
    const bucket = childrenByParentId.get(series.parentSeriesId);
    if (bucket) {
      bucket.push(series);
    } else {
      childrenByParentId.set(series.parentSeriesId, [series]);
    }
  }

  const descendantBooksCache = new Map<string, Book[]>();

  function collectDescendantBooks(
    seriesId: string,
    visiting = new Set<string>(),
  ): Book[] {
    const cached = descendantBooksCache.get(seriesId);
    if (cached) return cached;
    if (visiting.has(seriesId)) return [];

    visiting.add(seriesId);
    if (!seriesById.has(seriesId)) return [];

    const directBooks = directBooksBySeriesId.get(seriesId) ?? [];
    const combined: Book[] = [...directBooks];

    for (const childSeries of childrenByParentId.get(seriesId) ?? []) {
      combined.push(...collectDescendantBooks(childSeries.id, visiting));
    }

    const deduped: Book[] = [];
    const seen = new Set<string>();
    for (const book of combined) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      deduped.push(book);
    }

    const ordered = sortBooksForParentCarousel(deduped);
    descendantBooksCache.set(seriesId, ordered);
    visiting.delete(seriesId);
    return ordered;
  }

  const parentGroups: SeriesGroup[] = seriesList
    .filter((series) => (childrenByParentId.get(series.id)?.length ?? 0) > 0)
    .map((series) => ({
      key: `parent-${normalizeGroupKey(series.name)}`,
      name: series.name,
      books: collectDescendantBooks(series.id),
      kind: "parent" as const,
      parentName: null,
    }))
    .filter((group) => group.books.length > 0)
    .sort((a, b) => {
      const countDelta = b.books.length - a.books.length;
      if (countDelta !== 0) return countDelta;
      return collator.compare(a.name, b.name);
    });

  const seriesGroups = seriesList
    .map<SeriesGroup | null>((series) => {
      const booksForSeries = directBooksBySeriesId.get(series.id) ?? [];
      if (booksForSeries.length === 0) return null;
      return {
        key: `series-${normalizeGroupKey(series.name)}`,
        name: series.name,
        books: sortBooksBySeriesOrder(booksForSeries),
        kind: "series" as const,
        parentName: series.parentSeriesId
          ? (seriesById.get(series.parentSeriesId)?.name ?? null)
          : null,
      };
    })
    .filter((group): group is SeriesGroup => group !== null)
    .sort((a, b) => {
      const countDelta = b.books.length - a.books.length;
      if (countDelta !== 0) return countDelta;
      return collator.compare(a.name, b.name);
    });

  return { parentGroups, seriesGroups };
}

export function useSeriesBrowse() {
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [cardSize, setCardSize] = useState<CardSize>(() => {
    const storedCardSize = readStorageValue<string>(
      SHELF_CARD_SIZE_STORAGE_KEY,
    );
    return isCardSize(storedCardSize) ? storedCardSize : getDefaultCardSize();
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks, seriesList] = await Promise.all([
        getAllBooks(),
        getWishlistBooks(),
        listSeries(),
      ]);
      setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
      setSeries(seriesList);
    } catch (error) {
      console.error("Failed to load books for series browsing:", error);
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

  const visibleBooks = useMemo(() => {
    if (ownershipFilter === "all") return books;
    return books.filter(
      (book) => (book.ownershipStatus ?? "owned") === ownershipFilter,
    );
  }, [books, ownershipFilter]);

  const standaloneBooks = useMemo(
    () => visibleBooks.filter((book) => !book.seriesName?.trim()),
    [visibleBooks],
  );

  const { parentGroups, seriesGroups } = useMemo(
    () => buildSeriesHierarchy(series, visibleBooks),
    [series, visibleBooks],
  );

  const filteredSeries = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase();
    return seriesGroups
      .map((group) => {
        if (!query || group.name.toLocaleLowerCase().includes(query))
          return group;
        const matchingBooks = group.books.filter((book) =>
          matchesSeriesBookQuery(book, query),
        );
        return matchingBooks.length === 0
          ? null
          : { ...group, books: matchingBooks };
      })
      .filter((group): group is SeriesGroup => group !== null);
  }, [deferredSearchQuery, seriesGroups]);

  const filteredParentSeries = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase();
    return parentGroups
      .map((group) => {
        if (!query || group.name.toLocaleLowerCase().includes(query))
          return group;
        const matchingBooks = group.books.filter((book) =>
          matchesSeriesBookQuery(book, query),
        );
        return matchingBooks.length === 0
          ? null
          : { ...group, books: matchingBooks };
      })
      .filter((group): group is SeriesGroup => group !== null);
  }, [deferredSearchQuery, parentGroups]);

  const seriesBookCount = useMemo(
    () =>
      parentGroups.reduce((count, group) => count + group.books.length, 0) +
      seriesGroups.reduce((count, group) => count + group.books.length, 0),
    [parentGroups, seriesGroups],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || ownershipFilter !== "all";
  const resultsSummary = `${filteredParentSeries.length + filteredSeries.length} series shown`;

  const featuredGroups = useMemo(() => {
    return [...filteredParentSeries, ...filteredSeries]
      .sort((a, b) => {
        const countDelta = b.books.length - a.books.length;
        if (countDelta !== 0) return countDelta;
        if (a.kind !== b.kind) return a.kind === "parent" ? -1 : 1;
        return collator.compare(a.name, b.name);
      })
      .slice(0, 8);
  }, [filteredParentSeries, filteredSeries]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("all");
  }, []);

  const registerCarousel = useCallback(
    (key: string, node: HTMLDivElement | null) => {
      carouselRefs.current[key] = node;
    },
    [],
  );

  const handleStepCarousel = useCallback(
    (key: string, direction: "backward" | "forward") => {
      const carousel = carouselRefs.current[key];
      if (!carousel) return;
      const distance = Math.max(carousel.clientWidth * 0.82, 240);
      carousel.scrollBy({
        left: direction === "forward" ? distance : -distance,
        behavior: getScrollBehavior(),
      });
    },
    [],
  );

  return {
    state: {
      loading,
      isFilterDrawerOpen,
      searchQuery,
      ownershipFilter,
      cardSize,
      parentSeriesGroups: parentGroups,
      groupedSeries: seriesGroups,
      featuredGroups,
      filteredParentSeries,
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
