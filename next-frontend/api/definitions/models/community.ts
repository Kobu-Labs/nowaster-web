import { z } from "zod";
import { HasID } from "@/validation/utils";
import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { UserSchema } from "@/api/definitions/models/user";

export const CommunityVisibilityTypeSchema = z.enum(["public", "invite_only"]);
export const CommunityDataVisibilitySchema = z.enum(["public", "members_only"]);

export const CommunitySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(2000).nullable(),
  avatar_url: z.string().nullable(),
  visibility_type: CommunityVisibilityTypeSchema,
  data_visibility: CommunityDataVisibilitySchema,
  owner_id: z.string(),
  is_owner: z.boolean(),
  is_member: z.boolean(),
  archived_at: z.coerce.date<Date>().nullable(),
  created_at: z.coerce.date<Date>(),
});

export const CommunityWithIdSchema = CommunitySchema.merge(HasID);

export const CommunityMemberRoleSchema = z.enum(["owner", "manager", "member"]);

export const CommunityMemberSchema = z.object({
  id: z.uuid(),
  user: UserSchema,
  role: CommunityMemberRoleSchema,
  joined_at: z.coerce.date<Date>(),
});

export const CommunityMembersPageSchema = z.object({
  members: z.array(CommunityMemberSchema),
  total: z.number(),
});

export const CommunityCapabilitiesSchema = z.object({
  can_manage_members: z.boolean(),
  can_manage_categories: z.boolean(),
  can_change_roles: z.boolean(),
  can_delete_community: z.boolean(),
});

export const CommunityInviteTypeSchema = z.enum(["direct", "link"]);
export const CommunityInviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

export const CommunityInviteSchema = z.object({
  id: z.uuid(),
  community_id: z.uuid(),
  community_name: z.string(),
  invite_type: CommunityInviteTypeSchema,
  status: CommunityInviteStatusSchema,
  invited_user: UserSchema.nullable(),
  code: z.string().nullable(),
  created_by: UserSchema,
  expires_at: z.coerce.date<Date>().nullable(),
  max_uses: z.number().nullable(),
  use_count: z.number(),
  created_at: z.coerce.date<Date>(),
});

export const CommunityInvitePreviewSchema = z.object({
  community_id: z.uuid(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  member_count: z.number(),
  visibility_type: CommunityVisibilityTypeSchema,
});

export const TrackedCategorySchema = z.object({
  id: z.uuid(),
  community_id: z.uuid(),
  name: z.string(),
  color: z.string(),
  mapped_member_count: z.number(),
});

export const CategoryMappingSchema = z.object({
  id: z.uuid(),
  tracked_category: TrackedCategorySchema,
  personal_category: CategoryWithIdSchema,
  created_at: z.coerce.date<Date>(),
});

export const CategoryBreakdownSchema = z.object({
  tracked_category_id: z.uuid(),
  name: z.string(),
  color: z.string(),
  total_minutes: z.number(),
  session_count: z.number(),
  percentage: z.number(),
});

export const MemberContributionSchema = z.object({
  user: UserSchema,
  total_minutes: z.number(),
  session_count: z.number(),
  percentage: z.number(),
});

export const CommunityDashboardSchema = z.object({
  community_id: z.uuid(),
  total_minutes: z.number(),
  total_sessions: z.number(),
  member_count: z.number(),
  categories: z.array(CategoryBreakdownSchema),
  members: z.array(MemberContributionSchema),
  generated_at: z.coerce.date<Date>(),
});

export const DiscoverySortSchema = z.enum(["members", "activity", "newest"]);

export const CommunitySearchResultSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  avatar_url: z.string().nullable(),
  member_count: z.number(),
  recent_activity_minutes: z.number(),
  is_member: z.boolean(),
  created_at: z.coerce.date<Date>(),
});

export const DiscoverCommunitiesResultSchema = z.object({
  results: z.array(CommunitySearchResultSchema),
  total_count: z.number(),
});

export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>;
export type Community = z.infer<typeof CommunitySchema>;
export type CommunityCapabilities = z.infer<typeof CommunityCapabilitiesSchema>;
export type CommunityDashboard = z.infer<typeof CommunityDashboardSchema>;
export type CommunityDataVisibility = z.infer<typeof CommunityDataVisibilitySchema>;
export type CommunityInvite = z.infer<typeof CommunityInviteSchema>;
export type CommunityInvitePreview = z.infer<typeof CommunityInvitePreviewSchema>;
export type CommunityInviteStatus = z.infer<typeof CommunityInviteStatusSchema>;
export type CommunityInviteType = z.infer<typeof CommunityInviteTypeSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;
export type CommunityMemberRole = z.infer<typeof CommunityMemberRoleSchema>;
export type CommunityMembersPage = z.infer<typeof CommunityMembersPageSchema>;
export type CommunitySearchResult = z.infer<typeof CommunitySearchResultSchema>;
export type CommunityVisibilityType = z.infer<typeof CommunityVisibilityTypeSchema>;
export type CommunityWithId = z.infer<typeof CommunityWithIdSchema>;
export type DiscoverCommunitiesResult = z.infer<typeof DiscoverCommunitiesResultSchema>;
export type DiscoverySort = z.infer<typeof DiscoverySortSchema>;
export type MemberContribution = z.infer<typeof MemberContributionSchema>;
export type TrackedCategory = z.infer<typeof TrackedCategorySchema>;
