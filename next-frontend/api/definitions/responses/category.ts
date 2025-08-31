import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { z } from "zod";

export const CategoryResponseSchema = {
  create: CategoryWithIdSchema,
  delete: z.null(),
  groupBySession: CategoryWithIdSchema.merge(
    z.object({
      sessionCount: z.number(),
    }),
  ),
  readById: CategoryWithIdSchema,
  readByName: CategoryWithIdSchema.nullable(),
  readMany: z.array(CategoryWithIdSchema),
  statistics: z.object({
    average_sessions_per_category: z.number(),
    most_used_category: CategoryWithIdSchema.nullable(),
    total_categories: z.number(),
    total_sessions: z.number(),
    total_time_minutes: z.number().nullable(),
  }),
  update: CategoryWithIdSchema,
};

export type CategoryResponse = {
  [Property in keyof typeof CategoryResponseSchema]: z.infer<
    (typeof CategoryResponseSchema)[Property]
  >;
};
