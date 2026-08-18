import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

type LibraryRole = "admin" | "editor" | "member";

type AdminUserRequest = {
  action: "invite-member" | "update-member";
  libraryId: string;
  memberId?: string;
  email: string;
  displayName: string;
  role: LibraryRole;
  canViewMemberActivity: boolean;
  canViewRatingsReviews: boolean;
};

type ExistingMemberRow = {
  id: string;
  user_id: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; error_description?: unknown; error?: unknown };
    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
    if (
      typeof maybeError.error_description === "string" &&
      maybeError.error_description.trim()
    ) {
      return maybeError.error_description;
    }
    if (typeof maybeError.error === "string" && maybeError.error.trim()) {
      return maybeError.error;
    }
  }
  if (typeof error === "string" && error.trim()) return error;
  return "Admin request failed.";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function normalizeRequest(input: Partial<AdminUserRequest>): AdminUserRequest {
  const email = input.email?.trim().toLowerCase();
  const displayName = input.displayName?.trim();
  const role = input.role ?? "member";

  if (input.action !== "invite-member" && input.action !== "update-member") {
    throw new Error("Unsupported admin user action.");
  }
  if (!input.libraryId) {
    throw new Error("libraryId is required.");
  }
  if (!email) {
    throw new Error("Email is required.");
  }
  if (!displayName) {
    throw new Error("Display name is required.");
  }
  if (!["admin", "editor", "member"].includes(role)) {
    throw new Error("Invalid role.");
  }

  return {
    action: input.action,
    libraryId: input.libraryId,
    memberId: input.memberId,
    email,
    displayName,
    role,
    canViewMemberActivity: input.canViewMemberActivity ?? true,
    canViewRatingsReviews: input.canViewRatingsReviews ?? true,
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }).schema("library");
    const adminClient = createClient(supabaseUrl, serviceRoleKey).schema("library");
    const serviceAuthClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerData, error: callerError } =
      await serviceAuthClient.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (callerError || !callerData.user) {
      return jsonResponse({ error: "Invalid session." }, 401);
    }

    const payload = normalizeRequest(await request.json());
    const { data: canAdmin, error: adminCheckError } = await callerClient.rpc(
      "current_user_can_admin_library",
      { p_library_id: payload.libraryId },
    );

    if (adminCheckError) {
      throw adminCheckError;
    }
    if (canAdmin !== true) {
      return jsonResponse({ error: "You are not an admin for this library." }, 403);
    }

    let memberLookup = adminClient
      .from("library_members")
      .select("id, user_id")
      .eq("library_id", payload.libraryId);

    if (payload.action === "update-member" && payload.memberId) {
      memberLookup = memberLookup.eq("id", payload.memberId);
    } else {
      memberLookup = memberLookup.ilike("email", payload.email);
    }

    const { data: existingMembers, error: memberLookupError } = await memberLookup.limit(1);
    if (memberLookupError) {
      throw memberLookupError;
    }

    const existingMember = ((existingMembers ?? []) as ExistingMemberRow[])[0] ?? null;
    if (payload.action === "update-member" && !existingMember) {
      return jsonResponse({ error: "Member not found." }, 404);
    }

    let linkedUserId: string | null = existingMember?.user_id ?? null;

    if (payload.action === "invite-member" && !existingMember) {
      const { data: listedUsers, error: listError } =
        await serviceAuthClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) {
        throw listError;
      }

      const existingUser = listedUsers.users.find(
        (user) => user.email?.toLowerCase() === payload.email,
      );

      if (existingUser) {
        linkedUserId = existingUser.id;
      } else {
        const { data: inviteData, error: inviteError } =
          await serviceAuthClient.auth.admin.inviteUserByEmail(payload.email, {
            data: { display_name: payload.displayName },
          });
        if (inviteError) {
          throw inviteError;
        }
        linkedUserId = inviteData.user?.id ?? null;
      }
    }

    if (payload.action === "invite-member" && linkedUserId) {
      const { error: profileError } = await adminClient.from("profiles").upsert(
        {
          user_id: linkedUserId,
          email: payload.email,
          display_name: payload.displayName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (profileError) {
        throw profileError;
      }
    }

    const memberRow = {
      library_id: payload.libraryId,
      user_id: linkedUserId,
      email: payload.email,
      display_name: payload.displayName,
      role: payload.role,
      can_view_member_activity: payload.canViewMemberActivity,
      can_view_ratings_reviews: payload.canViewRatingsReviews,
      updated_at: new Date().toISOString(),
    };

    if (existingMember) {
      const { error: updateError } = await adminClient
        .from("library_members")
        .update(memberRow)
        .eq("id", existingMember.id);
      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await adminClient
        .from("library_members")
        .insert(memberRow);
      if (insertError) {
        throw insertError;
      }
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 400);
  }
});
