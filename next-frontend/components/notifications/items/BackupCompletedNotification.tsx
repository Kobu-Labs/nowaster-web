import type { BackupCompletedData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { formatSizeValue } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

export const BackupCompletedNotificationItem: FC<
  { data: BackupCompletedData; } & NotificationItemProps
> = (props) => {
  const size = props.data.backup_size_bytes
    ? formatSizeValue(props.data.backup_size_bytes)
    : null;

  const duration = props.data.duration_seconds === null
    ? null
    : props.data.duration_seconds === undefined
      ? null
      : props.data.duration_seconds < 60
        ? `${props.data.duration_seconds}s`
        : `${Math.floor(props.data.duration_seconds / 60)}m ${props.data.duration_seconds % 60}s`;

  return (
    <Link href="/home/admin/backups">
      <div className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50">
        <div className="shrink-0 mt-1">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            Backup #
            {props.data.backup_id}
            {" "}
            completed
          </p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            {size && <span>{size}</span>}
            {duration && <span>{duration}</span>}
          </div>
          <p className="text-xs mt-2">
            {formatDistanceToNow(props.notification.created_at, {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
};
