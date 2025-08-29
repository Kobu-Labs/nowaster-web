import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { SessionTemplateShallowSchema } from "@/api/definitions/models/session-template";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const ScheduledSessionSchema = z.object({
  startTime: z.coerce.date<Date>(),
  endTime: z.coerce.date<Date>(),
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
  template: z.nullable(SessionTemplateShallowSchema),
});
export const ScheduledSessionWithIdSchema = ScheduledSessionSchema.merge(HasID);

export type ScheduledSession = z.infer<typeof ScheduledSessionSchema>;
export type ScheduledSessionWithId = z.infer<
  typeof ScheduledSessionWithIdSchema
>;
