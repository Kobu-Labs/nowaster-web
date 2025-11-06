import { z } from "zod";

const create = z.object({
  project_id: z.uuid().nullish(),
  startTime: z.coerce.date<Date>(),
  task_id: z.uuid().nullish(),
});

const update = z.object({
  category_id: z.uuid().nullish(),
  description: z.string().nullish(),
  id: z.uuid(),
  project_id: z.uuid().nullish(),
  startTime: z.coerce.date<Date>().nullish(),
  tag_ids: z.array(z.string()).nullish(),
  task_id: z.uuid().nullish(),
});

const remove = z.object({
  id: z.uuid(),
});

export type StopwatchSessionRequest = {
  [Property in keyof typeof StopwatchSessionRequestSchema]: z.infer<
    (typeof StopwatchSessionRequestSchema)[Property]
  >;
};

export const StopwatchSessionRequestSchema = {
  create,
  remove,
  update,
} as const;
