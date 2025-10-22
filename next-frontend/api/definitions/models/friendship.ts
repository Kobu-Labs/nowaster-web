import { UserSchema } from "@/api/definitions/models/user";
import { z } from "zod";

export const FriendshipSchema = z.object({
  created_at: z.coerce.date<Date>(),
  friend1: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  friend2: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  id: z.uuid(),
});

export const FriendRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

export const FriendRequestDirectionSchema = z.enum(["incoming", "outgoing"]);

export const FriendRequestSchema = z.object({
  created_at: z.coerce.date<Date>(),
  id: z.uuid(),
  introduction_message: z.string().nullable(),
  recipient: UserSchema,
  requestor: UserSchema,
  status: FriendRequestStatusSchema,
});

export type FriendRequest = z.infer<typeof FriendRequestSchema>;
export type FriendRequestDirection = z.infer<
  typeof FriendRequestDirectionSchema
>;
export type FriendRequestStatus = z.infer<typeof FriendRequestStatusSchema>;
export type Friendship = z.infer<typeof FriendshipSchema>;
