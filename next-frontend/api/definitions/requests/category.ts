import { z } from "zod";

export type CategoryRequest = {
  [Property in keyof typeof CategoryRequestSchema]: z.infer<
    (typeof CategoryRequestSchema)[Property]
  >;
};

const create = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

const update = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().trim().min(1).optional(),
});

const readByName = z.object({
  name: z.string(),
});

const remove = z.object({
  name: z.string(),
});

const readMany = z.object({
  nameLike: z.string().optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

const migratePreview = z.object({
  from_category_id: z.string().uuid(),
  target_category_id: z.string().uuid().optional(),
  filters: z.object({
    tag_ids: z.array(z.string().uuid()).optional(),
    from_start_time: z.string().datetime().optional(),
    to_end_time: z.string().datetime().optional(),
  }).optional().default({}),
});

const migrate = z.object({
  from_category_id: z.string().uuid(),
  target_category_id: z.string().uuid(),
  filters: z.object({
    tag_ids: z.array(z.string().uuid()).optional(),
    from_start_time: z.string().datetime().optional(),
    to_end_time: z.string().datetime().optional(),
  }).optional().default({}),
});

export const CategoryRequestSchema = {
  create,
  update,
  readMany,
  readByName,
  remove,
  readById,
  migratePreview,
  migrate,
};
