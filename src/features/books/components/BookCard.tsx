import type { Book } from "../bookTypes";
import { Badge } from "../../../ui/components/Badge";

interface BookCardProps {
  book: Book;
  variant?: "view" | "admin";
  actions?: React.ReactNode;
  onToggleFinished?: (bookId: string, currentFinishedStatus: boolean) => void;
}

export function BookCard({
  book,
  variant = "view",
  actions,
  onToggleFinished,
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
              </div>
              <p className="font-sans mt-2 text-sm text-stone-600">
                {book.author}
              </p>
              {book.genre && (
                <div className="mt-3">
                  <Badge variant="amber">{book.genre}</Badge>
                </div>
              )}
            </div>
            {onToggleFinished && (
              <button
                onClick={() =>
                  onToggleFinished(book.id, book.finished || false)
                }
                className={`self-start rounded-md border px-3 py-1.5 text-xs font-medium transition sm:self-auto shrink-0 ${
                  book.finished
                    ? "border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
                title={book.finished ? "Mark as to read" : "Mark as done"}
              >
                {book.finished ? "Mark To Read" : "Mark Done"}
              </button>
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
          </div>
          <p className="font-sans text-sm text-stone-600">{book.author}</p>
          {book.genre && (
            <p className="font-sans mt-1 text-xs text-stone-500">
              Genre: {book.genre}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 self-start sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
