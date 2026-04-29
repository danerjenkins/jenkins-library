import { ScanLine, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FullBleedPageHero, PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { BookCard, BookGrid, BookShelfState } from "../components/cards/BookCard";
import {
  ShelfSearchField,
  ShelfDensitySelector,
  SegmentedControl,
} from "../components/browse/ShelfBrowseControls";
import {
  ownershipSegmentOptions,
  actionLinkClasses,
} from "../components/browse/shelfBrowseControlStyles";
import { CARD_SIZE_OPTIONS } from "../lib/shelfViewPreferences";
import { useGlobalSearchPage } from "../hooks/useGlobalSearchPage";

type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function IsbnScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const stopStream = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const detectWithCamera = async () => {
      setErrorMessage(null);
      setIsStarting(true);

      const detectorCtor = (
        window as Window & {
          BarcodeDetector?: BarcodeDetectorConstructor;
        }
      ).BarcodeDetector;

      if (!detectorCtor) {
        setErrorMessage("Barcode scanning is not supported in this browser.");
        setIsStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          throw new Error("Scanner video element is unavailable.");
        }

        video.srcObject = stream;
        await video.play();

        const detector = new detectorCtor({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        const scan = async () => {
          if (!active || !videoRef.current) {
            return;
          }

          try {
            const codes = await detector.detect(videoRef.current);
            const detected = codes.find((code) =>
              Boolean(code.rawValue?.trim()),
            );
            if (detected?.rawValue) {
              onDetected(detected.rawValue.trim());
              onClose();
              return;
            }
          } catch (error) {
            console.warn("Barcode scan attempt failed:", error);
          }

          frameRef.current = window.requestAnimationFrame(scan);
        };

        frameRef.current = window.requestAnimationFrame(scan);
      } catch (error) {
        console.error("Failed to open barcode scanner:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not open the camera scanner.",
        );
      } finally {
        setIsStarting(false);
      }
    };

    void detectWithCamera();

    return () => {
      active = false;
      stopStream();
    };
  }, [onClose, onDetected, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="ds-panel-surface w-full max-w-xl rounded-3xl bg-cream p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Scan ISBN
            </h2>
            <p className="ds-subtle-text mt-1 text-sm leading-relaxed">
              Point the camera at a barcode or ISBN label. If scanning is
              unsupported, type the number manually instead.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-button ds-button--secondary h-10 w-10 rounded-full px-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-warm-gray bg-stone-950">
          <video
            ref={videoRef}
            className="aspect-4/3 w-full object-cover"
            muted
            autoPlay
            playsInline
          />
        </div>

        <div className="mt-4 space-y-3">
          {errorMessage ? (
            <div className="ds-panel-surface border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="ds-muted-meta text-xs">
              {isStarting
                ? "Starting camera..."
                : "Hold steady until the ISBN is recognized."}
            </div>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close Scanner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const { state, actions } = useGlobalSearchPage();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const isBarcodeSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "BarcodeDetector" in window &&
    "mediaDevices" in navigator &&
    Boolean(navigator.mediaDevices.getUserMedia);

  const resultsMeta = useMemo(
    () =>
      state.loading
        ? "Loading search results..."
        : `${state.filteredBooks.length} ${state.filteredBooks.length === 1 ? "book" : "books"} matched · ${state.ownershipTotals.owned} owned · ${state.ownershipTotals.wishlist} wishlist`,
    [
      state.filteredBooks.length,
      state.loading,
      state.ownershipTotals.owned,
      state.ownershipTotals.wishlist,
    ],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Search"
        subtitle="For the title on the tip of your tongue and the one hiding three shelves deep."
        backgroundImage="/searchhero.png"
      />

      <PageLayout>
        <PageSection>
          <div className="rounded-2xl border border-warm-gray/80 bg-parchment/90 p-3 shadow-sm sm:p-4">
            <div className="grid gap-3">
              <ShelfSearchField
                id="global-search"
                name="global-search"
                label="Search"
                value={state.searchQuery}
                onChange={actions.setSearchQuery}
                placeholder="Try ISBN, title, author, or series..."
                className="lg:max-w-3xl"
              />

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <SegmentedControl
                  label="Ownership"
                  options={ownershipSegmentOptions}
                  value={state.ownershipFilter}
                  onChange={actions.setOwnershipFilter}
                />

                <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                  <ShelfDensitySelector
                    options={CARD_SIZE_OPTIONS}
                    value={state.cardSize}
                    onChange={actions.setCardSize}
                  />
                </div>
              </div>
            </div>

            <div className="ds-subtle-text mt-3 text-sm" aria-live="polite">
              {resultsMeta}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex flex-wrap gap-1.5">
                {isBarcodeSupported ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <span className="flex items-center gap-2">
                      <ScanLine className="h-4 w-4" aria-hidden="true" />
                      Scan ISBN
                    </span>
                  </Button>
                ) : null}
                {state.hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={actions.clearFilters}
                  >
                    Clear Search
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </PageSection>

        {state.loading ? (
          <LoadingState
            title="Loading Search"
            description="Gathering books from both shelves for one search result list."
            variant="shelf"
            cardCount={8}
          />
        ) : state.filteredBooks.length === 0 ? (
          <BookShelfState
            title="No matches found"
            description="Try a different ISBN, title, author, genre, or series."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/view" className={actionLinkClasses}>
                  Browse Library
                </Link>
                <Link to="/wishlist" className={actionLinkClasses}>
                  Browse Wishlist
                </Link>
              </div>
            }
          />
        ) : (
          <BookGrid cardSize={state.cardSize}>
            {state.filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="view"
                cardSize={state.cardSize}
                clickable={true}
                detailMeta={book.isbn ? `ISBN: ${book.isbn}` : null}
              />
            ))}
          </BookGrid>
        )}
      </PageLayout>

      <IsbnScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(value) => {
          const normalized = value.replace(/[^\dXx]/g, "");
          actions.setSearchQuery(normalized || value);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
}
