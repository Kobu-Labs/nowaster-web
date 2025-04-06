import { FriendRequestSchema } from "@/api/definitions/models/friendship";
import { z } from "zod";

export const FriendRequestResponseSchema = {
  update: FriendRequestSchema,
  create: FriendRequestSchema,
  read: z.array(FriendRequestSchema),
};

export type FriendRequestResponse = {
  [Property in keyof typeof FriendRequestResponseSchema]: z.infer<
    (typeof FriendRequestResponseSchema)[Property]
  >;
};
