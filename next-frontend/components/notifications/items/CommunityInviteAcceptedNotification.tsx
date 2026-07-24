import type { CommunityInviteAcceptedData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { FC } from "react";

export const CommunityInviteAcceptedNotificationItem: FC<
  { data: CommunityInviteAcceptedData; } & NotificationItemProps
> = (props) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
    >
      <UserAvatar
        avatar_url={props.data.accepter.avatarThumbUrl}
        username={props.data.accepter.username}
      />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-white">
          Invite accepted
        </p>
        <div className="text-sm">
          <span className="text-accent/70">{props.data.accepter.username}</span>
          <span>
            {" "}
            joined
            {" "}
            {props.data.community_name}
          </span>
        </div>
        <p className="text-xs mt-2">
          {formatDistanceToNow(props.notification.created_at, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
