import { FeedSourceTypeSchema } from "@/api/definitions/models/feed";
import { z } from "zod";

export const FeedQueryRequestSchema = z.object({
  cursor: z.coerce.date<Date>().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const CreateFeedReactionRequestSchema = z.object({
  emoji: z.string().min(1).max(10),
  feed_event_id: z.uuid(),
});

export const RemoveFeedReactionRequestSchema = z.object({
  emoji: z.string().min(1).max(10),
  feed_event_id: z.uuid(),
});

export const UpdateFeedSubscriptionRequestSchema = z.object({
  is_muted: z.boolean().optional(),
  is_paused: z.boolean().optional(),
  subscription_id: z.uuid(),
});

export const UnsubscribeRequestSchema = z.object({
  source_id: z.string(),
  source_type: FeedSourceTypeSchema,
});

export type CreateFeedReactionRequest = z.infer<
  typeof CreateFeedReactionRequestSchema
>;
export type FeedQueryRequest = z.infer<typeof FeedQueryRequestSchema>;
export type RemoveFeedReactionRequest = z.infer<
  typeof RemoveFeedReactionRequestSchema
>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type UpdateFeedSubscriptionRequest = z.infer<
  typeof UpdateFeedSubscriptionRequestSchema
>;
