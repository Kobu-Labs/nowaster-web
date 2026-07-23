import { z } from "zod";
import { HasID } from "@/validation/utils";

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

export type Community = z.infer<typeof CommunitySchema>;
export type CommunityDataVisibility = z.infer<typeof CommunityDataVisibilitySchema>;
export type CommunityVisibilityType = z.infer<typeof CommunityVisibilityTypeSchema>;
export type CommunityWithId = z.infer<typeof CommunityWithIdSchema>;
