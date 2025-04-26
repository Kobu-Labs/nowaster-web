import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const StopwatchSessionSchema = z.object({
  startTime: z.coerce.date(),
  category: CategoryWithIdSchema.nullable(),
  description: z.string().nullish(),
  tags: z.array(TagWithIdSchema).nullable(),
  session_type: z.literal("stopwatch"),
});
export const StopwatchSessionWithIdSchema = StopwatchSessionSchema.merge(HasID);

export type StopwatchSession = z.infer<typeof StopwatchSessionSchema>;
export type StopwatchSessionWithId = z.infer<
  typeof StopwatchSessionWithIdSchema
>;
