import { readStorageValue, writeStorageValue } from "./shelfViewPreferences";

export type ReaderId = string;

export interface ReadingListPreferences {
  activeReader: ReaderId;
}

const STORAGE_KEY = "jenkins-library:reading-list-ui";
const defaultPreferences: ReadingListPreferences = {
  activeReader: "",
};

export function getReadingListPreferences(): ReadingListPreferences {
  const stored = readStorageValue<Partial<ReadingListPreferences>>(STORAGE_KEY);
  if (!stored) {
    return defaultPreferences;
  }

  return {
    activeReader:
      typeof stored.activeReader === "string"
        ? stored.activeReader
        : defaultPreferences.activeReader,
  };
}

export function setReadingListPreferences(preferences: ReadingListPreferences): void {
  writeStorageValue(STORAGE_KEY, preferences);
}
