import {
  TaskStatsSchema,
  TaskWithIdSchema,
} from "@/api/definitions/models/task";
import { z } from "zod";

export const TaskResponseSchema = {
  create: TaskWithIdSchema,
  delete: z.null(),
  details: z.array(TaskWithIdSchema),
  readById: TaskWithIdSchema,
  readMany: z.array(TaskWithIdSchema),
  statistics: TaskStatsSchema,
  update: TaskWithIdSchema,
};

export type TaskResponse = {
  [Property in keyof typeof TaskResponseSchema]: z.infer<
    (typeof TaskResponseSchema)[Property]
  >;
};
