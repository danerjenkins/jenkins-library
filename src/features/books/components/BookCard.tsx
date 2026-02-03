import type { Book } from "../bookTypes";
import { Badge } from "../../../ui/components/Badge";
import {
  getReadStatusLabel,
  BOOK_FORMAT_LABELS,
  getGoogleImageSearchUrl,
} from "../bookTypes";
import { Search } from "lucide-react";

interface BookCardProps {
  book: Book;
  variant?: "view" | "admin";
  actions?: React.ReactNode;
  onReadStatusChange?: (
    bookId: string,
    readByDane: boolean,
    readByEmma: boolean,
  ) => void;
}

export function BookCard({
  book,
  variant = "view",
  actions,
  onReadStatusChange,
}: BookCardProps) {
  const isView = variant === "view";

  if (isView) {
    return (
      <div className="rounded-2xl border border-stone-200/50 bg-white/90 px-5 py-5 shadow-sm transition hover:shadow-md hover:border-stone-200/70">
        <div className="flex gap-5">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="h-28 w-20 shrink-0 rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-stone-100 to-amber-50 text-stone-400 shadow-md">
              <span className="text-2xl">📚</span>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-stone-900">
                  {book.title}
                </h3>
                {book.finished && <Badge variant="success">Finished</Badge>}
                <Badge variant="amber">{getReadStatusLabel(book)}</Badge>
              </div>
              <p className="font-sans mt-2 text-sm text-stone-600">
                {book.author}
              </p>
              {book.genre && (
                <div className="mt-3">
                  <Badge variant="amber">{book.genre}</Badge>
                </div>
              )}
              {book.format && (
                <div className="mt-1">
                  <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {BOOK_FORMAT_LABELS[book.format]}
                  </span>
                </div>
              )}
              {book.pages && (
                <div className="mt-1">
                  <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {book.pages} pages
                  </span>
                </div>
              )}
            </div>
            {onReadStatusChange && (
              <div className="space-y-2 self-start sm:self-auto shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    id={`dane-${book.id}`}
                    type="checkbox"
                    checked={book.readByDane}
                    onChange={(e) =>
                      onReadStatusChange(
                        book.id,
                        e.target.checked,
                        book.readByEmma,
                      )
                    }
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
                  />
                  <label
                    htmlFor={`dane-${book.id}`}
                    className="text-xs font-medium text-stone-700 cursor-pointer"
                  >
                    Dane
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`emma-${book.id}`}
                    type="checkbox"
                    checked={book.readByEmma}
                    onChange={(e) =>
                      onReadStatusChange(
                        book.id,
                        book.readByDane,
                        e.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200"
                  />
                  <label
                    htmlFor={`emma-${book.id}`}
                    className="text-xs font-medium text-stone-700 cursor-pointer"
                  >
                    Emma
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="flex gap-4 rounded-2xl border border-stone-200/50 bg-white/90 px-5 py-4 shadow-sm">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-md"
        />
      ) : (
        <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-stone-100 to-amber-50 text-stone-400 shadow-md">
          <span className="text-xl">📚</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-bold text-stone-900">
              {book.title}
            </h3>
            {book.finished && <Badge variant="success">Finished</Badge>}
            <Badge variant="amber">{getReadStatusLabel(book)}</Badge>
          </div>
          <p className="font-sans text-sm text-stone-600">{book.author}</p>
          {book.genre && (
            <p className="font-sans mt-1 text-xs text-stone-500">
              Genre: {book.genre}
            </p>
          )}
          {book.format && (
            <p className="font-sans mt-1 text-xs text-stone-500">
              Format: {BOOK_FORMAT_LABELS[book.format]}
            </p>
          )}
          {book.pages && (
            <p className="font-sans mt-1 text-xs text-stone-500">
              Pages: {book.pages}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 self-start sm:self-auto shrink-0">
          {actions && <div className="flex gap-2">{actions}</div>}
          <a
            href={getGoogleImageSearchUrl(book.title, book.author)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition"
          >
            <Search className="h-3.5 w-3.5" />
            Find cover
          </a>
        </div>
      </div>
    </div>
  );
}
