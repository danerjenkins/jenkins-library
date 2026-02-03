import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { getBookById } from "../../data/bookRepo";
import { getCoverPhotoUrl } from "../../data/db";
import type { Book } from "./bookTypes";
import { Badge } from "../../ui/components/Badge";
import { BOOK_FORMAT_LABELS } from "./bookTypes";
import { Button } from "../../ui/components/Button";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/view");
      return;
    }

    const loadBook = async () => {
      try {
        setLoading(true);
        const bookData = await getBookById(id);
        if (!bookData) {
          navigate("/view");
          return;
        }
        setBook(bookData);

        // Load cover photo
        const coverUrl = await getCoverPhotoUrl(id);
        setLocalCoverUrl(coverUrl);
      } catch (error) {
        console.error("Failed to load book:", error);
        navigate("/view");
      } finally {
        setLoading(false);
      }
    };

    loadBook();

    // Cleanup
    return () => {
      if (localCoverUrl) {
        URL.revokeObjectURL(localCoverUrl);
      }
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-500">Loading book details...</div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/view"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/90 shadow-soft overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-3">
          {/* Cover Image */}
          <div className="md:col-span-1">
            {localCoverUrl || book.coverUrl ? (
              <img
                src={localCoverUrl || book.coverUrl!}
                alt={`Cover of ${book.title}`}
                className="w-full rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-gradient-to-br from-stone-100 to-amber-50 text-stone-400 shadow-md">
                <span className="text-6xl">📚</span>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-900">
                {book.title}
              </h1>
              <p className="font-sans mt-2 text-lg text-stone-600">
                {book.author}
              </p>
              {book.description && (
                <p className="font-sans mt-4 text-stone-700 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {book.finished && <Badge variant="success">Finished</Badge>}
              {book.readByDane && <Badge variant="amber">Read by Dane</Badge>}
              {book.readByEmma && <Badge variant="amber">Read by Emma</Badge>}
              {!book.readByDane && !book.readByEmma && (
                <Badge variant="amber">To Read</Badge>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-200">
              {book.genre && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Genre:
                  </span>
                  <p className="text-stone-900 mt-1">{book.genre}</p>
                </div>
              )}

              {book.isbn && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    ISBN:
                  </span>
                  <p className="text-stone-900 mt-1 font-mono text-sm">
                    {book.isbn}
                  </p>
                </div>
              )}

              {book.format && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Format:
                  </span>
                  <p className="text-stone-900 mt-1">
                    {BOOK_FORMAT_LABELS[book.format]}
                  </p>
                </div>
              )}

              {book.pages && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Pages:
                  </span>
                  <p className="text-stone-900 mt-1">{book.pages}</p>
                </div>
              )}

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Added:
                </span>
                <p className="text-stone-900 mt-1">
                  {new Date(book.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Last Updated:
                </span>
                <p className="text-stone-900 mt-1">
                  {new Date(book.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link to={`/admin?edit=${book.id}`}>
                <Button variant="secondary">
                  <span className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Book
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
