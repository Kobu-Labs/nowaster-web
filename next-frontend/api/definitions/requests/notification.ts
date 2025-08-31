import { z } from "zod";

export const NotificationQueryRequestSchema = z.object({
  cursor: z.string().optional(), // ISO date string
  limit: z.number().optional(),
  seen: z.boolean().optional(),
});

export const MarkNotificationsSeenRequestSchema = z.object({
  notification_ids: z.array(z.string()).min(1).max(100),
});

export type MarkNotificationsSeenRequest = z.infer<typeof MarkNotificationsSeenRequestSchema>;
export type NotificationQueryRequest = z.infer<typeof NotificationQueryRequestSchema>;
