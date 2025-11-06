import { sessionFilter } from "@/api/definitions/filters";
import { z } from "zod";

const create = z.object({
  category_id: z.uuid(),
  description: z.string().nullable(),
  endTime: z.coerce.date<Date>(),
  project_id: z.uuid().nullish(),
  startTime: z.coerce.date<Date>(),
  tag_ids: z.array(z.uuid()),
  task_id: z.uuid().nullish(),
});

const readById = z.object({
  id: z.uuid(),
});

const readMany = z
  .object({
    limit: z.coerce.number().optional(),
  })
  .merge(sessionFilter);

const update = z.object({
  category_id: z.uuid().optional(),
  description: z.string().nullish(),
  endTime: z.coerce.date<Date>().optional(),
  id: z.uuid(),
  project_id: z.uuid().nullish(),
  startTime: z.coerce.date<Date>().optional(),
  tag_ids: z.array(z.uuid()).optional(),
  task_id: z.uuid().nullish(),
});

const remove = z.object({
  id: z.uuid(),
});

export type ScheduledSessionRequest = {
  [Property in keyof typeof ScheduledSessionRequestSchema]: z.infer<
    (typeof ScheduledSessionRequestSchema)[Property]
  >;
};

export const ScheduledSessionRequestSchema = {
  create,
  readById,
  readMany,
  remove,
  update,
} as const;
