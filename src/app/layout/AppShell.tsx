import type { ReactNode } from "react";
import { useState, useEffect } from "react";
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

  const handlePushToDrive = async () => {
    if (!isOnline) {
      alert("You must be online to sync with Google Drive.");
      return;
    }

    if (!syncService.getClientId() && !configureClientId()) {
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Pushing to Drive...");

    try {
      await syncService.pushToDrive();
      const pushTime = syncService.getLastPushTime();
      setLastPushTime(pushTime);
      setSyncStatus("success");
      setSyncMessage(syncService.getLastMessage() || "Pushed successfully");
    } catch (error) {
      setSyncStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Push failed";
      setSyncMessage(errorMsg);
      console.error("Push error:", error);
    }
  };

  const handlePullFromDrive = async () => {
    if (!isOnline) {
      alert("You must be online to sync with Google Drive.");
      return;
    }

    if (!syncService.getClientId() && !configureClientId()) {
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Pulling from Drive...");

    try {
      const result = await syncService.pullFromDrive();

      if (
        result.needsConfirmation &&
        result.remoteData &&
        result.localTimestamp
      ) {
        // Show conflict warning
        setPendingPullData({
          remoteData: result.remoteData,
          localTimestamp: result.localTimestamp,
        });
        setSyncStatus("idle");
        setSyncMessage("");
      } else {
        const pullTime = syncService.getLastPullTime();
        setLastPullTime(pullTime);
        setSyncStatus("success");
        setSyncMessage(syncService.getLastMessage() || "Pulled successfully");
        // Reload the page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      setSyncStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Pull failed";
      setSyncMessage(errorMsg);
      console.error("Pull error:", error);
    }
  };

  const handleConfirmPull = async () => {
    if (!pendingPullData) return;

    setSyncStatus("syncing");
    setSyncMessage("Overwriting local data...");

    try {
      await syncService.confirmPull(pendingPullData.remoteData);
      const pullTime = syncService.getLastPullTime();
      setLastPullTime(pullTime);
      setSyncStatus("success");
      setSyncMessage(syncService.getLastMessage() || "Pulled successfully");
      setPendingPullData(null);
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      setSyncStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Pull failed";
      setSyncMessage(errorMsg);
      console.error("Confirm pull error:", error);
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
    idle: "text-slate-500",
    syncing: "text-amber-700",
    success: "text-emerald-700",
    error: "text-rose-600",
  };
  const statusMessage = syncMessage || "Ready";
  const accountLabel = isSignedIn ? userEmail || "Signed in" : "Not signed in";

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-800">
              Library Catalog
            </h1>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-rose-500"
                }`}
                aria-label={isOnline ? "Online" : "Offline"}
              />
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePushToDrive}
              disabled={isSyncing || !isOnline}
              title="Push local books to Google Drive"
            >
              {isSyncing ? "⏳" : "⬆"} Push
            </button>
            <button
              className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePullFromDrive}
              disabled={isSyncing || !isOnline}
              title="Pull books from Google Drive"
            >
              {isSyncing ? "⏳" : "⬇"} Pull
            </button>
          </div>
        </div>
      </header>

      {/* Sync status panel */}
      <section className="sync-panel border-b border-slate-200 bg-white/70">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 py-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">File:</span>
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
