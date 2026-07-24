import type { CommunityInviteReceivedData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { notificationPopoverOpenAtom } from "@/state/notifications";
import { formatDistanceToNow } from "date-fns";
import { useSetAtom } from "jotai";
import Link from "next/link";
import type { FC } from "react";

export const CommunityInviteReceivedNotificationItem: FC<
  { data: CommunityInviteReceivedData; } & NotificationItemProps
> = (props) => {
  const setNotificationsOpen = useSetAtom(notificationPopoverOpenAtom);

  return (
    <Link
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
      href="/home/communities"
      onClick={() => setNotificationsOpen(false)}
    >
      <UserAvatar
        avatar_url={props.data.inviter.avatarThumbUrl}
        username={props.data.inviter.username}
      />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-white">
          Community invite
        </p>
        <div className="text-sm">
          <span className="text-accent/70">{props.data.inviter.username}</span>
          <span>
            {" "}
            invited you to join
            {" "}
            {props.data.community_name}
          </span>
        </div>
        <p className="text-xs mt-2">
          {formatDistanceToNow(props.notification.created_at, { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
};
