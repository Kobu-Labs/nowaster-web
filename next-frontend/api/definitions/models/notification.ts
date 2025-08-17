import { z } from "zod";
import { UserSchema } from "./user";

// Notification source types
export const NotificationSourceTypeSchema = z.enum(["user", "group", "system"]);

// Notification scoped types
export const NotificationTypeSchema = z.enum([
  "friend:new_request",
  "friend:request_accepted",
  "friend:request_declined",
  "session:reaction_added",
  "session:comment_added",
  "session:completed_milestone",
  "group:invite_received",
  "group:member_joined",
  "group:announcement",
  "system:new_release",
  "system:maintenance_alert",
  "system:feature_announcement",
  "system:security_notice",
]);

// Data schemas for specific notification types
export const FriendRequestDataSchema = z.object({
  requester_username: z.string(),
  message: z.string().optional(),
});

export const FriendRequestAcceptedDataSchema = z.object({
  accepter_username: z.string(),
});

export const FriendRequestDeclinedDataSchema = z.object({
  decliner_username: z.string(),
});

export const SessionReactionDataSchema = z.object({
  reactor_username: z.string(),
  session_id: z.string(),
  session_description: z.string().optional(),
  emoji: z.string(),
});

export const SessionCommentDataSchema = z.object({
  commenter_username: z.string(),
  session_id: z.string(),
  session_description: z.string().optional(),
  comment_preview: z.string(),
});

export const SessionMilestoneDataSchema = z.object({
  milestone_type: z.string(),
  session_id: z.string(),
  achievement_description: z.string(),
});

export const GroupInviteDataSchema = z.object({
  group_name: z.string(),
  inviter_username: z.string(),
  message: z.string().optional(),
});

export const GroupMemberJoinedDataSchema = z.object({
  group_name: z.string(),
  member_username: z.string(),
});

export const GroupAnnouncementDataSchema = z.object({
  group_name: z.string(),
  title: z.string(),
  preview: z.string(),
});

export const SystemReleaseDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
});

export const SystemMaintenanceDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  scheduled_time: z.string().optional(), // ISO date string
  duration_estimate: z.string().optional(),
});

export const SystemFeatureDataSchema = z.object({
  feature_name: z.string(),
  description: z.string(),
  call_to_action: z.string().optional(),
});

export const SystemSecurityDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  action_required: z.boolean(),
  severity: z.string(),
});

// Group and system source schemas
export const ReadGroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const SystemNotificationDataSchema = z.object({
  system_id: z.string(),
  system_name: z.string(),
});

// Main notification schemas
export const NotificationSourceSchema = z.discriminatedUnion("source_type", [
  z.object({
    source_type: z.literal("user"),
    source_data: UserSchema,
  }),
  z.object({
    source_type: z.literal("group"),
    source_data: ReadGroupDtoSchema,
  }),
  z.object({
    source_type: z.literal("system"),
    source_data: SystemNotificationDataSchema,
  }),
]);

export const NotificationDataSchema = z.discriminatedUnion("notification_type", [
  z.object({
    notification_type: z.literal("friend:new_request"),
    data: FriendRequestDataSchema,
  }),
  z.object({
    notification_type: z.literal("friend:request_accepted"),
    data: FriendRequestAcceptedDataSchema,
  }),
  z.object({
    notification_type: z.literal("friend:request_declined"),
    data: FriendRequestDeclinedDataSchema,
  }),
  z.object({
    notification_type: z.literal("session:reaction_added"),
    data: SessionReactionDataSchema,
  }),
  z.object({
    notification_type: z.literal("session:comment_added"),
    data: SessionCommentDataSchema,
  }),
  z.object({
    notification_type: z.literal("session:completed_milestone"),
    data: SessionMilestoneDataSchema,
  }),
  z.object({
    notification_type: z.literal("group:invite_received"),
    data: GroupInviteDataSchema,
  }),
  z.object({
    notification_type: z.literal("group:member_joined"),
    data: GroupMemberJoinedDataSchema,
  }),
  z.object({
    notification_type: z.literal("group:announcement"),
    data: GroupAnnouncementDataSchema,
  }),
  z.object({
    notification_type: z.literal("system:new_release"),
    data: SystemReleaseDataSchema,
  }),
  z.object({
    notification_type: z.literal("system:maintenance_alert"),
    data: SystemMaintenanceDataSchema,
  }),
  z.object({
    notification_type: z.literal("system:feature_announcement"),
    data: SystemFeatureDataSchema,
  }),
  z.object({
    notification_type: z.literal("system:security_notice"),
    data: SystemSecurityDataSchema,
  }),
]);

export const NotificationSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    seen: z.boolean(),
    created_at: z.string(), // ISO date string
  })
  .and(NotificationSourceSchema)
  .and(NotificationDataSchema);

export const NotificationCountSchema = z.object({
  unseen_count: z.number(),
  total_count: z.number(),
});

// Type exports
export type NotificationSourceType = z.infer<typeof NotificationSourceTypeSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationSource = z.infer<typeof NotificationSourceSchema>;
export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationCount = z.infer<typeof NotificationCountSchema>;

// Data type exports
export type FriendRequestData = z.infer<typeof FriendRequestDataSchema>;
export type FriendRequestAcceptedData = z.infer<typeof FriendRequestAcceptedDataSchema>;
export type FriendRequestDeclinedData = z.infer<typeof FriendRequestDeclinedDataSchema>;
export type SessionReactionData = z.infer<typeof SessionReactionDataSchema>;
export type SessionCommentData = z.infer<typeof SessionCommentDataSchema>;
export type SessionMilestoneData = z.infer<typeof SessionMilestoneDataSchema>;
export type GroupInviteData = z.infer<typeof GroupInviteDataSchema>;
export type GroupMemberJoinedData = z.infer<typeof GroupMemberJoinedDataSchema>;
export type GroupAnnouncementData = z.infer<typeof GroupAnnouncementDataSchema>;
export type SystemReleaseData = z.infer<typeof SystemReleaseDataSchema>;
export type SystemMaintenanceData = z.infer<typeof SystemMaintenanceDataSchema>;
export type SystemFeatureData = z.infer<typeof SystemFeatureDataSchema>;
export type SystemSecurityData = z.infer<typeof SystemSecurityDataSchema>;
export type ReadGroupDto = z.infer<typeof ReadGroupDtoSchema>;
export type SystemNotificationData = z.infer<typeof SystemNotificationDataSchema>;