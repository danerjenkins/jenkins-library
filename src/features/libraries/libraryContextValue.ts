import { createContext } from "react";
import type { Library, LibraryMember } from "./libraryTypes";

export type LibraryContextValue = {
  activeLibrary: Library | null;
  activeMember: LibraryMember | null;
  canAdmin: boolean;
  canEdit: boolean;
  isLoading: boolean;
  libraries: Library[];
  members: LibraryMember[];
  refreshLibraries: () => Promise<void>;
  setActiveLibraryId: (libraryId: string) => void;
};

export const LibraryContext = createContext<LibraryContextValue | null>(null);
