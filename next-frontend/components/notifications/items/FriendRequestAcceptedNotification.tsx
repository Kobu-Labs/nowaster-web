import { FriendRequestAcceptedData } from "@/api/definitions/models/notification";
import { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FC } from "react";

export const FriendRequestAcceptedNotificationItem: FC<
  NotificationItemProps & { data: FriendRequestAcceptedData }
> = (props) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
    >
      <UserAvatar
        username={props.data.accepter.username}
        avatar_url={props.data.accepter.avatar_url}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            Friend request accepted
          </p>
        </div>

        <div className="text-sm">
          <span className="text-accent/70">{props.data.accepter.username}</span>{" "}
          <span>accepted your friend request</span>
        </div>

        <p className="text-xs mt-2">
          {formatDistanceToNow(props.notification.created_at, {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};
