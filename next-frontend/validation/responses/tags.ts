import { z } from "zod";
import { TagSchema } from "@/validation/models";
import { HasID } from "@/validation/utils";


export type ReadManyTagsResponse = z.infer<typeof readManyTagsResponseSchema>;
export type CreateTagResponse = z.infer<typeof createTagResponseSchema>;

export const readManyTagsResponseSchema = z.array(TagSchema.merge(HasID));
export const createTagResponseSchema = TagSchema.merge(HasID);
