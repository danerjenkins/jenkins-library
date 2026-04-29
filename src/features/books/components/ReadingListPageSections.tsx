import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Heart,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { PageSection } from "../../../ui/components/PageLayout";
import { BookShelfState } from "./BookCard";
import { SegmentedControl } from "./ShelfBrowseControls";
import type { Book } from "../bookTypes";
import type { ReaderId } from "../readingListPreferences";

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
  isFirst,
  isLast,
}: {
  book: Book;
  index: number;
  readerId: ReaderId;
  onMoveUp: (readerId: ReaderId, bookId: string) => void;
  onMoveDown: (readerId: ReaderId, bookId: string) => void;
  onRemove: (readerId: ReaderId, bookId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="rounded-2xl border border-warm-gray/70 bg-cream/95 p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="flex shrink-0 items-start gap-2 sm:items-center sm:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sage/20 bg-sage/10 text-sm font-semibold text-sage-dark">
            {index + 1}
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
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
            </div>
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
        </div>

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
          <Button
            type="button"
            variant="secondary"
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
        </div>
      </div>
    </li>
  );
}

export function ReadingListIntroSection({
  activeReader,
  queuedTotal,
  activeReaderLabel,
  onActiveReaderChange,
}: {
  activeReader: ReaderId;
  queuedTotal: number;
  activeReaderLabel: string;
  onActiveReaderChange: (readerId: ReaderId) => void;
}) {
  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Reading List
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-4xl">
            TBR
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            {queuedTotal} {queuedTotal === 1 ? "book" : "books"} queued for{" "}
            {activeReaderLabel}.
          </p>
        </div>

        <div className="min-w-0 sm:w-md">
          <SegmentedControl
            label="Active reader"
            options={[
              { value: "dane", label: "Dane" },
              { value: "emma", label: "Emma" },
            ]}
            value={activeReader}
            onChange={onActiveReaderChange}
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
}: {
  readerId: ReaderId;
  queueBooks: Book[];
  onMoveUp: (readerId: ReaderId, bookId: string) => void;
  onMoveDown: (readerId: ReaderId, bookId: string) => void;
  onRemove: (readerId: ReaderId, bookId: string) => void;
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
