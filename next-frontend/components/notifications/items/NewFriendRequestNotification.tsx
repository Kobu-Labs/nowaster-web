import { FriendRequestApi } from "@/api";
import { NewFriendRequestData } from "@/api/definitions/models/notification";
import { useMarkNotificationsSeen } from "@/components/hooks/notifications/useNotifications";
import { NotificationItemProps } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/shadcn/button";
import { useToast } from "@/components/shadcn/use-toast";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { notificationPopoverOpenAtom } from "@/state/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useSetAtom } from "jotai";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const NewFriendRequestNotificationItem: FC<
  NotificationItemProps & { data: NewFriendRequestData }
> = (props) => {
  const setNotificationsOpen = useSetAtom(notificationPopoverOpenAtom);
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const markSeenMutation = useMarkNotificationsSeen();

  const updateFriendRequest = useMutation({
    mutationFn: async ({ status }: { status: "accepted" | "rejected" }) => {
      return await FriendRequestApi.update({
        request_id: props.data.request_id,
        status,
      });
    },
    onMutate: async () => {
      await markSeenMutation.mutateAsync({
        notification_ids: [props.notification.id],
      });
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["friends", "requests"],
      });

      if (variables.status === "accepted") {
        toast({
          title: "Friend request accepted",
          description: (
            <div className="flex items-center gap-2">
              <UserAvatar
                username={props.data.requestor.username}
                avatar_url={props.data.requestor.avatar_url}
              />
              <span>
                You are now friends with {props.data.requestor.username}
              </span>
            </div>
          ),
          variant: "default",
        });
      }
    },
  });

  return (
    <Link
      href={"/home/friends?tab=requests"}
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !props.notification.seen && "border-l-4 border-l-pink-400",
      )}
      onClick={() => {
        props.onClick?.();
        setNotificationsOpen(false);
      }}
    >
      <UserAvatar
        username={props.data.requestor.username}
        avatar_url={props.data.requestor.avatar_url}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            New friend request
          </p>
        </div>

        <div className="text-sm">
          <span className="text-accent/70">
            {props.data.requestor.username}
          </span>{" "}
          <span>wants to be your friend</span>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {props.data.message && `"${props.data.message.trim()}"`}
        </p>
        <div className="flex items-center justify-start gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50/10 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault(); // stops link navigation
              updateFriendRequest.mutate({
                status: "accepted",
              });
            }}
          >
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault(); // stops link navigation
              updateFriendRequest.mutate({
                status: "rejected",
              });
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
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
