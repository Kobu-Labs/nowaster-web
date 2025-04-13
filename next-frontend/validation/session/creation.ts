import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import { z } from "zod";

export const sessionPrecursor = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  category: CategoryWithIdSchema.optional(),
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
});

export type SessionPrecursor = z.infer<typeof sessionPrecursor>;
