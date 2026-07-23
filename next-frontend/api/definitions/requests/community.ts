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

const join = z.object({
  communityId: z.uuid(),
  inviteCode: z.string().trim().optional(),
});
const leave = z.object({ communityId: z.uuid() });
const listMembers = z.object({ communityId: z.uuid() });
const getInviteCode = z.object({ communityId: z.uuid() });
const regenerateInviteCode = z.object({ communityId: z.uuid() });
const previewByCode = z.object({ code: z.string().trim().min(1) });

const createTrackedCategory = z.object({
  communityId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().trim().min(1),
});
const updateTrackedCategory = z.object({
  communityId: z.uuid(),
  id: z.uuid(),
  name: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).optional(),
});
const deleteTrackedCategory = z.object({ communityId: z.uuid(), id: z.uuid() });
const listTrackedCategories = z.object({ communityId: z.uuid() });
const createMapping = z.object({
  communityId: z.uuid(),
  trackedCategoryId: z.uuid(),
  personalCategoryId: z.uuid(),
});
const deleteMapping = z.object({ communityId: z.uuid(), id: z.uuid() });
const listMyMappings = z.object({ communityId: z.uuid() });

export const CommunityRequestSchema = {
  create,
  update,
  archive,
  getById,
  join,
  leave,
  listMembers,
  getInviteCode,
  regenerateInviteCode,
  previewByCode,
  createTrackedCategory,
  updateTrackedCategory,
  deleteTrackedCategory,
  listTrackedCategories,
  createMapping,
  deleteMapping,
  listMyMappings,
};
export type CommunityRequest = {
  [Property in keyof typeof CommunityRequestSchema]: z.infer<
    (typeof CommunityRequestSchema)[Property]
  >;
};
