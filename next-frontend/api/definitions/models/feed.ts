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
  created_at: z.coerce.date<Date>(),
});

export const SessionCompletedEventSchema = z.object({
  session_id: z.string(),
  category: CategoryWithIdSchema.omit({ last_used_at: true }),
  tags: z.array(TagWithIdSchema),
  description: z.string().nullish(),
  start_time: z.coerce.date<Date>(),
  end_time: z.coerce.date<Date>(),
});

export const SourceTypeMappingSchema = z.discriminatedUnion("source_type", [
  z.object({
    source_type: z.literal("user"),
    source_data: ReadUserAvatarSchema,
  }),
  z.object({
    source_data: z.number(),
    source_type: z.literal("placeholder"),
  }),
]);

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
    created_at: z.coerce.date<Date>(),
    reactions: z.array(ReadFeedReactionSchema),
  })
  .and(EventTypeMappingSchema.and(SourceTypeMappingSchema));

export const ReadFeedSubscriptionSchema = z
  .object({
    id: z.string().uuid(),
    is_muted: z.boolean(),
    is_paused: z.boolean(),
    created_at: z.coerce.date<Date>(),
  })
  .and(SourceTypeMappingSchema);

export const UpdateFeedSubscriptionSchema = z.object({
  subscription_id: z.string().uuid(),
  is_muted: z.boolean().optional(),
  is_paused: z.boolean().optional(),
});

export type EventTypeMapping = z.infer<typeof EventTypeMappingSchema>;
export type FeedEventType = z.infer<typeof EventTypeSchema>;
export type ReadUserAvatar = z.infer<typeof ReadUserAvatarSchema>;
export type ReadFeedReaction = z.infer<typeof ReadFeedReactionSchema>;
export type ReadFeedEvent = z.infer<typeof ReadFeedEventSchema>;
export type ReadFeedSubscription = z.infer<typeof ReadFeedSubscriptionSchema>;
export type UpdateFeedSubscription = z.infer<
  typeof UpdateFeedSubscriptionSchema
>;

export const FeedSourceTypeSchema = z.union([
  z.literal("user"),
  z.literal("placeholder"),
]);
export type FeedSourceType = z.infer<typeof FeedSourceTypeSchema>;
