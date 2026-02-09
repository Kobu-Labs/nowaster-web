import { z } from "zod";

export type TaskRequest = {
  [Property in keyof typeof TaskRequestSchema]: z.infer<
    (typeof TaskRequestSchema)[Property]
  >;
};

const create = z.object({
  description: z.string().optional(),
  name: z.string().trim().min(1),
  project_id: z.string().uuid(),
});

const update = z.object({
  completed: z.boolean().optional(),
  description: z.string().optional(),
  id: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  completed: z.boolean().optional(),
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  project_id: z.string().uuid().optional(),
});

const deleteTask = z.object({
  id: z.string().uuid(),
});

const details = z.object({
  project_id: z.string().uuid().optional(),
});

export const TaskRequestSchema = {
  create,
  deleteTask,
  details,
  readById,
  readMany,
  update,
};
