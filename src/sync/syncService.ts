import { driveClient, SYNC_FILENAME } from "./driveClient";
import {
  exportBooks,
  importBooks,
  getLatestLocalTimestamp,
  validatePayload,
  type SyncPayload,
} from "../data/exportImport";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

// LocalStorage keys for persisting sync state
const STORAGE_KEYS = {
  LAST_PUSH: "sync:lastPushAt",
  LAST_PULL: "sync:lastPullAt",
  LAST_MESSAGE: "sync:lastMessage",
  LAST_ERROR: "sync:lastError",
} as const;

/**
 * Sync Service
 * Handles push/pull operations with Google Drive
 */
class SyncService {
  private googleClientId: string | null = null;

  /**
   * Initialize the sync service with Google OAuth Client ID
   * The client ID should be obtained from Google Cloud Console
   */
  setClientId(clientId: string): void {
    this.googleClientId = clientId;
  }

  /**
   * Get the client ID (useful for checking if configured)
   */
  getClientId(): string | null {
    return this.googleClientId;
  }

  /**
   * Get the sync filename
   */
  getSyncFilename(): string {
    return SYNC_FILENAME;
  }

  /**
   * Get last push timestamp from localStorage
   */
  getLastPushTime(): number | null {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_PUSH);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Get last pull timestamp from localStorage
   */
  getLastPullTime(): number | null {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_PULL);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Get last success message from localStorage
   */
  getLastMessage(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_MESSAGE);
  }

  /**
   * Get last error message from localStorage
   */
  getLastError(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_ERROR);
  }

  /**
   * Save last push timestamp
   */
  private saveLastPushTime(timestamp: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_PUSH, timestamp.toString());
  }

  /**
   * Save last pull timestamp
   */
  private saveLastPullTime(timestamp: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_PULL, timestamp.toString());
  }

  /**
   * Save success message
   */
  private saveMessage(message: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_MESSAGE, message);
    localStorage.removeItem(STORAGE_KEYS.LAST_ERROR);
  }

  /**
   * Save error message
   */
  private saveError(error: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_ERROR, error);
    localStorage.removeItem(STORAGE_KEYS.LAST_MESSAGE);
  }

  /**
   * Normalize error messages for user-friendly display
   */
  private normalizeError(error: unknown): string {
    if (error instanceof Error) {
      const msg = error.message;

      // Check for specific known errors
      if (msg.includes("popup") || msg.includes("Sign-in popup")) {
        return "Sign-in popup was blocked or closed. Please allow popups and try again.";
      }
      if (msg.includes("No sync file found") || msg.includes("Push first")) {
        return "No sync file found in Drive yet. Push first, then Pull.";
      }
      if (msg.includes("parse") || msg.includes("corrupted")) {
        return "Drive sync file is invalid or from an incompatible version.";
      }
      if (msg.includes("Invalid sync file format")) {
        return "Drive sync file is invalid or from an incompatible version.";
      }
      if (msg.includes("Client ID not configured")) {
        return "Google Client ID not configured. Please enter your OAuth Client ID.";
      }
      if (msg.includes("Not authenticated")) {
        return "Not authenticated. Please sign in to Google.";
      }

      return msg;
    }

    return "An unknown error occurred. Please try again.";
  }

  /**
   * Ensure the drive client is initialized and authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.googleClientId) {
      throw new Error(
        "Google Client ID not configured. Please set up OAuth credentials.\n\n" +
          "Instructions:\n" +
          "1. Go to Google Cloud Console\n" +
          "2. Create OAuth 2.0 Client ID\n" +
          "3. Add your domain to authorized origins\n" +
          "4. Configure the client ID in the app",
      );
    }

    await driveClient.initialize(this.googleClientId);

    if (!driveClient.isAuthenticated()) {
      await driveClient.authorize();
    }
  }

  /**
   * Push local books to Google Drive
   * Creates or updates the sync file in Drive
   */
  async pushToDrive(): Promise<void> {
    try {
      await this.ensureAuthenticated();

      // Export all local books
      const payload = await exportBooks();

      // Convert to JSON string
      const jsonContent = JSON.stringify(payload, null, 2);

      // Upload to Drive
      await driveClient.uploadFile(jsonContent);

      // Save success state
      const now = Date.now();
      this.saveLastPushTime(now);
      this.saveMessage(`Pushed successfully at ${this.formatTimestamp(now)}`);
    } catch (error) {
      const errorMsg = this.normalizeError(error);
      this.saveError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Pull books from Google Drive
   * Downloads and validates the sync file, then prompts user if there are conflicts
   *
   * @param forceOverwrite - If true, skip conflict check and overwrite local data
   * @returns Object with needsConfirmation flag and remote data info
   */
  async pullFromDrive(forceOverwrite = false): Promise<{
    needsConfirmation: boolean;
    remoteData?: SyncPayload;
    localTimestamp?: number;
  }> {
    try {
      await this.ensureAuthenticated();

      // Download from Drive
      const jsonContent = await driveClient.downloadFile();

      // Parse and validate
      let remoteData: SyncPayload;
      try {
        remoteData = JSON.parse(jsonContent);
      } catch (error) {
        throw new Error(
          "Failed to parse sync file. The file may be corrupted.",
        );
      }

      if (!validatePayload(remoteData)) {
        throw new Error(
          "Invalid sync file format. The file may be corrupted or incompatible.",
        );
      }

      // Check for conflicts if not forcing overwrite
      if (!forceOverwrite) {
        const localTimestamp = await getLatestLocalTimestamp();

        // If local data is newer, require confirmation
        if (localTimestamp > remoteData.exportedAt) {
          return {
            needsConfirmation: true,
            remoteData,
            localTimestamp,
          };
        }
      }

      // Import the data
      await importBooks(remoteData);

      // Save success state
      const now = Date.now();
      this.saveLastPullTime(now);
      this.saveMessage(`Pulled successfully at ${this.formatTimestamp(now)}`);

      return {
        needsConfirmation: false,
        remoteData,
      };
    } catch (error) {
      const errorMsg = this.normalizeError(error);
      this.saveError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Confirm and execute pull operation
   * Used after user confirms they want to overwrite newer local data
   */
  async confirmPull(remoteData: SyncPayload): Promise<void> {
    try {
      await importBooks(remoteData);

      // Save success state
      const now = Date.now();
      this.saveLastPullTime(now);
      this.saveMessage(`Pulled successfully at ${this.formatTimestamp(now)}`);
    } catch (error) {
      const errorMsg = this.normalizeError(error);
      this.saveError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Full sync orchestration: compare timestamps → push/pull appropriately
   * Handles first-time sync, normal pull/push, and conflict detection
   *
   * Logic:
   * - If Drive file doesn't exist: push local (first sync)
   * - If localUpdatedAt > driveUpdatedAt: push local (no confirmation)
   * - If driveUpdatedAt > localUpdatedAt: pull Drive to local (no confirmation)
   * - If timestamps equal: no-op, show "Already in sync"
   * - Only show confirmation modal for true ambiguous conflicts (rare edge case)
   */
  async syncNow(): Promise<{
    status: "success" | "needs_confirmation" | "error";
    message: string;
    localTimestamp?: number;
    driveTimestamp?: number;
  }> {
    try {
      await this.ensureAuthenticated();

      // Get local timestamp
      const localTimestamp = await getLatestLocalTimestamp();

      // Step 1: Try to get Drive file info (metadata only, or download for timestamp)
      let driveTimestamp: number | null = null;
      let remoteData: SyncPayload | null = null;

      try {
        const jsonContent = await driveClient.downloadFile();
        try {
          remoteData = JSON.parse(jsonContent);
          if (!remoteData) {
            throw new Error("Sync file is empty or invalid");
          }
          driveTimestamp = remoteData.exportedAt || 0;
        } catch (error) {
          throw new Error(
            "Failed to parse sync file. The file may be corrupted.",
          );
        }

        if (!validatePayload(remoteData)) {
          throw new Error(
            "Invalid sync file format. The file may be corrupted or incompatible.",
          );
        }
      } catch (error) {
        // File not found or other error - treat as first sync
        const errorMsg = error instanceof Error ? error.message : "Pull failed";
        if (
          errorMsg.includes("No sync file found") ||
          errorMsg.includes("Push first")
        ) {
          // First-time sync: no file exists yet, proceed to push
          driveTimestamp = null;
          remoteData = null;
        } else {
          // Other error occurred
          throw error;
        }
      }

      // Step 2: Decide action based on timestamp comparison
      if (driveTimestamp === null) {
        // Drive file doesn't exist - push local (first sync)
        await this.pushToDrive();

        return {
          status: "success",
          message: "First sync completed: pushed local data to Drive",
        };
      }

      if (localTimestamp > driveTimestamp) {
        // Local is newer - push local automatically (no confirmation needed)
        await this.pushToDrive();

        return {
          status: "success",
          message: "Sync completed: local data pushed to Drive",
        };
      }

      if (driveTimestamp > localTimestamp) {
        // Drive is newer - pull automatically (no confirmation needed)
        if (remoteData) {
          await importBooks(remoteData);
          const now = Date.now();
          this.saveLastPullTime(now);
          this.saveMessage(
            `Pulled successfully at ${this.formatTimestamp(now)}`,
          );

          return {
            status: "success",
            message: "Sync completed: pulled Drive data to local",
          };
        }
        // This shouldn't happen, but fall through to error
        throw new Error("Failed to import Drive data");
      }

      // Timestamps are equal - already in sync
      return {
        status: "success",
        message: "Already in sync",
      };
    } catch (error) {
      const errorMsg = this.normalizeError(error);
      this.saveError(errorMsg);
      return {
        status: "error",
        message: errorMsg,
      };
    }
  }

  /**
   * Confirm sync overwrite and push
   * Used after user confirms they want to overwrite newer local data with remote
   */
  async confirmSyncOverwrite(remoteData: SyncPayload): Promise<void> {
    try {
      // Import remote data
      await importBooks(remoteData);

      // Save pull success
      const now = Date.now();
      this.saveLastPullTime(now);

      // Then push to ensure consistency
      await this.pushToDrive();

      // Combined success message
      this.saveMessage(`Sync completed at ${this.formatTimestamp(Date.now())}`);
    } catch (error) {
      const errorMsg = this.normalizeError(error);
      this.saveError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}

// Export singleton instance
export const syncService = new SyncService();
