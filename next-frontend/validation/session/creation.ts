import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import { z } from "zod";

export const sessionPrecursor = z
  .object({
    category: CategoryWithIdSchema.optional(),
    description: z.string().nullable(),
    endTime: z.coerce.date<Date>(),
    project: z.object({ id: z.string().uuid() }).nullish(),
    session_type: z.literal("fixed"),
    startTime: z.coerce.date<Date>(),
    tags: z.array(TagWithIdSchema),
    task: z.object({ id: z.string().uuid() }).nullish(),
  })
  .partial();

export type SessionPrecursor = z.infer<typeof sessionPrecursor>;
