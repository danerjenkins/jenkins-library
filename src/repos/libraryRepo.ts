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
    throw new Error(error.message);
  }
}
