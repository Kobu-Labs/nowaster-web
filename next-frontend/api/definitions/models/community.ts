import { z } from "zod";
import { HasID } from "@/validation/utils";
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

export type Community = z.infer<typeof CommunitySchema>;
export type CommunityDataVisibility = z.infer<typeof CommunityDataVisibilitySchema>;
export type CommunityInvitePreview = z.infer<typeof CommunityInvitePreviewSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;
export type CommunityMemberRole = z.infer<typeof CommunityMemberRoleSchema>;
export type CommunityVisibilityType = z.infer<typeof CommunityVisibilityTypeSchema>;
export type CommunityWithId = z.infer<typeof CommunityWithIdSchema>;
export type InviteCode = z.infer<typeof InviteCodeSchema>;
