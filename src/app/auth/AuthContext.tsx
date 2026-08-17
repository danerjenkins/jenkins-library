import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext, type AuthContextValue } from "./authContextValue";
import {
  getCanEditLibrary,
  getSession,
  signIn,
  signOut,
  subscribeToSessionChanges,
  type AppSession,
} from "../../services/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const manualSignOutRef = useRef(false);
  const sessionRef = useRef<AppSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshEditorStatus = useCallback(async (nextSession: AppSession | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setCanEdit(false);
      return false;
    }

    const nextCanEdit = await getCanEditLibrary();
    setCanEdit(nextCanEdit);
    return nextCanEdit;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await getSession();
        if (isMounted) {
          await refreshEditorStatus(nextSession);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load the current session.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [refreshEditorStatus]);

  useEffect(() => {
    return subscribeToSessionChanges((nextSession) => {
      const hadSession = Boolean(sessionRef.current);

      if (!nextSession && hadSession && !manualSignOutRef.current) {
        setErrorMessage("Your session expired. Sign in again.");
      }

      if (nextSession) {
        setErrorMessage(null);
      }

      void refreshEditorStatus(nextSession).finally(() => {
        manualSignOutRef.current = false;
      });
    });
  }, [refreshEditorStatus]);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      try {
        const nextSession = await signIn(email, password);
        await refreshEditorStatus(nextSession);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
        return false;
      }
    },
    [refreshEditorStatus],
  );

  const handleSignOut = useCallback(async () => {
    manualSignOutRef.current = true;
    setErrorMessage(null);

    try {
      await signOut();
    } finally {
      setSession(null);
      setCanEdit(false);
      manualSignOutRef.current = false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      canEdit,
      errorMessage,
      isLoading,
      session,
      clearError: () => setErrorMessage(null),
      signIn: handleSignIn,
      signOut: handleSignOut,
    }),
    [canEdit, errorMessage, handleSignIn, handleSignOut, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
