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
  }
}

// Export a singleton instance
export const db = new LibraryCatalogDB();
