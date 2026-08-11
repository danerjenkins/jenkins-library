import { supabase } from "../lib/supabaseClient";

const COVER_BUCKET = "book-covers";
const COVER_FOLDER = "covers";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

function getCoverExtension(file: File) {
  const mimeExtension = extensionByMimeType[file.type.toLowerCase()];
  if (mimeExtension) return mimeExtension;

  const fileExtension = file.name.split(".").pop()?.trim().toLowerCase();
  return fileExtension || "jpg";
}

function getCoverObjectPath(bookId: string, file: File) {
  return `${COVER_FOLDER}/${bookId}.${getCoverExtension(file)}`;
}

function getCoverObjectPathFromUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${COVER_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export function isBookCoverPhotoUrl(url: string | null | undefined): boolean {
  const path = getCoverObjectPathFromUrl(url);
  return path?.startsWith(`${COVER_FOLDER}/`) ?? false;
}

export async function uploadBookCoverPhoto(bookId: string, file: File): Promise<string> {
  const path = getCoverObjectPath(bookId, file);
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeBookCoverPhoto(coverUrl: string | null | undefined): Promise<void> {
  const path = getCoverObjectPathFromUrl(coverUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(COVER_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}
