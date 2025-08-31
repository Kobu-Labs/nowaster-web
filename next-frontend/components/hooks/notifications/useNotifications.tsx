/* eslint-disable perfectionist/sort-objects */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as NotificationApi from "@/api/notificationApi";
import type {
  MarkNotificationsSeenRequest,
  NotificationQueryRequest,
} from "@/api/definitions/requests/notification";
import type { Notification } from "@/api/definitions/models/notification";

export const useUnseenNotifications = (params?: { limit?: number }) => {
  return useQuery({
    queryFn: () => NotificationApi.getUnseenNotifications(params),
    queryKey: ["notifications", "unseen"],
    refetchInterval: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useNotifications = (params?: NotificationQueryRequest) => {
  return useQuery({
    queryFn: () => NotificationApi.getNotifications(params),
    queryKey: ["notifications"],
    staleTime: 60_000,
  });
};

export const useMarkNotificationsSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MarkNotificationsSeenRequest) =>
      NotificationApi.markNotificationsSeen(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "unseen"],
      });
      const previousNotifications = queryClient.getQueryData([
        "notifications",
        "unseen",
      ]);

      queryClient.setQueryData(
        ["notifications", "unseen"],
        (old?: Notification[]) => {
          if (!old) {
            return [];
          }

          return old.filter(
            (notification) =>
              !params.notification_ids.includes(notification.id),
          );
        },
      );

      return { previousNotifications };
    },
    onError: (_err, _addedReaction, context) => {
      queryClient.setQueryData(
        ["notifications", "unseen"],
        context?.previousNotifications,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unseen"],
      });
    },
  });
};
