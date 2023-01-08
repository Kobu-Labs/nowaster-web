import { z } from "zod";

export const GroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 chars long")
    .max(20, "Group name must not be longer than 20 chars"),
  isInviteOnly: z.boolean(),
});
