import { HasID } from "@/validation/utils";
import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

export const CategoryWithIdSchema = CategorySchema.merge(HasID);

export type Category = z.infer<typeof CategorySchema>
export type CategoryWithId = z.infer<typeof CategoryWithIdSchema>
