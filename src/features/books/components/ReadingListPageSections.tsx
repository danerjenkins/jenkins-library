import { ArrowDown, ArrowUp, Library, Plus, RotateCcw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../ui/components/Badge";
import { Button } from "../../../ui/components/Button";
import { PageSection } from "../../../ui/components/PageLayout";
import { BookShelfState } from "./BookCard";
import { SegmentedControl } from "./ShelfBrowseControls";
import type { Book } from "../bookTypes";
import type { ReaderId } from "../readingListPreferences";

const sectionSurfaceClasses =
  "rounded-[1.5rem] border border-warm-gray/85 bg-parchment/85 shadow-sm ring-1 ring-white/40";

function getOwnerBadge(book: Book) {
  return (book.ownershipStatus ?? "owned") === "wishlist" ? (
    <Badge variant="amber">Wishlist</Badge>
  ) : (
    <Badge>Library</Badge>
  );
}

function getBookMeta(book: Book) {
  const meta: string[] = [];
  if (book.genre) meta.push(book.genre);
  if (book.seriesName) {
    meta.push(book.seriesLabel ? `${book.seriesName} #${book.seriesLabel}` : book.seriesName);
  }
  return meta;
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sage/20 bg-sage/10 text-sm font-semibold text-sage-dark">
          {index + 1}
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
            {getOwnerBadge(book)}
            {getBookMeta(book).map((meta) => (
              <span
                key={meta}
                className="inline-flex rounded-full border border-warm-gray bg-parchment px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600"
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
            className="min-h-9 px-2.5 text-xs"
            onClick={() => void onMoveUp(readerId, book.id)}
            aria-label={`Move ${book.title} higher in the queue`}
            disabled={isFirst}
          >
            <ArrowUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Up
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 px-2.5 text-xs"
            onClick={() => void onMoveDown(readerId, book.id)}
            aria-label={`Move ${book.title} lower in the queue`}
            disabled={isLast}
          >
            <ArrowDown className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Down
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 px-2.5 text-xs"
            onClick={() => void onRemove(readerId, book.id)}
            aria-label={`Remove ${book.title} from the queue`}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}

function SuggestionRow({
  book,
  readerId,
  onAddNext,
}: {
  book: Book;
  readerId: ReaderId;
  onAddNext: (readerId: ReaderId, bookId: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-warm-gray/70 bg-parchment/80 p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/book/${book.id}`}
            className="block rounded-sm font-medium text-stone-900 no-underline transition-colors duration-150 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {book.title}
          </Link>
          <p className="mt-0.5 text-sm text-stone-600">{book.author}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {getOwnerBadge(book)}
            {getBookMeta(book).map((meta) => (
              <span
                key={meta}
                className="inline-flex rounded-full border border-warm-gray bg-cream px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600"
              >
                {meta}
              </span>
            ))}
          </div>
        </div>
        <Button
          type="button"
          className="min-h-9 px-2.5 text-xs"
          onClick={() => void onAddNext(readerId, book.id)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Add next
        </Button>
      </div>
    </li>
  );
}

export function ReadingListIntroSection({
  activeReader,
  onActiveReaderChange,
}: {
  activeReader: ReaderId;
  onActiveReaderChange: (readerId: ReaderId) => void;
}) {
  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Reader
          </p>
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Choose who the queue is for
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            Each reader keeps one next-up list. Every entry shows whether it comes from the
            Library or the Wishlist.
          </p>
        </div>

        <div className="min-w-0 lg:w-[28rem]">
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
  onReset,
}: {
  readerId: ReaderId;
  queueBooks: Book[];
  onMoveUp: (readerId: ReaderId, bookId: string) => void;
  onMoveDown: (readerId: ReaderId, bookId: string) => void;
  onRemove: (readerId: ReaderId, bookId: string) => void;
  onReset: (readerId: ReaderId) => void;
}) {
  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-warm-gray/70 bg-cream px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              <Library className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="ml-1.5">Next up</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl font-semibold text-stone-900">Queue</h3>
              <span className="rounded-full border border-warm-gray bg-parchment px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600">
                {queueBooks.length} {queueBooks.length === 1 ? "book" : "books"}
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
              Keep this list short. If a book is already in the queue, adding it again moves it to
              the top.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 px-3 text-xs"
              onClick={() => void onReset(readerId)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Reset reader
            </Button>
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

export function ReadingListSuggestionsSection({
  readerId,
  libraryBooks,
  wishlistBooks,
  onAddNext,
}: {
  readerId: ReaderId;
  libraryBooks: Book[];
  wishlistBooks: Book[];
  onAddNext: (readerId: ReaderId, bookId: string) => void;
}) {
  const renderGroup = (title: string, books: Book[], icon: ReactNode) => (
    <div className="rounded-2xl border border-warm-gray/70 bg-cream/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-display text-xl font-semibold text-stone-900">{title}</h4>
        </div>
        <span className="text-xs font-medium text-stone-500">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>
      {books.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {books.slice(0, 6).map((book) => (
            <SuggestionRow key={book.id} book={book} readerId={readerId} onAddNext={onAddNext} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-600">No books available in this shelf.</p>
      )}
    </div>
  );

  return (
    <PageSection className={sectionSurfaceClasses}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Add books
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-stone-900">
            Pull from either shelf
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
          Use this area to seed the queue from the Library or Wishlist without splitting the
          reading list itself.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {renderGroup(
          "Library picks",
          libraryBooks,
          <Library className="h-4 w-4 text-sage-dark" aria-hidden="true" />,
        )}
        {renderGroup(
          "Wishlist picks",
          wishlistBooks,
          <Sparkles className="h-4 w-4 text-wood" aria-hidden="true" />,
        )}
      </div>
    </PageSection>
  );
}
