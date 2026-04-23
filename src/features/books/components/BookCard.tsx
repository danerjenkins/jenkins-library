import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getCoverPhotoUrl } from "../../../data/db";
import type { Book } from "../bookTypes";
import { BOOK_FORMAT_LABELS } from "../bookTypes";
import "./BookCard.css";
import type { CardSize } from "../shelfViewPreferences";

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
  cardSize?: "xsmall" | "small" | "medium" | "large";
  clickable?: boolean;
  showGenreTag?: boolean;
}

const coverHeightBySize: Record<CardSize, string> = {
  xsmall: "h-32 sm:h-36",
  small: "h-40 sm:h-44",
  medium: "h-52 sm:h-56",
  large: "h-60 sm:h-64",
};

const titleLineClampByCardSize: Record<CardSize, string> = {
  xsmall: "line-clamp-2",
  small: "line-clamp-2",
  medium: "line-clamp-2",
  large: "line-clamp-2",
};

const gridClassesByCardSize: Record<CardSize, string> = {
  xsmall:
    "grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
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
  const titleClamp = titleLineClampByCardSize[cardSize];
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
    "book-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-warm-gray bg-cream/95 shadow-sm [contain-intrinsic-size:320px_520px] [content-visibility:auto]";
  const detailPath = `/book/${book.id}`;
  const clickableCardClasses = clickable ? " book-card--interactive" : "";

  if (isView) {
    return (
      <article
        className={`${cardChrome}${clickableCardClasses}`}
        data-card-size={cardSize}
      >
        {clickable ? (
          <Link
            to={detailPath}
            className="book-card__cover-link block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            aria-label={`View ${book.title}`}
          >
            {cover}
          </Link>
        ) : (
          cover
        )}
        <div className="book-card__body flex min-w-0 flex-1 flex-col">
          <div className="min-w-0">
            {clickable ? (
              <Link
                to={detailPath}
                className="book-card__title-link group/title block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              >
                <h3
                  className={`book-card__title font-display break-words font-bold text-stone-900 transition-colors duration-150 group-hover/title:text-stone-700 ${titleClamp}`}
                >
                  {book.title}
                </h3>
              </Link>
            ) : (
              <h3
                className={`book-card__title font-display break-words font-bold text-stone-900 ${titleClamp}`}
              >
                {book.title}
              </h3>
            )}
            <p className="book-card__meta font-sans mt-1 line-clamp-1 break-words text-stone-600">
              {book.author}
            </p>
            {seriesText && (
              <p className="book-card__meta font-sans mt-0.5 line-clamp-1 break-words text-stone-500">
                {seriesText}
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1" aria-hidden="true" />

          {clickable && (
            <Link
              to={detailPath}
              className="book-card__detail-link inline-flex items-center gap-1.5 self-start rounded-sm text-stone-600 no-underline transition-colors duration-150 hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            >
              <span className="book-card__meta font-semibold uppercase tracking-[0.14em]">
                View Details
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}

          {showGenreTag && book.genre && (
            <div className="min-w-0">
              <span
                className={`book-card__tag inline-block max-w-full rounded border font-medium break-words ${genreClasses}`}
              >
                {book.genre}
              </span>
            </div>
          )}
          {onReadStatusChange && (
            <div className="book-card__divider mt-auto flex flex-wrap items-center border-t border-warm-gray">
              <span className="book-card__meta font-medium text-stone-700">
                Read by:
              </span>
              <label className="book-card__meta flex min-h-7 cursor-pointer items-center gap-1 rounded-md px-1 font-medium text-stone-700 hover:bg-warm-gray-light">
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
              <label className="book-card__meta flex min-h-7 cursor-pointer items-center gap-1 rounded-md px-1 font-medium text-stone-700 hover:bg-warm-gray-light">
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
          {actions && (
            <div className="book-card__divider mt-auto flex flex-wrap border-t border-warm-gray">
              {actions}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className={cardChrome} data-card-size={cardSize}>
      {cover}
      <div className="book-card__body flex min-w-0 flex-1 flex-col">
        <div className="min-w-0">
          <h3
            className={`book-card__title font-display break-words font-bold text-stone-900 ${titleClamp}`}
          >
            {book.title}
          </h3>
          <p className="book-card__meta font-sans mt-1 line-clamp-1 break-words text-stone-600">
            {book.author}
          </p>
          {seriesText && (
            <p className="book-card__meta font-sans mt-0.5 line-clamp-1 break-words text-stone-500">
              {seriesText}
            </p>
          )}
        </div>
        <div className="min-h-0 flex-1" aria-hidden="true" />
        {(book.genre || book.format || book.pages) && (
          <div className="book-card__meta space-y-0.5 border-t border-warm-gray pt-2 text-stone-500">
            {book.genre && (
              <p className="line-clamp-1 break-words">Genre: {book.genre}</p>
            )}
            {book.format && (
              <p className="line-clamp-1">
                Format: {BOOK_FORMAT_LABELS[book.format]}
              </p>
            )}
            {book.pages && <p>Pages: {book.pages}</p>}
          </div>
        )}
        {actions && (
          <div className="book-card__divider mt-auto flex flex-wrap border-t border-warm-gray">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
