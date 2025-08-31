import { ReadFeedEventSchema, ReadFeedSubscriptionSchema } from "@/api/definitions/models/feed";
import { z } from "zod";

export const FeedResponseSchema = {
  addReaction: z.null(),
  getFeed: z.array(ReadFeedEventSchema),
  getSubscriptions: z.array(ReadFeedSubscriptionSchema),
  removeReaction: z.null(),
  unsubscribe: z.null(),
  updateSubscription: z.null(),
};

export type FeedResponse = {
  [Property in keyof typeof FeedResponseSchema]: z.infer<
    (typeof FeedResponseSchema)[Property]
  >;
};
