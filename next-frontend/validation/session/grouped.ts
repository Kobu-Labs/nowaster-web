import { z } from "zod";
import { filterSessionSchema } from "./filter";

// Date Grouping
export const dateGroupingSchema = z.enum(["Year", "Month", "Week", "Day"]);

export type DateGrouping = z.infer<typeof dateGroupingSchema>;

// Grouping Option
export const groupingOptionSchema = z.union([
  z.literal("User"),
  z.literal("Tag"),
  z.literal("Category"),
  z.literal("Template"),
  z.object({ Date: dateGroupingSchema }),
]);

export type GroupingOption = z.infer<typeof groupingOptionSchema>;

// Aggregating Options
export const aggregatingOptionsSchema = z.enum(["Count", "SumTime"]);

export type AggregatingOptions = z.infer<typeof aggregatingOptionsSchema>;

// Aggregate Value
export const aggregateValueSchema = z.union([
  z.object({ Count: z.number() }),
  z.object({ Duration: z.number() }),
]);

export type AggregateValue = z.infer<typeof aggregateValueSchema>;

// Group Sessions DTO
export const groupSessionsDtoSchema = z.object({
  filter: filterSessionSchema,
  grouping: groupingOptionSchema,
  aggregating: aggregatingOptionsSchema,
});

export type GroupSessionsDto = z.infer<typeof groupSessionsDtoSchema>;

// Grouped Results
export const userGroupedResultSchema = z.object({
  user_id: z.string(),
  aggregate: aggregateValueSchema,
});

export type UserGroupedResult = z.infer<typeof userGroupedResultSchema>;

export const tagGroupedResultSchema = z.object({
  tag_id: z.string().uuid().nullable(),
  tag_label: z.string().nullable(),
  tag_color: z.string().nullable(),
  tag_last_used_at: z.coerce.date().nullable(),
  aggregate: aggregateValueSchema,
});

export type TagGroupedResult = z.infer<typeof tagGroupedResultSchema>;

export const categoryGroupedResultSchema = z.object({
  category_id: z.string().uuid(),
  category: z.string(),
  category_color: z.string(),
  category_last_used_at: z.coerce.date(),
  aggregate: aggregateValueSchema,
});

export type CategoryGroupedResult = z.infer<typeof categoryGroupedResultSchema>;

export const templateGroupedResultSchema = z.object({
  template_id: z.string().uuid().nullable(),
  template_name: z.string().nullable(),
  template_start_date: z.coerce.date().nullable(),
  template_end_date: z.coerce.date().nullable(),
  template_interval: z.enum(["Daily", "Weekly", "Monthly", "Yearly"]).nullable(),
  aggregate: aggregateValueSchema,
});

export type TemplateGroupedResult = z.infer<typeof templateGroupedResultSchema>;

export const dateGroupedResultSchema = z.object({
  grouped_date: z.coerce.date(),
  aggregate: aggregateValueSchema,
});

export type DateGroupedResult = z.infer<typeof dateGroupedResultSchema>;

// Grouped Result enum
export const groupedResultSchema = z.union([
  z.object({ User: userGroupedResultSchema }),
  z.object({ Tag: tagGroupedResultSchema }),
  z.object({ Category: categoryGroupedResultSchema }),
  z.object({ Template: templateGroupedResultSchema }),
  z.object({ Date: dateGroupedResultSchema }),
]);

export type GroupedResult = z.infer<typeof groupedResultSchema>;
