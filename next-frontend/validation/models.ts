import { z } from "zod";

export const RecordedSessionSchema = z.object({
  startTime: z.coerce.date().optional(),
  category: z.string(),
  description: z.string().optional()
});
export type RecordedEntity = z.infer<typeof RecordedSessionSchema>;


export const ScheduledSessionSchema = z.object({
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  category: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
});
export type ScheduledSession = z.infer<typeof ScheduledSessionSchema>;
