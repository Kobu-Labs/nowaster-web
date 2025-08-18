import { FriendRequestAcceptedData } from "@/api/definitions/models/notification";
import { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { UserCheck } from "lucide-react";
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
      onClick={props.onClick}
    >
      <div className="flex-shrink-0 mt-1">
        <UserCheck className="h-5 w-5 text-green-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            Friend request accepted
          </p>
          <div className="flex items-center gap-2 ml-2">
            {!props.notification.seen && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" />
            )}
          </div>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {props.data.accepter.username} accepted your friend request
        </p>

        <p className="text-xs mt-2">
          {formatDistanceToNow(new Date(props.notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};
