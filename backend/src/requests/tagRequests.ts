import { z } from "zod";

const create = z.object({
  label: z.string()
});

const readMany = z.object({
  limit: z.coerce.number().optional()
});

export type TagRequest = { [Property in (keyof typeof TagRequestSchema)]: z.infer<typeof TagRequestSchema[Property]> }

export const TagRequestSchema = {
  create,
  readMany,
} as const;
