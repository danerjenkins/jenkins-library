import type { ReactNode } from "react";
import { BookOpen, Heart, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Book } from "../lib/bookTypes";
import { getReadStatusLabel, BOOK_FORMAT_LABELS } from "../lib/bookTypes";
import { Button } from "../../../ui/components/Button";
import { Badge } from "../../../ui/components/Badge";

interface ManageBookRowProps {
  book: Book;
  ownershipBusy: boolean;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onToggleOwnership: (book: Book) => void;
}

function ManageMetaBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="default" className={className}>
      {children}
    </Badge>
  );
}

function AdminBookCover({ book }: { book: Book }) {
  const ownershipStatus = book.ownershipStatus ?? "owned";
  const OwnershipIcon = ownershipStatus === "wishlist" ? Heart : BookOpen;

  return (
    <div className="relative flex flex-none overflow-hidden rounded-lg border border-warm-gray bg-warm-gray-light shadow-sm w-28 h-40 sm:w-36 sm:h-48">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          width={224}
          height={320}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-sm font-semibold text-stone-400"
          aria-hidden="true"
        >
          No Cover
        </div>
      )}

      <div className="book-card__ownership-icon absolute top-2 right-2 transition-opacity duration-200 pointer-events-none">
        <div className="book-card__ownership-badge rounded-full bg-black/40 backdrop-blur-sm p-1.5 flex items-center justify-center">
          <OwnershipIcon
            className="h-4 w-4 text-white"
            aria-hidden="true"
            fill="currentColor"
          />
        </div>
      </div>
    </div>
  );
}

export function ManageBookRow({
  book,
  ownershipBusy,
  onEdit,
  onDelete,
  onToggleOwnership,
}: ManageBookRowProps) {
  const ownershipStatus = book.ownershipStatus ?? "owned";
  const ownershipActionLabel =
    ownershipStatus === "wishlist" ? "Add to Library" : "Move to Wishlist";
  const detailPath = `/book/${book.id}`;

  return (
    <article className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-warm-gray bg-cream/95 px-3 py-3 shadow-soft sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <AdminBookCover book={book} />

      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="wrap-break-word text-sm font-semibold leading-5 text-stone-900">
              <Link
                to={detailPath}
                className="rounded-sm text-stone-900 no-underline transition-colors hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              >
                {book.title}
              </Link>
            </h3>
            <p className="mt-0.5 wrap-break-word text-sm text-stone-600">
              {book.author}
            </p>
            <Link
              to={detailPath}
              className="mt-1 inline-flex rounded-sm text-xs font-medium text-stone-500 no-underline transition-colors hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            >
              View details
            </Link>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ManageMetaBadge
            className={
              book.readByDane || book.readByEmma
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : undefined
            }
          >
            {getReadStatusLabel(book)}
          </ManageMetaBadge>
          {book.format && (
            <ManageMetaBadge>{BOOK_FORMAT_LABELS[book.format]}</ManageMetaBadge>
          )}
          {book.genre && (
            <ManageMetaBadge className="max-w-full truncate">
              {book.genre}
            </ManageMetaBadge>
          )}
          {book.seriesName && (
            <ManageMetaBadge className="max-w-full truncate">
              {book.seriesName}
            </ManageMetaBadge>
          )}
        </div>
      </div>

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-warm-gray/70 pt-2 sm:col-span-1 sm:min-w-52 sm:justify-end sm:border-t-0 sm:pt-0">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onToggleOwnership(book)}
          disabled={ownershipBusy}
          className="min-h-8 px-3 py-1.5 text-xs"
          aria-label={`${ownershipActionLabel} for ${book.title}`}
        >
          <span className="flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {ownershipBusy ? "Saving…" : ownershipActionLabel}
          </span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onEdit(book)}
            className="h-8 min-h-8 w-8 shrink-0 p-0!"
            aria-label={`Edit ${book.title}`}
            title="Edit"
          >
            <Pencil
              className="h-4 w-4 shrink-0 text-current"
              aria-hidden="true"
              strokeWidth={2.25}
            />
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(book)}
            className="h-8 min-h-8 w-8 shrink-0 p-0!"
            aria-label={`Delete ${book.title}`}
            title="Delete"
          >
            <Trash2
              className="h-4 w-4 shrink-0 text-current"
              aria-hidden="true"
              strokeWidth={2.25}
            />
          </Button>
        </div>
      </div>
    </article>
  );
}
