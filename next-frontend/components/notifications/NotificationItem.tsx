"use client";

import { Notification } from "@/api/definitions/models/notification";
import { FriendRequestAcceptedNotificationItem } from "@/components/notifications/items/FriendRequestAcceptedNotification";
import { NewFriendRequestNotificationItem } from "@/components/notifications/items/NewFriendRequestNotification";
import { NewReleaseNotificationItem } from "@/components/notifications/items/NewReleaseNotification";
import { SessionReactionAddedNotificationItem } from "@/components/notifications/items/SessionReactionAddedNotification";
import { FC } from "react";

export type NotificationItemProps = {
  notification: Notification;
  onClick?: () => void;
  onDelete?: () => void;
};

export const NotificationItem: FC<NotificationItemProps> = (props) => {
  switch (props.notification.notification_type) {
    case "friend:new_request":
      return (
        <NewFriendRequestNotificationItem
          data={props.notification.data}
          {...props}
        />
      );
    case "friend:request_accepted":
      return (
        <FriendRequestAcceptedNotificationItem
          data={props.notification.data}
          {...props}
        />
      );
    case "session:reaction_added":
      return (
        <SessionReactionAddedNotificationItem
          data={props.notification.data}
          {...props}
        />
      );
    case "system:new_release":
      return (
        <NewReleaseNotificationItem data={props.notification.data} {...props} />
      );
  }
};
