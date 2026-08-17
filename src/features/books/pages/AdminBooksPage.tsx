import { Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../ui/components/Button";
import { Input } from "../../../ui/components/Input";
import { Select } from "../../../ui/components/Select";
import { LoadingState } from "../../../ui/components/LoadingState";
import { ManageBooksFilterPanel } from "../components/manage/ManageBooksFilterPanel";
import { ManageBooksResults } from "../components/manage/ManageBooksResults";
import { ManageDeleteDialog } from "../components/manage/ManageDeleteDialog";
import { useAdminBooksManager } from "../hooks/useAdminBooksManager";
import type { Book } from "../lib/bookTypes";
import { useLibrary } from "../../libraries/useLibrary";
import type { LibraryRole } from "../../libraries/libraryTypes";
import { invokeAdminUserRequest, updateLibrary } from "../../../repos/libraryRepo";

export function AdminBooksPage() {
  const { page, filters, modal, list, actions } = useAdminBooksManager();
  const {
    activeLibrary,
    canAdmin,
    members,
    refreshLibraries,
  } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
  const [libraryName, setLibraryName] = useState(activeLibrary?.name ?? "");
  const [librarySlug, setLibrarySlug] = useState(activeLibrary?.slug ?? "");
  const [libraryPublic, setLibraryPublic] = useState(activeLibrary?.publicAccessEnabled ?? false);
  const [memberEmail, setMemberEmail] = useState("ecsloan3@gmail.com");
  const [memberName, setMemberName] = useState("Emma");
  const [memberRole, setMemberRole] = useState<LibraryRole>("member");
  const [memberActivityVisible, setMemberActivityVisible] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    setLibraryName(activeLibrary?.name ?? "");
    setLibrarySlug(activeLibrary?.slug ?? "");
    setLibraryPublic(activeLibrary?.publicAccessEnabled ?? false);
  }, [activeLibrary]);

  const handleStartAddBook = (ownership = filters.filterOwnership) => {
    navigate(`/book/new?ownership=${ownership}&returnTo=${returnTo}`);
  };

  const handleEditBook = (book: Book) => {
    navigate(`/book/${book.id}/edit?returnTo=${returnTo}`);
  };

  const handleSaveLibrary = async () => {
    if (!activeLibrary) return;
    setAdminMessage(null);
    setAdminError(null);
    try {
      await updateLibrary(activeLibrary.id, {
        name: libraryName,
        slug: librarySlug,
        publicAccessEnabled: libraryPublic,
      });
      await refreshLibraries();
      setAdminMessage("Saved library settings.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Unable to save library settings.");
    }
  };

  const handleInviteMember = async () => {
    if (!activeLibrary) return;
    setAdminMessage(null);
    setAdminError(null);
    try {
      await invokeAdminUserRequest({
        action: "invite-member",
        libraryId: activeLibrary.id,
        email: memberEmail,
        displayName: memberName,
        role: memberRole,
        canViewMemberActivity: memberActivityVisible,
      });
      await refreshLibraries();
      setAdminMessage("Member invite/update request completed.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Unable to invite member.");
    }
  };

  return (
    <div className="space-y-6">
      {canAdmin ? (
        <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900">
                  Library Settings
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Control the selected library and whether public visitors can browse it.
                </p>
              </div>
              <Input
                id="admin-library-name"
                label="Library name"
                value={libraryName}
                onChange={(event) => setLibraryName(event.target.value)}
              />
              <Input
                id="admin-library-slug"
                label="Share slug"
                value={librarySlug}
                onChange={(event) => setLibrarySlug(event.target.value)}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={libraryPublic}
                  onChange={(event) => setLibraryPublic(event.target.checked)}
                  className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                />
                Public browsing enabled
              </label>
              <Button type="button" variant="primary" onClick={() => void handleSaveLibrary()}>
                Save Library
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900">
                  Members
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Invite members, assign roles, and control activity visibility.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="admin-member-email"
                  label="Email"
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                />
                <Input
                  id="admin-member-name"
                  label="Display name"
                  value={memberName}
                  onChange={(event) => setMemberName(event.target.value)}
                />
              </div>
              <Select
                id="admin-member-role"
                label="Role"
                value={memberRole}
                options={[
                  { value: "member", label: "Member" },
                  { value: "editor", label: "Editor" },
                  { value: "admin", label: "Admin" },
                ]}
                onChange={(event) => setMemberRole(event.target.value as LibraryRole)}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={memberActivityVisible}
                  onChange={(event) => setMemberActivityVisible(event.target.checked)}
                  className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                />
                Let library members see this member's read/TBR activity
              </label>
              <Button type="button" variant="primary" onClick={() => void handleInviteMember()}>
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Or Update Member
                </span>
              </Button>

              <div className="rounded-lg border border-warm-gray bg-parchment/70 p-3">
                <h3 className="text-sm font-semibold text-stone-800">Current members</h3>
                <ul className="mt-2 space-y-2 text-sm text-stone-600">
                  {members.map((member) => (
                    <li key={member.id} className="flex justify-between gap-3">
                      <span>{member.displayName}</span>
                      <span className="capitalize">{member.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {adminMessage ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {adminMessage}
            </div>
          ) : null}
          {adminError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {adminError}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
                Manage Books
              </h2>
              <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
                Add books and maintain catalog details. Browse covers and reading status from the
                Library and Wishlist pages.
              </p>
            </div>
            <Button variant="primary" onClick={() => handleStartAddBook()}>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Book
                </span>
              </Button>
          </div>

          {page.errorMessage ? (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {page.errorMessage}
            </div>
          ) : null}
          {page.statusMessage ? (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {page.statusMessage}
            </div>
          ) : null}

          <ManageBooksFilterPanel
            searchQuery={filters.searchQuery}
            filterGenre={filters.filterGenre}
            filterReadStatus={filters.filterReadStatus}
            filterOwnership={filters.filterOwnership}
            filterFormat={filters.filterFormat}
            filterSeries={filters.filterSeries}
            availableGenres={filters.availableGenres}
            availableFormats={filters.availableFormats}
            availableSeries={filters.availableSeries}
            filteredCount={filters.filteredBooks.length}
            hasActiveFilters={filters.hasActiveFilters}
            onSearchQueryChange={actions.setSearchQuery}
            onFilterGenreChange={actions.setFilterGenre}
            onFilterReadStatusChange={actions.setFilterReadStatus}
            onFilterOwnershipChange={actions.handleOwnershipTabChange}
            onFilterFormatChange={actions.setFilterFormat}
            onFilterSeriesChange={actions.setFilterSeries}
            onClearFilters={actions.handleClearFilters}
          />
        </div>
      </section>

      <section className="space-y-3">
        {page.loading ? (
          <LoadingState
            title="Loading Manage Books"
            description="Restoring the catalog table and ownership actions."
            variant="panel"
          />
        ) : (
          <ManageBooksResults
            loading={page.loading}
            books={list.books}
            filteredBooks={filters.filteredBooks}
            filterOwnership={filters.filterOwnership}
            onStartAddBook={handleStartAddBook}
            onClearFilters={actions.handleClearFilters}
            onEdit={handleEditBook}
            onDelete={actions.setDeleteTarget}
            onToggleOwnership={(book) => void actions.handleQuickOwnershipToggle(book)}
            ownershipBusyId={list.ownershipActionBookId}
          />
        )}
      </section>

      <ManageDeleteDialog
        open={modal.deleteTarget !== null}
        title={modal.deleteTarget?.title ?? "Untitled"}
        busy={modal.deletePending}
        onCancel={() => {
          if (!modal.deletePending) actions.setDeleteTarget(null);
        }}
        onConfirm={actions.handleConfirmDeleteBook}
      />
    </div>
  );
}
