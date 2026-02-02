import { useEffect, useState } from "react";
import {
  getAllBooks,
  addBook,
  updateBook,
  deleteBook,
} from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { Button } from "../../ui/components/Button";
import { BookCard } from "./components/BookCard";
import { BookForm } from "./components/BookForm";

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [finished, setFinished] = useState(false);

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
      if (editingId) {
        // Update existing book
        await updateBook(editingId, {
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          finished,
        });
      } else {
        // Add new book
        await addBook({
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          finished,
        });
      }
      setTitle("");
      setAuthor("");
      setGenre("");
      setFinished(false);
      setEditingId(null);
      setShowForm(false);
      await loadBooks();
    } catch (error) {
      console.error("Failed to save book:", error);
    }
  }

  function handleEditBook(book: Book) {
    setTitle(book.title);
    setAuthor(book.author);
    setGenre(book.genre || "");
    setFinished(book.finished || false);
    setEditingId(book.id);
    setShowForm(true);
  }

  function handleCancelEdit() {
    setTitle("");
    setAuthor("");
    setGenre("");
    setFinished(false);
    setEditingId(null);
    setShowForm(false);
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-stone-900">
              Manage Books
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Add, edit, and delete books from your library. Admin tools for
              managing your collection.
            </p>
          </div>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Add Book
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mt-5">
            <BookForm
              isEditing={!!editingId}
              title={title}
              author={author}
              genre={genre}
              finished={finished}
              onTitleChange={setTitle}
              onAuthorChange={setAuthor}
              onGenreChange={setGenre}
              onFinishedChange={setFinished}
              onSubmit={handleAddBook}
              onCancel={handleCancelEdit}
            >
              {editingId && <span>Editing book...</span>}
            </BookForm>
          </div>
        )}
      </section>
      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-stone-200 bg-white/80 px-4 py-8 text-center text-sm text-stone-500 shadow-sm">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No books yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Click "Add Book" to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="admin"
                actions={
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditBook(book)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
