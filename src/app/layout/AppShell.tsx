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
  const statusMessage = syncMessage || "Ready";
  const accountLabel = isSignedIn ? userEmail || "Signed in" : "Not signed in";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Library Catalog</h1>
          <div className="status-indicator">
            <span
              className={`status-dot ${isOnline ? "online" : "offline"}`}
              aria-label={isOnline ? "Online" : "Offline"}
            />
            <span className="status-text">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="sync-controls">
          <button
            className="sync-button push-button"
            onClick={handlePushToDrive}
            disabled={isSyncing || !isOnline}
            title="Push local books to Google Drive"
          >
            {isSyncing ? "⏳" : "⬆"} Push
          </button>
          <button
            className="sync-button pull-button"
            onClick={handlePullFromDrive}
            disabled={isSyncing || !isOnline}
            title="Pull books from Google Drive"
          >
            {isSyncing ? "⏳" : "⬇"} Pull
          </button>
        </div>
      </header>

      {/* Sync status panel */}
      <div className="sync-info-panel">
        <div className="sync-info-row">
          <span className="sync-info-label">File:</span>
          <span className="sync-info-value">
            {syncService.getSyncFilename()}
          </span>
        </div>
        <div className="sync-info-row">
          <span className="sync-info-label">Account:</span>
          <span className="sync-info-value">{accountLabel}</span>
        </div>
        <div className="sync-info-row">
          <span className="sync-info-label">Last Push:</span>
          <span className="sync-info-value">{formatTime(lastPushTime)}</span>
        </div>
        <div className="sync-info-row">
          <span className="sync-info-label">Last Pull:</span>
          <span className="sync-info-value">{formatTime(lastPullTime)}</span>
        </div>
        <div className="sync-info-row">
          <span className="sync-info-label">Status:</span>
          <span className={`sync-info-value sync-message-${syncStatus}`}>
            {statusLabel[syncStatus]}
          </span>
        </div>
        <div className="sync-info-row">
          <span className="sync-info-label">Message:</span>
          <span className={`sync-info-value sync-message-${syncStatus}`}>
            {statusMessage}
          </span>
        </div>
      </div>

      {pendingPullData && (
        <div className="sync-conflict-modal">
          <div className="conflict-overlay" onClick={handleCancelPull} />
          <div className="conflict-dialog">
            <h3>⚠️ Sync Conflict Detected</h3>
            <p>
              <strong>
                Your local data is newer than the data in Google Drive.
              </strong>
            </p>
            <div className="conflict-details">
              <div>
                Local last updated:{" "}
                <strong>
                  {new Date(pendingPullData.localTimestamp).toLocaleString()}
                </strong>
              </div>
              <div>
                Drive last updated:{" "}
                <strong>
                  {new Date(
                    pendingPullData.remoteData.exportedAt,
                  ).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="conflict-warning">
              Pulling from Drive will{" "}
              <strong>overwrite all your local books</strong> with the older
              data from Drive. This cannot be undone.
            </p>
            <div className="conflict-actions">
              <button className="conflict-cancel" onClick={handleCancelPull}>
                Cancel
              </button>
              <button className="conflict-confirm" onClick={handleConfirmPull}>
                Overwrite Local Data
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">{children}</main>
    </div>
  );
}
