import { FeedSourceTypeSchema } from "@/api/definitions/models/feed";
import { z } from "zod";

export const FeedQueryRequestSchema = z.object({
  cursor: z.coerce.date<Date>().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const CreateFeedReactionRequestSchema = z.object({
  feed_event_id: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

export const RemoveFeedReactionRequestSchema = z.object({
  feed_event_id: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

export const UpdateFeedSubscriptionRequestSchema = z.object({
  subscription_id: z.string().uuid(),
  is_muted: z.boolean().optional(),
  is_paused: z.boolean().optional(),
});

export const UnsubscribeRequestSchema = z.object({
  source_id: z.string(),
  source_type: FeedSourceTypeSchema,
});

export type FeedQueryRequest = z.infer<typeof FeedQueryRequestSchema>;
export type CreateFeedReactionRequest = z.infer<
  typeof CreateFeedReactionRequestSchema
>;
export type RemoveFeedReactionRequest = z.infer<
  typeof RemoveFeedReactionRequestSchema
>;
export type UpdateFeedSubscriptionRequest = z.infer<
  typeof UpdateFeedSubscriptionRequestSchema
>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
