import { z } from "zod";
import { ScheduledSessionSchema } from "../models";
import { HasID } from "../utils";


export type CreateScheduledSessionRequest = z.infer<typeof createScheduledSchema>;
export type GetSessionsRequest = z.infer<typeof readByUserScheduledSchema>;
export type UpdateScheduledSessionRequest = z.infer<typeof updateScheduledSchema>;
export type DeleteScheduledSessionRequest = z.infer<typeof deleteScheduledSchema>;

export const createScheduledSchema = ScheduledSessionSchema;

export const readByUserScheduledSchema = z.object({
  limit: z.coerce.number().optional(),
  fromStartTime: z.coerce.date().optional(),
  toStartTime: z.coerce.date().optional(),
  fromEndTime: z.coerce.date().optional(),
  toEndTime: z.coerce.date().optional(),
  category: z.string().optional(),
  /* TODO: Allow for multiple tags being passed here*/
  tags: z.string().optional()
});

export const updateScheduledSchema = ScheduledSessionSchema.partial().merge(HasID);

export const deleteScheduledSchema = z.object({
  id: z.string().uuid(),
});
