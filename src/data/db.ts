import Dexie, { type EntityTable } from "dexie";
import type { Book } from "../features/books/bookTypes";

/**
 * Interface for stored cover photos
 */
export interface CoverPhoto {
  bookId: string;
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

/**
 * Interface for app settings (Drive folder IDs, etc.)
 */
export interface AppSettings {
  key: string; // Single record with key = "settings"
  driveRootFolderId?: string;
  driveCoversFolderId?: string;
  driveSyncJsonFileId?: string;
  updatedAt: number;
}

/**
 * Dexie database for the library catalog
 * Local-first IndexedDB storage
 */
export class LibraryCatalogDB extends Dexie {
  books!: EntityTable<Book, "id">;
  bookCovers!: EntityTable<CoverPhoto, "bookId">;
  settings!: EntityTable<AppSettings, "key">;

  constructor() {
    super("libraryCatalog");

    // Version 1 schema
    this.version(1).stores({
      books: "id, title, author, createdAt, updatedAt",
    });

    // Version 2 schema with read status
    this.version(2)
      .stores({
        books: "id, title, author, createdAt, updatedAt",
      })
      .upgrade(async (tx) => {
        // Migrate existing books to have readByDane and readByEmma
        await tx
          .table("books")
          .toCollection()
          .modify((book: any) => {
            // If book doesn't have new fields, set them to false
            if (book.readByDane === undefined) {
              book.readByDane = false;
            }
            if (book.readByEmma === undefined) {
              book.readByEmma = false;
            }
          });
      });

    // Version 3 schema with book format
    this.version(3)
      .stores({
        books: "id, title, author, createdAt, updatedAt",
      })
      .upgrade(async (tx) => {
        // Ensure format field exists (optional, so undefined is fine)
        await tx
          .table("books")
          .toCollection()
          .modify((book: any) => {
            if (book.format === undefined) {
              book.format = undefined;
            }
          });
      });

    // Version 4 schema with pages field
    this.version(4)
      .stores({
        books: "id, title, author, createdAt, updatedAt",
      })
      .upgrade(async (tx) => {
        // Ensure pages field exists (optional, so undefined is fine)
        await tx
          .table("books")
          .toCollection()
          .modify((book: any) => {
            if (book.pages === undefined) {
              book.pages = undefined;
            }
          });
      });

    // Version 5 schema with bookCovers table for local cover photos
    this.version(5).stores({
      books: "id, title, author, createdAt, updatedAt",
      bookCovers: "bookId",
    });

    // Version 6 schema with settings table for Drive folder IDs
    this.version(6).stores({
      books: "id, title, author, createdAt, updatedAt",
      bookCovers: "bookId",
      settings: "key",
    });
  }
}

// Export a singleton instance
export const db = new LibraryCatalogDB();

/**
 * Save a cover photo for a book
 */
export async function saveCoverPhoto(
  bookId: string,
  file: File,
): Promise<void> {
  await db.bookCovers.put({
    bookId,
    blob: file,
    mimeType: file.type,
    updatedAt: Date.now(),
  });
}

/**
 * Get a cover photo URL for a book (object URL)
 * Remember to revoke the URL when done to avoid memory leaks
 */
export async function getCoverPhotoUrl(bookId: string): Promise<string | null> {
  const coverPhoto = await db.bookCovers.get(bookId);
  if (!coverPhoto) {
    return null;
  }
  return URL.createObjectURL(coverPhoto.blob);
}

/**
 * Delete a cover photo for a book
 */
export async function deleteCoverPhoto(bookId: string): Promise<void> {
  await db.bookCovers.delete(bookId);
}

/**
 * Check if a book has a local cover photo
 */
export async function hasCoverPhoto(bookId: string): Promise<boolean> {
  const coverPhoto = await db.bookCovers.get(bookId);
  return coverPhoto !== undefined;
}

/**
 * Get Drive folder IDs from settings
 */
export async function getDriveFolderIds(): Promise<{
  rootFolderId: string | undefined;
  coversFolderId: string | undefined;
} | null> {
  const settings = await db.settings.get("settings");
  if (!settings) {
    return null;
  }
  return {
    rootFolderId: settings.driveRootFolderId,
    coversFolderId: settings.driveCoversFolderId,
  };
}

/**
 * Save Drive folder IDs to settings
 */
export async function saveDriveFolderIds(
  rootFolderId: string,
  coversFolderId: string,
): Promise<void> {
  const existing = await db.settings.get("settings");
  await db.settings.put({
    key: "settings",
    driveRootFolderId: rootFolderId,
    driveCoversFolderId: coversFolderId,
    driveSyncJsonFileId: existing?.driveSyncJsonFileId,
    updatedAt: Date.now(),
  });
}
