/**
 * Book model for the library catalog
 */

export type BookFormat =
  | "mmpb"
  | "paperback"
  | "hardcover"
  | "trade_paperback"
  | "ebook"
  | "audiobook"
  | "other";

export const BOOK_FORMAT_LABELS: Record<BookFormat, string> = {
  mmpb: "Mass Market Paperback",
  paperback: "Paperback",
  hardcover: "Hardcover",
  trade_paperback: "Trade Paperback",
  ebook: "E-book",
  audiobook: "Audiobook",
  other: "Other",
};

export type MediaType = "book" | "board_game";

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
  /** Library this record belongs to */
  libraryId: string;
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
  /** Visible members who have read this book */
  readers: BookReader[];
  /** Whether the signed-in member has read this book */
  currentUserHasRead: boolean;
  /** Visible member ratings and reviews for this book */
  reviews: BookReview[];
  /** Current checkout details, visible to library editors */
  activeCheckout?: BookCheckout | null;
  /** The signed-in member's own review, when present */
  currentUserReview: BookReview | null;
  /** Average visible rating for this book */
  averageRating: number | null;
  /** Count of visible ratings used in the average */
  ratingCount: number;
  /** Legacy compatibility while older UI surfaces are refactored */
  readByDane: boolean;
  /** Legacy compatibility while older UI surfaces are refactored */
  readByEmma: boolean;
  /** Book format (optional) */
  format?: BookFormat;
  /** Total number of pages (optional) */
  pages?: number;
  /** Published year (optional) */
  publishedYear?: number | null;
  /** Series id (optional) */
  seriesId?: string | null;
  /** Series name (optional) */
  seriesName?: string | null;
  /** Series label (optional, display value) */
  seriesLabel?: string | null;
  /** Series sort order (optional, numeric) */
  seriesSort?: number | null;
  /** Ownership status (optional) */
  ownershipStatus?: "owned" | "wishlist";
  /** Catalog item type */
  mediaType?: MediaType;
  /** Board game publisher (optional) */
  publisher?: string | null;
  /** Minimum player count for board games */
  minPlayers?: number | null;
  /** Maximum player count for board games */
  maxPlayers?: number | null;
  /** Typical board game play time in minutes */
  playTimeMinutes?: number | null;
  /** Recommended minimum age for board games */
  minAge?: number | null;
  /** Board game complexity rating, 1-5 */
  complexity?: number | null;
  /** Board game category */
  category?: string | null;
  /** Whether this wishlist book should be prioritized */
  mostWanted?: boolean;
  /** Timestamp when the book was created */
  createdAt: number;
  /** Timestamp when the book was last updated */
  updatedAt: number;
}

export interface BookReader {
  memberId: string;
  userId: string | null;
  displayName: string;
  readAt: string;
}

export interface BookReview {
  bookId: string;
  memberId: string;
  userId: string | null;
  displayName: string;
  rating: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrentUserReview: boolean;
}

export interface BookCheckout {
  id: string;
  libraryId: string;
  bookId: string;
  borrowerMemberId: string | null;
  borrowerName: string;
  checkedOutAt: string;
  returnedAt: string | null;
}

export interface Series {
  id: string;
  name: string;
  parentSeriesId?: string | null;
}

export interface BookSeries {
  bookId: string;
  seriesId: string;
  seriesLabel?: string | null;
  seriesSort?: number | null;
}

/**
 * Derived read status for display
 */
export type ReadStatus = "neither" | "dane" | "emma" | "both";

/**
 * Get the read status label for a book
 */
export function getReadStatusLabel(book: Book): string {
  if (book.currentUserHasRead) {
    return "Read by you";
  }
  if (book.readers.length > 0) {
    return `Read by ${book.readers.map((reader) => reader.displayName).join(", ")}`;
  }
  return "To read";
}

/**
 * Get the read status type for filtering
 */
export function getReadStatus(book: Book): ReadStatus {
  if (book.currentUserHasRead && book.readers.length > 1) {
    return "both";
  }
  if (book.currentUserHasRead) {
    return "dane";
  }
  if (book.readers.length > 0) {
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
