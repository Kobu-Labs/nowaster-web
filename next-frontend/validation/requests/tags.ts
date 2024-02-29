import { z } from "zod";
import { TagSchema } from "@/validation/models";

export type ReadManyTagsRequest = z.infer<typeof readManyTagsRequestSchema>;
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>;

export const readManyTagsRequestSchema = z.object({
  limit: z.coerce.number().optional()
});

export const createTagRequestSchema = TagSchema;
