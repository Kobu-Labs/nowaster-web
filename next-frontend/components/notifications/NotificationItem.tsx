"use client";

import {
  Notification,
  SessionReactionAddedData,
} from "@/api/definitions/models/notification";
import { FriendRequestAcceptedNotificationItem } from "@/components/notifications/items/FriendRequestAcceptedNotification";
import { NewFriendRequestNotificationItem } from "@/components/notifications/items/NewFriendRequestNotification";
import { NewReleaseNotificationItem } from "@/components/notifications/items/NewReleaseNotification";
import { SessionReactionAddedNotificationItem } from "@/components/notifications/items/SessionReactionAddedNotification";
import { FC } from "react";

type NotificationHandlerProps = {
  notifications: Notification[];
};

export type NotificationItemProps = {
  notification: Notification;
};

export const NotificationsHandler: FC<NotificationHandlerProps> = (props) => {
  const genericNotifications: Notification[] = [];
  const sessionReactionNotifications: {
    [session_id: string]: {
      notification: Notification & {
        data: SessionReactionAddedData;
      };
    }[];
  } = {};

  props.notifications.forEach((n) => {
    if (n.notification_type === "session:reaction_added") {
      if (sessionReactionNotifications[n.data.session_id]) {
        sessionReactionNotifications[n.data.session_id]?.push({
          notification: n,
        });
      } else {
        sessionReactionNotifications[n.data.session_id] = [
          {
            notification: n,
          },
        ];
      }
    } else {
      genericNotifications.push(n);
    }
  });

  return (
    <div className="divide-y">
      {genericNotifications.map((notification) => (
        <NotificationsRegistry
          key={notification.id}
          notification={notification}
        />
      ))}
      {Object.entries(sessionReactionNotifications).map(
        ([session_id, notif]) => (
          <SessionReactionAddedNotificationItem
            notifications={notif}
            sessionId={session_id}
          />
        ),
      )}
    </div>
  );
};

const NotificationsRegistry: FC<NotificationItemProps> = (props) => {
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
      // INFO: handled by NotificationsHandler
      return null;
    case "system:new_release":
      return (
        <NewReleaseNotificationItem data={props.notification.data} {...props} />
      );
  }
};
