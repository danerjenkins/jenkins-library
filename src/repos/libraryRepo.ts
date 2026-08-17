import { supabase } from "../lib/supabaseClient";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import type {
  AdminUserRequest,
  Library,
  LibraryMember,
  LibraryRole,
} from "../features/libraries/libraryTypes";

const supabaseClient = getSupabaseClientWithSchema();

type LibraryRow = {
  id: string;
  name: string;
  slug: string;
  public_access_enabled: boolean;
};

type LibraryMemberRow = {
  id: string;
  library_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string;
  role: LibraryRole;
  can_view_member_activity: boolean;
};

function mapLibrary(row: LibraryRow): Library {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    publicAccessEnabled: row.public_access_enabled,
  };
}

function mapLibraryMember(row: LibraryMemberRow): LibraryMember {
  return {
    id: row.id,
    libraryId: row.library_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    canViewMemberActivity: row.can_view_member_activity,
  };
}

async function resolveFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Admin request failed.";
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : null;

  if (!(context instanceof Response)) {
    return fallback;
  }

  try {
    const body = await context.clone().json();
    if (body && typeof body === "object" && "error" in body) {
      const message = (body as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  } catch {
    try {
      const message = await context.clone().text();
      if (message.trim()) {
        return message;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export async function listLibraries(): Promise<Library[]> {
  const { data, error } = await supabaseClient
    .from("libraries")
    .select("id, name, slug, public_access_enabled")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LibraryRow[]).map(mapLibrary);
}

export async function listLibraryMembers(libraryId: string): Promise<LibraryMember[]> {
  const { data, error } = await supabaseClient
    .from("library_members")
    .select("id, library_id, user_id, email, display_name, role, can_view_member_activity")
    .eq("library_id", libraryId)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LibraryMemberRow[]).map(mapLibraryMember);
}

export async function updateLibrary(
  libraryId: string,
  patch: Pick<Library, "name" | "slug" | "publicAccessEnabled">,
): Promise<Library> {
  const { data, error } = await supabaseClient
    .from("libraries")
    .update({
      name: patch.name.trim(),
      slug: patch.slug.trim(),
      public_access_enabled: patch.publicAccessEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", libraryId)
    .select("id, name, slug, public_access_enabled")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLibrary(data as LibraryRow);
}

export async function invokeAdminUserRequest(request: AdminUserRequest): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-users", {
    body: request,
  });

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error));
  }
}
