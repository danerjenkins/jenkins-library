import { useEffect, useState } from "react";
import { Camera, Edit, LogIn, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../../ui/components/Badge";
import { Button } from "../../../ui/components/Button";
import type { Book } from "../lib/bookTypes";
import { BOOK_FORMAT_LABELS } from "../lib/bookTypes";
import type { ReaderId } from "../lib/readingListPreferences";
import type { LibraryMember } from "../../libraries/libraryTypes";
import { normalizeSeriesName } from "../hooks/discoveryBrowseShared";
import "./BookDetailSections.css";

export type MetadataSummaryItem = {
  label: string;
  value: string;
};

export function BookDetailContent({
  book,
  canEdit,
  isWishlistBook,
  backLabel,
  metadataSummary,
  queuedReaders,
  members,
  activeMember,
  savingReadStatus,
  readStatusError,
  savingOwnership,
  ownershipError,
  savingReview,
  reviewError,
  dateFormatter,
  onBack,
  onReadStatusChange,
  onOwnershipChange,
  onAddToReadingList,
  onReviewSave,
  onReviewDelete,
}: {
  book: Book;
  canEdit: boolean;
  isWishlistBook: boolean;
  backLabel: string;
  metadataSummary: MetadataSummaryItem[];
  queuedReaders: Record<ReaderId, boolean>;
  members: LibraryMember[];
  activeMember: LibraryMember | null;
  savingReadStatus: boolean;
  readStatusError: string | null;
  savingOwnership: boolean;
  ownershipError: string | null;
  savingReview: boolean;
  reviewError: string | null;
  dateFormatter: Intl.DateTimeFormat;
  onBack: () => void;
  onReadStatusChange: (checked: boolean) => void;
  onOwnershipChange: (nextOwnershipStatus: "owned" | "wishlist") => void;
  onAddToReadingList: (readerId: ReaderId) => void;
  onReviewSave: (rating: number, review: string) => void;
  onReviewDelete: () => void;
}) {
  const editBookPath = `/book/${book.id}/edit?returnTo=${encodeURIComponent(`/book/${book.id}`)}`;
  const editCoverPath = `${editBookPath}&section=cover`;
  const loginToEditPath = `/login?returnTo=${encodeURIComponent(`/book/${book.id}/edit?returnTo=${encodeURIComponent(`/book/${book.id}`)}`)}`;
  const [draftRating, setDraftRating] = useState(book.currentUserReview?.rating ?? 0);
  const [draftReview, setDraftReview] = useState(book.currentUserReview?.review ?? "");

  useEffect(() => {
    setDraftRating(book.currentUserReview?.rating ?? 0);
    setDraftReview(book.currentUserReview?.review ?? "");
  }, [book.currentUserReview]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </button>
      </div>

      <div className="ds-panel-surface overflow-hidden rounded-2xl bg-cream/95 shadow-soft">
        <div className="book-detail-layout grid gap-5 p-4 sm:p-5 md:grid-cols-3 md:gap-6 md:p-6">
          <div className="book-detail-cover md:col-span-1">
            <div className="relative">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  className="book-detail-cover__image aspect-2/3 w-full rounded-lg object-cover shadow-md"
                />
              ) : (
                <div className="book-detail-cover__image flex aspect-2/3 w-full items-center justify-center rounded-lg bg-warm-gray-light text-stone-500 shadow-md">
                  <span className="ds-chip border-warm-gray bg-cream px-4 py-2 text-stone-600" aria-hidden="true">
                    No Cover
                  </span>
                </div>
              )}
              {book.averageRating !== null && book.ratingCount > 0 ? (
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/60 bg-stone-950/75 px-2.5 py-1 text-xs font-bold text-amber-100 shadow-md backdrop-blur">
                  <Star className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor" />
                  {Number.isInteger(book.averageRating)
                    ? book.averageRating
                    : book.averageRating.toFixed(1)}
                </div>
              ) : null}
            </div>
            {canEdit ? (
              <Link
                to={editCoverPath}
                className="book-detail-cover__edit-cover"
                aria-label={`Edit cover for ${book.title}`}
                title="Edit cover"
              >
                <Camera className="book-detail-cover__edit-cover-icon" strokeWidth={2.75} aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <div className="book-detail-content space-y-4 md:col-span-2">
            <div className="book-detail-summary">
              <h1 className="font-display text-3xl font-bold text-stone-900">{book.title}</h1>
              <p className="mt-2 font-sans text-lg text-stone-600">{book.author}</p>
              {book.seriesName ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                  <span className="font-medium text-stone-700">Series:</span>
                  <Link
                    to={`/series#${normalizeSeriesName(book.seriesName)}`}
                    className="inline-flex items-center rounded-full border border-sage/25 bg-sage/10 px-3 py-1 font-medium text-sage-dark no-underline transition-colors hover:border-sage/35 hover:bg-sage/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/25"
                  >
                    {book.seriesName}
                    {book.seriesLabel ? ` #${book.seriesLabel}` : ""}
                  </Link>
                </div>
              ) : null}
              {metadataSummary.length > 0 ? (
                <dl className="book-detail-summary-meta">
                  {metadataSummary.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <div className="book-detail-badges flex flex-wrap gap-2">
              <Badge variant={isWishlistBook ? "amber" : "default"}>
                {isWishlistBook ? "Wishlist" : "Owned"}
              </Badge>
              {book.finished ? <Badge variant="success">Finished</Badge> : null}
              {book.currentUserHasRead ? <Badge variant="amber">Read by you</Badge> : null}
              {book.readers
                .filter((reader) => reader.memberId !== activeMember?.id)
                .map((reader) => (
                  <Badge key={reader.memberId} variant="amber">
                    Read by {reader.displayName}
                  </Badge>
                ))}
              {book.readers.length === 0 ? <Badge variant="amber">To Read</Badge> : null}
            </div>

            {book.description ? (
              <p className="book-detail-description font-sans leading-relaxed text-stone-700">
                {book.description}
              </p>
            ) : null}

            <section className="ds-panel-surface bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Ratings & Reviews
                  </h2>
                  <p className="ds-muted-meta mt-1 text-xs">
                    Rate this book and read visible reviews from library members.
                  </p>
                </div>
                <div className="ds-muted-meta text-xs" aria-live="polite">
                  {savingReview ? "Saving review..." : "Saved"}
                </div>
              </div>

              {activeMember ? (
                <div className="mt-3 rounded-lg border border-warm-gray bg-cream/85 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setDraftRating(rating)}
                        disabled={savingReview}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          draftRating >= rating
                            ? "border-amber-300 bg-amber-100 text-amber-700"
                            : "border-warm-gray bg-cream text-stone-400 hover:border-amber-200 hover:text-amber-600"
                        }`}
                        aria-label={`Rate ${rating} out of 5`}
                        aria-pressed={draftRating === rating}
                      >
                        <Star className="h-5 w-5" aria-hidden="true" fill={draftRating >= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-sm font-medium text-stone-700" htmlFor="book-review-text">
                    Review
                  </label>
                  <textarea
                    id="book-review-text"
                    value={draftReview}
                    onChange={(event) => setDraftReview(event.target.value)}
                    disabled={savingReview}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-warm-gray bg-cream px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 disabled:opacity-60"
                    placeholder="What stood out about this book?"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={savingReview || draftRating === 0}
                      onClick={() => onReviewSave(draftRating, draftReview)}
                    >
                      Save Review
                    </Button>
                    {book.currentUserReview ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={savingReview}
                        onClick={onReviewDelete}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete Review
                        </span>
                      </Button>
                    ) : null}
                  </div>
                  {reviewError ? (
                    <p className="mt-2 text-xs text-rose-700" role="alert">
                      {reviewError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-warm-gray bg-cream/85 px-3 py-2 text-sm text-stone-600">
                  Sign in as a library member to rate and review this book.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {book.reviews.length > 0 ? (
                  book.reviews.map((review) => (
                    <article key={review.memberId} className="rounded-lg border border-warm-gray bg-cream/85 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium text-stone-900">{review.displayName}</div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                          <Star className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor" />
                          {review.rating}
                        </div>
                      </div>
                      {review.review ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                          {review.review}
                        </p>
                      ) : null}
                      <p className="ds-muted-meta mt-2 text-xs">
                        Updated {dateFormatter.format(new Date(review.updatedAt))}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-stone-600">No visible reviews yet.</p>
                )}
              </div>
            </section>

            {metadataSummary.length > 0 ? (
              <section className="ds-panel-surface bg-stone-50/70 p-4">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Metadata
                  </h2>
                  <p className="ds-muted-meta mt-1 text-xs">
                    Quick facts for scanning this book at a glance.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {metadataSummary.map((item) => (
                    <div key={item.label} className="ds-panel-surface min-w-28 bg-cream px-3 py-2">
                      <p className="ds-muted-meta text-[11px] font-semibold uppercase tracking-[0.14em]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {canEdit ? (
            <section className="ds-panel-surface bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Reading
                  </h2>
                  <p className="ds-muted-meta mt-1 text-xs">
                    Mark your read status and add this book to a visible member's next-up list.
                  </p>
                </div>
                <div className="ds-muted-meta text-xs" aria-live="polite">
                  {savingReadStatus
                    ? "Saving read status..."
                    : Object.values(queuedReaders).some(Boolean)
                      ? "Queued"
                      : "Saved"}
                </div>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div className="ds-panel-surface p-3">
                  <h3 className="ds-muted-meta text-xs font-semibold uppercase tracking-[0.16em]">
                    Read status
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label
                      htmlFor="detail-read-current-user"
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-warm-gray-light"
                    >
                      <input
                        id="detail-read-current-user"
                        name="currentUserHasRead"
                        type="checkbox"
                        checked={book.currentUserHasRead}
                        disabled={savingReadStatus || !activeMember}
                        onChange={(event) => onReadStatusChange(event.target.checked)}
                        className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                      />
                      {activeMember ? activeMember.displayName : "Me"}
                    </label>
                    {book.readers
                      .filter((reader) => reader.memberId !== activeMember?.id)
                      .map((reader) => (
                      <label
                        key={reader.memberId}
                        className="flex min-h-9 items-center gap-2 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-500"
                      >
                        <input
                          type="checkbox"
                          checked
                          disabled
                          className="h-4 w-4 rounded border-warm-gray text-stone-900"
                        />
                        {reader.displayName}
                      </label>
                    ))}
                  </div>

                  {readStatusError ? (
                    <p className="mt-2 text-xs text-rose-700" role="alert">
                      {readStatusError}
                    </p>
                  ) : null}
                </div>

                <div className="ds-panel-surface p-3">
                  <h3 className="ds-muted-meta text-xs font-semibold uppercase tracking-[0.16em]">
                    To read
                  </h3>
                  <p className="ds-muted-meta mt-1 text-xs">
                    Add this book to a member's next-up list.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {members.map((member) => {
                      const readerId = member.id;
                      const label = member.displayName;
                      const queued = queuedReaders[readerId];
                      return (
                        <Button
                          key={readerId}
                          type="button"
                          variant={queued ? "secondary" : "primary"}
                          onClick={() => onAddToReadingList(readerId)}
                        >
                          {queued ? "Move to top for " : "Add to "}
                          {label}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={isWishlistBook ? "amber" : "default"}>
                      {isWishlistBook ? "Wishlist book" : "Library book"}
                    </Badge>
                    {members
                      .filter((member) => queuedReaders[member.id])
                      .map((member) => (
                        <Badge key={member.id} variant="success">
                          Queued for {member.displayName}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </section>
            ) : null}

            {canEdit ? (
            <section className="ds-panel-surface bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Ownership
                  </h2>
                  <p className="ds-muted-meta mt-1 text-xs">
                    {isWishlistBook
                      ? "Move this book into the library when you own it."
                      : "Move this book to the wishlist when you no longer own it."}
                  </p>
                </div>
                <div className="ds-muted-meta text-xs" aria-live="polite">
                  {savingOwnership ? "Saving..." : "Saved"}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="ds-subtle-text text-sm">
                  Current shelf:{" "}
                  <span className="font-semibold text-stone-900">
                    {isWishlistBook ? "Wishlist" : "Library"}
                  </span>
                </p>
                <Button
                  type="button"
                  variant={isWishlistBook ? "success" : "secondary"}
                  disabled={savingOwnership}
                  onClick={() => onOwnershipChange(isWishlistBook ? "owned" : "wishlist")}
                >
                  {isWishlistBook ? "Add To Library" : "Move To Wishlist"}
                </Button>
              </div>

              {ownershipError ? (
                <p className="mt-2 text-xs text-rose-700" role="alert">
                  {ownershipError}
                </p>
              ) : null}
            </section>
            ) : null}

            <div className="space-y-3 border-t border-warm-gray pt-4">
              {book.genre ? (
                <div>
                  <span className="ds-muted-meta text-sm font-semibold">Genre:</span>
                  <p className="mt-1 text-stone-900">{book.genre}</p>
                </div>
              ) : null}

              {book.isbn ? (
                <div>
                  <span className="ds-muted-meta text-sm font-semibold">ISBN:</span>
                  <p className="mt-1 font-mono text-sm text-stone-900">{book.isbn}</p>
                </div>
              ) : null}

              {book.format ? (
                <div>
                  <span className="ds-muted-meta text-sm font-semibold">Format:</span>
                  <p className="mt-1 text-stone-900">{BOOK_FORMAT_LABELS[book.format]}</p>
                </div>
              ) : null}

              {book.pages ? (
                <div>
                  <span className="ds-muted-meta text-sm font-semibold">Pages:</span>
                  <p className="mt-1 text-stone-900">{book.pages}</p>
                </div>
              ) : null}

              <div>
                <span className="ds-muted-meta text-sm font-semibold">Added:</span>
                <p className="mt-1 text-stone-900">{dateFormatter.format(new Date(book.createdAt))}</p>
              </div>

              <div>
                <span className="ds-muted-meta text-sm font-semibold">Last Updated:</span>
                <p className="mt-1 text-stone-900">{dateFormatter.format(new Date(book.updatedAt))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canEdit ? (
        <Link
          to={editBookPath}
          className="book-detail-edit-action"
          aria-label={`Edit ${book.title}`}
          title="Edit book"
        >
          <Edit className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          to={loginToEditPath}
          className="book-detail-edit-action"
          aria-label={`Sign in to edit ${book.title}`}
          title="Sign in to edit"
        >
          <LogIn className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
