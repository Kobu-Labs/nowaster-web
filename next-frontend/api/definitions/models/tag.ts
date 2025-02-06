import { HasID } from "@/api/definitions/utils";
import { z } from "zod";

export const TagSchema = z.object({
  label: z.string(),
  //INFO: temporary remove this: allowedCategories: z.array(CategorySchema),
});


export const TagWithIdSchema = TagSchema.merge(HasID);

export type Tag = z.infer<typeof TagSchema>
export type TagWithId = z.infer<typeof TagWithIdSchema>
