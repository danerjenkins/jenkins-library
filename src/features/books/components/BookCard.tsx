import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { getCoverPhotoUrl } from "../../../data/db";
import type { Book } from "../bookTypes";
import { BOOK_FORMAT_LABELS } from "../bookTypes";
import "./BookCard.css";
import type { CardSize } from "../shelfViewPreferences";

function getGenreTone(genre: string): string {
  const genreLower = genre.toLowerCase();

  if (genreLower.includes("fantasy")) return "fantasy";
  if (genreLower.includes("science") || genreLower.includes("sci-fi"))
    return "science-fiction";
  if (genreLower.includes("mystery") || genreLower.includes("thriller"))
    return "mystery";
  if (genreLower.includes("romance")) return "romance";
  if (genreLower.includes("horror")) return "horror";
  if (genreLower.includes("historical")) return "historical";
  if (
    genreLower.includes("non-fiction") ||
    genreLower.includes("biography") ||
    genreLower.includes("memoir")
  )
    return "nonfiction";
  if (genreLower.includes("young adult") || genreLower.includes("ya"))
    return "young-adult";
  if (genreLower.includes("children")) return "children";
  if (genreLower.includes("classic")) return "classic";

  return "general";
}

function getFallbackMonogram(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  return title.slice(0, 2).toUpperCase();
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
  deferRendering?: boolean;
}

const coverHeightBySize: Record<CardSize, string> = {
  xsmall: "h-24 sm:h-32",
  small: "h-32 sm:h-40",
  medium: "h-44 sm:h-52",
  large: "h-56 sm:h-64",
};

const titleLineClampByCardSize: Record<CardSize, string> = {
  xsmall: "line-clamp-2",
  small: "line-clamp-2",
  medium: "line-clamp-2",
  large: "line-clamp-2",
};

const gridClassesByCardSize: Record<CardSize, string> = {
  xsmall:
    "grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8",
  small:
    "grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
  medium:
    "grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5",
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
        className={`book-card__cover-image w-full ${coverHeight} bg-warm-gray-light object-cover`}
      />
    );
  }

  const monogram = getFallbackMonogram(book.title);

  return (
    <div
      className={`book-card__cover-fallback flex w-full ${coverHeight} items-center justify-center`}
      aria-label={`No cover available for ${book.title}`}
      role="img"
    >
      <div className="book-card__cover-fallback-inner">
        <div className="book-card__cover-fallback-monogram" aria-hidden="true">
          {monogram}
        </div>
        <BookOpen className="book-card__cover-fallback-icon" aria-hidden="true" />
        <div className="book-card__cover-fallback-copy">
          <span className="book-card__cover-fallback-label">{book.title}</span>
          <span className="book-card__cover-fallback-meta">{book.author}</span>
        </div>
      </div>
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
  deferRendering = true,
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
  const genreTone = useMemo(
    () => (book.genre ? getGenreTone(book.genre) : "general"),
    [book.genre],
  );
  const cover = (
    <BookCover
      book={book}
      coverUrl={coverUrl}
      coverHeight={coverHeight}
    />
  );
  const cardChrome = `book-card flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-warm-gray bg-cream/95 shadow-sm${
    deferRendering ? " [contain-intrinsic-size:320px_520px] [content-visibility:auto]" : ""
  }`;
  const detailPath = `/book/${book.id}`;
  const clickableCardClasses = clickable ? " book-card--interactive" : "";

  if (isView) {
    return (
      <article
        className={`${cardChrome}${clickableCardClasses}`}
        data-card-size={cardSize}
        data-genre-tone={genreTone}
      >
        {clickable ? (
          <Link
            to={detailPath}
            className="book-card__cover-link block rounded-t-lg focus-visible:outline-none"
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
                className="book-card__title-link group/title block min-w-0 rounded-sm focus-visible:outline-none"
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

          {showGenreTag && book.genre && (
            <div className="min-w-0">
              <span
                className={`book-card__tag book-card__tag--${genreTone} inline-block max-w-full rounded border font-medium break-words`}
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
    <article
      className={cardChrome}
      data-card-size={cardSize}
      data-genre-tone={genreTone}
    >
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
