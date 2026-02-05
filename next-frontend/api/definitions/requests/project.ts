import { z } from "zod";

export type ProjectRequest = {
  [Property in keyof typeof ProjectRequestSchema]: z.infer<
    (typeof ProjectRequestSchema)[Property]
  >;
};

const create = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  color: z.string().trim().min(1),
});

const update = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  color: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  completed: z.boolean().optional(),
});

const deleteProject = z.object({
  id: z.string().uuid(),
});

const getTasksByProject = z.object({
  project_id: z.string().uuid(),
});

export const ProjectRequestSchema = {
  create,
  deleteProject,
  getTasksByProject,
  readById,
  readMany,
  update,
};
