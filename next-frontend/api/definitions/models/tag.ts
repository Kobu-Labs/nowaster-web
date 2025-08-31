import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const TagSchema = z.object({
  color: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const TagWithIdSchema = TagSchema.merge(HasID);
export const TagDetailsSchema = TagWithIdSchema.extend({
  allowedCategories: z.array(CategoryWithIdSchema),
  last_used_at: z.coerce.date<Date>(),
  usages: z.number(),
});

export type Tag = z.infer<typeof TagSchema>;
export type TagDetails = z.infer<typeof TagDetailsSchema>;
export type TagWithId = z.infer<typeof TagWithIdSchema>;
