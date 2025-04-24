import { FriendRequestDirectionSchema } from "@/api/definitions/models/friendship";
import { z } from "zod";

const create = z.object({
  recipient_name: z.string(),
  introduction_message: z.string().optional(),
});

const accept = z.object({
  request_id: z.string().uuid(),
  status: z.literal("accepted"),
});

const reject = z.object({
  request_id: z.string().uuid(),
  status: z.literal("rejected"),
});

const cancel = z.object({
  request_id: z.string().uuid(),
  status: z.literal("cancelled"),
});

const read = z.object({
  direction: FriendRequestDirectionSchema,
});

export const FriendRequestRequestSchema = {
  update: accept.or(reject).or(cancel),
  create,
  read,
};

export type FriendRequestRequest = {
  [Property in keyof typeof FriendRequestRequestSchema]: z.infer<
    (typeof FriendRequestRequestSchema)[Property]
  >;
};
