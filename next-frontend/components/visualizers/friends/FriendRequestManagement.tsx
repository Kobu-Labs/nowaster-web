"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Badge } from "@/components/shadcn/badge";
import { Check, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FriendRequestApi } from "@/api";
import { AddFriend } from "@/components/visualizers/friends/AddFriend";
import { formatDistanceToNow } from "date-fns";
import { RelativeDate } from "@/components/ui-providers/RelativeDate";

export const FriendRequests = () => {
  const incomingRequests = useQuery({
    queryKey: ["friends", "requests", "incoming"],
    queryFn: async () => {
      const data = await FriendRequestApi.read({ direction: "incoming" });
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
    initialData: [],
  });

  const outgoingRequests = useQuery({
    queryKey: ["friends", "requests", "outgoing"],
    queryFn: async () => {
      const data = await FriendRequestApi.read({ direction: "outgoing" });
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
    initialData: [],
  });

  const queryClient = useQueryClient();

  const updateFriendRequest = useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: "accepted" | "rejected" | "cancelled";
    }) => {
      const data = await FriendRequestApi.update({
        request_id: requestId,
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

  if (incomingRequests.isError || outgoingRequests.isError) {
    return <div>Error</div>;
  }

  return (
    <Tabs defaultValue="incoming" className="w-full">
      <AddFriend />
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="incoming">
          Incoming
          {incomingRequests.data.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {incomingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          Outgoing
          {outgoingRequests.data.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {outgoingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="space-y-4">
        {incomingRequests.data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No incoming friend requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.data.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center  gap-2">
                    <Avatar>
                      <AvatarImage
                        src={"/placeholder.svg"}
                        alt={request.requestor.username}
                      />
                      <AvatarFallback>
                        {request.requestor.username
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.requestor.username}
                      </p>
                      <RelativeDate date={request.created_at} />
                    </div>
                    {request.introduction_message && (
                      <>
                        <div className="grow"></div>
                        <span className="text-muted-foreground justify-self-end item">
                          {request.introduction_message}
                        </span>
                      </>
                    )}
                    <div className="grow"></div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50/10 hover:text-green-700"
                      onClick={() =>
                        updateFriendRequest.mutate({
                          requestId: request.id,
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
                          requestId: request.id,
                          status: "rejected",
                        })
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="outgoing" className="space-y-4">
        {outgoingRequests.data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No outgoing friend requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {outgoingRequests.data.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={"/placeholder.svg"}
                        alt={request.recipient.username}
                      />
                      <AvatarFallback>
                        {request.recipient.username
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.requestor.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(request.created_at, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {request.introduction_message && (
                      <>
                        <div className="grow"></div>
                        <span className="text-muted-foreground justify-self-end item">
                          {request.introduction_message}
                        </span>
                      </>
                    )}
                    <div className="grow"></div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        updateFriendRequest.mutate({
                          requestId: request.id,
                          status: "cancelled",
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
