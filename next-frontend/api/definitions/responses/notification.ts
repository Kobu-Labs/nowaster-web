import { z } from "zod";
import { NotificationSchema } from "../models/notification";

export const NotificationResponseSchema = {
  getNotifications: z.array(NotificationSchema),
  getUnseenNotifications: z.array(NotificationSchema),
  markNotificationsSeen: z.null(),
  deleteNotification: z.null(),
};

export type GetNotificationsResponse = z.infer<
  typeof NotificationResponseSchema.getNotifications
>;
export type GetUnseenNotificationsResponse = z.infer<
  typeof NotificationResponseSchema.getUnseenNotifications
>;
export type MarkNotificationsSeenResponse = z.infer<
  typeof NotificationResponseSchema.markNotificationsSeen
>;
export type DeleteNotificationResponse = z.infer<
  typeof NotificationResponseSchema.deleteNotification
>;
