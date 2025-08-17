import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { NotificationResponseSchema } from "@/api/definitions/responses/notification";
import {
  NotificationQueryRequest,
  MarkNotificationsSeenRequest,
} from "@/api/definitions/requests/notification";

const BASE_URL = "/notifications";

export const getNotifications = async (params?: NotificationQueryRequest) => {
  const { data } = await baseApi.get(BASE_URL, {
    params: params,
  });
  return await parseResponseUnsafe(data, NotificationResponseSchema.getNotifications);
};

export const getUnseenNotifications = async (params?: { limit?: number }) => {
  const { data } = await baseApi.get(`${BASE_URL}/unseen`, {
    params: params,
  });
  return await parseResponseUnsafe(data, NotificationResponseSchema.getUnseenNotifications);
};

export const markNotificationsSeen = async (params: MarkNotificationsSeenRequest) => {
  const { data } = await baseApi.post(`${BASE_URL}/mark_seen`, params);
  return await parseResponseUnsafe(data, NotificationResponseSchema.markNotificationsSeen);
};

export const deleteNotification = async (notificationId: string) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${notificationId}`);
  return await parseResponseUnsafe(data, NotificationResponseSchema.deleteNotification);
};
