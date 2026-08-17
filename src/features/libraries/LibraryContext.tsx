import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import { listLibraries, listLibraryMembers } from "../../repos/libraryRepo";
import { setActiveLibraryIdForRepos } from "./activeLibraryState";
import type { Library, LibraryMember } from "./libraryTypes";
import { LibraryContext, type LibraryContextValue } from "./libraryContextValue";

const STORAGE_KEY = "jenkins-library:active-library";

function readStoredLibraryId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLibraryId(libraryId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, libraryId);
  } catch {
    // Storage is only a convenience; URL/default selection still works.
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [activeLibraryId, setActiveLibraryIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLibraries = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextLibraries = await listLibraries();
      const searchParams = new URLSearchParams(location.search);
      const requestedSlug = searchParams.get("library");
      const requested = requestedSlug
        ? nextLibraries.find((library) => library.slug === requestedSlug)
        : null;
      const storedId = readStoredLibraryId();
      const stored = storedId
        ? nextLibraries.find((library) => library.id === storedId)
        : null;
      const fallback =
        requested ??
        stored ??
        nextLibraries.find((library) => library.slug === "jenkins") ??
        nextLibraries[0] ??
        null;

      setLibraries(nextLibraries);
      setActiveLibraryIdState((current) => {
        const stillAvailable = nextLibraries.some((library) => library.id === current);
        return stillAvailable ? current : fallback?.id ?? null;
      });
      setActiveLibraryIdForRepos(fallback?.id ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    void loadLibraries();
  }, [loadLibraries, session?.user.id]);

  const activeLibrary = useMemo(
    () => libraries.find((library) => library.id === activeLibraryId) ?? null,
    [activeLibraryId, libraries],
  );

  useEffect(() => {
    setActiveLibraryIdForRepos(activeLibrary?.id ?? null);
    if (activeLibrary) {
      writeStoredLibraryId(activeLibrary.id);
    }
  }, [activeLibrary]);

  useEffect(() => {
    let ignore = false;
    if (!activeLibrary) {
      setMembers([]);
      return;
    }
    const libraryId = activeLibrary.id;

    async function loadMembers() {
      try {
        const nextMembers = await listLibraryMembers(libraryId);
        if (!ignore) {
          setMembers(nextMembers);
        }
      } catch {
        if (!ignore) {
          setMembers([]);
        }
      }
    }

    void loadMembers();
    return () => {
      ignore = true;
    };
  }, [activeLibrary, session?.user.id]);

  const activeMember = useMemo(() => {
    if (!session) return null;
    return members.find((member) => member.userId === session.user.id) ?? null;
  }, [members, session]);

  const setActiveLibraryId = useCallback(
    (libraryId: string) => {
      const nextLibrary = libraries.find((library) => library.id === libraryId);
      if (!nextLibrary) return;

      setActiveLibraryIdState(nextLibrary.id);
      setActiveLibraryIdForRepos(nextLibrary.id);
      writeStoredLibraryId(nextLibrary.id);

      const searchParams = new URLSearchParams(location.search);
      if (nextLibrary.slug === "jenkins") {
        searchParams.delete("library");
      } else {
        searchParams.set("library", nextLibrary.slug);
      }
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    },
    [libraries, location.pathname, location.search, navigate],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      activeLibrary,
      activeMember,
      canAdmin: activeMember?.role === "admin",
      canEdit: activeMember?.role === "admin" || activeMember?.role === "editor",
      isLoading,
      libraries,
      members,
      refreshLibraries: loadLibraries,
      setActiveLibraryId,
    }),
    [
      activeLibrary,
      activeMember,
      isLoading,
      libraries,
      loadLibraries,
      members,
      setActiveLibraryId,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
