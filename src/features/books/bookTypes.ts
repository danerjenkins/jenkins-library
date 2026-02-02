/**
 * Book model for the library catalog
 */
export interface Book {
  /** Primary key */
  id: string;
  /** Book title */
  title: string;
  /** Book author */
  author: string;
  /** Book genre (optional) */
  genre?: string | null;
  /** Book ISBN (optional) */
  isbn?: string | null;
  /** Whether the book has been finished */
  finished?: boolean;
  /** Cover image URL (optional) */
  coverUrl?: string | null;
  /** Timestamp when the book was created */
  createdAt: number;
  /** Timestamp when the book was last updated */
  updatedAt: number;
}
