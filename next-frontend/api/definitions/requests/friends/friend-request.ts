import { FriendRequestDirectionSchema } from "@/api/definitions/models/friendship";
import { z } from "zod";

const create = z.object({
  introduction_message: z.string().optional(),
  recipient_name: z.string(),
});

const accept = z.object({
  request_id: z.uuid(),
  status: z.literal("accepted"),
});

const reject = z.object({
  request_id: z.uuid(),
  status: z.literal("rejected"),
});

const cancel = z.object({
  request_id: z.uuid(),
  status: z.literal("cancelled"),
});

const read = z.object({
  direction: FriendRequestDirectionSchema,
});

export const FriendRequestRequestSchema = {
  create,
  read,
  update: accept.or(reject).or(cancel),
};

export type FriendRequestRequest = {
  [Property in keyof typeof FriendRequestRequestSchema]: z.infer<
    (typeof FriendRequestRequestSchema)[Property]
  >;
};
