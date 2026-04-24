import { PageHero, PageLayout } from "../../ui/components/PageLayout";
import { LoadingState } from "../../ui/components/LoadingState";
import {
  ReadingListIntroSection,
  ReadingListQueueSection,
  ReadingListSuggestionsSection,
} from "./components/ReadingListPageSections";
import { useReadingListPage } from "./hooks/useReadingListPage";

function getReaderLabel(readerId: "dane" | "emma") {
  return readerId === "dane" ? "Dane" : "Emma";
}

export function ReadingListPage() {
  const { state, loading, errorMessage, prioritizedBooks, actions } = useReadingListPage();

  const activeReaderLabel = getReaderLabel(state.activeReader);
  const queuedTotal = prioritizedBooks.queueBooks.length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <PageLayout>
        <PageHero
          title="Reading List"
          description="Keep a small next-up queue for the current reader and label each pick by shelf."
          meta={
            loading
              ? "Loading reading queue..."
              : `${queuedTotal} ${queuedTotal === 1 ? "book" : "books"} queued for ${activeReaderLabel}`
          }
        />

        <ReadingListIntroSection
          activeReader={state.activeReader}
          onActiveReaderChange={actions.setActiveReader}
        />

        {errorMessage ? (
          <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
            {errorMessage}
          </section>
        ) : null}

        {loading ? (
          <LoadingState
            title="Loading Reading List"
            description="Pulling owned and wishlist books into the next-up queue."
            variant="shelf"
            cardCount={3}
          />
        ) : (
          <div className="space-y-4">
            <ReadingListQueueSection
              readerId={state.activeReader}
              queueBooks={prioritizedBooks.queueBooks}
              onMoveUp={(readerId, bookId) => actions.moveBook(readerId, bookId, "up")}
              onMoveDown={(readerId, bookId) => actions.moveBook(readerId, bookId, "down")}
              onRemove={actions.removeFromQueue}
              onReset={actions.resetReaderQueues}
            />
            <ReadingListSuggestionsSection
              readerId={state.activeReader}
              libraryBooks={prioritizedBooks.remainingOwned}
              wishlistBooks={prioritizedBooks.remainingWishlist}
              onAddNext={actions.addToQueue}
            />
          </div>
        )}

        {!loading ? (
          <section className="rounded-[1.5rem] border border-warm-gray/85 bg-parchment/85 px-5 py-4 text-sm leading-relaxed text-stone-600 shadow-sm">
            The queue is stored in Supabase, so it stays in sync across browsers while still
            leaving the Library and Wishlist data untouched.
          </section>
        ) : null}
      </PageLayout>
    </div>
  );
}
