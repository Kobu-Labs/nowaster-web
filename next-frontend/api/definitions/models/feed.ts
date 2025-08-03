import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { z } from "zod";

export const EventTypeSchema = z.enum(["session_completed", "session_started"]);

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

export const SessionCompletedEventSchema = z.object({
  session_id: z.string(),
  category: CategoryWithIdSchema,
  tags: z.array(TagWithIdSchema),
  description: z.string().nullish(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
});

export const EventTypeMappingSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_type: z.literal("session_completed"),
    event_data: SessionCompletedEventSchema,
  }),
  z.object({
    event_data: z.number(),
    event_type: z.literal("session_updated"),
  }),
]);

export const ReadFeedEventSchema = z
  .object({
    id: z.string().uuid(),
    user: ReadUserAvatarSchema,
    created_at: z.coerce.date(),
    reactions: z.array(ReadFeedReactionSchema),
  })
  .and(EventTypeMappingSchema);

export type EventTypeMapping = z.infer<typeof EventTypeMappingSchema>;
export type FeedEventType = z.infer<typeof EventTypeSchema>;
export type ReadUserAvatar = z.infer<typeof ReadUserAvatarSchema>;
export type ReadFeedReaction = z.infer<typeof ReadFeedReactionSchema>;
export type ReadFeedEvent = z.infer<typeof ReadFeedEventSchema>;
