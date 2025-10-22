import { z } from "zod";

export const VisibilityFlagsSchema = z.object({
  friends: z.boolean(),
  groups: z.boolean(),
  isPrivate: z.boolean(),
  isPublic: z.boolean(),
  rawValue: z.number(),
});

export const UserSchema = z.object({
  avatarUrl: z.string().nullish(),
  id: z.string(),
  role: z.enum(["admin", "user"]).optional(),
  username: z.string().trim().min(1),
  visibilityFlags: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type VisibilityFlags = z.infer<typeof VisibilityFlagsSchema>;
