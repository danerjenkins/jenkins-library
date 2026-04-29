import { FullBleedPageHero, PageLayout } from "../../../ui/components/PageLayout";
import { LoadingState } from "../../../ui/components/LoadingState";
import {
  ReadingListIntroSection,
  ReadingListQueueSection,
} from "../sections/ReadingListPageSections";
import { useReadingListPage } from "../hooks/useReadingListPage";

function getReaderLabel(readerId: "dane" | "emma") {
  return readerId === "dane" ? "Dane" : "Emma";
}

export function ReadingListPage() {
  const { state, loading, errorMessage, prioritizedBooks, actions } =
    useReadingListPage();

  const activeReaderLabel = getReaderLabel(state.activeReader);
  const queuedTotal = prioritizedBooks.queueBooks.length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Reading List"
        subtitle="The near horizon: the books waiting closest to hand."
        backgroundImage="/readinglisthero.png"
      />

      <PageLayout>
        <ReadingListIntroSection
          activeReader={state.activeReader}
          queuedTotal={queuedTotal}
          activeReaderLabel={activeReaderLabel}
          onActiveReaderChange={actions.setActiveReader}
        />

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
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
          <ReadingListQueueSection
            readerId={state.activeReader}
            queueBooks={prioritizedBooks.queueBooks}
            onMoveUp={(readerId, bookId) =>
              actions.moveBook(readerId, bookId, "up")
            }
            onMoveDown={(readerId, bookId) =>
              actions.moveBook(readerId, bookId, "down")
            }
            onRemove={actions.removeFromQueue}
          />
        )}
      </PageLayout>
    </div>
  );
}
