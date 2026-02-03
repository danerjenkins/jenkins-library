/**
 * Google Drive API Client
 * Handles authentication and file operations using Google Identity Services
 */

import { getDriveFolderIds } from "../data/db";

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const SYNC_FILENAME = "library-catalog-sync.json";

export { SYNC_FILENAME };

interface TokenClient {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token: string;
  error?: string;
  expires_in: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { discoveryDocs: string[] }) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        getToken: () => { access_token: string } | null;
        drive: {
          files: {
            list: (
              params: unknown,
            ) => Promise<{ result: { files: DriveFile[] } }>;
            create: (params: unknown) => Promise<{ result: DriveFile }>;
            update: (params: unknown) => Promise<{ result: DriveFile }>;
            get: (params: {
              fileId: string;
              alt: string;
            }) => Promise<{ body: string }>;
          };
        };
      };
    };
  }
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

class DriveClient {
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  private gapiInitialized = false;
  private gisInitialized = false;

  /**
   * Initialize the Google API client and Identity Services
   * Must be called before any Drive operations
   */
  async initialize(clientId: string): Promise<void> {
    if (!clientId) {
      throw new Error(
        "Google Client ID is required. Please set up OAuth credentials.",
      );
    }

    // Load the Google API client
    await this.loadGapi();

    // Initialize GAPI client
    if (!this.gapiInitialized) {
      await window.gapi!.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      this.gapiInitialized = true;
    }

    // Load and initialize Google Identity Services
    await this.loadGIS();

    if (!this.gisInitialized) {
      this.tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: TokenResponse) => {
          if (response.error) {
            throw new Error(`Auth error: ${response.error}`);
          }
          this.accessToken = response.access_token;
          window.gapi!.client.setToken({ access_token: response.access_token });
        },
      });
      this.gisInitialized = true;
    }
  }

  /**
   * Load the Google API (GAPI) library
   */
  private loadGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi!.load("client", () => resolve());
      };
      script.onerror = () => reject(new Error("Failed to load Google API"));
      document.head.appendChild(script);
    });
  }

  /**
   * Load the Google Identity Services (GIS) library
   */
  private loadGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Google Identity Services"));
      document.head.appendChild(script);
    });
  }

  /**
   * Request user authorization
   * Shows the Google sign-in popup
   */
  async authorize(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error("Drive client not initialized");
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error("Token client not initialized"));
        return;
      }

      const originalCallback = this.tokenClient.callback;
      this.tokenClient.callback = (response: TokenResponse) => {
        originalCallback(response);
        if (response.error) {
          // Normalize common auth errors
          let errorMsg = response.error;
          if (
            errorMsg === "popup_closed_by_user" ||
            errorMsg === "popup_blocked_by_browser"
          ) {
            errorMsg =
              "Sign-in popup was blocked or closed. Please allow popups and try again.";
          }
          reject(new Error(errorMsg));
        } else {
          resolve();
        }
      };

      // Check if already has a valid token
      const token = window.gapi?.client.getToken();
      if (token && token.access_token) {
        this.accessToken = token.access_token;
        resolve();
      } else {
        this.tokenClient.requestAccessToken({ prompt: "consent" });
      }
    });
  }

  /**
   * Find the sync file in Drive (searches in the Jenkins Library root folder)
   */
  private async findSyncFile(): Promise<string | null> {
    try {
      // Get the root folder ID from settings
      const folderIds = await getDriveFolderIds();
      const rootFolderId = folderIds?.rootFolderId;

      // Build the query - search by name and optionally in the root folder
      let query = `name='${SYNC_FILENAME}' and trashed=false`;
      if (rootFolderId) {
        query += ` and '${rootFolderId}' in parents`;
      }

      const response = await window.gapi!.client.drive.files.list({
        q: query,
        spaces: "drive",
        fields: "files(id, name)",
      });

      const files = response.result.files;
      return files && files.length > 0 ? files[0].id : null;
    } catch (error) {
      console.error("Error finding sync file:", error);
      throw error;
    }
  }

  /**
   * Upload JSON content to Drive
   * Creates a new file or updates existing one in the Jenkins Library root folder
   */
  async uploadFile(content: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please sign in first.");
    }

    const existingFileId = await this.findSyncFile();

    // Get the root folder ID for new file uploads
    const folderIds = await getDriveFolderIds();
    const rootFolderId = folderIds?.rootFolderId;

    const metadata: any = {
      name: SYNC_FILENAME,
      mimeType: "application/json",
    };

    // Add parent folder if we have the ID (for new files)
    if (!existingFileId && rootFolderId) {
      metadata.parents = [rootFolderId];
    }

    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      content +
      closeDelimiter;

    const method = existingFileId ? "PATCH" : "POST";
    const path = existingFileId
      ? `/upload/drive/v3/files/${existingFileId}`
      : "/upload/drive/v3/files";

    const response = await fetch(
      `https://www.googleapis.com${path}?uploadType=multipart`,
      {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Download JSON content from Drive
   */
  async downloadFile(): Promise<string> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please sign in first.");
    }

    const fileId = await this.findSyncFile();
    if (!fileId) {
      throw new Error(
        "No sync file found in Drive yet. Push first, then Pull.",
      );
    }

    const response = await window.gapi!.client.drive.files.get({
      fileId,
      alt: "media",
    });

    return response.body;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Best-effort user email access (if available)
   * Returns null when not available with current auth method.
   */
  getActiveUserEmail(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return null;
  }

  /**
   * Find or create the root "Jenkins Library" folder
   */
  async findOrCreateRootFolder(): Promise<string> {
    // Try to find existing root folder
    const rootFolders = await window.gapi!.client.drive.files.list({
      q: `name='Jenkins Library' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: "drive",
      fields: "files(id, name)",
    });

    if (rootFolders.result.files && rootFolders.result.files.length > 0) {
      return rootFolders.result.files[0].id;
    }

    // Create new root folder if not found
    const newFolder = await window.gapi!.client.drive.files.create({
      resource: {
        name: "Jenkins Library",
        mimeType: "application/vnd.google-apps.folder",
      },
    });

    if (!newFolder.result.id) {
      throw new Error("Failed to create root folder");
    }

    return newFolder.result.id;
  }

  /**
   * Find or create the "covers" subfolder inside root folder
   */
  async findOrCreateCoversFolder(rootFolderId: string): Promise<string> {
    // Try to find existing covers folder
    const coversFolders = await window.gapi!.client.drive.files.list({
      q: `name='covers' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${rootFolderId}' in parents`,
      spaces: "drive",
      fields: "files(id, name)",
    });

    if (coversFolders.result.files && coversFolders.result.files.length > 0) {
      return coversFolders.result.files[0].id;
    }

    // Create new covers folder if not found
    const newFolder = await window.gapi!.client.drive.files.create({
      resource: {
        name: "covers",
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      },
    });

    if (!newFolder.result.id) {
      throw new Error("Failed to create covers folder");
    }

    return newFolder.result.id;
  }

  /**
   * Ensure Drive folder structure exists and return the folder IDs
   */
  async ensureDriveFolders(): Promise<{
    rootFolderId: string;
    coversFolderId: string;
  }> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please sign in first.");
    }

    const rootFolderId = await this.findOrCreateRootFolder();
    const coversFolderId = await this.findOrCreateCoversFolder(rootFolderId);

    return { rootFolderId, coversFolderId };
  }
}

// Export singleton instance
export const driveClient = new DriveClient();
