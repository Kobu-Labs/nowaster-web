import { z } from "zod";
import { UserSchema } from "./user";

export const NotificationSourceTypeSchema = z.enum(["user", "system"]);

export const NotificationTypeSchema = z.enum([
  "friend:new_request",
  "friend:request_accepted",
  "session:reaction_added",
  "system:new_release",
]);

export const FriendRequestDataSchema = z.object({
  requester_username: z.string(),
  message: z.string().optional(),
});

export const FriendRequestAcceptedDataSchema = z.object({
  accepter_username: z.string(),
});

export const SessionReactionDataSchema = z.object({
  reactor_username: z.string(),
  session_id: z.string(),
  session_description: z.string().optional(),
  emoji: z.string(),
});

export const SystemReleaseDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
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
    created_at: z.string(),
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

export type FriendRequestData = z.infer<typeof FriendRequestDataSchema>;
export type FriendRequestAcceptedData = z.infer<
  typeof FriendRequestAcceptedDataSchema
>;
export type SessionReactionData = z.infer<typeof SessionReactionDataSchema>;
export type SystemReleaseData = z.infer<typeof SystemReleaseDataSchema>;
export type SystemNotificationData = z.infer<
  typeof SystemNotificationDataSchema
>;
