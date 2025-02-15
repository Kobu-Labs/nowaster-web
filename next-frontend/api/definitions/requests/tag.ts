import { CategorySchema, TagSchema } from "@/api/definitions/models";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

const create = z.object({
  label: z.string().trim().min(1),
  allowedCategories: z.array(CategorySchema).optional(),
});

const readMany = z.object({
  limit: z.coerce.number().optional(),
  allowedCategories: z.array(CategorySchema).optional(),
});

const removeAllowedCategory = z.object({
  category: z.string(),
  tagId: z.string(),
});

const addAllowedCategory = z.object({
  category: z.string(),
  tagId: z.string(),
});

const update = TagSchema.deepPartial().merge(HasID);

export type TagRequest = {
  [Property in keyof typeof TagRequestSchema]: z.infer<
    (typeof TagRequestSchema)[Property]
  >;
};

export const TagRequestSchema = {
  create,
  readMany,
  update,
  addAllowedCategory,
  removeAllowedCategory,
} as const;
