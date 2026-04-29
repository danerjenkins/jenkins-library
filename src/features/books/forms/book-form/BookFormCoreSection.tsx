import type { ChangeEvent, Ref, RefObject } from "react";
import type { OpenLibraryCandidate, TitleSuggestion } from "../../../../integrations/openLibrary";
import type { BookFormSection } from "./BookForm.types";
import { MobileSectionToggle } from "./BookFormTabs";
import {
  BookFormAdvancedDetailsPrompt,
  BookFormIdentityPanel,
} from "./BookFormCorePanels";
import { BookFormCoverWorkspace } from "./BookFormCoverWorkspace";

export function BookFormCoreSection({
  activeSection,
  onSectionChange,
  sectionRef,
  titleFieldRef,
  isEditing,
  title,
  author,
  genre,
  coverUrl,
  ownershipStatus,
  coverPhotoUrl,
  showCoverSaved,
  showCoverPhotoControls,
  coverPhotoInputRef,
  showAdvancedFields,
  titleSuggestions,
  isSuggesting,
  showSuggestions,
  titleError,
  authorError,
  authorWasAutofilled,
  genreWasAutofilled,
  isSearching,
  searchError,
  coverCandidates,
  selectedCoverUrl,
  coverSourceLabel,
  hasRemoteCover,
  hasLocalPhoto,
  onTitleInput,
  onTitleFocus,
  onTitleBlur,
  onAuthorInput,
  onAuthorFocus,
  onAuthorBlur,
  onClearAuthor,
  onOwnershipStatusChange,
  onCoverUrlChange,
  onCoverSelect,
  onSuggestionSelect,
  onCoverPhotoPick,
  onRemoveCoverPhoto,
  onCoverPhotoFileChange,
  onToggleAdvancedDetails,
}: {
  activeSection: BookFormSection;
  onSectionChange: (section: BookFormSection) => void;
  sectionRef: RefObject<HTMLElement | null>;
  titleFieldRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  ownershipStatus: "owned" | "wishlist";
  coverPhotoUrl: string | null;
  showCoverSaved: boolean;
  showCoverPhotoControls: boolean;
  coverPhotoInputRef: Ref<HTMLInputElement>;
  showAdvancedFields: boolean;
  titleSuggestions: TitleSuggestion[];
  isSuggesting: boolean;
  showSuggestions: boolean;
  titleError: string | null;
  authorError: string | null;
  authorWasAutofilled: boolean;
  genreWasAutofilled: boolean;
  isSearching: boolean;
  searchError: string | null;
  coverCandidates: OpenLibraryCandidate[];
  selectedCoverUrl: string | null;
  coverSourceLabel: string;
  hasRemoteCover: boolean;
  hasLocalPhoto: boolean;
  onTitleInput: (value: string) => void;
  onTitleFocus: () => void;
  onTitleBlur: () => void;
  onAuthorInput: (value: string) => void;
  onAuthorFocus: () => void;
  onAuthorBlur: () => void;
  onClearAuthor: () => void;
  onOwnershipStatusChange: (value: "owned" | "wishlist") => void;
  onCoverUrlChange: (value: string) => void;
  onCoverSelect: (candidate: OpenLibraryCandidate) => void;
  onSuggestionSelect: (suggestion: TitleSuggestion) => void;
  onCoverPhotoPick: () => void;
  onRemoveCoverPhoto: () => void;
  onCoverPhotoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleAdvancedDetails: () => void;
}) {
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
    >
      <MobileSectionToggle
        activeSection={activeSection}
        section="core"
        label="Core Info"
        onClick={onSectionChange}
      />
      <div
        id="section-core"
        role="tabpanel"
        className={`${activeSection === "core" ? "block" : "hidden"} px-4 pb-4 pt-4`}
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <BookFormIdentityPanel
              titleFieldRef={titleFieldRef}
              title={title}
              author={author}
              ownershipStatus={ownershipStatus}
              titleSuggestions={titleSuggestions}
              isSuggesting={isSuggesting}
              showSuggestions={showSuggestions}
              titleError={titleError}
              authorError={authorError}
              authorWasAutofilled={authorWasAutofilled}
              onTitleInput={onTitleInput}
              onTitleFocus={onTitleFocus}
              onTitleBlur={onTitleBlur}
              onAuthorInput={onAuthorInput}
              onAuthorFocus={onAuthorFocus}
              onAuthorBlur={onAuthorBlur}
              onClearAuthor={onClearAuthor}
              onOwnershipStatusChange={onOwnershipStatusChange}
              onSuggestionSelect={onSuggestionSelect}
            />

            <BookFormCoverWorkspace
              coverUrl={coverUrl}
              title={title}
              author={author}
              coverPhotoUrl={coverPhotoUrl}
              showCoverSaved={showCoverSaved}
              showCoverPhotoControls={showCoverPhotoControls}
              coverPhotoInputRef={coverPhotoInputRef}
              isSearching={isSearching}
              searchError={searchError}
              coverCandidates={coverCandidates}
              selectedCoverUrl={selectedCoverUrl}
              coverSourceLabel={coverSourceLabel}
              hasRemoteCover={hasRemoteCover}
              hasLocalPhoto={hasLocalPhoto}
              onCoverUrlChange={onCoverUrlChange}
              onCoverSelect={onCoverSelect}
              onCoverPhotoPick={onCoverPhotoPick}
              onRemoveCoverPhoto={onRemoveCoverPhoto}
              onCoverPhotoFileChange={onCoverPhotoFileChange}
            />
          </div>

          <BookFormAdvancedDetailsPrompt
            isEditing={isEditing}
            showAdvancedFields={showAdvancedFields}
            onToggleAdvancedDetails={onToggleAdvancedDetails}
            genre={genre}
            genreWasAutofilled={genreWasAutofilled}
          />
        </div>
      </div>
    </section>
  );
}
