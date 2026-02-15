import type { BackupFailedData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { formatDistanceToNow } from "date-fns";
import { XCircle } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

export const BackupFailedNotificationItem: FC<
  { data: BackupFailedData; } & NotificationItemProps
> = (props) => {
  return (
    <Link href="/home/admin/backups">
      <div className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50">
        <div className="shrink-0 mt-1">
          <XCircle className="h-5 w-5 text-destructive" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-destructive">
            Backup #
            {props.data.backup_id}
            {" "}
            failed
          </p>
          {props.data.error_message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {props.data.error_message}
            </p>
          )}
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
