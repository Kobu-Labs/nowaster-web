import { z } from "zod";

const create = z.object({
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  tags: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })),
});

const readById = z.object({
  id: z.string().uuid(),
});

const readMany = z.object({
  limit: z.coerce.number().optional(),
  fromStartTime: z.coerce.date().optional(),
  toStartTime: z.coerce.date().optional(),
  fromEndTime: z.coerce.date().optional(),
  toEndTime: z.coerce.date().optional(),
  category: z.string().optional(),
  /* TODO: Allow for multiple tags being passed here*/
  tags: z.string().optional()
});

const update = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  tags: z.array(z.string()),
});

const remove = z.object({
  id: z.string().uuid(),
});

export type ScheduledSessionRequest = { [Property in (keyof typeof ScheduledSessionRequestSchema)]: z.infer<typeof ScheduledSessionRequestSchema[Property]> }

export const ScheduledSessionRequestSchema = {
  readById,
  create,
  readMany,
  update,
  remove,
} as const;
