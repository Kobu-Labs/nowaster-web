import { CategorySchema } from "@/api/definitions/models/category";
import { z } from "zod";

export const CategoryResponseSchema = {
  create: CategorySchema,
  readMany: z.array(CategorySchema),
  readByName: CategorySchema.nullable(),
  update: CategorySchema,
};

export type CategoryResponse = {
    [Property in (keyof typeof CategoryResponseSchema)]: z.infer<typeof CategoryResponseSchema[Property]>;
};

