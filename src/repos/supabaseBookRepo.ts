import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import { supabase } from "../lib/supabaseClient";
import { getActiveLibraryIdForRepos } from "../features/libraries/activeLibraryState";
import * as BookTypes from "../features/books/lib/bookTypes";
import type {
  Book,
  BookCheckout,
  BookFormat,
  BookReader,
  BookReview,
} from "../features/books/lib/bookTypes";

export type BookInput = {
  title: string;
  author: string;
  genre?: string | null;
  description?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  publishedYear?: number | null;
  finished?: boolean;
  readByDane?: boolean;
  readByEmma?: boolean;
  format?: BookFormat;
  pages?: number;
  ownershipStatus?: "owned" | "wishlist";
  mostWanted?: boolean;
};

type BookRow = {
  id: string;
  library_id: string;
  title: string | null;
  author: string | null;
  genre: string | null;
  description: string | null;
  isbn: string | null;
  published_year: number | null;
  cover_url: string | null;
  cover_drive_file_id: string | null;
  finished: boolean | null;
  format: string | null;
  pages: number | null;
  read_by_dane: boolean | null;
  read_by_emma: boolean | null;
  ownership_status: "owned" | "wishlist" | null;
  most_wanted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

type BookWithSeriesRow = BookRow & {
  series_id: string | null;
  series_name: string | null;
  series_label: string | null;
  series_sort: number | null;
};

const supabaseClient = getSupabaseClientWithSchema();

function toTimestamp(value: string | null): number {
  if (!value) {
    return Date.now();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeFormat(value: string | null): BookFormat | undefined {
  if (!value) {
    return undefined;
  }

  return value in BookTypes.BOOK_FORMAT_LABELS ? (value as BookFormat) : undefined;
}

function mapRowToBook(row: BookWithSeriesRow): Book {
  const createdAt = toTimestamp(row.created_at);
  const updatedAt = row.updated_at ? toTimestamp(row.updated_at) : createdAt;

  return {
    id: row.id,
    libraryId: row.library_id,
    title: row.title ?? "",
    author: row.author ?? "",
    genre: row.genre ?? null,
    description: row.description ?? null,
    isbn: row.isbn ?? null,
    finished: row.finished ?? false,
    coverUrl: row.cover_url ?? null,
    readers: [],
    currentUserHasRead: false,
    reviews: [],
    activeCheckout: null,
    currentUserReview: null,
    averageRating: null,
    ratingCount: 0,
    readByDane: row.read_by_dane ?? false,
    readByEmma: row.read_by_emma ?? false,
    format: normalizeFormat(row.format),
    pages: row.pages ?? undefined,
    publishedYear: row.published_year ?? null,
    seriesId: row.series_id ?? null,
    seriesName: row.series_name ?? null,
    seriesLabel: row.series_label ?? null,
    seriesSort: row.series_sort ?? null,
    ownershipStatus: row.ownership_status ?? undefined,
    mostWanted: row.most_wanted ?? false,
    createdAt,
    updatedAt,
  };
}

type ReadRow = {
  book_id: string;
  member_id: string;
  read_at: string;
};

type MemberRow = {
  id: string;
  user_id: string | null;
  display_name: string;
};

type ReviewRow = {
  book_id: string;
  member_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
};

type CheckoutRow = {
  id: string;
  library_id: string;
  book_id: string;
  borrower_member_id: string | null;
  borrower_name: string;
  checked_out_at: string;
  returned_at: string | null;
};

export type BookCheckoutInput = {
  bookId: string;
  borrowerMemberId?: string | null;
  borrowerName: string;
};

export type CheckedOutBook = {
  checkout: BookCheckout;
  book: Book;
};

function mapCheckoutRow(row: CheckoutRow): BookCheckout {
  return {
    id: row.id,
    libraryId: row.library_id,
    bookId: row.book_id,
    borrowerMemberId: row.borrower_member_id,
    borrowerName: row.borrower_name,
    checkedOutAt: row.checked_out_at,
    returnedAt: row.returned_at,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function hydrateBooksWithActivity(books: Book[]): Promise<Book[]> {
  if (books.length === 0) {
    return books;
  }

  const bookIds = books.map((book) => book.id);
  const [readResult, reviewResult, checkoutResult] = await Promise.all([
    supabaseClient
      .from("user_book_reads")
      .select("book_id, member_id, read_at")
      .in("book_id", bookIds),
    supabaseClient
      .from("user_book_reviews")
      .select("book_id, member_id, rating, review, created_at, updated_at")
      .in("book_id", bookIds),
    supabaseClient
      .from("book_checkouts")
      .select("id, library_id, book_id, borrower_member_id, borrower_name, checked_out_at, returned_at")
      .in("book_id", bookIds)
      .is("returned_at", null),
  ]);

  const readRows = readResult.error ? [] : ((readResult.data ?? []) as ReadRow[]);
  const reviewRows = reviewResult.error
    ? []
    : ((reviewResult.data ?? []) as ReviewRow[]);
  const checkoutRows = checkoutResult.error
    ? []
    : ((checkoutResult.data ?? []) as CheckoutRow[]);

  if (readRows.length === 0 && reviewRows.length === 0 && checkoutRows.length === 0) {
    return books;
  }

  const memberIds = Array.from(
    new Set([
      ...readRows.map((row) => row.member_id),
      ...reviewRows.map((row) => row.member_id),
    ]),
  );
  const memberResult =
    memberIds.length > 0
      ? await supabaseClient
          .from("library_members")
          .select("id, user_id, display_name")
          .in("id", memberIds)
      : { data: [], error: null };

  const memberRows = memberResult.error ? [] : (memberResult.data ?? []);

  const currentUserId = await getCurrentUserId();
  const membersById = new Map(
    (memberRows as MemberRow[]).map((member) => [member.id, member]),
  );
  const readersByBookId = new Map<string, BookReader[]>();
  const reviewsByBookId = new Map<string, BookReview[]>();
  const activeCheckoutByBookId = new Map(
    checkoutRows.map((row) => [row.book_id, mapCheckoutRow(row)]),
  );

  for (const row of readRows) {
    const member = membersById.get(row.member_id);
    if (!member) continue;

    const reader: BookReader = {
      memberId: row.member_id,
      userId: member.user_id,
      displayName: member.display_name,
      readAt: row.read_at,
    };
    const readers = readersByBookId.get(row.book_id) ?? [];
    readers.push(reader);
    readersByBookId.set(row.book_id, readers);
  }

  for (const row of reviewRows) {
    const member = membersById.get(row.member_id);
    if (!member) continue;

    const review: BookReview = {
      bookId: row.book_id,
      memberId: row.member_id,
      userId: member.user_id,
      displayName: member.display_name,
      rating: row.rating,
      review: row.review,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isCurrentUserReview: Boolean(currentUserId && member.user_id === currentUserId),
    };
    const reviews = reviewsByBookId.get(row.book_id) ?? [];
    reviews.push(review);
    reviewsByBookId.set(row.book_id, reviews);
  }

  return books.map((book) => {
    const readers = readersByBookId.get(book.id) ?? [];
    const reviews = reviewsByBookId.get(book.id) ?? [];
    const currentUserHasRead = Boolean(
      currentUserId && readers.some((reader) => reader.userId === currentUserId),
    );
    const ratingCount = reviews.length;
    const averageRating =
      ratingCount > 0
        ? reviews.reduce((total, review) => total + review.rating, 0) / ratingCount
        : null;
    return {
      ...book,
      readers,
      currentUserHasRead,
      reviews,
      activeCheckout: activeCheckoutByBookId.get(book.id) ?? null,
      currentUserReview:
        reviews.find((review) => review.isCurrentUserReview) ?? null,
      averageRating,
      ratingCount,
      readByDane: readers.some((reader) => reader.displayName.toLowerCase() === "dane"),
      readByEmma: readers.some((reader) => reader.displayName.toLowerCase() === "emma"),
    };
  });
}

export async function listBooks(): Promise<Book[]> {
  let query = supabaseClient
    .from("books_with_series")
    .select("*")
    .is("deleted_at", null)
    .eq("ownership_status", "owned")
    .order("genre", { ascending: true, nullsFirst: false })
    .order("author", { ascending: true, nullsFirst: false });
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return hydrateBooksWithActivity((data ?? []).map((row) => mapRowToBook(row as BookWithSeriesRow)));
}

export async function listWishlistBooks(): Promise<Book[]> {
  let query = supabaseClient
    .from("books_with_series")
    .select("*")
    .is("deleted_at", null)
    .eq("ownership_status", "wishlist")
    .order("genre", { ascending: true, nullsFirst: false })
    .order("author", { ascending: true, nullsFirst: false });
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return hydrateBooksWithActivity((data ?? []).map((row) => mapRowToBook(row as BookWithSeriesRow)));
}

export async function getBook(id: string): Promise<Book | null> {
  let query = supabaseClient
    .from("books_with_series")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [book] = await hydrateBooksWithActivity([mapRowToBook(data as BookWithSeriesRow)]);
  return book ?? null;
}

export async function createBook(input: BookInput): Promise<Book> {
  const insertRow = {
    library_id: getActiveLibraryIdForRepos(),
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    cover_url: input.coverUrl ?? null,
    published_year: input.publishedYear ?? null,
    finished: input.finished ?? false,
    format: input.format ?? null,
    pages: input.pages ?? null,
    read_by_dane: input.readByDane ?? false,
    read_by_emma: input.readByEmma ?? false,
    ownership_status: input.ownershipStatus ?? "owned",
    most_wanted: input.mostWanted ?? false,
  };

  if (!insertRow.library_id) {
    throw new Error("Choose a library before adding a book.");
  }

  const { data, error } = await supabaseClient
    .from("books")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create book in Supabase.");
  }
  const withSeries = await getBook(data.id);
  if (withSeries) {
    return withSeries;
  }

  return mapRowToBook({
    ...(data as BookRow),
    library_id: (data as BookRow).library_id,
    series_id: null,
    series_name: null,
    series_label: null,
    series_sort: null,
  });
}

export async function updateBook(
  id: string,
  patch: Partial<BookInput>,
): Promise<Book> {
  const updateRow: Partial<BookRow> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) updateRow.title = patch.title;
  if (patch.author !== undefined) updateRow.author = patch.author;
  if (patch.genre !== undefined) updateRow.genre = patch.genre ?? null;
  if (patch.description !== undefined)
    updateRow.description = patch.description ?? null;
  if (patch.isbn !== undefined) updateRow.isbn = patch.isbn ?? null;
  if (patch.coverUrl !== undefined)
    updateRow.cover_url = patch.coverUrl ?? null;
  if (patch.publishedYear !== undefined)
    updateRow.published_year = patch.publishedYear ?? null;
  if (patch.finished !== undefined) updateRow.finished = patch.finished;
  if (patch.format !== undefined) updateRow.format = patch.format ?? null;
  if (patch.pages !== undefined) updateRow.pages = patch.pages ?? null;
  if (patch.readByDane !== undefined) updateRow.read_by_dane = patch.readByDane;
  if (patch.readByEmma !== undefined) updateRow.read_by_emma = patch.readByEmma;
  if (patch.ownershipStatus !== undefined)
    updateRow.ownership_status = patch.ownershipStatus;
  if (patch.mostWanted !== undefined) updateRow.most_wanted = patch.mostWanted;

  let query = supabaseClient
    .from("books")
    .update(updateRow)
    .eq("id", id);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to update book in Supabase.");
  }
  const withSeries = await getBook(data.id);
  if (withSeries) {
    return withSeries;
  }

  return mapRowToBook({
    ...(data as BookRow),
    library_id: (data as BookRow).library_id,
    series_id: null,
    series_name: null,
    series_label: null,
    series_sort: null,
  });
}

export async function softDeleteBook(id: string): Promise<void> {
  let query = supabaseClient
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBook(id: string): Promise<void> {
  let query = supabaseClient
    .from("books")
    .delete()
    .eq("id", id);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Delete failed or was not permitted.");
  }
}

export async function setCurrentUserReadStatus(
  bookId: string,
  hasRead: boolean,
): Promise<void> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before changing read status.");
  }

  const { data: memberId, error: memberError } = await supabaseClient.rpc(
    "current_library_member_id",
    { p_library_id: activeLibraryId },
  );

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!memberId || typeof memberId !== "string") {
    throw new Error("Your account is not a member of this library.");
  }

  if (hasRead) {
    const { error } = await supabaseClient.from("user_book_reads").upsert(
      {
        book_id: bookId,
        member_id: memberId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "book_id,member_id" },
    );
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await supabaseClient
    .from("user_book_reads")
    .delete()
    .eq("book_id", bookId)
    .eq("member_id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertCurrentUserReview(
  bookId: string,
  rating: number,
  review: string | null,
): Promise<void> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before rating a book.");
  }

  const { data: memberId, error: memberError } = await supabaseClient.rpc(
    "current_library_member_id",
    { p_library_id: activeLibraryId },
  );

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!memberId || typeof memberId !== "string") {
    throw new Error("Your account is not a member of this library.");
  }

  const { error } = await supabaseClient.from("user_book_reviews").upsert(
    {
      book_id: bookId,
      member_id: memberId,
      rating,
      review: review?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "book_id,member_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCurrentUserReview(bookId: string): Promise<void> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before changing a rating.");
  }

  const { data: memberId, error: memberError } = await supabaseClient.rpc(
    "current_library_member_id",
    { p_library_id: activeLibraryId },
  );

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!memberId || typeof memberId !== "string") {
    throw new Error("Your account is not a member of this library.");
  }

  const { error } = await supabaseClient
    .from("user_book_reviews")
    .delete()
    .eq("book_id", bookId)
    .eq("member_id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getActiveCheckoutForBook(
  bookId: string,
): Promise<BookCheckout | null> {
  let query = supabaseClient
    .from("book_checkouts")
    .select("id, library_id, book_id, borrower_member_id, borrower_name, checked_out_at, returned_at")
    .eq("book_id", bookId)
    .is("returned_at", null);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapCheckoutRow(data as CheckoutRow) : null;
}

export async function listActiveCheckouts(): Promise<CheckedOutBook[]> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before viewing checkouts.");
  }

  const { data, error } = await supabaseClient
    .from("book_checkouts")
    .select("id, library_id, book_id, borrower_member_id, borrower_name, checked_out_at, returned_at")
    .eq("library_id", activeLibraryId)
    .is("returned_at", null)
    .order("checked_out_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const checkoutRows = (data ?? []) as CheckoutRow[];
  if (checkoutRows.length === 0) {
    return [];
  }

  const bookIds = checkoutRows.map((checkout) => checkout.book_id);
  const { data: bookRows, error: bookError } = await supabaseClient
    .from("books_with_series")
    .select("*")
    .in("id", bookIds)
    .is("deleted_at", null);

  if (bookError) {
    throw new Error(bookError.message);
  }

  const books = await hydrateBooksWithActivity(
    ((bookRows ?? []) as BookWithSeriesRow[]).map(mapRowToBook),
  );
  const booksById = new Map(books.map((book) => [book.id, book]));

  return checkoutRows.flatMap((row) => {
    const book = booksById.get(row.book_id);
    if (!book) {
      return [];
    }
    return [{ checkout: mapCheckoutRow(row), book }];
  });
}

export async function checkOutBook(input: BookCheckoutInput): Promise<BookCheckout> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before checking out a book.");
  }

  const borrowerName = input.borrowerName.trim();
  if (!borrowerName) {
    throw new Error("Enter a borrower name.");
  }

  const { data, error } = await supabaseClient
    .from("book_checkouts")
    .insert({
      library_id: activeLibraryId,
      book_id: input.bookId,
      borrower_member_id: input.borrowerMemberId ?? null,
      borrower_name: borrowerName,
    })
    .select("id, library_id, book_id, borrower_member_id, borrower_name, checked_out_at, returned_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to check out book.");
  }

  return mapCheckoutRow(data as CheckoutRow);
}

export async function returnBook(checkoutId: string): Promise<void> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before returning a book.");
  }

  const { data, error } = await supabaseClient
    .from("book_checkouts")
    .update({
      returned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("library_id", activeLibraryId)
    .is("returned_at", null)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Return failed or was not permitted.");
  }
}
