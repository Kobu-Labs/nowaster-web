import { UserSchema } from "@/api/definitions/models/user";
import { z } from "zod";

export const FriendshipSchema = z.object({
  id: z.string().uuid(),
  friend1: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  friend2: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  created_at: z.coerce.date(),
});

export const FriendRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

export const FriendRequestDirectionSchema = z.enum(["incoming", "outgoing"]);

export const FriendRequestSchema = z.object({
  id: z.string().uuid(),
  status: FriendRequestStatusSchema,
  requestor: UserSchema,
  recipient: UserSchema,
  created_at: z.coerce.date(),
  introduction_message: z.string().nullable(),
});

export type Friendship = z.infer<typeof FriendshipSchema>;
export type FriendRequest = z.infer<typeof FriendRequestSchema>;
export type FriendRequestStatus = z.infer<typeof FriendRequestStatusSchema>;
export type FriendRequestDirection = z.infer<
  typeof FriendRequestDirectionSchema
>;
