import { z } from "zod";

export type TaskRequest = {
  [Property in keyof typeof TaskRequestSchema]: z.infer<
    (typeof TaskRequestSchema)[Property]
  >;
};

const create = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1),
  description: z.string().optional(),
});

const update = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  name: z.string().optional(),
  completed: z.boolean().optional(),
});

const deleteTask = z.object({
  id: z.string().uuid(),
});

const withSessionCount = z.object({
  project_id: z.string().uuid().optional(),
});

export const TaskRequestSchema = {
  create,
  deleteTask,
  readById,
  readMany,
  update,
  withSessionCount,
};
