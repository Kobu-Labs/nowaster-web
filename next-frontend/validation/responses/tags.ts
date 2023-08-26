import { z } from "zod";
import { TagSchema } from "../models";
import { HasID } from "../utils";


export type ReadManyTagsResponse = z.infer<typeof readManyTagsResponseSchema>;

export const readManyTagsResponseSchema = z.array(TagSchema.merge(HasID))
