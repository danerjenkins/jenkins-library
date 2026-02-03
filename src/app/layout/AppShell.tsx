import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../ui/hooks/useOnlineStatus";
import { syncService, type SyncStatus } from "../../sync/syncService";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isOnline = useOnlineStatus();
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [coverSyncMessage, setCoverSyncMessage] = useState<string>("");

  // Load persisted sync state on mount
  useEffect(() => {
    const lastMsg = syncService.getLastMessage();
    const lastErr = syncService.getLastError();
    const lastCoverMsg = syncService.getLastCoverSyncMessage();

    if (lastErr) {
      setSyncStatus("error");
    } else if (lastMsg) {
      setSyncStatus("success");
    }

    if (lastCoverMsg) {
      setCoverSyncMessage(lastCoverMsg);
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

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert("You must be online to sync with Google Drive.");
      return;
    }

    if (!syncService.getClientId() && !configureClientId()) {
      return;
    }

    setSyncStatus("syncing");
    try {
      const result = await syncService.syncNow();

      if (result.status === "success") {
        setSyncStatus("success");
        setCoverSyncMessage(syncService.getLastCoverSyncMessage() || "");
        // Reload the page to show updated data
        window.location.reload();
      } else {
        setSyncStatus("error");
        setCoverSyncMessage(syncService.getLastCoverSyncMessage() || "");
      }
    } catch (error) {
      setSyncStatus("error");
      console.error("Sync error:", error);
    }
  };

  // DEBUG: remove after cover sync validated
  const handleCoverSyncDebug = async () => {
    if (!isOnline) {
      alert("You must be online to sync with Google Drive.");
      return;
    }

    if (!syncService.getClientId() && !configureClientId()) {
      return;
    }

    setSyncStatus("syncing");
    try {
      await syncService.debugCoverSync();
      setSyncStatus("success");
      setCoverSyncMessage(syncService.getLastCoverSyncMessage() || "");
    } catch (error) {
      setSyncStatus("error");
      console.error("Cover sync debug error:", error);
    }
  };

  const isSyncing = syncStatus === "syncing";

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
              {/* DEBUG: remove after cover sync validated */}
              <button
                className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCoverSyncDebug}
                disabled={isSyncing || !isOnline}
                title="Cover Sync Debug (dry run)"
              >
                Cover Sync Debug
              </button>
            </div>
            {coverSyncMessage && (
              <div className="mt-2 text-xs text-stone-600">
                {coverSyncMessage}
              </div>
            )}
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
