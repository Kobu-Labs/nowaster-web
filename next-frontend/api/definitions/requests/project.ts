import { z } from "zod";

export type ProjectRequest = {
  [Property in keyof typeof ProjectRequestSchema]: z.infer<
    (typeof ProjectRequestSchema)[Property]
  >;
};

const create = z.object({
  color: z.string().trim().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  name: z.string().trim().min(1),
});

const update = z.object({
  color: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
  description: z.string().optional(),
  id: z.string().uuid(),
  imageUrl: z.string().optional(),
  name: z.string().trim().min(1).optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  completed: z.boolean().optional(),
  id: z.string().uuid().optional(),
  name: z.string().optional(),
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
