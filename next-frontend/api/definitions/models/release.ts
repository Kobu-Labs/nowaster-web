import { z } from "zod";

export const ReleaseUserSchema = z.object({
  avatar_url: z.string().nullable(),
  id: z.string(),
  username: z.string(),
});

export const ReleaseSchema = z.object({
  created_at: z.coerce.date(),
  id: z.string(),
  name: z.string(),
  released: z.boolean(),
  released_at: z.coerce.date().nullable(),
  released_by: ReleaseUserSchema.nullable(),
  seo_description: z.string().nullable(),
  seo_keywords: z.string().nullable(),
  seo_title: z.string().nullable(),
  short_description: z.string().nullish(),
  tags: z.array(z.string()),
  updated_at: z.coerce.date(),
  version: z.string(),
});

export const PublicReleaseSchema = z.object({
  name: z.string(),
  released_at: z.coerce.date(),
  released_by: ReleaseUserSchema.nullable(),
  short_description: z.string().nullish(),
  tags: z.array(z.string()),
  version: z.string(),
});

export const LatestUnseenReleaseSchema = z.object({
  release: PublicReleaseSchema,
  unseen: z.boolean(),
});

export type LatestUnseenRelease = z.infer<typeof LatestUnseenReleaseSchema>;
export type PublicRelease = z.infer<typeof PublicReleaseSchema>;
export type Release = z.infer<typeof ReleaseSchema>;
export type ReleaseUser = z.infer<typeof ReleaseUserSchema>;
