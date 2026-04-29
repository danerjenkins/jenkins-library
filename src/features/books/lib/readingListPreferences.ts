import { readStorageValue, writeStorageValue } from "./shelfViewPreferences";

export type ReaderId = "dane" | "emma";

export interface ReadingListPreferences {
  activeReader: ReaderId;
}

const STORAGE_KEY = "jenkins-library:reading-list-ui";
const defaultPreferences: ReadingListPreferences = {
  activeReader: "dane",
};

const readerIds = new Set<ReaderId>(["dane", "emma"]);

export function getReadingListPreferences(): ReadingListPreferences {
  const stored = readStorageValue<Partial<ReadingListPreferences>>(STORAGE_KEY);
  if (!stored) {
    return defaultPreferences;
  }

  return {
    activeReader: readerIds.has(stored.activeReader as ReaderId)
      ? (stored.activeReader as ReaderId)
      : defaultPreferences.activeReader,
  };
}

export function setReadingListPreferences(preferences: ReadingListPreferences): void {
  writeStorageValue(STORAGE_KEY, preferences);
}

