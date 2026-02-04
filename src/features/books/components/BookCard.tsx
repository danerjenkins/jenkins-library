import type { Book } from "../bookTypes";
import { BOOK_FORMAT_LABELS } from "../bookTypes";
import { useState, useEffect } from "react";
import { getCoverPhotoUrl } from "../../../data/db";
import { Link } from "react-router-dom";

// Helper function to get genre color
function getGenreColor(genre: string): string {
  const genreLower = genre.toLowerCase();
  
  if (genreLower.includes("fantasy")) return "bg-purple-100 text-purple-800 border-purple-200";
  if (genreLower.includes("science") || genreLower.includes("sci-fi")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (genreLower.includes("mystery") || genreLower.includes("thriller")) return "bg-red-100 text-red-800 border-red-200";
  if (genreLower.includes("romance")) return "bg-pink-100 text-pink-800 border-pink-200";
  if (genreLower.includes("horror")) return "bg-gray-900 text-white border-gray-800";
  if (genreLower.includes("historical")) return "bg-amber-100 text-amber-800 border-amber-200";
  if (genreLower.includes("non-fiction") || genreLower.includes("biography") || genreLower.includes("memoir")) return "bg-teal-100 text-teal-800 border-teal-200";
  if (genreLower.includes("young adult") || genreLower.includes("ya")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (genreLower.includes("children")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (genreLower.includes("classic")) return "bg-stone-200 text-stone-800 border-stone-300";
  
  // Default color for other genres
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

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
  clickable?: boolean;
}

export function BookCard({
  book,
  variant = "view",
  actions,
  onReadStatusChange,
  cardSize = "medium",
  clickable = false,
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

  const coverHeight =
    cardSize === "small" ? "h-48" : cardSize === "medium" ? "h-56" : "h-64";
  const titleSize =
    cardSize === "small"
      ? "text-sm"
      : cardSize === "medium"
        ? "text-base"
        : "text-lg";

  const CoverImage = () => (
    <>
      {localCoverUrl || book.coverUrl ? (
        <img
          src={localCoverUrl || book.coverUrl!}
          alt={`Cover of ${book.title}`}
          className={`w-full ${coverHeight} object-cover`}
        />
      ) : (
        <div
          className={`flex w-full ${coverHeight} items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50 text-stone-400`}
        >
          <span className="text-4xl">📚</span>
        </div>
      )}
    </>
  );

  if (isView) {
    return (
      <div className="flex flex-col rounded-2xl border border-stone-200/50 bg-white/90 shadow-sm transition hover:shadow-md hover:border-stone-200/70 overflow-hidden h-full">
        {clickable ? (
          <Link to={`/book/${book.id}`} className="block">
            <CoverImage />
          </Link>
        ) : (
          <CoverImage />
        )}
        <div className="flex flex-col gap-2 p-4 flex-1">
          <div>
            {clickable ? (
              <Link to={`/book/${book.id}`}>
                <h3
                  className={`font-display font-bold text-stone-900 line-clamp-2 hover:text-stone-700 transition ${titleSize}`}
                >
                  {book.title}
                </h3>
              </Link>
            ) : (
              <h3
                className={`font-display font-bold text-stone-900 line-clamp-2 ${titleSize}`}
              >
                {book.title}
              </h3>
            )}
            <p className="font-sans mt-1 text-xs text-stone-600 line-clamp-1">
              {book.author}
            </p>
          </div>
          {book.genre && (
            <div>
              <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium border ${getGenreColor(book.genre)}`}>
                {book.genre}
              </span>
            </div>
          )}
          {onReadStatusChange && (
            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-stone-200">
              <span className="text-xs font-medium text-stone-700">
                Read by:
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
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
                <span className="text-xs font-medium text-stone-700">Dane</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
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
                <span className="text-xs font-medium text-stone-700">Emma</span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="flex flex-col rounded-2xl border border-stone-200/50 bg-white/90 shadow-sm overflow-hidden h-full">
      <CoverImage />
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div>
          <h3
            className={`font-display font-bold text-stone-900 line-clamp-2 ${titleSize}`}
          >
            {book.title}
          </h3>
          <p className="font-sans mt-1 text-xs text-stone-600 line-clamp-1">
            {book.author}
          </p>
        </div>
        {(book.genre || book.format || book.pages) && (
          <div className="text-xs text-stone-500 space-y-0.5">
            {book.genre && <p>Genre: {book.genre}</p>}
            {book.format && <p>Format: {BOOK_FORMAT_LABELS[book.format]}</p>}
            {book.pages && <p>Pages: {book.pages}</p>}
          </div>
        )}
        {actions && (
          <div className="flex gap-2 mt-auto pt-2 border-t border-stone-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
