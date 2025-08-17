import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as NotificationApi from "@/api/notificationApi";
import {
  NotificationQueryRequest,
  MarkNotificationsSeenRequest,
} from "@/api/definitions/requests/notification";
import { Notification } from "@/api/definitions/models/notification";

export const useUnseenNotifications = (params?: { limit?: number }) => {
  return useQuery({
    queryKey: ["notifications", "unseen"],
    queryFn: () => NotificationApi.getUnseenNotifications(params),
    refetchInterval: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useNotifications = (params?: NotificationQueryRequest) => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => NotificationApi.getNotifications(params),
    staleTime: 60000,
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
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unseen"],
      });
    },
    onError: (_err, _addedReaction, context) => {
      queryClient.setQueryData(
        ["notifications", "unseen"],
        context?.previousNotifications,
      );
    },
  });
};
