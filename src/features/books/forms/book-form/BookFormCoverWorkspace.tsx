import type { ChangeEvent, Ref } from "react";
import { Camera, Check, Search } from "lucide-react";
import { Input } from "../../../../ui/components/Input";
import { getGoogleImageSearchUrl } from "../../lib/bookTypes";
import type { OpenLibraryCandidate } from "../../../../integrations/openLibrary";

export function BookFormCoverWorkspace({
  coverUrl,
  title,
  author,
  coverPhotoUrl,
  showCoverSaved,
  showCoverPhotoControls,
  coverPhotoInputRef,
  isSearching,
  searchError,
  coverCandidates,
  selectedCoverUrl,
  coverSourceLabel,
  hasRemoteCover,
  hasLocalPhoto,
  onCoverUrlChange,
  onCoverSelect,
  onCoverPhotoPick,
  onRemoveCoverPhoto,
  onCoverPhotoFileChange,
}: {
  coverUrl: string;
  title: string;
  author: string;
  coverPhotoUrl: string | null;
  showCoverSaved: boolean;
  showCoverPhotoControls: boolean;
  coverPhotoInputRef: Ref<HTMLInputElement>;
  isSearching: boolean;
  searchError: string | null;
  coverCandidates: OpenLibraryCandidate[];
  selectedCoverUrl: string | null;
  coverSourceLabel: string;
  hasRemoteCover: boolean;
  hasLocalPhoto: boolean;
  onCoverUrlChange: (value: string) => void;
  onCoverSelect: (candidate: OpenLibraryCandidate) => void;
  onCoverPhotoPick: () => void;
  onRemoveCoverPhoto: () => void;
  onCoverPhotoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <aside className="space-y-3 rounded-lg bg-cream/70 p-3 sm:border sm:border-warm-gray">
        <h3 className="text-sm font-semibold text-stone-700">Cover Preview</h3>
        <div className="flex items-start gap-3">
          {hasLocalPhoto ? (
            <img
              src={coverPhotoUrl ?? undefined}
              alt="Local cover preview"
              width={72}
              height={108}
              className="h-[108px] w-[72px] rounded-md object-cover shadow-sm"
            />
          ) : hasRemoteCover ? (
            <img
              src={coverUrl}
              alt="Cover preview"
              width={72}
              height={108}
              loading="lazy"
              className="h-[108px] w-[72px] rounded-md object-cover shadow-sm"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-[108px] w-[72px] items-center justify-center rounded-md border border-dashed border-warm-gray bg-parchment text-center text-[11px] font-medium text-stone-400">
              No cover
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Source</div>
            <div className="text-sm font-medium text-stone-700">{coverSourceLabel}</div>
            {hasRemoteCover ? (
              <button
                type="button"
                onClick={() => onCoverUrlChange("")}
                className="text-xs font-medium text-stone-600 underline transition-colors touch-manipulation hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                Clear remote cover
              </button>
            ) : null}
            {!hasRemoteCover && !hasLocalPhoto ? (
              <p className="text-xs text-stone-500">
                Add a URL, choose a suggestion, or save first to attach a local photo.
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="rounded-lg bg-cream/70 p-3 sm:border sm:border-warm-gray">
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-warm-gray bg-parchment p-3">
            <Input
              id="coverUrl"
              name="coverUrl"
              label="Cover URL"
              type="url"
              value={coverUrl}
              onChange={(event) => onCoverUrlChange(event.target.value)}
              placeholder="https://example.com/cover.jpg..."
              autoComplete="off"
              inputMode="url"
              spellCheck={false}
            />
            <p className="mt-2 text-xs text-stone-500">Paste a direct image link when you already have one.</p>
            {title.trim() ? (
              <a
                href={getGoogleImageSearchUrl(title, author)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 transition-colors hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                Search Google Images
              </a>
            ) : null}
          </div>

          <div className="rounded-lg border border-warm-gray bg-parchment p-3">
            <h4 className="text-sm font-semibold text-stone-700">Open Library</h4>
            <p className="mt-1 text-xs text-stone-500">Suggestions appear after title and author are filled in.</p>
            <div className="mt-3" aria-live="polite">
              {isSearching ? <div className="text-sm text-stone-500">Searching covers...</div> : null}
              {searchError && !isSearching ? <div className="text-sm text-stone-500">{searchError}</div> : null}
              {!isSearching && !searchError && coverCandidates.length > 0 ? (
                <div>
                  <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-2">
                    {coverCandidates.map((candidate) => {
                      const isSelected = selectedCoverUrl === candidate.coverUrl;

                      return (
                        <button
                          key={candidate.key}
                          type="button"
                          onClick={() => onCoverSelect(candidate)}
                          aria-label={`${isSelected ? "Clear selected cover" : "Select cover"} for ${candidate.title}`}
                          className={`group relative shrink-0 snap-start overflow-hidden rounded-md transition-shadow touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            isSelected ? "ring-2 ring-emerald-600" : "ring-1 ring-stone-300 hover:ring-2 hover:ring-stone-400"
                          }`}
                          title={`${candidate.title}${candidate.author ? ` by ${candidate.author}` : ""}`}
                        >
                          <img
                            src={candidate.coverUrl}
                            alt={candidate.title}
                            width={96}
                            height={128}
                            loading="lazy"
                            className="h-32 w-24 object-cover"
                          />
                          {isSelected ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20">
                              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                                Selected
                              </span>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-stone-500">Swipe to see more</div>
                </div>
              ) : null}
              {!isSearching &&
              !searchError &&
              coverCandidates.length === 0 &&
              (!title.trim() || !author.trim()) ? (
                <div className="text-xs text-stone-500">Enter title and author to search for covers.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-warm-gray bg-parchment p-3">
            <h4 className="text-sm font-semibold text-stone-700">Local Photo</h4>
            <p className="mt-1 text-xs text-stone-500">Use the device camera for a physical cover.</p>
            {showCoverPhotoControls ? (
              <div className="mt-3">
                {coverPhotoUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={coverPhotoUrl}
                      alt="Saved local cover preview"
                      width={48}
                      height={64}
                      className="h-16 w-12 rounded object-cover shadow-sm"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={onCoverPhotoPick}
                        className="inline-flex items-center gap-1.5 rounded-md border border-warm-gray bg-cream px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors touch-manipulation hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
                      >
                        <Camera className="h-3 w-3" aria-hidden="true" />
                        Replace Photo
                      </button>
                      <button
                        type="button"
                        onClick={onRemoveCoverPhoto}
                        className="inline-flex text-xs font-medium text-red-600 transition-colors touch-manipulation hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onCoverPhotoPick}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors touch-manipulation hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    Take Cover Photo
                  </button>
                )}
                {showCoverSaved ? (
                  <div
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                    aria-live="polite"
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Local cover saved
                  </div>
                ) : null}
                <input
                  ref={coverPhotoInputRef}
                  name="coverPhoto"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onCoverPhotoFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-stone-500">Save the book first, then attach a local photo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
