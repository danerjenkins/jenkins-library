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
      <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-stone-900">
                {book.title}
              </h3>
              {book.finished && <Badge variant="success">Finished</Badge>}
            </div>
            <p className="mt-1 text-sm text-stone-600">{book.author}</p>
            {book.genre && (
              <div className="mt-2">
                <Badge variant="amber">{book.genre}</Badge>
              </div>
            )}
          </div>
          {onToggleFinished && (
            <button
              onClick={() => onToggleFinished(book.id, book.finished || false)}
              className="self-start rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 sm:self-auto shrink-0"
              title={book.finished ? "Mark as unfinished" : "Mark as finished"}
            >
              {book.finished ? "Mark unfinished" : "Mark finished"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-stone-900">{book.title}</h3>
          {book.finished && <Badge variant="success">Finished</Badge>}
        </div>
        <p className="text-sm text-stone-600">{book.author}</p>
        {book.genre && (
          <p className="mt-1 text-xs text-stone-500">Genre: {book.genre}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
