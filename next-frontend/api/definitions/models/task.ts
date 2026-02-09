import { HasID } from "@/validation/utils";
import { z } from "zod";

export const TaskSchema = z.object({
  completed: z.boolean(),
  created_at: z.coerce.date(),
  description: z.string().optional().nullable(),
  name: z.string().trim().min(1),
  project_id: z.string().uuid(),
  updated_at: z.coerce.date(),
});

export const TaskWithIdSchema = TaskSchema.merge(HasID);

export const TaskDetailsSchema = TaskWithIdSchema.merge(
  z.object({
    sessionCount: z.number(),
  }),
);

export const TaskStatsSchema = z.object({
  active_tasks: z.number(),
  completed_tasks: z.number(),
  total_sessions: z.number(),
  total_tasks: z.number(),
  total_time_minutes: z.number().nullable(),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskStats = z.infer<typeof TaskStatsSchema>;
export type TaskWithId = z.infer<typeof TaskWithIdSchema>;
export type TaskWithSessionCount = z.infer<typeof TaskDetailsSchema>;
