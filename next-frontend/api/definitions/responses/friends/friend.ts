import { FriendshipSchema } from "@/api/definitions/models/friendship";
import { z } from "zod";

export const FriendResponseSchema = {
  read: z.array(FriendshipSchema),
  remove: z.null(),
};

export type FriendResponse = {
  [Property in keyof typeof FriendResponseSchema]: z.infer<
    (typeof FriendResponseSchema)[Property]
  >;
};
