import { z } from "zod";

export const TagSchema = z.object({
  label: z.string()
})

export const createTagSchema = z.object({
  label: z.string()
});

export const readManyTags = z.object({
  limit: z.coerce.number().optional()
});

