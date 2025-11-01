import {
  TaskStatsSchema,
  TaskWithIdSchema,
  TaskDetailsSchema,
} from "@/api/definitions/models/task";
import { z } from "zod";

export const TaskResponseSchema = {
  create: TaskWithIdSchema,
  delete: z.null(),
  readById: TaskWithIdSchema,
  readMany: z.array(TaskWithIdSchema),
  statistics: TaskStatsSchema,
  update: TaskWithIdSchema,
  details: z.array(TaskDetailsSchema),
};

export type TaskResponse = {
  [Property in keyof typeof TaskResponseSchema]: z.infer<
    (typeof TaskResponseSchema)[Property]
  >;
};
