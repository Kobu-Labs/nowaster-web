import { sessionFilter } from "@/api/definitions/filters";
import {
  CategoryWithIdSchema,
} from "@/api/definitions/models";
import { z } from "zod";

const create = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
    }),
  ),
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
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
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
