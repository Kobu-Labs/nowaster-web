import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import { z } from "zod";

export const sessionPrecursor = z.object({
  category: CategoryWithIdSchema.optional(),
  description: z.string().nullable(),
  endTime: z.coerce.date<Date>(),
  session_type: z.literal("fixed"),
  startTime: z.coerce.date<Date>(),
  tags: z.array(TagWithIdSchema),
});

export type SessionPrecursor = z.infer<typeof sessionPrecursor>;
