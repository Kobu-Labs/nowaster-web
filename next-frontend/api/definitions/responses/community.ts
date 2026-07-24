import { z } from "zod";
import {
  CategoryMappingSchema,
  CommunityCapabilitiesSchema,
  CommunityDashboardSchema,
  CommunityInvitePreviewSchema,
  CommunityMemberSchema,
  CommunityMembersPageSchema,
  CommunityWithIdSchema,
  InviteCodeSchema,
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
  getInviteCode: InviteCodeSchema,
  regenerateInviteCode: InviteCodeSchema,
  previewByCode: CommunityInvitePreviewSchema,
  createTrackedCategory: TrackedCategorySchema,
  listTrackedCategories: z.array(TrackedCategorySchema),
  updateTrackedCategory: TrackedCategorySchema,
  deleteTrackedCategory: z.null(),
  createMapping: CategoryMappingSchema,
  listMyMappings: z.array(CategoryMappingSchema),
  deleteMapping: z.null(),
  getDashboard: CommunityDashboardSchema,
};
export type CommunityResponse = {
  [Property in keyof typeof CommunityResponseSchema]: z.infer<
    (typeof CommunityResponseSchema)[Property]
  >;
};
