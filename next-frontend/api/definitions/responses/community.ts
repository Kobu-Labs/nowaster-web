import { z } from "zod";
import {
  CategoryMappingSchema,
  CommunityCapabilitiesSchema,
  CommunityDashboardSchema,
  CommunityInvitePreviewSchema,
  CommunityInviteSchema,
  CommunityMemberSchema,
  CommunityMembersPageSchema,
  CommunityWithIdSchema,
  DiscoverCommunitiesResultSchema,
  TrackedCategorySchema,
} from "@/api/definitions/models/community";

export const CommunityResponseSchema = {
  create: CommunityWithIdSchema,
  getById: CommunityWithIdSchema,
  update: CommunityWithIdSchema,
  archive: z.null(),
  listMine: z.array(CommunityWithIdSchema),
  join: CommunityMemberSchema,
  leave: z.null(),
  listMembers: CommunityMembersPageSchema,
  updateMemberRole: CommunityMemberSchema,
  removeMember: z.null(),
  getCapabilities: CommunityCapabilitiesSchema,
  createDirectInvite: CommunityInviteSchema,
  createLinkInvite: CommunityInviteSchema,
  listCommunityInvites: z.array(CommunityInviteSchema),
  listIncomingInvites: z.array(CommunityInviteSchema),
  respondToInvite: CommunityInviteSchema,
  revokeInvite: z.null(),
  joinViaCode: z.null(),
  previewByCode: CommunityInvitePreviewSchema,
  createTrackedCategory: TrackedCategorySchema,
  listTrackedCategories: z.array(TrackedCategorySchema),
  updateTrackedCategory: TrackedCategorySchema,
  deleteTrackedCategory: z.null(),
  createMapping: CategoryMappingSchema,
  listMyMappings: z.array(CategoryMappingSchema),
  deleteMapping: z.null(),
  getDashboard: CommunityDashboardSchema,
  discoverCommunities: DiscoverCommunitiesResultSchema,
  autocompleteCategories: z.array(z.string()),
};
export type CommunityResponse = {
  [Property in keyof typeof CommunityResponseSchema]: z.infer<
    (typeof CommunityResponseSchema)[Property]
  >;
};
