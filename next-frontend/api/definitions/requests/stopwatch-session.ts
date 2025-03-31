import {
  CategoryWithIdSchema,
  TagWithIdSchema,
} from "@/api/definitions/models";
import { z } from "zod";

const create = z.object({
  startTime: z.coerce.date(),
  category: CategoryWithIdSchema.nullable(),
  description: z.string().nullish(),
  tags: z.array(TagWithIdSchema).nullable(),
  session_type: z.literal("stopwatch"),
});

const update = z.object({
  id: z.string().uuid(),
  startTime: z.coerce.date().nullish(),
  category_id: z.string().uuid().nullish(),
  description: z.string().nullish(),
  tag_ids: z.array(z.string().uuid()).nullish(),
});

const remove = z.object({
  id: z.string().uuid(),
});

export type StopwatchSessionRequest = {
  [Property in keyof typeof StopwatchSessionRequestSchema]: z.infer<
    (typeof StopwatchSessionRequestSchema)[Property]
  >;
};

export const StopwatchSessionRequestSchema = {
  remove,
  create,
  update,
} as const;
