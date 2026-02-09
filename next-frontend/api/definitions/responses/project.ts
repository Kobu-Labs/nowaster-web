import {
  ProjectDetailsSchema,
  ProjectStatsSchema,
  ProjectWithIdSchema,
} from "@/api/definitions/models/project";
import { TaskDetailsSchema } from "@/api/definitions/models/task";
import { z } from "zod";

export const ProjectResponseSchema = {
  create: ProjectWithIdSchema,
  delete: z.null(),
  details: z.array(ProjectDetailsSchema),
  getTasksByProject: z.array(TaskDetailsSchema),
  readById: ProjectWithIdSchema,
  readMany: z.array(ProjectWithIdSchema),
  statistics: ProjectStatsSchema,
  update: ProjectWithIdSchema,
};

export type ProjectResponse = {
  [Property in keyof typeof ProjectResponseSchema]: z.infer<
    (typeof ProjectResponseSchema)[Property]
  >;
};
