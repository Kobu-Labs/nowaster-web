import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { SessionTemplateShallowSchema } from "@/api/definitions/models/session-template";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const ScheduledSessionSchema = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  endTime: z.coerce.date<Date>(),
  session_type: z.literal("fixed"),
  startTime: z.coerce.date<Date>(),
  tags: z.array(TagWithIdSchema),
  template: z.nullable(SessionTemplateShallowSchema),
});
export const ScheduledSessionWithIdSchema = ScheduledSessionSchema.merge(HasID);

export type ScheduledSession = z.infer<typeof ScheduledSessionSchema>;
export type ScheduledSessionWithId = z.infer<
  typeof ScheduledSessionWithIdSchema
>;
