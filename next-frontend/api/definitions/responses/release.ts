import { z } from "zod";
import {
  LatestUnseenReleaseSchema,
  PublicReleaseSchema,
  ReleaseSchema,
} from "@/api/definitions/models/release";

export const ReleaseResponseSchema = {
  createRelease: ReleaseSchema,
  deleteRelease: z.null(),
  getLatestRelease: PublicReleaseSchema,
  getLatestUnseenRelease: LatestUnseenReleaseSchema.nullable(),
  getRelease: ReleaseSchema,

  getReleaseByVersion: PublicReleaseSchema,
  listAllReleases: z.array(ReleaseSchema),
  listPublicReleases: z.array(PublicReleaseSchema),
  markReleaseSeen: z.null(),
  notifyUsersAboutRelease: z.array(z.string()),
  publishRelease: z.null(),
  unpublishRelease: z.null(),
  updateRelease: ReleaseSchema,
};

export type GetReleaseByVersionResponse = z.infer<
  typeof ReleaseResponseSchema.getReleaseByVersion
>;

export type ListPublicReleasesResponse = z.infer<
  typeof ReleaseResponseSchema.listPublicReleases
>;
