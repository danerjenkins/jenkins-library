import { useEffect, useState } from "react";
import { getAllBooks, addBook, deleteBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import "./BookListPage.css";

export function BookListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    try {
      await addBook({ title: title.trim(), author: author.trim() });
      setTitle("");
      setAuthor("");
      setShowForm(false);
      await loadBooks();
    } catch (error) {
      console.error("Failed to add book:", error);
    }
  }

  async function handleDeleteBook(id: string, bookTitle: string) {
    if (!confirm(`Delete "${bookTitle}"?`)) return;

    try {
      await deleteBook(id);
      await loadBooks();
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  }

  return (
    <div className="book-list-page">
      <h2>Books</h2>
      <p>
        Your personal library catalog. Add and manage your book collection here.
        This is a local-first progressive web app that works offline.
      </p>

      {!showForm ? (
        <button className="add-book-button" onClick={() => setShowForm(true)}>
          Add Book
        </button>
      ) : (
        <form className="add-book-form" onSubmit={handleAddBook}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={!title.trim() || !author.trim()}
            >
              Add
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setAuthor("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="loading">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="empty-state">
          No books yet. Click "Add Book" to get started!
        </p>
      ) : (
        <div className="books-list">
          {books.map((book) => (
            <div key={book.id} className="book-item">
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>
              </div>
              <button
                className="delete-button"
                onClick={() => handleDeleteBook(book.id, book.title)}
                aria-label={`Delete ${book.title}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
