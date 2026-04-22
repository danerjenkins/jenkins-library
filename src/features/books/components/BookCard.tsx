import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { getCoverPhotoUrl } from "../../../data/db";
import type { Book } from "../bookTypes";
import { BOOK_FORMAT_LABELS } from "../bookTypes";

function getGenreColor(genre: string): string {
  const genreLower = genre.toLowerCase();

  if (genreLower.includes("fantasy"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (genreLower.includes("science") || genreLower.includes("sci-fi"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (genreLower.includes("mystery") || genreLower.includes("thriller"))
    return "bg-red-100 text-red-800 border-red-200";
  if (genreLower.includes("romance"))
    return "bg-pink-100 text-pink-800 border-pink-200";
  if (genreLower.includes("horror"))
    return "bg-gray-900 text-white border-gray-800";
  if (genreLower.includes("historical"))
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (
    genreLower.includes("non-fiction") ||
    genreLower.includes("biography") ||
    genreLower.includes("memoir")
  )
    return "bg-teal-100 text-teal-800 border-teal-200";
  if (genreLower.includes("young adult") || genreLower.includes("ya"))
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (genreLower.includes("children"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (genreLower.includes("classic"))
    return "bg-warm-gray-light text-stone-800 border-warm-gray";

  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

interface BookCardProps {
  book: Book;
  variant?: "view" | "admin";
  actions?: ReactNode;
  onReadStatusChange?: (
    bookId: string,
    readByDane: boolean,
    readByEmma: boolean,
  ) => void;
  cardSize?: "small" | "medium" | "large";
  clickable?: boolean;
  showGenreTag?: boolean;
}

type CardSize = NonNullable<BookCardProps["cardSize"]>;

const coverHeightBySize: Record<CardSize, string> = {
  small: "h-44 sm:h-48",
  medium: "h-52 sm:h-56",
  large: "h-60 sm:h-64",
};

const titleSizeByCardSize: Record<CardSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

const gridClassesByCardSize: Record<CardSize, string> = {
  small:
    "grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  medium:
    "grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4",
  large: "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
};

function BookCover({
  book,
  coverUrl,
  coverHeight,
}: {
  book: Book;
  coverUrl: string | null;
  coverHeight: string;
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Cover of ${book.title}`}
        width={320}
        height={448}
        loading="lazy"
        decoding="async"
        className={`w-full ${coverHeight} bg-warm-gray-light object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex w-full ${coverHeight} items-center justify-center bg-warm-gray-light text-stone-400`}
      aria-label={`No cover available for ${book.title}`}
      role="img"
    >
      <BookOpen className="h-9 w-9" aria-hidden="true" />
    </div>
  );
}

export function BookGrid({
  children,
  cardSize = "medium",
}: {
  children: ReactNode;
  cardSize?: CardSize;
}) {
  return (
    <div className={`grid ${gridClassesByCardSize[cardSize]}`}>
      {children}
    </div>
  );
}

export function BookShelfState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-warm-gray bg-cream/80 px-5 py-12 text-center text-sm text-stone-600 sm:px-6 sm:py-14">
      <p className="font-medium text-stone-800">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-stone-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BookCard({
  book,
  variant = "view",
  actions,
  onReadStatusChange,
  cardSize = "medium",
  clickable = false,
  showGenreTag = true,
}: BookCardProps) {
  const isView = variant === "view";
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;
    let ignore = false;

    const loadCoverPhoto = async () => {
      const url = await getCoverPhotoUrl(book.id);
      currentUrl = url;
      if (!ignore) {
        setLocalCoverUrl(url);
      }
    };

    void loadCoverPhoto();

    return () => {
      ignore = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [book.id]);

  const coverHeight = coverHeightBySize[cardSize];
  const titleSize = titleSizeByCardSize[cardSize];
  const seriesNumber =
    book.seriesLabel ??
    (book.seriesSort !== null && book.seriesSort !== undefined
      ? String(book.seriesSort)
      : null);
  const seriesText = book.seriesName
    ? seriesNumber
      ? `${book.seriesName} - #${seriesNumber}`
      : book.seriesName
    : null;
  const coverUrl = localCoverUrl ?? book.coverUrl ?? null;
  const genreClasses = useMemo(
    () => (book.genre ? getGenreColor(book.genre) : ""),
    [book.genre],
  );
  const cover = (
    <BookCover book={book} coverUrl={coverUrl} coverHeight={coverHeight} />
  );
  const cardChrome =
    "flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-warm-gray bg-cream/95 shadow-sm [contain-intrinsic-size:320px_520px] [content-visibility:auto]";

  if (isView) {
    return (
      <article
        className={`${cardChrome} transition hover:border-sage-light hover:shadow-md`}
      >
        {clickable ? (
          <Link
            to={`/book/${book.id}`}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            aria-label={`View ${book.title}`}
          >
            {cover}
          </Link>
        ) : (
          cover
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="min-w-0">
            {clickable ? (
              <Link
                to={`/book/${book.id}`}
                className="group/title block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              >
                <h3
                  className={`font-display line-clamp-2 break-words font-bold text-stone-900 transition group-hover/title:text-stone-700 ${titleSize}`}
                >
                  {book.title}
                </h3>
              </Link>
            ) : (
              <h3
                className={`font-display line-clamp-2 break-words font-bold text-stone-900 ${titleSize}`}
              >
                {book.title}
              </h3>
            )}
            <p className="font-sans mt-1 line-clamp-1 break-words text-xs text-stone-600">
              {book.author}
            </p>
            {seriesText && (
              <p className="font-sans mt-1 line-clamp-1 break-words text-xs text-stone-500">
                {seriesText}
              </p>
            )}
          </div>
          {showGenreTag && book.genre && (
            <div className="min-w-0">
              <span
                className={`inline-block max-w-full rounded-md border px-2 py-1 text-xs font-medium leading-4 break-words ${genreClasses}`}
              >
                {book.genre}
              </span>
            </div>
          )}
          {onReadStatusChange && (
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-warm-gray pt-3">
              <span className="text-xs font-medium text-stone-700">
                Read by:
              </span>
              <label className="flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-1 text-xs font-medium text-stone-700 hover:bg-warm-gray-light">
                <input
                  type="checkbox"
                  checked={book.readByDane}
                  onChange={(event) =>
                    onReadStatusChange(
                      book.id,
                      event.target.checked,
                      book.readByEmma,
                    )
                  }
                  className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                />
                <span>Dane</span>
              </label>
              <label className="flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-1 text-xs font-medium text-stone-700 hover:bg-warm-gray-light">
                <input
                  type="checkbox"
                  checked={book.readByEmma}
                  onChange={(event) =>
                    onReadStatusChange(
                      book.id,
                      book.readByDane,
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                />
                <span>Emma</span>
              </label>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className={cardChrome}>
      {cover}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <h3
            className={`font-display line-clamp-2 break-words font-bold text-stone-900 ${titleSize}`}
          >
            {book.title}
          </h3>
          <p className="font-sans mt-1 line-clamp-1 break-words text-xs text-stone-600">
            {book.author}
          </p>
          {seriesText && (
            <p className="font-sans mt-1 line-clamp-1 break-words text-xs text-stone-500">
              {seriesText}
            </p>
          )}
        </div>
        {(book.genre || book.format || book.pages) && (
          <div className="space-y-0.5 text-xs text-stone-500">
            {book.genre && <p className="break-words">Genre: {book.genre}</p>}
            {book.format && <p>Format: {BOOK_FORMAT_LABELS[book.format]}</p>}
            {book.pages && <p>Pages: {book.pages}</p>}
          </div>
        )}
        {actions && (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-warm-gray pt-3">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
