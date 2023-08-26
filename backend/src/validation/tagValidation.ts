import { z } from "zod";

export const createTagSchema = z.object({
  label: z.string()
});

export const readManyTags = z.object({
  limit: z.coerce.number().optional()
});

