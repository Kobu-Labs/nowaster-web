import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/validation/utils";
import { z } from "zod";

export const RecurringSessionIntervalSchema = z.enum([
  "daily",
  "weekly",
  "b-weekly",
  "monthly",
]);

export type RecurringSessionInterval = z.infer<
  typeof RecurringSessionIntervalSchema
>;

export const RecurringSessionSchema = z.object({
  category: CategoryWithIdSchema,
  tags: z.array(TagWithIdSchema),
  start_minute_offset: z.number(),
  end_minute_offset: z.number(),
  description: z.string().optional(),
});

export const SessionTemplateSchema = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  recurring_sessions: z.array(RecurringSessionSchema),
});

export const SessionTemplateIdSchema = SessionTemplateSchema.merge(HasID);
export const RecurringSessionIdSchema = RecurringSessionSchema.merge(HasID);
export type SessionTemplate = z.infer<typeof SessionTemplateIdSchema>;
export type RecurringSession = z.infer<typeof RecurringSessionIdSchema>;
