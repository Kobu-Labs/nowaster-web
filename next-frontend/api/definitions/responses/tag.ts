import { TagDetailsSchema, TagWithIdSchema } from "@/api/definitions/models";
import { z } from "zod";

const readMany = z.array(TagDetailsSchema);
const create = TagDetailsSchema;
const getById = TagDetailsSchema.optional();
const update = TagDetailsSchema;
const addAllowedCategory = TagDetailsSchema;
const removeAllowedCategory = TagDetailsSchema;
const deleteTag = z.null();
const statistics = z.object({
  total_tags: z.number(),
  total_usages: z.number(),
  average_usages_per_tag: z.number(),
  most_used_tag: TagWithIdSchema.nullable(),
});

// Reuse the migration schemas from category responses
const SessionPreviewSchema = z.object({
  id: z.string().uuid(),
  description: z.string().nullable(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().nullable(),
  current_category_name: z.string(),
  current_tag_names: z.string(), // comma-separated string
});

const MigrationPreviewResponseSchema = z.object({
  affected_sessions_count: z.number(),
  session_previews: z.array(SessionPreviewSchema),
});

const migratePreview = MigrationPreviewResponseSchema;
const migrate = z.number(); // number of affected sessions

export type TagResponse = {
  [Property in keyof typeof TagResponseSchema]: z.infer<
    (typeof TagResponseSchema)[Property]
  >;
};

export const TagResponseSchema = {
  getById,
  create,
  readMany,
  deleteTag,
  update,
  addAllowedCategory,
  removeAllowedCategory,
  statistics,
  migratePreview,
  migrate,
} as const;
