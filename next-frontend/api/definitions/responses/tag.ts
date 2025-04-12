import { TagDetailsSchema } from "@/api/definitions/models";
import { z } from "zod";

const readMany = z.array(TagDetailsSchema);
const create = TagDetailsSchema;
const getById = TagDetailsSchema.optional();
const update = TagDetailsSchema;
const addAllowedCategory = TagDetailsSchema;
const removeAllowedCategory = TagDetailsSchema;
const deleteTag = z.null();

export type TagResponse = {
  [Property in keyof typeof TagResponseSchema]: z.infer<
    (typeof TagResponseSchema)[Property]
  >;
};

export const TagResponseSchema = {
  getById,
  create,
  readMany,
  deleteTag,
  update,
  addAllowedCategory,
  removeAllowedCategory,
} as const;
