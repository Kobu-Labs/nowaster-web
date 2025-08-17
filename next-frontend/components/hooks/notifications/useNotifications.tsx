import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as NotificationApi from "@/api/notificationApi";
import {
  NotificationQueryRequest,
  MarkNotificationsSeenRequest,
} from "@/api/definitions/requests/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  counts: () => [...notificationKeys.all, "counts"] as const,
  unseen: (params?: { limit?: number }) =>
    [...notificationKeys.all, "unseen", params] as const,
  list: (params?: NotificationQueryRequest) =>
    [...notificationKeys.all, "list", params] as const,
};

export const useNotificationCounts = () => {
  return useQuery({
    queryKey: notificationKeys.counts(),
    queryFn: NotificationApi.getNotificationCounts,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};

export const useUnseenNotifications = (params?: { limit?: number }) => {
  return useQuery({
    queryKey: notificationKeys.unseen(params),
    queryFn: () => NotificationApi.getUnseenNotifications(params),
    staleTime: 60000,
  });
};

export const useNotifications = (params?: NotificationQueryRequest) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => NotificationApi.getNotifications(params),
    staleTime: 60000,
  });
};

export const useMarkNotificationsSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MarkNotificationsSeenRequest) =>
      NotificationApi.markNotificationsSeen(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.counts() });

      queryClient.setQueriesData(
        { queryKey: notificationKeys.unseen() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter(
            (notification: any) =>
              !variables.notification_ids.includes(notification.id),
          );
        },
      );

      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((notification: any) =>
            variables.notification_ids.includes(notification.id)
              ? { ...notification, seen: true }
              : notification,
          );
        },
      );
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      NotificationApi.deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueriesData(
        { queryKey: notificationKeys.unseen() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter(
            (notification: any) => notification.id !== notificationId,
          );
        },
      );

      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter(
            (notification: any) => notification.id !== notificationId,
          );
        },
      );

      queryClient.invalidateQueries({ queryKey: notificationKeys.counts() });
    },
  });
};
