import { z } from "zod";

export type CategoryRequest = {
  [Property in keyof typeof CategoryRequestSchema]: z.infer<
    (typeof CategoryRequestSchema)[Property]
  >;
};

const create = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

const update = z.object({
  id: z.string(),
  label: z.string().optional(),
  color: z.string().trim().min(1).optional(),
});

const readByName = z.object({
  name: z.string(),
});

const remove = z.object({
  name: z.string(),
});

const readMany = z.object({
  nameLike: z.string().optional(),
});

const readById = z.object({
  id: z.string().uuid(),
});

export const CategoryRequestSchema = {
  create,
  update,
  readMany,
  readByName,
  remove,
  readById,
};
