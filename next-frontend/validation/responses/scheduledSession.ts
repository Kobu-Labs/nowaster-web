import { z } from "zod";
import { ScheduledSessionSchema } from "@/validation/models";
import { HasID } from "@/validation/utils";

export type CreateScheduledSessionResponse = z.infer<typeof createScheduledSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;
export type UpdateScheduledSessionResponse = z.infer<typeof updateScheduledSessionResponseSchema>;
export type DeleteScheduledSessionResponse = z.infer<typeof deleteScheduledSessionResponseSchema>;
export type GetCategoriesReponse = z.infer<typeof getCategoriesResponseSchema>;


export const createScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID);
export const getSessionResponseSchema = z.array(ScheduledSessionSchema.merge(HasID));
export const updateScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID);
export const deleteScheduledSessionResponseSchema = ScheduledSessionSchema.merge(HasID);
export const getCategoriesResponseSchema = z.array(z.string());
