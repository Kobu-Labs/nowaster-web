import {
  ProjectStatsSchema,
  ProjectWithIdSchema,
  ProjectDetailsSchema,
} from "@/api/definitions/models/project";
import { TaskWithIdSchema } from "@/api/definitions/models/task";
import { z } from "zod";

export const ProjectResponseSchema = {
  create: ProjectWithIdSchema,
  delete: z.null(),
  readById: ProjectWithIdSchema,
  readMany: z.array(ProjectWithIdSchema),
  statistics: ProjectStatsSchema,
  update: ProjectWithIdSchema,
  details: z.array(ProjectDetailsSchema),
  getTasksByProject: z.array(TaskWithIdSchema),
};

export type ProjectResponse = {
  [Property in keyof typeof ProjectResponseSchema]: z.infer<
    (typeof ProjectResponseSchema)[Property]
  >;
};
