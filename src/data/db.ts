import Dexie, { type EntityTable } from "dexie";
import type { Book } from "../features/books/bookTypes";

/**
 * Dexie database for the library catalog
 * Local-first IndexedDB storage
 */
export class LibraryCatalogDB extends Dexie {
  books!: EntityTable<Book, "id">;

  constructor() {
    super("libraryCatalog");

    // Version 1 schema
    this.version(1).stores({
      books: "id, title, author, createdAt, updatedAt",
    });
  }
}

// Export a singleton instance
export const db = new LibraryCatalogDB();
