import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const StopwatchSessionSchema = z.object({
  category: CategoryWithIdSchema.nullable(),
  description: z.string().nullish(),
  projectId: z.string().uuid().nullable().optional(),
  session_type: z.literal("stopwatch"),
  startTime: z.coerce.date<Date>(),
  tags: z.array(TagWithIdSchema).nullable(),
  taskId: z.string().uuid().nullish(),
});
export const StopwatchSessionWithIdSchema = StopwatchSessionSchema.merge(HasID);

export type StopwatchSession = z.infer<typeof StopwatchSessionSchema>;
export type StopwatchSessionWithId = z.infer<
  typeof StopwatchSessionWithIdSchema
>;
