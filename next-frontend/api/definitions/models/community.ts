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
  archived_at: z.coerce.date<Date>().nullable(),
  created_at: z.coerce.date<Date>(),
});

export const CommunityWithIdSchema = CommunitySchema.merge(HasID);

export const CommunityMemberRoleSchema = z.enum(["owner", "member"]);

export const CommunityMemberSchema = z.object({
  id: z.uuid(),
  user: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  role: CommunityMemberRoleSchema,
  joined_at: z.coerce.date<Date>(),
});

export const InviteCodeSchema = z.object({
  code: z.string(),
  updated_at: z.coerce.date<Date>(),
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
  user: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
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

export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>;
export type Community = z.infer<typeof CommunitySchema>;
export type CommunityDashboard = z.infer<typeof CommunityDashboardSchema>;
export type CommunityDataVisibility = z.infer<typeof CommunityDataVisibilitySchema>;
export type CommunityInvitePreview = z.infer<typeof CommunityInvitePreviewSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;
export type CommunityMemberRole = z.infer<typeof CommunityMemberRoleSchema>;
export type CommunityVisibilityType = z.infer<typeof CommunityVisibilityTypeSchema>;
export type CommunityWithId = z.infer<typeof CommunityWithIdSchema>;
export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type MemberContribution = z.infer<typeof MemberContributionSchema>;
export type TrackedCategory = z.infer<typeof TrackedCategorySchema>;
