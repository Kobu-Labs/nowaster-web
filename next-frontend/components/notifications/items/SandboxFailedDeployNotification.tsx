import type { SandboxFailedDeployData } from "@/api/definitions/models/notification";
import type { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

export const SandboxFailedDeployNotificationItem: FC<
  { data: SandboxFailedDeployData; } & NotificationItemProps
> = (props) => {
  return (
    <Link href="/home/admin/sandbox">
      <div className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50">
        <div className="shrink-0 mt-1">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-destructive">
            Sandbox deploy failed
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
            {props.data.sandbox_lifecycle_id}
          </p>
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
