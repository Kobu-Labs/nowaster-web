import { CategorySchema } from "@/api/definitions/models/category";
import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const RecordedSessionSchema = z.object({
  startTime: z.coerce.date(),
  category: CategorySchema,
  description: z.string().nullable()
});
export const RecordedSessionWithIdSchema = RecordedSessionSchema.merge(HasID);

export type RecordedSession = z.infer<typeof RecordedSessionSchema>;
export type RecordedSessionWithId = z.infer<typeof RecordedSessionWithIdSchema>;
