import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().trim().min(1),
});

export type User = z.infer<typeof UserSchema>;
