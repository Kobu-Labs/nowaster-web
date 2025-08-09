import { z } from "zod";

export const VisibilityFlagsSchema = z.object({
  friends: z.boolean(),
  groups: z.boolean(),
  isPrivate: z.boolean(),
  isPublic: z.boolean(),
  rawValue: z.number(),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().trim().min(1),
  visibilityFlags: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type VisibilityFlags = z.infer<typeof VisibilityFlagsSchema>;
