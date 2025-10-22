import type { NewReleaseData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Rocket } from "lucide-react";
import type { FC } from "react";

export const NewReleaseNotificationItem: FC<
  { data: NewReleaseData; } & NotificationItemProps
> = (props) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
    >
      <div className="shrink-0 mt-1">
        <Rocket className="h-5 w-5 text-purple-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            {props.data.title}
          </p>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {props.data.short_description ?? "New release available"}
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
