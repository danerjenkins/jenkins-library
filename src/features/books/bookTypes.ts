/**
 * Book model for the library catalog
 */

export type BookFormat =
  | "mmpb"
  | "paperback"
  | "hardcover"
  | "ebook"
  | "audiobook"
  | "other";

export const BOOK_FORMAT_LABELS: Record<BookFormat, string> = {
  mmpb: "Mass Market Paperback",
  paperback: "Paperback",
  hardcover: "Hardcover",
  ebook: "E-book",
  audiobook: "Audiobook",
  other: "Other",
};

export const COMMON_GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Non-fiction",
  "Biography",
  "Memoir",
  "Self-Help",
  "Business",
  "History",
  "Philosophy",
  "Poetry",
  "Drama",
  "Horror",
  "Young Adult",
  "Children",
  "Classic",
  "Adventure",
  "Literary Fiction",
];

export interface Book {
  /** Primary key */
  id: string;
  /** Book title */
  title: string;
  /** Book author */
  author: string;
  /** Book genre (optional) */
  genre?: string | null;
  /** Book description (optional) */
  description?: string | null;
  /** Book ISBN (optional) */
  isbn?: string | null;
  /** Whether the book has been finished */
  finished?: boolean;
  /** Cover image URL (optional) */
  coverUrl?: string | null;
  /** Whether Dane has read this book */
  readByDane: boolean;
  /** Whether Emma has read this book */
  readByEmma: boolean;
  /** Book format (optional) */
  format?: BookFormat;
  /** Total number of pages (optional) */
  pages?: number;
  /** Timestamp when the book was created */
  createdAt: number;
  /** Timestamp when the book was last updated */
  updatedAt: number;
}

/**
 * Derived read status for display
 */
export type ReadStatus = "neither" | "dane" | "emma" | "both";

/**
 * Get the read status label for a book
 */
export function getReadStatusLabel(book: Book): string {
  if (book.readByDane && book.readByEmma) {
    return "Read by Dane & Emma";
  }
  if (book.readByDane) {
    return "Read by Dane";
  }
  if (book.readByEmma) {
    return "Read by Emma";
  }
  return "To read";
}

/**
 * Get the read status type for filtering
 */
export function getReadStatus(book: Book): ReadStatus {
  if (book.readByDane && book.readByEmma) {
    return "both";
  }
  if (book.readByDane) {
    return "dane";
  }
  if (book.readByEmma) {
    return "emma";
  }
  return "neither";
}

/**
 * Generate a Google Images search URL for a book
 */
export function getGoogleImageSearchUrl(
  title: string,
  author?: string | null,
): string {
  const query = `${title}${author ? ` ${author}` : ""} book cover`;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
}
