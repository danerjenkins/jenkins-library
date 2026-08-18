import type { Book } from "../features/books/lib/bookTypes";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import {
  createBook as createSupabaseBook,
  checkOutBook as checkOutSupabaseBook,
  deleteBook as deleteSupabaseBook,
  getBook as getSupabaseBook,
  getActiveCheckoutForBook as getSupabaseActiveCheckoutForBook,
  getBoardGame as getSupabaseBoardGame,
  listActiveCheckouts as listSupabaseActiveCheckouts,
  listBoardGames as listSupabaseBoardGames,
  listBooks as listSupabaseBooks,
  listWishlistBooks,
  returnBook as returnSupabaseBook,
  setCurrentUserReadStatus as setSupabaseCurrentUserReadStatus,
  deleteCurrentUserReview as deleteSupabaseCurrentUserReview,
  upsertCurrentUserReview as upsertSupabaseCurrentUserReview,
  updateBook as updateSupabaseBook,
  type BookCheckoutInput,
  type CheckedOutBook,
  type BookInput as SupabaseBookInput,
} from "../repos/supabaseBookRepo";

const DELETED_IDS_STORAGE_KEY = "sync:deletedBookIds";
const supabaseClient = getSupabaseClientWithSchema();

type BookInput = {
  title: string;
  author: string;
  genre?: string | null;
  description?: string | null;
  isbn?: string | null;
  finished?: boolean;
  coverUrl?: string | null;
  publishedYear?: number | null;
  readByDane?: boolean;
  readByEmma?: boolean;
  format?: string;
  pages?: number;
  ownershipStatus?: "owned" | "wishlist";
  mostWanted?: boolean;
  mediaType?: "book" | "board_game";
  publisher?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  playTimeMinutes?: number | null;
  minAge?: number | null;
  complexity?: number | null;
  category?: string | null;
};

export type BookSeriesInput = {
  seriesId: string;
  seriesLabel?: string | null;
  seriesSort?: number | null;
};

function toSupabaseInput(input: BookInput): SupabaseBookInput {
  return {
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    coverUrl: input.coverUrl ?? null,
    publishedYear: input.publishedYear ?? null,
    finished: input.finished ?? false,
    readByDane: input.readByDane ?? false,
    readByEmma: input.readByEmma ?? false,
    format: input.format as SupabaseBookInput["format"],
    pages: input.pages,
    ownershipStatus: input.ownershipStatus,
    mostWanted: input.mostWanted,
    mediaType: input.mediaType,
    publisher: input.publisher ?? null,
    minPlayers: input.minPlayers ?? null,
    maxPlayers: input.maxPlayers ?? null,
    playTimeMinutes: input.playTimeMinutes ?? null,
    minAge: input.minAge ?? null,
    complexity: input.complexity ?? null,
    category: input.category ?? null,
  };
}

function toSupabasePatch(
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Partial<SupabaseBookInput> {
  const result: Partial<SupabaseBookInput> = {};

  if (patch.title !== undefined) result.title = patch.title;
  if (patch.author !== undefined) result.author = patch.author;
  if (patch.genre !== undefined) result.genre = patch.genre ?? null;
  if (patch.description !== undefined)
    result.description = patch.description ?? null;
  if (patch.isbn !== undefined) result.isbn = patch.isbn ?? null;
  if (patch.coverUrl !== undefined) result.coverUrl = patch.coverUrl ?? null;
  if (patch.publishedYear !== undefined)
    result.publishedYear = patch.publishedYear ?? null;
  if (patch.finished !== undefined) result.finished = patch.finished;
  if (patch.readByDane !== undefined) result.readByDane = patch.readByDane;
  if (patch.readByEmma !== undefined) result.readByEmma = patch.readByEmma;
  if (patch.format !== undefined) result.format = patch.format as SupabaseBookInput["format"];
  if (patch.pages !== undefined) result.pages = patch.pages;
  if (patch.ownershipStatus !== undefined)
    result.ownershipStatus = patch.ownershipStatus;
  if (patch.mostWanted !== undefined) result.mostWanted = patch.mostWanted;
  if (patch.mediaType !== undefined) result.mediaType = patch.mediaType;
  if (patch.publisher !== undefined) result.publisher = patch.publisher ?? null;
  if (patch.minPlayers !== undefined) result.minPlayers = patch.minPlayers ?? null;
  if (patch.maxPlayers !== undefined) result.maxPlayers = patch.maxPlayers ?? null;
  if (patch.playTimeMinutes !== undefined)
    result.playTimeMinutes = patch.playTimeMinutes ?? null;
  if (patch.minAge !== undefined) result.minAge = patch.minAge ?? null;
  if (patch.complexity !== undefined) result.complexity = patch.complexity ?? null;
  if (patch.category !== undefined) result.category = patch.category ?? null;

  return result;
}

/**
 * Get the list of deleted book IDs since last sync
 */
export function getDeletedBookIds(): string[] {
  const stored = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear the deletion tracking list (call after successful sync)
 */
export function clearDeletedBookIds(): void {
  localStorage.removeItem(DELETED_IDS_STORAGE_KEY);
}

export async function getAllBooks(): Promise<Book[]> {
  return await listSupabaseBooks();
}

export async function getWishlistBooks(): Promise<Book[]> {
  return await listWishlistBooks();
}

export async function getBoardGames(): Promise<Book[]> {
  return await listSupabaseBoardGames();
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const book = await getSupabaseBook(id);
  return book ?? undefined;
}

export async function getBoardGameById(id: string): Promise<Book | undefined> {
  const boardGame = await getSupabaseBoardGame(id);
  return boardGame ?? undefined;
}

export async function addBook(input: BookInput): Promise<Book> {
  return await createSupabaseBook(toSupabaseInput(input));
}

export async function addBoardGame(input: BookInput): Promise<Book> {
  return await createSupabaseBook(
    toSupabaseInput({ ...input, mediaType: "board_game" }),
  );
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Promise<Book> {
  return await updateSupabaseBook(id, toSupabasePatch(patch));
}

export async function setCurrentUserReadStatus(
  bookId: string,
  hasRead: boolean,
): Promise<void> {
  await setSupabaseCurrentUserReadStatus(bookId, hasRead);
}

export async function upsertCurrentUserReview(
  bookId: string,
  rating: number,
  review: string | null,
): Promise<void> {
  await upsertSupabaseCurrentUserReview(bookId, rating, review);
}

export async function deleteCurrentUserReview(bookId: string): Promise<void> {
  await deleteSupabaseCurrentUserReview(bookId);
}

export async function getActiveCheckoutForBook(bookId: string) {
  return await getSupabaseActiveCheckoutForBook(bookId);
}

export async function getCheckedOutBooks(): Promise<CheckedOutBook[]> {
  return await listSupabaseActiveCheckouts();
}

export async function checkOutBook(input: BookCheckoutInput) {
  return await checkOutSupabaseBook(input);
}

export async function returnBook(checkoutId: string): Promise<void> {
  await returnSupabaseBook(checkoutId);
}

export async function deleteBook(id: string): Promise<void> {
  await deleteSupabaseBook(id);
}

export async function setBookSeries(
  bookId: string,
  input: BookSeriesInput,
): Promise<void> {
  const { error } = await supabaseClient
    .from("book_series")
    .upsert(
      {
        book_id: bookId,
        series_id: input.seriesId,
        series_label: input.seriesLabel ?? null,
        series_sort: input.seriesSort ?? null,
      },
      { onConflict: "book_id" },
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearBookSeries(bookId: string): Promise<void> {
  const { error } = await supabaseClient
    .from("book_series")
    .delete()
    .eq("book_id", bookId);

  if (error) {
    throw new Error(error.message);
  }
}

export function sortBooksBySeriesOrder(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const sortA = a.seriesSort ?? Number.POSITIVE_INFINITY;
    const sortB = b.seriesSort ?? Number.POSITIVE_INFINITY;
    if (sortA !== sortB) return sortA - sortB;
    return a.title.localeCompare(b.title);
  });
}
