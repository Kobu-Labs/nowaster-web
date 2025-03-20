import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const StopwatchSessionSchema = z.object({
  startTime: z.coerce.date(),
  category: CategoryWithIdSchema.optional(),
  description: z.string().optional(),
  tags: z.array(TagWithIdSchema).optional(),
});
export const StopwatchSessionWithIdSchema = StopwatchSessionSchema.merge(HasID);

export type StopwatchSession = z.infer<typeof StopwatchSessionSchema>;
export type StopwatchSessionWithId = z.infer<
  typeof StopwatchSessionWithIdSchema
>;
