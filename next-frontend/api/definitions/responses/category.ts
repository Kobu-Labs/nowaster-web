import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { z } from "zod";

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
};

export type CategoryResponse = {
  [Property in keyof typeof CategoryResponseSchema]: z.infer<
    (typeof CategoryResponseSchema)[Property]
  >;
};
