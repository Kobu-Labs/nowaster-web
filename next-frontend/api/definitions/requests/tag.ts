import { CategorySchema, TagDetailsSchema } from "@/api/definitions/models";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

const create = z.object({
  label: z.string().trim().min(1),
  allowedCategories: z.array(CategorySchema),
  color: z.string().trim().min(1),
});

const deleteTag = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  limit: z.coerce.number().optional(),
  allowedCategories: z.array(CategorySchema).optional(),
});

const removeAllowedCategory = z.object({
  categoryId: z.string(),
  tagId: z.string(),
});

const addAllowedCategory = z.object({
  categoryId: z.string(),
  tagId: z.string(),
});

const getById = z.object({
  id: z.string(),
});

const update = TagDetailsSchema.deepPartial().merge(HasID);

export type TagRequest = {
  [Property in keyof typeof TagRequestSchema]: z.infer<
    (typeof TagRequestSchema)[Property]
  >;
};

export const TagRequestSchema = {
  getById,
  create,
  readMany,
  update,
  addAllowedCategory,
  removeAllowedCategory,
  deleteTag,
} as const;
