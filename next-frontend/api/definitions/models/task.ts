import { HasID } from "@/validation/utils";
import { z } from "zod";

export const TaskSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const TaskWithIdSchema = TaskSchema.merge(HasID);

export const TaskDetailsSchema = TaskWithIdSchema.merge(
  z.object({
    sessionCount: z.number(),
  }),
);

export const TaskStatsSchema = z.object({
  total_tasks: z.number(),
  active_tasks: z.number(),
  completed_tasks: z.number(),
  total_sessions: z.number(),
  total_time_minutes: z.number().nullable(),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskWithId = z.infer<typeof TaskWithIdSchema>;
export type TaskWithSessionCount = z.infer<typeof TaskDetailsSchema>;
export type TaskStats = z.infer<typeof TaskStatsSchema>;
