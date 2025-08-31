"use client";

import {
  useMarkNotificationsSeen,
  useUnseenNotifications,
} from "@/components/hooks/notifications/useNotifications";
import { NotificationsHandler } from "@/components/notifications/NotificationItem";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";
import { notificationPopoverOpenAtom } from "@/state/notifications";
import { useAtom } from "jotai";
import { Bell, X } from "lucide-react";
import type { FC } from "react";

export const NotificationPopover: FC = () => {
  const [isOpen, setIsOpen] = useAtom(notificationPopoverOpenAtom);

  const { data: notifications = [], isLoading } = useUnseenNotifications({
    limit: 20,
  });

  const markSeenMutation = useMarkNotificationsSeen();
  const unseenCount = notifications.length;

  const handleMarkAllSeen = () =>
    { markSeenMutation.mutate({
      notification_ids: notifications.map((n) => n.id),
    }); };

  return (
    <Popover modal={false} onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Notifications${unseenCount > 0 ? ` (${unseenCount} unread)` : ""}`}
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell
            className={cn(
              "h-5 w-5 hover:scale-125",
              unseenCount > 0 && "animate-bounce text-accent/90",
            )}
          />
          {unseenCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 text-accent text-xs font-medium rounded-full flex items-center justify-center",
                unseenCount > 0 && "animate-pulse",
              )}
            >
              {unseenCount > 99 ? "99+" : unseenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 border gradient-container"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg text-accent">Notifications</h3>
          <div className="flex items-center gap-2">
            {unseenCount > 0 && (
              <Button
                className="text-xs m-0 p-0 h-min"
                onClick={handleMarkAllSeen}
                variant="ghost"
              >
                Mark all read
              </Button>
            )}
            <Button
              className="h-8 w-8"
              onClick={() => { setIsOpen(false); }}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
            </div>
          ) : (notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 mb-2" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">
                We&apos;ll let you know when something happens!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <NotificationsHandler notifications={notifications} />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
