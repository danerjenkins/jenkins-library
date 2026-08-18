import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Heart,
  Star,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { PageSection } from "../../../ui/components/PageLayout";
import { BookShelfState } from "../components/cards/BookCard";
import {
  SegmentedControl,
  ShelfDisplayToggle,
} from "../components/browse/ShelfBrowseControls";
import type { Book } from "../lib/bookTypes";
import type { ReaderId } from "../lib/readingListPreferences";
import type { LibraryMember } from "../../libraries/libraryTypes";

const sectionSurfaceClasses = "ds-panel-shell";

function getBookMeta(book: Book) {
  const meta: string[] = [];
  if (book.genre) meta.push(book.genre);
  return meta;
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

function QueueRow({
  book,
  index,
  readerId,
  onMoveUp,
  onMoveDown,
  onRemove,
  canEdit,
  showGenreTags,
  showRatings,
  isFirst,
  isLast,
}: {
  book: Book;
  index: number;
  readerId: ReaderId;
  onMoveUp: (readerId: ReaderId, bookId: string) => void;
  onMoveDown: (readerId: ReaderId, bookId: string) => void;
  onRemove: (readerId: ReaderId, bookId: string) => void;
  canEdit: boolean;
  showGenreTags: boolean;
  showRatings: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="rounded-2xl border border-warm-gray/70 bg-cream/95 p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="flex shrink-0 items-start gap-2 sm:items-center">
          <div className="flex w-8 shrink-0 flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-gray/70 bg-parchment/70 text-xs font-medium text-stone-600">
              {index + 1}
            </div>
            {canEdit ? (
              <Button
                type="button"
                variant="danger"
                className="h-8 min-h-8 w-8 shrink-0 p-0!"
                onClick={() => void onRemove(readerId, book.id)}
                aria-label={`Remove ${book.title} from the queue`}
                title="Remove"
              >
                <Trash2
                  className="h-4 w-4 shrink-0 text-current"
                  aria-hidden="true"
                  strokeWidth={2.25}
                />
              </Button>
            ) : null}
          </div>
          <div className="relative">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                width={80}
                height={112}
                loading="lazy"
                decoding="async"
                className="h-full max-h-24 w-16 rounded border border-warm-gray/50 bg-warm-gray-light object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-full max-h-24 w-16 items-center justify-center rounded border border-warm-gray/50 bg-warm-gray-light text-xs font-semibold text-stone-400">
                {getFallbackMonogram(book.title)}
              </div>
            )}
            <div className="ds-ownership-icon">
              <div className="ds-ownership-badge">
                {(book.ownershipStatus ?? "owned") === "wishlist" ? (
                  <Heart
                    className="ds-ownership-badge__icon"
                    aria-hidden="true"
                  />
                ) : (
                  <BookOpen
                    className="ds-ownership-badge__icon"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
            {showRatings && book.averageRating !== null && book.ratingCount > 0 ? (
              <div className="absolute right-1 top-1 inline-flex min-w-8 items-center justify-center gap-0.5 rounded-full border border-white/60 bg-stone-950/75 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-100 shadow-sm backdrop-blur">
                <Star className="h-2.5 w-2.5" aria-hidden="true" fill="currentColor" />
                {Number.isInteger(book.averageRating)
                  ? book.averageRating
                  : book.averageRating.toFixed(1)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <Link
            to={`/book/${book.id}`}
            className="block rounded-sm font-display text-lg font-semibold leading-tight text-stone-900 no-underline transition-colors duration-150 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {book.title}
          </Link>
          <p className="mt-0.5 text-sm text-stone-600">{book.author}</p>
          {showGenreTags ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {getBookMeta(book).map((meta) => (
                <span
                  key={meta}
                  className="ds-chip ds-chip--compact ds-chip--warm-gray"
                >
                  {meta}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {canEdit ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="h-8 min-h-8 w-8 shrink-0 p-0!"
            onClick={() => void onMoveUp(readerId, book.id)}
            aria-label={`Move ${book.title} higher in the queue`}
            title="Move up"
            disabled={isFirst}
          >
            <ArrowUp
              className="h-4 w-4 shrink-0 text-current"
              aria-hidden="true"
              strokeWidth={2.25}
            />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-8 min-h-8 w-8 shrink-0 p-0!"
            onClick={() => void onMoveDown(readerId, book.id)}
            aria-label={`Move ${book.title} lower in the queue`}
            title="Move down"
            disabled={isLast}
          >
            <ArrowDown
              className="h-4 w-4 shrink-0 text-current"
              aria-hidden="true"
              strokeWidth={2.25}
            />
          </Button>
        </div>
        ) : null}
      </div>
    </li>
  );
}

export function ReadingListIntroSection({
  activeReader,
  queuedTotal,
  activeReaderLabel,
  members,
  showGenreTags,
  showRatings,
  onActiveReaderChange,
  onShowGenreTagsChange,
  onShowRatingsChange,
}: {
  activeReader: ReaderId;
  queuedTotal: number;
  activeReaderLabel: string;
  members: LibraryMember[];
  showGenreTags: boolean;
  showRatings: boolean;
  onActiveReaderChange: (readerId: ReaderId) => void;
  onShowGenreTagsChange: (value: boolean) => void;
  onShowRatingsChange: (value: boolean) => void;
}) {
  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-3xl">
            TBR
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            {queuedTotal} {queuedTotal === 1 ? "book" : "books"} queued for{" "}
            {activeReaderLabel}.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:w-md">
          <SegmentedControl
            label="Active reader"
            options={members.map((member) => ({
              value: member.id,
              label: member.displayName,
            }))}
            value={activeReader}
            onChange={onActiveReaderChange}
          />
          <ShelfDisplayToggle
            id="reading-list-show-genre-tags"
            label="Show Genre Tags"
            checked={showGenreTags}
            onChange={onShowGenreTagsChange}
          />
          <ShelfDisplayToggle
            id="reading-list-show-ratings"
            label="Show Ratings"
            checked={showRatings}
            onChange={onShowRatingsChange}
          />
        </div>
      </div>
    </PageSection>
  );
}

export function ReadingListQueueSection({
  readerId,
  queueBooks,
  onMoveUp,
  onMoveDown,
  onRemove,
  canEdit,
  showGenreTags,
  showRatings,
}: {
  readerId: ReaderId;
  queueBooks: Book[];
  onMoveUp: (readerId: ReaderId, bookId: string) => void;
  onMoveDown: (readerId: ReaderId, bookId: string) => void;
  onRemove: (readerId: ReaderId, bookId: string) => void;
  canEdit: boolean;
  showGenreTags: boolean;
  showRatings: boolean;
}) {
  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl font-semibold text-stone-900">
                Queue
              </h3>
              <span className="ds-chip ds-chip--compact ds-chip--warm-gray">
                {queueBooks.length} {queueBooks.length === 1 ? "book" : "books"}
              </span>
            </div>
          </div>
        </div>

        {queueBooks.length > 0 ? (
          <ul className="space-y-3">
            {queueBooks.map((book, index) => (
              <QueueRow
                key={book.id}
                book={book}
                index={index}
                readerId={readerId}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onRemove={onRemove}
                canEdit={canEdit}
                showGenreTags={showGenreTags}
                showRatings={showRatings}
                isFirst={index === 0}
                isLast={index === queueBooks.length - 1}
              />
            ))}
          </ul>
        ) : (
          <BookShelfState
            title="No books queued yet"
            description="Use the add list below or the book detail page to place the first book in this reader's queue."
          />
        )}
      </div>
    </PageSection>
  );
}
