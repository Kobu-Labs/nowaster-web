import { z } from "zod";

export const CreateReleaseRequestSchema = z.object({
  name: z.string().min(1).max(255),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_title: z.string().optional(),
  short_description: z.string().optional(),
  tags: z.array(z.string()).max(10),
  version: z.string().min(1).max(50),
});

export const UpdateReleaseRequestSchema = z.object({
  name: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_title: z.string().optional(),
  short_description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
});

export type CreateReleaseRequest = z.infer<typeof CreateReleaseRequestSchema>;
export type UpdateReleaseRequest = z.infer<typeof UpdateReleaseRequestSchema>;
