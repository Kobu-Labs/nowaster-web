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
  "admin:sandbox:failed-deploy",
  "admin:backup:completed",
  "admin:backup:failed",
]);

export const FriendRequestDataSchema = z.object({
  message: z.string().nullish(),
  request_id: z.string(),
  requestor: ReadUserAvatarSchema,
});

export const FriendRequestAcceptedDataSchema = z.object({
  accepter: ReadUserAvatarSchema,
});

export const SessionReactionDataSchema = z
  .object({
    session_category: CategoryWithIdSchema,
    session_end_time: z.coerce.date<Date>(),
    session_id: z.string(),

    session_start_time: z.coerce.date<Date>(),
  })
  .and(ReadFeedReactionSchema);

export const SystemReleaseDataSchema = z.object({
  release_id: z.string(),
  short_description: z.string().optional(),
  title: z.string(),
});

export const SystemNotificationDataSchema = z.object({
  system_id: z.string(),
  system_name: z.string(),
});

export const SandboxFailedDeployDataSchema = z.object({
  sandbox_lifecycle_id: z.string().uuid(),
});

export const BackupCompletedDataSchema = z.object({
  backup_id: z.number(),
  backup_size_bytes: z.number().nullable(),
  duration_seconds: z.number().nullable(),
  started_at: z.coerce.date().nullable(),
});

export const BackupFailedDataSchema = z.object({
  backup_id: z.number(),
  duration_seconds: z.number().nullable(),
  error_message: z.string().nullable(),
  started_at: z.coerce.date().nullable(),
});

export const NotificationSourceSchema = z.discriminatedUnion("source_type", [
  z.object({
    source_data: UserSchema,
    source_type: z.literal("user"),
  }),
  z.object({
    source_data: SystemNotificationDataSchema,
    source_type: z.literal("system"),
  }),
]);

export const NotificationDataSchema = z.discriminatedUnion(
  "notification_type",
  [
    z.object({
      data: FriendRequestDataSchema,
      notification_type: z.literal("friend:new_request"),
    }),
    z.object({
      data: FriendRequestAcceptedDataSchema,
      notification_type: z.literal("friend:request_accepted"),
    }),
    z.object({
      data: SessionReactionDataSchema,
      notification_type: z.literal("session:reaction_added"),
    }),
    z.object({
      data: SystemReleaseDataSchema,
      notification_type: z.literal("system:new_release"),
    }),
    z.object({
      data: SandboxFailedDeployDataSchema,
      notification_type: z.literal("admin:sandbox:failed-deploy"),
    }),
    z.object({
      data: BackupCompletedDataSchema,
      notification_type: z.literal("admin:backup:completed"),
    }),
    z.object({
      data: BackupFailedDataSchema,
      notification_type: z.literal("admin:backup:failed"),
    }),
  ],
);

export const NotificationSchema = z
  .object({
    created_at: z.coerce.date<Date>(),
    id: z.string(),
    seen: z.boolean(),
    user_id: z.string(),
  })
  .and(NotificationSourceSchema)
  .and(NotificationDataSchema);

export type BackupCompletedData = z.infer<typeof BackupCompletedDataSchema>;
export type BackupFailedData = z.infer<typeof BackupFailedDataSchema>;
export type FriendRequestAcceptedData = z.infer<
  typeof FriendRequestAcceptedDataSchema
>;
export type NewFriendRequestData = z.infer<typeof FriendRequestDataSchema>;
export type NewReleaseData = z.infer<typeof SystemReleaseDataSchema>;

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type NotificationSource = z.infer<typeof NotificationSourceSchema>;
export type NotificationSourceType = z.infer<
  typeof NotificationSourceTypeSchema
>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type SandboxFailedDeployData = z.infer<
  typeof SandboxFailedDeployDataSchema
>;
export type SessionReactionAddedData = z.infer<
  typeof SessionReactionDataSchema
>;
export type SystemNotificationData = z.infer<
  typeof SystemNotificationDataSchema
>;
