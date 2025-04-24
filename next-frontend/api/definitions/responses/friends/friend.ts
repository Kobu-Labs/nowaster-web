import { FriendshipSchema } from "@/api/definitions/models/friendship";
import { z } from "zod";

export const FriendResponseSchema = {
  remove: z.null(),
  read: z.array(FriendshipSchema),
};

export type FriendResponse = {
  [Property in keyof typeof FriendResponseSchema]: z.infer<
    (typeof FriendResponseSchema)[Property]
  >;
};
