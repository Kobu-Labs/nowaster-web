import { z } from "zod";

const create = z.object({
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date()
});

const readMany = z.object({
  limit: z.coerce.number().optional()
});

const readById = z.object({
  id: z.string().uuid(),
});

const updateById = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date().optional()
});

const removeById = z.object({
  id: z.string().uuid(),
});


export type RecordedSessionRequest = { [Property in (keyof typeof RecordedSessionRequestSchema)]: z.infer<typeof RecordedSessionRequestSchema[Property]> }

export const RecordedSessionRequestSchema = {
  readById,
  removeById,
  create,
  readMany,
  updateById
} as const;