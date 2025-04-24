import { FriendRequestApi } from "@/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { FriendRequest as FriendRequestType } from "@/api/definitions/models/friendship";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FC } from "react";
import { RelativeDate } from "@/components/ui-providers/RelativeDate";
import { Button } from "@/components/shadcn/button";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/shadcn/card";

type FriendRequestProps = {
  request: FriendRequestType;
  direction: "incoming" | "outgoing";
};

export const FriendRequest: FC<FriendRequestProps> = (props) => {
  const queryClient = useQueryClient();
  const subject =
    props.direction === "incoming"
      ? props.request.requestor
      : props.request.recipient;

  const updateFriendRequest = useMutation({
    mutationFn: async ({
      status,
    }: {
      status: "accepted" | "rejected" | "cancelled";
    }) => {
      const data = await FriendRequestApi.update({
        request_id: props.request.id,
        status,
      });
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends", "requests"],
      });
    },
  });
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-2">
        <Avatar>
          <AvatarImage src={"/placeholder.svg"} alt={subject.username} />
          <AvatarFallback>
            {subject.username
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{subject.username}</p>
          <RelativeDate date={props.request.created_at} />
        </div>
        {props.request.introduction_message && (
          <>
            <div className="grow"></div>
            <span className="text-muted-foreground justify-self-end item">
              {props.request.introduction_message}
            </span>
          </>
        )}
        <div className="grow"></div>
        {props.direction === "incoming" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50/10 hover:text-green-700"
              onClick={() =>
                updateFriendRequest.mutate({
                  status: "accepted",
                })
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                updateFriendRequest.mutate({
                  status: "rejected",
                })
              }
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </>
        )}
        {props.direction === "outgoing" && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() =>
              updateFriendRequest.mutate({
                status: "cancelled",
              })
            }
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
