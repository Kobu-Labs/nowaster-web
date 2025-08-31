import { CategorySchema, TagDetailsSchema } from "@/api/definitions/models";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

const create = z.object({
  allowedCategories: z.array(CategorySchema),
  color: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

const deleteTag = z.object({
  id: z.uuid(),
});

const readMany = z.object({
  allowedCategories: z.array(CategorySchema).optional(),
  limit: z.coerce.number().optional(),
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

const update = TagDetailsSchema.partial().merge(HasID);

export type TagRequest = {
  [Property in keyof typeof TagRequestSchema]: z.infer<
    (typeof TagRequestSchema)[Property]
  >;
};

export const TagRequestSchema = {
  addAllowedCategory,
  create,
  deleteTag,
  getById,
  readMany,
  removeAllowedCategory,
  update,
} as const;
