import { SessionReactionAddedData } from "@/api/definitions/models/notification";
import { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { FC } from "react";

export const SessionReactionAddedNotificationItem: FC<
  NotificationItemProps & { data: SessionReactionAddedData }
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
        <Heart className="h-5 w-5 text-pink-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            New reaction
          </p>
          <div className="flex items-center gap-2 ml-2">
            {!props.notification.seen && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" />
            )}
          </div>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {props.data.user.username} reacted {props.data.emoji} to your{" "}
          {props.data.session_category.name.toLowerCase()} session from{" "}
          {props.data.session_start_time.toLocaleString()}
        </p>

        <p className="text-xs mt-2">
          {formatDistanceToNow(props.notification.created_at, {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};
