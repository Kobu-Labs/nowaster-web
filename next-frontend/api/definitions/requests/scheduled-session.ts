import { sessionFilter } from "@/api/definitions/filters";
import { z } from "zod";

const create = z.object({
  category_id: z.string().uuid(),
  description: z.string().nullable(),
  startTime: z.coerce.date<Date>(),
  endTime: z.coerce.date<Date>(),
  tag_ids: z.array(z.string().uuid()),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z
  .object({
    limit: z.coerce.number().optional(),
  })
  .merge(sessionFilter);

const update = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  description: z.string().nullish(),
  startTime: z.coerce.date<Date>().optional(),
  endTime: z.coerce.date<Date>().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

const remove = z.object({
  id: z.string().uuid(),
});

export type ScheduledSessionRequest = {
  [Property in keyof typeof ScheduledSessionRequestSchema]: z.infer<
    (typeof ScheduledSessionRequestSchema)[Property]
  >;
};

export const ScheduledSessionRequestSchema = {
  readById,
  create,
  readMany,
  update,
  remove,
} as const;
