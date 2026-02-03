/**
 * Cover photo sync service
 * Handles uploading cover photos to Google Drive and managing folder structure
 */

import { driveClient } from "./driveClient";
import {
  getDriveFolderIds,
  saveDriveFolderIds,
  getCoverPhotoUrl,
} from "../data/db";

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

/**
 * Upload a cover photo to Google Drive
 * Requires initializeCoverSync() to have been called first
 */
export async function uploadCoverPhoto(
  bookId: string,
  fileName: string,
): Promise<void> {
  if (!driveClient.isAuthenticated()) {
    throw new Error("Not authenticated. Please sign in first.");
  }

  const folderIds = await getDriveFolderIds();
  if (!folderIds?.coversFolderId) {
    throw new Error(
      "Cover sync not initialized. Please sign in and try again.",
    );
  }

  try {
    const coverUrl = await getCoverPhotoUrl(bookId);
    if (!coverUrl) {
      throw new Error("No local cover photo found for this book");
    }

    // Fetch the blob from the object URL
    const response = await fetch(coverUrl);
    const blob = await response.blob();

    // Upload to Google Drive using the REST API
    const metadata = {
      name: `${bookId}-${fileName}`,
      mimeType: blob.type,
      parents: [folderIds.coversFolderId],
    };

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    formData.append("file", blob);

    const token = window.gapi?.client.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: formData,
      },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload cover: ${error}`);
    }
  } catch (error) {
    console.error("Error uploading cover photo:", error);
    throw error;
  }
}

/**
 * Get the covers folder ID
 * Returns null if not initialized
 */
export async function getCoversFolderId(): Promise<string | null> {
  const folderIds = await getDriveFolderIds();
  return folderIds?.coversFolderId ?? null;
}
