export type LibraryRole = "admin" | "editor" | "member";

export interface Library {
  id: string;
  name: string;
  slug: string;
  publicAccessEnabled: boolean;
}

export interface LibraryMember {
  id: string;
  libraryId: string;
  userId: string | null;
  email: string | null;
  displayName: string;
  role: LibraryRole;
  canViewMemberActivity: boolean;
  canViewRatingsReviews: boolean;
}

export interface AdminUserRequest {
  action: "invite-member" | "update-member";
  libraryId: string;
  memberId?: string;
  email: string;
  displayName: string;
  role: LibraryRole;
  canViewMemberActivity: boolean;
  canViewRatingsReviews: boolean;
}
