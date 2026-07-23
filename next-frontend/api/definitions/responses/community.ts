import { z } from "zod";
import {
  CommunityInvitePreviewSchema,
  CommunityMemberSchema,
  CommunityWithIdSchema,
  InviteCodeSchema,
} from "@/api/definitions/models/community";

export const CommunityResponseSchema = {
  create: CommunityWithIdSchema,
  getById: CommunityWithIdSchema,
  update: CommunityWithIdSchema,
  archive: z.null(),
  listMine: z.array(CommunityWithIdSchema),
  join: CommunityMemberSchema,
  leave: z.null(),
  listMembers: z.array(CommunityMemberSchema),
  getInviteCode: InviteCodeSchema,
  regenerateInviteCode: InviteCodeSchema,
  previewByCode: CommunityInvitePreviewSchema,
};
export type CommunityResponse = {
  [Property in keyof typeof CommunityResponseSchema]: z.infer<
    (typeof CommunityResponseSchema)[Property]
  >;
};
