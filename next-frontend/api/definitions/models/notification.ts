import { CategoryWithIdSchema } from "@/api/definitions/models/category";
import {
  ReadFeedReactionSchema,
  ReadUserAvatarSchema,
} from "@/api/definitions/models/feed";
import { z } from "zod";
import { UserSchema } from "@/api/definitions/models/user";

export const NotificationSourceTypeSchema = z.enum(["user", "system"]);

export const NotificationTypeSchema = z.enum([
  "friend:new_request",
  "friend:request_accepted",
  "session:reaction_added",
  "system:new_release",
]);

export const FriendRequestDataSchema = z.object({
  requestor: ReadUserAvatarSchema,
  message: z.string().nullish(),
  request_id: z.string(),
});

export const FriendRequestAcceptedDataSchema = z.object({
  accepter: ReadUserAvatarSchema,
});

export const SessionReactionDataSchema = z
  .object({
    session_id: z.string(),
    session_start_time: z.coerce.date(),
    session_end_time: z.coerce.date(),

    session_category: CategoryWithIdSchema,
  })
  .and(ReadFeedReactionSchema);

export const SystemReleaseDataSchema = z.object({
  release_id: z.string(),
  title: z.string(),
  short_description: z.string().optional(),
});

export const SystemNotificationDataSchema = z.object({
  system_id: z.string(),
  system_name: z.string(),
});

export const NotificationSourceSchema = z.discriminatedUnion("source_type", [
  z.object({
    source_type: z.literal("user"),
    source_data: UserSchema,
  }),
  z.object({
    source_type: z.literal("system"),
    source_data: SystemNotificationDataSchema,
  }),
]);

export const NotificationDataSchema = z.discriminatedUnion(
  "notification_type",
  [
    z.object({
      notification_type: z.literal("friend:new_request"),
      data: FriendRequestDataSchema,
    }),
    z.object({
      notification_type: z.literal("friend:request_accepted"),
      data: FriendRequestAcceptedDataSchema,
    }),
    z.object({
      notification_type: z.literal("session:reaction_added"),
      data: SessionReactionDataSchema,
    }),
    z.object({
      notification_type: z.literal("system:new_release"),
      data: SystemReleaseDataSchema,
    }),
  ],
);

export const NotificationSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    seen: z.boolean(),
    created_at: z.coerce.date(),
  })
  .and(NotificationSourceSchema)
  .and(NotificationDataSchema);

export type NotificationSourceType = z.infer<
  typeof NotificationSourceTypeSchema
>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationSource = z.infer<typeof NotificationSourceSchema>;
export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

export type NewFriendRequestData = z.infer<typeof FriendRequestDataSchema>;
export type FriendRequestAcceptedData = z.infer<
  typeof FriendRequestAcceptedDataSchema
>;
export type SessionReactionAddedData = z.infer<
  typeof SessionReactionDataSchema
>;
export type NewReleaseData = z.infer<typeof SystemReleaseDataSchema>;
export type SystemNotificationData = z.infer<
  typeof SystemNotificationDataSchema
>;
