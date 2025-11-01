import { HasID } from "@/validation/utils";
import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  color: z.string().trim().min(1),
  completed: z.boolean(),
  created_at: z.coerce.date<Date>(),
  updated_at: z.coerce.date<Date>(),
});

export const ProjectWithIdSchema = ProjectSchema.merge(HasID);

export const ProjectDetailsSchema = ProjectWithIdSchema.merge(
  z.object({
    taskCount: z.number(),
    completedTaskCount: z.number(),
  }),
);

export const ProjectStatsSchema = z.object({
  total_projects: z.number(),
  active_projects: z.number(),
  completed_projects: z.number(),
  total_tasks: z.number(),
  total_sessions: z.number(),
  total_time_minutes: z.number().nullable(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectWithId = z.infer<typeof ProjectWithIdSchema>;
export type ProjectWithTaskCount = z.infer<typeof ProjectDetailsSchema>;
export type ProjectStats = z.infer<typeof ProjectStatsSchema>;
