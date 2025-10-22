import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/validation/utils";
import { z } from "zod";

export const RecurringSessionIntervalSchema = z.enum([
  "daily",
  "weekly",
  // INFO: disabled now for simplicity, can be re-enabled later
  // "bi-weekly",
  // "monthly",
]);

export type RecurringSessionInterval = z.infer<
  typeof RecurringSessionIntervalSchema
>;

export const RecurringSessionSchema = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  end_minute_offset: z.number(),
  start_minute_offset: z.number(),
  tags: z.array(TagWithIdSchema),
});

export const SessionTemplateShallowSchema = z.object({
  end_date: z.coerce.date<Date>(),
  id: z.uuid(),
  interval: RecurringSessionIntervalSchema,
  name: z.string().trim().min(1),
  start_date: z.coerce.date<Date>(),
});

export const SessionTemplateSchema = z.object({
  end_date: z.coerce.date<Date>(),
  interval: RecurringSessionIntervalSchema,
  name: z.string().trim().min(1),
  sessions: z.array(RecurringSessionSchema),
  start_date: z.coerce.date<Date>(),
});

export const SessionTemplateIdSchema = SessionTemplateSchema.merge(HasID);
export const RecurringSessionIdSchema = RecurringSessionSchema.merge(HasID);
export type RecurringSession = z.infer<typeof RecurringSessionIdSchema>;
export type SessionTemplate = z.infer<typeof SessionTemplateIdSchema>;
