"use client";

import React, { FC, useCallback, useState } from "react";
import { useAtom } from "jotai";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { notificationPopoverOpenAtom } from "@/state/notifications";
import {
  useNotificationCounts,
  useUnseenNotifications,
  useMarkNotificationsSeen,
  useDeleteNotification,
} from "@/components/hooks/notifications/useNotifications";
import { Notification } from "@/api/definitions/models/notification";
import { NotificationItem } from "./NotificationItem";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

export const NotificationPopover: FC = () => {
  const [isOpen, setIsOpen] = useAtom(notificationPopoverOpenAtom);

  // React Query hooks
  const { data: counts, isLoading: countsLoading } = useNotificationCounts();
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useUnseenNotifications({ limit: 20 });

  const markSeenMutation = useMarkNotificationsSeen();
  const deleteMutation = useDeleteNotification();

  const unseenCount = counts?.unseen_count || 0;
  const isLoading = notificationsLoading || countsLoading;

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (notification.seen) return;

      markSeenMutation.mutate({
        notification_ids: [notification.id],
      });
    },
    [markSeenMutation],
  );

  const handleDeleteNotification = useCallback(
    (notificationId: string) => {
      deleteMutation.mutate(notificationId);
    },
    [deleteMutation],
  );

  const handleMarkAllSeen = useCallback(() => {
    const unseenNotifications = notifications.filter((n) => !n.seen);
    if (unseenNotifications.length === 0) return;

    markSeenMutation.mutate({
      notification_ids: unseenNotifications.map((n) => n.id),
    });
  }, [notifications, markSeenMutation]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unseenCount > 0 ? ` (${unseenCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5 hover:scale-110" />
          {unseenCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 text-accent text-xs font-medium rounded-full flex items-center justify-center",
                unseenCount > 0 && "animate-pulse",
              )}
            >
              {unseenCount > 99 ? "99+" : unseenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 border gradient-container"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b ">
          <h3 className="font-semibold text-lg text-accent">Notifications</h3>
          <div className="flex items-center gap-2">
            {unseenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllSeen}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 mb-2" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">
                We'll let you know when something happens!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => handleDeleteNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
