import { z } from "zod";

export type ReadManyTagsRequest = z.infer<typeof readManyTagsRequestSchema>;

export const readManyTagsRequestSchema = z.object({
  limit: z.coerce.number().optional()
});
