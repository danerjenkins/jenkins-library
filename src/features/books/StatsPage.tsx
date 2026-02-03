import { useEffect, useState } from "react";
import { syncService, type SyncStatus } from "../../sync/syncService";
import { driveClient } from "../../sync/driveClient";

export function StatsPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [coverSyncMessage, setCoverSyncMessage] = useState<string>("");
  const [lastPushTime, setLastPushTime] = useState<number | null>(null);
  const [lastPullTime, setLastPullTime] = useState<number | null>(null);

  useEffect(() => {
    // Load sync info
    const lastPush = syncService.getLastPushTime();
    const lastPull = syncService.getLastPullTime();
    const lastMsg = syncService.getLastMessage();
    const lastErr = syncService.getLastError();
    const lastCoverMsg = syncService.getLastCoverSyncMessage();

    setLastPushTime(lastPush);
    setLastPullTime(lastPull);
    setCoverSyncMessage(lastCoverMsg || "");

    if (lastErr) {
      setSyncStatus("error");
      setSyncMessage(lastErr);
    } else if (lastMsg) {
      setSyncStatus("success");
      setSyncMessage(lastMsg);
    }
  }, []);

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

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

  const userEmail = driveClient.getActiveUserEmail();
  const isSignedIn = driveClient.isAuthenticated();
  const accountLabel = isSignedIn ? userEmail || "Signed in" : "Not signed in";
  const statusMessage = syncMessage || "Ready";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
            Sync Statistics
          </h2>
          <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
            View sync status and Google Drive connection details.
          </p>
        </div>
      </section>

      {/* Sync info panel */}
      <section className="sync-panel border border-stone-200 rounded-2xl bg-linear-to-r from-white/50 to-amber-50/30 shadow-soft">
        <div className="mx-auto grid gap-3 px-4 py-4 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
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
          {coverSyncMessage && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Cover Sync:</span>
              <span className="text-stone-600">{coverSyncMessage}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
