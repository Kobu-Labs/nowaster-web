import { z } from "zod";

export type CategoryRequest = {
  [Property in keyof typeof CategoryRequestSchema]: z.infer<
    (typeof CategoryRequestSchema)[Property]
  >;
};

const create = z.object({
  color: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

const update = z.object({
  color: z.string().trim().min(1).optional(),
  id: z.string(),
  name: z.string().optional(),
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
  id: z.uuid(),
});

const deleteCategory = z.object({
  id: z.uuid(),
});

export const CategoryRequestSchema = {
  create,
  deleteCategory,
  readById,
  readByName,
  readMany,
  remove,
  update,
};
