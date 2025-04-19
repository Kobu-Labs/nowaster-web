import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const TagSchema = z.object({
  label: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

export const TagWithIdSchema = TagSchema.merge(HasID);
export const TagDetailsSchema = TagWithIdSchema.extend({
  allowedCategories: z.array(CategoryWithIdSchema),
  usages: z.number(),
});

export type Tag = z.infer<typeof TagSchema>;
export type TagWithId = z.infer<typeof TagWithIdSchema>;
export type TagDetails = z.infer<typeof TagDetailsSchema>;
