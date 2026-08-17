import { getActiveLibraryIdForRepos } from "../features/libraries/activeLibraryState";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import type { ReaderId } from "../features/books/lib/readingListPreferences";

const supabaseClient = getSupabaseClientWithSchema();

type TbrItemRow = {
  member_id: string;
  book_id: string;
  position: number;
};

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

async function saveReaderQueue(readerId: ReaderId, bookIds: string[]): Promise<string[]> {
  const libraryId = getActiveLibraryIdForRepos();
  if (!libraryId) {
    throw new Error("Choose a library before changing a TBR list.");
  }

  const normalizedBookIds = normalizeBookIds(bookIds);
  const { error: deleteError } = await supabaseClient
    .from("tbr_items")
    .delete()
    .eq("member_id", readerId)
    .eq("library_id", libraryId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (normalizedBookIds.length === 0) {
    return [];
  }

  const rows = normalizedBookIds.map((bookId, index) => ({
    library_id: libraryId,
    member_id: readerId,
    book_id: bookId,
    position: index + 1,
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabaseClient.from("tbr_items").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return normalizedBookIds;
}

export async function getReadingListQueues(
  readerIds: ReaderId[] = [],
): Promise<Record<ReaderId, string[]>> {
  const libraryId = getActiveLibraryIdForRepos();
  if (!libraryId) {
    return {};
  }

  let query = supabaseClient
    .from("tbr_items")
    .select("member_id, book_id, position")
    .eq("library_id", libraryId)
    .order("position", { ascending: true });

  if (readerIds.length > 0) {
    query = query.in("member_id", readerIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const result: Record<ReaderId, string[]> = {};
  for (const readerId of readerIds) {
    result[readerId] = [];
  }

  for (const row of (data ?? []) as TbrItemRow[]) {
    result[row.member_id] = [...(result[row.member_id] ?? []), row.book_id];
  }

  return result;
}

export async function getReaderQueueIds(readerId: ReaderId): Promise<string[]> {
  const queues = await getReadingListQueues([readerId]);
  return queues[readerId] ?? [];
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
