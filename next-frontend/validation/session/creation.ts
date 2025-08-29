import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import { z } from "zod";

export const sessionPrecursor = z.object({
  startTime: z.coerce.date<Date>(),
  endTime: z.coerce.date<Date>(),
  category: CategoryWithIdSchema.optional(),
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
});

export type SessionPrecursor = z.infer<typeof sessionPrecursor>;
