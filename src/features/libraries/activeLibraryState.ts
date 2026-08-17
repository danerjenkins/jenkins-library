let activeLibraryId: string | null = null;

export function setActiveLibraryIdForRepos(libraryId: string | null): void {
  activeLibraryId = libraryId;
}

export function getActiveLibraryIdForRepos(): string | null {
  return activeLibraryId;
}
