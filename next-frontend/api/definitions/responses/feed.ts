import { ReadFeedEventSchema, ReadFeedSubscriptionSchema } from "@/api/definitions/models/feed";
import { z } from "zod";

export const FeedResponseSchema = {
  getFeed: z.array(ReadFeedEventSchema),
  addReaction: z.null(),
  removeReaction: z.null(),
  getSubscriptions: z.array(ReadFeedSubscriptionSchema),
  updateSubscription: z.null(),
  unsubscribe: z.null(),
};

export type FeedResponse = {
  [Property in keyof typeof FeedResponseSchema]: z.infer<
    (typeof FeedResponseSchema)[Property]
  >;
};