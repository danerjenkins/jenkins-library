import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
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

  // Load persisted sync state on mount
  useEffect(() => {
    const lastMsg = syncService.getLastMessage();
    const lastErr = syncService.getLastError();

    if (lastErr) {
      setSyncStatus("error");
    } else if (lastMsg) {
      setSyncStatus("success");
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
        // Reload the page to show updated data
        window.location.reload();
      } else {
        setSyncStatus("error");
      }
    } catch (error) {
      setSyncStatus("error");
      console.error("Sync error:", error);
    }
  };

  const isSyncing = syncStatus === "syncing";

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-stone-200/40 bg-linear-to-b from-white/95 to-white/90 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <img
                src="/houselogo.png"
                alt="Jenkins Library"
                className="h-24"
              />
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                Jenkins Library
              </h1>
            </div>
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
            <Link
              to="/stats"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/stats"
                  ? "bg-stone-100/60 text-stone-900"
                  : "text-stone-600 hover:text-stone-800 hover:bg-stone-50/40"
              }`}
            >
              Stats
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
