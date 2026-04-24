import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import type { ReaderId } from "../features/books/readingListPreferences";

const supabaseClient = getSupabaseClientWithSchema();

type ReadingListRow = {
  reader_id: ReaderId;
  book_ids: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

const readerIds = new Set<ReaderId>(["dane", "emma"]);

function normalizeBookIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((id, index, array) => array.indexOf(id) === index);
}

function normalizeReadingListRows(rows: ReadingListRow[]): Record<ReaderId, string[]> {
  const result: Record<ReaderId, string[]> = {
    dane: [],
    emma: [],
  };

  for (const row of rows) {
    if (!readerIds.has(row.reader_id)) {
      continue;
    }

    result[row.reader_id] = normalizeBookIds(row.book_ids);
  }

  return result;
}

async function saveReaderQueue(readerId: ReaderId, bookIds: string[]): Promise<string[]> {
  const normalizedBookIds = normalizeBookIds(bookIds);
  const now = new Date().toISOString();
  const { error } = await supabaseClient
    .from("reading_lists")
    .upsert(
      {
        reader_id: readerId,
        book_ids: normalizedBookIds,
        updated_at: now,
      },
      { onConflict: "reader_id" },
    );

  if (error) {
    throw new Error(error.message);
  }

  return normalizedBookIds;
}

export async function getReadingListQueues(): Promise<Record<ReaderId, string[]>> {
  const { data, error } = await supabaseClient
    .from("reading_lists")
    .select("reader_id, book_ids, created_at, updated_at");

  if (error) {
    throw new Error(error.message);
  }

  return normalizeReadingListRows((data ?? []) as ReadingListRow[]);
}

export async function getReaderQueueIds(readerId: ReaderId): Promise<string[]> {
  if (!readerIds.has(readerId)) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("reading_lists")
    .select("reader_id, book_ids, created_at, updated_at")
    .eq("reader_id", readerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeBookIds((data as ReadingListRow | null)?.book_ids ?? []);
}

export async function addBookToReadingList(
  readerId: ReaderId,
  bookId: string,
): Promise<string[]> {
  const currentIds = await getReaderQueueIds(readerId);
  return await saveReaderQueue(readerId, [bookId, ...currentIds.filter((id) => id !== bookId)]);
}

export async function moveBookInReadingList(
  readerId: ReaderId,
  bookId: string,
  direction: "up" | "down",
): Promise<string[]> {
  const currentIds = await getReaderQueueIds(readerId);
  const index = currentIds.indexOf(bookId);
  if (index < 0) {
    return currentIds;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentIds.length) {
    return currentIds;
  }

  const nextIds = [...currentIds];
  [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
  return await saveReaderQueue(readerId, nextIds);
}

export async function removeBookFromReadingList(
  readerId: ReaderId,
  bookId: string,
): Promise<string[]> {
  const currentIds = await getReaderQueueIds(readerId);
  if (!currentIds.includes(bookId)) {
    return currentIds;
  }

  return await saveReaderQueue(
    readerId,
    currentIds.filter((id) => id !== bookId),
  );
}

export async function resetReadingList(readerId: ReaderId): Promise<string[]> {
  return await saveReaderQueue(readerId, []);
}
