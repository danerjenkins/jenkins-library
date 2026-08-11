import type { Session } from "@supabase/supabase-js";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import { supabase } from "../lib/supabaseClient";

export interface AppSession {
  user: {
    id: string;
    email: string;
  };
}

export type SessionChangeCallback = (session: AppSession | null) => void;

function mapSupabaseSession(session: Session): AppSession {
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "authenticated-user",
    },
  };
}

async function getValidatedSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const currentSession = data.session;
  if (!currentSession?.access_token) {
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) return null;
    return refreshedData.session ?? null;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(currentSession.access_token);
  if (!userError && userData.user) {
    return currentSession;
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshedData.session?.access_token) {
    return null;
  }

  const { data: refreshedUserData, error: refreshedUserError } = await supabase.auth.getUser(
    refreshedData.session.access_token,
  );
  if (refreshedUserError || !refreshedUserData.user) {
    return null;
  }

  return refreshedData.session;
}

export async function getSession(): Promise<AppSession | null> {
  const session = await getValidatedSupabaseSession();
  return session ? mapSupabaseSession(session) : null;
}

export async function signIn(email: string, password: string): Promise<AppSession> {
  if (!email.trim()) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Supabase did not return a session.");
  }

  return mapSupabaseSession(data.session);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCanEditLibrary(): Promise<boolean> {
  const session = await getValidatedSupabaseSession();
  if (!session) return false;

  const { data, error } = await getSupabaseClientWithSchema().rpc("current_user_can_edit_library");
  if (error) {
    if (/function .*current_user_can_edit_library/i.test(error.message)) {
      return false;
    }
    throw new Error(error.message);
  }

  return data === true;
}

export function subscribeToSessionChanges(callback: SessionChangeCallback): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? mapSupabaseSession(session) : null);
  });

  return () => {
    subscription.unsubscribe();
  };
}
