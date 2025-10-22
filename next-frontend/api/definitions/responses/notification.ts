import { z } from "zod";
import { NotificationSchema } from "@/api/definitions/models/notification";

export const NotificationResponseSchema = {
  deleteNotification: z.null(),
  getNotifications: z.array(NotificationSchema),
  getUnseenNotifications: z.array(NotificationSchema),
  markNotificationsSeen: z.null(),
};

export type DeleteNotificationResponse = z.infer<
  typeof NotificationResponseSchema.deleteNotification
>;
export type GetNotificationsResponse = z.infer<
  typeof NotificationResponseSchema.getNotifications
>;
export type GetUnseenNotificationsResponse = z.infer<
  typeof NotificationResponseSchema.getUnseenNotifications
>;
export type MarkNotificationsSeenResponse = z.infer<
  typeof NotificationResponseSchema.markNotificationsSeen
>;
