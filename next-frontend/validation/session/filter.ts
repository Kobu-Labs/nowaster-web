import { z } from "zod";

// ID Filter schemas
const manyIdFilterSchema = z.union([
  z.object({ all: z.array(z.string()) }),
  z.object({ any: z.array(z.string()) }),
]);

const idFilterSchema = () => z.union([z.string(), manyIdFilterSchema]);

// User Filter
export const userFilterSchema = z.object({
  id: idFilterSchema().optional(),
});

export type UserFilter = z.infer<typeof userFilterSchema>;

// Category Filter
export const categoryFilterSchema = z.object({
  id: idFilterSchema().optional(),
});

export type CategoryFilter = z.infer<typeof categoryFilterSchema>;

// Tag Filter
const tagFilterFilterSchema = z.object({
  id: idFilterSchema().optional(),
});

export const tagFilterSchema = z.union([
  z.literal("notag"),
  tagFilterFilterSchema,
]);

export type TagFilter = z.infer<typeof tagFilterSchema>;

// Template Filter
const templateFilterFilterSchema = z.object({
  id: idFilterSchema().optional(),
});

export const templateFilterSchema = z.union([
  z.literal("no_template"),
  templateFilterFilterSchema,
]);

export type TemplateFilter = z.infer<typeof templateFilterSchema>;

// Date Filter
export const dateFilterSchema = z.union([
  z.object({ gte: z.coerce.date() }),
  z.object({ gt: z.coerce.date() }),
  z.object({ lte: z.coerce.date() }),
  z.object({ lt: z.coerce.date() }),
  z.object({ eq: z.coerce.date() }),
]);

export type DateFilter = z.infer<typeof dateFilterSchema>;

// Duration Filter
// the value itself is in minutes
export const durationFilterSchema = z.union([
  z.object({ gte: z.number() }),
  z.object({ gt: z.number() }),
  z.object({ lte: z.number() }),
  z.object({ lt: z.number() }),
  z.object({ eq: z.number() }),
]);

export type DurationFilter = z.infer<typeof durationFilterSchema>;

// Main Filter Session schema with renamed fields
export const filterSessionSchema = z.object({
  user: userFilterSchema.optional(),
  category: categoryFilterSchema.optional(),
  tag: tagFilterSchema.optional(),
  start_time: dateFilterSchema.optional(),
  end_time: dateFilterSchema.optional(),
  template: templateFilterSchema.optional(),
  duration: durationFilterSchema.optional(),
});

export type FilterSession = z.infer<typeof filterSessionSchema>;
