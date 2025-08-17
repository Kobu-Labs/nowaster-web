"use client";

import {
  NewFriendRequestData,
  NewReleaseData,
  Notification,
  NotificationType,
  SessionReactionAddedData,
} from "@/api/definitions/models/notification";
import { FriendRequestAcceptedNotificationItem } from "@/components/notifications/items/FriendRequestAcceptedNotification";
import { NewFriendRequestNotificationItem } from "@/components/notifications/items/NewFriendRequestNotification";
import { NewReleaseNotificationItem } from "@/components/notifications/items/NewReleaseNotification";
import { SessionReactionAddedNotificationItem } from "@/components/notifications/items/SessionReactionAddedNotification";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Heart, Megaphone, Rocket, UserPlus } from "lucide-react";
import { FC } from "react";

export type NotificationItemProps = {
  notification: Notification;
  onClick?: () => void;
  onDelete?: () => void;
};

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "friend:new_request":
    case "friend:request_accepted":
      return <UserPlus className="h-5 w-5 text-blue-500" />;

    case "session:reaction_added":
      return <Heart className="h-5 w-5 text-pink-500" />;

    case "system:new_release":
      return <Rocket className="h-5 w-5 text-indigo-500" />;

    default:
      return <Megaphone className="h-5 w-5 text-gray-500" />;
  }
}

function getNotificationTitle(notification: Notification): string {
  switch (notification.notification_type) {
    case "friend:new_request":
      return "New friend request";

    case "friend:request_accepted":
      return "Friend request accepted";

    case "session:reaction_added":
      return "Session reaction";

    case "system:new_release":
      return "New release available";
  }
}

function getNotificationMessage(notification: Notification): string {
  switch (notification.notification_type) {
    case "friend:new_request": {
      const data = notification.data as NewFriendRequestData;
      return `${data.requester_username} wants to be your friend${data.message ? `: "${data.message}"` : ""}`;
    }

    case "friend:request_accepted": {
      const data = notification.data as any; // FriendRequestAcceptedData
      return `${data.accepter_username} accepted your friend request`;
    }

    case "session:reaction_added": {
      const data = notification.data as SessionReactionAddedData;
      return `${data.reactor_username} reacted ${data.emoji} to your session${data.session_description ? `: "${data.session_description}"` : ""}`;
    }

    case "system:new_release": {
      const data = notification.data as NewReleaseData;
      return `${data.title} (v${data.version}) - ${data.description}`;
    }
  }
}

export const NotificationItem: FC<NotificationItemProps> = (props) => {
  const title = getNotificationTitle(props.notification);
  const message = getNotificationMessage(props.notification);
  const icon = getNotificationIcon(props.notification.notification_type);
  const timeAgo = formatDistanceToNow(new Date(props.notification.created_at), {
    addSuffix: true,
  });

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

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !notification.seen && "border-l-4 border-l-pink-400",
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">{icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">{title}</p>
          <div className="flex items-center gap-2 ml-2">
            {!notification.seen && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" />
            )}
          </div>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {message}
        </p>

        <p className="text-xs mt-2">{timeAgo}</p>
      </div>
    </div>
  );
};
