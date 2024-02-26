import { z } from "zod";
import { HasID } from "./utils";

export const TagSchema = z.object({
  label: z.string()
});

export type Tag = z.infer<typeof TagSchema>

export const RecordedSessionSchema = z.object({
  startTime: z.coerce.date(),
  category: z.string(),
  description: z.string().nullable()
});
export type RecordedEntity = z.infer<typeof RecordedSessionSchema>;


export const ScheduledSessionSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  category: z.string(),
  description: z.string().nullable(),
  tags: z.array(TagSchema.merge(HasID)),
});
export type ScheduledSession = z.infer<typeof ScheduledSessionSchema>;

export type WithId<T> = T & { id: string };
