import { useContext } from "react";
import { LibraryContext } from "./libraryContextValue";

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error("useLibrary must be used within LibraryProvider.");
  }
  return value;
}
