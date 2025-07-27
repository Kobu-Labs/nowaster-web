import { TagDetailsSchema, TagWithIdSchema } from "@/api/definitions/models";
import { z } from "zod";

const readMany = z.array(TagDetailsSchema);
const create = TagDetailsSchema;
const getById = TagDetailsSchema.optional();
const update = TagDetailsSchema;
const addAllowedCategory = TagDetailsSchema;
const removeAllowedCategory = TagDetailsSchema;
const deleteTag = z.null();
const statistics = z.object({
  total_tags: z.number(),
  total_usages: z.number(),
  average_usages_per_tag: z.number(),
  most_used_tag: TagWithIdSchema.nullable(),
});

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
  statistics,
} as const;
