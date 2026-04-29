import { sortBooksBySeriesOrder } from "../../../data/bookRepo";
import type { Book } from "../lib/bookTypes";
import type { CardSize } from "../lib/shelfViewPreferences";

export type OwnershipFilter = "all" | "owned" | "wishlist";

export function mergeDiscoveryBooks(ownedBooks: Book[], wishlistBooks: Book[]) {
  const bookMap = new Map<string, Book>();
  for (const book of [...ownedBooks, ...wishlistBooks]) {
    bookMap.set(book.id, book);
  }
  return Array.from(bookMap.values());
}

export function getScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "auto";
  }

  return "smooth";
}

export function getSeriesCarouselCardWidthClass(cardSize: CardSize) {
  switch (cardSize) {
    case "xsmall":
      return "w-[8.75rem] sm:w-[9.5rem]";
    case "small":
      return "w-[11.25rem] sm:w-[12rem]";
    case "medium":
      return "w-[13rem] sm:w-[14rem]";
    case "large":
      return "w-[14.5rem] sm:w-[16rem]";
    default:
      return "w-[13rem] sm:w-[14rem]";
  }
}

export function getGenreCarouselCardWidthClass(cardSize: CardSize) {
  switch (cardSize) {
    case "xsmall":
      return "w-[8.75rem] sm:w-[9.5rem]";
    case "small":
      return "w-[11.25rem] sm:w-[12rem]";
    case "medium":
      return "w-[13rem] sm:w-[14rem]";
    case "large":
      return "w-[14.5rem] sm:w-[16rem]";
    default:
      return "w-[13rem] sm:w-[14rem]";
  }
}

export function normalizeSeriesName(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function matchesSeriesBookQuery(book: Book, query: string) {
  if (!query) return true;
  return matchesBookSearchQuery(book, query);
}

export function getSeriesProgressLabel(books: Book[]) {
  const orderedBooks = sortBooksBySeriesOrder(books);
  const numberedBooks = orderedBooks.filter(
    (book) => book.seriesSort !== null && book.seriesSort !== undefined,
  );
  if (numberedBooks.length < 2) {
    return `${books.length} ${books.length === 1 ? "book" : "books"}`;
  }

  const first = numberedBooks[0]?.seriesSort;
  const last = numberedBooks[numberedBooks.length - 1]?.seriesSort;
  if (
    first === undefined ||
    first === null ||
    last === undefined ||
    last === null
  ) {
    return `${books.length} ${books.length === 1 ? "book" : "books"}`;
  }

  return `Books ${first}-${last}`;
}

export function normalizeGenre(genre?: string | null) {
  const trimmed = genre?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Uncategorized";
}

export function toGenreSectionId(genre: string) {
  return `genre-${genre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function matchesGenreBookQuery(book: Book, query: string) {
  if (!query) return true;
  return matchesBookSearchQuery(book, query);
}

export function matchesBookSearchQuery(book: Book, query: string) {
  if (!query) return true;

  return [
    book.title,
    book.author,
    book.genre,
    book.description,
    book.isbn,
    book.seriesName,
    book.seriesLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function sortGenreShelfBooks(books: Book[]) {
  const bySeries = sortBooksBySeriesOrder([...books]);
  return bySeries.sort((a, b) => {
    const genreCompare = normalizeGenre(a.genre).localeCompare(
      normalizeGenre(b.genre),
      undefined,
      {
        sensitivity: "base",
      },
    );
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      {
        sensitivity: "base",
      },
    );
    if (seriesCompare !== 0) return seriesCompare;

    const seriesOrderA = a.seriesSort ?? Number.POSITIVE_INFINITY;
    const seriesOrderB = b.seriesSort ?? Number.POSITIVE_INFINITY;
    if (seriesOrderA !== seriesOrderB) return seriesOrderA - seriesOrderB;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}
