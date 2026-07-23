import { z } from "zod";
import {
  CommunityDataVisibilitySchema,
  CommunityVisibilityTypeSchema,
} from "@/api/definitions/models/community";

const create = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  visibilityType: CommunityVisibilityTypeSchema,
  dataVisibility: CommunityDataVisibilitySchema,
});

const update = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  visibilityType: CommunityVisibilityTypeSchema.optional(),
  dataVisibility: CommunityDataVisibilitySchema.optional(),
});

const archive = z.object({ id: z.uuid() });
const getById = z.object({ id: z.uuid() });

export const CommunityRequestSchema = { create, update, archive, getById };
export type CommunityRequest = {
  [Property in keyof typeof CommunityRequestSchema]: z.infer<
    (typeof CommunityRequestSchema)[Property]
  >;
};
