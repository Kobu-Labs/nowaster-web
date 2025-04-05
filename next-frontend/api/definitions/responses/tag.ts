import { TagDetailsSchema } from "@/api/definitions/models";
import { z } from "zod";

const readMany = z.array(TagDetailsSchema);
const create = TagDetailsSchema;
const update = TagDetailsSchema;
const addAllowedCategory = TagDetailsSchema;
const removeAllowedCategory = TagDetailsSchema;

export type TagResponse = {
  [Property in keyof typeof TagResponseSchema]: z.infer<
    (typeof TagResponseSchema)[Property]
  >;
};

export const TagResponseSchema = {
  create,
  readMany,
  update,
  addAllowedCategory,
  removeAllowedCategory,
} as const;
