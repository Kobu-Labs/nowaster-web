import { z } from "zod";
import { CommunityWithIdSchema } from "@/api/definitions/models/community";

export const CommunityResponseSchema = {
  create: CommunityWithIdSchema,
  getById: CommunityWithIdSchema,
  update: CommunityWithIdSchema,
  archive: z.null(),
  listMine: z.array(CommunityWithIdSchema),
};
export type CommunityResponse = {
  [Property in keyof typeof CommunityResponseSchema]: z.infer<
    (typeof CommunityResponseSchema)[Property]
  >;
};
