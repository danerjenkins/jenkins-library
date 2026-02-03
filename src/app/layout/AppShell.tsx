import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../ui/hooks/useOnlineStatus";
import { syncService, type SyncStatus } from "../../sync/syncService";
import { driveClient } from "../../sync/driveClient";
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

      if (result.status === "success") {
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
      <header className="border-b border-stone-200/40 bg-linear-to-b from-white/95 to-white/90 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                Library Catalog
              </h1>
              <div className="flex items-center gap-2 rounded-full border border-stone-200/60 bg-stone-50/60 px-3 py-1.5 text-xs font-medium text-stone-600 backdrop-blur-sm">
                {isOnline ? (
                  <Wifi
                    className="h-3.5 w-3.5 text-emerald-600"
                    aria-label="Online"
                  />
                ) : (
                  <WifiOff
                    className="h-3.5 w-3.5 text-rose-600"
                    aria-label="Offline"
                  />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSyncNow}
                disabled={isSyncing || !isOnline}
                title="Sync with Google Drive"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                />
                Sync now
              </button>
            </div>
          </div>
          <nav className="flex gap-4 border-t border-stone-200/40 py-3">
            <Link
              to="/view"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/view"
                  ? "bg-stone-100/60 text-stone-900"
                  : "text-stone-600 hover:text-stone-800 hover:bg-stone-50/40"
              }`}
            >
              Library
            </Link>
            <Link
              to="/admin"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/admin"
                  ? "bg-stone-100/60 text-stone-900"
                  : "text-stone-600 hover:text-stone-800 hover:bg-stone-50/40"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Sync status panel */}
      <section className="sync-panel border-b border-stone-200/30 bg-linear-to-r from-white/50 to-amber-50/30 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 py-4 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
