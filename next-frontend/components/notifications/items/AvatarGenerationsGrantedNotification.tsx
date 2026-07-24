import type { AvatarGenerationsGrantedData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { notificationPopoverOpenAtom } from "@/state/notifications";
import { formatDistanceToNow } from "date-fns";
import { useSetAtom } from "jotai";
import Link from "next/link";
import type { FC } from "react";

export const AvatarGenerationsGrantedNotificationItem: FC<
  { data: AvatarGenerationsGrantedData; } & NotificationItemProps
> = (props) => {
  const setNotificationsOpen = useSetAtom(notificationPopoverOpenAtom);

  const admin
    = props.notification.source_type === "user"
      ? props.notification.source_data
      : null;
  const adminName = admin?.username ?? "An admin";

  return (
    <Link
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
      href="/home/settings/avatar"
      onClick={() => {
        setNotificationsOpen(false);
      }}
    >
      <UserAvatar
        avatar_url={admin?.avatarThumbUrl}
        username={adminName}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            Generations granted
          </p>
        </div>

        <div className="text-sm">
          <span className="text-accent/70">{adminName}</span>
          {" "}
          <span>
            granted you
            {" "}
            {props.data.amount}
            {" "}
            avatar generation
            {props.data.amount === 1 ? "" : "s"}
          </span>
        </div>

        <p className="text-xs mt-2">
          {formatDistanceToNow(props.notification.created_at, {
            addSuffix: true,
          })}
        </p>
      </div>
    </Link>
  );
};
