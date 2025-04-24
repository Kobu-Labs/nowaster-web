import { z } from "zod";

const remove = z.object({
  friendship_id: z.string().uuid(),
});

const read = z.null();

export const FriendRequestSchema = {
  read,
  remove,
};

export type FriendRequest = {
  [Property in keyof typeof FriendRequestSchema]: z.infer<
    (typeof FriendRequestSchema)[Property]
  >;
};
