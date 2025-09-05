import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { z } from "zod";

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

export const CategoryResponseSchema = {
  groupBySession: CategoryWithIdSchema.merge(
    z.object({
      sessionCount: z.number(),
    }),
  ),
  create: CategoryWithIdSchema,
  readMany: z.array(CategoryWithIdSchema),
  readByName: CategoryWithIdSchema.nullable(),
  update: CategoryWithIdSchema,
  readById: CategoryWithIdSchema,
  statistics: z.object({
    total_categories: z.number(),
    total_sessions: z.number(),
    total_time_minutes: z.number().nullable(),
    average_sessions_per_category: z.number(),
    most_used_category: CategoryWithIdSchema.nullable(),
  }),
  migratePreview: MigrationPreviewResponseSchema,
  migrate: z.number(), // number of affected sessions
};

export type CategoryResponse = {
  [Property in keyof typeof CategoryResponseSchema]: z.infer<
    (typeof CategoryResponseSchema)[Property]
  >;
};
