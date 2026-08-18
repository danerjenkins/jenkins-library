import { Save, UserCog, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../ui/components/Button";
import { Input } from "../../../ui/components/Input";
import { Select } from "../../../ui/components/Select";
import { invokeAdminUserRequest, updateLibrary } from "../../../repos/libraryRepo";
import type { LibraryMember, LibraryRole } from "../../libraries/libraryTypes";
import { useLibrary } from "../../libraries/useLibrary";

const roleOptions: Array<{ value: LibraryRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

function getMemberEmail(member: LibraryMember | undefined) {
  return member?.email ?? "";
}

export function AdminBooksPage() {
  const { activeLibrary, canAdmin, members, refreshLibraries } = useLibrary();
  const [libraryName, setLibraryName] = useState(activeLibrary?.name ?? "");
  const [librarySlug, setLibrarySlug] = useState(activeLibrary?.slug ?? "");
  const [libraryPublic, setLibraryPublic] = useState(activeLibrary?.publicAccessEnabled ?? false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<LibraryRole>("member");
  const [newMemberActivityVisible, setNewMemberActivityVisible] = useState(true);
  const [newMemberReviewsVisible, setNewMemberReviewsVisible] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [editMemberEmail, setEditMemberEmail] = useState("");
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberRole, setEditMemberRole] = useState<LibraryRole>("member");
  const [editMemberActivityVisible, setEditMemberActivityVisible] = useState(true);
  const [editMemberReviewsVisible, setEditMemberReviewsVisible] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId),
    [members, selectedMemberId],
  );

  useEffect(() => {
    setLibraryName(activeLibrary?.name ?? "");
    setLibrarySlug(activeLibrary?.slug ?? "");
    setLibraryPublic(activeLibrary?.publicAccessEnabled ?? false);
  }, [activeLibrary]);

  useEffect(() => {
    if (members.length === 0) {
      setSelectedMemberId("");
      return;
    }

    setSelectedMemberId((currentMemberId) =>
      members.some((member) => member.id === currentMemberId)
        ? currentMemberId
        : members[0].id,
    );
  }, [members]);

  useEffect(() => {
    setEditMemberEmail(getMemberEmail(selectedMember));
    setEditMemberName(selectedMember?.displayName ?? "");
    setEditMemberRole(selectedMember?.role ?? "member");
    setEditMemberActivityVisible(selectedMember?.canViewMemberActivity ?? true);
    setEditMemberReviewsVisible(selectedMember?.canViewRatingsReviews ?? true);
  }, [selectedMember]);

  const clearAdminFeedback = () => {
    setAdminMessage(null);
    setAdminError(null);
  };

  const handleSaveLibrary = async () => {
    if (!activeLibrary) return;
    clearAdminFeedback();
    setSavingLibrary(true);
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
    } finally {
      setSavingLibrary(false);
    }
  };

  const handleCreateMember = async () => {
    if (!activeLibrary) return;
    clearAdminFeedback();
    setCreatingMember(true);
    try {
      await invokeAdminUserRequest({
        action: "invite-member",
        libraryId: activeLibrary.id,
        email: newMemberEmail,
        displayName: newMemberName,
        role: newMemberRole,
        canViewMemberActivity: newMemberActivityVisible,
        canViewRatingsReviews: newMemberReviewsVisible,
      });
      await refreshLibraries();
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberRole("member");
      setNewMemberActivityVisible(true);
      setNewMemberReviewsVisible(true);
      setAdminMessage("Created or invited member.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Unable to create member.");
    } finally {
      setCreatingMember(false);
    }
  };

  const handleSaveMember = async () => {
    if (!activeLibrary || !selectedMember) return;
    clearAdminFeedback();
    setSavingMember(true);
    try {
      await invokeAdminUserRequest({
        action: "update-member",
        libraryId: activeLibrary.id,
        memberId: selectedMember.id,
        email: editMemberEmail,
        displayName: editMemberName,
        role: editMemberRole,
        canViewMemberActivity: editMemberActivityVisible,
        canViewRatingsReviews: editMemberReviewsVisible,
      });
      await refreshLibraries();
      setAdminMessage(`Saved ${editMemberName || "member"}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Unable to save member.");
    } finally {
      setSavingMember(false);
    }
  };

  if (!canAdmin) {
    return (
      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <h2 className="font-display text-2xl font-bold text-stone-900">Admin</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          You need admin access to edit library settings or members.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
              Library
            </p>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Edit Library Settings
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Change the selected library name, share slug, and public browsing access.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSaveLibrary()}
            disabled={!activeLibrary || savingLibrary}
            className="min-h-9 shrink-0 px-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              {savingLibrary ? "Saving..." : "Save Library"}
            </span>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={libraryPublic}
            onChange={(event) => setLibraryPublic(event.target.checked)}
            className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
          />
          Public browsing enabled
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
              New User
            </p>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Create Or Invite User
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Add someone to this library. If they do not have an account yet, Supabase sends an invite.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="admin-new-member-email"
                label="Email"
                type="email"
                value={newMemberEmail}
                onChange={(event) => setNewMemberEmail(event.target.value)}
              />
              <Input
                id="admin-new-member-name"
                label="Display name"
                value={newMemberName}
                onChange={(event) => setNewMemberName(event.target.value)}
              />
            </div>
            <Select
              id="admin-new-member-role"
              label="Role"
              value={newMemberRole}
              options={roleOptions}
              onChange={(event) => setNewMemberRole(event.target.value as LibraryRole)}
            />
            <label className="flex items-start gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={newMemberActivityVisible}
                onChange={(event) => setNewMemberActivityVisible(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
              />
              <span>Let library members see this user's read/TBR activity</span>
            </label>
            <label className="flex items-start gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={newMemberReviewsVisible}
                onChange={(event) => setNewMemberReviewsVisible(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
              />
              <span>Let library members see this user's ratings/reviews</span>
            </label>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleCreateMember()}
              disabled={!activeLibrary || creatingMember}
            >
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {creatingMember ? "Creating..." : "Create User"}
              </span>
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
              Existing User
            </p>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Edit Existing User
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Choose a current library member, then update their role or activity visibility.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <Select
              id="admin-existing-member"
              label="Current member"
              value={selectedMemberId}
              options={members.map((member) => ({
                value: member.id,
                label: `${member.displayName} (${member.role})`,
              }))}
              onChange={(event) => setSelectedMemberId(event.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="admin-edit-member-email"
                label="Email"
                type="email"
                value={editMemberEmail}
                onChange={(event) => setEditMemberEmail(event.target.value)}
                disabled
              />
              <Input
                id="admin-edit-member-name"
                label="Display name"
                value={editMemberName}
                onChange={(event) => setEditMemberName(event.target.value)}
                disabled={!selectedMember}
              />
            </div>
            <Select
              id="admin-edit-member-role"
              label="Role"
              value={editMemberRole}
              options={roleOptions}
              onChange={(event) => setEditMemberRole(event.target.value as LibraryRole)}
              disabled={!selectedMember}
            />
            <label className="flex items-start gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={editMemberActivityVisible}
                onChange={(event) => setEditMemberActivityVisible(event.target.checked)}
                disabled={!selectedMember}
                className="mt-1 h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20 disabled:opacity-50"
              />
              <span>Let library members see this user's read/TBR activity</span>
            </label>
            <label className="flex items-start gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={editMemberReviewsVisible}
                onChange={(event) => setEditMemberReviewsVisible(event.target.checked)}
                disabled={!selectedMember}
                className="mt-1 h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20 disabled:opacity-50"
              />
              <span>Let library members see this user's ratings/reviews</span>
            </label>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSaveMember()}
              disabled={!activeLibrary || !selectedMember || savingMember}
            >
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4" aria-hidden="true" />
                {savingMember ? "Saving..." : "Save User"}
              </span>
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-warm-gray bg-parchment/70 p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl font-bold text-stone-900">Current Members</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMemberId(member.id)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                selectedMemberId === member.id
                  ? "border-sage bg-sage/10"
                  : "border-warm-gray bg-cream/80 hover:border-sage/50"
              }`}
            >
              <span className="block text-sm font-semibold text-stone-900">
                {member.displayName}
              </span>
              <span className="mt-1 block text-xs text-stone-600">
                {member.email ?? "No linked email"} · {member.role}
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                Activity visible: {member.canViewMemberActivity ? "Yes" : "No"}
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                Ratings visible: {member.canViewRatingsReviews ? "Yes" : "No"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {adminMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {adminMessage}
        </div>
      ) : null}
      {adminError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {adminError}
        </div>
      ) : null}
    </div>
  );
}
