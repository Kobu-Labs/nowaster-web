import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import { TagWithIdSchema } from "@/api/definitions/models/tag";
import { z } from "zod";

export const EventTypeSchema = z.enum([
  "session_completed",
  "session_started",
  "task_completed",
  "project_completed",
]);

export const ReadUserAvatarSchema = z.object({
  avatar_url: z.string().nullable(),
  id: z.string(),
  username: z.string(),
});

export const ReadFeedReactionSchema = z.object({
  created_at: z.coerce.date<Date>(),
  emoji: z.string(),
  id: z.uuid(),
  user: ReadUserAvatarSchema,
});

export const FeedSessionProjectSchema = z.object({
  color: z.string(),
  id: z.string().uuid(),
  name: z.string(),
});

export const FeedSessionTaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const SessionCompletedEventSchema = z.object({
  category: CategoryWithIdSchema.omit({ last_used_at: true }),
  description: z.string().nullish(),
  end_time: z.coerce.date<Date>(),
  project: FeedSessionProjectSchema.nullable().optional(),
  session_id: z.string(),
  start_time: z.coerce.date<Date>(),
  tags: z.array(TagWithIdSchema),
  task: FeedSessionTaskSchema.nullable().optional(),
});

export const FeedProjectSchema = z.object({
  color: z.string(),
  id: z.string().uuid(),
  image_url: z.string().nullable(),
  name: z.string(),
});

export const TaskCompletedEventSchema = z.object({
  hours_of_work: z.number(),
  project: FeedProjectSchema,
  task_description: z.string().nullable(),
  task_id: z.string().uuid(),
  task_name: z.string(),
});

export const TaskTimeBreakdownSchema = z.object({
  minutes: z.number(),
  task_id: z.string().uuid(),
  task_name: z.string(),
});

export const CategoryTimeBreakdownSchema = z.object({
  category_color: z.string(),
  category_id: z.string().uuid(),
  category_name: z.string(),
  minutes: z.number(),
});

export const ProjectCompletedEventSchema = z.object({
  categories_time_breakdown: z.array(CategoryTimeBreakdownSchema),
  project_color: z.string(),
  project_description: z.string().nullable(),
  project_id: z.string().uuid(),
  project_image_url: z.string().nullable(),
  project_name: z.string(),
  tasks_time_breakdown: z.array(TaskTimeBreakdownSchema),
});

export const SourceTypeMappingSchema = z.discriminatedUnion("source_type", [
  z.object({
    source_data: ReadUserAvatarSchema,
    source_type: z.literal("user"),
  }),
  z.object({
    source_data: z.number(),
    source_type: z.literal("placeholder"),
  }),
]);

export const EventTypeMappingSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_data: SessionCompletedEventSchema,
    event_type: z.literal("session_completed"),
  }),
  z.object({
    event_data: TaskCompletedEventSchema,
    event_type: z.literal("task_completed"),
  }),
  z.object({
    event_data: ProjectCompletedEventSchema,
    event_type: z.literal("project_completed"),
  }),
]);

export const ReadFeedEventSchema = z
  .object({
    created_at: z.coerce.date<Date>(),
    id: z.uuid(),
    reactions: z.array(ReadFeedReactionSchema),
  })
  .and(EventTypeMappingSchema.and(SourceTypeMappingSchema));

export const ReadFeedSubscriptionSchema = z
  .object({
    created_at: z.coerce.date<Date>(),
    id: z.uuid(),
    is_muted: z.boolean(),
    is_paused: z.boolean(),
  })
  .and(SourceTypeMappingSchema);

export const UpdateFeedSubscriptionSchema = z.object({
  is_muted: z.boolean().optional(),
  is_paused: z.boolean().optional(),
  subscription_id: z.uuid(),
});

export type EventTypeMapping = z.infer<typeof EventTypeMappingSchema>;
export type FeedEventType = z.infer<typeof EventTypeSchema>;
export type ReadFeedEvent = z.infer<typeof ReadFeedEventSchema>;
export type ReadFeedReaction = z.infer<typeof ReadFeedReactionSchema>;
export type ReadFeedSubscription = z.infer<typeof ReadFeedSubscriptionSchema>;
export type ReadUserAvatar = z.infer<typeof ReadUserAvatarSchema>;
export type UpdateFeedSubscription = z.infer<
  typeof UpdateFeedSubscriptionSchema
>;

export const FeedSourceTypeSchema = z.union([
  z.literal("user"),
  z.literal("placeholder"),
]);
export type FeedSourceType = z.infer<typeof FeedSourceTypeSchema>;
