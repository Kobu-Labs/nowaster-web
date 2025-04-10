import {
  CategoryWithIdSchema,
} from "@/api/definitions/models/category";
import { z } from "zod";

export const CategoryResponseSchema = {
  create: CategoryWithIdSchema,
  readMany: z.array(CategoryWithIdSchema),
  readByName: CategoryWithIdSchema.nullable(),
  update: CategoryWithIdSchema,
  readById: CategoryWithIdSchema,
};

export type CategoryResponse = {
  [Property in keyof typeof CategoryResponseSchema]: z.infer<
    (typeof CategoryResponseSchema)[Property]
  >;
};
