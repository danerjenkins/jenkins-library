import type { Book } from "../bookTypes";
import { Badge } from "../../../ui/components/Badge";
import {
  getReadStatusLabel,
  BOOK_FORMAT_LABELS,
} from "../bookTypes";
import { useState, useEffect } from "react";
import { getCoverPhotoUrl } from "../../../data/db";

interface BookCardProps {
  book: Book;
  variant?: "view" | "admin";
  actions?: React.ReactNode;
  onReadStatusChange?: (
    bookId: string,
    readByDane: boolean,
    readByEmma: boolean,
  ) => void;
  cardSize?: "small" | "medium" | "large";
}

export function BookCard({
  book,
  variant = "view",
  actions,
  onReadStatusChange,
  cardSize = "medium",
}: BookCardProps) {
  const isView = variant === "view";
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);

  // Load local cover photo if it exists
  useEffect(() => {
    let currentUrl: string | null = null;

    const loadCoverPhoto = async () => {
      const url = await getCoverPhotoUrl(book.id);
      currentUrl = url;
      setLocalCoverUrl(url);
    };

    loadCoverPhoto();

    // Cleanup object URL on unmount to avoid memory leaks
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [book.id]);

  const coverHeight = cardSize === "small" ? "h-32" : cardSize === "medium" ? "h-40" : "h-48";
  const titleSize = cardSize === "small" ? "text-sm" : cardSize === "medium" ? "text-base" : "text-lg";

  if (isView) {
    return (
      <div className="flex flex-col rounded-2xl border border-stone-200/50 bg-white/90 shadow-sm transition hover:shadow-md hover:border-stone-200/70 overflow-hidden">
        {localCoverUrl || book.coverUrl ? (
          <img
            src={localCoverUrl || book.coverUrl!}
            alt={`Cover of ${book.title}`}
            className={`w-full ${coverHeight} object-cover`}
          />
        ) : (
          <div className={`flex w-full ${coverHeight} items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50 text-stone-400`}>
            <span className="text-4xl">📚</span>
          </div>
        )}
        <div className="flex flex-col gap-2 p-4">
          <div>
            <h3 className={`font-display font-bold text-stone-900 line-clamp-2 ${titleSize}`}>
              {book.title}
            </h3>
            <p className="font-sans mt-1 text-xs text-stone-600 line-clamp-1">
              {book.author}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {book.finished && <Badge variant="success">Finished</Badge>}
            <Badge variant="amber">{getReadStatusLabel(book)}</Badge>
          </div>
          {book.genre && (
            <div>
              <Badge variant="amber">{book.genre}</Badge>
            </div>
          )}
          {(book.format || book.pages) && (
            <div className="flex flex-wrap gap-1 text-xs text-stone-500">
              {book.format && (
                <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5">
                  {BOOK_FORMAT_LABELS[book.format]}
                </span>
              )}
              {book.pages && (
                <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5">
                  {book.pages} pages
                </span>
              )}
            </div>
          )}
          {onReadStatusChange && (
            <div className="flex gap-3 mt-2 pt-2 border-t border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
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
                <span className="text-xs font-medium text-stone-700">
                  Dane
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
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
                <span className="text-xs font-medium text-stone-700">
                  Emma
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="flex flex-col rounded-2xl border border-stone-200/50 bg-white/90 shadow-sm overflow-hidden">
      {localCoverUrl || book.coverUrl ? (
        <img
          src={localCoverUrl || book.coverUrl!}
          alt={`Cover of ${book.title}`}
          className={`w-full ${coverHeight} object-cover`}
        />
      ) : (
        <div className={`flex w-full ${coverHeight} items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50 text-stone-400`}>
          <span className="text-4xl">📚</span>
        </div>
      )}
      <div className="flex flex-col gap-2 p-4">
        <div>
          <h3 className={`font-display font-bold text-stone-900 line-clamp-2 ${titleSize}`}>
            {book.title}
          </h3>
          <p className="font-sans mt-1 text-xs text-stone-600 line-clamp-1">{book.author}</p>
        </div>
        {(book.genre || book.format || book.pages) && (
          <div className="text-xs text-stone-500 space-y-0.5">
            {book.genre && <p>Genre: {book.genre}</p>}
            {book.format && <p>Format: {BOOK_FORMAT_LABELS[book.format]}</p>}
            {book.pages && <p>Pages: {book.pages}</p>}
          </div>
        )}
        {actions && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-stone-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
