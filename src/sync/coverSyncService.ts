/**
 * Cover photo sync service
 * Handles uploading cover photos to Google Drive and managing folder structure
 */

import { driveClient } from "./driveClient";
import { db, getDriveFolderIds, saveDriveFolderIds } from "../data/db";

/**
 * Initialize the cover sync service by ensuring Drive folders exist
 * Call this once during app startup after user authentication
 */
export async function initializeCoverSync(): Promise<void> {
  if (!driveClient.isAuthenticated()) {
    return;
  }

  try {
    // Check if we already have folder IDs cached
    const existing = await getDriveFolderIds();
    if (existing?.rootFolderId && existing?.coversFolderId) {
      // Already initialized
      return;
    }

    // Create/find folders and save IDs
    const { rootFolderId, coversFolderId } =
      await driveClient.ensureDriveFolders();
    await saveDriveFolderIds(rootFolderId, coversFolderId);
  } catch (error) {
    console.error("Failed to initialize cover sync:", error);
    throw error;
  }
}

type CoverPushSummary = {
  attempted: number;
  uploaded: number;
  skipped: number;
  errors: Array<{ bookId: string; error: string }>;
};

type CoverPullSummary = {
  attempted: number;
  downloaded: number;
  skipped: number;
  errors: Array<{ fileName: string; error: string }>;
};

type DriveCoverFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
};

const getFileExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/gif": "gif",
  };
  if (map[mimeType]) return map[mimeType];
  const fallback = mimeType.split("/")[1];
  return fallback || "jpg";
};

const createMultipartBody = (
  metadata: Record<string, unknown>,
  blob: Blob,
  boundary: string,
): Blob => {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  return new Blob([
    delimiter,
    "Content-Type: application/json\r\n\r\n",
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${blob.type || "application/octet-stream"}\r\n\r\n`,
    blob,
    closeDelimiter,
  ]);
};

/**
 * Push all local cover photos to Google Drive
 */
export async function pushCoversToDrive(
  options: { dryRun?: boolean } = {},
): Promise<CoverPushSummary> {
  const dryRun = options.dryRun ?? false;
  console.debug("pushCoversToDrive start", { dryRun });

  if (!driveClient.isAuthenticated()) {
    throw new Error("Not authenticated. Please sign in first.");
  }

  let folderIds = await getDriveFolderIds();
  if (!folderIds?.coversFolderId || !folderIds?.rootFolderId) {
    await initializeCoverSync();
    folderIds = await getDriveFolderIds();
  }

  if (!folderIds?.coversFolderId) {
    throw new Error("Cover sync not initialized. Missing covers folder ID.");
  }

  console.debug("pushCoversToDrive coversFolderId", folderIds.coversFolderId);

  const covers = await db.bookCovers.toArray();
  console.debug("pushCoversToDrive local covers", covers.length);

  const summary: CoverPushSummary = {
    attempted: covers.length,
    uploaded: 0,
    skipped: 0,
    errors: [],
  };

  if (covers.length === 0) {
    console.debug("No local covers found");
    return summary;
  }

  const token = window.gapi?.client.getToken();
  if (!token) {
    throw new Error("No access token available");
  }

  for (const cover of covers) {
    const bookId = cover.bookId;
    const mimeType = cover.mimeType || cover.blob.type || "image/jpeg";
    const ext = getFileExtension(mimeType);
    const fileName = `cover_${bookId}.${ext}`;

    console.debug("pushCoversToDrive cover", {
      bookId,
      mimeType,
      fileName,
    });

    if (dryRun) {
      console.debug("pushCoversToDrive dryRun skip", { bookId, fileName });
      summary.skipped += 1;
      continue;
    }

    try {
      const listResponse = await window.gapi!.client.drive.files.list({
        q: `name='${fileName}' and '${folderIds.coversFolderId}' in parents and trashed=false`,
        spaces: "drive",
        fields: "files(id, name, modifiedTime)",
      });

      const existing = listResponse.result.files?.[0];
      console.debug("pushCoversToDrive existing", {
        bookId,
        found: !!existing,
        existingId: existing?.id,
      });

      const metadata: Record<string, unknown> = {
        name: fileName,
        mimeType,
      };

      if (!existing) {
        metadata.parents = [folderIds.coversFolderId];
      }

      const boundary = "-------314159265358979323846";
      const uploadBlob =
        cover.blob.type === mimeType
          ? cover.blob
          : cover.blob.slice(0, cover.blob.size, mimeType);
      const multipartRequestBody = createMultipartBody(
        metadata,
        uploadBlob,
        boundary,
      );

      const method = existing ? "PATCH" : "POST";
      const path = existing
        ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
        : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

      const uploadResponse = await fetch(path, {
        method,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await uploadResponse.json();
      console.debug("pushCoversToDrive upload result", {
        bookId,
        id: result.id,
        modifiedTime: result.modifiedTime,
      });

      summary.uploaded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.debug("pushCoversToDrive error", { bookId, message, error });
      summary.errors.push({ bookId, error: message });
    }
  }

  return summary;
}

/**
 * Pull cover photos from Google Drive into local storage
 */
export async function pullCoversFromDrive(): Promise<CoverPullSummary> {
  console.debug("pullCoversFromDrive start");

  if (!driveClient.isAuthenticated()) {
    throw new Error("Not authenticated. Please sign in first.");
  }

  let folderIds = await getDriveFolderIds();
  if (!folderIds?.coversFolderId || !folderIds?.rootFolderId) {
    await initializeCoverSync();
    folderIds = await getDriveFolderIds();
  }

  if (!folderIds?.coversFolderId) {
    throw new Error("Cover sync not initialized. Missing covers folder ID.");
  }

  const token = window.gapi?.client.getToken();
  if (!token) {
    throw new Error("No access token available");
  }

  const listResponse = await window.gapi!.client.drive.files.list({
    q: `'${folderIds.coversFolderId}' in parents and trashed=false`,
    spaces: "drive",
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  const files = (listResponse.result.files || []) as DriveCoverFile[];
  console.debug("pullCoversFromDrive files", files.length);

  const summary: CoverPullSummary = {
    attempted: files.length,
    downloaded: 0,
    skipped: 0,
    errors: [],
  };

  for (const file of files) {
    const fileName = file.name;
    console.debug("pullCoversFromDrive processing file", { fileName });

    const match = /^cover_(.+)\.[^.]+$/.exec(fileName);
    if (!match) {
      console.debug("pullCoversFromDrive filename pattern mismatch", {
        fileName,
      });
      summary.skipped += 1;
      continue;
    }

    const bookId = match[1];
    console.debug("pullCoversFromDrive extracted bookId", { bookId, fileName });

    // Check if book exists in local database
    const bookExists = await db.books.get(bookId);
    if (!bookExists) {
      console.warn(
        "pullCoversFromDrive: book not found in local DB, skipping cover",
        { bookId, fileName },
      );
      summary.skipped += 1;
      continue;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${errorText}`);
      }

      const blob = await response.blob();
      const mimeType = response.headers.get("Content-Type") || file.mimeType;

      await db.bookCovers.put({
        bookId,
        blob,
        mimeType: mimeType || "image/jpeg",
        updatedAt: Date.now(),
      });

      console.debug("pullCoversFromDrive downloaded", { bookId, fileName });
      summary.downloaded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.debug("pullCoversFromDrive error", { fileName, message, error });
      summary.errors.push({ fileName, error: message });
    }
  }

  return summary;
}

/**
 * Get the covers folder ID
 * Returns null if not initialized
 */
export async function getCoversFolderId(): Promise<string | null> {
  const folderIds = await getDriveFolderIds();
  return folderIds?.coversFolderId ?? null;
}
