import { z } from "zod";
import { NotificationSchema, NotificationCountSchema } from "../models/notification";

export const NotificationResponseSchema = {
  getNotifications: z.array(NotificationSchema),
  getUnseenNotifications: z.array(NotificationSchema),
  getNotificationCounts: NotificationCountSchema,
  markNotificationsSeen: z.null(),
  deleteNotification: z.null(),
};

export type GetNotificationsResponse = z.infer<typeof NotificationResponseSchema.getNotifications>;
export type GetUnseenNotificationsResponse = z.infer<typeof NotificationResponseSchema.getUnseenNotifications>;
export type GetNotificationCountsResponse = z.infer<typeof NotificationResponseSchema.getNotificationCounts>;
export type MarkNotificationsSeenResponse = z.infer<typeof NotificationResponseSchema.markNotificationsSeen>;
export type DeleteNotificationResponse = z.infer<typeof NotificationResponseSchema.deleteNotification>;
