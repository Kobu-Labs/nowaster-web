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

const migratePreview = z.object({
  from_tag_id: z.string().uuid(),
  target_tag_id: z.string().uuid().optional(), // null means remove tag
  filters: z.object({
    category_ids: z.array(z.string().uuid()).optional(), // sessions must have at least one of these
    from_start_time: z.string().datetime().optional(),
    to_end_time: z.string().datetime().optional(),
  }).optional().default({}),
});

const migrate = z.object({
  from_tag_id: z.string().uuid(),
  target_tag_id: z.string().uuid().optional(), // null means remove tag
  filters: z.object({
    category_ids: z.array(z.string().uuid()).optional(), // sessions must have at least one of these
    from_start_time: z.coerce.date().optional(),
    to_end_time: z.coerce.date().optional(),
  }).optional().default({}),
});

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
  migratePreview,
  migrate,
} as const;
