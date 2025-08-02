import { z } from "zod";

export const FeedEventTypeSchema = z.enum(["session_completed", "session_started"]);

export const ReadUserAvatarSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable(),
});

export const ReadFeedReactionSchema = z.object({
  id: z.string().uuid(),
  user: ReadUserAvatarSchema,
  emoji: z.string(),
  created_at: z.coerce.date(),
});

export const ReadFeedEventSchema = z.object({
  id: z.string().uuid(),
  user: ReadUserAvatarSchema,
  event_type: FeedEventTypeSchema,
  event_data: z.any(), // JSON data varies by event type
  created_at: z.coerce.date(),
  reactions: z.array(ReadFeedReactionSchema),
  user_reaction: z.string().nullable(),
});

export type FeedEventType = z.infer<typeof FeedEventTypeSchema>;
export type ReadUserAvatar = z.infer<typeof ReadUserAvatarSchema>;
export type ReadFeedReaction = z.infer<typeof ReadFeedReactionSchema>;
export type ReadFeedEvent = z.infer<typeof ReadFeedEventSchema>;
