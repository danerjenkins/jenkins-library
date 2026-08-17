import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import { useLibrary } from "../libraries/useLibrary";
import { Button } from "../../ui/components/Button";
import { Select } from "../../ui/components/Select";

export function ProfilePage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const {
    activeLibrary,
    activeMember,
    canAdmin,
    canEdit,
    libraries,
    setActiveLibraryId,
  } = useLibrary();

  async function handleSignOut() {
    await signOut();
    navigate("/view", { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <section className="ds-panel-surface bg-cream/95 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage/15 text-sage-dark">
            <UserCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-stone-900">Profile</h1>
            <p className="mt-1 break-words text-sm text-stone-600">
              {session?.user.email ?? "Not signed in"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Select
            id="active-library"
            label="Viewing library"
            value={activeLibrary?.id ?? ""}
            options={libraries.map((library) => ({
              value: library.id,
              label: library.name,
            }))}
            onChange={(event) => setActiveLibraryId(event.target.value)}
          />

          <div className="rounded-lg border border-warm-gray bg-parchment/70 px-3 py-2">
            <div className="ds-muted-meta text-xs font-semibold uppercase tracking-[0.16em]">
              Access
            </div>
            <p className="mt-2 text-sm font-medium text-stone-800">
              {activeMember
                ? canAdmin
                  ? "Admin"
                  : canEdit
                    ? "Editor"
                    : "Member"
                : activeLibrary?.publicAccessEnabled
                  ? "Public browsing"
                  : "No library membership"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          {session ? (
            <Button type="button" variant="secondary" onClick={() => void handleSignOut()}>
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </span>
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
