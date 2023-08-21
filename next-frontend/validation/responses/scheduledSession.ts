import { z } from "zod";
import { ScheduledSessionSchema } from "../models";
import { HasID } from "../utils";

export type CreateScheduledSessionResponse = z.infer<typeof createScheduledSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;
export type UpdateScheduledSessionResponse = z.infer<typeof updateScheduledSessionResponseSchema>;
export type DeleteScheduledSessionResponse = z.infer<typeof deleteScheduledSessionResponseSchema>;


export const createScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID)
export const getSessionResponseSchema = z.array(ScheduledSessionSchema.merge(HasID))
export const updateScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID)
export const deleteScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID)
