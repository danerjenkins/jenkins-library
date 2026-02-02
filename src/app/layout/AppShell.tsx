import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../ui/hooks/useOnlineStatus";
import { syncService, type SyncStatus } from "../../sync/syncService";
import { driveClient } from "../../sync/driveClient";
import type { SyncPayload } from "../../data/exportImport";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isOnline = useOnlineStatus();
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [lastPushTime, setLastPushTime] = useState<number | null>(null);
  const [lastPullTime, setLastPullTime] = useState<number | null>(null);
  const [pendingPullData, setPendingPullData] = useState<{
    remoteData: SyncPayload;
    localTimestamp: number;
  } | null>(null);

  // Load persisted sync state on mount
  useEffect(() => {
    const lastPush = syncService.getLastPushTime();
    const lastPull = syncService.getLastPullTime();
    const lastMsg = syncService.getLastMessage();
    const lastErr = syncService.getLastError();

    setLastPushTime(lastPush);
    setLastPullTime(lastPull);

    if (lastErr) {
      setSyncStatus("error");
      setSyncMessage(lastErr);
    } else if (lastMsg) {
      setSyncStatus("success");
      setSyncMessage(lastMsg);
    }

    // Load stored client ID
    const storedClientId = localStorage.getItem("googleClientId");
    if (storedClientId) {
      syncService.setClientId(storedClientId);
    }
  }, []);

  // Google Client ID - User should configure this
  const configureClientId = () => {
    const storedClientId = localStorage.getItem("googleClientId");
    if (storedClientId) {
      syncService.setClientId(storedClientId);
      return true;
    }

    const clientId = prompt(
      "Enter your Google OAuth Client ID:\n\n" +
        "To get a Client ID:\n" +
        "1. Go to Google Cloud Console\n" +
        "2. Create/select a project\n" +
        "3. Enable Google Drive API\n" +
        "4. Create OAuth 2.0 Client ID (Web application)\n" +
        "5. Add your domain to authorized origins\n\n" +
        "The Client ID will be saved in localStorage.",
    );

    if (clientId) {
      localStorage.setItem("googleClientId", clientId);
      syncService.setClientId(clientId);
      return true;
    }

    return false;
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert("You must be online to sync with Google Drive.");
      return;
    }

    if (!syncService.getClientId() && !configureClientId()) {
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Syncing...");

    try {
      const result = await syncService.syncNow();

      if (result.status === "needs_confirmation") {
        // Conflict detected - show modal
        // We need to re-fetch the remote data to show in modal
        // For now, create a pending state that indicates conflict
        const pullResult = await syncService.pullFromDrive(false);
        if (pullResult.remoteData && pullResult.localTimestamp) {
          setPendingPullData({
            remoteData: pullResult.remoteData,
            localTimestamp: pullResult.localTimestamp,
          });
        }
        setSyncStatus("idle");
        setSyncMessage("");
      } else if (result.status === "success") {
        const pushTime = syncService.getLastPushTime();
        const pullTime = syncService.getLastPullTime();
        setLastPushTime(pushTime);
        setLastPullTime(pullTime);
        setSyncStatus("success");
        setSyncMessage(result.message);
      } else {
        setSyncStatus("error");
        setSyncMessage(result.message);
      }
    } catch (error) {
      setSyncStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Sync failed";
      setSyncMessage(errorMsg);
      console.error("Sync error:", error);
    }
  };

  const handleConfirmPull = async () => {
    if (!pendingPullData) return;

    setSyncStatus("syncing");
    setSyncMessage("Resolving conflict and syncing...");

    try {
      await syncService.confirmSyncOverwrite(pendingPullData.remoteData);
      const pullTime = syncService.getLastPullTime();
      const pushTime = syncService.getLastPushTime();
      setLastPullTime(pullTime);
      setLastPushTime(pushTime);
      setSyncStatus("success");
      setSyncMessage(syncService.getLastMessage() || "Sync completed");
      setPendingPullData(null);
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      setSyncStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Sync failed";
      setSyncMessage(errorMsg);
      console.error("Confirm sync error:", error);
      setPendingPullData(null);
    }
  };

  const handleCancelPull = () => {
    setPendingPullData(null);
    setSyncStatus("idle");
    setSyncMessage("Pull cancelled");
  };

  const isSyncing = syncStatus === "syncing";
  const userEmail = driveClient.getActiveUserEmail();
  const isSignedIn = driveClient.isAuthenticated();
  const statusLabel: Record<SyncStatus, string> = {
    idle: "Idle",
    syncing: "Syncing",
    success: "Success",
    error: "Error",
  };
  const statusClass: Record<SyncStatus, string> = {
    idle: "text-stone-500",
    syncing: "text-amber-700",
    success: "text-emerald-700",
    error: "text-rose-600",
  };
  const statusMessage = syncMessage || "Ready";
  const accountLabel = isSignedIn ? userEmail || "Signed in" : "Not signed in";

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-stone-200 bg-white/90 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-stone-900">
                Library Catalog
              </h1>
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" aria-label="Online" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-rose-600" aria-label="Offline" />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSyncNow}
                disabled={isSyncing || !isOnline}
                title="Sync with Google Drive (pull → resolve → push)"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                Sync now
              </button>
            </div>
          </div>
          <nav className="flex gap-4 border-t border-stone-200 py-2">
            <Link
              to="/view"
              className={`px-3 py-2 text-sm font-semibold transition ${
                location.pathname === "/view"
                  ? "border-b-2 border-stone-900 text-stone-900"
                  : "text-stone-600 hover:text-stone-800"
              }`}
            >
              Library
            </Link>
            <Link
              to="/admin"
              className={`px-3 py-2 text-sm font-semibold transition ${
                location.pathname === "/admin"
                  ? "border-b-2 border-stone-900 text-stone-900"
                  : "text-stone-600 hover:text-stone-800"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Sync status panel */}
      <section className="sync-panel border-b border-stone-200 bg-white/70">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 py-3 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">File:</span>
            <span className="font-mono text-xs">
              {syncService.getSyncFilename()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Account:</span>
            <span>{accountLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Last Push:</span>
            <span>{formatTime(lastPushTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Last Pull:</span>
            <span>{formatTime(lastPullTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Status:</span>
            <span className={statusClass[syncStatus]}>
              {statusLabel[syncStatus]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Message:</span>
            <span className={statusClass[syncStatus]}>{statusMessage}</span>
          </div>
        </div>
      </section>

      {pendingPullData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={handleCancelPull}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-amber-700">
              ⚠️ Sync Conflict Detected
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              <strong>
                Your local data is newer than the data in Google Drive.
              </strong>
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div>
                Local last updated:{" "}
                <strong>
                  {new Date(pendingPullData.localTimestamp).toLocaleString()}
                </strong>
              </div>
              <div className="mt-2">
                Drive last updated:{" "}
                <strong>
                  {new Date(
                    pendingPullData.remoteData.exportedAt,
                  ).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Pulling from Drive will{" "}
              <strong>overwrite all your local books</strong> with the older
              data from Drive. This cannot be undone.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={handleCancelPull}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
                onClick={handleConfirmPull}
              >
                Overwrite Local Data
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
