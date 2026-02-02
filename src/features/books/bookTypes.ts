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
  /** Timestamp when the book was created */
  createdAt: number;
  /** Timestamp when the book was last updated */
  updatedAt: number;
}
