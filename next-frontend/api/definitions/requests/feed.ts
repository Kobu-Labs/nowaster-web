import { z } from "zod";

export const FeedQueryRequestSchema = z.object({
  cursor: z.coerce.date().optional(),
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

export type FeedQueryRequest = z.infer<typeof FeedQueryRequestSchema>;
export type CreateFeedReactionRequest = z.infer<typeof CreateFeedReactionRequestSchema>;
export type RemoveFeedReactionRequest = z.infer<typeof RemoveFeedReactionRequestSchema>;
