import { z } from "zod";
import {
  CommunityDataVisibilitySchema,
  CommunityMemberRoleSchema,
  CommunityVisibilityTypeSchema,
  DiscoverySortSchema,
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
});
const leave = z.object({ communityId: z.uuid() });
const listMembers = z.object({
  communityId: z.uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});
const updateMemberRole = z.object({
  communityId: z.uuid(),
  userId: z.string(),
  newRole: CommunityMemberRoleSchema.exclude(["owner"]),
});
const removeMember = z.object({ communityId: z.uuid(), userId: z.string() });
const getCapabilities = z.object({ communityId: z.uuid() });

const createDirectInvite = z.object({
  communityId: z.uuid(),
  inviteeUsername: z.string().trim().min(1, "Enter a username"),
});
const createLinkInvite = z.object({
  communityId: z.uuid(),
  expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(30)]).nullable(),
  maxUses: z.number().int().positive().nullable(),
});
const listCommunityInvites = z.object({ communityId: z.uuid() });
const listIncomingInvites = z.object({});
const respondToInvite = z.object({ inviteId: z.uuid(), accept: z.boolean() });
const revokeInvite = z.object({ communityId: z.uuid(), inviteId: z.uuid() });
const joinViaCode = z.object({ code: z.string().trim().min(1) });
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

const getDashboard = z.object({ communityId: z.uuid() });

const discoverCommunities = z.object({
  query: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  sort: DiscoverySortSchema.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});
const autocompleteCategories = z.object({
  prefix: z.string().trim().min(1),
});

export const CommunityRequestSchema = {
  create,
  update,
  archive,
  getById,
  join,
  leave,
  listMembers,
  updateMemberRole,
  removeMember,
  getCapabilities,
  createDirectInvite,
  createLinkInvite,
  listCommunityInvites,
  listIncomingInvites,
  respondToInvite,
  revokeInvite,
  joinViaCode,
  previewByCode,
  createTrackedCategory,
  updateTrackedCategory,
  deleteTrackedCategory,
  listTrackedCategories,
  createMapping,
  deleteMapping,
  listMyMappings,
  getDashboard,
  discoverCommunities,
  autocompleteCategories,
};
export type CommunityRequest = {
  [Property in keyof typeof CommunityRequestSchema]: z.infer<
    (typeof CommunityRequestSchema)[Property]
  >;
};
